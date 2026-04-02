# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CortexBuild Ultimate is an AI-Powered Unified Construction Management Platform for UK contractors. It combines 50+ construction modules with AI agents into a single enterprise SaaS platform.

**Stack**: React + TypeScript + Vite (frontend) / Express.js + PostgreSQL (backend, no ORM at runtime) / Zustand (state) / WebSocket (real-time)

> Note: `prisma/` contains schema definitions for reference, but the live backend uses raw SQL via `pg` pool — not Prisma at runtime.

## Commands

### Frontend
```bash
cd /Users/adrianstanca/cortexbuild-ultimate
npm install
npm run dev              # Dev server on http://localhost:5173
npm run build            # Production build → dist/
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix ESLint
npm run test             # Run Vitest tests (jsdom environment)
npm run test:coverage    # Coverage report
npm run lighthouse       # Lighthouse CI audit (production build required)
```

Run a single test:
```bash
npx vitest run path/to/file.test.ts
npx vitest run -t "test name pattern"
```

Test files: `src/test/*.test.ts` or `*.test.tsx` alongside components. Setup in `src/test/setup.ts`.

**Test Coverage (180 tests across 14 files):**
- `NotificationCenter.test.tsx` - 14 tests
- `TeamChat.test.tsx` - 10 tests
- `ActivityFeed.test.tsx` - 8 tests
- `useOptimizedData.test.ts` - 11 tests
- `validateNotification.test.ts` - 15 tests (Zod runtime validation)
- `utilities.test.ts`, `hooks.test.ts`, `validation.test.ts` - Core utilities
- `DataImportExport.test.tsx`, `BulkActions.test.tsx`, `AdvancedTableFilter.test.tsx` - UI components
- `usePWA.test.ts`, `AIAvatar.test.tsx`, `rateLimiter.test.ts` - Features

**E2E Tests (Playwright):**
```bash
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Interactive UI mode
npm run test:e2e:headed  # Run in visible browser
```

### Error Handling Pattern
```ts
.catch((err) => {
  console.error('Failed to load X:', err);
  // toast.error('Failed to load X'); // use toast if module imports it
})
```

### Backend
```bash
cd /Users/adrianstanca/cortexbuild-ultimate/server
npm install
npm run dev              # nodemon auto-reload on port 3001
npm start                # Production (plain node)
```

### PM2 (production)
```bash
pm2 list                                        # Check running processes
pm2 restart cortexbuild-api --update-env        # Restart after env changes
pm2 logs cortexbuild-api                        # Tail logs
```

### Database Migrations
```bash
# Run in order — migrations are plain SQL files, not managed by Prisma
psql -d cortexbuild -f server/migrations/001_add_audit_log.sql
# ... see server/migrations/ for full list
```

## Architecture

### Backend: Generic CRUD Router
`server/routes/generic.js` exports a `makeRouter(tableName)` factory used for all standard entities. It provides GET/POST/PUT/DELETE with:
- Column-name injection prevention via per-table `ALLOWED_COLUMNS` whitelist
- Order-by limited to `VALID_ORDER_COLS` set
- Automatic audit logging on mutations
- WebSocket broadcast on dashboard-relevant changes

**Adding a new table route requires two steps:**
1. Add the table's allowed columns to `ALLOWED_COLUMNS` in `generic.js`
2. Register `app.use('/api/your-table', makeRouter('your_table'))` in `server/index.js`

### Specialized Backend Routes
Beyond the generic router, these handle domain-specific logic:
- `routes/auth.js` — JWT login/register (bcrypt passwords)
- `routes/oauth.js` — Google/Microsoft OAuth (Passport strategies, CSRF-protected state, token-in-fragment)
- `routes/ai.js` — Ollama AI integration (streaming)
- `routes/ai-conversations.js` — Chat history persistence
- `routes/files.js` / `routes/upload.js` — Multer file uploads to `server/uploads/`
- `routes/email.js` — Nodemailer + SendGrid with rate limiting
- `routes/search.js` — Global cross-table search
- `routes/audit.js` — Audit log reads
- `routes/permissions.js` — RBAC custom roles
- `routes/financial-reports.js`, `routes/analytics-data.js`, etc. — aggregated data endpoints
- `routes/metrics.js` — Health metrics (**excluded from JWT auth**)

### Authentication

**JWT Authentication**: All `/api/*` routes require JWT Bearer token **except** `/api/auth/*`, `/api/health`, `/api/deploy`, and `/api/metrics`. The middleware is `server/middleware/auth.js`. RBAC roles: `super_admin`, `company_owner`, `admin`, `project_manager`, `field_worker`.

**OAuth 2.0 Flow** (`routes/oauth.js`):
- Google/Microsoft strategies via Passport.js
- CSRF protection via cryptographically random `state` parameter (stored in-memory with 10-min expiry)
- JWT token returned in URL fragment (`#token=`) to prevent server logging
- OAuth tokens stored in `oauth_providers` table with unique constraint on `(provider, provider_user_id)`
- Rate limiting on callback endpoints (10 requests per 15 minutes)

