# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CortexBuild Ultimate is an AI-Powered Unified Construction Management Platform for UK contractors. It combines 50+ construction modules with AI agents into a single enterprise SaaS platform.

**Stack**: React 19 + TypeScript + Vite (frontend) / Express.js + PostgreSQL (backend, raw SQL via `pg` pool) / Zustand (state) / WebSocket (real-time)

> Note: `prisma/` contains schema definitions for reference only — the backend uses raw SQL, not Prisma ORM at runtime.

## Commands

### Frontend (Vite)
```bash
npm run dev              # Dev server on http://localhost:5173 (proxies /api → localhost:3001)
npm run build            # Production build → dist/
npm run lint             # ESLint check (errors only)
npm run lint:fix         # Auto-fix ESLint issues
npm test                 # Run Vitest tests (jsdom environment)
npm run test:coverage    # Coverage report
```

Run a single test:
```bash
npx vitest run path/to/file.test.ts
npx vitest run -t "test name pattern"
```

**E2E Tests (Playwright):**
```bash
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Interactive UI mode
npm run test:e2e:headed  # Run in visible browser
```

### Backend (Express.js)
```bash
cd server && npm install
npm run dev              # nodemon auto-reload on port 3001
npm start                # Production (plain node)
```

### Type Check
```bash
npx tsc --noEmit        # TypeScript validation
```

### Database Migrations
```bash
# Migrations are plain SQL files under server/migrations/ (not Prisma at runtime)
# Apply manually or via deploy script:
psql "$DATABASE_URL" -f server/migrations/XXX_description.sql
```

## Architecture

### Frontend Structure

- **Vite app** (`src/`) — React + TypeScript UI. Entry: `src/main.tsx`. Import alias `@` → `src/`.
- **Module system** — `src/App.tsx` lazy-loads 50+ modules via `React.lazy()`. Sidebar navigation maps to `src/components/`.
- **State** — Zustand stores in `src/lib/store/` (`useAuthStore`, `useAppStore`)
- **Real-time** — WebSocket at `/ws` via `server/lib/websocket.js`

### Backend Structure

**Generic CRUD Router** (`server/routes/generic.js`):
- Factory `makeRouter(tableName)` for standard CRUD with SQL injection prevention (column whitelists), order-by validation, audit logging, WebSocket broadcast
- Adding a new table route: add columns to `ALLOWED_COLUMNS`, register in `server/index.js`

**Specialized Routes**:
| Route | Purpose |
|-------|---------|
| `routes/auth.js` | JWT login/register (bcrypt) |
| `routes/oauth.js` | Google/Microsoft OAuth (Passport, CSRF-protected state) |
| `routes/ai.js` | Ollama AI streaming |
| `routes/files.js` / `routes/upload.js` | Multer uploads → `server/uploads/` |
| `routes/email.js` | Nodemailer + SendGrid (rate-limited) |
| `routes/search.js` | Global cross-table search |
| `routes/metrics.js` | Health metrics (JWT required) |
| `routes/deploy.js` | Deploy webhook (Bearer `DEPLOY_SECRET`, rate-limited, before auth) |

### Authentication

- **JWT**: Required on all `/api/*` except `/api/auth/*`, `/api/health`, `/api/deploy`
- **RBAC roles**: `super_admin`, `company_owner`, `admin`, `project_manager`, `field_worker`
- **OAuth**: CSRF state parameter (10-min expiry), JWT in URL fragment (`#token=`)

### AI Features

Local Ollama only — no external AI APIs. Intent classifiers in `server/routes/ai-intents/` for natural language queries across modules.

## Module System

Adding a new module:
1. Create `src/components/modules/ModuleName.tsx`
2. Add hook via `makeHooks` factory in `src/hooks/useData.ts`
3. Register in `src/App.tsx` via `React.lazy()`
4. Add sidebar entry in navigation config

## Runtime Validation

Zod v4 validates API responses. Utilities in `src/lib/validateNotification.ts`:
```ts
import { validateNotification, safeValidateNotification } from '@/lib/validateNotification';
const notification = validateNotification(rawData);
const safe = safeValidateNotification(rawData, { strict: false });
```
Schemas: `src/lib/validations.ts`

## Key Files

| Path | Purpose |
|------|---------|
| `src/App.tsx` | Main router (50+ lazy modules) |
| `src/hooks/useData.ts` | `makeHooks` factory for CRUD hooks |
| `src/lib/store/` | Zustand stores (auth, app state) |
| `src/lib/validations.ts` | Zod schemas |
| `src/lib/validateNotification.ts` | Runtime validation |
| `server/routes/generic.js` | CRUD factory + column whitelist |
| `server/db.js` | PostgreSQL pool |
| `server/index.js` | Express app entry + route registration |
| `server/middleware/auth.js` | JWT middleware |
| `server/lib/websocket.js` | WebSocket server |
| `docker-compose.yml` | Full stack orchestration |

## Design System

Dark industrial theme:
- `--slate-*` backgrounds, `--amber-*` accents, `--emerald-*` success, `--red-*` errors

## Security

- **File uploads**: Path traversal prevention via `path.normalize()` + `startsWith(dir + path.sep)`; magic number validation
- **SQL injection**: Column whitelists (`ALLOWED_COLUMNS`) in generic CRUD routes
- **Multi-tenancy**: `organization_id` filtering on all operations
- **OAuth**: CSRF state with 10-min expiry; rate limiting on callback (10 req/15 min)
- **XSS**: Middleware enabled on POST/PUT routes
- **bcrypt**: 12 rounds for password hashing

## Performance Budgets (Lighthouse CI)

| Metric | Threshold |
|--------|-----------|
| Performance | ≥95% |
| LCP | <2000ms |
| CLS | <0.05 |

## Production Deployment

**VPS**: `root@72.62.132.43`

Docker containers:
- `cortexbuild-api` (port 3001)
- `cortexbuild-db` (PostgreSQL)
- `cortexbuild-redis`
- `cortexbuild-nginx`
- `cortexbuild-ollama`
- `cortexbuild-prometheus`
- `cortexbuild-grafana`

**Frontend** syncs via `./deploy.sh` (rsync dist/ to VPS)

**API** updates: rebuild Docker container on VPS or via `deploy/vps-sync.sh`

## Common Issues

- **Mock hoisting**: `vi.mock()` calls in Vitest must be at module top level, not inside `beforeEach()`
- **Server is CommonJS**: `server/` uses `require()`/`module.exports`, not ESM `import`/`export`
- **ESM root**: Root package is ESM (`"type": "module"`)
