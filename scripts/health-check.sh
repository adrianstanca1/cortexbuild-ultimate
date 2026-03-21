#!/bin/bash
# CortexBuild Ultimate — Health Check Script

APP_URL="${APP_URL:-https://cortexbuildpro.com}"
API_URL="${API_URL:-http://localhost:3001}"

echo "=== CortexBuild Health Check ==="
echo ""

# PM2 process
echo "PM2 status:"
if pm2 show cortexbuild-api 2>/dev/null | grep -q "online"; then
    echo "  ✓ cortexbuild-api is online"
else
    echo "  ✗ cortexbuild-api is NOT running"
fi
echo ""

# API endpoint
echo "API:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/auth/me" 2>/dev/null || echo "000")
if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "401" ]]; then
    echo "  ✓ API responding (HTTP $HTTP_CODE)"
else
    echo "  ✗ API not responding (HTTP $HTTP_CODE)"
fi
echo ""

# nginx
echo "nginx:"
if systemctl is-active --quiet nginx; then
    echo "  ✓ nginx is running"
else
    echo "  ✗ nginx is NOT running"
fi
echo ""

# PostgreSQL
echo "PostgreSQL:"
if sudo -u postgres psql -c "SELECT 1" -d cortexbuild >/dev/null 2>&1; then
    echo "  ✓ Database connection OK"
else
    echo "  ✗ Database connection FAILED"
fi
echo ""

# Disk space
echo "Disk:"
df -h / | awk 'NR==2 {print "  Usage: " $5 " (" $4 " free)"}'
echo ""

# Memory
echo "Memory:"
free -h | awk 'NR==2 {print "  Used: " $3 " / " $2}'
echo ""

# Ollama (optional)
echo "Ollama:"
if command -v ollama &>/dev/null && ollama ps >/dev/null 2>&1; then
    echo "  ✓ Ollama running"
    ollama list 2>/dev/null | tail -n +2 | awk '{print "    - " $1}'
else
    echo "  - Ollama not installed / not running (optional)"
fi

echo ""
echo "=== Health check complete ==="
