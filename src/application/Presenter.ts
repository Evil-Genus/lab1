import { Document } from '../domain/Document.js';
import { Shape } from '../domain/Shape.js';
export class Presenter {
  tree(document: Document, id?: string): string {
    const lines: string[] = [];
    const visit = (shape: Shape, prefix: string, connector: string): void => {
      lines.push(prefix + connector + shape.summary());
      const next = prefix + (connector ? (connector === '└── ' ? '    ' : '│   ') : '');
      shape.children.forEach((child,i) => visit(child,next,i === shape.children.length-1 ? '└── ' : '├── '));
    };
    if (id !== undefined) visit(document.find(id),'','');
    else {
      lines.push('svg (' + document.width + 'x' + document.height + ')');
      document.children.forEach((s,i)=>visit(s,'',i === document.children.length-1 ? '└── ' : '├── '));
    }
    return lines.join('\n');
  }
  show(document: Document,id: string): string {
    const shape = document.find(id);
    const details = [shape.geometrySummary(), shape.styleSummary(),
      shape.text === undefined ? '' : 'text=' + JSON.stringify(shape.text)].filter(Boolean);
    return [shape.label + '  parent=' + document.parentLabel(id),
      ...details.map(line => '  ' + line)].join('\n');
  }
}
