# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CortexBuild Ultimate is an AI-Powered Unified Construction Management Platform for UK contractors. Enterprise SaaS combining 50+ construction modules with a local Ollama AI agent system.

**Stack**: React 19 + TypeScript + Vite (frontend) / Express 4 + PostgreSQL 16 + Redis 7 (backend) / React Context + TanStack Query (state) / WebSocket (real-time)

**Note**: The `prisma/` directory is **reference schema only** — production uses raw SQL migrations in `server/migrations/`. The `ARCHITECTURE.md` describes an aspirational/design architecture and may not reflect the current implementation.

**Zustand is listed as a dependency but NOT used anywhere** — state management uses React Context (`AuthContext`, `ThemeContext`) + TanStack Query via `useData.ts` hooks. The `src/lib/store/` directory does not exist.

## Commands

### Frontend (cortexbuild-work/ directory)

```bash
npm install
npm run dev              # Dev server on http://localhost:5173 (proxies /api → localhost:3001)
npm run build            # tsc -b && vite build → dist/
npm run lint             # ESLint check (src/ only)
npm run lint:fix         # Auto-fix ESLint
npm test                 # Vitest with happy-dom environment
npm run test:watch       # Vitest watch mode
npm run test:coverage    # Coverage report
npx vitest run src/test/hooks.test.ts           # Single test file
npx vitest run -t "pattern"                      # Tests matching name pattern
npm run test:e2e         # Playwright E2E tests (Chromium only)
npm run test:e2e:ui      # Playwright with UI
npm run test:e2e:headed  # Playwright headed mode
```

### Backend (server/ directory)

```bash
cd server && npm install
npm run dev              # nodemon auto-reload on port 3001
npm start                # Production (plain node, not Docker)
npm run db:reset:local   # Reset local database
```

The server requires `DB_PASSWORD` to be set — it exits with code 1 if missing. `SESSION_SECRET` must be at least 32 characters or the server exits.

### Full Verification

```bash
npm run verify:all       # route verification + TypeScript check + tests + lint + build
npm run check            # tsc --noEmit + lint + test
```

## Architecture

### Frontend

