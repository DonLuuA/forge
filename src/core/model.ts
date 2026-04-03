import OpenAI from 'openai';
import axios from 'axios';
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

  updateConfig(config: Config) {
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

  /**
   * Fetches available models from an Ollama instance.
   */
  static async fetchOllamaModels(url: string): Promise<string[]> {
    try {
      const response = await axios.get(`${url}/api/tags`);
      if (response.status === 200 && response.data.models) {
        return response.data.models.map((m: any) => m.name);
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Fetches available models from an OpenAI-compatible API.
   */
  static async fetchOpenAIModels(url: string, apiKey: string): Promise<string[]> {
    try {
      const client = new OpenAI({ baseURL: url, apiKey });
      const response = await client.models.list();
      return response.data.map(m => m.id);
    } catch (error) {
      return [];
    }
  }

  /**
   * Checks if a local model is available (e.g., Ollama).
   */
  static async checkLocalModel(url: string): Promise<boolean> {
    try {
      const response = await axios.get(`${url}/api/tags`, { timeout: 2000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
