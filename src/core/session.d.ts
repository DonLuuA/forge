import { Message, Session } from '../types';
export declare class SessionManager {
    private currentSession;
    constructor();
    addMessage(message: Message): void;
    getMessages(): Message[];
    getSession(): Session;
    clear(): void;
}
//# sourceMappingURL=session.d.ts.map