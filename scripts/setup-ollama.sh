#!/bin/bash
# CortexBuild Ultimate — Ollama Setup Script
# Installs Ollama and pulls a model for local AI features

set -euo pipefail

echo "=== CortexBuild — Ollama Setup ==="

# Install Ollama if not present
if command -v ollama &>/dev/null; then
    echo "✓ Ollama already installed: $(ollama --version 2>/dev/null || echo 'version unknown')"
else
    echo "Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
    echo "✓ Ollama installed"
fi

# Start Ollama service
if ! pgrep -x "ollama" >/dev/null 2>&1; then
    echo "Starting Ollama in background..."
    nohup ollama serve > /var/log/ollama.log 2>&1 &
    sleep 3
    echo "✓ Ollama started"
else
    echo "✓ Ollama already running"
fi

# Choose model based on available RAM
TOTAL_RAM_GB=$(free -g | awk 'NR==2{print $2}')
if [ "$TOTAL_RAM_GB" -ge 30 ]; then
    MODEL="qwen2.5:14b"
elif [ "$TOTAL_RAM_GB" -ge 16 ]; then
    MODEL="qwen2.5:7b"
else
    MODEL="llama3.2:3b"
fi

echo "RAM: ${TOTAL_RAM_GB}GB — pulling model: $MODEL"
ollama pull "$MODEL"
echo "✓ Model $MODEL ready"

# Test the model
echo "Testing model..."
ollama run "$MODEL" "Respond with exactly: CortexBuild AI ready." --nowordwrap 2>/dev/null | head -1

# Update .env with model choice
ENV_FILE="$(dirname "$0")/../server/.env"
if [ -f "$ENV_FILE" ]; then
    if grep -q "OLLAMA_MODEL" "$ENV_FILE"; then
        sed -i "s|^OLLAMA_MODEL=.*|OLLAMA_MODEL=$MODEL|" "$ENV_FILE"
    else
        echo "OLLAMA_MODEL=$MODEL" >> "$ENV_FILE"
        echo "OLLAMA_HOST=http://127.0.0.1:11434" >> "$ENV_FILE"
    fi
    echo "✓ Updated $ENV_FILE with OLLAMA_MODEL=$MODEL"
fi

echo ""
echo "=== Ollama setup complete ==="
echo "Available models:"
ollama list
