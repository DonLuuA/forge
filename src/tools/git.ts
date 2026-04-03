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

export async function gitOperation({ command }: { command: string }, toolCallId: string): Promise<ToolResult> {
  try {
    // Use raw command to handle complex arguments and quoting
    const result = await git.raw(command.split(/\s+/));
    return { tool_call_id: toolCallId, output: typeof result === 'string' ? result : JSON.stringify(result, null, 2) };
  } catch (error: any) {
    return { tool_call_id: toolCallId, output: error.message, isError: true };
  }
}
