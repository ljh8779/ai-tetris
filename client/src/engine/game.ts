import { GameState, Piece, PieceType, Board } from 'shared';
import { createBoard, canMove, movePiece, lockPiece, clearLines, hardDrop, getGhostPosition, isTopOut, addGarbageLines, isPerfectClear } from './board';
import { createPiece, BOARD_BUFFER } from './pieces';
import { tryRotate } from './rotation';
import { BagRandomizer, createRandomizer } from './randomizer';
import { calculateScore, getLevel, getDropInterval, checkTSpin } from './scoring';

export type GameAction =
  | 'left' | 'right' | 'down'
  | 'rotate_cw' | 'rotate_ccw'
  | 'hard_drop' | 'hold'
  | 'tick';

export interface LineClearEvent {
  lines: number;
  rows: number[];
  label: string | null;
  garbageLines: number;
  isTSpin: boolean;
  isPerfectClear: boolean;
}

export interface LockEvent {
  hardDropDistance: number;
}

const LOCK_DELAY = 500;
const MAX_LOCK_RESETS = 15;
const NEXT_PREVIEW_COUNT = 5;

export class TetrisGame {
  state: GameState;
  private randomizer: BagRandomizer;
  private lockTimer: number = 0;
  private lockResets: number = 0;
  private isLocking: boolean = false;
  private lastAction: GameAction | null = null;
  private lastWasSpin: boolean = false;

  onLineClear?: (event: LineClearEvent) => void;
  onLock?: (event: LockEvent) => void;
  onGameOver?: () => void;
  onGarbageSend?: (lines: number) => void;

  constructor(seed?: number) {
    this.randomizer = createRandomizer(seed);

    const nextPieces: PieceType[] = [];
    for (let i = 0; i < NEXT_PREVIEW_COUNT; i++) {
      nextPieces.push(this.randomizer.next());
    }

    this.state = {
      board: createBoard(),
      currentPiece: null,
      nextPieces,
      holdPiece: null,
      canHold: true,
      score: 0,
      level: 1,
      lines: 0,
      combo: -1,
      backToBack: false,
      isGameOver: false,
      garbageQueue: 0,
    };

    this.spawnPiece();
  }

  private spawnPiece(): boolean {
    const type = this.state.nextPieces.shift()!;
    this.state.nextPieces.push(this.randomizer.next());

    const piece = createPiece(type);
    if (!canMove(this.state.board, piece, 0, 0)) {
      this.state.isGameOver = true;
      this.state.currentPiece = piece;
      this.onGameOver?.();
      return false;
    }

    this.state.currentPiece = piece;
    this.state.canHold = true;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.isLocking = false;
    this.lastWasSpin = false;
    return true;
  }

  update(action: GameAction, deltaTime?: number): boolean {
    if (this.state.isGameOver || !this.state.currentPiece) return false;

    this.lastAction = action;
    const piece = this.state.currentPiece;

    switch (action) {
      case 'left':
        return this.tryMove(-1, 0);
      case 'right':
        return this.tryMove(1, 0);
      case 'down':
        return this.tryMove(0, 1);
      case 'rotate_cw':
        return this.tryRotation(1);
      case 'rotate_ccw':
        return this.tryRotation(-1);
      case 'hard_drop':
        return this.doHardDrop();
      case 'hold':
        return this.doHold();
      case 'tick':
        return this.processTick(deltaTime || 0);
    }
  }

  private tryMove(dx: number, dy: number): boolean {
    const piece = this.state.currentPiece!;
    if (canMove(this.state.board, piece, dx, dy)) {
      this.state.currentPiece = movePiece(piece, dx, dy);
      this.lastWasSpin = false;
      if (this.isLocking && this.lockResets < MAX_LOCK_RESETS) {
        this.lockTimer = 0;
        this.lockResets++;
      }
      // Check if still on ground
      if (!canMove(this.state.board, this.state.currentPiece, 0, 1)) {
        this.isLocking = true;
      } else {
        this.isLocking = false;
      }
      return true;
    }
    return false;
  }

  private tryRotation(direction: 1 | -1): boolean {
    const piece = this.state.currentPiece!;
    const rotated = tryRotate(this.state.board, piece, direction);
    if (rotated) {
      this.state.currentPiece = rotated;
      this.lastWasSpin = true;
      if (this.isLocking && this.lockResets < MAX_LOCK_RESETS) {
        this.lockTimer = 0;
        this.lockResets++;
      }
      if (!canMove(this.state.board, rotated, 0, 1)) {
        this.isLocking = true;
      } else {
        this.isLocking = false;
      }
      return true;
    }
    return false;
  }

