#!/bin/bash
# CortexBuild Ultimate - Frontend Deploy Script
# Builds and deploys frontend to production VPS
# Usage: bash /root/deploy-frontend.sh
set -euo pipefail

echo "=== CortexBuild Frontend Deploy ==="
echo "Started at: $(date)"
echo ""

PROJECT_DIR="/var/www/cortexbuild-ultimate"
DIST_DIR="/var/www/cortexbuild-ultimate/dist"

# Pull latest code
echo "1. Pulling latest code..."
cd "$PROJECT_DIR"
git pull origin main
echo "   ✅ Code pulled"
echo ""

# Build frontend
echo "2. Building frontend..."
npm ci --ignore-scripts
npm run build
echo "   ✅ Build complete"
echo ""

# Verify dist exists
if [ ! -d "$DIST_DIR" ]; then
    echo "   ❌ Build failed - dist directory not found"
    exit 1
fi

# Set permissions
echo "3. Setting permissions..."
chown -R www-data:www-data "$DIST_DIR"
echo "   ✅ Permissions set"
echo ""

echo "=== Frontend Deploy Complete ==="
echo "Finished at: $(date)"
