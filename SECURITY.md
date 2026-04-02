# CortexBuild Ultimate - Security Documentation

## 🔴 Critical Security Issues (RESOLVED)

### Issue 1: Hardcoded Password in Deploy Scripts
**Status:** ✅ Fixed  
**Date:** 2026-04-02  
**Severity:** CRITICAL

**Problem:**
```bash
# OLD (INSECURE) - deploy.sh contained:
VPS_PASS="Cumparavinde12@"
```

**Solution:**
- Removed all hardcoded passwords from `deploy.sh` and `deploy/vps-sync.sh`
- Implemented SSH key-based authentication
- All scripts now use `~/.ssh/id_ed25519_vps` for authentication

**Action Required:**
1. Rotate the exposed password on your VPS immediately
2. Use the new scripts which use SSH keys

---

### Issue 2: Exposed SMTP Credentials
**Status:** ⚠️ Requires Action  
**Date:** 2026-04-02  
**Severity:** CRITICAL

**Problem:**
VPS `.env` file contains exposed Gmail credentials:
```
SMTP_USER=adrian.stanca1@gmail.com
SMTP_PASS=tcgkvutdktdtihjz
```

**Solution:**
1. **Immediately** change your Gmail app password
2. Run `./deploy/setup-production-env.sh` to generate secure .env files
3. Never store plaintext passwords in version control

**Steps to Rotate:**
1. Go to Google Account → Security → App Passwords
2. Revoke the current app password
3. Generate a new one
4. Update VPS: `./deploy/setup-production-env.sh`

---

### Issue 3: Inconsistent Deployment Paths
**Status:** ⚠️ Requires Manual Fix  
**Date:** 2026-04-02  
**Severity:** MEDIUM

**Problem:**
- Nginx container mounting from `/root/cortexbuild-work/dist`
- Should use `/var/www/cortexbuild-ultimate/dist`

**Solution:**
Run the fix script:
```bash
./deploy/recreate-nginx.sh
```

---

## 🔐 Security Best Practices

### 1. Environment Variables

**Never commit `.env` files.** They are in `.gitignore` for a reason.

**Production .env template:** See `.env.production.example`

**Generate secure secrets:**
```bash
# 64-character hex string (JWT, session secrets)
openssl rand -hex 32

# 24-character alphanumeric (database passwords)
openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24

# UUID (unique identifiers)
uuidgen
```

---

### 2. SSH Key Management

**Generate deployment key:**
```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_vps -C 'cortexbuild-deploy'
```

**Copy to VPS:**
```bash
ssh-copy-id -i ~/.ssh/id_ed25519_vps.pub root@72.62.132.43
```

**Add to agent:**
```bash
ssh-add ~/.ssh/id_ed25519_vps
```

**Verify VPS authorized_keys:**
```bash
ssh root@72.62.132.43 "cat ~/.ssh/authorized_keys"
```

---

### 3. Database Security

**Current setup:**
- PostgreSQL bound to `127.0.0.1:5432` (localhost only)
- Not exposed to public internet ✅
- Strong password required ✅

**Recommendations:**
1. Use strong passwords (24+ characters)
2. Never use default credentials
3. Regular backups: `/var/backups/cortexbuild-db-*.sql`
4. Enable PostgreSQL logging for audit

**Backup command:**
```bash
ssh root@72.62.132.43 "docker exec cortexbuild-db pg_dump -U cortexbuild cortexbuild > backup.sql"
```

---

### 4. JWT Security

**Current setup:**
- JWT tokens for authentication
- Configurable secret via `JWT_SECRET`

**Requirements:**
1. Use 64-character hex string minimum
2. Different secret for production vs development
3. Rotate every 90 days

**Generate:**
```bash
openssl rand -hex 32
```

**Update on VPS:**
```bash
./deploy/setup-production-env.sh
```

---

### 5. CORS Configuration

**Current setup:**
```env
CORS_ORIGIN=https://cortexbuildpro.com,https://www.cortexbuildpro.com
```

