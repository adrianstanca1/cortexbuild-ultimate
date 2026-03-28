#!/usr/bin/env bash
# ============================================================
# install.sh — One-time setup for the Online Money Machine stack
# Run this once: chmod +x install.sh && ./install.sh
# ============================================================

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
err()  { echo -e "${RED}✗${NC} $*"; }
step() { echo -e "\n${YELLOW}▶${NC} $*"; }

echo ""
echo "════════════════════════════════════════════════"
echo "  Online Money Machine — Install & Setup"
echo "════════════════════════════════════════════════"
echo ""

# ── 1. Create log directory ───────────────────────────────────
step "Creating log directory..."
mkdir -p "$HOME/.paperclip/logs"
ok "Log dir: $HOME/.paperclip/logs"

# ── 2. OpenCode config ────────────────────────────────────────
step "Installing OpenCode config..."
mkdir -p "$HOME/.config/opencode"

cat > "$HOME/.config/opencode/opencode.json" << 'EOF'
{
  "$schema": "https://opencode.ai/config.schema.json",
  "provider": {
    "ollama": {
      "type": "ollama",
      "options": {
        "host": "http://localhost:11434"
      },
      "models": {
        "qwen3.5:27b":               { "name": "qwen3.5:27b" },
        "qwen3.5:latest":            { "name": "qwen3.5:latest" },
        "qwen3-coder:30b":           { "name": "qwen3-coder:30b" },
        "deepseek-r1:14b":           { "name": "deepseek-r1:14b" },
        "nemotron-cascade-2:latest": { "name": "nemotron-cascade-2:latest" },
        "glm-4.7-flash:latest":      { "name": "glm-4.7-flash:latest" }
      }
    }
  },
  "model": "ollama/qwen3.5:27b",
  "autoshare": false,
  "permission": {
    "external_directory": "allow"
  }
}
EOF
ok "OpenCode config → $HOME/.config/opencode/opencode.json"

# ── 3. Verify OpenCode is in PATH ─────────────────────────────
step "Checking OpenCode installation..."
if command -v opencode &>/dev/null; then
  ok "OpenCode found: $(which opencode)"
else
  warn "OpenCode not found in PATH"
  echo "  Install with:"
  echo "    npm install -g opencode-ai"
  echo "  OR:"
  echo "    curl -fsSL https://opencode.ai/install.sh | sh"
fi

# ── 4. Verify Ollama ──────────────────────────────────────────
step "Checking Ollama..."
if curl -sf "http://localhost:11434/api/version" > /dev/null 2>&1; then
  VER=$(curl -sf "http://localhost:11434/api/version" | python3 -c "import sys,json; print(json.load(sys.stdin)['version'])" 2>/dev/null || echo "?")
  ok "Ollama v$VER is running"

  # Check qwen3.5:27b is available
  if curl -sf "http://localhost:11434/api/tags" | grep -q "qwen3.5:27b"; then
    ok "Model qwen3.5:27b is available"
  else
    warn "Model qwen3.5:27b not found — pulling now..."
    ollama pull qwen3.5:27b
    ok "qwen3.5:27b pulled"
  fi
else
  warn "Ollama not running — starting now..."
  if [[ -d "/Applications/Ollama.app" ]]; then
    open -a Ollama && sleep 3
    ok "Ollama.app launched"
  elif command -v ollama &>/dev/null; then
    ollama serve &>/dev/null &
    sleep 2
    ok "Ollama serve started"
  else
    err "Ollama not installed. Download from https://ollama.com"
  fi
fi

# ── 5. Install LaunchAgents (optional) ───────────────────────
step "Installing macOS LaunchAgents for auto-start on login..."
LADIR="$HOME/Library/LaunchAgents"
SCRIPTS_DIR="$(dirname "$0")"

# Paperclip LaunchAgent
if [[ -f "$SCRIPTS_DIR/com.adrianstanca.paperclip.plist" ]]; then
  # First: verify paperclipai binary exists
  PAPERCLIP_BIN=$(command -v paperclipai 2>/dev/null || command -v paperclip 2>/dev/null || echo "")
  if [[ -n "$PAPERCLIP_BIN" ]]; then
    # Update binary path in plist
    sed "s|/usr/local/bin/paperclipai|$PAPERCLIP_BIN|g" \
      "$SCRIPTS_DIR/com.adrianstanca.paperclip.plist" > "$LADIR/com.adrianstanca.paperclip.plist"
    launchctl load "$LADIR/com.adrianstanca.paperclip.plist" 2>/dev/null || true
    ok "Paperclip LaunchAgent installed (auto-starts on login)"
  else
    warn "paperclipai binary not found — skipping LaunchAgent"
    warn "Install Paperclip first, then re-run this script"
  fi
fi

# Ollama LaunchAgent (only if Ollama.app is NOT installed)
if [[ ! -d "/Applications/Ollama.app" ]] && [[ -f "$SCRIPTS_DIR/com.adrianstanca.ollama.plist" ]]; then
  OLLAMA_BIN=$(command -v ollama 2>/dev/null || echo "/usr/local/bin/ollama")
  sed "s|/usr/local/bin/ollama|$OLLAMA_BIN|g" \
    "$SCRIPTS_DIR/com.adrianstanca.ollama.plist" > "$LADIR/com.adrianstanca.ollama.plist"
  launchctl load "$LADIR/com.adrianstanca.ollama.plist" 2>/dev/null || true
  ok "Ollama LaunchAgent installed"
else
  ok "Ollama.app manages its own startup — LaunchAgent skipped"
fi

# ── 6. Make scripts executable ───────────────────────────────
chmod +x "$SCRIPTS_DIR/start-all.sh" 2>/dev/null || true
chmod +x "$SCRIPTS_DIR/watchdog.sh" 2>/dev/null || true

# ── 7. Summary ───────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo "  Setup complete!"
echo "════════════════════════════════════════════════"
echo ""
echo "  Start everything:    ./start-all.sh"
echo "  Check status:        ./start-all.sh status"
echo "  Stop Paperclip:      ./start-all.sh stop"
echo "  Run watchdog:        ./watchdog.sh &"
echo ""
echo "  Paperclip UI:        http://localhost:3100"
echo "  Ollama API:          http://localhost:11434"
echo ""
