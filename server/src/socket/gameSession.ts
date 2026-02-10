import { Server } from 'socket.io';
import { PlayerInfo } from 'shared';

interface GameSession {
  roomId: string;
  players: PlayerInfo[];
  startedAt: number;
  status: 'active' | 'finished';
}

export class GameSessionManager {
  private sessions = new Map<string, GameSession>();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  createSession(roomId: string, players: PlayerInfo[]): void {
    this.sessions.set(roomId, {
      roomId,
      players: [...players],
      startedAt: Date.now(),
      status: 'active',
    });
    console.log(`Game session created: ${roomId} with ${players.map(p => p.name).join(' vs ')}`);
  }

  endSession(roomId: string): void {
    const session = this.sessions.get(roomId);
    if (session) {
      session.status = 'finished';
      const duration = Math.floor((Date.now() - session.startedAt) / 1000);
      console.log(`Game session ended: ${roomId} (${duration}s)`);
    }
  }

  getSession(roomId: string): GameSession | undefined {
    return this.sessions.get(roomId);
  }
}
