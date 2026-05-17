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

# Stop and recreate API container (postgres/redis kept running)
docker stop cortexbuild-api 2>/dev/null || true
docker rm cortexbuild-api 2>/dev/null || true
docker run -d \
  --name cortexbuild-api \
  --restart always \
  -p 127.0.0.1:3009:3001 \
  --env-file "$PROJECT_DIR/.env" \
  "$IMAGE_NAME"

# Așteaptă health
echo "Waiting for API health..."
for i in $(seq 1 30); do
  if curl -fsS http://localhost:3009/api/health >/dev/null 2>&1; then
    echo "✅ API healthy"
    break
  fi
  sleep 2
done

# Verificare finală
if ! curl -fsS http://localhost:3009/api/health >/dev/null 2>&1; then
  echo "❌ API health check failed"
  docker logs --tail 30 "$CONTAINER_NAME"
  exit 1
fi

# Reload nginx
systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true

echo "=== Deploy Complete — $(date) ==="
