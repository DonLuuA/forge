"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const types_1 = require("../types");
dotenv_1.default.config();
class ConfigManager {
    config;
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
    getConfig() {
        return this.config;
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    validate() {
        if (!this.config.apiKey && !this.config.baseUrl.includes('localhost') && !this.config.baseUrl.includes('127.0.0.1')) {
            return false;
        }
        return true;
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=config.js.map