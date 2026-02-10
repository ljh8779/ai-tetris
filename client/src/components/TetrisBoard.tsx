import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TetrisGame, LineClearEvent } from '../engine/game';
import { TetrisRenderer, CELL_SIZE } from '../engine/renderer';
import { PIECE_COLORS, PIECE_SHAPES, BOARD_WIDTH, BOARD_HEIGHT, BOARD_BUFFER } from '../engine/pieces';
import { useGameLoop } from '../hooks/useGameLoop';
import { useInput } from '../hooks/useInput';
import { PieceType } from 'shared';
import '../styles/game.css';

interface TetrisBoardProps {
  game: TetrisGame | null;
  isPaused?: boolean;
  isChatFocused?: boolean;
  onLineClear?: (event: LineClearEvent) => void;
  onGameOver?: () => void;
  onGarbageSend?: (lines: number) => void;
}

export function TetrisBoard({
  game,
  isPaused = false,
  isChatFocused = false,
  onLineClear,
  onGameOver,
  onGarbageSend,
}: TetrisBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderer, setRenderer] = useState<TetrisRenderer | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      setRenderer(new TetrisRenderer(canvasRef.current));
    }
  }, []);

  useGameLoop({
    game,
    renderer,
    isPaused: isPaused || isChatFocused,
    onLineClear,
    onGameOver,
    onGarbageSend,
  });

  useInput({
    game,
    enabled: !isPaused && !isChatFocused && !!game,
  });

  const garbageHeight = game
    ? Math.min(100, (game.state.garbageQueue / 20) * 100)
    : 0;

  return (
    <div className="board-container">
      <canvas ref={canvasRef} className="board-canvas" />
      <div className="garbage-meter">
        <div
          className="garbage-fill"
          style={{ height: `${garbageHeight}%` }}
        />
      </div>
      {game?.state.isGameOver && (
        <div className="gameover-overlay">
          <div className="gameover-text">GAME OVER</div>
          <div className="gameover-score">
            Score: {game.state.score.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

// Mini piece preview renderer
export function PiecePreview({
  type,
  size = 18,
  dimmed = false,
}: {
  type: PieceType;
  size?: number;
  dimmed?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const shape = PIECE_SHAPES[type][0];
    const rows = shape.length;
    const cols = shape[0].length;
    canvas.width = cols * size;
    canvas.height = rows * size;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (dimmed) ctx.globalAlpha = 0.4;

    const color = PIECE_COLORS[type];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (shape[r][c]) {
          const x = c * size;
          const y = r * size;
          const s = size - 1;
          const rad = Math.max(2, size * 0.2);

          // Gradient
          const gradient = ctx.createRadialGradient(
            x + s * 0.35, y + s * 0.35, s * 0.1,
            x + s * 0.5, y + s * 0.5, s * 0.7
          );
          gradient.addColorStop(0, lighten(color, 60));
          gradient.addColorStop(0.5, color);
          gradient.addColorStop(1, darken(color, 40));

          ctx.beginPath();
          roundRect(ctx, x + 0.5, y + 0.5, s, s, rad);
          ctx.fillStyle = gradient;
          ctx.fill();

          // Shine
          const shine = ctx.createRadialGradient(
            x + s * 0.3, y + s * 0.25, 1,
            x + s * 0.3, y + s * 0.3, s * 0.4
          );
          shine.addColorStop(0, 'rgba(255,255,255,0.5)');
          shine.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = shine;
          ctx.beginPath();
          roundRect(ctx, x + 0.5, y + 0.5, s, s, rad);
          ctx.fill();
        }
      }
    }
  }, [type, size, dimmed]);

  return <canvas ref={canvasRef} />;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}

function darken(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - amt);
  const g = Math.max(0, ((n >> 8) & 0xff) - amt);
  const b = Math.max(0, (n & 0xff) - amt);
  return `rgb(${r},${g},${b})`;
}
