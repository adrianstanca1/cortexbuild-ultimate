#!/bin/bash
# CortexBuild Ultimate - API Deploy Script
# Builds Docker image and restarts API container
# Usage: bash /root/deploy-api.sh
set -euo pipefail

echo "=== CortexBuild API Deploy ==="
echo "Started at: $(date)"
echo ""

CONTAINER_NAME="cortexbuild-api"
IMAGE_NAME="cortexbuild-ultimate-api:latest"
HEALTH_URL="http://localhost:3001/api/health"
MAX_RETRIES=30
RETRY_INTERVAL=2

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

check_cortex_health() {
    local payload
    payload=$(curl --connect-timeout 2 --max-time 5 -fsS "$HEALTH_URL" 2>/dev/null || true)
    [ -n "$payload" ] || return 1
    python3 -c "import json,sys; d=json.loads(sys.argv[1]); c=d.get('checks') or {}; assert d.get('status')=='ok'; assert c.get('postgres') is True; assert c.get('redis') is True" "$payload" >/dev/null 2>&1
}

PROJECT_DIR="$(resolve_project_dir || true)"
if [ -z "$PROJECT_DIR" ]; then
    PROJECT_DIR="$HOME/cortexbuild-ultimate"
    echo "Project directory not found. Bootstrapping at $PROJECT_DIR"
    if [ ! -d "$PROJECT_DIR/.git" ]; then
        git clone "https://github.com/adrianstanca1/cortexbuild-ultimate.git" "$PROJECT_DIR"
    fi
fi
echo "Using project directory: $PROJECT_DIR"
cd "$PROJECT_DIR"

# Pull latest code
echo "1. Pulling latest code..."
git fetch origin main
git checkout main
git pull --ff-only origin main
echo "   ✅ Code pulled"
echo ""

# Build Docker image
echo "2. Building Docker image..."
docker build -t "$IMAGE_NAME" -f Dockerfile.api .
echo "   ✅ Image built: $IMAGE_NAME"
echo ""

# Stop existing container (if running)
echo "3. Stopping existing container..."
if docker ps -q --filter "name=$CONTAINER_NAME" | grep -q .; then
    docker stop "$CONTAINER_NAME" || true
    docker rm "$CONTAINER_NAME" || true
    echo "   ✅ Old container stopped and removed"
else
    echo "   ⏭️  No running container found (first deploy)"
fi
echo ""

# Start new container
echo "4. Starting new container..."
# Ensure core dependencies are running and use Postgres network for API connectivity.
if [ -f "$PROJECT_DIR/docker-compose.yml" ]; then
    docker compose up -d postgres redis >/dev/null 2>&1 || docker-compose up -d postgres redis >/dev/null 2>&1 || true
fi
docker start cortexbuild-db >/dev/null 2>&1 || true
docker start cortexbuild-redis >/dev/null 2>&1 || true

DB_CONTAINER_NET="$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{println $k}}{{end}}' cortexbuild-db 2>/dev/null | awk 'NF{print; exit}')"
if [ -n "${DB_CONTAINER_NET:-}" ] && docker network inspect "$DB_CONTAINER_NET" >/dev/null 2>&1; then
    DOCKER_NET="$DB_CONTAINER_NET"
else
    COMPOSE_NET="cortexbuild-ultimate_cortexbuild"
    FALLBACK_NET="cortexbuild"
    if docker network inspect "$COMPOSE_NET" >/dev/null 2>&1; then
        DOCKER_NET="$COMPOSE_NET"
    else
        if ! docker network inspect "$FALLBACK_NET" >/dev/null 2>&1; then
            echo "Creating $FALLBACK_NET network..."
            docker network create "$FALLBACK_NET"
        fi
        DOCKER_NET="$FALLBACK_NET"
    fi
fi

# Source environment from root and server subdirectory if present
if [ -f "$PROJECT_DIR/.env" ]; then
    set +u
    set -a
    source "$PROJECT_DIR/.env"
    set +a
    set -u
fi
if [ -f "$PROJECT_DIR/server/.env" ]; then
    set +u
    set -a
    source "$PROJECT_DIR/server/.env"
    set +a
    set -u
fi

