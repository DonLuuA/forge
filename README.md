# OmniCode 🚀

OmniCode is a powerful, model-agnostic command-line AI coding assistant. Inspired by Claude Code but built for flexibility, OmniCode allows you to plug in any LLM with an OpenAI-compatible API.

## Features

- **Model Agnostic**: Use GPT-4o, Gemini, DeepSeek, Groq, Mistral, or local models via Ollama/LM Studio.
- **Powerful Tools**: Execute shell commands, read/write files, perform git operations, and search codebases.
- **Agentic Loop**: Multi-step reasoning and tool execution to solve complex tasks.
- **TypeScript Powered**: Built with modern TypeScript for reliability and performance.

## Installation

```bash
# Clone the repository
git clone https://github.com/user/omnicode.git
cd omnicode

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

## Configuration

Set the following environment variables in a `.env` file or your shell:

```bash
OMNICODE_API_KEY=your_api_key
OMNICODE_BASE_URL=https://api.openai.com/v1
OMNICODE_MODEL=gpt-4o
```

## Usage

```bash
omnicode chat "Refactor the login logic in src/auth.ts"
```

## Advanced Capabilities

OmniCode is designed to be more than just a wrapper. It includes:
- **Self-Healing**: Automatically detects and fixes errors in its own tool executions.
- **Multi-Step Planning**: Breaks down complex requests into actionable plans.
- **Context Management**: Efficiently manages conversation history for long-running tasks.
