import test from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../src/application/Editor.js';
import { CommandRouter } from '../src/cli/CommandRouter.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { MemoryFiles } from './MemoryFiles.js';

test('tree uses specification geometry notation through polymorphic shapes', () => {
  const cli = new CommandRouter(new Editor(new SvgCodec(), new MemoryFiles()));
  for (const command of ['init 400 200', 'create g flow',
    'create rect r 10 20 30 40 red in flow',
    'create text t 15 35 "开始" in flow',
    'create line l 40 40 100 40 black in flow']) {
    assert.ok(!cli.execute(command).startsWith('error:'));
  }
  assert.equal(cli.execute('tree'), [
    'svg (400x200)', '└── g#flow',
    '    ├── rect#r  x=10 y=20 w=30 h=40 fill=red',
    '    ├── text#t  (15,35) "开始"',
    '    └── line#l  (40,40) -> (100,40) stroke=black'
  ].join('\n'));
  assert.equal(cli.execute('tree t'), 'text#t  (15,35) "开始"');
  assert.equal(cli.execute('show r'), 'rect#r  parent=g#flow\n  x=10 y=20 width=30 height=40\n  fill=red');
  assert.equal(cli.execute('show flow'), 'g#flow  parent=svg');
});
