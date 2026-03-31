# CortexBuild Ultimate - Deployment Guide

## 🏗️ Architecture Overview

**Development Environment:** Full-stack React + Express + PostgreSQL + Docker
**Production Deployment:** Dual deployment strategy

### Current Infrastructure
- **Local Development:** `~/cortexbuild-ultimate` (this repository)
- **Production Frontend:** Vercel (cortexbuildpro-deploy repository)
- **Production VPS:** 72.62.132.43 (srv1262179.hstgr.cloud) [Hostinger]

## 🚀 Quick Start (Local Development)

```bash
# Clone and setup
git clone https://github.com/adrianstanca1/cortexbuild-ultimate.git
cd cortexbuild-ultimate

# Install dependencies
npm install
cd server && npm install && cd ..

# Start development environment
docker-compose up -d
npm run dev

# Build for production
npm run build
```

## 📊 Services & Ports

| Service     | Port | Description                    | Health Check                           |
|-------------|------|--------------------------------|----------------------------------------|
| Frontend    | 3000 | React + Vite dev server       | http://localhost:3000                  |
| API         | 3001 | Express.js backend             | http://localhost:3001/api/health       |
| PostgreSQL  | 5432 | Database with pgvector         | `docker exec cortexbuild-db pg_isready` |
| Redis       | 6379 | Caching & sessions            | `redis-cli ping`                       |
| Nginx       | 80/443 | Reverse proxy (production)   | http://localhost                       |
| Ollama      | 11434 | Local AI inference           | http://localhost:11434/api/tags        |
| Prometheus  | 9090 | Metrics collection            | http://localhost:9090                  |
| Grafana     | 3002 | Monitoring dashboards         | http://localhost:3002                  |

## 🐳 Docker Configuration

### Container Health Status
```bash
# Check all containers
docker-compose ps

# Check logs
docker-compose logs -f api
docker-compose logs -f postgres
```

### Performance Optimization
- **Removed obsolete version directive** from docker-compose.yml
- **Multi-stage Dockerfile** for production builds
- **Nginx Alpine** for lightweight proxy
- **Health checks** for all critical services

## 🔒 Security Checklist

### ✅ Completed Security Measures
- [x] SSL/TLS certificates configured (expires Jun 25, 2026)
- [x] Security headers in Nginx (HSTS, XSS protection, CSP)
- [x] File permissions locked down (600 for .env, .pem files)
- [x] No vulnerabilities in npm dependencies
- [x] Secrets properly gitignored
- [x] Rate limiting implemented
- [x] CORS configured properly

### Authentication & Authorization
- JWT-based authentication
- 6 demo users available
- Role-based access control
- Session management via Redis

## 📈 Monitoring & Observability

### Prometheus Metrics
- Application performance metrics
- Database connection pool stats
- HTTP request/response metrics
- Custom business metrics

### Grafana Dashboards
- System overview dashboard
- Application performance monitoring
- Database metrics visualization
- Real-time alerting

### Health Endpoints
```bash
# API health
curl http://localhost:3001/api/health

# Database health
curl http://localhost:3001/api/health/database

# Services status
curl http://localhost:3001/api/metrics/health
```

## 🌐 Production Deployment

### Method 1: Vercel (Current Production)
```bash
# Deploy to Vercel from cortexbuildpro-deploy repo
cd ~/cortexbuildpro-deploy
vercel --prod

# Production URL: https://www.cortexbuildpro.com
```

### Method 2: VPS Deployment (Docker)
```bash
# Build production image
docker build -t cortexbuild-ultimate:latest .

# Deploy to VPS (requires SSH access)
ssh root@72.62.132.43
docker pull cortexbuild-ultimate:latest
docker-compose up -d
```

## 🔧 VPS Access Recovery

### Issue: SSH Authentication Failed
**Problem:** `Permission denied (publickey,password)` on 72.62.132.43

**Solutions:**
1. **Check Hostinger Panel:** Login to Hostinger account, reset VPS root password
2. **Upload SSH Key:** Add public key to `/root/.ssh/authorized_keys` via Hostinger console
3. **Alternative Access:** Use Hostinger web terminal if available

### Current SSH Configuration
```bash
# SSH config already set up
ssh cortexvps  # Shortcut for root@72.62.132.43

# Key location
~/.ssh/id_ed25519_vps  # Private key
~/.ssh/id_ed25519_vps.pub  # Public key
```

## 💻 Development Workflow

### Code Quality
```bash
# TypeScript check
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Testing
npm test
npm run test:watch

# Build verification
npm run build
```

### Database Operations
```bash
# Run migrations
cd server && npm run migrate

# Seed data
npm run seed

# Database backup
pg_dump -h localhost -U cortexuser cortexbuild > backup.sql
```

### Debugging
```bash
# API logs
docker-compose logs -f api

# Database queries
docker exec -it cortexbuild-db psql -U cortexuser -d cortexbuild

# Redis data
docker exec -it cortexbuild-redis redis-cli
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check TypeScript errors: `npm run type-check`
   - Verify dependencies: `npm audit`
   - Clear cache: `npm run clean && npm install`

2. **Docker Issues**
   - Reset containers: `docker-compose down && docker-compose up -d`
   - Check logs: `docker-compose logs`
   - Free space: `docker system prune`

3. **Database Connection**
   - Verify container health: `docker-compose ps`
   - Check connection: `npm run db:test`
   - Reset data: `docker-compose down -v && docker-compose up -d`

4. **Production Deployment**
   - VPS access issues: Use Hostinger panel to reset credentials
   - Build failures: Ensure all TypeScript errors resolved
   - SSL certificate: Check renewal status (current expires Jun 2026)

### Emergency Contacts
- **Hosting:** Hostinger support (srv1262179.hstgr.cloud)
- **Domain:** cortexbuildpro.com DNS management
- **Repository:** github.com/adrianstanca1/cortexbuild-ultimate

## 📋 Recent Changes

### Latest Improvements (March 31, 2026)
- ✅ Fixed 36 critical TypeScript build errors
- ✅ Modernized Dockerfile for Vite (was Next.js)
- ✅ Enhanced Nginx with HTTPS/SSL security headers
- ✅ Security audit completed with file permission fixes
- ✅ Docker Compose optimization (removed obsolete version)
- ✅ Comprehensive test suite passing (20/20 tests)

### Deployment Status
- **Development:** Fully operational with 7/7 containers healthy
- **Production Frontend:** Live at https://www.cortexbuildpro.com ✅
- **Production VPS:** SSH access pending recovery 🔄

---

**Last Updated:** March 31, 2026  
**Maintainer:** Adrian Stanca (adrian.stanca1@gmail.com)