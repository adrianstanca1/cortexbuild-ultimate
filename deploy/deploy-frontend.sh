#!/bin/bash
# CortexBuild Ultimate - Frontend Deploy Script
# Builds and deploys frontend to production VPS
# Usage: bash /root/deploy-frontend.sh
set -euo pipefail

echo "=== CortexBuild Frontend Deploy ==="
echo "Started at: $(date)"
echo ""

resolve_project_dir() {
    local candidate
    local patterns=(
        "/var/www/cortexbuild-ultimate"
        "/var/www/cortexbuild-work"
        "/var/www/html/cortexbuild-ultimate"
        "/root/cortexbuild-work"
        "/root/cortexbuild-ultimate"
        "$HOME/cortexbuild-work"
        "$HOME/cortexbuild-ultimate"
        "/var/www/*"
        "/var/www/*/*"
        "/var/www/html/*"
        "/var/www/html/*/*"
        "/opt/*"
        "/opt/*/*"
        "/srv/*"
        "/srv/*/*"
        "/root/*"
        "/root/*/*"
        "/home/*/*"
        "/home/*/*/*"
    )
    for pattern in "${patterns[@]}"; do
        for candidate in $pattern; do
            if [ -d "$candidate/.git" ] && [ -f "$candidate/package.json" ] && [ -d "$candidate/server" ]; then
                echo "$candidate"
                return 0
            fi
        done
    done
    return 1
}

PROJECT_DIR="$(resolve_project_dir || true)"
if [ -z "${PROJECT_DIR:-}" ]; then
    PROJECT_DIR="$HOME/cortexbuild-ultimate"
    echo "⚠️  Project directory not found. Bootstrapping at $PROJECT_DIR"
    if [ ! -d "$PROJECT_DIR/.git" ]; then
        git clone "https://github.com/adrianstanca1/cortexbuild-ultimate.git" "$PROJECT_DIR"
    fi
fi

DIST_DIR="$PROJECT_DIR/dist"
echo "Using project directory: $PROJECT_DIR"

# Pull latest code from main deterministically
echo "1. Pulling latest code..."
cd "$PROJECT_DIR"
git fetch origin main
git checkout main
git pull --ff-only origin main
echo "   ✅ Code pulled on main"
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
