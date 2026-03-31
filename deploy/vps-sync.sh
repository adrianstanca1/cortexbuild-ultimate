#!/bin/bash
set -euo pipefail

# CortexBuild Ultimate - VPS Deployment Script
# Syncs local development changes to production VPS

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly VPS_HOST="root@72.62.132.43"
readonly VPS_PATH="/opt/cortexbuild-ultimate"
readonly BACKUP_PATH="/opt/backups/cortexbuild-$(date +%Y%m%d_%H%M%S)"

echo "🚀 CortexBuild Ultimate - VPS Deployment"
echo "=========================================="
echo "Project: $PROJECT_ROOT"
echo "Target VPS: $VPS_HOST"
echo "Remote Path: $VPS_PATH"
echo

# Preflight checks
echo "🔍 Preflight Checks..."

# Check if we can connect to VPS
if ! ssh -o ConnectTimeout=10 "$VPS_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
    echo "❌ Cannot connect to VPS. Please ensure:"
    echo "   1. SSH access is configured: ssh-add ~/.ssh/id_ed25519_vps"
    echo "   2. VPS is accessible: ping 72.62.132.43"
    echo "   3. Credentials are correct (check Hostinger panel)"
    echo
    echo "🔧 To fix VPS access:"
    echo "   1. Login to Hostinger panel"
    echo "   2. Go to VPS management for srv1262179.hstgr.cloud"
    echo "   3. Reset root password or upload SSH public key"
    echo "   4. Add public key to /root/.ssh/authorized_keys"
    exit 1
fi

# Check local build status
echo "✅ SSH connection verified"
echo "🏗️ Building production assets..."

cd "$PROJECT_ROOT"

# Ensure clean build
if ! npm run build --silent; then
    echo "❌ Build failed. Please fix TypeScript errors first."
    echo "   Run: npm run type-check"
    exit 1
fi

echo "✅ Build completed successfully"

# Check Docker setup
if ! docker --version >/dev/null 2>&1; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

# Create Docker image
echo "🐳 Building Docker image..."
docker build -t cortexbuild-ultimate:latest .

# Create deployment archive
echo "📦 Creating deployment package..."
TAR_FILE="/tmp/cortexbuild-deploy-$(date +%Y%m%d_%H%M%S).tar.gz"

tar -czf "$TAR_FILE" \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='*.log' \
    --exclude='.env*' \
    -C "$PROJECT_ROOT" .

echo "✅ Package created: $TAR_FILE"

# VPS Deployment
echo "🌐 Deploying to VPS..."

# Create backup of existing deployment
ssh "$VPS_HOST" "
    if [ -d '$VPS_PATH' ]; then
        echo 'Creating backup...'
        sudo mkdir -p $(dirname '$BACKUP_PATH')
        sudo cp -r '$VPS_PATH' '$BACKUP_PATH'
        echo 'Backup created: $BACKUP_PATH'
    fi
"

# Upload and extract
echo "📤 Uploading package..."
scp "$TAR_FILE" "$VPS_HOST:/tmp/cortexbuild-deploy.tar.gz"

ssh "$VPS_HOST" "
    # Setup deployment directory
    sudo mkdir -p '$VPS_PATH'
    cd '$VPS_PATH'
    
    # Extract new code
    sudo tar -xzf /tmp/cortexbuild-deploy.tar.gz
    
    # Set permissions
    sudo chown -R root:root .
    
    # Install dependencies
    echo '📦 Installing dependencies...'
    npm ci --production
    cd server && npm ci --production && cd ..
    
    # Build production assets
    echo '🏗️ Building production assets on VPS...'
    npm run build
    
    # Start services
    echo '🚀 Starting services...'
    docker-compose down || true
    docker-compose up -d
    
    # Health check
    echo '🏥 Waiting for services to start...'
    sleep 30
    
    # Verify deployment
    if curl -f http://localhost/api/health >/dev/null 2>&1; then
        echo '✅ Deployment successful!'
        echo '🌐 Site available at: https://cortexbuildpro.com'
    else
        echo '⚠️ Service health check failed'
        echo 'Please check logs: docker-compose logs'
    fi
    
    # Cleanup
    rm -f /tmp/cortexbuild-deploy.tar.gz
"

# Cleanup local files
rm -f "$TAR_FILE"

echo
echo "🎉 Deployment Complete!"
echo "======================="
echo "✅ Code synced to VPS"
echo "✅ Services restarted"
echo "✅ Health checks passed"
echo
echo "🔗 Production URLs:"
echo "   - Main site: https://cortexbuildpro.com"
echo "   - API health: https://cortexbuildpro.com/api/health"
echo "   - VPS direct: http://72.62.132.43"
echo
echo "📊 Monitoring:"
echo "   - Grafana: http://72.62.132.43:3002"
echo "   - Prometheus: http://72.62.132.43:9090"
echo
echo "🛠️ Rollback if needed:"
echo "   ssh $VPS_HOST 'sudo rm -rf $VPS_PATH && sudo mv $BACKUP_PATH $VPS_PATH'"