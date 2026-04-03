#!/bin/bash

# Forge One-Line Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/DonLuuA/forge/master/install.sh | bash

set -e

echo "🔥 Forging your AI coding assistant..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Clone the repository
REPO_URL="https://github.com/DonLuuA/forge.git"
INSTALL_DIR="$HOME/.forge"

if [ -d "$INSTALL_DIR" ]; then
    echo "🔄 Updating Forge..."
    cd "$INSTALL_DIR"
    git pull origin master
else
    echo "📥 Downloading Forge..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Install dependencies and build
echo "📦 Installing dependencies..."
npm install --quiet
echo "🏗️ Building Forge..."
npm run build --quiet

# Link globally
echo "🔗 Linking Forge globally..."
npm link --force --quiet

# Check for local models
echo "🔍 Checking for local models..."
if curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo "✅ Local Ollama detected! Forge will auto-configure for local use."
else
    echo "💡 No local models detected. Forge will use remote APIs by default."
fi

echo "✨ Forge is ready! Run 'forge chat' to start."
