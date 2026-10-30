import test from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../src/application/Editor.js';
import { CommandRouter } from '../src/cli/CommandRouter.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { MemoryFiles } from './MemoryFiles.js';

test('invalid XML characters cannot enter IDs, text or styles and consume history', () => {
  const codec = new SvgCodec(), editor = new Editor(codec, new MemoryFiles());
  const cli = new CommandRouter(editor);
  cli.execute('init'); cli.execute('create text t 1 2 "original"');
  const before = codec.encode(editor.document);
  for (const invalid of ['\u0000', '\u0001', '\uD800', '\uFFFE']) {
    for (const command of [`set t text "bad${invalid}"`, `set t fill "bad${invalid}"`,
      `create g "id${invalid}"`, `create text bad 1 2 "bad${invalid}"`]) {
      assert.match(cli.execute(command), /^error: invalid XML character$/, command);
      assert.equal(codec.encode(editor.document), before);
    }
  }
  assert.ok(!cli.execute('undo').startsWith('error:'));
  assert.equal(editor.document.all().length, 0);
});

test('valid supplementary Unicode and XML whitespace survive text round trip', () => {
  const codec = new SvgCodec(), editor = new Editor(codec, new MemoryFiles());
  const cli = new CommandRouter(editor);
  cli.execute('init');
  assert.ok(!cli.execute('create text t 1 2 "中文 😀\tmore"').startsWith('error:'));
  const copy = codec.decode(codec.encode(editor.document)).document;
  assert.equal(copy.find('t').text, '中文 😀\tmore');
});

test('numeric style serialization uses the parsed numeric value', () => {
  const codec = new SvgCodec(), editor = new Editor(codec, new MemoryFiles());
  const cli = new CommandRouter(editor);
  cli.execute('init'); cli.execute('create line l 0 0 1 1 black');
  assert.ok(!cli.execute('set l stroke-width 0x10').startsWith('error:'));
  assert.equal(editor.document.find('l').attributes()['stroke-width'], '16');
  assert.match(codec.encode(editor.document), /stroke-width="16"/);
  cli.execute('undo');
  assert.equal(editor.document.find('l').attributes()['stroke-width'], undefined);
});
