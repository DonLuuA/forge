export interface Config {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  maxTurns?: number;
  maxBudgetTokens?: number;
  compactAfterTurns?: number;
  providers?: ProviderConfig[];
}

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
  isActive: boolean;
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
  responsibility?: string;
  sourceHint?: string;
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
  totalUsage: UsageSummary;
}

export interface UsageSummary {
  inputTokens: number;
  outputTokens: number;
}

export interface PermissionDenial {
  toolName: string;
  reason: string;
}
