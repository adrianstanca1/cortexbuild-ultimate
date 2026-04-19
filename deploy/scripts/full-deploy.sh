#!/bin/bash
# =============================================================================
# CortexBuild Ultimate - Full Deployment Orchestrator
# =============================================================================
# Coordinates API + Frontend deployment with rollback on failure
#
# Usage: bash full-deploy.sh [--api-only] [--frontend-only] [--skip-health]
# =============================================================================

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly DEPLOY_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
readonly DEPLOY_API="$DEPLOY_ROOT/deploy-api.sh"
readonly DEPLOY_FRONTEND="$DEPLOY_ROOT/deploy-frontend.sh"
readonly VPS_SYNC="$DEPLOY_ROOT/vps-sync.sh"
readonly HEALTH_CHECK="$DEPLOY_ROOT/health-check.sh"

# Options
API_ONLY=false
FRONTEND_ONLY=false
SKIP_HEALTH=false
SKIP_BUILD=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} [$1] $2"
}
log_info()   { log "${BLUE}INFO${NC}" "$1"; }
log_success(){ log "${GREEN}SUCCESS${NC}" "$1"; }
log_warn()   { log "${YELLOW}WARN${NC}" "$1"; }
log_error()  { log "${RED}ERROR${NC}" "$1"; }

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --api-only) API_ONLY=true; shift ;;
        --frontend-only) FRONTEND_ONLY=true; shift ;;
        --skip-health) SKIP_HEALTH=true; shift ;;
        --skip-build) SKIP_BUILD=true; shift ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# Run deployment
run_deployment() {
    local name="$1"
    local script="$2"
    local skip_flag=""
    
    if [ "$SKIP_BUILD" = true ]; then
        skip_flag="--skip-build"
    fi
    
    echo ""
    log_info "Starting $name deployment..."
    echo "───────────────────────────────────────────────────────────────"
    
    if [ -f "$script" ]; then
        bash "$script" $skip_flag
        return $?
    else
        log_error "Script not found: $script"
        return 1
    fi
}

# Run health check
run_health_check() {
    if [ "$SKIP_HEALTH" = false ] && [ -f "$HEALTH_CHECK" ]; then
        echo ""
        log_info "Running post-deployment health checks..."
        echo "───────────────────────────────────────────────────────────────"
        bash "$HEALTH_CHECK" || true
    fi
}

# Main
main() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║     CortexBuild Ultimate - Full Deployment Orchestrator      ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    
    local start_time=$(date +%s)
    local failed=false
    
    # Deploy API
    if [ "$FRONTEND_ONLY" = false ]; then
        if ! run_deployment "API" "$DEPLOY_API"; then
            log_error "API deployment failed"
            failed=true
        fi
    fi
    
    # Deploy Frontend
    if [ "$API_ONLY" = false ] && [ "$failed" = false ]; then
        if ! run_deployment "Frontend" "$DEPLOY_FRONTEND"; then
            log_error "Frontend deployment failed"
            failed=true
        fi
    fi
    
    # Sync to VPS
    if [ "$failed" = false ] && [ -f "$VPS_SYNC" ]; then
        echo ""
        log_info "Syncing to VPS..."
        echo "───────────────────────────────────────────────────────────────"
        if ! bash "$VPS_SYNC" --skip-health; then
            log_warn "VPS sync had issues (non-fatal)"
        fi
    fi
    
    # Health check
    run_health_check
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    
    if [ "$failed" = true ]; then
        echo "║                    Deployment FAILED                           ║"
        echo "╚═══════════════════════════════════════════════════════════════╝"
        exit 1
    else
        echo "║                  Deployment Complete!                          ║"
        echo "╚═══════════════════════════════════════════════════════════════╝"
        echo ""
        echo "  Duration: ${duration}s"
        echo ""
    fi
}

main "$@"
