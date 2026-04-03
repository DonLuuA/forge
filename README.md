# OmniCode 🚀

OmniCode is a powerful, model-agnostic command-line AI coding assistant. Inspired by Claude Code but built for flexibility, OmniCode allows you to plug in any LLM with an OpenAI-compatible API.

## Features

- **Model Agnostic**: Use GPT-4o, Gemini, DeepSeek, Groq, Mistral, or local models via Ollama/LM Studio.
- **Powerful Tools**: Execute shell commands, read/write files, perform git operations, and search codebases.
- **Agentic Loop**: Multi-step reasoning and tool execution to solve complex tasks.
- **Context Compression**: Efficiently manages conversation history by summarizing older messages to stay within context window limits.
- **TypeScript Powered**: Built with modern TypeScript for reliability and performance.

## Installation

```bash
# Clone the repository
git clone https://github.com/DonLuuA/omnicode.git
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
OMNICODE_TEMPERATURE=0.7
OMNICODE_MAX_TOKENS=4096
OMNICODE_SYSTEM_PROMPT="You are OmniCode, a powerful AI coding assistant. You can run shell commands, read/write files, and solve complex coding tasks. Always plan before you act."
```

## Usage

```bash
omnicode chat "Refactor the login logic in src/auth.ts"
```

## Advanced Capabilities & Future Plans

OmniCode is designed to be more than just a wrapper. It includes:
- **Self-Healing Diagnostics**: Automatically run tests/linters after edits and fix errors in a loop.
- **Multi-Step Planning**: Breaks down complex requests into actionable plans.
- **Codebase Indexing**: Use vector embeddings (local or API) to index the codebase for better context retrieval.
- **Streaming UI**: Rich terminal interface with streaming responses and interactive tool confirmations.
- **Git Integration**: Automatic branch management and commit generation for tasks.
- **Checkpoints**: Save and restore agent state for long-running tasks.
- **Multi-file Editing**: Coordinate changes across multiple files seamlessly.
