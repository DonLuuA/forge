import { simpleGit } from 'simple-git';
import { ToolDefinition, ToolResult } from '../types/index.js';

const git = simpleGit();

export const gitToolDefinition: ToolDefinition = {
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

export async function gitOperation(command: string, toolCallId: string): Promise<ToolResult> {
  try {
    const args = command.split(' ');
    const result = await (git as any)[args[0]](...args.slice(1));
    return { tool_call_id: toolCallId, output: JSON.stringify(result, null, 2) };
  } catch (error: any) {
    return { tool_call_id: toolCallId, output: error.message, isError: true };
  }
}
