# QWEN.md — CortexBuild Ultimate Development Context

## 🏗️ Project Overview

**CortexBuild Ultimate** is an enterprise-grade, AI-powered construction management SaaS platform for UK contractors. It unifies 59+ construction modules with AI agents, real-time collaboration, and business intelligence.

**Production URL:** https://www.cortexbuildpro.com  
**VPS:** 72.62.132.43 (Hostinger, 36GB RAM, 8 cores, 400GB SSD)  
**Version:** 3.0.0  
**Status:** ✅ Production Ready (100/100 Platform Health)

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.9.3 | Type safety |
| Vite | 8.0.1 | Build tool |
| Tailwind CSS | 3.4.3 | Styling |
| daisyUI | 5.5.19 | Component library |
| Zustand | 5.0.12 | State management |
| React Query | 5.91.3 | Data fetching |
| Recharts | 2.12.2 | Charts/visualizations |
| Zod | 4.3.6 | Runtime validation |
| Sonner | 1.4.41 | Toast notifications |

### Backend
| Technology | Purpose |
|------------|---------|
| Express.js | API server |
| PostgreSQL 16 (pgvector) | Database |
| Redis 7 | Caching/sessions |
| JWT | Authentication |
| Passport.js | OAuth strategies |
| Nodemailer/SendGrid | Email |
| WebSocket | Real-time updates |

### AI/ML
| Technology | Purpose |
|------------|---------|
| Ollama | Local LLM inference |
| Llama 3.1 8B | Primary model |
| 10 AI Agents | Specialized tasks |

### Testing & Quality
| Tool | Purpose |
|------|---------|
| Vitest | Unit testing (180 tests) |
| Playwright | E2E testing (9 specs) |
| ESLint | Code linting |
| Lighthouse CI | Performance audits |

---

## 📁 Project Structure

```
cortexbuild-ultimate/
├── src/                          # Frontend source
│   ├── components/               # React components (115+)
│   │   ├── modules/             # 59 module components
│   │   ├── widgets/             # 10 dashboard widgets
│   │   ├── layout/              # Layout components
│   │   └── ui/                  # Reusable UI components
│   ├── context/                  # React context providers
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities, validations, schemas
│   ├── services/                 # API client services
│   ├── test/                     # Unit tests (14 test files)
│   ├── types/                    # TypeScript types
│   ├── App.tsx                   # Main app component
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles
├── server/                       # Backend source
│   ├── routes/                   # API routes (31 files)
│   │   ├── oauth.js             # Google/Microsoft OAuth
│   │   ├── auth.js              # JWT auth
│   │   ├── ai.js                # AI endpoints
│   │   └── generic.js           # CRUD factory
│   ├── middleware/               # Express middleware
│   ├── lib/                      # Server utilities
│   ├── migrations/               # SQL migrations (23 files)
│   ├── db.js                     # Database connection
│   └── index.js                  # Server entry
├── e2e/                          # Playwright E2E tests
├── app/                          # Next.js app router pages
├── public/                       # Static assets
├── dist/                         # Production build output
├── docs/                         # Documentation (30+ files)
└── [config files]                # TS, ESLint, Vite, etc.
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- pnpm or npm
- Git

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Required variables:
# VITE_API_BASE_URL=http://localhost:3001
# DATABASE_URL=postgresql://...
# JWT_SECRET=your-secret-key
```

### 3. Start Database (Docker)
```bash
docker-compose up -d postgres redis ollama
```

### 4. Initialize Database
```bash
cd server
npm run db:reset:local
```

### 5. Start Backend
```bash
# Development (auto-reload)
cd server && npm run dev

# Production (PM2)
pm2 start server/index.js --name cortexbuild-api
```

Backend runs on: `http://localhost:3001`

### 6. Start Frontend
```bash
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## 🧪 Testing Commands

### Unit Tests (Vitest)
```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# Single test file
npx vitest run src/test/NotificationCenter.test.tsx

