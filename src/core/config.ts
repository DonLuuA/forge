import dotenv from 'dotenv';
import { Config } from '../types/index.js';

dotenv.config();

export class ConfigManager {
  private config: Config;

  constructor() {
    this.config = {
      apiKey: process.env.OMNICODE_API_KEY || '',
      baseUrl: process.env.OMNICODE_BASE_URL || 'https://api.openai.com/v1',
      model: process.env.OMNICODE_MODEL || 'gpt-4o',
      temperature: parseFloat(process.env.OMNICODE_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.OMNICODE_MAX_TOKENS || '4096'),
      systemPrompt: process.env.OMNICODE_SYSTEM_PROMPT || 'You are OmniCode, a powerful AI coding assistant. You can run shell commands, read/write files, and solve complex coding tasks. Always plan before you act.',
    };
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
