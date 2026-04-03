import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from './core/config.js';
import { ModelAdapter } from './core/model.js';
import { SessionManager } from './core/session.js';
import { AgentLoop } from './agent/loop.js';
import { createInterface } from 'readline';

const program = new Command();
const configManager = new ConfigManager();

program
  .name('omnicode')
  .description('A powerful, model-agnostic AI coding assistant.')
  .version('1.0.0');

program
  .command('chat')
  .description('Start an interactive chat session.')
  .argument('[prompt]', 'Initial prompt to start the session.')
  .action(async (prompt) => {
    if (!configManager.validate()) {
      console.error(chalk.red('Error: API key or base URL is missing. Please set OMNICODE_API_KEY and OMNICODE_BASE_URL in your environment.'));
      process.exit(1);
    }

    const config = configManager.getConfig();
    const model = new ModelAdapter(config);
    const session = new SessionManager();
    const agent = new AgentLoop(model, session);

    console.log(chalk.blue(`OmniCode v1.0.0 - Using model: ${config.model}`));
    console.log(chalk.gray('Type "exit" to quit.\n'));

    if (prompt) {
      await agent.run(prompt, (update) => process.stdout.write(update));
    }

    const readline = createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.green('omnicode> '),
    });

    readline.prompt();

    readline.on('line', async (line: string) => {
      if (line.toLowerCase() === 'exit') {
        readline.close();
        return;
      }

      await agent.run(line, (update) => process.stdout.write(update));
      console.log('\n');
      readline.prompt();
    });
  });

program.parse(process.argv);
