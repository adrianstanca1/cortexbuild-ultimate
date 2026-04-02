# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CortexBuild Ultimate is an AI-Powered Unified Construction Management Platform for UK contractors. It combines 50+ construction modules with AI agents into a single enterprise SaaS platform.

**Stack**: React + TypeScript + Vite (frontend) / Express.js + PostgreSQL (backend, no ORM at runtime) / Zustand (state) / WebSocket (real-time)

> Note: `prisma/` contains schema definitions for reference only — the backend uses raw SQL via `pg` pool.

## Commands

### Frontend
```bash
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

**E2E Tests (Playwright):**
```bash
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Interactive UI mode
npm run test:e2e:headed  # Run in visible browser
```

### Backend
```bash
cd server
npm install
npm run dev              # nodemon auto-reload on port 3001
npm start                # Production (plain node)
npm run db:reset:local   # Reset local Docker Postgres from SQL migrations
```

### PM2 (production)
```bash
pm2 restart cortexbuild-api --update-env   # Restart after env changes
pm2 logs cortexbuild-api                    # Tail logs
```

### Database Migrations
```bash
# Migrations are plain SQL files, not managed by Prisma
psql -d cortexbuild -f server/migrations/001_add_audit_log.sql
```

## Architecture

### Backend: Generic CRUD Router
`server/routes/generic.js` exports `makeRouter(tableName)` — a factory for standard CRUD operations with:
- SQL injection prevention via `ALLOWED_COLUMNS` whitelist
- Order-by validation via `VALID_ORDER_COLS` set
- Automatic audit logging on mutations
- WebSocket broadcast on changes

**Adding a new table route:**
1. Add table columns to `ALLOWED_COLUMNS` in `generic.js`
2. Register in `server/index.js`: `app.use('/api/your-table', makeRouter('your_table'))`

### Specialized Backend Routes
- `routes/auth.js` — JWT login/register (bcrypt)
- `routes/oauth.js` — Google/Microsoft OAuth (Passport, CSRF-protected state)
- `routes/ai.js` — Ollama AI streaming
- `routes/files.js` / `routes/upload.js` — Multer uploads → `server/uploads/`
- `routes/email.js` — Nodemailer + SendGrid (rate-limited)
- `routes/search.js` — Global cross-table search
- `routes/metrics.js` — Health metrics (no auth)
- `routes/deploy.js` — Deployment endpoint (no auth)

### Authentication
- **JWT**: Required on all `/api/*` except `/api/auth/*`, `/api/health`, `/api/deploy`, `/api/metrics`
- **RBAC roles**: `super_admin`, `company_owner`, `admin`, `project_manager`, `field_worker`
- **OAuth**: CSRF state parameter (10-min expiry), JWT in URL fragment (`#token=`)

### Frontend Module System
`src/App.tsx` lazy-loads 50+ modules. Sidebar navigation maps to components in `src/components/`.

## Runtime Validation

Zod v4 validates API responses. Utilities in `src/lib/validateNotification.ts`:

```ts
import { validateNotification, safeValidateNotification } from '@/lib/validateNotification';

// Strict - returns null if invalid
const notification = validateNotification(rawData);

// Lenient - applies defaults for missing optional fields
const safe = safeValidateNotification(rawData, { strict: false });
```

Schemas: `src/lib/validations.ts`

## State & Real-time

- **Zustand** stores in `src/lib/store/` — `useAuthStore` (JWT + user), `useAppStore` (UI)
- **WebSocket** at `/ws` via `server/lib/websocket.js`
- **Broadcast** helper: `server/lib/ws-broadcast.js`

## AI Features

Local Ollama only — no external AI APIs. Agents in `src/lib/agents/`:
- `change-order-agent`, `rfi-analyzer`, `safety-agent`

## Environment

### Backend (`.env.docker`)
```
DB_PASSWORD=<required>
DB_HOST=127.0.0.1          # IP, not 'localhost'
JWT_SECRET=<secret>
CORS_ORIGIN=http://localhost:5173
OLLAMA_HOST=http://ollama:11434
OLLAMA_MODEL=qwen3.5:latest
```

### Frontend (`.env.local`)
```
VITE_API_BASE_URL=http://localhost:3001
```

## Design System

Dark industrial theme:
- `--slate-*` (backgrounds), `--amber-*` (accents), `--emerald-*` (success), `--red-*` (errors)

## Performance Budgets (Lighthouse CI)

| Metric | Threshold |
|--------|-----------|
| Performance | ≥95% |
| LCP | <2000ms |
| CLS | <0.05 |

## Docker Stack

```bash
docker-compose up -d       # Start all
docker-compose logs -f api # Tail API
docker-compose down        # Stop all
```

Services: postgres (5432), redis (6379), ollama (11434), api (3001), nginx (80/443), prometheus (9090), grafana (3002)

## Workflows

### Add New Module
1. Create `src/components/modules/ModuleName.tsx`
2. Add hook to `src/hooks/useData.ts` if needed
3. Register in `src/App.tsx` via `React.lazy()`
4. Add sidebar entry

### Add New Route
1. Generic CRUD: add to `ALLOWED_COLUMNS` in `generic.js`, register in `server/index.js`
2. Specialized: create `server/routes/<name>.js`

## Key Files

| Path | Purpose |
|------|---------|
| `src/App.tsx` | Main router (50+ lazy modules) |
| `src/hooks/useData.ts` | `makeHooks` factory for CRUD hooks |
| `src/lib/validateNotification.ts` | Zod runtime validation |
| `src/lib/validations.ts` | Zod schemas |
| `server/routes/generic.js` | CRUD factory + column whitelist |
| `server/db.js` | PostgreSQL pool |
| `server/middleware/auth.js` | JWT middleware |
| `server/middleware/uploadRateLimiter.js` | Upload rate limiting (20 req/min) |
| `server/lib/file-validation.js` | Magic number file validation |
| `server/lib/websocket.js` | WebSocket server |
| `docker-compose.yml` | Full stack orchestration |
| `lighthouserc.json` | Performance budgets |

## Security

### File Upload Security (2026-04-02 Audit)
- Path traversal prevention: `path.normalize()` + `startsWith(dir + path.sep)`
- Magic number validation via `file-type` library
- Upload rate limiting: 20 req/min (vs 100 for generic endpoints)
- Multi-tenancy: `organization_id` filtering on all CRUD operations

### OAuth Security
- CSRF protection via in-memory state parameter (10-min expiry)
- Tokens stored in `oauth_providers` with unique constraint on `(provider, provider_user_id)`
- Rate limiting on callback endpoints (10 requests per 15 minutes)
