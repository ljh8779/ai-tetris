interface QueuedPlayer {
  id: string;
  name: string;
  joinedAt: number;
}

export class MatchmakingQueue {
  private queue: QueuedPlayer[] = [];

  addPlayer(id: string, name: string): void {
    if (this.queue.some(p => p.id === id)) return;
    this.queue.push({ id, name, joinedAt: Date.now() });
  }

  removePlayer(id: string): void {
    this.queue = this.queue.filter(p => p.id !== id);
  }

  tryMatch(): { id: string; name: string }[] | null {
    if (this.queue.length < 2) return null;

    const p1 = this.queue.shift()!;
    const p2 = this.queue.shift()!;

    return [
      { id: p1.id, name: p1.name },
      { id: p2.id, name: p2.name },
    ];
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}
