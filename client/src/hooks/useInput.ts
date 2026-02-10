import { useEffect, useRef, useCallback } from 'react';
import { TetrisGame, GameAction } from '../engine/game';

const DAS_DELAY = 167; // ms before auto-repeat starts
const ARR_INTERVAL = 33; // ms between auto-repeat moves

interface KeyMap {
  [key: string]: GameAction;
}

const DEFAULT_KEYMAP: KeyMap = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowDown: 'down',
  ArrowUp: 'rotate_cw',
  z: 'rotate_ccw',
  x: 'rotate_cw',
  ' ': 'hard_drop',
  c: 'hold',
  Shift: 'hold',
};

interface UseInputOptions {
  game: TetrisGame | null;
  enabled: boolean;
  onAction?: (action: GameAction) => void;
}

export function useInput({ game, enabled, onAction }: UseInputOptions) {
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const dasTimerRef = useRef<Record<string, number>>({});
  const arrTimerRef = useRef<Record<string, number>>({});
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const executeAction = useCallback((action: GameAction) => {
    if (!game || game.state.isGameOver) return;
    game.update(action);
    onAction?.(action);
  }, [game, onAction]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const action = DEFAULT_KEYMAP[e.key];
      if (!action) return;

      e.preventDefault();
      pressedKeysRef.current.add(e.key);
      executeAction(action);
      dasTimerRef.current[e.key] = 0;
      arrTimerRef.current[e.key] = 0;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeysRef.current.delete(e.key);
      delete dasTimerRef.current[e.key];
      delete arrTimerRef.current[e.key];
    };

    // DAS/ARR loop
    const dasLoop = (timestamp: number) => {
      const dt = lastTimeRef.current ? timestamp - lastTimeRef.current : 16;
      lastTimeRef.current = timestamp;

      for (const key of pressedKeysRef.current) {
        const action = DEFAULT_KEYMAP[key];
        if (!action || action === 'hard_drop' || action === 'hold' ||
            action === 'rotate_cw' || action === 'rotate_ccw') continue;

        if (dasTimerRef.current[key] !== undefined) {
          dasTimerRef.current[key] += dt;
          if (dasTimerRef.current[key] >= DAS_DELAY) {
            arrTimerRef.current[key] += dt;
            if (arrTimerRef.current[key] >= ARR_INTERVAL) {
              executeAction(action);
              arrTimerRef.current[key] = 0;
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(dasLoop);
    };

    animFrameRef.current = requestAnimationFrame(dasLoop);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animFrameRef.current);
      pressedKeysRef.current.clear();
      lastTimeRef.current = 0;
    };
  }, [enabled, executeAction]);
}
