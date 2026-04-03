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

    // 1. OpenAI
    const openAIApiKey = process.env.OPENAI_API_KEY || '';
    const openAIModels = await ModelAdapter.fetchOpenAIModels('https://api.openai.com/v1', openAIApiKey);
    providers.push({
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: openAIApiKey,
      models: openAIModels.length > 0 ? openAIModels : ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-preview', 'o1-mini'],
      isActive: false
    });

    // 2. Gemini
    const geminiApiKey = process.env.GEMINI_API_KEY || '';
    const geminiModels = await ModelAdapter.fetchOpenAIModels('https://generativelanguage.googleapis.com/v1beta/openai/', geminiApiKey);
    providers.push({
      name: 'Gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      apiKey: geminiApiKey,
      models: geminiModels.length > 0 ? geminiModels : ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      isActive: false
    });

    // 3. Groq
    const groqApiKey = process.env.GROQ_API_KEY || '';
    const groqModels = await ModelAdapter.fetchOpenAIModels('https://api.groq.com/openai/v1', groqApiKey);
    providers.push({
      name: 'Groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: groqApiKey,
      models: groqModels.length > 0 ? groqModels : ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
      isActive: false
    });

    // 4. Check for local Ollama
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
