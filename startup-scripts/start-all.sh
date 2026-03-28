#!/usr/bin/env bash
# ============================================================
# start-all.sh  —  Start Ollama + Paperclip for Online Money Machine
# Usage: ./start-all.sh          (starts everything)
#        ./start-all.sh status   (check what's running)
#        ./start-all.sh stop     (stop Paperclip; Ollama keeps running)
# ============================================================

set -euo pipefail

PAPERCLIP_DIR="$HOME/.paperclip"
LOG_DIR="$HOME/.paperclip/logs"
OLLAMA_HOST="http://localhost:11434"
PAPERCLIP_PORT=3100

mkdir -p "$LOG_DIR"

# ── Colours ──────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
err()  { echo -e "${RED}✗${NC} $*"; }
info() { echo -e "  $*"; }

# ── Helpers ───────────────────────────────────────────────────
is_ollama_running() {
  curl -sf "$OLLAMA_HOST/api/version" > /dev/null 2>&1
}

is_paperclip_running() {
  curl -sf "http://localhost:$PAPERCLIP_PORT/api/health" > /dev/null 2>&1
}

find_paperclip_cmd() {
  # Try paperclipai global binary first, then npx, then local dev
  if command -v paperclipai &>/dev/null; then
    echo "paperclipai"
  elif command -v paperclip &>/dev/null; then
    echo "paperclip"
  else
    # Find pnpm-based dev server
    local dirs=(
      "$HOME/paperclip"
      "$HOME/projects/paperclip"
      "$HOME/dev/paperclip"
      "$(find "$HOME" -maxdepth 3 -name "paperclip" -type d 2>/dev/null | head -1)"
    )
    for d in "${dirs[@]}"; do
      if [[ -f "$d/package.json" ]]; then
        echo "pnpm --dir $d dev"
        return
      fi
    done
    echo ""
  fi
}

