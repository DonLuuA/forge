# Forge 🔥

Forge is a high-performance, universal AI coding assistant. It's designed to be instantly ready, model-agnostic, and powerful enough to handle complex coding tasks directly from your terminal.

## ⚡ Instant Install

Shock your terminal and get Forge running instantly with this one-liner:

```bash
curl -fsSL https://raw.githubusercontent.com/DonLuuA/forge/master/install.sh | bash
```

## Features

- **Universal Model Support**: Plug in any LLM (OpenAI, Anthropic, DeepSeek, Groq, Mistral).
- **Local-First**: Auto-detects and configures for local models running via Ollama or LM Studio.
- **Agentic Intelligence**: Multi-step planning, self-healing diagnostics, and tool execution.
- **Context Compression**: Sophisticated session management to handle massive codebases.
- **Zero Config**: Auto-detects your environment and local models on startup.

## Configuration

Forge auto-configures itself, but you can override settings via environment variables:

```bash
FORGE_API_KEY=your_api_key
FORGE_BASE_URL=https://api.openai.com/v1
FORGE_MODEL=gpt-4o
```

## Usage

```bash
forge chat "Create a new React component for a dashboard"
```

## Why Forge?

Forge isn't just another CLI tool; it's a developer's power-up. It understands your local environment, respects your choice of models, and executes tasks with precision. Whether you're using a cloud-based giant or a local specialist, Forge gets to work instantly.
