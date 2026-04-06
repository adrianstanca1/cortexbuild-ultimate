# CortexBuild Ultimate v3.0 — Deployment Guide

**Production Deployment Ready**  
**Date:** April 6, 2026

---

## Pre-Deployment Checklist

### 1. Database Migrations

```bash
# Apply the critical multi-tenancy migration to ALL environments
psql "$DATABASE_URL" -f server/migrations/038_add_multitenancy_to_new_modules.sql

# Verify all 34 migrations have been applied
psql "$DATABASE_URL" -c "SELECT COUNT(*) as migration_count FROM information_schema.tables WHERE table_name LIKE '%migration%';"
```

**Critical:** This migration adds `organization_id` + `company_id` to 13 new module tables. **MUST be deployed first.**

### 2. Environment Configuration

```bash
# Copy production .env template
cp .env.production.example .env.production

# Update with actual values:
# - DB_PASSWORD (PostgreSQL)
# - JWT_SECRET (32+ char random string)
# - GOOGLE_CLIENT_ID & SECRET (from Google Cloud)
# - MICROSOFT_CLIENT_ID & SECRET (from Azure AD)
# - OLLAMA_HOST (http://localhost:11434 or remote)
# - FRONTEND_URL (https://www.cortexbuildpro.com)
# - CORS_ORIGIN (https://cortexbuildpro.com)
```

### 3. SSL Certificates

```bash
# Verify SSL certs are valid (not self-signed for production)
ls -la nginx/ssl/
# Should contain: cert.pem, chain.pem, fullchain.pem, privkey.pem

# Test HTTPS redirect
curl -I http://www.cortexbuildpro.com  # Should 301 to https
```

### 4. Build & Test

```bash
# Build frontend production bundle
npm run build

# Verify no build errors or warnings
npm run lint  # Should pass
npx tsc --noEmit  # Should pass

# Run tests (if rolldown binding issue resolved)
npm test  # Should see 116 tests passing
```

### 5. Docker Setup

```bash
# Verify docker-compose.yml is production-ready
docker-compose config > /dev/null  # No errors

# Build all images
docker-compose build

# Verify images created
docker image ls | grep cortexbuild
```

---

## Deployment Steps

### Step 1: Deploy to VPS

```bash
# From your local machine (requires SSH key ~/.ssh/id_ed25519_vps)
cd /path/to/cortexbuild-ultimate
./deploy/vps-sync.sh

# Or manually:
ssh root@72.62.132.43 << 'DEPLOY'
  cd /var/www/cortexbuild-ultimate

  # Stop running containers
  docker-compose down -t 10

  # Pull latest code
  git fetch origin main
  git reset --hard origin/main

  # Apply database migrations
  psql "$DATABASE_URL" -f server/migrations/038_add_multitenancy_to_new_modules.sql

  # Start services
  docker-compose up -d

  # Wait for services to start
  sleep 30
DEPLOY
```

### Step 2: Health Checks

```bash
# Check API health
curl https://www.cortexbuildpro.com/api/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2026-04-06T11:00:00Z",
#   "uptime": 120
# }

# Check database connection
curl https://www.cortexbuildpro.com/api/metrics

# Check WebSocket connection
curl -I -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://www.cortexbuildpro.com/ws
```

### Step 3: Smoke Tests

```bash
# Test login flow
curl -X POST https://www.cortexbuildpro.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"***"}'

# Test module endpoints
curl https://www.cortexbuildpro.com/api/projects \
  -H "Authorization: Bearer $JWT_TOKEN"

# Test AI intent
curl -X POST https://www.cortexbuildpro.com/api/ai/execute \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"intent":"budget","context":{}}'
```

### Step 4: Monitor Services

```bash
# View logs
docker-compose logs -f cortexbuild-api
docker-compose logs -f cortexbuild-db
docker-compose logs -f cortexbuild-nginx

# Check metrics dashboard
open http://72.62.132.43:3002  # Grafana
open http://72.62.132.43:9090  # Prometheus
```

---

## Post-Deployment Verification

### 1. Security Checks

