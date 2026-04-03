import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolDefinition, ToolResult } from '../types/index.js';

const execPromise = promisify(exec);

export const shellToolDefinition: ToolDefinition = {
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

export async function executeCommand(command: string, toolCallId: string): Promise<ToolResult> {
  try {
    const { stdout, stderr } = await execPromise(command);
    return {
      tool_call_id: toolCallId,
      output: stdout + (stderr ? `\nErrors:\n${stderr}` : ''),
    };
  } catch (error: any) {
    return {
      tool_call_id: toolCallId,
      output: error.message,
      isError: true,
    };
  }
}
