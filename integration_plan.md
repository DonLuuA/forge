# Forge Supercharge: Integration Plan from Claw Code

Based on the analysis of `claw-code-main`, we will integrate the following advanced features into Forge:

## 1. Advanced Context Compaction (Self-Healing)
- **Multi-Stage Compaction**: Implement the logic from `compact.rs` to summarize older messages while preserving recent ones verbatim.
- **Continuation Preamble**: Use a system message to bridge the gap between the summary and the current context, ensuring the model resumes directly without recap.
- **Token Estimation**: Add a more accurate token estimation logic to trigger compaction before hitting hard limits.

## 2. Intelligent Tool Routing
- **Scoring Mechanism**: Implement a token-based scoring system to match user prompts with the most relevant tools (inspired by `PortRuntime.route_prompt`).
- **Tool Backlog**: Maintain a registry of available tools with clear responsibilities and source hints.

## 3. Permission & Safety Layer
- **Tool Gating**: Implement a `ToolPermissionContext` to allow/deny specific tools or prefixes (e.g., gating destructive shell commands).
- **Permission Denials**: Track and report when a tool is blocked, providing clear reasons to the user.

## 4. Session Persistence & Replay
- **Stored Sessions**: Enhance `SessionManager` to save and load sessions with full transcripts and usage totals.
- **Transcript Store**: Implement a dedicated store for conversation history that supports flushing and replaying.

## 5. Structured Output & Error Handling
- **JSON Payloads**: Support structured JSON output for tool calls and summaries, with built-in retry logic for rendering failures.
- **Stop Reasons**: Track why a session ended (e.g., `max_turns_reached`, `max_budget_reached`).

## 6. Enhanced "Shock" Installer
- **Auto-Environment Detection**: Expand the installer to detect not just Ollama, but also Python environments, Git status, and system platforms.
- **Global Linking**: Ensure Forge is linked globally and ready to run instantly with zero manual configuration.
