import React, { useCallback, useRef } from 'react';
import { GameAction } from '../engine/game';

interface TouchControlsProps {
  onAction: (action: GameAction) => void;
}

export function TouchControls({ onAction }: TouchControlsProps) {
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleStart = (action: GameAction) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault(); // Prevent scrolling/ghost clicks
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    onAction(action);

    // Auto-repeat for movement
    if (['left', 'right', 'down'].includes(action)) {
      timeoutRef.current = window.setTimeout(() => {
        intervalRef.current = window.setInterval(() => {
          onAction(action);
          if (window.navigator.vibrate) window.navigator.vibrate(5);
        }, 80);
      }, 200);
    }
  };

  const handleEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };


  return (
    <div className="touch-controls">
      <div className="d-pad">
        <button
          className="btn-control btn-up"
          onTouchStart={handleStart('rotate_cw')}
          onTouchEnd={handleEnd}
          onMouseDown={handleStart('rotate_cw')}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
        >
          ↻
        </button>
        <button
          className="btn-control btn-left"
          onTouchStart={handleStart('left')}
          onTouchEnd={handleEnd}
          onMouseDown={handleStart('left')}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
        >
          ←
        </button>
        <button
          className="btn-control btn-right"
          onTouchStart={handleStart('right')}
          onTouchEnd={handleEnd}
          onMouseDown={handleStart('right')}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
        >
          →
        </button>
        <button
          className="btn-control btn-down"
          onTouchStart={handleStart('down')}
          onTouchEnd={handleEnd}
          onMouseDown={handleStart('down')}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
        >
          ↓
        </button>
      </div>

      <div className="action-buttons">
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-control btn-action btn-hold"
            onTouchStart={handleStart('hold')}
            onTouchEnd={handleEnd}
            onMouseDown={handleStart('hold')}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
          >
            H
          </button>
          <button
            className="btn-control btn-action btn-rotate-ccw"
            onTouchStart={handleStart('rotate_ccw')}
            onTouchEnd={handleEnd}
            onMouseDown={handleStart('rotate_ccw')}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
          >
            ↺
          </button>
        </div>
        <button
          className="btn-control btn-action btn-drop"
          onTouchStart={handleStart('hard_drop')}
          onTouchEnd={handleEnd}
          onMouseDown={handleStart('hard_drop')}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
        >
          ⤓
        </button>
      </div>
    </div>
  );
}
