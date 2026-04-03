import { ToolDefinition, ToolResult } from '../types/index.js';
import { shellToolDefinition, executeCommand } from './shell.js';
import { readFileToolDefinition, writeFileToolDefinition, readFile, writeFile } from './file.js';
import { gitToolDefinition, gitOperation } from './git.js';
import { searchFilesToolDefinition, grepToolDefinition, webSearchToolDefinition, searchFiles, grep, webSearch } from './search.js';
import { browserToolDefinition, browserOperation } from './browser.js';

export interface ToolEntry {
  definition: ToolDefinition;
  handler: (args: any, toolCallId: string) => Promise<ToolResult>;
}

export class ToolRegistry {
  private tools: Map<string, ToolEntry> = new Map();

  constructor() {
    this.register('execute_command', shellToolDefinition, executeCommand);
    this.register('read_file', readFileToolDefinition, readFile);
    this.register('write_file', writeFileToolDefinition, writeFile);
    this.register('git_operation', gitToolDefinition, gitOperation);
    this.register('search_files', searchFilesToolDefinition, searchFiles);
    this.register('grep', grepToolDefinition, grep);
    this.register('web_search', webSearchToolDefinition, webSearch);
    this.register('browser_operation', browserToolDefinition, browserOperation);
  }

  register(name: string, definition: ToolDefinition, handler: (args: any, toolCallId: string) => Promise<ToolResult>) {
    this.tools.set(name, { definition, handler });
  }

  getTool(name: string): ToolEntry | undefined {
    return this.tools.get(name);
  }

  getAllDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  routePrompt(prompt: string, limit: number = 8): ToolDefinition[] {
    const tokens = prompt.toLowerCase().split(/\s+/);
    const scored = Array.from(this.tools.values()).map(tool => {
      let score = 0;
      const haystacks = [
        tool.definition.name.toLowerCase(),
        tool.definition.description.toLowerCase(),
        (tool.definition.responsibility || '').toLowerCase(),
      ];
      
      for (const token of tokens) {
        if (token.length < 3) continue;
        if (haystacks.some(h => h.includes(token))) {
          score += 1;
        }
      }
      // Force vision/browser if keyword present
      if (prompt.toLowerCase().includes('vision') || prompt.toLowerCase().includes('screenshot') || prompt.toLowerCase().includes('website')) {
        if (tool.definition.name === 'browser_operation') score += 10;
      }
      return { tool, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.tool.definition);
  }
}
