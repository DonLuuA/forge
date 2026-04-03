"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelAdapter = void 0;
const openai_1 = __importDefault(require("openai"));
const types_1 = require("../types");
class ModelAdapter {
    client;
    config;
    constructor(config) {
        this.config = config;
        this.client = new openai_1.default({
            apiKey: config.apiKey,
            baseURL: config.baseUrl,
        });
    }
    async chat(messages, tools) {
        const response = await this.client.chat.completions.create({
            model: this.config.model,
            messages: messages,
            tools: tools?.map(t => ({ type: 'function', function: t })),
            temperature: this.config.temperature,
            max_tokens: this.config.maxTokens,
        });
        const choice = response.choices[0].message;
        return {
            role: choice.role,
            content: choice.content || '',
            tool_calls: choice.tool_calls,
        };
    }
    async *streamChat(messages, tools) {
        const stream = await this.client.chat.completions.create({
            model: this.config.model,
            messages: messages,
            tools: tools?.map(t => ({ type: 'function', function: t })),
            temperature: this.config.temperature,
            max_tokens: this.config.maxTokens,
            stream: true,
        });
        for await (const chunk of stream) {
            yield chunk.choices[0]?.delta;
        }
    }
}
exports.ModelAdapter = ModelAdapter;
//# sourceMappingURL=model.js.map