import React, { useEffect, useRef, useState } from 'react';
import { PIECE_COLORS } from '../engine/pieces';
import '../styles/menu.css';

interface MainMenuProps {
  playerName: string;
  onNameChange: (name: string) => void;
  onSoloPractice: () => void;
  onQuickMatch: () => void;
  onCreateRoom: () => void;
}

// Falling background tetromino shapes
const BG_SHAPES = [
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[1,1,0],[0,1,1]],
  [[0,1,1],[1,1,0]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
];

interface FallingPiece {
  id: number;
  x: number;
  y: number;
  shapeIdx: number;
  colorIdx: number;
  duration: number;
  delay: number;
  rotation: number;
}

export function MainMenu({
  playerName,
  onNameChange,
  onSoloPractice,
  onQuickMatch,
  onCreateRoom,
}: MainMenuProps) {
  const [fallingPieces, setFallingPieces] = useState<FallingPiece[]>([]);
  const colors = Object.values(PIECE_COLORS);

  useEffect(() => {
    const pieces: FallingPiece[] = [];
    for (let i = 0; i < 15; i++) {
      pieces.push({
        id: i,
        x: Math.random() * 100,
        y: -10,
        shapeIdx: Math.floor(Math.random() * BG_SHAPES.length),
        colorIdx: Math.floor(Math.random() * colors.length),
        duration: 8 + Math.random() * 12,
        delay: Math.random() * 10,
        rotation: Math.random() * 360,
      });
    }
    setFallingPieces(pieces);
  }, []);

  return (
    <div className="main-menu">
      {/* Falling background pieces */}
      <div className="bg-pieces">
        {fallingPieces.map((p) => (
          <div
            key={p.id}
            className="bg-piece"
            style={{
              left: `${p.x}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              color: colors[p.colorIdx],
              fontSize: '40px',
            }}
          >
            {renderShapeSVG(BG_SHAPES[p.shapeIdx], colors[p.colorIdx])}
          </div>
        ))}
      </div>

      <div className="menu-title">
        <h1>TETRIS BATTLE</h1>
        <p>Online Multiplayer</p>
      </div>

      <div className="name-input-container">
        <label>Player Name</label>
        <input
          className="input"
          type="text"
          value={playerName}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={16}
          placeholder="이름을 입력하세요"
        />
      </div>

      <div className="menu-buttons">
        <button className="btn btn-primary" onClick={onSoloPractice}>
          Solo Practice
        </button>
        <button className="btn btn-accent" onClick={onQuickMatch}>
          Quick Match
        </button>
        <button className="btn btn-secondary" onClick={onCreateRoom}>
          Create Room
        </button>
      </div>
    </div>
  );
}

function renderShapeSVG(shape: number[][], color: string): React.ReactElement {
  const rows = shape.length;
  const cols = shape[0].length;
  const cellSize = 12;
  return (
    <svg width={cols * cellSize} height={rows * cellSize}>
      {shape.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize - 1}
              height={cellSize - 1}
              rx={3}
              fill={color}
              opacity={0.6}
            />
          ) : null
        )
      )}
    </svg>
  );
}
