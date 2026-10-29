import { Shape } from './Shape.js';
export class Circle extends Shape {
 constructor(id: string, cx = 0, cy = 0, r = 0) { super(id, 'circle', {cx,cy,r}, {"cx":"x","cy":"y","r":"size"}); }
 clone(): Circle { return this.copyInto(new Circle(this.id)); }
}

