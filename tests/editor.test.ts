import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Editor } from '../src/application/Editor.js';
import { CommandRouter } from '../src/cli/CommandRouter.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { LocalFiles } from '../src/infrastructure/LocalFiles.js';
import { MemoryFiles } from './MemoryFiles.js';

const setup = () => {
  const files = new MemoryFiles(), codec = new SvgCodec(), editor = new Editor(codec,files), cli = new CommandRouter(editor);
  const run = (command: string): string => cli.execute(command);
  const ok = (command: string): string => { const result = run(command); assert.ok(!result.startsWith('error:'),result); return result; };
  return {files,codec,editor,run,ok};
};
const svg = (content: string) => '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' + content + '</svg>';

test('no document, help, comments, quotes and invalid syntax', () => {
  const {run,ok} = setup();
  assert.equal(run('tree'),"error: no document. use 'init' or 'read' first");
  assert.match(ok('help'),/create/); assert.equal(run('  # comment'),'');
  ok('init'); ok('create text t 1 2 "中文 & <hello> \\"world\\""');
  assert.match(ok('show t'),/中文/);
  assert.match(run('set t text "unfinished'),/^error: unterminated quote$/);
  assert.match(run('move t 1'),/^error: usage:/);
  assert.match(run('constructor'),/^error: unknown command:/);
});

test('all six shapes, defaults, decimals, factory rejection, strict attributes', () => {
  const {ok,run,editor} = setup(); ok('init');
  for (const c of ['create rect r 1.5 2 3 4','create circle c 1 2 3 red','create ellipse e 1 2 3 4','create line l 1 2 3 4 black','create text t 1 2 ""','create g g']) ok(c);
  assert.equal(editor.document.all().length,6);
  assert.equal(editor.document.find('r').attributes().fill,undefined);
  assert.match(run('create box b 0 0 1 1 "x"'),/unknown shape type: box/);
  assert.match(run('create rect r 0 0 1 1'),/id already exists: r/);
  assert.match(run('set r id new'),/unknown attribute: id/);
  assert.match(run('set r width -1'),/non-negative/);
  assert.match(run('scale g 0'),/scale factor must be positive/);
  assert.match(run('move r NaN 1'),/finite number/);
  assert.match(run('set r constructor 1'),/unknown attribute/);
});

test('create in containers, recursive move and scale, style on group', () => {
  const {ok,run,editor} = setup(); ok('init');
  ok('create g outer'); ok('create g inner in outer');
  ok('create rect r 10 20 30 40 in inner'); ok('create text t 10 20 "hello" in inner');
  ok('move outer 5 -10'); ok('scale outer 2'); ok('set outer fill red');
  assert.deepEqual(editor.document.find('r').attributes(),{x:'30',y:'20',width:'60',height:'80'});
  assert.equal(editor.document.find('t').text,'hello');
  assert.equal(editor.document.find('outer').attributes().fill,'red');
  assert.match(run('create g bad in r'),/not a container: r/);
  assert.match(run('create g bad in missing'),/no such container: missing/);
});

test('failed edit is atomic and preserves redo including recursive overflow', () => {
  const {ok,run,codec,editor} = setup(); ok('init'); ok('create g g');
  ok('create rect a 1 2 3 4 in g'); ok('create rect b 1e308 2 3 4 in g');
  ok('move a 2 0'); ok('undo');
  const before = codec.encode(editor.document);
  assert.match(run('scale g 2'),/finite number/);
  assert.equal(codec.encode(editor.document),before);
  ok('redo'); assert.equal(editor.document.find('a').attributes().x,'3');
});

test('group preserves document order and undo restores original parents and indices', () => {
  const {ok,editor,codec} = setup(); ok('init');
  ok('create g p'); ok('create g q'); ok('create rect a 1 2 3 4 in p'); ok('create circle b 1 2 3 in q');
  const before = codec.encode(editor.document);
  ok('group g b a');
  assert.deepEqual(editor.document.find('g').children.map(s=>s.id),['a','b']);
  ok('undo'); assert.equal(codec.encode(editor.document),before); ok('redo');
  assert.equal(editor.document.parentLabel('a'),'g#g');
});

test('same-parent group insertion and nested ungroup preserve z order', () => {
  const {ok,run,editor} = setup(); ok('init'); ok('create g scene');
  for (const id of ['a','b','c','d']) ok('create g ' + id + ' in scene');
  ok('group pair c a');
  assert.deepEqual(editor.document.find('scene').children.map(s=>s.id),['pair','b','d']);
  assert.deepEqual(editor.document.find('pair').children.map(s=>s.id),['a','c']);
  ok('ungroup pair');
  assert.deepEqual(editor.document.find('scene').children.map(s=>s.id),['a','c','b','d']);
  ok('undo'); assert.equal(editor.document.find('pair').children.length,2);
  assert.match(run('ungroup scene'),/cannot ungroup top-level container: scene/);
});

test('cycle, duplicate selection and ancestor group rejected without mutation', () => {
  const {ok,run,codec,editor} = setup(); ok('init'); ok('create g p'); ok('create g q in p');
  const before = codec.encode(editor.document);
  for (const c of ['group bad p q','group bad q q','addto q p','addto p p','group bad p missing'])
    assert.match(run(c),/^error:/);
  assert.equal(codec.encode(editor.document),before);
});

