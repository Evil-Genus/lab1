import { Shape } from './Shape.js';
export class Ellipse extends Shape {
 constructor(id: string, cx = 0, cy = 0, rx = 0, ry = 0) { super(id, 'ellipse', {cx,cy,rx,ry}, {"cx":"x","cy":"y","rx":"size","ry":"size"}); }
 clone(): Ellipse { return this.copyInto(new Ellipse(this.id)); }
}

