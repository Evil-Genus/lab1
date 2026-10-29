import { Shape } from './Shape.js';
export class Line extends Shape {
 constructor(id: string, x1 = 0, y1 = 0, x2 = 0, y2 = 0) { super(id, 'line', {x1,y1,x2,y2}, {"x1":"x","y1":"y","x2":"x","y2":"y"}); }
 clone(): Line { return this.copyInto(new Line(this.id)); }
}