# Test pattern
npx vitest run -t "notification"
```

**Test Files (180 tests total):**
- `NotificationCenter.test.tsx` (14 tests)
- `TeamChat.test.tsx` (10 tests)
- `ActivityFeed.test.tsx` (8 tests)
- `useOptimizedData.test.ts` (11 tests)
- `validateNotification.test.ts` (15 tests)
- Plus utilities, hooks, and component tests

### E2E Tests (Playwright)
```bash
npm run test:e2e            # Run all E2E
npm run test:e2e:ui         # Interactive UI
npm run test:e2e:headed     # Visible browser
```

**E2E Specs (9 files):**
- `auth.spec.ts`
- `projects.spec.ts`
- `documents.spec.ts`
- `rfis.spec.ts`
- `safety.spec.ts`
- `teams.spec.ts`
- `dashboard.spec.ts`
- Plus module-specific tests

### Code Quality
```bash
npm run lint                # ESLint check
npm run lint:fix            # Auto-fix
npm run lighthouse          # Lighthouse audit
```

---

## 📦 Deployment

### Production Build
```bash
npm run build               # Build frontend to dist/
```

### Deploy to VPS
```bash
./deploy.sh
```

**Deploy Script Does:**
1. Builds production bundle
2. Syncs to VPS via rsync
3. Fixes permissions for nginx
4. Verifies deployment (HTTP 200)

### VPS Services (Docker)
```bash
# Check all services
docker ps

# Restart API
docker restart cortexbuild-api

