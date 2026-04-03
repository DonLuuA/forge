export interface Config {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: object;
}

export interface ToolResult {
  tool_call_id: string;
  output: string;
  isError?: boolean;
}

export interface Session {
  id: string;
  messages: Message[];
  startTime: Date;
  lastUpdated: Date;
}
