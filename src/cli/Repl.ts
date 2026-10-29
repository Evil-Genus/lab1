import { createInterface } from 'node:readline';
import { CommandRouter } from './CommandRouter.js';
export class Repl {
  constructor(private readonly router: CommandRouter) {}
  async run(): Promise<void> {
    const terminal = Boolean(process.stdin.isTTY && process.stdout.isTTY);
    const input = createInterface({input:process.stdin,output:process.stdout,terminal});
    console.log("svg-editor 0.1 — type 'help' for commands");
    if (terminal) { input.setPrompt('svg> '); input.prompt(); }
    for await (const line of input) {
      const result = this.router.execute(line);
      if (result) console.log(result);
      if (terminal) input.prompt();
    }
  }
}
