import OpenAI from 'openai';
import { Config, Message, ToolDefinition } from '../types/index.js';

export class ModelAdapter {
  private client: OpenAI;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }

  getConfig(): Config {
    return this.config;
  }

  async chat(messages: Message[], tools?: ToolDefinition[]): Promise<Message> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages as any,
        tools: tools?.map(t => ({ type: 'function', function: t })) as any,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const choice = response.choices[0].message;
      return {
        role: choice.role as any,
        content: choice.content || '',
        tool_calls: choice.tool_calls as any,
      };
    } catch (error: any) {
      console.error(`Error calling model ${this.config.model}:`, error.message);
      throw error;
    }
  }

  async *streamChat(messages: Message[], tools?: ToolDefinition[]) {
    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      messages: messages as any,
      tools: tools?.map(t => ({ type: 'function', function: t })) as any,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      yield chunk.choices[0]?.delta;
    }
  }

  // Helper to check if a local model is available (e.g., Ollama)
  static async checkLocalModel(url: string): Promise<boolean> {
    try {
      const response = await fetch(`${url}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
