#!/bin/bash
# CortexBuild Ultimate — VPS Redeployment Script (Docker)
# Run this on the VPS at /var/www/cortexbuild-ultimate

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "=== CortexBuild Ultimate — Docker Deploy ==="
date

echo "Pulling latest code..."
git pull origin main

echo "Building new Docker image..."
docker build -t cortexbuild-ultimate-api:latest -f Dockerfile.api . --no-cache

# Get new container IP for nginx update
NEW_IP=$(docker inspect cortexbuild-api-v8 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null || echo "")

echo "Restarting API container..."
docker stop cortexbuild-api-v8 || true
docker rm cortexbuild-api-v8 || true
docker run -d \
  --name cortexbuild-api-v8 \
  --restart unless-stopped \
  --network cortexbuild-ultimate_cortexbuild \
  --env-file .env.production \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://cortexbuild:C0rt3xBu1ld_S3cur3_P@ss@localhost:5432/cortexbuild \
  -e JWT_SECRET="$JWT_SECRET" \
  -e OLLAMA_HOST=http://172.18.0.5:11434 \
  -e JWT_SECRET \
  cortexbuild-ultimate-api:latest

sleep 3

# Update nginx with new container IP and reload
NGINX_CONF="/var/www/cortexbuild-ultimate/nginx/nginx.conf"
if [[ -n "$NEW_IP" ]]; then
  echo "Updating nginx proxy_pass to $NEW_IP..."
  sed -i "s|proxy_pass http://[0-9.]*:3001;|proxy_pass http://$NEW_IP:3001;|" "$NGINX_CONF"
  docker exec cortexbuild-nginx nginx -s reload
fi

echo "Verifying health..."
sleep 2
curl -sf http://localhost:3001/api/metrics/health && echo " ✓ API healthy" || echo " ✗ API unhealthy"

echo "=== Deploy complete ==="
date
