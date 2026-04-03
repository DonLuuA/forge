import dotenv from 'dotenv';
import { Config, ProviderConfig } from '../types/index.js';
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
      providers: []
    };
  }

  async autoConfigure() {
    const providers: ProviderConfig[] = [];

    // 1. Check for local Ollama
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const ollamaModels = await ModelAdapter.fetchOllamaModels(ollamaUrl);
    if (ollamaModels.length > 0) {
      providers.push({
        name: 'Ollama',
        baseUrl: `${ollamaUrl}/v1`,
        apiKey: 'ollama',
        models: ollamaModels,
        isActive: true
      });
    }

    // 2. Check for OpenAI (if API key exists)
    if (process.env.OPENAI_API_KEY) {
      const openaiModels = await ModelAdapter.fetchOpenAIModels('https://api.openai.com/v1', process.env.OPENAI_API_KEY);
      if (openaiModels.length > 0) {
        providers.push({
          name: 'OpenAI',
          baseUrl: 'https://api.openai.com/v1',
          apiKey: process.env.OPENAI_API_KEY,
          models: openaiModels,
          isActive: providers.length === 0 // Active if no Ollama
        });
      }
    }

    // 3. Check for other custom providers from environment
    if (process.env.FORGE_BASE_URL && process.env.FORGE_API_KEY && !providers.some(p => p.baseUrl === process.env.FORGE_BASE_URL)) {
      const customModels = await ModelAdapter.fetchOpenAIModels(process.env.FORGE_BASE_URL, process.env.FORGE_API_KEY);
      providers.push({
        name: 'Custom',
        baseUrl: process.env.FORGE_BASE_URL,
        apiKey: process.env.FORGE_API_KEY,
        models: customModels.length > 0 ? customModels : [process.env.FORGE_MODEL || 'gpt-4o'],
        isActive: providers.length === 0
      });
    }

    this.config.providers = providers;

    // Set initial active provider and model
    const activeProvider = providers.find(p => p.isActive) || providers[0];
    if (activeProvider) {
      this.config.baseUrl = activeProvider.baseUrl;
      this.config.apiKey = activeProvider.apiKey;
      this.config.model = activeProvider.models.includes(this.config.model) ? this.config.model : activeProvider.models[0];
    }
  }

  getConfig(): Config {
    return this.config;
  }

  updateConfig(newConfig: Partial<Config>) {
    this.config = { ...this.config, ...newConfig };
  }

  switchModel(modelName: string) {
    const provider = this.config.providers?.find(p => p.models.includes(modelName));
    if (provider) {
      this.config.baseUrl = provider.baseUrl;
      this.config.apiKey = provider.apiKey;
      this.config.model = modelName;
      this.config.providers?.forEach(p => p.isActive = (p.name === provider.name));
    }
  }

  validate(): boolean {
    if (!this.config.apiKey && !this.config.baseUrl.includes('localhost') && !this.config.baseUrl.includes('127.0.0.1')) {
      return false;
    }
    return true;
  }
}
