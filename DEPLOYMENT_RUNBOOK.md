# 🚀 CortexBuild Ultimate - Deployment Runbook

**Version:** 3.0.0  
**Last Updated:** 2026-04-01  
**Platform Health:** 100/100

---

## 📋 Quick Reference

| Environment | URL | Status |
|-------------|-----|--------|
| **Production** | https://www.cortexbuildpro.com | ✅ Live |
| **VPS** | 72.62.132.43 | ✅ Healthy |
| **API** | http://72.62.132.43:3001 | ✅ Running |

---

## 🛠️ Pre-Deployment Checklist

### Required Checks

- [ ] All tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] No ESLint errors (`npx eslint .`)
- [ ] Git working tree clean
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json

### Quick Check Command

```bash
npm run build && npm test && echo "✅ Ready to deploy"
```

---

## 📦 Deployment Procedures

### Standard Deployment (Recommended)

```bash
# 1. Ensure you're on main branch
git checkout main
git pull origin main

# 2. Run final verification
npm run build && npm test

# 3. Deploy to VPS
./deploy.sh

# 4. Verify deployment
curl -sf https://www.cortexbuildpro.com/ && echo "✅ Deployment successful"
```

### Manual Deployment (If deploy.sh fails)

```bash
# 1. Build locally
npm run build

# 2. Copy to VPS
scp -r dist/* root@72.62.132.43:/var/www/cortexbuild-ultimate/dist/

# 3. Fix permissions
ssh root@72.62.132.43 "chown -R nginx:nginx /var/www/cortexbuild-ultimate/dist"

# 4. Restart nginx
ssh root@72.62.132.43 "docker restart cortexbuild-nginx"

# 5. Verify
curl -sf https://www.cortexbuildpro.com/
```

### Hotfix Deployment

```bash
# 1. Create hotfix branch
git checkout -b hotfix/issue-name

# 2. Make changes and test
# ... make changes ...
npm run build && npm test

# 3. Commit and push
git add -A
git commit -m "fix: [HOTFIX] Description of fix"
git push origin hotfix/issue-name

# 4. Create PR and merge to main
# ... GitHub PR process ...

# 5. Deploy
git checkout main
git pull origin main
./deploy.sh
```

---

## 🔧 VPS Management

### SSH Connection

```bash
ssh root@72.62.132.43
# Password: [See secure password manager]
```

### Container Management

```bash
# View all containers
docker ps -a

# View running containers
docker ps

# Restart specific container
docker restart cortexbuild-nginx
docker restart cortexbuild-api

# View container logs
docker logs cortexbuild-nginx --tail 50
docker logs cortexbuild-api --tail 100

# Check container health
docker inspect cortexbuild-db | grep -i health
```

### Resource Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check Docker resource usage
docker stats --no-stream
```

---

## 🚨 Troubleshooting

### Site Returns 502 Bad Gateway

```bash
# 1. Check nginx container
ssh root@72.62.132.43 "docker ps | grep nginx"

# 2. Restart nginx
ssh root@72.62.132.43 "docker restart cortexbuild-nginx"

# 3. Check nginx logs
ssh root@72.62.132.43 "docker logs cortexbuild-nginx --tail 100"

# 4. Verify dist folder exists
ssh root@72.62.132.43 "ls -la /var/www/cortexbuild-ultimate/dist/"
```

### API Not Responding

```bash
# 1. Check API container
ssh root@72.62.132.43 "docker ps | grep cortexbuild-api"

# 2. Restart API
ssh root@72.62.132.43 "docker restart cortexbuild-api"

# 3. Check API logs
ssh root@72.62.132.43 "docker logs cortexbuild-api --tail 100"

# 4. Test API directly
ssh root@72.62.132.43 "curl -s http://localhost:3001/api/health"
```

### Database Connection Issues

```bash
# 1. Check database container
ssh root@72.62.132.43 "docker ps | grep cortexbuild-db"

