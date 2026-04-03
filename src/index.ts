#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from './core/config.js';
import { ModelAdapter } from './core/model.js';
import { SessionManager } from './core/session.js';
import { AgentLoop } from './agent/loop.js';
import { startREPL } from './ui/repl.js';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();
const configManager = new ConfigManager();

program
  .name('forge')
  .description('A high-performance, universal AI coding assistant.')
  .version('2.5.0');

// Update command
program
  .command('update')
  .description('Self-update the Forge CLI to the latest version from GitHub.')
  .action(async () => {
    console.log(chalk.cyan('Checking for updates...'));
    try {
      const repoPath = path.resolve(__dirname, '..');
      execSync('git fetch origin master', { cwd: repoPath, stdio: 'inherit' });
      const status = execSync('git status -uno', { cwd: repoPath }).toString();
      if (status.includes('Your branch is up to date')) {
        console.log(chalk.green('Forge is already up to date.'));
        return;
      }
      execSync('git reset --hard origin/master', { cwd: repoPath, stdio: 'inherit' });
      execSync('npm install && npm run build', { cwd: repoPath, stdio: 'inherit' });
      console.log(chalk.green('Forge has been successfully updated to the latest version!'));
    } catch (error) {
      console.error(chalk.red('Error during update:'), error instanceof Error ? error.message : error);
    }
  });

program
  .command('chat')
  .description('Start an interactive chat session.')
  .argument('[prompt]', 'Initial prompt to start the session.')
  .action(async (prompt) => {
    await configManager.autoConfigure();

    const config = configManager.getConfig();
    const model = new ModelAdapter(config);
    const session = new SessionManager();
    const agent = new AgentLoop(model, session);

    const onModelChange = (newModel: string) => {
      configManager.switchModel(newModel);
      const updatedConfig = configManager.getConfig();
      model.updateConfig(updatedConfig);
      agent.updateModel(model);
    };

    const onKeyUpdate = (provider: string, key: string) => {
      configManager.updateProviderKey(provider, key);
      const updatedConfig = configManager.getConfig();
      model.updateConfig(updatedConfig);
      agent.updateModel(model);
    };

    if (prompt) {
      console.log(chalk.hex('#CD7F32').bold(`\n⚒ OPEN FORGE v2.5.0 - CAPABLE AGENT 🔥`));
      console.log(chalk.gray(`CORE: ${config.model} | STATUS: READY`));
      console.log(chalk.cyan('👐 HANDS: ENABLED ') + chalk.magenta('👁 VISION: ACTIVE\n'));
      await agent.run(prompt, (update) => process.stdout.write(update));
      console.log('\n');
    }

    startREPL(agent, config, onModelChange, onKeyUpdate);
  });

program.parse(process.argv);
