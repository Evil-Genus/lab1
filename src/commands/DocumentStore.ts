import { Document } from '../domain/Document.js';
export class DocumentStore {
  private current?: Document;
  get document(): Document {
    if (!this.current) throw new Error("no document. use 'init' or 'read' first");
    return this.current;
  }
  replace(document: Document): void { this.current = document; }
}
