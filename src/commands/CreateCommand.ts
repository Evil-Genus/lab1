import { Document } from '../domain/Document.js';
import { EditCommand } from './EditCommand.js';
import { Shape } from '../domain/Shape.js';
export class CreateCommand extends EditCommand {
 constructor(private readonly shape: Shape, private readonly parent?: string) { super(); }
 protected apply(doc: Document): string { doc.add(this.shape.clone(),this.parent); return this.shape.label + ' created' + (this.parent ? ' in g#' + this.parent : ''); }
}
