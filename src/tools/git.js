"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitToolDefinition = void 0;
exports.gitOperation = gitOperation;
const simple_git_1 = require("simple-git");
const types_1 = require("../types");
const git = (0, simple_git_1.simpleGit)();
exports.gitToolDefinition = {
    name: 'git_operation',
    description: 'Perform git operations like status, add, commit, push, pull, branch.',
    parameters: {
        type: 'object',
        properties: {
            command: { type: 'string', description: 'The git command to run (e.g., "status", "commit -m \"msg\"").' },
        },
        required: ['command'],
    },
};
async function gitOperation(command, toolCallId) {
    try {
        const args = command.split(' ');
        const result = await git[args[0]](...args.slice(1));
        return { tool_call_id: toolCallId, output: JSON.stringify(result, null, 2) };
    }
    catch (error) {
        return { tool_call_id: toolCallId, output: error.message, isError: true };
    }
}
//# sourceMappingURL=git.js.map