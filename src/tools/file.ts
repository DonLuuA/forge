import fs from 'fs/promises';
import path from 'path';
import { ToolDefinition, ToolResult } from '../types/index.js';

export const readFileToolDefinition: ToolDefinition = {
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

export const writeFileToolDefinition: ToolDefinition = {
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

export async function readFile({ path: filePath }: { path: string }, toolCallId: string): Promise<ToolResult> {
  try {
    const content = await fs.readFile(path.resolve(filePath), 'utf-8');
    return { tool_call_id: toolCallId, output: content };
  } catch (error: any) {
    return { tool_call_id: toolCallId, output: error.message, isError: true };
  }
}

export async function writeFile({ path: filePath, content }: { path: string, content: string }, toolCallId: string): Promise<ToolResult> {
  try {
    const fullPath = path.resolve(filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
    return { tool_call_id: toolCallId, output: `Successfully wrote to ${filePath}` };
  } catch (error: any) {
    return { tool_call_id: toolCallId, output: error.message, isError: true };
  }
}