  private doHardDrop(): boolean {
    const piece = this.state.currentPiece!;
    const { piece: dropped, distance } = hardDrop(this.state.board, piece);
    this.state.score += distance * 2;
    this.state.currentPiece = dropped;
    this.onLock?.({ hardDropDistance: distance });
    this.lockCurrentPiece();
    return true;
  }

  private doHold(): boolean {
    if (!this.state.canHold) return false;
    const piece = this.state.currentPiece!;
    const prevHold = this.state.holdPiece;
    this.state.holdPiece = piece.type;
    this.state.canHold = false;

    if (prevHold) {
      this.state.currentPiece = createPiece(prevHold);
    } else {
      this.spawnPiece();
    }
    this.lockTimer = 0;
    this.lockResets = 0;
    this.isLocking = false;
    return true;
  }

  private processTick(_deltaTime: number): boolean {
    const piece = this.state.currentPiece!;

    if (canMove(this.state.board, piece, 0, 1)) {
      // Gravity: move down one cell
      this.state.currentPiece = movePiece(piece, 0, 1);
      this.lastWasSpin = false;
      this.isLocking = false;
      if (!canMove(this.state.board, this.state.currentPiece, 0, 1)) {
        this.isLocking = true;
        this.lockTimer = 0;
      }
    } else {
      // Already on ground - lock delay is handled by processLockDelay
      this.isLocking = true;
    }
    return true;
  }

  private lockCurrentPiece(): void {
    const piece = this.state.currentPiece!;

    // Check T-Spin before locking
    const isTSpin = this.lastWasSpin && checkTSpin(this.state.board, piece);

    // Lock
    this.state.board = lockPiece(this.state.board, piece);

    // Clear lines
    const { board: clearedBoard, linesCleared, clearedRows } = clearLines(this.state.board);
    const perfect = linesCleared > 0 && isPerfectClear(clearedBoard);

    // Calculate score
    const scoreResult = calculateScore(
      linesCleared,
      this.state.level,
      isTSpin,
      this.state.combo,
      this.state.backToBack,
      perfect
    );

    this.state.board = clearedBoard;
    this.state.score += scoreResult.points;
    this.state.lines += linesCleared;
    this.state.level = getLevel(this.state.lines);

    if (linesCleared > 0) {
      this.state.combo = scoreResult.combo;
      // Update backToBack
      if (linesCleared === 4 || isTSpin) {
        this.state.backToBack = true;
      } else {
        this.state.backToBack = false;
      }

      this.onLineClear?.({
        lines: linesCleared,
        rows: clearedRows,
        label: scoreResult.label,
        garbageLines: scoreResult.garbageLines,
        isTSpin,
        isPerfectClear: perfect,
      });

      if (scoreResult.garbageLines > 0) {
        // Offset against incoming garbage first
        let netGarbage = scoreResult.garbageLines;
        if (this.state.garbageQueue > 0) {
          const offset = Math.min(this.state.garbageQueue, netGarbage);
          this.state.garbageQueue -= offset;
          netGarbage -= offset;
        }
        if (netGarbage > 0) {
          this.onGarbageSend?.(netGarbage);
        }
      }
    } else {
      this.state.combo = -1;
      // Apply pending garbage
      if (this.state.garbageQueue > 0) {
        this.state.board = addGarbageLines(this.state.board, this.state.garbageQueue);
        this.state.garbageQueue = 0;
      }
    }

    // Check top-out
    if (isTopOut(this.state.board)) {
      this.state.isGameOver = true;
      this.state.currentPiece = null;
      this.onGameOver?.();
      return;
    }

    // Spawn next
    this.spawnPiece();
  }

  processLockDelay(deltaTime: number): void {
    if (!this.state.currentPiece || this.state.isGameOver) return;
    if (!this.isLocking) return;

    this.lockTimer += deltaTime;
    if (this.lockTimer >= LOCK_DELAY) {
      this.lockCurrentPiece();
    }
  }

  receiveGarbage(lines: number): void {
    this.state.garbageQueue += lines;
  }

  getGhostPiece(): Piece | null {
    if (!this.state.currentPiece) return null;
    return getGhostPosition(this.state.board, this.state.currentPiece);
  }

  getDropInterval(): number {
    return getDropInterval(this.state.level);
  }
}
