"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shellToolDefinition = void 0;
exports.executeCommand = executeCommand;
const child_process_1 = require("child_process");
const util_1 = require("util");
const types_1 = require("../types");
const execPromise = (0, util_1.promisify)(child_process_1.exec);
exports.shellToolDefinition = {
    name: 'execute_command',
    description: 'Execute a shell command in the current directory.',
    parameters: {
        type: 'object',
        properties: {
            command: {
                type: 'string',
                description: 'The shell command to execute.',
            },
        },
        required: ['command'],
    },
};
async function executeCommand(command, toolCallId) {
    try {
        const { stdout, stderr } = await execPromise(command);
        return {
            tool_call_id: toolCallId,
            output: stdout + (stderr ? `\nErrors:\n${stderr}` : ''),
        };
    }
    catch (error) {
        return {
            tool_call_id: toolCallId,
            output: error.message,
            isError: true,
        };
    }
}
//# sourceMappingURL=shell.js.map