test('front, back, addto, delete subtree and undo restore exact document', () => {
  const {ok,editor,codec} = setup(); ok('init'); ok('create g p'); ok('create g q');
  ok('create circle a 1 2 3 in p'); ok('create circle b 4 5 6 in p');
  ok('front a'); assert.deepEqual(editor.document.find('p').children.map(s=>s.id),['b','a']);
  ok('back a'); assert.deepEqual(editor.document.find('p').children.map(s=>s.id),['a','b']);
  const before = codec.encode(editor.document); ok('addto q a'); ok('undo'); assert.equal(codec.encode(editor.document),before);
  ok('delete p'); assert.throws(()=>editor.document.find('a')); ok('undo'); assert.equal(codec.encode(editor.document),before);
});

test('new edit clears redo, display does not affect undo, failed edit preserves it', () => {
  const {ok,run,editor} = setup(); ok('init'); ok('create circle c 1 2 3'); ok('move c 1 0'); ok('undo');
  ok('show c'); ok('tree c'); ok('help'); ok('canvas'); ok('set c r 4');
  assert.match(run('redo'),/nothing to redo/); ok('undo');
  assert.equal(editor.document.find('c').attributes().r,'3');
});

test('successful IO commands block both undo and redo until a new edit', () => {
  const {ok,run} = setup(); ok('init'); ok('create g g');
  for (const c of ['save a.svg','save','read a.svg','canvas 500 400','init']) {
    ok(c);
    assert.equal(run('undo'),'error: undo not allowed after io command');
    assert.equal(run('redo'),'error: undo not allowed after io command');
    ok('create g fresh'); ok('undo');
  }
});

test('failed IO and resize preserve document, path and undo history', () => {
  const {ok,run,files,editor,codec} = setup(); ok('init'); ok('create g g'); ok('save good.svg'); ok('move g 1 2');
  const before = codec.encode(editor.document);
  files.failWrites = true;
  assert.equal(run('save bad.svg'),'error: cannot write file: bad.svg');
  assert.equal(run('read absent.svg'),'error: cannot read file: absent.svg');
  assert.match(run('canvas -2 10'),/^error:/); assert.match(run('init -1'),/^error:/);
  assert.equal(codec.encode(editor.document),before); ok('undo');
  files.failWrites = false; assert.match(ok('save'),/good.svg/);
});

test('SVG round trip preserves all types, hierarchy, text escaping and styles', () => {
  const {ok,codec,editor} = setup(); ok('init'); ok('create g root');
  for (const c of ['create rect r 0 0 10 20 red','create circle c 3 4 5','create ellipse e 1 2 3 4','create line l 0 1 2 3 black','create text t 2 3 "<中文> & \\"quoted\\""']) ok(c + ' in root');
  ok('set r stroke-width 2');
  const encoded = codec.encode(editor.document), result = codec.decode(encoded);
  assert.equal(codec.encode(result.document),encoded); assert.deepEqual(result.warnings,[]);
});

test('automatic IDs reserve later explicit IDs and report warnings', () => {
  const codec = new SvgCodec();
  const result = codec.decode(svg('<rect/><rect id="rect1"/><g><rect/></g>'));
  assert.deepEqual(result.document.all().map(s=>s.id),['rect2','rect1','g1','rect3']);
  assert.equal(result.warnings[0],'warning: assigned id rect2 to unnamed <rect>');
});

test('SVG malformed/unsupported/duplicate/DTD inputs fail atomically', () => {
  const {ok,run,files,codec,editor} = setup(); ok('init'); ok('create g g');
  const before = codec.encode(editor.document);
  for (const text of [svg('<rect id="a"/><g id="a"/>'),svg('<path/>'),svg('<rect x="bad"/>'),svg('<g>text</g>'),svg('<g>'),'<svg/>','<!DOCTYPE svg>' + svg(''),svg('<rect onclick="bad"/>'),svg('<g transform="rotate(10)"/>')]) {
    files.write('bad.svg',text); assert.match(run('read bad.svg'),/^error:/); assert.equal(codec.encode(editor.document),before);
  }
  ok('undo'); assert.equal(editor.document.all().length,0);
});

test('nested translate and scale import obey SVG transform order', () => {
  const {document} = new SvgCodec().decode(svg('<g id="a" transform="translate(60,40)"><g id="b" transform="translate(200,0) scale(0.8)"><rect id="r" x="10" y="20" width="120" height="60"/></g></g>'));
  assert.deepEqual(document.find('r').attributes(),{x:'268',y:'56',width:'96',height:'48'});
});

test('canvas-name IDs remain ordinary user IDs', () => {
  const {ok} = setup(); ok('init'); ok('create g __canvas__'); ok('create g parent'); ok('addto parent __canvas__');
  ok('group combined parent'); ok('undo');
});

test('filesystem save replaces valid file and round trips', () => {
  const dir = mkdtempSync(join(tmpdir(),'lab1-'));
  try {
    const files = new LocalFiles(), path = join(dir,'example.svg');
    files.write(path,'first'); files.write(path,'second'); assert.equal(files.read(path),'second');
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

test('real CLI accepts piped comments, continues after errors and writes SVG', () => {
  const dir = mkdtempSync(join(tmpdir(),'lab1-cli-'));
  try {
    const path = join(dir,'out.svg');
    const result = spawnSync(process.execPath,['dist/src/main.js'],{
      input:'# comment\ninit\ncreate rect r 10 20 30 40 red\nscale r 0\nmove r 5 6\nsave "' + path + '"\n',
      encoding:'utf8'
    });
    assert.equal(result.status,0,result.stderr); assert.match(result.stdout,/error: scale factor/);
    const document = new SvgCodec().decode(readFileSync(path,'utf8')).document;
    assert.equal(document.find('r').attributes().x,'15');
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

