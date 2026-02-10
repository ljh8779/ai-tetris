import { PieceType, Piece, Position } from 'shared';

export const PIECE_COLORS: Record<PieceType, string> = {
  I: '#00DFFF',
  O: '#FFD700',
  T: '#B44FFF',
  S: '#44FF44',
  Z: '#FF4444',
  J: '#4488FF',
  L: '#FF8800',
};

export const PIECE_SHAPES: Record<PieceType, number[][][]> = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  ],
  O: [
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]],
  ],
  T: [
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]],
  ],
  S: [
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]],
    [[0,0,0],[0,1,1],[1,1,0]],
    [[1,0,0],[1,1,0],[0,1,0]],
  ],
  Z: [
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,0],[0,1,1]],
    [[0,1,0],[1,1,0],[1,0,0]],
  ],
  J: [
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]],
  ],
  L: [
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]],
  ],
};

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const BOARD_VISIBLE_HEIGHT = 20;
export const BOARD_BUFFER = 4;
export const TOTAL_HEIGHT = BOARD_HEIGHT + BOARD_BUFFER;

export function createPiece(type: PieceType): Piece {
  const shape = PIECE_SHAPES[type][0];
  const x = Math.floor((BOARD_WIDTH - shape[0].length) / 2);
  return {
    type,
    shape,
    position: { x, y: BOARD_BUFFER - 2 },
    rotation: 0,
  };
}

export function getShape(type: PieceType, rotation: number): number[][] {
  return PIECE_SHAPES[type][rotation % 4];
}

export function getPieceBlocks(piece: Piece): Position[] {
  const blocks: Position[] = [];
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        blocks.push({ x: piece.position.x + c, y: piece.position.y + r });
      }
    }
  }
  return blocks;
}
