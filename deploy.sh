#!/bin/bash
# CortexBuild Ultimate - Deployment Script
set -e

echo "=== CortexBuild Deployment ==="
cd /var/www/cortexbuild-ultimate

# Pull latest code
echo "Pulling latest code..."
git pull origin main

# Build frontend
echo "Building frontend..."
npm run build

# Rebuild API image
echo "Building API image..."
docker build -f Dockerfile.api -t cortexbuild-ultimate-api:latest .

# Restart API container
echo "Restarting API..."
docker rm -f cortexbuild-api
docker run -d --name cortexbuild-api --network cortexbuild-ultimate_cortexbuild \\
  -e DATABASE_URL="postgresql://cortexbuild:C0rt3xBu1ld_S3cur3_P@ss@postgres:5432/cortexbuild" \\
  -e DB_HOST=postgres -e DB_PORT=5432 -e DB_NAME=cortexbuild \\
  -e DB_USER=cortexbuild -e DB_PASSWORD="C0rt3xBu1ld_S3cur3_P@ss" \\
  -e JWT_SECRET="1ba7ee87b4cd735fc62f37606743c823163363ce56f2a86830ecb0e238fe616a" \\
  -e PORT=3001 -e OLLAMA_HOST=http://ollama:11434 -e OLLAMA_MODEL=qwen3.5:latest \\
  --restart always -p 3001:3001 cortexbuild-ultimate-api:latest

# Verify
sleep 3
echo ""
echo "=== Deployment Complete ==="
echo "API Health: $(curl -s http://localhost:3001/api/metrics/health)"
echo "Site: https://cortexbuildpro.com"
