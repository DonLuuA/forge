"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.grepToolDefinition = exports.searchFilesToolDefinition = void 0;
exports.searchFiles = searchFiles;
exports.grep = grep;
const fast_glob_1 = __importDefault(require("fast-glob"));
const promises_1 = __importDefault(require("fs/promises"));
const types_1 = require("../types");
exports.searchFilesToolDefinition = {
    name: 'search_files',
    description: 'Search for files using glob patterns.',
    parameters: {
        type: 'object',
        properties: {
            pattern: { type: 'string', description: 'The glob pattern to search for (e.g., "**/*.ts").' },
        },
        required: ['pattern'],
    },
};
exports.grepToolDefinition = {
    name: 'grep',
    description: 'Search for text within files.',
    parameters: {
        type: 'object',
        properties: {
            pattern: { type: 'string', description: 'The regex pattern to search for.' },
            path: { type: 'string', description: 'The directory or file to search in.' },
        },
        required: ['pattern', 'path'],
    },
};
async function searchFiles(pattern, toolCallId) {
    try {
        const files = await (0, fast_glob_1.default)(pattern, { ignore: ['node_modules/**'] });
        return { tool_call_id: toolCallId, output: files.join('\n') };
    }
    catch (error) {
        return { tool_call_id: toolCallId, output: error.message, isError: true };
    }
}
async function grep(pattern, searchPath, toolCallId) {
    try {
        const files = await (0, fast_glob_1.default)(`${searchPath}/**/*`, { ignore: ['node_modules/**'], absolute: true });
        const results = [];
        const regex = new RegExp(pattern);
        for (const file of files) {
            const stats = await promises_1.default.stat(file);
            if (stats.isFile()) {
                const content = await promises_1.default.readFile(file, 'utf-8');
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    if (regex.test(line)) {
                        results.push(`${file}:${index + 1}: ${line.trim()}`);
                    }
                });
            }
        }
        return { tool_call_id: toolCallId, output: results.join('\n') || 'No matches found.' };
    }
    catch (error) {
        return { tool_call_id: toolCallId, output: error.message, isError: true };
    }
}
//# sourceMappingURL=search.js.map