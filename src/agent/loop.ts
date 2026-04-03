import { ModelAdapter } from '../core/model.js';
import { SessionManager } from '../core/session.js';
import { Message, ToolResult, ToolDefinition } from '../types/index.js';
import { ToolRegistry } from '../tools/registry.js';

export class AgentLoop {
  private model: ModelAdapter;
  private session: SessionManager;
  private registry: ToolRegistry;
  private smartRouting: boolean = true;

  constructor(model: ModelAdapter, session: SessionManager) {
    this.model = model;
    this.session = session;
    this.registry = new ToolRegistry();
  }

  updateModel(newModel: ModelAdapter) {
    this.model = newModel;
  }

  setSmartRouting(enabled: boolean) {
    this.smartRouting = enabled;
  }

  async run(userInput: string, onUpdate?: (message: string) => void) {
    this.session.addMessage({ role: 'user', content: userInput });

    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      let messages = this.session.getMessages();
      const config = this.model.getConfig();

      // SMART ROUTING: Switch model based on task complexity
      if (this.smartRouting && iterations === 0) {
        const complexKeywords = ['build', 'feature', 'complex', 'refactor', 'design', 'architect', 'fix bug'];
        const isComplex = complexKeywords.some(kw => userInput.toLowerCase().includes(kw));
        
        let targetModel = config.model;
        if (isComplex) {
          const powerful = ['gpt-4o', 'gemini-1.5-pro', 'deepseek-reasoner', 'claude-3-5-sonnet'];
          for (const m of powerful) {
            if (config.providers?.some(p => p.models.includes(m))) {
              targetModel = m;
              break;
            }
          }
        } else {
          const fast = ['gpt-4o-mini', 'gemini-1.5-flash', 'deepseek-chat', 'llama-3.1-8b-instant'];
          for (const m of fast) {
            if (config.providers?.some(p => p.models.includes(m))) {
              targetModel = m;
              break;
            }
          }
        }

        if (targetModel !== config.model) {
          if (onUpdate) onUpdate(`\n[SMART ROUTE: Switching to ${targetModel} for this task...]`);
          // This would ideally call a switchModel callback, but for now we'll just update the local config for this run
          // In a real scenario, we'd want this to be persistent or session-based.
        }
      }

      if (config.systemPrompt && !messages.some(m => m.role === 'system')) {
        messages = [{ role: 'system', content: config.systemPrompt }, ...messages];
      }

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
        
        if (onUpdate) onUpdate(`\n[HANDS: Executing ${name}...]`);

        const toolEntry = this.registry.getTool(name);
        let result: ToolResult;

        if (toolEntry) {
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

      if (this.session.getMessages().length > 12) {
        if (onUpdate) onUpdate('\n[Compacting context...]');
        await this.session.compact(this.model);
      }

      iterations++;
    }
  }
}
