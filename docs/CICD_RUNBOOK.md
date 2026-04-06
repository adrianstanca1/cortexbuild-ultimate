# CI/CD & Deployment Runbook

**Last Updated:** 2026-04-06  
**Version:** 3.0.0

---

## Architecture Overview

```
Developer → Git Push → GitHub Actions → VPS (72.62.132.43)
                                              ↓
                                    Docker Compose Stack
                                    ├── cortexbuild-api (Express, :3001)
                                    ├── cortexbuild-db (PostgreSQL 16)
                                    ├── cortexbuild-redis (Redis 7)
                                    ├── cortexbuild-nginx (Nginx, :80/443)
                                    ├── cortexbuild-ollama (Ollama, :11434)
                                    ├── cortexbuild-prometheus (Prometheus, :9090)
                                    └── cortexbuild-grafana (Grafana, :3002)
```

---

## Development Workflow

### 1. Commit Conventions

All commits MUST follow Conventional Commits format:

```
type(scope): description
```

| Type       | When to Use        | Example                                     |
| ---------- | ------------------ | ------------------------------------------- |
| `feat`     | New feature        | `feat(api): add bulk export endpoint`       |
| `fix`      | Bug fix            | `fix(auth): resolve JWT token expiration`   |
| `docs`     | Documentation      | `docs(session): record deployment status`   |
| `chore`    | Maintenance        | `chore(deps): upgrade react to 19.2`        |
| `refactor` | Code restructuring | `refactor(modules): extract sub-components` |
| `test`     | Tests              | `test(api): add rate limiter unit tests`    |
| `ci`       | CI/CD changes      | `ci(github): add deployment workflow`       |
| `perf`     | Performance        | `perf(build): enable code splitting`        |
| `build`    | Build system       | `build(vite): upgrade to 8.0`               |
| `revert`   | Revert commit      | `revert: "feat(api): add export endpoint"`  |

**Rules:**

- Type must be lowercase
- Scope is optional, in parentheses
- Description must start with lowercase letter
- No trailing period

### 2. Branch Strategy

```
main (production-ready)
├── feature/* (new features)
├── fix/* (bug fixes)
└── release/* (version bumps)
```

- All work branches from `main`
- Merge via squash to keep history clean
- Never commit directly to `main` from local — use PR

---

## Deployment Process

### Option A: Manual Deploy (Current)

```bash
# From local machine
cd ~/cortexbuild-ultimate
./deploy.sh
```

**What deploy.sh does:**

1. Runs `npm run build` (frontend → `dist/`)
2. Syncs `.env` to `server/.env`
3. rsyncs `dist/` and `.env` to VPS
4. Fixes file permissions for nginx user (UID 101)
5. Verifies deployment with HTTP request

### Option B: GitHub Actions (Configured)

Workflow file: `.github/workflows/frontend-deploy.yml`

Triggers on push to `main`:

1. Checks out code
2. Builds frontend
3. Deploys to VPS via SSH

---

## VPS Management

### SSH Access

```bash
ssh root@72.62.132.43
cd /var/www/cortexbuild-ultimate
```

### Common Commands

```bash
# Check all containers
docker ps --filter 'name=cortexbuild' --format '{{.Names}}: {{.Status}}'

# Restart API
docker restart cortexbuild-api

# View API logs
docker logs -f cortexbuild-api

# Rebuild API image
docker build -t cortexbuild-ultimate-api:latest -f Dockerfile.api .

# Restart with new image
docker stop cortexbuild-api && docker rm cortexbuild-api
REDIS_IP=$(docker inspect cortexbuild-redis --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
docker run -d --name cortexbuild-api \
  --network cortexbuild-ultimate_cortexbuild \
  -p 127.0.0.1:3001:3001 \
  -v /var/www/cortexbuild-ultimate/server/uploads:/app/uploads \
  -e REDIS_URL=redis://$REDIS_IP:6379 \
  --env-file /var/www/cortexbuild-ultimate/.env \
  --restart unless-stopped \
  cortexbuild-ultimate-api:latest

# Pull latest code
git pull origin main

# Check nginx
nginx -t && nginx -s reload

# Check SSL certs
ls -la /etc/letsencrypt/live/cortexbuildpro.com/

# Renew SSL
certbot renew --force-renewal
```

---

## Environment Configuration

### VPS `.env` File

Located at `/var/www/cortexbuild-ultimate/.env`

```bash
# Database (local Docker)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cortexbuild
DB_USER=cortexbuild
DB_PASSWORD=<secure-password>

# Redis (local Docker)
REDIS_URL=redis://localhost:6379

# Auth & Security
JWT_SECRET=<32-char-random-hex>
SESSION_SECRET=<32-char-random-hex>
```

**Critical Notes:**

