import { Shape } from './Shape.js';
import { XmlCharacters } from './XmlCharacters.js';
export class Text extends Shape {
  private content: string;
  constructor(id: string, x = 0, y = 0, content = '') {
    super(id, 'text', {x,y}, {x:'x',y:'y'});
    XmlCharacters.validate(content); this.content = content;
  }
  override get text(): string { return this.content; }
  override set(attr: string, value: string): void {
    if (attr === 'text') {
      XmlCharacters.validate(value); this.content = value;
    } else super.set(attr,value);
  }
  clone(): Text { return this.copyInto(new Text(this.id,0,0,this.content)); }
  protected override treeGeometry(): string {
    const a = this.attributes();
    return `(${a.x},${a.y}) ${JSON.stringify(this.content)}`;
  }
}
