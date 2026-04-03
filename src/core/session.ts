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

  async compress(model: any) {
    if (this.currentSession.messages.length < 20) return;

    const summaryPrompt = "Summarize the preceding conversation into a concise technical brief, preserving all key decisions, file paths, and tool outputs. This summary will replace the history to save context.";
    const messagesToCompress = this.currentSession.messages.slice(0, -5);
    const recentMessages = this.currentSession.messages.slice(-5);

    const summary = await model.chat([
      ...messagesToCompress,
      { role: 'user', content: summaryPrompt }
    ]);

    this.currentSession.messages = [
      { role: 'system', content: `Previous Conversation Summary: ${summary.content}` },
      ...recentMessages
    ];
  }
}
