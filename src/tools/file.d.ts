import { ToolDefinition, ToolResult } from '../types';
export declare const readFileToolDefinition: ToolDefinition;
export declare const writeFileToolDefinition: ToolDefinition;
export declare function readFile(filePath: string, toolCallId: string): Promise<ToolResult>;
export declare function writeFile(filePath: string, content: string, toolCallId: string): Promise<ToolResult>;
//# sourceMappingURL=file.d.ts.map