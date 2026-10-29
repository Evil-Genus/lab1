import { Editor } from './application/Editor.js';
import { SvgCodec } from './infrastructure/SvgCodec.js';
import { LocalFiles } from './infrastructure/LocalFiles.js';
import { CommandRouter } from './cli/CommandRouter.js';
import { Repl } from './cli/Repl.js';
await new Repl(new CommandRouter(new Editor(new SvgCodec(),new LocalFiles()))).run();

