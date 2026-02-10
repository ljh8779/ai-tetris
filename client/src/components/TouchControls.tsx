import React, { useCallback, useRef } from 'react';
import { GameAction } from '../engine/game';

interface TouchControlsProps {
  onAction: (action: GameAction) => void;
}

export function TouchControls({ onAction }: TouchControlsProps) {
  // Simple press handler
  const handlePress = useCallback((action: GameAction) => {
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    onAction(action);
  }, [onAction]);

  // Long press handler for auto-repeat (movement)
  const intervalRef = useRef<number | null>(null);

  const startRepeat = useCallback((action: GameAction) => {
    handlePress(action);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Initial delay then repeat
    setTimeout(() => {
        if (intervalRef.current) return; // Prevent double firing if released
        intervalRef.current = window.setInterval(() => {
            handlePress(action);
        }, 100);
    }, 200);

    // Cleaner interval handling:
    // Actually, setTimeout inside mousedown/touchstart is tricky for clear.
    // Let's settle for simple repeat interval for now.
    
    // Clear any existing
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    
    // Immediate action
    // handlePress(action); // Already called above

    // Start repeating after delay
    const id = window.setTimeout(() => {
       intervalRef.current = window.setInterval(() => {
           onAction(action);
           if (window.navigator.vibrate) window.navigator.vibrate(5);
       }, 80);
    }, 150);
    
    // Store timer ID (casting to number for compatibility)
    intervalRef.current = id as unknown as number;

  }, [handlePress, onAction]);

  const stopRepeat = useCallback(() => {
      // This is a bit messy with the timeout/interval mix. 
      // Let's refine the repeat logic to be simpler for this iteration.
      if (intervalRef.current) {
          clearTimeout(intervalRef.current);
          clearInterval(intervalRef.current);
          intervalRef.current = null;
      }
  }, []);

  // Simplified robust repeat logic
  const handleTouchStart = (action: GameAction) => (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault(); // Prevent ghost clicks
      handlePress(action);
      
      if (action === 'left' || action === 'right' || action === 'down') {
          stopRepeat();
          intervalRef.current = window.setTimeout(() => {
              intervalRef.current = window.setInterval(() => {
                  onAction(action);
                  if (navigator.vibrate) navigator.vibrate(5);
              }, 80);
          }, 160);
      }
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      stopRepeat();
  };

  return (
    <div className="touch-controls">
      <div className="d-pad">
        <button
          className="btn-control btn-up"
          onTouchStart={handleTouchStart('rotate_cw')}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart('rotate_cw')}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        >
          ↻
        </button>
        <button
          className="btn-control btn-left"
          onTouchStart={handleTouchStart('left')}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart('left')}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        >
          ←
        </button>
        <button
          className="btn-control btn-right"
          onTouchStart={handleTouchStart('right')}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart('right')}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        >
          →
        </button>
        <button
          className="btn-control btn-down"
          onTouchStart={handleTouchStart('down')}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart('down')}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        >
          ↓
        </button>
      </div>

      <div className="action-buttons">
        <button
          className="btn-control btn-action btn-hold"
          onTouchStart={handleTouchStart('hold')}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart('hold')}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        >
          H
        </button>
        <button
          className="btn-control btn-action btn-drop"
          onTouchStart={handleTouchStart('hard_drop')}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart('hard_drop')}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        >
          ⤓
        </button>
         <button
          className="btn-control btn-action btn-rotate-ccw"
           onTouchStart={handleTouchStart('rotate_ccw')}
           onTouchEnd={handleTouchEnd}
           onMouseDown={handleTouchStart('rotate_ccw')}
           onMouseUp={handleTouchEnd}
           onMouseLeave={handleTouchEnd}
        >
          ↺
        </button>
      </div>
    </div>
  );
}
