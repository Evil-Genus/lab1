import { Document } from '../domain/Document.js';
import { DocumentStore } from './DocumentStore.js';
export abstract class EditCommand {
  private before?: Document;
  private after?: Document;
  private result = '';
  execute(store: DocumentStore): string {
    const before = store.document.clone(), working = before.clone();
    const result = this.apply(working);
    this.before = before; this.after = working.clone(); this.result = result;
    store.replace(working); return result;
  }
  undo(store: DocumentStore): string {
    if (!this.before) throw new Error('command not executed');
    store.replace(this.before.clone()); return 'undone: ' + this.result;
  }
  redo(store: DocumentStore): string {
    if (!this.after) throw new Error('command not executed');
    store.replace(this.after.clone()); return 'redone: ' + this.result;
  }
  protected abstract apply(document: Document): string;
}
