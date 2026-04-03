"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const uuid_1 = require("uuid");
const types_1 = require("../types");
class SessionManager {
    currentSession;
    constructor() {
        this.currentSession = {
            id: (0, uuid_1.v4)(),
            messages: [],
            startTime: new Date(),
            lastUpdated: new Date(),
        };
    }
    addMessage(message) {
        this.currentSession.messages.push(message);
        this.currentSession.lastUpdated = new Date();
    }
    getMessages() {
        return this.currentSession.messages;
    }
    getSession() {
        return this.currentSession;
    }
    clear() {
        this.currentSession.messages = [];
        this.currentSession.lastUpdated = new Date();
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=session.js.map