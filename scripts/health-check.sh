#!/bin/bash
set -e

APP_URL="${APP_URL:-http://localhost:3000}"
MAX_RETRIES=30
RETRY_INTERVAL=2

echo "=== Health Check ==="
echo "Checking $APP_URL"

for i in $(seq 1 $MAX_RETRIES); do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✓ Application is healthy (HTTP $HTTP_CODE)"
        exit 0
    fi
    
    echo "Attempt $i/$MAX_RETRIES: HTTP $HTTP_CODE - waiting..."
    sleep $RETRY_INTERVAL
done

echo "✗ Health check failed after $MAX_RETRIES attempts"
exit 1
