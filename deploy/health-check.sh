#!/bin/bash
set -euo pipefail

# CortexBuild Ultimate - Comprehensive Health Check Script
# Verifies all services and components are running correctly

readonly VPS_HOST="root@72.62.132.43"
readonly PRODUCTION_URL="https://cortexbuildpro.com"
readonly LOCAL_URL="http://localhost"

echo "🏥 CortexBuild Ultimate - Health Check"
echo "======================================"
date
echo

# Function to check URL with retry
check_url() {
    local url="$1"
    local description="$2"
    local max_attempts=3
    local attempt=1
    
    echo -n "🔍 Checking $description... "
    
    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$url" >/dev/null 2>&1; then
            echo "✅ OK"
            return 0
        fi
        sleep 2
        ((attempt++))
    done
    
    echo "❌ FAILED"
    return 1
}

# Function to check service on VPS
check_vps_service() {
    local service="$1"
    local description="$2"
    
    echo -n "🔍 Checking $description on VPS... "
    
    if ssh -o ConnectTimeout=10 "$VPS_HOST" "$service" >/dev/null 2>&1; then
        echo "✅ OK"
        return 0
    else
        echo "❌ FAILED"
        return 1
    fi
}

echo "🌐 PRODUCTION ENVIRONMENT CHECKS"
echo "================================="

# Production URL checks
check_url "$PRODUCTION_URL" "Production frontend" || PROD_ISSUES=1
check_url "$PRODUCTION_URL/api/health" "Production API" || PROD_ISSUES=1

echo
echo "🏠 LOCAL ENVIRONMENT CHECKS"
echo "==========================="

# Local service checks
check_url "$LOCAL_URL:3000" "Local frontend dev server" || LOCAL_ISSUES=1
check_url "$LOCAL_URL:3001/api/health" "Local API server" || LOCAL_ISSUES=1
check_url "$LOCAL_URL:9090" "Prometheus" || LOCAL_ISSUES=1
check_url "$LOCAL_URL:3002" "Grafana" || LOCAL_ISSUES=1
check_url "$LOCAL_URL:11434/api/tags" "Ollama AI service" || LOCAL_ISSUES=1

echo
echo "🐳 DOCKER CONTAINER STATUS"
echo "=========================="

if command -v docker >/dev/null 2>&1; then
    echo "Local Docker containers:"
    docker-compose ps 2>/dev/null | grep -E "(cortexbuild|Up|healthy)" || echo "⚠️ No containers running"
else
    echo "❌ Docker not available"
    LOCAL_ISSUES=1
fi

echo
echo "🔗 VPS CONNECTIVITY CHECKS"
echo "=========================="

# VPS accessibility
if ping -c 1 72.62.132.43 >/dev/null 2>&1; then
    echo "✅ VPS ping successful (72.62.132.43)"
    
    # SSH connectivity
    if ssh -o ConnectTimeout=5 "$VPS_HOST" "echo 'SSH OK'" >/dev/null 2>&1; then
        echo "✅ SSH connection successful"
        
        # VPS services
        check_vps_service "docker ps --filter 'name=cortexbuild' --format 'table {{.Names}}\t{{.Status}}'" "Docker containers"
        check_vps_service "curl -sf http://localhost/api/health" "VPS API endpoint"
        check_vps_service "systemctl is-active docker" "Docker daemon"
        
    else
        echo "❌ SSH connection failed"
        echo "🔧 To fix: Check SSH keys or reset VPS password via Hostinger panel"
        VPS_ISSUES=1
    fi
else
    echo "❌ VPS unreachable (ping failed)"
    VPS_ISSUES=1
fi

echo
echo "💾 DATABASE CHECKS"
echo "=================="

# Local database
if docker exec cortexbuild-db pg_isready -U cortexuser -d cortexbuild >/dev/null 2>&1; then
    echo "✅ Local PostgreSQL responsive"
    
    # Database connection test
    if docker exec cortexbuild-db psql -U cortexuser -d cortexbuild -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ Database query test passed"
    else
        echo "❌ Database query test failed"
        LOCAL_ISSUES=1
    fi
else
    echo "❌ Local PostgreSQL not responsive"
    LOCAL_ISSUES=1
fi

# Redis
if docker exec cortexbuild-redis redis-cli ping >/dev/null 2>&1; then
    echo "✅ Redis responsive"
else
    echo "❌ Redis not responsive"
    LOCAL_ISSUES=1
fi

echo
echo "🔐 SECURITY STATUS"
echo "=================="

# SSL certificate check
echo -n "🔍 Checking SSL certificate... "
if echo | openssl s_client -connect cortexbuildpro.com:443 -servername cortexbuildpro.com 2>/dev/null | openssl x509 -noout -dates | grep -q "notAfter"; then
    CERT_EXPIRY=$(echo | openssl s_client -connect cortexbuildpro.com:443 -servername cortexbuildpro.com 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | cut -d= -f2)
    echo "✅ Valid (expires: $CERT_EXPIRY)"
else
    echo "❌ Certificate check failed"
    PROD_ISSUES=1
fi

# Security headers check
echo -n "🔍 Checking security headers... "
if curl -sI "$PRODUCTION_URL" | grep -q "Strict-Transport-Security"; then
    echo "✅ HSTS enabled"
else
    echo "⚠️ Security headers missing"
fi

echo
echo "📊 PERFORMANCE METRICS"
echo "======================"

# Response time check
echo -n "🔍 Checking response times... "
RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$PRODUCTION_URL" || echo "failed")
if [ "$RESPONSE_TIME" != "failed" ] && [ $(echo "$RESPONSE_TIME < 3.0" | bc -l) -eq 1 ]; then
    echo "✅ ${RESPONSE_TIME}s (good)"
else
    echo "⚠️ Slow response: ${RESPONSE_TIME}s"
fi

echo
echo "🎯 SUMMARY"
echo "=========="

TOTAL_ISSUES=$((${PROD_ISSUES:-0} + ${LOCAL_ISSUES:-0} + ${VPS_ISSUES:-0}))

if [ $TOTAL_ISSUES -eq 0 ]; then
    echo "🎉 ALL SYSTEMS HEALTHY!"
    echo "✅ Production: Operational"
    echo "✅ Local Dev: Operational" 
    echo "✅ VPS: Accessible"
    exit 0
else
    echo "⚠️ ISSUES DETECTED: $TOTAL_ISSUES"
    
    if [ ${PROD_ISSUES:-0} -gt 0 ]; then
        echo "❌ Production issues detected"
    fi
    
    if [ ${LOCAL_ISSUES:-0} -gt 0 ]; then
        echo "❌ Local environment issues detected"
    fi
    
    if [ ${VPS_ISSUES:-0} -gt 0 ]; then
        echo "❌ VPS connectivity issues detected"
        echo "🔧 Fix VPS access: ~/cortexbuild-ultimate/deploy/vps-access-recovery.sh"
    fi
    
    exit 1
fi