# ── Status ────────────────────────────────────────────────────
cmd_status() {
  echo ""
  echo "════════════════════════════════════════"
  echo " Online Money Machine — Service Status"
  echo "════════════════════════════════════════"

  # Ollama
  if is_ollama_running; then
    local ver; ver=$(curl -sf "$OLLAMA_HOST/api/version" | python3 -c "import sys,json; print(json.load(sys.stdin)['version'])" 2>/dev/null || echo "?")
    ok "Ollama v$ver running on $OLLAMA_HOST"
    local models; models=$(curl -sf "$OLLAMA_HOST/api/tags" | python3 -c "
import sys, json
data = json.load(sys.stdin)
models = data.get('models', [])
local_models = [m['name'] for m in models if not m['name'].endswith(':cloud')]
print(', '.join(local_models[:6]))
" 2>/dev/null || echo "?")
    info "Local models: $models"
  else
    err "Ollama NOT running"
  fi

  echo ""

  # Paperclip
  if is_paperclip_running; then
    local ver; ver=$(curl -sf "http://localhost:$PAPERCLIP_PORT/api/health" | python3 -c "import sys,json; print(json.load(sys.stdin)['version'])" 2>/dev/null || echo "?")
    ok "Paperclip v$ver running on http://localhost:$PAPERCLIP_PORT"
  else
    err "Paperclip NOT running"
  fi

  echo ""

  # OpenCode
  if command -v opencode &>/dev/null; then
    local ocver; ocver=$(opencode --version 2>/dev/null || echo "?")
    ok "OpenCode installed: $ocver"
    if [[ -f "$HOME/.config/opencode/opencode.json" ]]; then
      ok "OpenCode config found at ~/.config/opencode/opencode.json"
    else
      warn "OpenCode config missing — run: ./start-all.sh setup"
    fi
  else
    err "OpenCode NOT found in PATH"
  fi

  echo ""
}

# ── Setup (install config files) ─────────────────────────────
cmd_setup() {
  echo ""
  echo "Setting up configuration files..."
  echo ""

  # OpenCode config
  local oc_config_dir="$HOME/.config/opencode"
  mkdir -p "$oc_config_dir"
  cat > "$oc_config_dir/opencode.json" << 'OCEOF'
{
  "$schema": "https://opencode.ai/config.schema.json",
  "provider": {
    "ollama": {
      "type": "ollama",
      "options": {
        "host": "http://localhost:11434"
      },
      "models": {
        "qwen3.5:27b":           { "name": "qwen3.5:27b" },
        "qwen3.5:latest":        { "name": "qwen3.5:latest" },
        "qwen3-coder:30b":       { "name": "qwen3-coder:30b" },
        "deepseek-r1:14b":       { "name": "deepseek-r1:14b" },
        "nemotron-cascade-2:latest": { "name": "nemotron-cascade-2:latest" }
      }
    }
  },
  "model": "ollama/qwen3.5:27b",
  "autoshare": false,
  "permission": {
    "external_directory": "allow"
  }
}
OCEOF
  ok "OpenCode config written to $oc_config_dir/opencode.json"

  # Install LaunchAgents
  local la_dir="$HOME/Library/LaunchAgents"
  mkdir -p "$la_dir"

  # Ollama LaunchAgent (skip if already present — Ollama.app manages its own)
  if [[ ! -f "$la_dir/com.ollama.server.plist" ]] && ! pgrep -x "ollama" > /dev/null 2>&1; then
    cat > "$la_dir/com.ollama.server.plist" << PEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.ollama.server</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/ollama</string>
    <string>serve</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>OLLAMA_HOST</key><string>127.0.0.1:11434</string>
    <key>OLLAMA_MAX_LOADED_MODELS</key><string>1</string>
    <key>OLLAMA_NUM_PARALLEL</key><string>1</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$LOG_DIR/ollama.log</string>
  <key>StandardErrorPath</key><string>$LOG_DIR/ollama.err.log</string>
</dict>
</plist>
PEOF
    ok "Ollama LaunchAgent written (load with: launchctl load ~/Library/LaunchAgents/com.ollama.server.plist)"
  else
    info "Ollama LaunchAgent skipped (Ollama.app manages its own startup)"
  fi

  echo ""
  ok "Setup complete. Run './start-all.sh' to start everything."
  echo ""
}

# ── Start Ollama ──────────────────────────────────────────────
start_ollama() {
  if is_ollama_running; then
    ok "Ollama already running"
    return 0
  fi

  echo "Starting Ollama..."

  # Try Ollama.app first (macOS)
  if [[ -d "/Applications/Ollama.app" ]]; then
    open -a Ollama
    local i=0
    while ! is_ollama_running && [[ $i -lt 15 ]]; do
      sleep 1; ((i++))
    done
  elif command -v ollama &>/dev/null; then
    nohup ollama serve > "$LOG_DIR/ollama.log" 2>&1 &
    sleep 2
  fi

  if is_ollama_running; then
    ok "Ollama started"
  else
    err "Ollama failed to start — check $LOG_DIR/ollama.log"
    return 1
  fi
}

# ── Start Paperclip ───────────────────────────────────────────
start_paperclip() {
  if is_paperclip_running; then
    ok "Paperclip already running on http://localhost:$PAPERCLIP_PORT"
    return 0
  fi

  local cmd; cmd=$(find_paperclip_cmd)
  if [[ -z "$cmd" ]]; then
    err "Cannot find Paperclip binary or source directory"
    info "Install with: npm install -g @paperclipai/paperclip"
    info "Or run from source: pnpm dev  (from the paperclip directory)"
    return 1
  fi

  echo "Starting Paperclip ($cmd)..."
  nohup bash -c "$cmd" > "$LOG_DIR/paperclip.log" 2>&1 &
  echo $! > "$LOG_DIR/paperclip.pid"

  local i=0
  while ! is_paperclip_running && [[ $i -lt 30 ]]; do
    sleep 1; ((i++))
    echo -n "."
  done
  echo ""

  if is_paperclip_running; then
    ok "Paperclip running at http://localhost:$PAPERCLIP_PORT"
  else
    err "Paperclip failed to start — check $LOG_DIR/paperclip.log"
    tail -20 "$LOG_DIR/paperclip.log" 2>/dev/null || true
    return 1
  fi
}

# ── Stop ──────────────────────────────────────────────────────
cmd_stop() {
  echo "Stopping Paperclip..."
  if [[ -f "$LOG_DIR/paperclip.pid" ]]; then
    kill "$(cat "$LOG_DIR/paperclip.pid")" 2>/dev/null && ok "Paperclip stopped" || warn "Could not kill Paperclip (already stopped?)"
    rm -f "$LOG_DIR/paperclip.pid"
  else
    pkill -f "paperclipai\|paperclip dev\|pnpm.*dev" 2>/dev/null && ok "Paperclip stopped" || warn "Paperclip not found running"
  fi
  info "Ollama left running (use 'pkill ollama' to stop manually)"
}

# ── Main ──────────────────────────────────────────────────────
main() {
  local cmd="${1:-start}"

  case "$cmd" in
    start)
      echo ""
      echo "════════════════════════════════════════"
      echo " Starting Online Money Machine stack..."
      echo "════════════════════════════════════════"
      echo ""
      start_ollama
      start_paperclip
      echo ""
      ok "All services up — open http://localhost:$PAPERCLIP_PORT"
      echo ""
      ;;
    stop)   cmd_stop   ;;
    status) cmd_status ;;
    setup)  cmd_setup  ;;
    *)
      echo "Usage: $0 {start|stop|status|setup}"
      exit 1
      ;;
  esac
}

main "$@"