# View logs
docker logs -f cortexbuild-api
```

**Services:**
- `cortexbuild-nginx` (port 80/443)
- `cortexbuild-api` (port 3001)
- `cortexbuild-db` (PostgreSQL, port 5432)
- `cortexbuild-redis` (port 6379)
- `cortexbuild-ollama` (port 11434)
- `cortexbuild-prometheus` (port 9090)
- `cortexbuild-grafana` (port 3002)

---

## 🏛️ Architecture

### Backend Patterns

**Generic CRUD Router** (`server/routes/generic.js`)
```javascript
// Factory pattern for standard CRUD
const makeRouter = require('./generic');
app.use('/api/projects', makeRouter('projects'));
```

Features:
- Column injection prevention (ALLOWED_COLUMNS whitelist)
- ORDER BY validation (VALID_ORDER_COLS set)
- Automatic audit logging
- WebSocket broadcast on mutations

**Specialized Routes:**
- `auth.js` — JWT login/register
- `oauth.js` — Google/Microsoft OAuth (Passport)
- `ai.js` — Ollama AI integration
- `files.js` — Multer uploads
- `email.js` — Nodemailer + SendGrid
- `search.js` — Cross-table search
- `audit.js` — Audit log queries
- `permissions.js` — RBAC

### Authentication

**JWT Middleware:**
- All `/api/*` routes require JWT except:
  - `/api/auth/*`
  - `/api/health`
  - `/api/deploy`
  - `/api/metrics`

**RBAC Roles:**
- `super_admin`
- `company_owner`
- `admin`
- `project_manager`
- `field_worker`

**OAuth 2.0 Flow:**
- Google + Microsoft strategies (Passport.js)
- CSRF protection via `state` parameter
- JWT returned in URL fragment (`#token=`)
- OAuth tokens stored in `oauth_providers` table
- Unique constraint: `(provider, provider_user_id)`

### Frontend Patterns

**Module System:**
- 59 lazy-loaded modules via `React.lazy()`
- Sidebar navigation in `src/components/layout/`
- Module components in `src/components/modules/`

**State Management:**
- Zustand stores in `src/lib/store/`
- `useAuthStore` — JWT token + user
- `useAppStore` — UI state

**Real-time:**
- WebSocket at `/ws` endpoint
- Broadcast on dashboard changes
- Notification center with live updates

**Runtime Validation (Zod v4):**
```typescript
import { validateNotification } from '@/lib/validateNotification';

const notification = validateNotification(rawData);
if (!notification) {
  // Handle invalid data
}
```

Schemas in `src/lib/validations.ts`:
- `notificationSchema`
- `notificationsResponseSchema`
- `notificationSettingsSchema`

---

## 📝 Development Conventions

### TypeScript
- **Strict mode:** Enabled
- **Target:** ES2020
- **Module:** ESNext
- **Paths:** `@/*` → `src/*`
- **No implicit any:** Enforced

### Code Style
- **Indentation:** 2 spaces
- **Quotes:** Single quotes
- **Max line:** 100 characters
- **Semicolons:** Required
- **Trailing commas:** ES5 (objects/arrays)

### Import Order
```typescript
// 1. React
import { useState } from 'react'

// 2. Third-party
import { z } from 'zod'

// 3. Internal (aliased)
import { Component } from '@/components'
import { utils } from '@/lib'
```

### Component Structure
```typescript
// 1. Imports
// 2. Types/interfaces
// 3. Component function
// 4. Export
```

### Testing Practices
- **Unit tests:** Co-located with source or in `src/test/`
- **E2E tests:** In `e2e/` directory
- **Test naming:** Descriptive, include expected behavior
- **Mocks:** Use Vitest mocks for API calls

### Git Workflow
- **Branch:** `main` (production-ready)
- **Commits:** Conventional Commits format
- **PRs:** Required for production changes
- **Reviews:** At least 1 approval required

---

## 🔑 Key Files Reference

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Claude Code guidance |
| `AGENTS.md` | Development guidelines |
| `package.json` | Dependencies & scripts |
| `tsconfig.json` | TypeScript config |
| `vite.config.ts` | Vite config |
| `vitest.config.ts` | Vitest config |
| `playwright.config.ts` | Playwright config |
| `docker-compose.yml` | Docker services |
| `deploy.sh` | Deployment script |
| `server/index.js` | Backend entry |
| `src/App.tsx` | Frontend entry |
| `src/lib/validations.ts` | Zod schemas |

---

## 📚 Documentation

| Doc | Purpose |
|-----|---------|
| `docs/README.md` | Documentation index |
| `docs/API_DOCUMENTATION.md` | API reference |
| `docs/USER_GUIDE.md` | User manual |
| `DEPLOYMENT_RUNBOOK.md` | Deployment guide |
| `CONTRIBUTING.md` | Contribution guide |
| `SECURITY.md` | Security policies |

---

## 🎯 Current Platform Status

### Modules: 59/59 Complete ✅
All construction management modules implemented:
- Projects, Safety, RFIs, Documents, Teams
- Timesheets, Plant & Equipment, Materials
- Meetings, Daily Reports, RAMS, CIS
- Tenders, CRM, Inspections, Punch List
- Risk Register, Drawings, Change Orders
- Analytics, Calendar, Insights
- Executive Reports, Predictive Analytics
- Audit Log, Global Search, Variations
- Defects, Valuations, Specifications
- Temp Works, Signage, Waste Management
- Sustainability, Training, Certifications
- Prequalification, Lettings, Measuring
- Email History, Permissions, Report Templates
- BIM Viewer, Cost Management, Submittals
- AI Vision, My Desktop, Advanced Analytics
- Project Calendar, Site Operations, Field View
- Procurement, Marketplace, Settings

### New Features (v3.0.0)
- **Notification Center** — Real-time WebSocket notifications
- **Admin Dashboard** — System administration (7 tabs)
- **Dashboard Widgets** — 10 reusable KPI widgets
- **Mobile Bottom Navigation** — PWA mobile navigation
- **OAuth/SSO** — Google + Microsoft sign-in

### Quality Metrics
- **Tests:** 180 passing (14 files)
- **TypeScript:** 0 errors
- **Lighthouse:** 100/100 performance
- **Accessibility:** WCAG 2.1 AA (95/100)

---

## 🆘 Common Issues & Solutions

### Database Connection Error
```bash
# Restart PostgreSQL container
docker restart cortexbuild-db

# Check connection
psql -h localhost -U cortexbuild -d cortexbuild -c "SELECT 1"
```

### API Not Responding
```bash
# Check API container
docker ps | grep cortexbuild-api

# View logs
docker logs -f cortexbuild-api

# Restart
docker restart cortexbuild-api
```

### Build Errors
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build

# Type check
npx tsc --noEmit
```

### OAuth Not Working
1. Check redirect URIs in Google/Azure console
2. Verify `.env` has correct credentials
3. Wait 5 minutes for propagation
4. Clear browser cache

---

## 📞 Support & Resources

- **GitHub:** https://github.com/adrianstanca1/cortexbuild-ultimate
- **Production:** https://www.cortexbuildpro.com
- **VPS:** 72.62.132.43
- **Docs:** `docs/` directory

---

**Last Updated:** 2026-04-02  
**Platform Version:** 3.0.0  
**Status:** ✅ Production Ready
