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
    const isGemini = config.baseUrl.includes('generativelanguage.googleapis.com');
    const isGroq = config.baseUrl.includes('api.groq.com');
    
    return new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      defaultHeaders: isGemini ? { 'x-goog-api-key': config.apiKey } : undefined,
      // Groq is OpenAI-compatible, but we ensure the client is fresh
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
                       this.config.baseUrl.includes('googleapis') ? 'Gemini' : 
                       this.config.baseUrl.includes('groq.com') ? 'Groq' : 'OpenAI';
      console.error(`Error calling ${provider} model ${this.config.model}:`, error.message);
      throw error;
    }
  }

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
