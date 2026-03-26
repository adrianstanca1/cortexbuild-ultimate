#!/bin/bash
# Deploy CortexBuild frontend to VPS
set -e

VPS="root@72.62.132.43"
VPS_PATH="/var/www/cortexbuild-ultimate"
VPS_PASS="Cumparavinde12@"

echo "=== Building ==="
npm run build

echo "=== Syncing to VPS ==="
sshpass -p "$VPS_PASS" rsync -e "ssh -o StrictHostKeyChecking=accept-new" \
  -avz --delete \
  ./dist/ "$VPS:$VPS_PATH/dist/"

echo "=== Fixing permissions (nginx container UID 101 needs read) ==="
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=accept-new "$VPS" \
  "chmod -R 755 $VPS_PATH/dist/"

echo "=== Verifying ==="
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=accept-new "$VPS" \
  "curl -sf -o /dev/null -w 'Site: %{http_code}' https://www.cortexbuildpro.com/ && echo ' ✓'"

echo "=== Done ==="
