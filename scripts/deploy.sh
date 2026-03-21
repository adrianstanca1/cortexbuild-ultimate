#!/bin/bash
# CortexBuild Ultimate — VPS Redeployment Script
# Run from /var/www/cortexbuild-ultimate on the VPS

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

echo "=== CortexBuild Ultimate — Deploy ==="

echo "Pulling latest code..."
git pull origin main

echo "Installing frontend dependencies..."
npm ci

echo "Building frontend..."
npm run build

echo "Installing backend dependencies..."
cd server && npm ci && cd ..

echo "Restarting API with PM2..."
pm2 restart cortexbuild-api || pm2 start server/index.js --name cortexbuild-api
pm2 save

echo "Reloading nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "=== Deploy complete ==="
pm2 status cortexbuild-api
