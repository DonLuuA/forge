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

    // 2. Check for OpenAI
    const openaiKey = process.env.OPENAI_API_KEY || '';
    providers.push({
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: openaiKey,
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
      isActive: providers.length === 0
    });

    // 3. Check for Gemini
    const geminiKey = process.env.GEMINI_API_KEY || '';
    providers.push({
      name: 'Gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      apiKey: geminiKey,
      models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
      isActive: false
    });

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
    // Ollama doesn't need a key, others do
    if (this.config.baseUrl.includes('localhost') || this.config.baseUrl.includes('127.0.0.1')) {
      return true;
    }
    return !!this.config.apiKey;
  }
}
