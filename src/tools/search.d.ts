import { ToolDefinition, ToolResult } from '../types';
export declare const searchFilesToolDefinition: ToolDefinition;
export declare const grepToolDefinition: ToolDefinition;
export declare function searchFiles(pattern: string, toolCallId: string): Promise<ToolResult>;
export declare function grep(pattern: string, searchPath: string, toolCallId: string): Promise<ToolResult>;
//# sourceMappingURL=search.d.ts.map