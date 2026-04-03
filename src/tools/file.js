"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFileToolDefinition = exports.readFileToolDefinition = void 0;
exports.readFile = readFile;
exports.writeFile = writeFile;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const types_1 = require("../types");
exports.readFileToolDefinition = {
    name: 'read_file',
    description: 'Read the content of a file.',
    parameters: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'The path to the file.' },
        },
        required: ['path'],
    },
};
exports.writeFileToolDefinition = {
    name: 'write_file',
    description: 'Write content to a file.',
    parameters: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'The path to the file.' },
            content: { type: 'string', description: 'The content to write.' },
        },
        required: ['path', 'content'],
    },
};
async function readFile(filePath, toolCallId) {
    try {
        const content = await promises_1.default.readFile(path_1.default.resolve(filePath), 'utf-8');
        return { tool_call_id: toolCallId, output: content };
    }
    catch (error) {
        return { tool_call_id: toolCallId, output: error.message, isError: true };
    }
}
async function writeFile(filePath, content, toolCallId) {
    try {
        const fullPath = path_1.default.resolve(filePath);
        await promises_1.default.mkdir(path_1.default.dirname(fullPath), { recursive: true });
        await promises_1.default.writeFile(fullPath, content, 'utf-8');
        return { tool_call_id: toolCallId, output: `Successfully wrote to ${filePath}` };
    }
    catch (error) {
        return { tool_call_id: toolCallId, output: error.message, isError: true };
    }
}
//# sourceMappingURL=file.js.map