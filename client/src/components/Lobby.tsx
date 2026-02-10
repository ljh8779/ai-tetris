import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { ROOM_EVENTS, MATCHMAKING_EVENTS, LOBBY_EVENTS } from 'shared';
import { LobbyRoom, RoomState, PlayerInfo } from 'shared';
import '../styles/menu.css';

interface LobbyProps {
  onGameStart: (roomId: string, seed: number, players: PlayerInfo[]) => void;
  onBack: () => void;
  mode: 'quickmatch' | 'create';
}

export function Lobby({ onGameStart, onBack, mode }: LobbyProps) {
  const { socket, connected, playerName, connect } = useSocket();
  const [rooms, setRooms] = useState<LobbyRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<RoomState | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connected) connect();
  }, [connected, connect]);

  useEffect(() => {
    if (!socket) return;

    // Join lobby
    socket.emit(LOBBY_EVENTS.JOIN, { name: playerName });

    // Room state updates
    socket.on(ROOM_EVENTS.STATE, (state: RoomState) => {
      setCurrentRoom(state);
      if (state.status === 'countdown' || state.status === 'playing') {
        // Game starting
      }
    });

    socket.on(ROOM_EVENTS.ERROR, (msg: string) => {
      setError(msg);
      setTimeout(() => setError(null), 3000);
    });

    // Lobby state
    socket.on(LOBBY_EVENTS.STATE, (lobbyRooms: LobbyRoom[]) => {
      setRooms(lobbyRooms);
    });

    // Match found
    socket.on(MATCHMAKING_EVENTS.MATCH_FOUND, (state: RoomState) => {
      setCurrentRoom(state);
      setIsSearching(false);
    });

    // Game start
    socket.on('game:start', (data: { roomId: string; seed: number; players: PlayerInfo[] }) => {
      onGameStart(data.roomId, data.seed, data.players);
    });

    return () => {
      socket.off(ROOM_EVENTS.STATE);
      socket.off(ROOM_EVENTS.ERROR);
      socket.off(LOBBY_EVENTS.STATE);
      socket.off(MATCHMAKING_EVENTS.MATCH_FOUND);
      socket.off('game:start');
    };
  }, [socket, playerName, onGameStart]);

  // Auto-action based on mode
  useEffect(() => {
    if (!socket || !connected) return;

    if (mode === 'quickmatch' && !currentRoom) {
      socket.emit(MATCHMAKING_EVENTS.QUEUE_JOIN, { name: playerName });
      setIsSearching(true);
    } else if (mode === 'create' && !currentRoom) {
      socket.emit(ROOM_EVENTS.CREATE, { name: playerName });
    }
  }, [socket, connected, mode, currentRoom, playerName]);

  const handleReady = useCallback(() => {
    if (!socket || !currentRoom) return;
    const newReady = !isReady;
    socket.emit(ROOM_EVENTS.READY, { roomId: currentRoom.id, ready: newReady });
    setIsReady(newReady);
  }, [socket, currentRoom, isReady]);

  const handleLeave = useCallback(() => {
    if (socket && currentRoom) {
      socket.emit(ROOM_EVENTS.LEAVE, { roomId: currentRoom.id });
    }
    if (isSearching && socket) {
      socket.emit(MATCHMAKING_EVENTS.QUEUE_LEAVE);
    }
    setCurrentRoom(null);
    setIsReady(false);
    setIsSearching(false);
    onBack();
  }, [socket, currentRoom, isSearching, onBack]);

  const handleJoinRoom = useCallback((roomId: string) => {
    if (!socket) return;
    socket.emit(ROOM_EVENTS.JOIN, { roomId, name: playerName });
  }, [socket, playerName]);

  // Searching screen
  if (isSearching && !currentRoom) {
    return (
      <div className="waiting-room">
        <h2>Finding Match...</h2>
        <div style={{ color: 'var(--text-secondary)', animation: 'pulse 1.5s infinite' }}>
          Searching for opponent...
        </div>
        <button className="btn btn-secondary" onClick={handleLeave}>
          Cancel
        </button>
      </div>
    );
  }

  // Waiting room
  if (currentRoom) {
    return (
      <div className="waiting-room">
        <h2>Room: {currentRoom.id.slice(0, 8)}</h2>

        {error && (
          <div style={{ color: '#ff4444', fontSize: '14px' }}>{error}</div>
        )}

        <div className="player-list">
          {[0, 1].map((slot) => {
            const player = currentRoom.players[slot];
            return (
              <div key={slot} className={`player-slot ${player?.ready ? 'ready' : ''}`}>
                {player ? (
                  <>
                    <div className="player-avatar">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="player-name">{player.name}</div>
                    <div className={`player-ready-status ${player.ready ? 'ready' : 'not-ready'}`}>
                      {player.ready ? 'READY' : 'NOT READY'}
                    </div>
                  </>
                ) : (
                  <div className="empty-slot">Waiting for player...</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="waiting-actions">
          <button
            className={`btn ${isReady ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleReady}
          >
            {isReady ? 'Cancel Ready' : 'Ready!'}
          </button>
          <button className="btn btn-secondary" onClick={handleLeave}>
            Leave
          </button>
        </div>
      </div>
    );
  }

  // Room list (create mode shows room list too)
  return (
    <div className="lobby">
      <div className="lobby-header">
        <h2>Lobby</h2>
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
      </div>

      {error && (
        <div style={{ color: '#ff4444', fontSize: '14px' }}>{error}</div>
      )}

      <div className="lobby-content">
        {rooms.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
            No rooms available. Your room is being created...
          </div>
        ) : (
          <div className="room-list">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="room-item"
                onClick={() => handleJoinRoom(room.id)}
              >
                <div className="room-info">
                  <div className="room-name">Room {room.id.slice(0, 8)}</div>
                  <div className="room-players">
                    {room.playerCount}/{room.maxPlayers} players
                  </div>
                </div>
                <span className={`room-status ${room.status}`}>
                  {room.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
