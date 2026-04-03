import { ModelAdapter } from '../core/model.js';
import { SessionManager } from '../core/session.js';
import { Message, ToolResult, ToolDefinition } from '../types/index.js';
import { shellToolDefinition, executeCommand } from '../tools/shell.js';
import { readFileToolDefinition, writeFileToolDefinition, readFile, writeFile } from '../tools/file.js';
import { gitToolDefinition, gitOperation } from '../tools/git.js';
import { searchFilesToolDefinition, grepToolDefinition, searchFiles, grep } from '../tools/search.js';

export class AgentLoop {
  private model: ModelAdapter;
  private session: SessionManager;
  private tools: ToolDefinition[];

  constructor(model: ModelAdapter, session: SessionManager) {
    this.model = model;
    this.session = session;
    this.tools = [
      shellToolDefinition,
      readFileToolDefinition,
      writeFileToolDefinition,
      gitToolDefinition,
      searchFilesToolDefinition,
      grepToolDefinition,
    ];
  }

  async run(userInput: string, onUpdate?: (message: string) => void) {
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

      const toolResults: ToolResult[] = [];
      for (const toolCall of response.tool_calls) {
        const { name, arguments: argsString } = toolCall.function;
        const args = JSON.parse(argsString);
        
        if (onUpdate) onUpdate(`\n[Executing ${name}...]`);

        let result: ToolResult;
        switch (name) {
          case 'execute_command':
            result = await executeCommand(args.command, toolCall.id);
            break;
          case 'read_file':
            result = await readFile(args.path, toolCall.id);
            break;
          case 'write_file':
            result = await writeFile(args.path, args.content, toolCall.id);
            break;
          case 'git_operation':
            result = await gitOperation(args.command, toolCall.id);
            break;
          case 'search_files':
            result = await searchFiles(args.pattern, toolCall.id);
            break;
          case 'grep':
            result = await grep(args.pattern, args.path, toolCall.id);
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
