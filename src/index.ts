import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from './core/config.js';
import { ModelAdapter } from './core/model.js';
import { SessionManager } from './core/session.js';
import { AgentLoop } from './agent/loop.js';
import { startREPL } from './ui/repl.js';

const program = new Command();
const configManager = new ConfigManager();

program
  .name('forge')
  .description('A high-performance, universal AI coding assistant.')
  .version('1.0.0');

program
  .command('chat')
  .description('Start an interactive chat session.')
  .argument('[prompt]', 'Initial prompt to start the session.')
  .action(async (prompt) => {
    // Auto-configure for local models
    await configManager.autoConfigure();

    if (!configManager.validate()) {
      console.error(chalk.red('Error: API key or base URL is missing. Please set FORGE_API_KEY and FORGE_BASE_URL in your environment.'));
      process.exit(1);
    }

    const config = configManager.getConfig();
    const model = new ModelAdapter(config);
    const session = new SessionManager();
    const agent = new AgentLoop(model, session);

    if (prompt) {
      console.log(chalk.blue(`Forge v1.0.0 - Using model: ${config.model}`));
      await agent.run(prompt, (update) => process.stdout.write(update));
      console.log('\n');
    }

    startREPL(agent, config);
  });

program.parse(process.argv);
