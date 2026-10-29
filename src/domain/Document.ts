import { Group } from './Group.js';
import { Shape } from './Shape.js';
import { Numbers } from './Numbers.js';
export class Document {
  private root = new Group('__canvas__');
  private w: number;
  private h: number;
  constructor(width = 800, height = 600) { this.w = Numbers.positive(width); this.h = Numbers.positive(height); }
  get width(): number { return this.w; }
  get height(): number { return this.h; }
  get children(): readonly Shape[] { return this.root.children; }
  resize(width: number, height: number): void { const w = Numbers.positive(width), h = Numbers.positive(height); this.w = w; this.h = h; }
  all(): Shape[] {
    const result: Shape[] = [];
    const visit = (s: Shape): void => { result.push(s); s.children.forEach(visit); };
    this.children.forEach(visit); return result;
  }
  find(id: string): Shape {
    const shape = this.all().find(s=>s.id === id);
    if (!shape) throw new Error('no such shape: ' + id);
    return shape;
  }
  container(id?: string): Group {
    if (id === undefined) return this.root;
    const shape = this.all().find(s=>s.id === id);
    if (!shape) throw new Error('no such container: ' + id);
    if (!(shape instanceof Group)) throw new Error('not a container: ' + id);
    return shape;
  }
  parent(id: string): Group {
    this.find(id);
    return [this.root,...this.all().filter((s): s is Group=>s instanceof Group)].find(g=>g.children.some(s=>s.id === id))!;
  }
  parentLabel(id: string): string { const p = this.parent(id); return p === this.root ? 'svg' : p.label; }
  add(shape: Shape, parentId?: string): void {
    const target = this.container(parentId);
    const used = new Set(this.all().map(s=>s.id));
    const visit = (s: Shape): void => {
      if (used.has(s.id)) throw new Error('id already exists: ' + s.id);
      used.add(s.id); s.children.forEach(visit);
    };
    visit(shape); target.insert(shape);
  }
  delete(id: string): void { this.parent(id).remove(id); }
  group(id: string, ids: string[]): void {
    if (!ids.length || new Set(ids).size !== ids.length) throw new Error('group requires distinct shapes');
    if (this.all().some(s=>s.id === id)) throw new Error('id already exists: ' + id);
    const selected = ids.map(i=>this.find(i));
    for (const s of selected)
      if (s instanceof Group && ids.some(i=>s.contains(i))) throw new Error('cannot group a container into its own descendant: ' + s.id);
    const ordered = this.all().filter(s=>ids.includes(s.id));
    let target = this.parent(ordered[0].id);
    while (!ordered.every(s=>target.contains(s.id))) target = this.parent(target.id);
    const top = ordered.map(s => { let n = s; while (this.parent(n.id) !== target) n = this.parent(n.id); return n; });
    const index = Math.min(...top.map(n=>target.children.indexOf(n)));
    const group = new Group(id);
    for (const s of ordered) { this.parent(s.id).remove(s.id); group.insert(s); }
    target.insert(group,index);
  }
  ungroup(id: string): void {
    const group = this.container(id), parent = this.parent(id);
    if (parent === this.root) throw new Error('cannot ungroup top-level container: ' + id);
    const index = parent.children.indexOf(group);
    parent.remove(id);
    group.children.forEach((s,i)=> { group.remove(s.id); parent.insert(s,index+i); });
  }
  addto(gid: string, id: string): void {
    const target = this.container(gid), shape = this.find(id);
    if (shape === target || (shape instanceof Group && shape.contains(gid)))
      throw new Error('cannot move a container into its own descendant: ' + id);
    this.parent(id).remove(id); target.insert(shape);
  }
  reorder(id: string, front: boolean): void {
    const parent = this.parent(id), shape = parent.remove(id);
    parent.insert(shape,front ? parent.children.length : 0);
  }
  clone(): Document {
    const copy = new Document(this.w,this.h); copy.root = this.root.clone(); return copy;
  }
}
