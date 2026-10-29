import { Document } from '../domain/Document.js';
import { EditCommand } from './EditCommand.js';

export class GroupCommand extends EditCommand {
 constructor(private readonly id: string, private readonly ids: string[]) { super(); }
 protected apply(doc: Document): string { doc.group(this.id,this.ids); return 'g#' + this.id + ' created with ' + this.ids.length + ' children'; }
}
