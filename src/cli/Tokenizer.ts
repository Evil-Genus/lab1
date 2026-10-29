export class Tokenizer {
  parse(line: string): string[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: string[] = [];
    let buffer = '', quoted = false, started = false;
    for (let i=0;i<line.length;i++) {
      const c = line[i];
      if (c === '\\' && quoted && ['"','\\'].includes(line[i+1])) { buffer += line[++i]; started = true; }
      else if (c === '"') { quoted = !quoted; started = true; }
      else if (/\s/u.test(c) && !quoted) { if (started) tokens.push(buffer); buffer=''; started=false; }
      else { buffer += c; started=true; }
    }
    if (quoted) throw new Error('unterminated quote');
    if (started) tokens.push(buffer);
    return tokens;
  }
}