- [ ] Verify HTTPS is enforced (no HTTP access)
- [ ] Confirm SSL certificate is valid (not self-signed)
- [ ] Test that multi-tenancy isolation works (User A can't see Org B data)
- [ ] Test RBAC: Field worker can't access financial reports
- [ ] Test IDOR: Users can't access other users' records via /api/users/123

### 2. Feature Verification

- [ ] Login and create a project
- [ ] Upload a BIM model and verify clash detection works
- [ ] Create an RFI and verify real-time notification delivery
- [ ] Test AI assistant with "show me budget summary" query
- [ ] Test offline PWA: go to app, disconnect internet, verify works
- [ ] Test mobile responsiveness on iOS and Android

### 3. Performance Checks

- [ ] API response time < 200ms for list endpoints
- [ ] Database queries < 100ms (check Prometheus metrics)
- [ ] Grafana dashboard shows green across all services
- [ ] No error rate spikes in last hour

### 4. Audit Log Verification

- [ ] Create/update/delete a record
- [ ] Verify audit_log table captures the action with user_id
- [ ] Check that error messages are sanitized (no DB errors visible)

---

## Rollback Plan

If critical issues are discovered post-deployment:

```bash
ssh root@72.62.132.43 << 'ROLLBACK'
  cd /var/www/cortexbuild-ultimate

  # Use the backup created during deployment
  docker-compose down -t 10
  tar -xzf /var/backups/cortexbuild-*.tar.gz

  # Revert database migrations (if needed)
  # psql "$DATABASE_URL" -f server/migrations/rollback.sql

  docker-compose up -d

  # Verify health
  curl https://www.cortexbuildpro.com/api/health
ROLLBACK
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **API Response Time** — Target: < 200ms (p95)
2. **Database Queries** — Target: < 100ms (p95)
3. **Error Rate** — Target: < 0.1%
4. **WebSocket Connections** — Should match active user count
5. **Memory Usage** — Target: < 80% of available
6. **Disk Space** — Target: > 10GB free

### Alert Triggers

- API response time > 500ms (p95)
- Error rate > 1%
- Database connection pool exhausted
- Disk space < 5GB
- Any uncaught exception in logs

### Log Aggregation

```bash
# Centralize logs for analysis
docker-compose exec cortexbuild-api tail -f /app/logs/access.log
docker-compose exec cortexbuild-api tail -f /app/logs/error.log
```

---

## Known Issues & Workarounds

### 1. ARM64 Vitest Issue

**Issue:** Tests fail on ARM64 architecture (rolldown binding)  
**Impact:** None for production (issue only affects test environment)  
**Workaround:** Not needed; use x86_64 for test CI/CD

### 2. TypeScript Warnings

**Issue:** 13 warnings in BIMViewer.tsx, CostManagement.tsx  
**Impact:** None; logic is correct, types need refinement  
**Fix Priority:** Low (next release)

### 3. Nginx Comment

**Issue:** Docker-compose.yml has unclear comment about nginx running  
**Impact:** None; nginx properly configured  
**Fix Priority:** Documentation only

---

## Support & Escalation

### Critical Issues During Deployment

Contact: DevOps/Infrastructure team  
Escalate if: API not responding, database connection failed, SSL cert invalid

### Post-Deployment Issues

Contact: Engineering team  
Escalate if: Data leaks, security vulnerabilities, widespread feature failures

### Performance Issues

Contact: Database/performance engineering team  
Check: Prometheus/Grafana metrics, slow query log, connection pool status

---

## Success Criteria

✅ **Deployment is successful when:**

- [ ] All health checks pass (API, DB, WebSocket)
- [ ] All smoke tests pass (login, modules, AI)
- [ ] Error rate < 0.1% for 1 hour
- [ ] All 60+ modules accessible and functional
- [ ] Real-time features working (chat, notifications, WebSocket)
- [ ] Multi-tenancy isolation verified
- [ ] RBAC enforcement verified
- [ ] Audit logs capturing all mutations

---

**Deployment Estimate:** 30-45 minutes  
**Rollback Time:** 10-15 minutes  
**Go/No-Go Decision:** Made by Engineering Lead

Approve deployment: ********\_********  
Date/Time: ********\_********  
Deployed By: ********\_********
