"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("./core/config");
const model_1 = require("./core/model");
const session_1 = require("./core/session");
const loop_1 = require("./agent/loop");
const program = new commander_1.Command();
const configManager = new config_1.ConfigManager();
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
        console.error(chalk_1.default.red('Error: API key or base URL is missing. Please set OMNICODE_API_KEY and OMNICODE_BASE_URL in your environment.'));
        process.exit(1);
    }
    const config = configManager.getConfig();
    const model = new model_1.ModelAdapter(config);
    const session = new session_1.SessionManager();
    const agent = new loop_1.AgentLoop(model, session);
    console.log(chalk_1.default.blue(`OmniCode v1.0.0 - Using model: ${config.model}`));
    console.log(chalk_1.default.gray('Type "exit" to quit.\n'));
    if (prompt) {
        await agent.run(prompt, (update) => process.stdout.write(update));
    }
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk_1.default.green('omnicode> '),
    });
    readline.prompt();
    readline.on('line', async (line) => {
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
//# sourceMappingURL=index.js.map