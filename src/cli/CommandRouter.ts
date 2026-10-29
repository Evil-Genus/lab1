import { Editor } from '../application/Editor.js';
import { Presenter } from '../application/Presenter.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
import { Numbers } from '../domain/Numbers.js';
import { Tokenizer } from './Tokenizer.js';
import { CreateCommand } from '../commands/CreateCommand.js';
import { DeleteCommand } from '../commands/DeleteCommand.js';
import { MoveCommand } from '../commands/MoveCommand.js';
import { ScaleCommand } from '../commands/ScaleCommand.js';
import { SetCommand } from '../commands/SetCommand.js';
import { GroupCommand } from '../commands/GroupCommand.js';
import { UngroupCommand } from '../commands/UngroupCommand.js';
import { AddToCommand } from '../commands/AddToCommand.js';
import { ReorderCommand } from '../commands/ReorderCommand.js';
export class CommandRouter {
  private readonly tokenizer = new Tokenizer();
  private readonly factory = new ShapeFactory();
  private readonly presenter = new Presenter();
  // Only command-name dispatch point. Phase 2: externally registered commands.
  private readonly handlers: Record<string, {syntax: string; min: number; max: number; run: (args: string[])=>string}>;
  constructor(private readonly editor: Editor) {
    this.handlers = {
      init:{syntax:'init [w] [h]',min:0,max:2,run:a=>editor.init(a[0] === undefined ? 800 : Numbers.parse(a[0]),a[1] === undefined ? 600 : Numbers.parse(a[1]))},
      read:{syntax:'read <file.svg>',min:1,max:1,run:a=>editor.read(a[0])},
      save:{syntax:'save [file.svg]',min:0,max:1,run:a=>editor.save(a[0])},
      canvas:{syntax:'canvas [w h]',min:0,max:2,run:a=>{ if(a.length === 1) throw new Error('usage: canvas [w h]'); return editor.canvas(a.length ? Numbers.parse(a[0]) : undefined,a.length ? Numbers.parse(a[1]) : undefined); }},
      create:{syntax:'create <rect|circle|ellipse|line|text|g> <id> [params] [in <containerId>]',min:2,max:Infinity,run:a=>this.create(a)},
      delete:{syntax:'delete <id>',min:1,max:1,run:a=>editor.edit(new DeleteCommand(a[0]))},
      move:{syntax:'move <id> <dx> <dy>',min:3,max:3,run:a=>editor.edit(new MoveCommand(a[0],Numbers.parse(a[1]),Numbers.parse(a[2])))},
      scale:{syntax:'scale <id> <factor>',min:2,max:2,run:a=>editor.edit(new ScaleCommand(a[0],Numbers.parse(a[1])))},
      set:{syntax:'set <id> <attr> <value>',min:3,max:3,run:a=>editor.edit(new SetCommand(a[0],a[1],a[2]))},
      group:{syntax:'group <newGid> <id1> [id2 ...]',min:2,max:Infinity,run:a=>editor.edit(new GroupCommand(a[0],a.slice(1)))},
      ungroup:{syntax:'ungroup <gid>',min:1,max:1,run:a=>editor.edit(new UngroupCommand(a[0]))},
      addto:{syntax:'addto <gid> <id>',min:2,max:2,run:a=>editor.edit(new AddToCommand(a[0],a[1]))},
      front:{syntax:'front <id>',min:1,max:1,run:a=>editor.edit(new ReorderCommand(a[0],true))},
      back:{syntax:'back <id>',min:1,max:1,run:a=>editor.edit(new ReorderCommand(a[0],false))},
      tree:{syntax:'tree [id]',min:0,max:1,run:a=>this.presenter.tree(editor.document,a[0])},
      show:{syntax:'show <id>',min:1,max:1,run:a=>this.presenter.show(editor.document,a[0])},
      undo:{syntax:'undo',min:0,max:0,run:()=>editor.undo()},
      redo:{syntax:'redo',min:0,max:0,run:()=>editor.redo()},
      help:{syntax:'help',min:0,max:0,run:()=>Object.values(this.handlers).map(h=>h.syntax).join('\n') + '\nrect: x y w h [fill]; circle: cx cy r [fill]; ellipse: cx cy rx ry [fill]\nline: x1 y1 x2 y2 [stroke]; text: x y "content"; g: (no params)'}
    };
  }
  execute(line: string): string {
    try {
      const tokens = this.tokenizer.parse(line);
      if (!tokens.length) return '';
      const [name,...args] = tokens;
      if (!Object.hasOwn(this.handlers,name)) throw new Error('unknown command: ' + name);
      const handler = this.handlers[name];
      if (args.length < handler.min || args.length > handler.max) throw new Error('usage: ' + handler.syntax);
      if (!['init','read','help'].includes(name)) this.editor.document;
      return handler.run(args);
    } catch (error) { return 'error: ' + (error instanceof Error ? error.message : String(error)).replace(/[\r\n]+/g,' '); }
  }
  private create(args: string[]): string {
    const [type,id,...params] = args;
    let parent: string | undefined;
    if (params.length >= 2 && params.at(-2) === 'in') { parent=params.pop(); params.pop(); }
    return this.editor.edit(new CreateCommand(this.factory.create(type,id,params),parent));
  }
}
