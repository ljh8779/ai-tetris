export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type CellColor = string | null;

export type Board = CellColor[][];

export interface Position {
  x: number;
  y: number;
}

export interface Piece {
  type: PieceType;
  shape: number[][];
  position: Position;
  rotation: number;
}

export interface GameState {
  board: Board;
  currentPiece: Piece | null;
  nextPieces: PieceType[];
  holdPiece: PieceType | null;
  canHold: boolean;
  score: number;
  level: number;
  lines: number;
  combo: number;
  backToBack: boolean;
  isGameOver: boolean;
  garbageQueue: number;
}

export interface BoardSnapshot {
  board: Board;
  currentPiece: Piece | null;
  score: number;
  lines: number;
  garbageQueue: number;
  isGameOver: boolean;
}

export interface RoomState {
  id: string;
  players: PlayerInfo[];
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  seed?: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  ready: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface GameResult {
  winnerId: string;
  winnerName: string;
  loserId: string;
  loserName: string;
  scores: Record<string, number>;
}

export interface GarbageData {
  lines: number;
  senderId: string;
}

export interface LobbyRoom {
  id: string;
  playerCount: number;
  maxPlayers: number;
  status: string;
}
