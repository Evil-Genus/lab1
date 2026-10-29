import { Shape } from './Shape.js';
export class Rect extends Shape {
 constructor(id: string, x = 0, y = 0, width = 0, height = 0) { super(id, 'rect', {x,y,width,height}, {"x":"x","y":"y","width":"size","height":"size"}); }
 clone(): Rect { return this.copyInto(new Rect(this.id)); }
}

