import { Document } from '../domain/Document.js';
import { EditCommand } from './EditCommand.js';

export class AddToCommand extends EditCommand {
 constructor(private readonly gid: string, private readonly id: string) { super(); }
 protected apply(doc: Document): string { doc.addto(this.gid,this.id); return doc.find(this.id).label + ' added to g#' + this.gid; }
}
