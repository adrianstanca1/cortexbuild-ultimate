#!/usr/bin/env bash
# ============================================================
# watchdog.sh — Keep Ollama + Paperclip alive
# Runs in the background, checks every 60 seconds, restarts
# any service that has gone down.
#
# Usage:  ./watchdog.sh &
#         ./watchdog.sh --interval 30   (check every 30s)
# ============================================================

INTERVAL="${2:-60}"   # seconds between checks
LOG="$HOME/.paperclip/logs/watchdog.log"
PAPERCLIP_PORT=3100

mkdir -p "$(dirname "$LOG")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"
}

is_running() {
  curl -sf "$1" > /dev/null 2>&1
}

restart_ollama() {
  log "WARN: Ollama down — restarting..."
  if [[ -d "/Applications/Ollama.app" ]]; then
    open -a Ollama && sleep 3
  elif command -v ollama &>/dev/null; then
    ollama serve >> "$HOME/.paperclip/logs/ollama.log" 2>&1 &
    sleep 2
  fi
  if is_running "http://localhost:11434/api/version"; then
    log "OK: Ollama restarted successfully"
  else
    log "ERROR: Ollama failed to restart"
  fi
}

restart_paperclip() {
  log "WARN: Paperclip down — restarting..."
  # Kill any stale instance
  pkill -f "paperclipai\|paperclip dev\|pnpm.*dev" 2>/dev/null || true
  sleep 1

  local cmd=""
  if command -v paperclipai &>/dev/null; then
    cmd="paperclipai dev"
  elif command -v paperclip &>/dev/null; then
    cmd="paperclip dev"
  fi

  if [[ -n "$cmd" ]]; then
    nohup bash -c "$cmd" >> "$HOME/.paperclip/logs/paperclip.log" 2>&1 &
    local i=0
    while ! is_running "http://localhost:$PAPERCLIP_PORT/api/health" && [[ $i -lt 30 ]]; do
      sleep 1; ((i++))
    done
    if is_running "http://localhost:$PAPERCLIP_PORT/api/health"; then
      log "OK: Paperclip restarted successfully"
    else
      log "ERROR: Paperclip failed to restart — check $HOME/.paperclip/logs/paperclip.log"
    fi
  else
    log "ERROR: paperclipai not found in PATH — cannot restart"
  fi
}

log "INFO: Watchdog started (checking every ${INTERVAL}s)"
log "INFO: Monitoring Ollama @ localhost:11434 | Paperclip @ localhost:$PAPERCLIP_PORT"

while true; do
  # Check Ollama
  if ! is_running "http://localhost:11434/api/version"; then
    restart_ollama
  fi

  # Check Paperclip
  if ! is_running "http://localhost:$PAPERCLIP_PORT/api/health"; then
    restart_paperclip
  fi

  sleep "$INTERVAL"
done
