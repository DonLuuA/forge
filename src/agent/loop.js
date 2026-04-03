"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentLoop = void 0;
const model_1 = require("../core/model");
const session_1 = require("../core/session");
const types_1 = require("../types");
const shell_1 = require("../tools/shell");
const file_1 = require("../tools/file");
const git_1 = require("../tools/git");
const search_1 = require("../tools/search");
class AgentLoop {
    model;
    session;
    tools;
    constructor(model, session) {
        this.model = model;
        this.session = session;
        this.tools = [
            shell_1.shellToolDefinition,
            file_1.readFileToolDefinition,
            file_1.writeFileToolDefinition,
            git_1.gitToolDefinition,
            search_1.searchFilesToolDefinition,
            search_1.grepToolDefinition,
        ];
    }
    async run(userInput, onUpdate) {
        this.session.addMessage({ role: 'user', content: userInput });
        let iterations = 0;
        const maxIterations = 10;
        while (iterations < maxIterations) {
            const messages = this.session.getMessages();
            const response = await this.model.chat(messages, this.tools);
            this.session.addMessage(response);
            if (response.content && onUpdate) {
                onUpdate(response.content);
            }
            if (!response.tool_calls || response.tool_calls.length === 0) {
                break;
            }
            const toolResults = [];
            for (const toolCall of response.tool_calls) {
                const { name, arguments: argsString } = toolCall.function;
                const args = JSON.parse(argsString);
                if (onUpdate)
                    onUpdate(`\n[Executing ${name}...]`);
                let result;
                switch (name) {
                    case 'execute_command':
                        result = await (0, shell_1.executeCommand)(args.command, toolCall.id);
                        break;
                    case 'read_file':
                        result = await (0, file_1.readFile)(args.path, toolCall.id);
                        break;
                    case 'write_file':
                        result = await (0, file_1.writeFile)(args.path, args.content, toolCall.id);
                        break;
                    case 'git_operation':
                        result = await (0, git_1.gitOperation)(args.command, toolCall.id);
                        break;
                    case 'search_files':
                        result = await (0, search_1.searchFiles)(args.pattern, toolCall.id);
                        break;
                    case 'grep':
                        result = await (0, search_1.grep)(args.pattern, args.path, toolCall.id);
                        break;
                    default:
                        result = { tool_call_id: toolCall.id, output: `Unknown tool: ${name}`, isError: true };
                }
                toolResults.push(result);
            }
            for (const result of toolResults) {
                this.session.addMessage({
                    role: 'tool',
                    tool_call_id: result.tool_call_id,
                    content: result.output,
                    name: response.tool_calls.find(tc => tc.id === result.tool_call_id)?.function.name,
                });
            }
            iterations++;
        }
    }
}
exports.AgentLoop = AgentLoop;
//# sourceMappingURL=loop.js.map