# 2. Check database health
ssh root@72.62.132.43 "docker inspect cortexbuild-db | grep -i health"

# 3. Restart database
ssh root@72.62.132.43 "docker restart cortexbuild-db"

# 4. Check database logs
ssh root@72.62.132.43 "docker logs cortexbuild-db --tail 100"
```

### Build Fails

```bash
# 1. Clear node_modules and cache
rm -rf node_modules dist package-lock.json

# 2. Reinstall dependencies
npm install

# 3. Try build again
npm run build

# 4. If still failing, check for TypeScript errors
npx tsc --noEmit
```

---

## 📊 Monitoring

### Health Check Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `/api/health` | API health | `{"status":"ok"}` |
| `/` | Frontend | HTTP 200 |
| `/dashboard` | Dashboard page | HTTP 200 |

### Automated Monitoring

```bash
# Add to crontab for automated health checks
*/5 * * * * curl -sf https://www.cortexbuildpro.com/api/health > /dev/null || echo "Health check failed" | mail -s "CortexBuild Alert" admin@example.com
```

### Lighthouse CI

```bash
# Run Lighthouse CI locally
npx @lhci/cli autorun

# View results
cat .lighthouseci/report.html
```

---

## 🔐 Security Procedures

### Rotate API Keys

```bash
# 1. Update environment variable on VPS
ssh root@72.62.132.43
nano /var/www/cortexbuild-ultimate/.env

# 2. Restart API
docker restart cortexbuild-api

# 3. Verify
curl -sf http://localhost:3001/api/health
```

### SSL Certificate Renewal

```bash
# Certbot auto-renewal is configured
# Check renewal status
ssh root@72.62.132.43 "certbot certificates"

# Manual renewal if needed
ssh root@72.62.132.43 "certbot renew"

# Restart nginx after renewal
ssh root@72.62.132.43 "docker restart cortexbuild-nginx"
```

---

## 📈 Performance Optimization

### Clear Build Cache

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Clear npm cache
npm cache clean --force

# Rebuild
npm run build
```

### Database Optimization

```bash
# Connect to database
ssh root@72.62.132.43 "docker exec -it cortexbuild-db psql -U cortexbuild -d cortexbuild"

# Run vacuum analyze
VACUUM ANALYZE;

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size 
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 📞 Emergency Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| DevOps | [TBD] | After 30 min |
| Platform Lead | [TBD] | After 1 hour |
| CTO | [TBD] | After 2 hours |

---

## 📝 Deployment Log

| Date | Version | Deployed By | Status | Notes |
|------|---------|-------------|--------|-------|
| 2026-04-01 | 3.0.0 | AI Agent | ✅ Success | 100/100 platform health |
| 2026-03-29 | 2.5.0 | AI Agent | ✅ Success | Database optimization |
| 2026-03-01 | 2.0.0 | AI Agent | ✅ Success | Full platform launch |

---

## 🎯 Post-Deployment Verification

### Automated Verification Script

```bash
#!/bin/bash
echo "=== Post-Deployment Verification ==="

# Frontend check
echo -n "Frontend: "
curl -sf -o /dev/null -w '%{http_code}\n' https://www.cortexbuildpro.com/

# API check
echo -n "API: "
ssh root@72.62.132.43 "curl -s http://localhost:3001/api/health"

# Container check
echo "Containers:"
ssh root@72.62.132.43 "docker ps --filter 'name=cortexbuild' --format 'table {{.Names}}\t{{.Status}}'"

echo "=== Verification Complete ==="
```

### Manual Verification Checklist

- [ ] Frontend loads (https://www.cortexbuildpro.com)
- [ ] Login works
- [ ] Dashboard displays
- [ ] API responds (curl /api/health)
- [ ] All containers healthy
- [ ] No errors in logs
- [ ] Lighthouse scores meet budgets

---

*Deployment Runbook v3.0.0*  
*Last Updated: 2026-04-01*  
*Platform Health: 100/100*
