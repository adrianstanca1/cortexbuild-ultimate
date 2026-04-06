# CortexBuild Ultimate — Production Runbook

**Last Updated:** 2026-04-06  
**Version:** 3.0.0  
**VPS:** 72.62.132.43 (Hostinger, 36GB RAM, 8 cores, 400GB SSD)  
**Production URL:** https://www.cortexbuildpro.com

---

## Quick Reference

| Service    | Port     | Health Check                                   | Status     |
| ---------- | -------- | ---------------------------------------------- | ---------- |
| Frontend   | :80/:443 | `curl -s https://cortexbuildpro.com`           | Production |
| API        | :3001    | `curl http://127.0.0.1:3001/api/health`        | Docker     |
| PostgreSQL | :5432    | `docker exec cortexbuild-db pg_isready`        | Docker     |
| Redis      | :6379    | `docker exec cortexbuild-redis redis-cli ping` | Docker     |
| Ollama     | :11434   | `curl http://127.0.0.1:11434/api/tags`         | Docker     |
| Prometheus | :9090    | `curl http://127.0.0.1:9090/-/healthy`         | Docker     |
| Grafana    | :3002    | `curl http://127.0.0.1:3002/api/health`        | Docker     |

---

## 1. Deployment

### Standard Deploy

```bash
# From local machine
cd ~/cortexbuild-ultimate
./deploy/sync-code.sh

# Or manually
ssh root@72.62.132.43 "cd /var/www/cortexbuild-ultimate && git pull origin main"
./deploy.sh
```

### What Deploy Does

1. Builds production frontend (`npm run build`)
2. Syncs `dist/` to VPS via rsync
3. Pulls latest main on VPS
4. Fixes nginx permissions
5. Restarts API container
6. Verifies deployment (HTTP 200)

### Rollback

```bash
ssh root@72.62.132.43
cd /var/www/cortexbuild-ultimate
git log --oneline -5  # Find previous good commit
git reset --hard <commit-hash>
npm install --prefix server
docker restart cortexbuild-api
```

---

## 2. Troubleshooting Flows

### API Not Responding

```bash
# Step 1: Check if container is running
ssh root@72.62.132.43 "docker ps | grep cortexbuild-api"

# Step 2: Check logs
ssh root@72.62.132.43 "docker logs cortexbuild-api --tail 50"

# Step 3: Restart
ssh root@72.62.132.43 "docker restart cortexbuild-api"

# Step 4: Verify
ssh root@72.62.132.43 "curl -s http://127.0.0.1:3001/api/health"
```

### Database Connection Issues

```bash
# Step 1: Check DB container
ssh root@72.62.132.43 "docker exec cortexbuild-db pg_isready"

# Step 2: Check connections
ssh root@72.62.132.43 "docker exec cortexbuild-db psql -U cortexbuild -c 'SELECT count(*) FROM pg_stat_activity;'"

# Step 3: Kill idle connections
ssh root@72.62.132.43 "docker exec cortexbuild-db psql -U cortexbuild -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND pid <> pg_backend_pid();\""

# Step 4: Restart DB (last resort - causes downtime!)
ssh root@72.62.132.43 "docker restart cortexbuild-db && sleep 5 && docker restart cortexbuild-api"
```

### High Memory Usage

```bash
# Check memory
ssh root@72.62.132.43 "free -h && echo '---' && docker stats --no-stream"

# If API using too much memory, restart it
ssh root@72.62.132.43 "docker restart cortexbuild-api"

# Check for memory leaks in logs
ssh root@72.62.132.43 "docker logs cortexbuild-api 2>&1 | grep -i 'memory\|heap\|leak' | tail -20"
```

### SSL Certificate Issues

```bash
# Check expiry
./scripts/ssl-monitor.sh cortexbuildpro.com

# Renew Let's Encrypt
ssh root@72.62.132.43 "certbot renew --dry-run && certbot renew"

# Verify nginx config
ssh root@72.62.132.43 "nginx -t && systemctl reload nginx"
```

### Ollama Model Issues

```bash
# Check loaded models
ssh root@72.62.132.43 "docker exec cortexbuild-ollama ollama list"

# Pull new model
ssh root@72.62.132.43 "docker exec cortexbuild-ollama ollama pull qwen3.5:latest"

# Check model memory
ssh root@72.62.132.43 "docker exec cortexbuild-ollama ollama ps"

# Restart Ollama if stuck
ssh root@72.62.132.43 "docker restart cortexbuild-ollama"
```

### Redis Issues

```bash
# Check Redis
ssh root@72.62.132.43 "docker exec cortexbuild-redis redis-cli ping"

# Check memory
ssh root@72.62.132.43 "docker exec cortexbuild-redis redis-cli info memory"

# Flush if needed (CAUTION: clears all cached sessions!)
ssh root@72.62.132.43 "docker exec cortexbuild-redis redis-cli flushdb"
```

---

## 3. Monitoring

### Prometheus Metrics

- **URL:** http://127.0.0.1:9090
- **Scrape targets:** prometheus, cortexbuild-api
- **Key metrics:** `http_request_duration_seconds`, `process_resident_memory_bytes`

### Grafana Dashboards

- **URL:** http://127.0.0.1:3002
- **Login:** admin / cortexbuild_dev_grafana
- **Dashboard:** "CortexBuild Ultimate - Enhanced Dashboard"

### Key Alerts to Configure

1. API response time p95 > 2s
2. Error rate > 5%
3. Memory usage > 80%
4. Database connections > 80
5. SSL cert expiry < 30 days

---

## 4. Database Operations

### Run Migration

```bash
ssh root@72.62.132.43 "cd /var/www/cortexbuild-ultimate && ./server/scripts/run-migrations.sh"
```

### Manual Query

```bash
ssh root@72.62.132.43 "docker exec cortexbuild-db psql -U cortexbuild -d cortexbuild -c 'SELECT tablename FROM pg_tables WHERE schemaname='"'"'public'"'"';'"
```

### Backup Database

```bash
ssh root@72.62.132.43 "docker exec cortexbuild-db pg_dump -U cortexbuild cortexbuild" > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
cat backup.sql | ssh root@72.62.132.43 "docker exec -i cortexbuild-db psql -U cortexbuild cortexbuild"
```

---

## 5. Emergency Contacts

| Role             | Contact            | Method         |
| ---------------- | ------------------ | -------------- |
| Primary Dev      | adrian@ultrahub.io | Email/Telegram |
| VPS Provider     | Hostinger Support  | Ticket system  |
| Domain Registrar | [Your registrar]   | Support portal |

---

## 6. Common Commands Cheat Sheet

```bash
# Deploy
./deploy.sh

# Check all services
system-health

# View API logs
ssh root@72.62.132.43 "docker logs -f cortexbuild-api"

# Restart everything
ssh root@72.62.132.43 "cd /var/www/cortexbuild-ultimate && docker-compose restart"

# Database migration
ssh root@72.62.132.43 "cd /var/www/cortexbuild-ultimate && ./server/scripts/run-migrations.sh"

# SSL check
./scripts/ssl-monitor.sh

# Backup
./scripts/backup.sh

# Health check
curl -s https://cortexbuildpro.com/api/health
```
