export interface ScoreResult {
  points: number;
  garbageLines: number;
  isTSpin: boolean;
  isBackToBack: boolean;
  combo: number;
  label: string | null;
}

export function calculateScore(
  linesCleared: number,
  level: number,
  isTSpin: boolean,
  combo: number,
  backToBack: boolean,
  isPerfectClear: boolean
): ScoreResult {
  let points = 0;
  let garbageLines = 0;
  let label: string | null = null;
  let isBackToBack = false;

  if (linesCleared === 0 && isTSpin) {
    points = 400 * level;
    label = 'T-Spin';
    return { points, garbageLines: 0, isTSpin, isBackToBack: false, combo: 0, label };
  }

  if (linesCleared === 0) {
    return { points: 0, garbageLines: 0, isTSpin: false, isBackToBack: false, combo: 0, label: null };
  }

  const newCombo = combo + 1;

  if (isTSpin) {
    switch (linesCleared) {
      case 1:
        points = 800 * level;
        garbageLines = 2;
        label = 'T-Spin Single';
        break;
      case 2:
        points = 1200 * level;
        garbageLines = 4;
        label = 'T-Spin Double';
        break;
      case 3:
        points = 1600 * level;
        garbageLines = 6;
        label = 'T-Spin Triple';
        break;
    }
    isBackToBack = backToBack;
  } else {
    switch (linesCleared) {
      case 1:
        points = 100 * level;
        garbageLines = 0;
        label = 'Single';
        break;
      case 2:
        points = 300 * level;
        garbageLines = 1;
        label = 'Double';
        break;
      case 3:
        points = 500 * level;
        garbageLines = 2;
        label = 'Triple';
        break;
      case 4:
        points = 800 * level;
        garbageLines = 4;
        label = 'Tetris';
        isBackToBack = backToBack;
        break;
    }
  }

  // Back-to-back bonus
  if (isBackToBack && (linesCleared === 4 || isTSpin)) {
    points = Math.floor(points * 1.5);
    garbageLines += 1;
    label = 'B2B ' + label;
  }

  // Combo bonus
  if (newCombo > 1) {
    const comboBonus = 50 * (newCombo - 1) * level;
    points += comboBonus;
    garbageLines += Math.floor((newCombo - 1) / 2);
    if (newCombo >= 3) {
      label = `${label} (${newCombo - 1} Combo)`;
    }
  }

  // Perfect clear
  if (isPerfectClear) {
    points += 3000 * level;
    garbageLines = 10;
    label = 'Perfect Clear!';
  }

  return { points, garbageLines, isTSpin, isBackToBack, combo: newCombo, label };
}

export function getLevel(lines: number): number {
  return Math.floor(lines / 10) + 1;
}

export function getDropInterval(level: number): number {
  // Speeds up as level increases, minimum 50ms
  return Math.max(50, 1000 - (level - 1) * 80);
}

export function checkTSpin(board: (string | null)[][], piece: { type: string; position: { x: number; y: number }; rotation: number }): boolean {
  if (piece.type !== 'T') return false;

  const cx = piece.position.x + 1;
  const cy = piece.position.y + 1;

  const corners = [
    { x: cx - 1, y: cy - 1 },
    { x: cx + 1, y: cy - 1 },
    { x: cx + 1, y: cy + 1 },
    { x: cx - 1, y: cy + 1 },
  ];

  let filledCorners = 0;
  for (const corner of corners) {
    if (
      corner.x < 0 || corner.x >= 10 ||
      corner.y < 0 || corner.y >= board.length ||
      board[corner.y][corner.x] !== null
    ) {
      filledCorners++;
    }
  }

  return filledCorners >= 3;
}
