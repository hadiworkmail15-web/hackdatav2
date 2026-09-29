export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0 || 1;
  }

  next(): number {
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  boolean(): boolean {
    return this.next() < 0.5;
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  gaussian(mean = 0, stdDev = 1): number {
    const u1 = this.next() || 0.0001;
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z * stdDev + mean;
  }
}
