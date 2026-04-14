# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CortexBuild Ultimate is an AI-Powered Unified Construction Management Platform for UK contractors. Enterprise SaaS combining 69 construction modules with a local Ollama AI agent system.

**Stack**: React 19 + TypeScript + Vite (frontend) / Express 4 + PostgreSQL 16 + Redis 7 (backend) / TanStack Query + WebSocket (state/real-time).

## Commands

### Frontend (project root)

```bash
npm install
npm run dev              # Dev server on http://localhost:5173 (proxies /api → localhost:3001)
npm run build            # tsc -b && vite build → dist/
npm run lint             # ESLint (src/ only)
npm run lint:fix         # ESLint auto-fix
npm test                 # Vitest with happy-dom (unit tests)
npm run test:watch       # Vitest watch mode
npx vitest run src/test/hooks.test.ts           # Single test file
npx vitest run -t "pattern"                    # Tests matching name pattern
npm run test:e2e         # Playwright E2E (Chromium)
npm run test:e2e:ui      # Playwright with UI
npm run test:e2e:headed  # Playwright headed mode
```

### Backend (server/ directory)

```bash
cd server && npm install
npm run dev              # nodemon auto-reload on port 3001
npm start                # Production (node, not Docker)
npm run db:reset:local   # Rebuild local DB from SQL migrations + seed
```

Server requires `DB_PASSWORD` set — exits with code 1 if missing. `SESSION_SECRET` must be at least 32 characters.

### Verification

```bash
npm run verify:all       # route verification + pre-commit check (tsc + lint + test)
npm run check            # tsc --noEmit + lint + test
npm run verify:routes    # Verify all 48 server routes are registered
```

## Architecture

### Frontend

- **Entry**: `src/main.tsx`. Import alias `@` → `src/`. `tsconfig.json` has `strict: true` but `noUnusedLocals: false` and `noUnusedParameters: false`.
- **Module lazy-loading**: `src/App.tsx` registers 69 modules via `React.lazy()`. Navigation uses `activeModule` state with a custom `Sidebar`/`AppShell` pattern — NOT React Router. `OAuthCallback` handles `/auth/callback` via `window.location.pathname` detection.
- **API layer** — TWO competing modules with different behaviors:
  - `src/services/api.ts` — `apiFetch<T>()` auto-converts snake_case to camelCase on ALL responses. `fetchAll()` unwraps `{ data, pagination }`. Throws on HTTP errors. `useData.ts` hooks use this module.
  - `src/lib/api.ts` — `apiRequest<T>()` returns `{ ok, status, data, error }` without throwing. `apiGet/apiPost/apiPut/apiDelete` DO throw. Does NOT perform key conversion. `useNotificationCenter.ts` uses this module.
  - **Rule**: Use `src/services/api.ts` for new API calls.
  - Request bodies use snake_case keys to match DB columns.
- **CRUD hooks** — `src/hooks/useData.ts` exports `makeHooks(resource)` factory generating `useList`, `useOne`, `useCreate`, `useUpdate`, `useDelete`. 40 entity hook sets. WebSocket `ws:message` events auto-invalidate queries for `notification`, `dashboard_update`, and `alert` message types. 60s stale time, `refetchOnWindowFocus: false`.
- **State** — React Context (`AuthContext`, `ThemeContext`) for auth/theme. TanStack Query via `useData.ts` for server state.
- **Auth** — JWT stored in `localStorage` under key `cortexbuild_token`. Use `getToken()` from `src/lib/auth-storage.ts` (NOT Supabase). User stored under `cortexbuild_user`. Logout blacklists JWT via Redis.
- **Design system** — `src/components/daisyui/` has 15+ DaisyUI-based primitives (Button, Modal, Table, etc.) with barrel `index.ts`.
- **Validations** — `src/lib/validations.ts` has Zod schemas for RFI, change orders, daily reports, safety reports, notifications, and nested arrays.
- **PWA** — `src/hooks/usePWA.ts` registers a service worker. `public/sw.js` and `public/offline.html` handle offline.

### Backend

**Entry point**: `server/index.js` — Express 4 on port 3001. Middleware stack: dotenv (from `server/.env`, NOT project root), helmet, cors, express.json (10mb limit), requestLogger, cookieParser, express-session (Redis-backed), passport.initialize(), passport.session(), rateLimiter. `app.set('trust proxy', 1)`. Graceful shutdown with 10-second timeout.

**CRITICAL**: `server/db.js` exports pool directly — `module.exports = pool`. Import with `const pool = require('./db')`, NOT `const { pool }` — destructuring yields `undefined`.

