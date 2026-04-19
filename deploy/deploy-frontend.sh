#!/bin/bash
# CortexBuild Ultimate - Frontend Deploy Script
# Builds and deploys frontend to production VPS
# Usage: bash /root/deploy-frontend.sh
set -euo pipefail

echo "=== CortexBuild Frontend Deploy ==="
echo "Started at: $(date)"
echo ""

DEFAULT_PROJECT_DIR="/var/www/cortexbuild-ultimate"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FALLBACK_PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -d "$DEFAULT_PROJECT_DIR/.git" ]; then
    PROJECT_DIR="$DEFAULT_PROJECT_DIR"
elif [ -d "$FALLBACK_PROJECT_DIR/.git" ]; then
    PROJECT_DIR="$FALLBACK_PROJECT_DIR"
else
    echo "   ❌ Could not locate project directory."
    echo "      Checked: $DEFAULT_PROJECT_DIR and $FALLBACK_PROJECT_DIR"
    exit 1
fi

DIST_DIR="$PROJECT_DIR/dist"

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
