import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TetrisGame, LineClearEvent } from '../engine/game';
import { TetrisBoard, PiecePreview } from './TetrisBoard';
import { OpponentBoard } from './OpponentBoard';
import { ChatPanel } from './ChatPanel';
import { TouchControls } from './TouchControls';
import { BoardSnapshot, ChatMessage } from 'shared';
import '../styles/game.css';

interface GameScreenProps {
  mode: 'solo' | 'multiplayer';
  seed?: number;
  opponentSnapshot?: BoardSnapshot | null;
  opponentName?: string;
  chatMessages?: ChatMessage[];
  onChatSend?: (text: string) => void;
  onGarbageSend?: (lines: number) => void;
  onGameOver?: () => void;
  onBoardUpdate?: (snapshot: BoardSnapshot) => void;
  onBack?: () => void;
  countdown?: number | null;
  gameResult?: { won: boolean; message: string } | null;
}

export function GameScreen({
  mode,
  seed,
  opponentSnapshot,
  opponentName = 'Opponent',
  chatMessages = [],
  onChatSend,
  onGarbageSend,
  onGameOver,
  onBoardUpdate,
  onBack,
  countdown,
  gameResult,
}: GameScreenProps) {
  const [game, setGame] = useState<TetrisGame | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [isChatFocused, setIsChatFocused] = useState(false);
  const boardUpdateIntervalRef = useRef<number>();

  useEffect(() => {
    const newGame = new TetrisGame(seed);
    setGame(newGame);
    return () => {
      if (boardUpdateIntervalRef.current) {
        clearInterval(boardUpdateIntervalRef.current);
      }
    };
  }, [seed]);

  // Periodic board state update for multiplayer
  useEffect(() => {
    if (mode !== 'multiplayer' || !game || !onBoardUpdate) return;

    boardUpdateIntervalRef.current = window.setInterval(() => {
      if (game.state.isGameOver) return;
      onBoardUpdate({
        board: game.state.board,
        currentPiece: game.state.currentPiece,
        score: game.state.score,
        lines: game.state.lines,
        garbageQueue: game.state.garbageQueue,
        isGameOver: game.state.isGameOver,
      });
    }, 100);

    return () => {
      if (boardUpdateIntervalRef.current) {
        clearInterval(boardUpdateIntervalRef.current);
      }
    };
  }, [mode, game, onBoardUpdate]);

  // Update UI state periodically
  useEffect(() => {
    if (!game) return;
    const interval = setInterval(() => {
      setScore(game.state.score);
      setLevel(game.state.level);
      setLines(game.state.lines);
    }, 50);
    return () => clearInterval(interval);
  }, [game]);

  const handleLineClear = useCallback((event: LineClearEvent) => {
    // Score updates happen in game engine
  }, []);

  const handleGameOver = useCallback(() => {
    onGameOver?.();
  }, [onGameOver]);

  const handleGarbageSend = useCallback((garbageLines: number) => {
    onGarbageSend?.(garbageLines);
  }, [onGarbageSend]);

  const handleRestart = useCallback(() => {
    const newGame = new TetrisGame(mode === 'solo' ? undefined : seed);
    setGame(newGame);
    setScore(0);
    setLevel(1);
    setLines(0);
  }, [mode, seed]);

  if (!game) return null;

  const isPaused = countdown != null && countdown > 0;

  return (
    <div className="game-screen">
      <div className="game-container">
        {/* Left panel: Hold + Score + (Opponent or Controls) */}
        <div className="side-panel">
          <div className="panel hold-panel">
            <div className="panel-title">Hold</div>
            <div className={`hold-display ${!game.state.canHold ? 'hold-disabled' : ''}`}>
              {game.state.holdPiece && (
                <PiecePreview type={game.state.holdPiece} dimmed={!game.state.canHold} />
              )}
            </div>
          </div>

          <div className="panel score-panel">
            <div className="panel-title">Score</div>
            <div className="score-value">{score.toLocaleString()}</div>
            <div className="score-details">
              <div className="score-row">
                <span className="score-label">Level</span>
                <span className="score-number">{level}</span>
              </div>
              <div className="score-row">
                <span className="score-label">Lines</span>
                <span className="score-number">{lines}</span>
              </div>
            </div>
          </div>

          {/* Multiplayer: Opponent board in left panel */}
          {mode === 'multiplayer' && (
            <OpponentBoard snapshot={opponentSnapshot ?? null} name={opponentName} />
          )}

          {/* Solo: Key guide */}
          {mode === 'solo' && (
            <div className="panel key-guide">
              <div className="panel-title">Controls</div>
              <div className="key-guide-row">
                <span className="key-name">Move</span>
                <span className="key-value">← →</span>
              </div>
              <div className="key-guide-row">
                <span className="key-name">Soft Drop</span>
                <span className="key-value">↓</span>
              </div>
              <div className="key-guide-row">
                <span className="key-name">Hard Drop</span>
                <span className="key-value">Space</span>
              </div>
              <div className="key-guide-row">
                <span className="key-name">Rotate</span>
                <span className="key-value">↑ / X / Z</span>
              </div>
              <div className="key-guide-row">
                <span className="key-name">Hold</span>
                <span className="key-value">C / Shift</span>
              </div>
            </div>
          )}
        </div>

        {/* Board */}
        <div className="board-wrapper">
          <TetrisBoard
            game={game}
            isPaused={isPaused}
            isChatFocused={isChatFocused}
            onLineClear={handleLineClear}
            onGameOver={handleGameOver}
            onGarbageSend={handleGarbageSend}
          />

          {/* Countdown */}
          {isPaused && countdown != null && (
            <div className="countdown-overlay">
              <div className="countdown-text">
                {countdown === 0 ? 'GO!' : countdown}
              </div>
            </div>
          )}
        </div>

        {/* Right panel: Next + Chat + Solo buttons */}
        <div className="side-panel side-panel-right">
          <div className="panel next-panel">
            <div className="panel-title">Next</div>
            <div className="next-list">
              {game.state.nextPieces.slice(0, 5).map((type, i) => (
                <div key={i} className="next-item">
                  <PiecePreview type={type} size={i === 0 ? 18 : 14} />
                </div>
              ))}
            </div>
          </div>

          {/* Chat (multiplayer) - below Next panel */}
          {mode === 'multiplayer' && onChatSend && (
            <ChatPanel
              messages={chatMessages}
              onSend={onChatSend}
              onFocusChange={setIsChatFocused}
            />
          )}

          {/* Solo restart button */}
          {mode === 'solo' && game.state.isGameOver && (
            <div className="solo-actions">
              <button className="btn btn-primary" onClick={handleRestart}>
                Restart
              </button>
              <button className="btn btn-secondary" onClick={onBack}>
                Menu
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Result overlay */}
      {gameResult && (
        <div className="result-overlay">
          <div className="result-card">
            <div className={`result-title ${gameResult.won ? 'win' : 'lose'}`}>
              {gameResult.won ? 'WIN!' : 'LOSE'}
            </div>
            <div className="result-details">{gameResult.message}</div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={onBack}>
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      <TouchControls onAction={game.update.bind(game)} />
    </div>
  );
}
