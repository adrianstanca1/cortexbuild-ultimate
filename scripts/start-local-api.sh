#!/usr/bin/env bash
# Start minimal Postgres + Redis + API so http://127.0.0.1:3001/api/health works locally.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

wait_for_docker() {
  local _i
  for _i in $(seq 1 90); do
    if docker info >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

if ! docker info >/dev/null 2>&1; then
  if [[ "$(uname -s)" == "Darwin" ]]; then
    echo "Docker daemon not reachable; launching Docker Desktop…"
    open -a Docker 2>/dev/null || true
  fi
  echo "Waiting for Docker (up to 90s)…"
  if ! wait_for_docker; then
    echo "Docker still not available. Start Docker Desktop manually, then re-run:"
    echo "  bash scripts/start-local-api.sh"
    exit 1
  fi
fi

export JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
export SESSION_SECRET="${SESSION_SECRET:-$(openssl rand -hex 32)}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-cortexbuild_local_$(openssl rand -hex 8)}"
export CORS_ORIGIN="${CORS_ORIGIN:-http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:3001}"
export FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
export NODE_ENV="${NODE_ENV:-development}"

COMPOSE=(docker compose -f docker-compose.local.yml)
if ! docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker-compose -f docker-compose.local.yml)
fi

echo "Starting local stack (postgres :15432, redis :16379, api :3001)…"
"${COMPOSE[@]}" up -d --build postgres redis api

echo "Waiting for http://127.0.0.1:3001/api/health …"
for _i in $(seq 1 60); do
  if curl -sf --max-time 2 "http://127.0.0.1:3001/api/health" >/dev/null 2>&1; then
    echo "OK: http://127.0.0.1:3001/api/health"
    curl -sS "http://127.0.0.1:3001/api/health" | head -c 220
    echo
    exit 0
  fi
  sleep 2
done

echo "Health check did not pass in time. Recent api logs:"
"${COMPOSE[@]}" logs --tail 80 api || true
exit 1