**Requirements:**
1. Always specify allowed origins in production
2. Never use `*` wildcard
3. Include both www and non-www variants

---

### 6. Rate Limiting

**Current setup:**
- 100 requests per minute per token/path
- Token-based (not IP-based)

**Location:** `server/middleware/rateLimiter.js`

**Adjust if needed:**
```env
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

---

### 7. File Upload Security

**Current setup:**
- Max upload size: 100MB
- Stored in `server/uploads/`
- Served via nginx with security headers

**Security measures:**
1. File type validation on backend
2. Size limits enforced
3. Stored outside web root
4. No executable permissions

---

### 8. HTTPS/SSL

**Current status:** ⚠️ HTTP only

**Nginx config currently:**
- Port 80 (HTTP) only
- No SSL certificate configured

**To enable HTTPS:**

1. **Get SSL certificate (Let's Encrypt):**
```bash
ssh root@72.62.132.43
apt install certbot
certbot certonly --standalone -d cortexbuildpro.com -d www.cortexbuildpro.com
```

2. **Update nginx config:**
```nginx
server {
    listen 443 ssl http2;
    server_name cortexbuildpro.com www.cortexbuildpro.com;
    
    ssl_certificate /etc/letsencrypt/live/cortexbuildpro.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cortexbuildpro.com/privkey.pem;
    
    # ... rest of config
}

server {
    listen 80;
    server_name cortexbuildpro.com www.cortexbuildpro.com;
    return 301 https://$server_name$request_uri;
}
```

3. **Restart nginx:**
```bash
docker-compose restart nginx
```

---

## 🛡️ Security Headers

Current headers (via nginx):
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

**Additional recommended headers:**
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

---

## 📋 Security Checklist

### Pre-Deployment
- [ ] Generate secure JWT secret
- [ ] Generate secure database password
- [ ] Set up SSH key authentication
- [ ] Remove all hardcoded passwords from scripts
- [ ] Review CORS configuration
- [ ] Enable rate limiting

### Post-Deployment
- [ ] Verify HTTPS is working
- [ ] Test authentication flow
- [ ] Check database is not publicly accessible
- [ ] Verify backup scripts are working
- [ ] Review container logs for errors
- [ ] Run security scan (optional)

### Ongoing (Monthly)
- [ ] Review access logs
- [ ] Check for security updates
- [ ] Verify backups are restorable
- [ ] Review user permissions
- [ ] Rotate API keys if compromised
- [ ] Update dependency audit: `npm audit`

---

## 🔍 Security Audit Commands

### Check for vulnerable dependencies
```bash
cd /Users/adrianstanca/cortexbuild-ultimate
npm audit
npm audit fix
```

### Check for exposed secrets in codebase
```bash
# Search for potential secrets
grep -r "password\|secret\|api_key\|token" --include="*.ts" --include="*.js" src/ server/
```

### Check container security
```bash
ssh root@72.62.132.43 "docker inspect cortexbuild-api | grep -A 10 'Env'"
```

### Check file permissions
```bash
ssh root@72.62.132.43 "ls -la /var/www/cortexbuild-ultimate/.env*"
```

---

## 📞 Incident Response

### If Credentials Are Compromised

1. **Database password:**
   ```bash
   ssh root@72.62.132.43
   docker exec cortexbuild-db psql -U cortexbuild -c "ALTER USER cortexbuild WITH PASSWORD 'new_secure_password';"
   # Update .env and restart
   ```

2. **JWT secret:**
   ```bash
   # Update JWT_SECRET in .env
   # All users will need to re-login
   ./deploy/setup-production-env.sh
   ```

3. **SSH key:**
   ```bash
   # Remove old key from VPS
   ssh root@72.62.132.43 "sed -i '/old-key-comment/d' ~/.ssh/authorized_keys"
   # Generate new key
   ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_vps_new
   # Copy new key
   ssh-copy-id -i ~/.ssh/id_ed25519_vps_new.pub root@72.62.132.43
   ```

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

---

**Last Updated:** 2026-04-02  
**Next Review:** 2026-05-02
