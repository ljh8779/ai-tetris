import { PieceType } from 'shared';

const ALL_PIECES: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

// Seeded PRNG (Mulberry32)
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export class BagRandomizer {
  private bag: PieceType[] = [];
  private rng: () => number;

  constructor(seed?: number) {
    this.rng = seed !== undefined ? mulberry32(seed) : Math.random;
    this.refillBag();
  }

  private refillBag(): void {
    this.bag = shuffleArray(ALL_PIECES, this.rng);
  }

  next(): PieceType {
    if (this.bag.length === 0) {
      this.refillBag();
    }
    return this.bag.pop()!;
  }

  peek(count: number): PieceType[] {
    const result: PieceType[] = [];
    const tempBag = [...this.bag];
    let tempRng = this.rng;

    for (let i = 0; i < count; i++) {
      if (tempBag.length === 0) {
        const newBag = shuffleArray(ALL_PIECES, tempRng);
        tempBag.push(...newBag);
      }
      result.push(tempBag.pop()!);
    }
    return result;
  }
}

export function createRandomizer(seed?: number): BagRandomizer {
  return new BagRandomizer(seed);
}
