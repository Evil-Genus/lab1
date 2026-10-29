import test from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../src/application/Editor.js';
import { CommandRouter } from '../src/cli/CommandRouter.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { MemoryFiles } from './MemoryFiles.js';

test('missing IDs use the common error except the explicit create-in contract', () => {
  const editor = new Editor(new SvgCodec(), new MemoryFiles());
  const cli = new CommandRouter(editor);
  cli.execute('init'); cli.execute('create g scene');
  const before = cli.execute('tree');
  for (const command of ['delete missing', 'move missing 1 1', 'scale missing 2',
    'set missing fill red', 'group pair scene missing', 'ungroup missing',
    'addto missing scene', 'addto scene missing', 'front missing', 'back missing',
    'show missing', 'tree missing']) {
    assert.equal(cli.execute(command), 'error: no such shape: missing', command);
    assert.equal(cli.execute('tree'), before, command);
  }
  assert.equal(cli.execute('create g child in missing'), 'error: no such container: missing');
  assert.ok(!cli.execute('undo').startsWith('error:'));
  assert.equal(editor.document.all().length, 0, 'failed commands must not consume history');
});
