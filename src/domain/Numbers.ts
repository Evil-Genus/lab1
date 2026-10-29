export class Numbers {
  static parse(value: string | number): number {
    if (String(value).trim() === '') throw new Error('expected a finite number');
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error('expected a finite number');
    return n;
  }
  static positive(value: string | number, message = 'value must be positive'): number {
    const n = this.parse(value);
    if (n <= 0) throw new Error(message);
    return n;
  }
}
