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
  .version('1.2.1');

// Update command - defined BEFORE chat to ensure it can run without model init
program
  .command('update')
  .description('Self-update the Forge CLI to the latest version from GitHub.')
  .action(async () => {
    console.log(chalk.cyan('Checking for updates...'));
    try {
      const repoPath = path.resolve(__dirname, '..');
      
      console.log(chalk.yellow('Fetching latest changes from GitHub...'));
      execSync('git fetch origin master', { cwd: repoPath, stdio: 'inherit' });
      
      const status = execSync('git status -uno', { cwd: repoPath }).toString();
      if (status.includes('Your branch is up to date')) {
        console.log(chalk.green('Forge is already up to date.'));
        return;
      }

      console.log(chalk.yellow('Updating local repository...'));
      execSync('git reset --hard origin/master', { cwd: repoPath, stdio: 'inherit' });
      
      console.log(chalk.yellow('Installing dependencies and rebuilding...'));
      execSync('npm install && npm run build', { cwd: repoPath, stdio: 'inherit' });
      
      console.log(chalk.green('Forge has been successfully updated to the latest version!'));
    } catch (error) {
      console.error(chalk.red('Error during update:'), error instanceof Error ? error.message : error);
      console.log(chalk.yellow('Manual update suggestion: cd to your forge directory and run git pull && npm install && npm run build'));
    }
  });

program
  .command('chat')
  .description('Start an interactive chat session.')
  .argument('[prompt]', 'Initial prompt to start the session.')
  .action(async (prompt) => {
    // Auto-configure for local models and other providers
    await configManager.autoConfigure();

    if (!configManager.validate()) {
      console.error(chalk.red('Error: API key or base URL is missing. Please set FORGE_API_KEY and FORGE_BASE_URL in your environment.'));
      process.exit(1);
    }

    const config = configManager.getConfig();
    const model = new ModelAdapter(config);
    const session = new SessionManager();
    const agent = new AgentLoop(model, session);

    // Callback for model switching
    const onModelChange = (newModel: string) => {
      configManager.switchModel(newModel);
      const updatedConfig = configManager.getConfig();
      model.updateConfig(updatedConfig);
      console.log(chalk.yellow(`\nModel switched to: ${newModel}`));
    };

    if (prompt) {
      console.log(chalk.cyan(`\nFORGE ENGINE v1.2.1 🔥 - Using model: ${config.model}`));
      await agent.run(prompt, (update) => process.stdout.write(update));
      console.log('\n');
    }

    startREPL(agent, config, onModelChange);
  });

program.parse(process.argv);