**Generic CRUD Router** (`server/routes/generic.js`): `makeRouter(tableName)` factory for standard CRUD with column whitelists (`ALLOWED_COLUMNS`), order-by validation, audit logging, and WebSocket broadcast. 30+ tables registered. Adding a table: add columns to `ALLOWED_COLUMNS` and register in `server/index.js`. Returns paginated `{ data: Row[], pagination }` wrappers.

**Specialized routes** (`server/routes/`):

| Route | Purpose |
|-------|---------|
| `auth.js` | JWT login/register (bcrypt 12 rounds). Sessions in Redis. |
| `oauth.js` | Google/Microsoft OAuth via Passport. CSRF state with 10-min expiry. |
| `ai.js` | Ollama streaming chat, intent routing, AI execute actions |
| `ai-intents/*.js` | 25 per-domain intent classifiers (invoices, RFIs, daily reports, projects, team, safety, budget, etc.) |
| `ai-predictive.js` | Cost forecasting and budget variance analysis |
| `rag.js` | Vector similarity via `pg_vector` cosine distance on `rag_embeddings` |
| `bim-models.js` | IFC upload + metadata extraction via `IfcAPI` |
| `workers/bimProcessor.js` | Background BIM processing queue using `SELECT FOR UPDATE SKIP LOCKED` polling |
| `notifications.js` | CRUD + mark-read/snooze/archive. Returns `{ notifications: [...], total, unreadCount }` |
| `files.js` / `upload.js` | Multer → `server/uploads/`, magic number validation |
| `deploy.js` | Rate-limited (5/hour) deploy webhook, protected by `DEPLOY_SECRET` bearer token |
| `email.js` | Email templates, send, bulk, schedule |
| `generic.js` | Per-table CRUD factory (30+ tables) |
| `backup.js` | Full database export with table whitelist. Table names validated via `ALLOWED_TABLE_MAP` (Object.fromEntries) to prevent SQL injection. |

**Feature flags** (`server/middleware/featureFlag.js`): `requireFeature()` middleware + `isFeatureEnabled()` helper. 5 flags: FEATURE_AI_AGENTS, FEATURE_RAG_SEARCH, FEATURE_WEBSOCKET, FEATURE_FILE_UPLOAD, FEATURE_EMAIL. Set `"false"` in `server/.env` to disable. Default: enabled when unset. Returns 403 with `{ code: 'FEATURE_DISABLED', feature }` — distinguishable from auth 403s.

**WebSocket** (`server/lib/websocket.js`): Authenticated WS on `/ws?token=JWT`. Rooms: `user:${userId}` + `project:${projectId}`. Creation gated by FEATURE_WEBSOCKET flag. Frontend detects rejected upgrades (code 1006) and stops reconnecting after 3 attempts. `broadcastDashboardUpdate` only fires for: `projects`, `invoices`, `safety_incidents`, `rfis`, `team_members`, `daily_reports`, `change_orders`.

### Authorization

**Permission middleware** (`server/middleware/checkPermission.js`): `checkPermission(module, action)` enforces role-based access. 6 roles: `super_admin`, `company_owner`, `admin`, `project_manager`, `field_worker`, `client`. `super_admin` and `company_owner` have wildcard `'*': ['*']`.

**Tenant isolation** (`server/middleware/tenantFilter.js`): Centralized module. `super_admin`: no filter. `company_owner`: no filter (same access as super_admin). Regular: `COALESCE(organization_id, company_id) = $N`. Deny: `1=0`.

**CRITICAL**: `company_owner` users have `organization_id = NULL`. ALL INSERTs must write BOTH `organization_id` AND `company_id`. ALL SELECT/UPDATE/DELETE must use `COALESCE(organization_id, company_id) = $N` — bare `organization_id = $1` evaluates to always-FALSE for NULL, silently returning zero rows.

**Route registration order matters**: More specific paths must be registered before wildcard paths. e.g., `/api/tenders/ai` before `/api/tenders`.

### AI System

- **Local Ollama only** — `qwen3.5:latest`, `deepseek-r1:7b`, `gemma4:latest`, `qwen2.5:7b` via Docker container `cortexbuild-ollama` (port 11434).
- **Embedding model** — `EMBEDDING_MODEL` env var (default: `nomic-embed-text:latest`). Must be a dedicated embedding model — `qwen3.5` is an LLM and produces null embeddings, breaking RAG.
- **25 intent classifiers** in `server/routes/ai-intents/` route natural language to domain actions.
- **RAG error handling** — `getEmbedding()` rejects on transport/parsing failures. POST handler catches failures and streams an unavailable message.

### Database

**Users** (authoritative columns): `id, name, email, password_hash, role, organization_id, company_id, phone, avatar, created_at, updated_at, permissions, is_active, notification_preferences, company`. NOT `first_name`/`last_name` — those were replaced. The `company` text column still exists.

