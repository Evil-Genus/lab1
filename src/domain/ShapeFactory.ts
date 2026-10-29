import { Shape } from './Shape.js';
import { Rect } from './Rect.js';
import { Circle } from './Circle.js';
import { Ellipse } from './Ellipse.js';
import { Line } from './Line.js';
import { Text } from './Text.js';
import { Group } from './Group.js';
import { Numbers } from './Numbers.js';
export class ShapeFactory {
  // Only shape-name dispatch point; replace built-ins with provider registration in Phase 2.
  private readonly providers: Record<string, {keys: string[]; style?: string; build: (id: string) => Shape}> = {
    rect: {keys:['x','y','width','height'], style:'fill', build:id=>new Rect(id)},
    circle: {keys:['cx','cy','r'], style:'fill', build:id=>new Circle(id)},
    ellipse: {keys:['cx','cy','rx','ry'], style:'fill', build:id=>new Ellipse(id)},
    line: {keys:['x1','y1','x2','y2'], style:'stroke', build:id=>new Line(id)},
    text: {keys:['x','y','text'], build:id=>new Text(id)},
    g: {keys:[], build:id=>new Group(id)}
  };
  private provider(type: string) {
    if (!Object.hasOwn(this.providers,type)) throw new Error('unknown shape type: ' + type + ' (is the plugin loaded?)');
    return this.providers[type];
  }
  create(type: string, id: string, args: string[]): Shape {
    const provider = this.provider(type);
    if (args.length < provider.keys.length || args.length > provider.keys.length + (provider.style ? 1 : 0))
      throw new Error('invalid parameters for ' + type);
    const shape = provider.build(id);
    provider.keys.forEach((key,i) => shape.set(key,args[i]));
    if (provider.style && args.length > provider.keys.length) shape.set(provider.style,args.at(-1)!);
    return shape;
  }
  fromAttributes(type: string, id: string, attrs: Record<string,string>, text: string): Shape {
    const shape = this.provider(type).build(id);
    for (const [key,value] of Object.entries(attrs)) shape.set(key,value);
    if (shape.text !== undefined) shape.set('text',text);
    return shape;
  }
}
