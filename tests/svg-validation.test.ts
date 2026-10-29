import test from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../src/application/Editor.js';
import { CommandRouter } from '../src/cli/CommandRouter.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { MemoryFiles } from './MemoryFiles.js';

test('every imported attribute reaches the whitelist, including object prototype names', () => {
  const files = new MemoryFiles(), codec = new SvgCodec();
  const editor = new Editor(codec, files), cli = new CommandRouter(editor);
  cli.execute('init'); cli.execute('create circle c 10 20 30');
  const before = codec.encode(editor.document);
  for (const attr of ['__proto__', 'constructor', 'toString', 'unknown']) {
    files.write('bad.svg', `<svg xmlns="http://www.w3.org/2000/svg"><rect id="r" ${attr}="bad"/></svg>`);
    assert.equal(cli.execute('read bad.svg'), 'error: unknown attribute: ' + attr);
    assert.equal(codec.encode(editor.document), before);
  }
  assert.ok(!cli.execute('undo').startsWith('error:'));
  assert.equal(editor.document.all().length, 0);
});