# Fallback: recover secrets from existing container env if files are missing/incomplete
if docker ps -a --format '{{.Names}}' | grep -Fx "$CONTAINER_NAME" >/dev/null 2>&1; then
    EXISTING_ENV=$(docker inspect "$CONTAINER_NAME" --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null || true)
    if [ -n "$EXISTING_ENV" ]; then
        [ -z "${JWT_SECRET:-}" ] && JWT_SECRET=$(printf '%s\n' "$EXISTING_ENV" | sed -n 's/^JWT_SECRET=//p' | tail -n 1)
        [ -z "${SESSION_SECRET:-}" ] && SESSION_SECRET=$(printf '%s\n' "$EXISTING_ENV" | sed -n 's/^SESSION_SECRET=//p' | tail -n 1)
        if [ -z "${POSTGRES_PASSWORD:-}" ] && [ -z "${DB_PASSWORD:-}" ]; then
            DB_PASSWORD=$(printf '%s\n' "$EXISTING_ENV" | sed -n 's/^DB_PASSWORD=//p' | tail -n 1)
            [ -z "${DB_PASSWORD:-}" ] && POSTGRES_PASSWORD=$(printf '%s\n' "$EXISTING_ENV" | sed -n 's/^POSTGRES_PASSWORD=//p' | tail -n 1)
        fi
    fi
fi

if [ -z "${DB_PASSWORD:-}" ] && [ -n "${POSTGRES_PASSWORD:-}" ]; then
    export DB_PASSWORD="$POSTGRES_PASSWORD"
fi

MISSING_SECRETS=()
[ -z "${DB_PASSWORD:-}" ] && [ -z "${POSTGRES_PASSWORD:-}" ] && MISSING_SECRETS+=("DB_PASSWORD or POSTGRES_PASSWORD")
[ -z "${JWT_SECRET:-}" ] && MISSING_SECRETS+=("JWT_SECRET")
[ -z "${SESSION_SECRET:-}" ] && MISSING_SECRETS+=("SESSION_SECRET")
if [ "${#MISSING_SECRETS[@]}" -gt 0 ]; then
    echo "FATAL: Missing required secrets (${MISSING_SECRETS[*]}) in $PROJECT_DIR/.env or $PROJECT_DIR/server/.env (or recover from existing container env)."
    exit 1
fi

docker run -d \
    --name "$CONTAINER_NAME" \
    --restart always \
    --network "$DOCKER_NET" \
    -p 127.0.0.1:3001:3001 \
    -e DB_HOST=cortexbuild-db \
    -e DB_PORT=5432 \
    -e DB_NAME=cortexbuild \
    -e DB_USER=cortexbuild \
    -e DB_PASSWORD \
    -e JWT_SECRET \
    -e SESSION_SECRET \
    -e REDIS_HOST=cortexbuild-redis \
    -e PORT=3001 \
    -e NODE_ENV=production \
    -e OLLAMA_HOST=http://cortexbuild-ollama:11434 \
    -e OLLAMA_MODEL=qwen3.5:latest \
    -e CORS_ORIGIN=https://cortexbuildpro.com \
    -e FRONTEND_URL=https://cortexbuildpro.com \
    -e GOOGLE_CLIENT_ID \
    -e GOOGLE_CLIENT_SECRET \
    -e GOOGLE_CALLBACK_URL=https://cortexbuildpro.com/api/auth/google/callback \
    -e MICROSOFT_CLIENT_ID \
    -e MICROSOFT_CLIENT_SECRET \
    -e MICROSOFT_TENANT=common \
    -e MICROSOFT_CALLBACK_URL=https://cortexbuildpro.com/api/auth/microsoft/callback \
    "$IMAGE_NAME"
echo "   ✅ Container started: $CONTAINER_NAME"
echo ""

# Health check
echo "5. Running health check..."
for i in $(seq 1 $MAX_RETRIES); do
    if check_cortex_health; then
        echo "   ✅ API health contract verified"
        echo ""
        echo "=== API Deploy Complete ==="
        echo "Finished at: $(date)"
        exit 0
    fi

    echo "   Attempt $i/$MAX_RETRIES: health contract not ready - waiting..."
    sleep $RETRY_INTERVAL
done

echo "   ❌ Health contract check failed after $MAX_RETRIES attempts"
echo "   Showing recent logs:"
docker logs --tail 20 "$CONTAINER_NAME" 2>&1 || true
exit 1
