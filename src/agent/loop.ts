import { ModelAdapter } from '../core/model.js';
import { SessionManager } from '../core/session.js';
import { Message, ToolResult, ToolDefinition } from '../types/index.js';
import { ToolRegistry } from '../tools/registry.js';

export class AgentLoop {
  private model: ModelAdapter;
  private session: SessionManager;
  private registry: ToolRegistry;

  constructor(model: ModelAdapter, session: SessionManager) {
    this.model = model;
    this.session = session;
    this.registry = new ToolRegistry();
  }

  async run(userInput: string, onUpdate?: (message: string) => void) {
    this.session.addMessage({ role: 'user', content: userInput });

    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      let messages = this.session.getMessages();
      
      // Inject system prompt if not present
      const config = this.model.getConfig();
      if (config.systemPrompt && !messages.some(m => m.role === 'system')) {
        messages = [{ role: 'system', content: config.systemPrompt }, ...messages];
      }

      // Intelligent Tool Routing: Route based on the last user message or the initial input
      const routingInput = messages.filter(m => m.role === 'user').pop()?.content || userInput;
      const relevantTools = this.registry.routePrompt(routingInput);
      const toolsToProvide = relevantTools.length > 0 ? relevantTools : this.registry.getAllDefinitions();

      const response = await this.model.chat(messages, toolsToProvide);
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

        const toolEntry = this.registry.getTool(name);
        let result: ToolResult;

        if (toolEntry) {
          // Dynamically call the tool handler based on its name and arguments
          result = await toolEntry.handler(args, toolCall.id);
        } else {
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

      // Advanced Context Compaction
      if (this.session.getMessages().length > 12) {
        if (onUpdate) onUpdate('\n[Compacting context...]');
        await this.session.compact(this.model);
      }

      iterations++;
    }
  }
}
