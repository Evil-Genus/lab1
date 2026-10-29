import { Shape } from './Shape.js';
import { Numbers } from './Numbers.js';
export class Group extends Shape {
  private nodes: Shape[] = [];
  constructor(id: string) { super(id, 'g', {}, {}); }
  override get isContainer(): boolean { return true; }
  override get children(): readonly Shape[] { return [...this.nodes]; }
  insert(shape: Shape, index = this.nodes.length): void {
    if (shape === this || this.contains(shape.id)) throw new Error('invalid tree insertion');
    const includesThis = (node: Shape): boolean => node === this || node.children.some(includesThis);
    if (includesThis(shape)) throw new Error('cannot move a container into its own descendant: ' + shape.id);
    this.nodes.splice(index, 0, shape);
  }
  remove(id: string): Shape {
    const index = this.nodes.findIndex(n => n.id === id);
    if (index < 0) throw new Error('no such shape: ' + id);
    return this.nodes.splice(index, 1)[0];
  }
  contains(id: string): boolean { return this.nodes.some(n => n.id === id || (n instanceof Group && n.contains(id))); }
  override move(dx: number, dy: number): void { for (const node of this.nodes) node.move(dx,dy); }
  override scale(factor: number): void {
    Numbers.positive(factor, 'scale factor must be positive');
    for (const node of this.nodes) node.scale(factor);
  }
  clone(): Group {
    const group = this.copyInto(new Group(this.id));
    for (const node of this.nodes) group.insert(node.clone());
    return group;
  }
}
