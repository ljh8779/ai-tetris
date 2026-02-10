import { Board, Piece, CellColor } from 'shared';
import { BOARD_WIDTH, TOTAL_HEIGHT, PIECE_COLORS, getPieceBlocks, BOARD_BUFFER } from './pieces';
import { isValidPosition } from './rotation';

export function createBoard(): Board {
  return Array.from({ length: TOTAL_HEIGHT }, () =>
    Array(BOARD_WIDTH).fill(null)
  );
}

export function canMove(board: Board, piece: Piece, dx: number, dy: number): boolean {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const nx = piece.position.x + c + dx;
        const ny = piece.position.y + r + dy;
        if (nx < 0 || nx >= BOARD_WIDTH || ny >= TOTAL_HEIGHT) return false;
        if (ny >= 0 && board[ny][nx] !== null) return false;
      }
    }
  }
  return true;
}

export function movePiece(piece: Piece, dx: number, dy: number): Piece {
  return {
    ...piece,
    position: { x: piece.position.x + dx, y: piece.position.y + dy },
  };
}

export function lockPiece(board: Board, piece: Piece): Board {
  const newBoard = board.map(row => [...row]);
  const color = PIECE_COLORS[piece.type];
  const blocks = getPieceBlocks(piece);
  for (const { x, y } of blocks) {
    if (y >= 0 && y < TOTAL_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
      newBoard[y][x] = color;
    }
  }
  return newBoard;
}

export function clearLines(board: Board): { board: Board; linesCleared: number; clearedRows: number[] } {
  const clearedRows: number[] = [];
  for (let r = 0; r < TOTAL_HEIGHT; r++) {
    if (board[r].every(cell => cell !== null)) {
      clearedRows.push(r);
    }
  }

  if (clearedRows.length === 0) {
    return { board, linesCleared: 0, clearedRows: [] };
  }

  const newBoard: Board = [];
  for (let r = 0; r < TOTAL_HEIGHT; r++) {
    if (!clearedRows.includes(r)) {
      newBoard.push([...board[r]]);
    }
  }

  while (newBoard.length < TOTAL_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }

  return { board: newBoard, linesCleared: clearedRows.length, clearedRows };
}

export function getGhostPosition(board: Board, piece: Piece): Piece {
  let ghost = { ...piece, position: { ...piece.position } };
  while (canMove(board, ghost, 0, 1)) {
    ghost = movePiece(ghost, 0, 1);
  }
  return ghost;
}

export function hardDrop(board: Board, piece: Piece): { piece: Piece; distance: number } {
  let distance = 0;
  let dropped = piece;
  while (canMove(board, dropped, 0, 1)) {
    dropped = movePiece(dropped, 0, 1);
    distance++;
  }
  return { piece: dropped, distance };
}

export function isTopOut(board: Board): boolean {
  for (let c = 0; c < BOARD_WIDTH; c++) {
    if (board[BOARD_BUFFER - 1][c] !== null) return true;
  }
  return false;
}

export function addGarbageLines(board: Board, lines: number): Board {
  const newBoard = board.map(row => [...row]);
  // Remove top lines
  newBoard.splice(0, lines);
  // Add garbage at bottom
  const gapColumn = Math.floor(Math.random() * BOARD_WIDTH);
  for (let i = 0; i < lines; i++) {
    const garbageRow: CellColor[] = Array(BOARD_WIDTH).fill('#888888');
    garbageRow[gapColumn] = null;
    newBoard.push(garbageRow);
  }
  return newBoard;
}

export function isPerfectClear(board: Board): boolean {
  return board.every(row => row.every(cell => cell === null));
}
