import { Board, Piece } from 'shared';
import { PIECE_COLORS, BOARD_WIDTH, BOARD_HEIGHT, BOARD_BUFFER, getPieceBlocks } from './pieces';

const CELL_SIZE = 30;
const BORDER_RADIUS = 6;
const GRID_COLOR = 'rgba(255, 255, 255, 0.05)';
const GRID_LINE_COLOR = 'rgba(255, 255, 255, 0.08)';
const BG_COLOR = '#0a0a1a';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface TextOverlay {
  text: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
  fontSize: number;
}

export interface ScreenShake {
  intensity: number;
  duration: number;
  elapsed: number;
}

export interface LineClearAnimation {
  rows: number[];
  progress: number;
  duration: number;
}

export class TetrisRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  particles: Particle[] = [];
  textOverlays: TextOverlay[] = [];
  screenShake: ScreenShake | null = null;
  lineClearAnim: LineClearAnimation | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.width = BOARD_WIDTH * CELL_SIZE;
    this.height = BOARD_HEIGHT * CELL_SIZE;
    canvas.width = this.width;
    canvas.height = this.height;
  }

  render(board: Board, currentPiece: Piece | null, ghostPiece: Piece | null, deltaTime: number): void {
    const ctx = this.ctx;

    ctx.save();

    // Screen shake
    if (this.screenShake) {
      this.screenShake.elapsed += deltaTime;
      if (this.screenShake.elapsed < this.screenShake.duration) {
        const progress = this.screenShake.elapsed / this.screenShake.duration;
        const intensity = this.screenShake.intensity * (1 - progress);
        const dx = (Math.random() - 0.5) * intensity * 2;
        const dy = (Math.random() - 0.5) * intensity * 2;
        ctx.translate(dx, dy);
      } else {
        this.screenShake = null;
      }
    }

    // Background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, this.width, this.height);

    // Grid
    this.drawGrid();

    // Board cells
    for (let r = BOARD_BUFFER; r < board.length; r++) {
      for (let c = 0; c < BOARD_WIDTH; c++) {
        if (board[r][c]) {
          const displayRow = r - BOARD_BUFFER;
          this.drawBlock(c, displayRow, board[r][c]!, 1);
        }
      }
    }

    // Line clear animation
    if (this.lineClearAnim) {
      this.lineClearAnim.progress += deltaTime / this.lineClearAnim.duration;
      if (this.lineClearAnim.progress >= 1) {
        this.lineClearAnim = null;
      } else {
        const alpha = 1 - this.lineClearAnim.progress;
        for (const row of this.lineClearAnim.rows) {
          const displayRow = row - BOARD_BUFFER;
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
          ctx.fillRect(0, displayRow * CELL_SIZE, this.width, CELL_SIZE);
        }
      }
    }

    // Ghost piece
    if (ghostPiece && currentPiece) {
      const ghostBlocks = getPieceBlocks(ghostPiece);
      for (const { x, y } of ghostBlocks) {
        const displayY = y - BOARD_BUFFER;
        if (displayY >= 0) {
          this.drawBlock(x, displayY, PIECE_COLORS[ghostPiece.type], 0.25);
        }
      }
    }

    // Current piece
    if (currentPiece) {
      const blocks = getPieceBlocks(currentPiece);
      for (const { x, y } of blocks) {
        const displayY = y - BOARD_BUFFER;
        if (displayY >= 0) {
          this.drawBlock(x, displayY, PIECE_COLORS[currentPiece.type], 1);
        }
      }
    }

    // Particles
    this.updateAndDrawParticles(deltaTime);

    // Text overlays
    this.updateAndDrawTextOverlays(deltaTime);

    ctx.restore();
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = 0.5;

    for (let c = 1; c < BOARD_WIDTH; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL_SIZE, 0);
      ctx.lineTo(c * CELL_SIZE, this.height);
      ctx.stroke();
    }
    for (let r = 1; r < BOARD_HEIGHT; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL_SIZE);
      ctx.lineTo(this.width, r * CELL_SIZE);
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, this.width, this.height);
  }

  drawBlock(col: number, row: number, color: string, alpha: number): void {
    const ctx = this.ctx;
    const x = col * CELL_SIZE;
    const y = row * CELL_SIZE;
    const size = CELL_SIZE - 1;

    ctx.globalAlpha = alpha;

    // Main block with gradient
    const gradient = ctx.createRadialGradient(
      x + size * 0.35, y + size * 0.35, size * 0.1,
      x + size * 0.5, y + size * 0.5, size * 0.7
    );
    gradient.addColorStop(0, lightenColor(color, 60));
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, darkenColor(color, 40));

    // Rounded rect
    this.roundRect(x + 0.5, y + 0.5, size, size, BORDER_RADIUS);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Inner highlight (puyo-style shine)
    const shineGrad = ctx.createRadialGradient(
      x + size * 0.3, y + size * 0.25, 1,
      x + size * 0.3, y + size * 0.3, size * 0.4
    );
    shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = shineGrad;
    this.roundRect(x + 0.5, y + 0.5, size, size, BORDER_RADIUS);
    ctx.fill();

    // Inner shadow (bottom-right)
    const shadowGrad = ctx.createLinearGradient(x, y, x + size, y + size);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    ctx.fillStyle = shadowGrad;
    this.roundRect(x + 0.5, y + 0.5, size, size, BORDER_RADIUS);
    ctx.fill();

    // Border
    ctx.strokeStyle = darkenColor(color, 30);
    ctx.lineWidth = 1;
    this.roundRect(x + 0.5, y + 0.5, size, size, BORDER_RADIUS);
    ctx.stroke();

    ctx.globalAlpha = 1;
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private updateAndDrawParticles(dt: number): void {
    const ctx = this.ctx;
    this.particles = this.particles.filter(p => {
      p.life -= dt;
      if (p.life <= 0) return false;
      p.x += p.vx * dt / 16;
      p.y += p.vy * dt / 16;
      p.vy += 0.15;

      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
    ctx.globalAlpha = 1;
  }

  private updateAndDrawTextOverlays(dt: number): void {
    const ctx = this.ctx;
    this.textOverlays = this.textOverlays.filter(t => {
      t.life -= dt;
      if (t.life <= 0) return false;

      const progress = 1 - (t.life / t.maxLife);
      const alpha = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;
      const yOffset = -progress * 30;

      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = t.color;
      ctx.font = `bold ${t.fontSize}px Orbitron, sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.lineWidth = 3;
      ctx.strokeText(t.text, t.x, t.y + yOffset);
      ctx.fillText(t.text, t.x, t.y + yOffset);
      return true;
    });
    ctx.globalAlpha = 1;
  }

  addParticles(row: number, color: string, count: number = 20): void {
    const displayRow = row - BOARD_BUFFER;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: displayRow * CELL_SIZE + CELL_SIZE / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 6 - 2,
        life: 500 + Math.random() * 500,
        maxLife: 1000,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  addTextOverlay(text: string, color: string = '#FFD700', fontSize: number = 24): void {
    this.textOverlays.push({
      text,
      x: this.width / 2,
      y: this.height / 2,
      life: 1500,
      maxLife: 1500,
      color,
      fontSize,
    });
  }

  triggerScreenShake(intensity: number = 5, duration: number = 200): void {
    this.screenShake = { intensity, duration, elapsed: 0 };
  }

  startLineClearAnimation(rows: number[], duration: number = 300): void {
    this.lineClearAnim = { rows, progress: 0, duration };
  }

  getCanvasSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }
}

// Color utilities
function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r}, ${g}, ${b})`;
}

export { CELL_SIZE, lightenColor, darkenColor };
