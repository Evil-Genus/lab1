import { Document } from '../domain/Document.js';
import { EditCommand } from './EditCommand.js';

export class ScaleCommand extends EditCommand {
 constructor(private readonly id: string, private readonly factor: number) { super(); }
 protected apply(doc: Document): string { const shape = doc.find(this.id); shape.scale(this.factor); return shape.label + ' scaled by ' + this.factor; }
}