### Frontend Module System
`src/App.tsx` lazy-loads 50+ modules via `React.lazy()`. The sidebar nav maps to module components in `src/components/` and `src/pages/` (or equivalent).

## Runtime Validation Pattern

All API responses are validated with Zod v4 before use. Key utilities:

```ts
import { validateNotification, safeValidateNotification } from '@/lib/validateNotification';

// Strict validation - returns null if invalid
const notification = validateNotification(rawData);
if (!notification) {
  // Handle invalid data
}

// Lenient validation - applies defaults for missing optional fields
const safe = safeValidateNotification(rawData, { strict: false });
```

Schemas defined in `src/lib/validations.ts`:
- `notificationSchema` - Full notification object with relatedItem, actions, fromUser
- `notificationsResponseSchema` - API response wrapper with unreadCount, total, hasMore
- `notificationSettingsSchema` - User preferences with quietHours, categoryPreferences

### State Management
Zustand stores in `src/lib/store/` — key stores: `useAuthStore` (JWT token + user), `useAppStore` (UI state). No Redux.

### Real-time
WebSocket server runs alongside Express in `server/index.js` (`/ws` endpoint via `server/lib/websocket.js`). Broadcast helper at `server/lib/ws-broadcast.js` pushes dashboard updates after mutations.

### AI Features
AI routes use **local Ollama** only — no external AI API calls. The `routes/ai.js` streams Ollama completions. External AI provider configs in `ARCHITECTURE.md` are aspirational, not implemented.

## Environment

### Backend (`server/.env` or Docker via `.env.docker`)
```
DB_PASSWORD=<required — server refuses to start without this>
DB_HOST=127.0.0.1          # Must be IP, not 'localhost', for TCP (not Unix socket)
DB_NAME=cortexbuild
DB_USER=cortexbuild
DB_PORT=5432
JWT_SECRET=<your-secret>
SESSION_SECRET=<your-session-secret>  # Separate from JWT for security
PORT=3001
CORS_ORIGIN=http://localhost:5173   # Required — CORS denies all if unset
REDIS_URL=redis://localhost:6379    # Optional, used for pub/sub

# OAuth (required for Google/Microsoft login)
GOOGLE_CLIENT_ID=<your_client_id>
GOOGLE_CLIENT_SECRET=<your_client_secret>
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
MICROSOFT_CLIENT_ID=<your_client_id>
MICROSOFT_CLIENT_SECRET=<your_client_secret>
MICROSOFT_CALLBACK_URL=http://localhost:3001/api/auth/microsoft/callback
FRONTEND_URL=http://localhost:5173
```

### Frontend (`.env.local`)
```
VITE_API_BASE_URL=http://localhost:3001
```

### PostgreSQL Auth
pg_hba.conf must use `md5` (not `scram-sha-256`) for node-postgres compatibility. Always set password with `password_encryption='md5'` in the same session. After editing pg_hba.conf: `chown postgres:postgres /etc/postgresql/16/main/pg_hba.conf`.

## Design System

Dark industrial theme using CSS variables:
- `--slate-*` — backgrounds, surfaces
- `--amber-*` — accents, highlights
- `--emerald-*` — success states
- `--red-*` — errors, danger
- `--cyan-*` — info states

## Performance Monitoring

Lighthouse CI configured with performance budgets in `lighthouserc.json`:

| Metric | Threshold | Level |
|--------|-----------|--------|
| Performance | ≥95% | error |
| Accessibility | 100% | error |
| Best Practices | ≥95% | error |
| SEO | ≥95% | error |
| FCP | <1200ms | error |
| LCP | <2000ms | error |
| TBT | <200ms | warn |
| CLS | <0.05 | error |

CI runs on `http://localhost:4173` using `npm run preview` server.

## Frontend Structure

```
src/
├── components/
│   ├── modules/     # 50+ lazy-loaded page modules (PascalCase.tsx)
│   ├── layout/     # Header, Sidebar, etc.
│   ├── dashboard/  # Dashboard widgets
│   ├── forms/      # Reusable form components
│   ├── auth/       # Login, auth pages
│   └── ui/         # Shared UI (BulkActions, Charts, Skeleton, etc.)
├── hooks/          # Custom hooks — useData.ts factory pattern
├── lib/
│   ├── agents/     # AI agents (change-order-agent, rfi-analyzer, safety-agent, etc.)
│   ├── api.ts      # API client with JWT handling
│   ├── eventBus.ts # Event bus for cross-module communication
│   └── validations.ts
├── services/       # API service layer (api.ts, ai.ts)
├── types/          # TypeScript types
└── context/       # React context (auth, app)
```

### Data Hooks Pattern

Custom `useData.ts` factory using `makeHooks(name, table, api)`:
- Generates `use<Data>` hooks from generic CRUD operations
- All API calls go through service layer
- Error handling via `useToast` (console.error + toast notifications)

## Backend Routes

