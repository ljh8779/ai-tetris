import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MainMenu } from './components/MainMenu';
import { Lobby } from './components/Lobby';
import { GameScreen } from './components/GameScreen';
import { useSocket } from './hooks/useSocket';
import { BoardSnapshot, ChatMessage, PlayerInfo } from 'shared';
import { GAME_EVENTS, CHAT_EVENTS } from 'shared';

type Screen = 'menu' | 'lobby' | 'game';

export function App() {
  const { socket, connected, playerId, playerName, setPlayerName, connect, disconnect } = useSocket();
  const [screen, setScreen] = useState<Screen>('menu');
  const [lobbyMode, setLobbyMode] = useState<'quickmatch' | 'create'>('quickmatch');
  const [gameMode, setGameMode] = useState<'solo' | 'multiplayer'>('solo');
  const [gameSeed, setGameSeed] = useState<number | undefined>();
  const [opponentSnapshot, setOpponentSnapshot] = useState<BoardSnapshot | null>(null);
  const [opponentName, setOpponentName] = useState('Opponent');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<{ won: boolean; message: string } | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  // Socket event listeners for game
  useEffect(() => {
    if (!socket || gameMode !== 'multiplayer') return;

    socket.on(GAME_EVENTS.BOARD, (data: { playerId: string; snapshot: BoardSnapshot }) => {
      if (data.playerId !== playerId) {
        setOpponentSnapshot(data.snapshot);
      }
    });

    socket.on(GAME_EVENTS.COUNTDOWN, (count: number) => {
      setCountdown(count);
      if (count === 0) {
        setTimeout(() => setCountdown(null), 1000);
      }
    });

    socket.on(GAME_EVENTS.GARBAGE_RECEIVE, (data: { lines: number }) => {
      // Handled via game instance callback
    });

    socket.on(GAME_EVENTS.RESULT, (result: { winnerId: string; scores: Record<string, number> }) => {
      const won = result.winnerId === playerId;
      setGameResult({
        won,
        message: won
          ? `Score: ${result.scores[playerId!]?.toLocaleString() ?? 0}`
          : `Opponent wins!`,
      });
    });

    socket.on(CHAT_EVENTS.MESSAGE, (msg: ChatMessage) => {
      setChatMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.off(GAME_EVENTS.BOARD);
      socket.off(GAME_EVENTS.COUNTDOWN);
      socket.off(GAME_EVENTS.GARBAGE_RECEIVE);
      socket.off(GAME_EVENTS.RESULT);
      socket.off(CHAT_EVENTS.MESSAGE);
    };
  }, [socket, gameMode, playerId]);

  const handleSoloPractice = useCallback(() => {
    setGameMode('solo');
    setGameSeed(undefined);
    setGameResult(null);
    setScreen('game');
  }, []);

  const handleQuickMatch = useCallback(() => {
    setLobbyMode('quickmatch');
    setScreen('lobby');
    if (!connected) connect();
  }, [connected, connect]);

  const handleCreateRoom = useCallback(() => {
    setLobbyMode('create');
    setScreen('lobby');
    if (!connected) connect();
  }, [connected, connect]);

  const handleGameStart = useCallback((newRoomId: string, seed: number, players: PlayerInfo[]) => {
    setRoomId(newRoomId);
    setGameMode('multiplayer');
    setGameSeed(seed);
    setGameResult(null);
    setOpponentSnapshot(null);
    setChatMessages([]);
    setCountdown(3);

    const opponent = players.find(p => p.id !== playerId);
    if (opponent) setOpponentName(opponent.name);

    setScreen('game');
  }, [playerId]);

  const handleBoardUpdate = useCallback((snapshot: BoardSnapshot) => {
    if (socket && roomId) {
      socket.emit(GAME_EVENTS.BOARD, { roomId, snapshot });
    }
  }, [socket, roomId]);

  const handleGarbageSend = useCallback((lines: number) => {
    if (socket && roomId) {
      socket.emit(GAME_EVENTS.GARBAGE_SEND, { roomId, lines });
    }
  }, [socket, roomId]);

  const handleGameOver = useCallback(() => {
    if (socket && roomId) {
      socket.emit(GAME_EVENTS.OVER, { roomId });
    }
  }, [socket, roomId]);

  const handleChatSend = useCallback((text: string) => {
    if (socket && roomId) {
      socket.emit(CHAT_EVENTS.MESSAGE, { roomId, text, senderName: playerName });
    }
  }, [socket, roomId, playerName]);

  const handleBack = useCallback(() => {
    setScreen('menu');
    setGameResult(null);
    setRoomId(null);
    setCountdown(null);
  }, []);

  switch (screen) {
    case 'menu':
      return (
        <MainMenu
          playerName={playerName}
          onNameChange={setPlayerName}
          onSoloPractice={handleSoloPractice}
          onQuickMatch={handleQuickMatch}
          onCreateRoom={handleCreateRoom}
        />
      );

    case 'lobby':
      return (
        <Lobby
          mode={lobbyMode}
          onGameStart={handleGameStart}
          onBack={handleBack}
        />
      );

    case 'game':
      return (
        <GameScreen
          mode={gameMode}
          seed={gameSeed}
          opponentSnapshot={opponentSnapshot}
          opponentName={opponentName}
          chatMessages={chatMessages}
          onChatSend={gameMode === 'multiplayer' ? handleChatSend : undefined}
          onGarbageSend={gameMode === 'multiplayer' ? handleGarbageSend : undefined}
          onGameOver={gameMode === 'multiplayer' ? handleGameOver : undefined}
          onBoardUpdate={gameMode === 'multiplayer' ? handleBoardUpdate : undefined}
          onBack={handleBack}
          countdown={countdown}
          gameResult={gameResult}
        />
      );
  }
}
