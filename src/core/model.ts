import OpenAI from 'openai';
import axios from 'axios';
import { Config, Message, ToolDefinition } from '../types/index.js';

export class ModelAdapter {
  private client: OpenAI;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.client = this.createClient(config);
  }

  private createClient(config: Config): OpenAI {
    // Handle Gemini specifically if the baseUrl is for Google
    const isGemini = config.baseUrl.includes('generativelanguage.googleapis.com');
    
    return new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      // Gemini requires a specific header if using OpenAI-compatible endpoint
      defaultHeaders: isGemini ? { 'x-goog-api-key': config.apiKey } : undefined,
    });
  }

  updateConfig(config: Config) {
    this.config = config;
    this.client = this.createClient(config);
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
      const provider = this.config.baseUrl.includes('localhost') ? 'Ollama' : 
                       this.config.baseUrl.includes('googleapis') ? 'Gemini' : 'OpenAI';
      console.error(`Error calling ${provider} model ${this.config.model}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetches available models from an Ollama instance.
   */
  static async fetchOllamaModels(url: string): Promise<string[]> {
    try {
      const response = await axios.get(`${url}/api/tags`, { timeout: 2000 });
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
    if (!apiKey) return [];
    try {
      const client = new OpenAI({ baseURL: url, apiKey });
      const response = await client.models.list();
      return response.data.map(m => m.id);
    } catch (error) {
      return [];
    }
  }
}