```
server/routes/
├── generic.js              # Generic CRUD factory + ALLOWED_COLUMNS whitelist
├── auth.js                # JWT login/register (bcrypt passwords)
├── oauth.js               # Google/Microsoft OAuth (Passport, CSRF state, rate-limited callbacks)
├── ai.js                  # Ollama AI integration (streaming)
├── ai-conversations.js    # Chat history persistence
├── files.js / upload.js   # Multer file uploads → server/uploads/
├── email.js               # Nodemailer + SendGrid with rate limiting
├── search.js              # Global cross-table search
├── audit.js               # Audit log reads
├── permissions.js         # RBAC custom roles
├── notifications.js       # Real-time notifications
├── dashboard-data.js      # Dashboard aggregation
├── financial-reports.js   # Budget/cost reports
├── insights.js            # ML-powered insights
├── tender-ai.js           # AI tender analysis
├── executive-reports.js   # C-suite dashboards
├── daily-reports-summary.js
├── project-tasks.js
├── project-images.js
├── team-member-data.js
├── calendar.js
├── analytics-data.js
├── weather-data.js
├── backup.js
├── metrics.js             # Health metrics (no JWT auth)
└── deploy.js              # Deployment endpoint (no JWT auth)
```

## AI Agents

Local Ollama-powered agents in `src/lib/agents/`:
- **change-order-agent** — Analyzes and suggests change orders
- **rfi-analyzer** — Processes RFI documents
- **safety-agent** — Safety incident analysis
- Additional agents for risk, procurement, and timeline analysis

> **Note:** AI routes use **local Ollama only** — no external AI API calls. External provider configs in ARCHITECTURE.md are aspirational.

## Docker Stack

Full stack via `docker-compose.yml`:

```bash
docker-compose up -d          # Start all services
docker-compose logs -f api    # Tail API logs
docker-compose down           # Stop all services
```

Services:
- **postgres** (pgvector:pg16) — Port 5432
- **redis** (7-alpine) — Port 6379
- **ollama** — Port 11434
- **api** — Port 3001 (multi-stage build with `api-runner` target)
- **nginx** — Ports 80/443
- **prometheus** — Port 9090
- **grafana** — Port 3002

Environment variables loaded from `.env.docker` via `env_file` directive.

## Commit Conventions

Uses **conventional commits** with scope:
- `feat:` — New features
- `fix:` — Bug fixes
- `chore:` — Maintenance, deps, config
- `feat(ui):`, `feat(ai):` — Scoped features
- `fix(nginx):`, `fix(server):` — Scoped fixes
- `ci:` — CI/CD changes
- `docs:` — Documentation

## Workflows

### Adding a New Module
1. Create `src/components/modules/ModuleName.tsx`
2. Add data hook to `src/hooks/useData.ts` if needed
3. Register in `src/App.tsx` via `React.lazy()`
4. Add sidebar navigation entry

### Adding a New Backend Route
1. If generic CRUD: add table to `ALLOWED_COLUMNS` in `generic.js` and register in `server/index.js`
2. If specialized: create `server/routes/<name>.js` with domain logic

### Adding OAuth Provider
1. Add Passport strategy in `routes/oauth.js` with CSRF-protected state
2. Create migration for `oauth_providers` table (include unique constraint on provider+provider_user_id)
3. Add environment variables to `.env.docker`
4. Rate-limit callback endpoints

## Key Files

| Path | Purpose |
|------|---------|
| `src/App.tsx` | Main router with 50+ lazy-loaded modules |
| `src/hooks/useData.ts` | makeHooks factory for CRUD data hooks |
| `src/services/api.ts` | API client with JWT handling |
| `src/lib/eventBus.ts` | Event bus for cross-module communication |
| `src/lib/agents/` | AI agents (change-order, RFI, safety, etc.) |
| `src/lib/store/` | Zustand state stores |
| `src/lib/validateNotification.ts` | Zod runtime validation utilities |
| `src/lib/validations.ts` | Zod schemas for notifications, settings, API responses |
| `server/index.js` | Express + WebSocket entry point, all route registrations |
| `server/routes/generic.js` | Generic CRUD factory + ALLOWED_COLUMNS whitelist |
| `server/routes/oauth.js` | OAuth 2.0 strategies (Google, Microsoft) with CSRF protection |
| `server/db.js` | PostgreSQL connection pool (requires DB_PASSWORD) |
| `server/middleware/auth.js` | JWT verification middleware |
| `server/middleware/rateLimiter.js` | Rate limiting for sensitive endpoints |
| `server/lib/websocket.js` | WebSocket init + message routing |
| `server/lib/ws-broadcast.js` | Broadcast helper for real-time updates |
| `prisma/schema.prisma` | Schema reference (85+ models, not used at runtime) |
| `server/migrations/` | Ordered SQL migration files |
| `docker-compose.yml` | Full stack: postgres, redis, ollama, nginx, prometheus, grafana |
| `.env.docker` | Docker environment variables (OAuth credentials, secrets) |
| `lighthouserc.json` | Lighthouse CI performance budgets and audit config |
| `.github/workflows/lighthouse.yml` | CI workflow for performance monitoring |
