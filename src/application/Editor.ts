import { Document } from '../domain/Document.js';
import { DocumentStore } from '../commands/DocumentStore.js';
import { History } from '../commands/History.js';
import { EditCommand } from '../commands/EditCommand.js';
import { DocumentCodec } from './DocumentCodec.js';
import { FileAccess } from './FileAccess.js';
export class Editor {
  private readonly store = new DocumentStore();
  private readonly history = new History(this.store);
  private path?: string;
  constructor(private readonly codec: DocumentCodec, private readonly files: FileAccess) {}
  get document(): Document { return this.store.document; }
  edit(command: EditCommand): string { return this.history.execute(command); }
  init(w = 800,h = 600): string {
    this.store.replace(new Document(w,h)); this.path = undefined; this.history.barrier();
    return 'canvas ' + w + 'x' + h + ' created';
  }
  read(path: string): string {
    let source: string;
    try { source = this.files.read(path); } catch { throw new Error('cannot read file: ' + path); }
    const result = this.codec.decode(source);
    this.store.replace(result.document); this.path = path; this.history.barrier();
    return [...result.warnings,'read ' + path + ' (' + result.document.all().length + ' elements)'].join('\n');
  }
  save(path = this.path): string {
    const document = this.document;
    if (!path) throw new Error('no save path. use save <file.svg>');
    const content = this.codec.encode(document);
    try { this.files.write(path,content); } catch { throw new Error('cannot write file: ' + path); }
    this.path = path; this.history.barrier();
    return 'saved to ' + path + ' (' + document.all().length + ' elements)';
  }
  canvas(w?: number,h?: number): string {
    const doc = this.document;
    if (w !== undefined && h !== undefined) { doc.resize(w,h); this.history.barrier(); }
    return 'canvas ' + doc.width + 'x' + doc.height;
  }
  undo(): string { return this.history.undo(); }
  redo(): string { return this.history.redo(); }
}
