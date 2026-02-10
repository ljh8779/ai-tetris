import { Piece, Position, Board } from 'shared';
import { getShape, BOARD_WIDTH, TOTAL_HEIGHT } from './pieces';

// SRS Wall Kick Data
// [fromRotation][toRotation] = array of (dx, dy) offsets to try
const JLSTZ_KICKS: Record<string, Position[]> = {
  '0>1': [{x:0,y:0},{x:-1,y:0},{x:-1,y:-1},{x:0,y:2},{x:-1,y:2}],
  '1>0': [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:-2},{x:1,y:-2}],
  '1>2': [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:-2},{x:1,y:-2}],
  '2>1': [{x:0,y:0},{x:-1,y:0},{x:-1,y:-1},{x:0,y:2},{x:-1,y:2}],
  '2>3': [{x:0,y:0},{x:1,y:0},{x:1,y:-1},{x:0,y:2},{x:1,y:2}],
  '3>2': [{x:0,y:0},{x:-1,y:0},{x:-1,y:1},{x:0,y:-2},{x:-1,y:-2}],
  '3>0': [{x:0,y:0},{x:-1,y:0},{x:-1,y:-1},{x:0,y:2},{x:-1,y:2}],
  '0>3': [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:-2},{x:1,y:-2}],
};

const I_KICKS: Record<string, Position[]> = {
  '0>1': [{x:0,y:0},{x:-2,y:0},{x:1,y:0},{x:-2,y:1},{x:1,y:-2}],
  '1>0': [{x:0,y:0},{x:2,y:0},{x:-1,y:0},{x:2,y:-1},{x:-1,y:2}],
  '1>2': [{x:0,y:0},{x:-1,y:0},{x:2,y:0},{x:-1,y:-2},{x:2,y:1}],
  '2>1': [{x:0,y:0},{x:1,y:0},{x:-2,y:0},{x:1,y:2},{x:-2,y:-1}],
  '2>3': [{x:0,y:0},{x:2,y:0},{x:-1,y:0},{x:2,y:-1},{x:-1,y:2}],
  '3>2': [{x:0,y:0},{x:-2,y:0},{x:1,y:0},{x:-2,y:1},{x:1,y:-2}],
  '3>0': [{x:0,y:0},{x:1,y:0},{x:-2,y:0},{x:1,y:2},{x:-2,y:-1}],
  '0>3': [{x:0,y:0},{x:-1,y:0},{x:2,y:0},{x:-1,y:-2},{x:2,y:1}],
};

function isValidPosition(board: Board, shape: number[][], pos: Position): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const nx = pos.x + c;
        const ny = pos.y + r;
        if (nx < 0 || nx >= BOARD_WIDTH || ny >= TOTAL_HEIGHT) return false;
        if (ny >= 0 && board[ny][nx] !== null) return false;
      }
    }
  }
  return true;
}

export function tryRotate(
  board: Board,
  piece: Piece,
  direction: 1 | -1
): Piece | null {
  const fromRot = piece.rotation;
  const toRot = ((piece.rotation + direction) % 4 + 4) % 4;
  const newShape = getShape(piece.type, toRot);
  const key = `${fromRot}>${toRot}`;
  const kicks = piece.type === 'I' ? I_KICKS[key] : JLSTZ_KICKS[key];

  if (!kicks) return null;

  for (const kick of kicks) {
    const newPos = { x: piece.position.x + kick.x, y: piece.position.y - kick.y };
    if (isValidPosition(board, newShape, newPos)) {
      return {
        ...piece,
        shape: newShape,
        position: newPos,
        rotation: toRot,
      };
    }
  }
  return null;
}

export { isValidPosition };