- **Vite app** (`src/`) — React 19 + TypeScript. Entry: `src/main.tsx`. Import alias `@` → `src/`. `tsconfig.json` has `strict: true` but `noUnusedLocals: false` and `noUnusedParameters: false` — unused vars/params are warnings, not errors.
- **Module lazy-loading** — `src/App.tsx` registers 68 modules via `React.lazy()`. No React Router for main navigation — uses `activeModule` state with a custom `Sidebar`/`AppShell` pattern. React Router is installed but currently unused for module routing. `OAuthCallback` handles `/auth/callback` via `window.location.pathname` detection (not React Router).
- **Auth** — JWT stored in `localStorage` under key `cortexbuild_token` (NOT `'token'`). Use `getToken()` from `src/lib/supabase.ts` (misleading filename — it's a local JWT helper, not Supabase). On login, user object stored under key `cortexbuild_user`. Logout blacklists the JWT server-side via Redis.
- **API layer** — TWO competing API utility modules with different behaviors:
  - `src/services/api.ts` — `apiFetch<T>()` auto-converts snake_case to camelCase on ALL responses. `fetchAll()` unwraps `{ data, pagination }` from generic routes. Throws on HTTP errors. `useData.ts` hooks use this module.
  - `src/lib/api.ts` — `apiRequest<T>()` returns `{ ok, status, data, error }` without throwing. `apiGet/apiPost/apiPut/apiDelete` DO throw. Does NOT perform key conversion. `useNotificationCenter.ts` uses this module.
  - **Rule**: When adding new API calls, use `src/services/api.ts` for consistency. The notification center uses `src/lib/api.ts` for historical reasons.
  - Request bodies are sent as-is (not transformed) — send snake_case keys to match DB columns.
- **State** — React Context (`AuthContext`, `ThemeContext`) for auth/theme. TanStack Query via `useData.ts` hooks for server state with caching, background refresh, and WebSocket invalidation.
- **CRUD hooks** — `src/hooks/useData.ts` exposes `makeHooks(resource)` factory generating `useList`, `useOne`, `useCreate`, `useUpdate`, `useDelete` per entity. 35 entity hook sets exported. WebSocket `ws:message` events auto-invalidate queries — but only for `notification`, `dashboard_update`, and `alert` message types, and invalidation is broadcast (all list queries invalidate, not table-specific). 60s stale time, `refetchOnWindowFocus: false`.
- **Design system** — `src/components/daisyui/` contains 15+ DaisyUI-based primitives (Button, Modal, Table, etc.) with barrel `index.ts`.
- **Validations** — `src/lib/validations.ts` has Zod schemas for RFI, change orders, daily reports, safety reports, notifications.
- **PWA** — `src/hooks/usePWA.ts` registers a service worker. `public/sw.js` and `public/offline.html` handle offline.

### Backend

**Entry point**: `server/index.js` — Express 4 server with HTTP + WebSocket on port 3001. Middleware stack: dotenv (loads from `server/.env` subdirectory, NOT project root), helmet (CSP), cors, express.json (10mb limit), requestLogger, cookieParser, express-session (Redis-backed, 24-hour cookie, secure in production), passport.initialize(), passport.session(), rateLimiter. `app.set('trust proxy', 1)`. CORS defaults to deny-all if `CORS_ORIGIN` is not set. Graceful shutdown with 10-second timeout.

**Key endpoints**: `/api/health` (checks PostgreSQL + Redis connectivity), `/api/metrics` (Prometheus request timing), `/uploads` (static file serving, directory listing disabled).

**Generic CRUD Router** (`server/routes/generic.js`):
- Factory `makeRouter(tableName)` for standard CRUD with column whitelists (`ALLOWED_COLUMNS`), order-by validation, audit logging, and WebSocket broadcast.
- Adding a table: add columns to `ALLOWED_COLUMNS`, register in `server/index.js`.
- Generic routes return paginated `{ data: Row[], pagination }` wrappers.

**Specialized Routes** (`server/routes/`):

| Route | Purpose |
|-------|---------|
| `auth.js` | JWT login/register (bcrypt 12 rounds). Sessions in Redis. |
| `oauth.js` | Google/Microsoft OAuth via Passport. CSRF state with 10-min expiry. |
| `ai.js` | Ollama streaming chat, intent routing, AI execute actions |
| `ai-intents/*.js` | 20+ per-domain intent classifiers (invoices, daily-reports, projects, team, safety, budget, etc.) |
| `rag.js` | Vector similarity via `pg_vector` cosine distance on `rag_embeddings` |
| `bim-models.js` | IFC upload, `IfcAPI` metadata extraction, clash detection |
| `notifications.js` | CRUD + mark-read/snooze/archive. Returns `{ notifications: [...], total, unreadCount }` |
| `files.js` / `upload.js` | Multer → `server/uploads/`, magic number validation |
| `deploy.js` | Rate-limited (5/hour) deploy webhook, protected by `DEPLOY_SECRET` bearer token |
| `generic.js` | Per-table CRUD factory (30+ tables) |

**API response normalization**: `apiFetch` in `src/services/api.ts` converts snake_case keys to camelCase recursively on ALL responses. Only raw `fetch()` calls bypass this normalization, so custom route handlers called via `apiFetch` still return camelCase keys. Request bodies are sent as-is (snake_case keys match DB columns).

**Route registration order matters** in `server/index.js` — more specific paths must be registered before wildcard paths. e.g., `/api/tenders/ai` must come before `/api/tenders`.

**WebSocket system** (`server/lib/websocket.js`):
- Authenticated WS on `/ws?token=JWT`. Rooms model: user rooms (`user:${userId}`) + project rooms (`project:${projectId}`). Supports multiple tabs per user.
- `server/lib/ws-broadcast.js` provides server-side broadcast helpers. `broadcastDashboardUpdate` only fires for 7 whitelisted tables: `projects`, `invoices`, `safety_incidents`, `rfis`, `team_members`, `daily_reports`, `change_orders`. Changes to other tables do NOT trigger dashboard broadcasts.
- Frontend `src/lib/eventBus.ts` is a typed singleton (events: `ws:message`, `ws:connect`, `ws:disconnect`) that propagates WS messages to TanStack Query invalidation.
- Frontend `src/hooks/useNotificationCenter.ts` is the only direct WS consumer. It bridges to eventBus via `eventBus.emit('ws:message', ...)`.

### Authorization

**Permission middleware** (`server/middleware/checkPermission.js`):
- `checkPermission(module, action)` returns middleware enforcing role-based access per module.
- Routes using only `authMiddleware` are accessible to any authenticated user in the org — add `checkPermission` to restrict write operations.
- 6 roles: `super_admin`, `company_owner`, `admin`, `project_manager`, `field_worker`, `client`.
- `super_admin` and `company_owner` have wildcard `'*': ['*']` access.
- Module actions: create, read, update, delete, export, approve, view_financials.

**Other middleware** (`server/middleware/`):
- `uploadRateLimiter.js` — Stricter rate limit (20 req/min per user) for upload endpoints. Redis-backed with in-memory fallback.
- `requestLogger.js` — Logs method, path, status, duration.
- `rateLimiter.js` — General API rate limiting.

### AI System

- **Local Ollama only** — `qwen3.5:latest` and `deepseek-r1:7b` via Docker container `cortexbuild-ollama` (port 11434).
- **Intent classifiers** in `server/routes/ai-intents/` handle natural language: invoices, daily reports, projects, team, safety, budget.
- **25 per-domain intent classifiers** in `server/routes/ai-intents/` — route natural language to domain-specific actions.
- **Embedding model** — `EMBEDDING_MODEL` env var (default: `nomic-embed-text:latest`). This MUST be a dedicated embedding model — `qwen3.5` is an LLM and will produce null embeddings, breaking all vector similarity search (RAG).

### Database Schema

**Users table** (authoritative columns): `id, name, email, password_hash, role, company, phone, avatar, created_at, organization_id, company_id, notification_preferences`
**No**: `first_name`, `last_name`, `job_title`, `is_active`, `updated_at`

**Tables without `updated_at`**: `projects`, `invoices`, `rfis`, `tenders`, `companies`, `cost_forecasts`. Do NOT use `updated_at = NOW()` in UPDATE/upsert queries for these tables.

**Invoice valid statuses**: `draft`, `sent`, `paid`, `overdue`, `disputed` — NOT `pending`, `unpaid`.

**Migrations**: 54 SQL files in `server/migrations/` (000-053). Apply with `psql -d cortexbuild -f server/migrations/NNN_file.sql`. No migration runner — apply manually or via `scripts/run-migrations.sh`.

**Seed data**: `server/scripts/seed.sql` — default password `CortexBuild2024!` for all users.

## Infrastructure

### Production (VPS: root@72.62.132.43)

All services run as Docker containers (managed with `docker run`, **never `docker-compose up`** — v1.29.2 is broken on this VPS):
- `cortexbuild-api` — Express.js on port 3001 (Docker network, not exposed externally)
- `cortexbuild-db` — PostgreSQL 16 + pgvector on port 5432
- `cortexbuild-redis` — Redis 7 on port 6379
- `cortexbuild-ollama` — Ollama with `qwen3.5:latest`, `deepseek-r1:7b`
- `cortexbuild-prometheus` — Metrics (9090)
- `cortexbuild-grafana` — Dashboards (3002)
- Nginx — Host machine (not Docker), ports 80/443 as reverse proxy

**Safe API restart** (on VPS, after pulling):
```bash
bash /root/deploy-api.sh    # Full Docker rebuild + health check
```

**Manual frontend deploy:**
```bash
bash /root/deploy-frontend.sh
```

### Key Environment Variables

- `DB_PASSWORD` — Required, server exits without it
- `JWT_SECRET` / `SESSION_SECRET` — 64-char hex strings
- `OLLAMA_HOST` — `http://localhost:11434` (local) or `http://ollama:11434` (Docker) or `http://cortexbuild-ollama:11434` (Docker network)
- `EMBEDDING_MODEL` — Must be `nomic-embed-text:latest`, NOT an LLM
- Feature flags: `FEATURE_AI_AGENTS`, `FEATURE_RAG_SEARCH`, `FEATURE_WEBSOCKET`, `FEATURE_FILE_UPLOAD`, `FEATURE_EMAIL` — documented but NOT checked in server code (no runtime enforcement)
- `DEPLOY_SECRET` — Bearer token for the deploy webhook route
- Server loads `.env` from `server/.env` subdirectory (not project root)

## Git & CI

- **Pre-commit** (Husky): `lint-staged` (ESLint + tsc on staged files), `verify-server-routes.sh`, `pre-commit-check.sh` (tsc + test + lint + build). lint-staged failures block the commit; the other two use fallback skip.
- **Commit messages**: Conventional Commits enforced via `commit-msg` hook. Format: `type(scope): description`. Types: `feat, fix, docs, chore, refactor, test, ci, perf, build, revert`.
- **CI** (GitHub Actions): `cortexbuildpro-ci.yml` runs build + test + lint in parallel on push/PR. `deploy.yml` deploys to VPS on push to `main`. CI does NOT run server-side tests. No staging environment — deploys directly to production.
- **Dockerfile.api** is the production Dockerfile (single-stage `node:22-alpine`, copies only `server/`). The main `Dockerfile` has a multi-stage build but is NOT used on the VPS.

## Common Issues

- **`ECONNREFUSED` on auth**: Inside Docker, `DB_HOST` must be `cortexbuild-db`, not `localhost`.
- **`organization_id = NULL` crashes routes**: `company_owner` users have `organization_id = NULL`. Routes that filter `WHERE organization_id = $1` will crash. Use `company_id` for company_owner, or handle NULL explicitly with `COALESCE(organization_id, company_id)`.
- **Route returns object but frontend expects array**: `GET /notifications` returns `{ notifications: [...], total }` (object). `apiFetch` does NOT unwrap this — callers must destructure. Always verify the actual response shape of custom route handlers.
- **Microsoft OAuth crashes**: Guard both `/microsoft` and `/microsoft/callback` routes — `MICROSOFT_CLIENT_ID` env var may be empty in dev.
- **`vi.mock()` in Vitest**: Must be at module top level, not inside `beforeEach()`.
- **Generic route ordering**: Register specific paths (`/tenders/ai`) before wildcard routes (`/tenders`) in `server/index.js`.
- **Generic router pagination**: Generic CRUD returns `{ data, pagination }` — the frontend `fetchAll()` helper handles the unwrap.
- **Test environment**: Vitest uses `happy-dom` (not jsdom). Setup file is `src/test/setup.ts`. `globals: true` — `describe`, `it`, `expect` are available without imports. Setup imports `@testing-library/jest-dom` matchers and mocks `HTMLCanvasElement.getContext`, `window.matchMedia`, `URL.createObjectURL`. `vitest.config.ts` excludes `rateLimiter.test.ts` from runs.
- **ESLint**: Flat config (`eslint.config.js`) ignores `server/`, `e2e/`, `prisma/`. Server code has no linter.
- **Docker Compose broken**: VPS has Docker Compose v1.29.2 which is broken. Use `docker run` commands or the deploy scripts.
