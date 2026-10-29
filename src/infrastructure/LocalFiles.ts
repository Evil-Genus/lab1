import { readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { FileAccess } from '../application/FileAccess.js';
export class LocalFiles implements FileAccess {
  read(path: string): string { return readFileSync(path,'utf8'); }
  write(path: string, content: string): void {
    const temporary = path + '.' + randomUUID() + '.tmp';
    try { writeFileSync(temporary,content,{encoding:'utf8',flag:'wx'}); renameSync(temporary,path); }
    finally { try { unlinkSync(temporary); } catch { /* Already renamed or never created. */ } }
  }
}
