#!/bin/bash
# =============================================================================
# CortexBuild VPS Deploy Script
# =============================================================================
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/root/cortexbuild-ultimate}"
IMAGE_NAME="cortexbuild-ultimate-api:latest"
CONTAINER_NAME="cortexbuild-api"

echo "=== CortexBuild Deploy — $(date) ==="

# Pull cod
cd "$PROJECT_DIR"
git fetch origin
git reset --hard origin/main

# Build
docker build -t "$IMAGE_NAME" -f Dockerfile.api .

# Stop + pornire cu docker-compose (păstrează datele postgres/redis)
docker-compose down api 2>/dev/null || true
docker-compose up -d api

# Așteaptă health
echo "Waiting for API health..."
for i in $(seq 1 30); do
  if curl -fsS http://localhost:3001/api/health >/dev/null 2>&1; then
    echo "✅ API healthy"
    break
  fi
  sleep 2
done

# Verificare finală
if ! curl -fsS http://localhost:3001/api/health >/dev/null 2>&1; then
  echo "❌ API health check failed"
  docker logs --tail 30 "$CONTAINER_NAME"
  exit 1
fi

# Reload nginx
systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true

echo "=== Deploy Complete — $(date) ==="