**`updated_at` triggers**: All 54 tables with `updated_at` have BEFORE UPDATE triggers via `set_updated_at()` (migrations 057-058). Do NOT manually set `updated_at` in UPDATE queries.

**Invoice valid statuses**: `draft`, `sent`, `paid`, `overdue`, `disputed`. NOT `pending`, `unpaid`.

**Migrations**: 60 SQL files in `server/migrations/` (000-059, no file 051). Apply manually or via `scripts/run-migrations.sh`.

**Seed data**: `server/scripts/seed.sql` — default password `CortexBuild2024!` for all users.

## Infrastructure

### Production (VPS: root@72.62.132.43)

All services on `cortexbuild-ultimate_cortexbuild` Docker network:

| Container | Port | Hostname |
|----------|------|----------|
| `cortexbuild-api` | 127.0.0.1:3001 | `cortexbuild-api` |
| `cortexbuild-db` | 127.0.0.1:5432 | `cortexbuild-db` |
| `cortexbuild-redis` | 127.0.0.1:6379 | `cortexbuild-redis` |
| `cortexbuild-ollama` | 127.0.0.1:11434 | `cortexbuild-ollama` |

Nginx runs on the host (not Docker) on ports 80/443.

**Safe deploy** (on VPS, after git pull):
```bash
bash /root/deploy-api.sh    # Docker rebuild + health check
bash /root/deploy-frontend.sh
```

**Never edit files in `/var/www/cortexbuild-ultimate/` directly** — this is the production checkout synced by GitHub Actions; manual edits are overwritten on deploy.

**Docker Compose is broken on this VPS** — v1.29.2 drops DB/Redis/Ollama containers. Use `docker run` commands or deploy scripts only.

### Environment Variables

Server loads `.env` from `server/.env` subdirectory. Deploy script (`/root/deploy-api.sh`) sources both root `.env` and `server/.env`, then passes all vars via `-e` flags to the Docker container. If a new var is added to `server/.env`, it must also be added to the deploy script's `docker run` command.

Key vars:
- `DB_PASSWORD` — Required (server exits without it)
- `JWT_SECRET` / `SESSION_SECRET` — 64-char hex strings
- `OLLAMA_HOST` — `http://cortexbuild-ollama:11434` (Docker network), `http://localhost:11434` (host)
- `EMBEDDING_MODEL` — Must be `nomic-embed-text:latest`
- `DEPLOY_SECRET` — Bearer token for deploy webhook

## Git & CI

- **Pre-commit** (Husky): `lint-staged` (ESLint + tsc on staged), `verify-server-routes.sh`, `pre-commit-check.sh` (tsc + test + lint + build). lint-staged blocks commit on failure; others skip.
- **Commit format**: Conventional Commits. `type(scope): description`. Types: `feat, fix, docs, chore, refactor, test, perf, build, revert`.
- **CI**: `cortexbuildpro-ci.yml` runs build + test + lint in parallel. `deploy.yml` deploys to VPS on push to `main`.
- **Dockerfile.api** is the production Dockerfile (single-stage `node:22-alpine`, copies only `server/`).

## Common Issues

- **`ECONNREFUSED` on auth**: Inside Docker, `DB_HOST` must be `cortexbuild-db`, not `localhost`.
- **`organization_id = NULL` crashes routes**: Bare `WHERE organization_id = $1` always evaluates to FALSE for NULL. Use `COALESCE(organization_id, company_id) = $1`.
- **`db.js` destructuring trap**: `module.exports = pool` — `const { pool } = require('./db')` yields `undefined`. Use `const pool = require('./db')`.
- **Route returns object but frontend expects array**: `GET /notifications` returns `{ notifications: [...], total }` — `apiFetch` does NOT unwrap this. Verify response shape.
- **Notification center WS uses lib/api.ts**: It uses `src/lib/api.ts` which does NOT camelCase keys — `useNotificationCenter.ts` handles this internally.
- **`vi.mock()` in Vitest**: Must be at module top level, not inside `beforeEach()`.
- **Generic route ordering**: Register specific paths before wildcard routes in `server/index.js`.
- **ESLint**: Flat config (`eslint.config.js`) ignores `server/` and `e2e/`. Server has no linter.

## Debugging

```bash
# Container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# API logs
docker logs cortexbuild-api --tail 50

# API health
curl -sf http://127.0.0.1:3001/api/health

# DB tables
docker exec cortexbuild-db psql -U cortexbuild -d cortexbuild -c "\dt"

# DB table schema
docker exec cortexbuild-db psql -U cortexbuild -d cortexbuild -c "\d <table>"

# Quick restart (no rebuild)
docker restart cortexbuild-api
```
