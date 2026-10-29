import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Editor } from '../src/application/Editor.js';
import { CommandRouter } from '../src/cli/CommandRouter.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { MemoryFiles } from './MemoryFiles.js';

test('complete specification session has exactly its two intended errors', () => {
  const files = new MemoryFiles(), codec = new SvgCodec();
  files.write('examples/other.svg', readFileSync('examples/other.svg', 'utf8'));
  const editor = new Editor(codec, files), cli = new CommandRouter(editor);
  const output = readFileSync('examples/session.txt', 'utf8').split(/\r?\n/).map(line => cli.execute(line));
  assert.deepEqual(output.filter(line => line.startsWith('error:')), [
    'error: cannot group a container into its own descendant: markers',
    'error: undo not allowed after io command'
  ]);
  assert.ok(output.includes('saved to examples/demo.svg (5 elements)'));
  assert.ok(output.some(line => line.includes('warning: assigned id rect1 to unnamed <rect>')));
  const saved = codec.decode(files.read('examples/demo.svg')).document;
  assert.equal(saved.find('c1').attributes().cx, '130');
  assert.equal(saved.find('title').text, 'My Diagram');
  assert.equal(saved.parentLabel('box'), 'g#markers');
  assert.equal(editor.document.all().length, 7);
  assert.equal(editor.document.width, 400);
});

test('two-node example restores the moved subtree and persists its updated text', () => {
  const files = new MemoryFiles(), codec = new SvgCodec();
  const editor = new Editor(codec, files), cli = new CommandRouter(editor);
  for (const line of readFileSync('examples/flowchart.txt', 'utf8').split(/\r?\n/)) {
    const output = cli.execute(line);
    assert.ok(!output.startsWith('error:'), output);
  }
  const saved = codec.decode(files.read('examples/flowchart.svg')).document;
  assert.equal(saved.all().length, 8);
  assert.equal(saved.find('process').attributes().y, '100');
  assert.equal(saved.find('process-label').attributes().y, '135');
  assert.equal(saved.find('process-label').text, '处理数据 v2');
  assert.equal(saved.parentLabel('arrow1'), 'g#flowchart');
  assert.equal(codec.encode(saved), codec.encode(editor.document));
});
