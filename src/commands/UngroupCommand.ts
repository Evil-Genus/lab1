import { Document } from '../domain/Document.js';
import { EditCommand } from './EditCommand.js';

export class UngroupCommand extends EditCommand {
 constructor(private readonly id: string) { super(); }
 protected apply(doc: Document): string { doc.ungroup(this.id); return 'g#' + this.id + ' ungrouped'; }
}
