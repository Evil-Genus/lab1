import { Document } from '../domain/Document.js';
import { EditCommand } from './EditCommand.js';

export class ReorderCommand extends EditCommand {
 constructor(private readonly id: string, private readonly front: boolean) { super(); }
 protected apply(doc: Document): string { doc.reorder(this.id,this.front); return doc.find(this.id).label + ' moved to ' + (this.front ? 'front' : 'back'); }
}
