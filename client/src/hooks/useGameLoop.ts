import { useRef, useEffect } from 'react';
import { TetrisGame, LineClearEvent } from '../engine/game';
import { TetrisRenderer } from '../engine/renderer';

interface UseGameLoopOptions {
  game: TetrisGame | null;
  renderer: TetrisRenderer | null;
  isPaused: boolean;
  onLineClear?: (event: LineClearEvent) => void;
  onGameOver?: () => void;
  onGarbageSend?: (lines: number) => void;
}

export function useGameLoop({
  game,
  renderer,
  isPaused,
  onLineClear,
  onGameOver,
  onGarbageSend,
}: UseGameLoopOptions) {
  const lastTimeRef = useRef<number>(0);
  const gravityTimerRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!game) return;

    game.onLineClear = (event) => {
      if (renderer) {
        for (const row of event.rows) {
          const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
          renderer.addParticles(row, colors[Math.floor(Math.random() * colors.length)], 25);
        }
        renderer.startLineClearAnimation(event.rows);
        if (event.label) {
          const color = event.isTSpin ? '#FF44FF' :
                       event.isPerfectClear ? '#FFD700' :
                       event.lines >= 4 ? '#00FFFF' : '#FFFFFF';
          renderer.addTextOverlay(event.label, color, event.lines >= 4 ? 28 : 22);
        }
        if (event.lines >= 2) {
          renderer.triggerScreenShake(event.lines * 3, 300);
        }
      }
      onLineClear?.(event);
    };

    game.onGameOver = () => {
      onGameOver?.();
    };

    game.onGarbageSend = (lines) => {
      onGarbageSend?.(lines);
    };
  }, [game, renderer, onLineClear, onGameOver, onGarbageSend]);

  useEffect(() => {
    if (!game || !renderer || isPaused) return;

    const loop = (timestamp: number) => {
      const deltaTime = lastTimeRef.current ? timestamp - lastTimeRef.current : 16;
      lastTimeRef.current = timestamp;

      if (!game.state.isGameOver && game.state.currentPiece) {
        // Gravity tick
        gravityTimerRef.current += deltaTime;
        const interval = game.getDropInterval();
        if (gravityTimerRef.current >= interval) {
          game.update('tick', gravityTimerRef.current);
          gravityTimerRef.current = 0;
        } else {
          // Even when gravity hasn't triggered, process lock delay
          game.processLockDelay(deltaTime);
        }
      }

      // Render
      renderer.render(
        game.state.board,
        game.state.currentPiece,
        game.getGhostPiece(),
        deltaTime
      );

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = 0;
      gravityTimerRef.current = 0;
    };
  }, [game, renderer, isPaused]);
}
