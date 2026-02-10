import React, { createContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  playerId: string | null;
  playerName: string;
  setPlayerName: (name: string) => void;
  connect: () => void;
  disconnect: () => void;
}

export const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('tetris_player_name') || `Player${Math.floor(Math.random() * 9999)}`;
  });

  const connect = useCallback(() => {
    if (socket?.connected) return;

    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
    const newSocket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      setPlayerId(newSocket.id ?? null);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      setPlayerId(null);
    });

    setSocket(newSocket);
  }, [socket]);

  const disconnect = useCallback(() => {
    socket?.disconnect();
    setSocket(null);
    setConnected(false);
    setPlayerId(null);
  }, [socket]);

  useEffect(() => {
    localStorage.setItem('tetris_player_name', playerName);
  }, [playerName]);

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{
      socket, connected, playerId, playerName, setPlayerName, connect, disconnect
    }}>
      {children}
    </SocketContext.Provider>
  );
}
