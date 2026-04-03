import fg from 'fast-glob';
import fs from 'fs/promises';
import { ToolDefinition, ToolResult } from '../types/index.js';

export const searchFilesToolDefinition: ToolDefinition = {
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

export const grepToolDefinition: ToolDefinition = {
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

export async function searchFiles({ pattern }: { pattern: string }, toolCallId: string): Promise<ToolResult> {
  try {
    const files = await fg(pattern, { ignore: ['node_modules/**'] });
    return { tool_call_id: toolCallId, output: files.join('\n') };
  } catch (error: any) {
    return { tool_call_id: toolCallId, output: error.message, isError: true };
  }
}

export async function grep({ pattern, path: searchPath }: { pattern: string, path: string }, toolCallId: string): Promise<ToolResult> {
  try {
    const files = await fg(`${searchPath}/**/*`, { ignore: ['node_modules/**'], absolute: true });
    const results: string[] = [];
    const regex = new RegExp(pattern);

    for (const file of files) {
      const stats = await fs.stat(file);
      if (stats.isFile() && stats.size < 1024 * 1024) { // Skip files larger than 1MB
        const content = await fs.readFile(file, 'utf-8');
        // Simple check for binary content
        if (content.includes('\0')) continue;
        
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (regex.test(line)) {
            results.push(`${file}:${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
    return { tool_call_id: toolCallId, output: results.join('\n') || 'No matches found.' };
  } catch (error: any) {
    return { tool_call_id: toolCallId, output: error.message, isError: true };
  }
}
