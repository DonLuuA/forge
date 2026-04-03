import { ModelAdapter } from '../core/model';
import { SessionManager } from '../core/session';
export declare class AgentLoop {
    private model;
    private session;
    private tools;
    constructor(model: ModelAdapter, session: SessionManager);
    run(userInput: string, onUpdate?: (message: string) => void): Promise<void>;
}
//# sourceMappingURL=loop.d.ts.map