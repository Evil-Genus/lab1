import { Document } from '../domain/Document.js';
import { EditCommand } from './EditCommand.js';

export class SetCommand extends EditCommand {
 constructor(private readonly id: string, private readonly attr: string, private readonly value: string) { super(); }
 protected apply(doc: Document): string { const shape = doc.find(this.id); shape.set(this.attr,this.value); return shape.label + ' updated: ' + this.attr + '=' + JSON.stringify(this.value); }
}
