#!/bin/bash
# Deploy CortexBuild frontend to VPS using SSH key authentication
set -e

VPS="root@72.62.132.43"
VPS_PATH="/var/www/cortexbuild-ultimate"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519_vps}"
SSH_OPTS="-o StrictHostKeyChecking=accept-new -o IdentitiesOnly=yes -i $SSH_KEY"

# Preflight check
echo "=== Preflight Check ==="
if ! ssh $SSH_OPTS "$VPS" "echo 'SSH connection successful'" >/dev/null 2>&1; then
    echo "❌ Cannot connect to VPS via SSH"
    echo "   Ensure SSH key is added to agent: ssh-add $SSH_KEY"
    exit 1
fi
echo "✅ SSH connection verified"

echo "=== Building ==="
npm run build

echo "=== Syncing to VPS ==="
rsync -e "ssh $SSH_OPTS" \
  -avz --delete \
  ./dist/ "$VPS:$VPS_PATH/dist/"

echo "=== Syncing server .env ==="
rsync -e "ssh $SSH_OPTS" \
  -avz ./.env "$VPS:$VPS_PATH/server/.env"

echo "=== Fixing permissions (nginx container UID 101 needs read) ==="
ssh $SSH_OPTS "$VPS" \
  "chmod -R 755 $VPS_PATH/dist/"

echo "=== Verifying ==="
ssh $SSH_OPTS "$VPS" \
  "curl -sf -o /dev/null -w 'Site: %{http_code}' https://www.cortexbuildpro.com/ && echo ' ✓'"

echo "=== Done ==="
