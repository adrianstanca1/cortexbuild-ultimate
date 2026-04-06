# QWEN.md — CortexBuild Ultimate Development Context

## 🏗️ Project Overview

**CortexBuild Ultimate** is an enterprise-grade, AI-powered construction management SaaS platform for UK contractors. It unifies **70+ construction modules** with AI agents, real-time collaboration, and business intelligence into a single platform.

**Production:** https://www.cortexbuildpro.com  
**VPS:** 72.62.132.43 (Hostinger, 36GB RAM, 8 cores, 400GB SSD)  
**Version:** 3.0.0  
**Status:** ✅ Production Ready (100/100 Platform Health)

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2 | UI framework |
| TypeScript | 6.0.2 | Type safety |
| Vite | 8.0.1 | Build tool |
| Tailwind CSS | 4.2.2 | Styling |
| daisyUI | 5.5.19 | Component library |
| Zustand | 5.0.12 | State management |
| React Query | 5.91.3 | Data fetching |
| Recharts | 3.8.1 | Charts/visualizations |
| Zod | 4.3.6 | Runtime validation |
| Sonner | 2.0.7 | Toast notifications |
| Three.js / web-ifc | 0.183 / 0.0.77 | 3D/BIM viewing |

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
| 24 AI intent classifiers | Specialized per-module NLP |
| RAG pipeline | Retrieval-augmented generation |
| Predictive analytics | ML-powered forecasting |

### Testing & Quality
| Tool | Purpose |
|------|---------|
| Vitest | Unit testing (116 tests) |
| Playwright | E2E testing (9 specs) |
| ESLint | Code linting |
| Lighthouse CI | Performance audits |

---

## 📁 Project Structure

```
cortexbuild-ultimate/
├── src/                          # Frontend source
│   ├── components/
│   │   ├── modules/              # 70+ feature modules (see below)
│   │   ├── ui/                   # 24 reusable UI primitives
│   │   ├── widgets/              # 10 dashboard widgets
│   │   ├── layout/               # 12 layout components
│   │   ├── admin-dashboard/      # 7 admin tab sub-modules
│   │   ├── prequalification/     # 8 extracted sub-components
│   │   └── projects/             # 6 extracted sub-components
│   ├── context/                  # AuthContext, ThemeContext
│   ├── hooks/                    # 10 custom hooks (useData factory, etc.)
│   ├── lib/                      # Utilities, validations, eventBus
│   ├── services/                 # API clients (api.ts, ai.ts)
│   ├── types/                    # TypeScript types + 14 domain types
│   ├── test/                     # 15 unit test files
│   ├── App.tsx                   # Main app (73 lazy-loaded modules)
│   └── main.tsx                  # Entry point
├── server/                       # Backend source
│   ├── routes/                   # 40 route files + 24 AI intents
│   │   ├── generic.js            # CRUD factory (34 tables)
│   │   ├── auth.js               # JWT login/register
│   │   ├── oauth.js              # Google/Microsoft OAuth
│   │   ├── ai.js                 # AI chat, summarize, execute
│   │   └── ai-intents/           # 24 specialized intent classifiers
│   ├── middleware/               # auth.js, rateLimiter.js
│   ├── lib/                      # WebSocket, AI prompts, file validation
│   └── migrations/               # 37 SQL migration files
├── e2e/                          # 9 Playwright E2E specs
├── docs/                         # 25 documentation files
├── scripts/                      # 11 operational scripts
├── deploy/                       # 13 deployment configs
└── monitoring/                   # Prometheus/Grafana configs
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 24+
- Docker + Docker Compose
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
# DATABASE_URL=postgresql://cortexbuild:cortexbuild_dev_password@localhost:5432/cortexbuild
# JWT_SECRET=your-secret-key
```

### 3. Start Database (Docker)
```bash
docker-compose up -d postgres redis
```

### 4. Start Backend
```bash
cd server && npm install && npm run dev
# Express on port 3001
```

### 5. Start Frontend
```bash
npm run dev
# Vite on http://localhost:5173 (proxies /api → :3001)
```

---

## 🧪 Testing Commands

### Unit Tests (Vitest)
```bash
npm test                    # Run all tests (116 tests)
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# Single test file
npx vitest run src/test/NotificationCenter.test.tsx

# Test pattern
npx vitest run -t "notification"
```

**Test Files (116 tests, 13 files):**
- `NotificationCenter.test.tsx` (14 tests)
- `TeamChat.test.tsx` (10 tests)
- `ActivityFeed.test.tsx` (7 tests)
- `useOptimizedData.test.ts` (11 tests)
- `validateNotification.test.ts` (16 tests)
- `hooks.test.ts` (24 tests)
- Plus utilities, hooks, and component tests

### E2E Tests (Playwright)
```bash
npm run test:e2e            # Run all E2E (9 specs)
npm run test:e2e:ui         # Interactive UI mode
npm run test:e2e:headed     # Visible browser
```

### Code Quality
```bash
npm run lint                # ESLint check
npm run lint:fix            # Auto-fix ESLint
npx tsc --noEmit            # Type check
```

### Verification Scripts
```bash
npm run verify              # Full quality gate (types + tests + lint + build)
npm run verify:routes       # Check all 40 server routes load
npm run verify:all          # Both of the above
npm run check               # Quick check (types + lint + tests)
./scripts/pre-commit-check.sh   # Manual pre-commit validation
```

---

## 📦 Deployment

### Production Build
```bash
npm run build               # Build frontend to dist/ (~400ms)
```

### Deploy to VPS
```bash
./deploy.sh
```

