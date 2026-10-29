import { Shape } from './Shape.js';
export class Text extends Shape {
  private content: string;
  constructor(id: string, x = 0, y = 0, content = '') {
    super(id, 'text', {x,y}, {x:'x',y:'y'}); this.content = content;
  }
  override get text(): string { return this.content; }
  override set(attr: string, value: string): void {
    if (attr === 'text') this.content = value; else super.set(attr,value);
  }
  clone(): Text { return this.copyInto(new Text(this.id,0,0,this.content)); }
  override summary(): string { return super.summary() + ' ' + JSON.stringify(this.content); }
}
