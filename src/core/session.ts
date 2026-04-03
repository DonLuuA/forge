import { v4 as uuidv4 } from 'uuid';
import { Message, Session } from '../types/index.js';

export class SessionManager {
  private currentSession: Session;

  constructor() {
    this.currentSession = {
      id: uuidv4(),
      messages: [],
      startTime: new Date(),
      lastUpdated: new Date(),
    };
  }

  addMessage(message: Message) {
    this.currentSession.messages.push(message);
    this.currentSession.lastUpdated = new Date();
  }

  getMessages(): Message[] {
    return this.currentSession.messages;
  }

  getSession(): Session {
    return this.currentSession;
  }

  clear() {
    this.currentSession.messages = [];
    this.currentSession.lastUpdated = new Date();
  }
}
