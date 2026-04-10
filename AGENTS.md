# AGENTS.md

Guide for AI coding agents working on CortexBuild Ultimate.

## Quick Reference

- **Stack**: React 19 + TypeScript + Vite (frontend) | Express 4 + PostgreSQL 16 + Redis 7 (backend)
- **Import alias**: `@` → `src/` in frontend code
- **State**: React Context (Auth, Theme) + TanStack Query via `useData.ts` hooks. Zustand is a dependency but NOT used.
- **DB**: Raw SQL migrations in `server/migrations/`, NOT Prisma. The `prisma/` directory is reference only.
- **Auth**: JWT in localStorage (`cortexbuild_token` key). Use `getToken()` from `src/lib/supabase.ts` — NOT direct localStorage access.

## Critical Rules

1. **`db.js` exports pool directly**: `const pool = require('./db')` — destructuring `const { pool }` yields `undefined`
2. **Server `.env` loads from `server/` subdirectory**, not project root
3. **`organization_id = NULL`** for `company_owner` users — always handle NULL explicitly with `COALESCE(organization_id, company_id)`
4. **Never `docker-compose up`** on the VPS — it's broken. Use `docker start <name>` or deploy scripts.
5. **Never edit `/var/www/cortexbuild-ultimate/`** directly — use deploy scripts.
6. **Tables without `updated_at`**: projects, invoices, rfis, tenders, companies, cost_forecasts — don't add `updated_at = NOW()` in UPDATE queries.
7. **Invoice statuses**: `draft`, `sent`, `paid`, `overdue`, `disputed` — NOT `pending` or `unpaid`.

## API Layer

Two competing API modules with different behaviors:
- **`src/services/api.ts`** (`apiFetch`): Auto-converts snake_case → camelCase, throws on HTTP errors, `fetchAll()` unwraps `{ data, pagination }`. Use this for new code.
- **`src/lib/api.ts`** (`apiRequest`): Returns `{ ok, status, data, error }`, no key conversion, throws only on network errors. Used by notification center only.

Generic CRUD routes return `{ data: Row[], pagination }`. Custom routes return their own shapes (e.g., `GET /notifications` returns `{ notifications: [...], total, unreadCount }`).

## Backend Patterns

- **Generic CRUD**: `makeRouter(tableName)` in `server/routes/generic.js` — add columns to `ALLOWED_COLUMNS`, register in `server/index.js`
- **Route order matters**: Register specific paths (`/tenders/ai`) before wildcards (`/tenders`) in `server/index.js`
- **WebSocket**: Authenticated on `/ws?token=JWT`. Rooms: `user:${userId}`, `project:${projectId}`. `broadcastDashboardUpdate` only fires for 7 whitelisted tables.
- **Migrations**: Forward-only numbered SQL files in `server/migrations/`. Apply with `psql -d cortexbuild -f server/migrations/NNN_file.sql` or `bash server/scripts/run-migrations.sh`
- **Auth middleware**: `authMiddleware` for any authenticated user, `checkPermission(module, action)` for role-based access
- **Roles**: `super_admin`, `company_owner`, `admin`, `project_manager`, `field_worker`, `client`

## Frontend Patterns

- **Entry**: `src/main.tsx` → `src/App.tsx` (68 lazy-loaded modules, switch-based routing)
- **Design system**: `src/components/daisyui/` — 15+ DaisyUI primitives with barrel `index.ts`
- **Validations**: `src/lib/validations.ts` — Zod schemas for RFI, change orders, daily reports, safety reports, notifications
- **PWA**: `src/hooks/usePWA.ts` registers service worker; `public/sw.js` and `public/offline.html` handle offline
- **Module pattern**: Each module in `src/components/modules/` uses `useData.ts` hook factory for CRUD operations

## Commands

```bash
# Frontend (in cortexbuild-work/)
npm run dev              # Dev server :5173 (proxies /api → :3001)
npm run build            # tsc -b && vite build → dist/
npm run check            # tsc --noEmit + lint + test
npm test                 # Vitest (happy-dom)
npx vitest run src/test/hooks.test.ts  # Single test file
npm run verify:all       # route verify + tsc + test + lint + build

# Backend (in cortexbuild-work/server/)
npm run dev              # nodemon on :3001
npm start                # Production mode
npm run db:reset:local   # Reset local database

# Deploy (on VPS)
bash /root/deploy-api.sh          # Full Docker rebuild + health check
bash /root/deploy-frontend.sh     # npm ci + build + chown

# Database
docker exec cortexbuild-db psql -U cortexbuild -d cortexbuild -c "\dt"  # List tables
bash /root/cortexbuild-work/server/scripts/run-migrations.sh              # Apply migrations
```

## Testing

- **Unit**: Vitest with `happy-dom` environment. Setup: `src/test/setup.ts`. Globals enabled (no imports needed for `describe/it/expect`).
- **E2E**: Playwright (Chromium only). Config: `playwright.config.ts`. Tests in `e2e/`.
- **Mock patterns**: Always mock `useData` hooks and `sonner` toast. `vi.mock()` must be at module top level, not inside `beforeEach()`.
- **ESLint**: Flat config (`eslint.config.js`), only checks `src/` — server code has no linter.
- **Commit**: Conventional Commits enforced via Husky `commit-msg` hook. Format: `type(scope): description`.

## Debugging

```bash
# API health
curl -s http://127.0.0.1:3001/api/health

# Container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep cortexbuild

# API logs
docker logs cortexbuild-api --tail 50

# Redis connectivity
docker exec cortexbuild-redis redis-cli ping

# Type check
cd /root/cortexbuild-work && npx tsc --noEmit

# Route verification
cd /root/cortexbuild-work && npm run verify:routes
```