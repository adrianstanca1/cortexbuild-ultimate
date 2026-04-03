# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CortexBuild Ultimate is an AI-Powered Unified Construction Management Platform for UK contractors. It combines 50+ construction modules with AI agents into a single enterprise SaaS platform.

**Stack**: React + TypeScript + Vite (frontend) / Express.js + PostgreSQL (backend, raw SQL via `pg` pool) / Zustand (state) / WebSocket (real-time)

> Note: `prisma/` contains schema definitions for reference only — the backend uses raw SQL, not Prisma ORM at runtime.

## Commands

### Frontend (Vite)
```bash
npm run dev              # Dev server on http://localhost:5173 (proxies /api → localhost:3001)
npm run build            # Production build → dist/
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix ESLint
npm run test             # Run Vitest tests (jsdom environment)
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
cd server
npm install
npm run dev              # nodemon auto-reload on port 3001
npm start                # Production (plain node)
```

### Database Migrations
```bash
# Migrations are plain SQL files, not managed by Prisma
psql -d cortexbuild -f server/migrations/001_add_audit_log.sql
```

## Architecture

### Dual Frontend Architecture

The project has two coexisting frontend layers:

- **Vite app** (`src/`) — the primary React + TypeScript frontend, built with Vite. Entry point: `src/main.tsx`. Import alias `@` → `src/`.
- **Next.js app** (`app/`) — a newer layer with App Router API route handlers under `app/api/` (auth, projects, rfis, tasks). Config in `next.config.ts`.

The Vite frontend is what Vercel currently serves. The `app/api/` routes are a partial migration; treat `src/` as the authoritative frontend source.

### Module System

`src/App.tsx` lazy-loads 50+ modules via `React.lazy()`. Sidebar navigation maps to components in `src/components/`. Each module is a self-contained component.

Adding a new module:
1. Create `src/components/modules/ModuleName.tsx`
2. Add hook to `src/hooks/useData.ts` if needed
3. Register in `src/App.tsx` via `React.lazy()`
4. Add sidebar entry

### Backend: Generic CRUD Router

`server/routes/generic.js` exports `makeRouter(tableName)` — a factory for standard CRUD operations with:
- SQL injection prevention via `ALLOWED_COLUMNS` whitelist
- Order-by validation via `VALID_ORDER_COLS` set
- Automatic audit logging on mutations
- WebSocket broadcast on changes

Adding a new table route:
1. Add table columns to `ALLOWED_COLUMNS` in `generic.js`
2. Register in `server/index.js`: `app.use('/api/your-table', makeRouter('your_table'))`

### Specialized Backend Routes

| Route | Purpose |
|-------|---------|
| `routes/auth.js` | JWT login/register (bcrypt) |
| `routes/oauth.js` | Google/Microsoft OAuth (Passport, CSRF-protected state) |
| `routes/ai.js` | Ollama AI streaming |
| `routes/files.js` / `routes/upload.js` | Multer uploads → `server/uploads/` |
| `routes/email.js` | Nodemailer + SendGrid (rate-limited) |
| `routes/search.js` | Global cross-table search |
| `routes/metrics.js` | Health metrics (no auth) |
| `routes/deploy.js` | Deployment endpoint (no auth) |

### Authentication

- **JWT**: Required on all `/api/*` except `/api/auth/*`, `/api/health`, `/api/deploy`, `/api/metrics`
- **RBAC roles**: `super_admin`, `company_owner`, `admin`, `project_manager`, `field_worker`
- **OAuth**: CSRF state parameter (10-min expiry), JWT in URL fragment (`#token=`)

### State & Real-time

- **Zustand** stores in `src/lib/store/` — `useAuthStore` (JWT + user), `useAppStore` (UI)
- **WebSocket** at `/ws` via `server/lib/websocket.js`
- **Broadcast** helper: `server/lib/ws-broadcast.js`

### AI Features

Local Ollama only — no external AI APIs. Agents in `src/lib/agents/`: `change-order-agent`, `rfi-analyzer`, `safety-agent`.

## Module System Gotcha

- Root package (`cortexbuild-work/`) — ESM (`"type": "module"`)
- Server package (`cortexbuild-work/server/`) — CommonJS (`"type": "commonjs"`); use `require()` / `module.exports`, not `import`/`export`

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

## Key Files

| Path | Purpose |
|------|---------|
| `src/App.tsx` | Main router (50+ lazy modules) |
| `src/hooks/useData.ts` | `makeHooks` factory for CRUD hooks |
| `src/lib/validateNotification.ts` | Zod runtime validation |
| `src/lib/validations.ts` | Zod schemas |
| `server/routes/generic.js` | CRUD factory + column whitelist |
| `server/db.js` | PostgreSQL pool |
| `server/index.js` | Express app entry + route registration |
| `server/middleware/auth.js` | JWT middleware |
| `server/middleware/uploadRateLimiter.js` | Upload rate limiting (20 req/min) |
| `server/lib/websocket.js` | WebSocket server |
| `docker-compose.yml` | Full stack orchestration |

## Design System

Dark industrial theme:
- `--slate-*` (backgrounds), `--amber-*` (accents), `--emerald-*` (success), `--red-*` (errors)

## Security Notes

- **File uploads**: Path traversal prevention via `path.normalize()` + `startsWith(dir + path.sep)`; magic number validation via `file-type` library
- **SQL injection**: All generic CRUD routes use column whitelists (`ALLOWED_COLUMNS`)
- **Multi-tenancy**: `organization_id` filtering on all CRUD operations
- **OAuth**: CSRF state parameter with 10-min expiry; rate limiting on callback (10 req/15 min)

## Performance Budgets (Lighthouse CI)

| Metric | Threshold |
|--------|-----------|
| Performance | ≥95% |
| LCP | <2000ms |
| CLS | <0.05 |
