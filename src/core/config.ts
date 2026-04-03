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

    // 1. Hard-Wired OpenAI (Always Available)
    providers.push({
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY || '',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
      isActive: false
    });

    // 2. Hard-Wired Gemini (Always Available)
    providers.push({
      name: 'Gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      apiKey: process.env.GEMINI_API_KEY || '',
      models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
      isActive: false
    });

    // 3. Check for local Ollama
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
    } else {
      // Default to OpenAI if no Ollama
      const openAI = providers.find(p => p.name === 'OpenAI');
      if (openAI) openAI.isActive = true;
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
    // Find provider that contains this model
    const provider = this.config.providers?.find(p => p.models.includes(modelName));
    if (provider) {
      this.config.baseUrl = provider.baseUrl;
      this.config.apiKey = provider.apiKey;
      this.config.model = modelName;
      this.config.providers?.forEach(p => p.isActive = (p.name === provider.name));
      return true;
    }
    return false;
  }

  updateProviderKey(providerName: string, apiKey: string) {
    const provider = this.config.providers?.find(p => p.name === providerName);
    if (provider) {
      provider.apiKey = apiKey;
      if (provider.isActive) {
        this.config.apiKey = apiKey;
      }
    }
  }

  validate(): boolean {
    if (this.config.baseUrl.includes('localhost') || this.config.baseUrl.includes('127.0.0.1')) {
      return true;
    }
    return !!this.config.apiKey;
  }
}
