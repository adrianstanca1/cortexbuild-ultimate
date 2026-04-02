# CortexBuild Ultimate - Deployment Scripts

This directory contains production deployment and maintenance scripts.

## Quick Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `deploy.sh` | Frontend-only deployment | `./deploy.sh` |
| `deploy/vps-sync.sh` | Full stack deployment | `./deploy/vps-sync.sh` |
| `deploy/sync-code.sh` | Git sync (code only) | `./deploy/sync-code.sh` |
| `deploy/recreate-nginx.sh` | Fix nginx container mounts | `./deploy/recreate-nginx.sh` |
| `deploy/setup-production-env.sh` | Generate secure .env files | `./deploy/setup-production-env.sh` |

---

## Prerequisites

### SSH Key Setup

All scripts use SSH key authentication. Set up once:

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_vps -C 'cortexbuild-deploy'

# Copy to VPS
ssh-copy-id -i ~/.ssh/id_ed25519_vps.pub root@72.62.132.43

# Add to ssh-agent
ssh-add ~/.ssh/id_ed25519_vps
```

### Test Connection

```bash
ssh -i ~/.ssh/id_ed25519_vps root@72.62.132.43
```

---

## Scripts

### 1. `deploy.sh` - Frontend Deployment

**Purpose:** Quick deployment of frontend assets only (dist/).

**Use when:** You only changed frontend code (React components, styles, etc.)

**What it does:**
1. Builds production bundle (`npm run build`)
2. Syncs `dist/` to VPS via rsync
3. Fixes file permissions for nginx
4. Verifies site is accessible

**Usage:**
```bash
cd /Users/adrianstanca/cortexbuild-ultimate
./deploy.sh
```

**Environment variables:**
- `SSH_KEY` - Path to SSH key (default: `~/.ssh/id_ed25519_vps`)

---

### 2. `deploy/vps-sync.sh` - Full Stack Deployment

**Purpose:** Complete deployment including backend, Docker images, and frontend.

**Use when:** You changed backend code, dependencies, or Docker configuration.

**What it does:**
1. Builds production frontend
2. Builds Docker image locally
3. Creates deployment archive (excludes node_modules, .env, etc.)
4. Uploads to VPS
5. Creates backup of current deployment
6. Installs dependencies on VPS
7. Rebuilds and restarts Docker containers
8. Runs health checks

**Usage:**
```bash
cd /Users/adrianstanca/cortexbuild-ultimate
./deploy/vps-sync.sh
```

**Duration:** ~5-10 minutes

---

### 3. `deploy/sync-code.sh` - Git Code Sync

**Purpose:** Sync git commits to VPS without full deployment.

**Use when:** You want to quickly sync code changes and let VPS rebuild.

**What it does:**
1. Compares local and VPS git commits
2. Shows commits that will be synced
3. Creates backup of current code
4. Pushes code via git fetch
5. Reinstalls dependencies if package.json changed
6. Rebuilds frontend
7. Restarts services
8. Runs health checks

**Usage:**
```bash
cd /Users/adrianstanca/cortexbuild-ultimate
./deploy/sync-code.sh
```

**Duration:** ~2-3 minutes

---

### 4. `deploy/recreate-nginx.sh` - Fix Nginx Mounts

**Purpose:** Recreate nginx container with correct volume bindings.

**Use when:** Nginx is mounting from wrong path (e.g., `/root/cortexbuild-work/` instead of `/var/www/cortexbuild-ultimate/`)

**What it does:**
1. Stops nginx container
2. Removes container
3. Recreates with correct mounts from docker-compose.yml
4. Verifies file access
5. Runs health checks

**Usage:**
```bash
cd /Users/adrianstanca/cortexbuild-ultimate
./deploy/recreate-nginx.sh
```

---

### 5. `deploy/setup-production-env.sh` - Environment Setup

**Purpose:** Generate secure `.env` files on VPS with random secrets.

**Use when:** Setting up fresh production environment or rotating secrets.

**What it does:**
1. Generates secure random secrets (JWT, session, deploy, DB password)
2. Prompts for configuration values
3. Creates `.env`, `server/.env`, and `.env.docker`
4. Sets secure permissions (600)
5. Restarts services

**Usage:**
```bash
cd /Users/adrianstanca/cortexbuild-ultimate
./deploy/setup-production-env.sh
```

**⚠️ Important:** Save the generated secrets securely!

---

## Security Best Practices

### 1. Never Commit Secrets

All `.env*` files are in `.gitignore`. Never commit:
- Database passwords
- JWT secrets
- API keys
- SMTP credentials

### 2. Use SSH Keys

All scripts use SSH key authentication. Never use password auth in scripts.

### 3. Rotate Secrets Regularly

Run `setup-production-env.sh` periodically to rotate secrets.

### 4. Backup Before Deploy

All deployment scripts create backups automatically:
- Code backups: `/var/backups/cortexbuild-code-YYYYMMDD_HHMMSS.tar.gz`
- Full backups: `/var/backups/cortexbuild-YYYYMMDD_HHMMSS/`

### 5. Rollback Procedure

If deployment fails:

```bash
# SSH to VPS
ssh -i ~/.ssh/id_ed25519_vps root@72.62.132.43

# List backups
ls -la /var/backups/cortexbuild-*

# Rollback to specific backup
cd /var/www
sudo rm -rf cortexbuild-ultimate
sudo mv /var/backups/cortexbuild-20260401_120000 cortexbuild-ultimate
cd cortexbuild-ultimate
docker-compose down
docker-compose up -d
```

---

## Troubleshooting

### SSH Connection Failed

```bash
# Check SSH key is loaded
ssh-add -l

# Add key to agent
ssh-add ~/.ssh/id_ed25519_vps

# Test connection
ssh -i ~/.ssh/id_ed25519_vps root@72.62.132.43
```

### Build Failed

```bash
# Check TypeScript errors
npm run type-check

# Check linting
npm run lint

# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Health Check Failed

```bash
# SSH to VPS
ssh -i ~/.ssh/id_ed25519_vps root@72.62.132.43

# Check container status
docker ps

# View API logs
docker logs cortexbuild-api --tail 50

# View nginx logs
docker logs cortexbuild-nginx --tail 50

# Test API directly
curl http://localhost:3001/api/health
```

### Nginx Not Serving Files

```bash
# Check mounts
docker inspect cortexbuild-nginx --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'

# Verify files exist
docker exec cortexbuild-nginx ls -la /var/www/cortexbuild-ultimate/dist/

# Recreate container
./deploy/recreate-nginx.sh
```

---

## Production URLs

| Service | URL |
|---------|-----|
| Main Site | https://www.cortexbuildpro.com |
| API Health | https://www.cortexbuildpro.com/api/health |
| Grafana | http://72.62.132.43:3002 |
| Prometheus | http://72.62.132.43:9090 |
| VPS Direct | http://72.62.132.43 |

---

## VPS Information

| Item | Value |
|------|-------|
| IP Address | 72.62.132.43 |
| SSH User | root |
| SSH Key | `~/.ssh/id_ed25519_vps` |
| Deployment Path | `/var/www/cortexbuild-ultimate` |
| Docker Network | cortexbuild |

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f api`
2. Review runbook: `DEPLOYMENT_RUNBOOK.md`
3. Check architecture: `ARCHITECTURE.md`
