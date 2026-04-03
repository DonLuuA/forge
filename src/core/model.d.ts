import OpenAI from 'openai';
import { Config, Message, ToolDefinition } from '../types';
export declare class ModelAdapter {
    private client;
    private config;
    constructor(config: Config);
    chat(messages: Message[], tools?: ToolDefinition[]): Promise<Message>;
    streamChat(messages: Message[], tools?: ToolDefinition[]): AsyncGenerator<OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta | undefined, void, unknown>;
}
//# sourceMappingURL=model.d.ts.map