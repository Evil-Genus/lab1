import { Numbers } from './Numbers.js';
import { XmlCharacters } from './XmlCharacters.js';
export abstract class Shape {
  private values: Record<string, number>;
  private styles: Record<string, string> = {};
  protected constructor(readonly id: string, readonly tag: string,
    values: Record<string, number>, private readonly axes: Record<string, 'x' | 'y' | 'size'>) {
    XmlCharacters.validate(id);
    if (!id || /[\s<>"'&]/u.test(id)) throw new Error('invalid id: ' + id);
    this.values = {};
    for (const [key, value] of Object.entries(values)) this.set(key, String(value));
  }
  get label(): string { return this.tag + '#' + this.id; }
  get children(): readonly Shape[] { return []; }
  get isContainer(): boolean { return false; }
  get text(): string | undefined { return undefined; }
  attributes(): Record<string, string> {
    return Object.fromEntries([...Object.entries(this.values).map(([k,v]) => [k,String(v)]), ...Object.entries(this.styles)]);
  }
  move(dx: number, dy: number): void {
    Numbers.parse(dx); Numbers.parse(dy);
    for (const [key,axis] of Object.entries(this.axes))
      if (axis !== 'size') this.set(key, String(this.values[key] + (axis === 'x' ? dx : dy)));
  }
  scale(factor: number): void {
    Numbers.positive(factor, 'scale factor must be positive');
    for (const key of Object.keys(this.values)) this.set(key, String(this.values[key] * factor));
  }
  set(attr: string, value: string): void {
    if (Object.hasOwn(this.axes, attr)) {
      const n = Numbers.parse(value);
      if (this.axes[attr] === 'size' && n < 0) throw new Error(attr + ' must be non-negative');
      this.values[attr] = n;
    } else if (['fill','stroke','stroke-width'].includes(attr)) {
      XmlCharacters.validate(value);
      if (attr === 'stroke-width') {
        const width = Numbers.parse(value);
        if (width < 0) throw new Error('stroke-width must be non-negative');
        value = String(width);
      }
      this.styles[attr] = value;
    } else throw new Error('unknown attribute: ' + attr);
  }
  protected copyInto<T extends Shape>(target: T): T {
    for (const [key,value] of Object.entries(this.attributes())) target.set(key,value);
    return target;
  }
  abstract clone(): Shape;
  geometrySummary(): string {
    return Object.entries(this.values).map(([k,v]) => k + '=' + v).join(' ');
  }
  styleSummary(): string {
    return Object.entries(this.styles).map(([k,v]) => k + '=' + v).join(' ');
  }
  protected treeGeometry(): string { return this.geometrySummary(); }
  summary(): string {
    const detail = [this.treeGeometry(), this.styleSummary()].filter(Boolean).join(' ');
    return this.label + (detail ? '  ' + detail : '');
  }
}
