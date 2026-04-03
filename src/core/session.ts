import { v4 as uuidv4 } from 'uuid';
import { Message, Session, UsageSummary } from '../types/index.js';

export class SessionManager {
  private currentSession: Session;

  constructor() {
    this.currentSession = {
      id: uuidv4(),
      messages: [],
      startTime: new Date(),
      lastUpdated: new Date(),
      totalUsage: { inputTokens: 0, outputTokens: 0 },
    };
  }

  addMessage(message: Message) {
    this.currentSession.messages.push(message);
    this.currentSession.lastUpdated = new Date();
  }

  updateUsage(usage: UsageSummary) {
    this.currentSession.totalUsage.inputTokens += usage.inputTokens;
    this.currentSession.totalUsage.outputTokens += usage.outputTokens;
  }

  getMessages(): Message[] {
    return this.currentSession.messages;
  }

  getSession(): Session {
    return this.currentSession;
  }

  async compact(model: any, preserveRecent: number = 4) {
    if (this.currentSession.messages.length < 12) return;

    try {
      const summaryPrompt = `
        Summarize the preceding conversation into a concise technical brief.
        Preserve all key decisions, file paths, and tool outputs.
        This summary will replace the history to save context.
        Format the output as:
        <summary>
        Conversation summary:
        - Scope: [X] earlier messages compacted.
        - Key files referenced: [files]
        - Current work: [description]
        - Key timeline: [events]
        </summary>
      `;

      const systemMessage = this.currentSession.messages.find(m => m.role === 'system');
      const messagesToCompress = this.currentSession.messages.filter(m => m.role !== 'system').slice(0, -preserveRecent);
      const recentMessages = this.currentSession.messages.slice(-preserveRecent);

      const summary = await model.chat([
        ...(systemMessage ? [systemMessage] : []),
        ...messagesToCompress,
        { role: 'user', content: summaryPrompt }
      ]);

      const continuationPreamble = "This session is being continued from a previous conversation that ran out of context. The summary below covers the earlier portion of the conversation.\n\n";
      
      this.currentSession.messages = [
        ...(systemMessage ? [systemMessage] : []),
        { role: 'system', content: `${continuationPreamble}${summary.content}\n\nRecent messages are preserved verbatim.` },
        ...recentMessages
      ];
    } catch (error: any) {
      console.error('Failed to compact context:', error.message);
      // If compaction fails, we just keep the messages as is for now
    }
  }

  clear() {
    this.currentSession.messages = [];
    this.currentSession.totalUsage = { inputTokens: 0, outputTokens: 0 };
    this.currentSession.lastUpdated = new Date();
  }
}
