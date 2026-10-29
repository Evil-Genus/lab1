import { FileAccess } from '../src/application/FileAccess.js';
export class MemoryFiles implements FileAccess {
  private data = new Map<string,string>();
  failWrites = false;
  read(path: string): string { const text = this.data.get(path); if(text === undefined) throw new Error('missing'); return text; }
  write(path: string,text: string): void { if(this.failWrites) throw new Error('denied'); this.data.set(path,text); }
}
