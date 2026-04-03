import dotenv from 'dotenv';
import { Config } from '../types/index.js';
import { ModelAdapter } from './model.js';

dotenv.config();

export class ConfigManager {
  private config: Config;

  constructor() {
    this.config = {
      apiKey: process.env.FORGE_API_KEY || '',
      baseUrl: process.env.FORGE_BASE_URL || 'https://api.openai.com/v1',
      model: process.env.FORGE_MODEL || 'gpt-4o',
      temperature: parseFloat(process.env.FORGE_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.FORGE_MAX_TOKENS || '4096'),
      systemPrompt: process.env.FORGE_SYSTEM_PROMPT || 'You are Forge, a high-performance AI coding assistant. You can run shell commands, read/write files, and solve complex coding tasks. Always plan before you act.',
    };
  }

  async autoConfigure() {
    // Check for local Ollama
    const ollamaUrl = 'http://localhost:11434';
    if (await ModelAdapter.checkLocalModel(ollamaUrl)) {
      console.log('Local Ollama detected. Auto-configuring for local use...');
      this.config.baseUrl = `${ollamaUrl}/v1`;
      this.config.model = 'deepseek-coder-v2'; // Default local model
      this.config.apiKey = 'ollama';
    }
  }

  getConfig(): Config {
    return this.config;
  }

  updateConfig(newConfig: Partial<Config>) {
    this.config = { ...this.config, ...newConfig };
  }

  validate(): boolean {
    if (!this.config.apiKey && !this.config.baseUrl.includes('localhost') && !this.config.baseUrl.includes('127.0.0.1')) {
      return false;
    }
    return true;
  }
}
