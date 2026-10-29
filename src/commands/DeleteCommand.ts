import { Document } from '../domain/Document.js';
import { EditCommand } from './EditCommand.js';

export class DeleteCommand extends EditCommand {
 constructor(private readonly id: string) { super(); }
 protected apply(doc: Document): string { const label = doc.find(this.id).label; doc.delete(this.id); return label + ' deleted'; }
}