**Deploy Script Does:**
1. Builds production bundle
2. Syncs to VPS via rsync
3. Syncs `.env` to `server/.env`
4. Fixes permissions for nginx
5. Verifies deployment (HTTP 200)

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
- `cortexbuild-api` (port 3001)
- `cortexbuild-db` (PostgreSQL, port 5432)
- `cortexbuild-redis` (port 6379)
- `cortexbuild-ollama` (port 11434)
- `cortexbuild-nginx` (port 80/443)
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

**Multi-tenant Pattern** — All queries scoped by `organization_id`:
```javascript
const { params: baseParams } = await orgFilter(req.user);
// Returns { join: 'JOIN ...', filter: ' AND organization_id = $1', params: [orgId] }
```

**Parameter Binding Pattern** — Correct order for UPDATE/DELETE:
```javascript
// WRONG: WHERE organization_id = $2 AND id = $1 with [...baseParams, id]
// CORRECT: WHERE id = $1 AND organization_id = $2 with [id, ...baseParams]
const queryParams = [id, ...baseParams];
const orgIdParamIndex = queryParams.length;
```

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

**OAuth 2.0:** Google + Microsoft (Passport.js), CSRF-protected state, Redis-backed state store.

### Frontend Patterns

**Module System:**
- 73 lazy-loaded modules via `React.lazy()`
- Sidebar navigation in `src/components/layout/`
- Module components in `src/components/modules/`
- Extracted sub-modules: `prequalification/` (8 files), `projects/` (6 files), `admin-dashboard/` (7 files)

**State Management:**
- Zustand stores in `src/lib/store/`
- `useAuthStore` — JWT token + user
- `useAppStore` — UI state

**Generic Hooks Factory** (`src/hooks/useData.ts`):
```typescript
// Generic pattern — accepts domain type
export const useProjects = makeHooks<ProjectRow>('projects', 'projects', projectsApi);
// Returns { useList, useCreate, useUpdate, useDelete }
```

**Real-time:** WebSocket at `/ws` endpoint, broadcast on dashboard changes, notification center with live updates.

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

### Security Patterns
1. **SQL:** Always parameterize, never interpolate table names
2. **Error responses:** Never expose `err.message` — use `'Internal server error'`
3. **Multi-tenancy:** Scope ALL queries by `organization_id`
4. **AI handlers:** Accept `user` param and scope all queries
5. **Write actions:** Require `organization_id` guard before inserting
6. **Table whitelists:** Validate against explicit Set before SQL interpolation

### Testing Practices
- **Unit tests:** Co-located in `src/test/`
- **E2E tests:** In `e2e/` directory
- **Test naming:** Descriptive, include expected behavior
- **Mocks:** Use Vitest mocks for API calls
- **Happy-dom** environment (React 19 compatible)

### Git Workflow
- **Branch:** `main` (production-ready)
- **Commits:** Conventional Commits format
- **Pre-commit hook:** Verifies routes + types + tests + lint + build
- **PRs:** Required for production changes

---

## 📊 Module Inventory

| Category | Modules |
|----------|---------|
| **Core** | Dashboard, Projects, Invoicing, Accounting, Safety, Teams, RFIs, Documents |
| **Commercial** | Tenders, Change Orders, Variations, Valuations, Cost Management, CIS Returns, Procurement |
| **Site Ops** | Plant & Equipment, Materials, Subcontractors, Timesheets, Daily Reports, Site Operations, Field View |
| **Quality** | Inspections, Punch List, Defects, Specifications, RAMS, Risk Register |
| **Specialized** | BIM Viewer, Cost Management, Submittals, Drawings, Certifications, Prequalification |
| **Compliance** | Signage, Waste Management, Sustainability, Training, Temp Works, Lettings, Measuring |
| **AI/BI** | AI Assistant, AI Vision, Predictive Analytics, Advanced Analytics, Executive Reports |
| **Business** | CRM, Calendar, Audit Log, Email History, Permissions, Report Templates, Marketplace |
| **Collaboration** | Team Chat, Activity Feed, NotificationCenter |
| **Admin** | Admin Dashboard (7 tabs: Overview, Users, Companies, Audit, Analytics, Backup, Settings) |

---

## 🔑 Key Files Reference

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Claude Code guidance (architecture, commands, security) |
| `AGENTS.md` | Development conventions, AI agent patterns |
| `package.json` | Dependencies + scripts |
| `tsconfig.json` | TypeScript config (ES2020, strict, paths) |
| `vite.config.ts` | Vite bundler config |
| `vitest.config.ts` | Vitest test config (happy-dom) |
| `playwright.config.ts` | Playwright E2E config |
| `docker-compose.yml` | Full stack orchestration |
| `deploy.sh` | VPS deployment script |
| `server/index.js` | Backend entry + route registration |
| `server/routes/generic.js` | CRUD factory with column whitelist |
| `src/App.tsx` | Frontend entry (73 lazy modules) |
| `src/hooks/useData.ts` | `makeHooks<T>` factory for typed CRUD hooks |
| `src/types/domain.ts` | 14 domain-level type definitions |
| `src/lib/validations.ts` | Zod validation schemas |

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

### Pre-commit Hook Fails
```bash
# Run checks manually to see errors
./scripts/pre-commit-check.sh
```

---

## 📞 Support & Resources

- **GitHub:** https://github.com/adrianstanca1/cortexbuild-ultimate
- **Production:** https://www.cortexbuildpro.com
- **VPS:** 72.62.132.43
- **Docs:** `docs/` directory (25 files)

---

**Last Updated:** 2026-04-06  
**Platform Version:** 3.0.0  
**Status:** ✅ Production Ready
