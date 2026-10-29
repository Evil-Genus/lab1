import { EditCommand } from './EditCommand.js';
import { DocumentStore } from './DocumentStore.js';
export class History {
  private past: EditCommand[] = [];
  private future: EditCommand[] = [];
  private blocked = false;
  constructor(private readonly store: DocumentStore) {}
  execute(command: EditCommand): string {
    const result = command.execute(this.store);
    this.past.push(command); this.future = []; this.blocked = false; return result;
  }
  barrier(): void { this.past = []; this.future = []; this.blocked = true; }
  undo(): string {
    this.store.document;
    if (this.blocked) throw new Error('undo not allowed after io command');
    const command = this.past.at(-1);
    if (!command) throw new Error('nothing to undo');
    const result = command.undo(this.store); this.past.pop(); this.future.push(command); return result;
  }
  redo(): string {
    this.store.document;
    if (this.blocked) throw new Error('undo not allowed after io command');
    const command = this.future.at(-1);
    if (!command) throw new Error('nothing to redo');
    const result = command.redo(this.store); this.future.pop(); this.past.push(command); return result;
  }
}
