import React, { useRef, useEffect } from 'react';
import { BoardSnapshot } from 'shared';
import { BOARD_WIDTH, BOARD_HEIGHT, BOARD_BUFFER } from '../engine/pieces';

const MINI_CELL = 12;

interface OpponentBoardProps {
  snapshot: BoardSnapshot | null;
  name: string;
}

export function OpponentBoard({ snapshot, name }: OpponentBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = BOARD_WIDTH * MINI_CELL;
    canvas.height = BOARD_HEIGHT * MINI_CELL;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    for (let c = 1; c < BOARD_WIDTH; c++) {
      ctx.beginPath();
      ctx.moveTo(c * MINI_CELL, 0);
      ctx.lineTo(c * MINI_CELL, canvas.height);
      ctx.stroke();
    }

    if (!snapshot) return;

    // Board
    for (let r = BOARD_BUFFER; r < snapshot.board.length; r++) {
      for (let c = 0; c < BOARD_WIDTH; c++) {
        if (snapshot.board[r][c]) {
          const displayRow = r - BOARD_BUFFER;
          const x = c * MINI_CELL;
          const y = displayRow * MINI_CELL;
          ctx.fillStyle = snapshot.board[r][c]!;
          ctx.beginPath();
          ctx.arc(x + MINI_CELL / 2, y + MINI_CELL / 2, MINI_CELL / 2 - 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Current piece
    if (snapshot.currentPiece) {
      const piece = snapshot.currentPiece;
      const color = snapshot.board[0]?.[0] || '#ffffff';
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c]) {
            const x = (piece.position.x + c) * MINI_CELL;
            const y = (piece.position.y + r - BOARD_BUFFER) * MINI_CELL;
            if (y >= 0) {
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(x + MINI_CELL / 2, y + MINI_CELL / 2, MINI_CELL / 2 - 1, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    }

    // Game over overlay
    if (snapshot.isGameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 16px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('K.O.', canvas.width / 2, canvas.height / 2);
    }

    // Border
    ctx.strokeStyle = 'rgba(100,150,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }, [snapshot]);

  return (
    <div className="opponent-container">
      <div className="opponent-name">{name}</div>
      <canvas ref={canvasRef} className="opponent-canvas" />
      {snapshot && (
        <div className="opponent-score">
          Score: {snapshot.score.toLocaleString()} | Lines: {snapshot.lines}
        </div>
      )}
    </div>
  );
}