- `DB_HOST` must be `localhost` (not Docker service name) — API runs on host network via port mapping
- `REDIS_URL` must use `localhost` — same reason
- JWT and SESSION secrets must be ≥32 characters

### Local Development `.env.local`

```bash
VITE_API_BASE_URL=http://localhost:3001
```

---

## CI/CD Troubleshooting

### ESLint Failures

**Problem:** CI fails on lint errors

**Fix:** The lint step is configured to fail on errors only, not warnings:

```yaml
# In .github/workflows/frontend-deploy.yml
- run: npm run lint
  continue-on-error: false # Fails on errors
```

If new warnings are introduced, they won't block deploy. To make warnings block:

1. Change ESLint config `warn` to `error`
2. Update workflow

### Build Failures

**Common causes:**

1. TypeScript errors — run `npx tsc --noEmit` locally first
2. Missing dependencies — check `package.json` and `server/package.json`
3. Node version mismatch — VPS uses Node 22, local should match

**Fix:**

```bash
# Clear cache and reinstall
rm -rf node_modules server/node_modules
npm install
cd server && npm install && cd ..
npm run build
```

### Deploy Failures

**SSH Connection Issues:**

- Verify SSH key is added to GitHub Secrets as `VPS_SSH_KEY`
- VPS IP in workflow: `72.62.132.43`
- SSH user: `root`

**Permission Issues:**

- nginx runs as UID 101 in Docker
- `deploy.sh` runs `chown -R 101:101` on synced files
- If 502 errors after deploy, check file permissions

**API Not Starting:**

```bash
# Check container status
docker ps -a | grep cortexbuild-api

# Check logs
docker logs cortexbuild-api --tail 50

# Common fix: rebuild image
docker build -t cortexbuild-ultimate-api:latest -f Dockerfile.api .
docker stop cortexbuild-api && docker rm cortexbuild-api
# Then run new container (see VPS Management above)
```

---

## SSL Certificate Management

### Current Setup

- **Provider:** Let's Encrypt via Certbot
- **Domains:** `cortexbuildpro.com`, `www.cortexbuildpro.com`
- **Auto-renewal:** Enabled (certbot cron)
- **Location:** `/etc/letsencrypt/live/cortexbuildpro.com/`

### Manual Rotation

If SSL key is compromised (e.g., committed to git):

```bash
# On VPS
certbot renew --force-renewal
nginx -s reload
```

### Verification

```bash
curl -sI https://cortexbuildpro.com | head -5
curl -sI https://www.cortexbuildpro.com | head -5
```

Both should return `HTTP/2 200`.

---

## Monitoring

### Health Checks

```bash
# API health
curl http://localhost:3001/api/health

# Frontend health
curl -I http://localhost:80

# Database health
docker exec cortexbuild-db pg_isready -U cortexbuild

# Redis health
docker exec cortexbuild-redis redis-cli ping
```

### Grafana Dashboards

- **URL:** http://72.62.132.43:3002
- **Credentials:** Admin / (set in `.env` as `GF_SECURITY_ADMIN_PASSWORD`)
- **Data Source:** Prometheus (auto-configured)

### Prometheus Targets

- **URL:** http://72.62.132.43:9090/targets
- Config file: `monitoring/prometheus.yml`

---

## Rollback Procedure

If a deploy breaks production:

```bash
# On VPS
cd /var/www/cortexbuild-ultimate

# Revert to previous commit
git reset --hard <previous-commit-hash>

# Rebuild API if backend changed
docker build -t cortexbuild-ultimate-api:latest -f Dockerfile.api .
docker restart cortexbuild-api

# Sync previous frontend
# (If dist/ was synced, re-rsync from previous commit)
git checkout <previous-commit-hash> -- dist/
rsync -avz --delete dist/ root@72.62.132.43:/var/www/cortexbuild-ultimate/dist/
```

---

## Known Gotchas

1. **Redis IP changes on container restart** — The API container must be restarted with the correct `REDIS_URL` after Redis container restarts
2. **VPS uses local Docker, not Docker Compose for API** — The API runs as a standalone container, not via `docker-compose up`
3. **`dist/` is not cleaned on deploy** — rsync with `--delete` handles cleanup
4. **Node version on VPS is 22** — Ensure local development matches
5. **PostgreSQL user is `cortexbuild`** — Not `postgres` or `root`
6. **Nginx config is NOT in git** — It's managed directly on VPS at `/etc/nginx/sites-enabled/cortexbuild`

---

## Contact

- **Repository:** https://github.com/adrianstanca1/cortexbuild-ultimate
- **Production:** https://www.cortexbuildpro.com
- **VPS:** 72.62.132.43 (Hostinger)
- **Domain:** cortexbuildpro.com (DNS: Hostinger)
