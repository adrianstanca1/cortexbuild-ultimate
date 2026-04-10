# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CortexBuild Ultimate is an AI-Powered Unified Construction Management Platform for UK contractors. Enterprise SaaS combining 50+ construction modules with a local Ollama AI agent system.

**Stack**: React 19 + TypeScript + Vite (frontend) / Express 4 + PostgreSQL 16 + Redis 7 (backend) / React Context + TanStack Query (state) / WebSocket (real-time)

## Commands

### Frontend (root directory)

```bash
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
```

### Backend (server/ directory)

```bash
cd server && npm install
npm run dev              # nodemon auto-reload on port 3001
npm start                # Production (plain node, not Docker)
npm run db:reset:local   # Reset local database
```

The server requires `DB_PASSWORD` to be set — it exits with code 1 if missing.

### Full Verification

```bash
npm run verify:all       # Runs: route verification + TypeScript check + tests + lint + build
npm run check            # tsc --noEmit + lint + test
```

## Architecture

### Frontend

- **Vite app** (`src/`) — React 19 + TypeScript. Entry: `src/main.tsx`. Import alias `@` → `src/`.
- **Module lazy-loading** — `src/App.tsx` registers 60+ modules via `React.lazy()`. No React Router — navigation uses `activeModule` state with a custom `Sidebar`/`AppShell` pattern.
- **Auth** — JWT stored in `localStorage` under key `cortexbuild_token` (NOT `'token'`). Use `getToken()` from `src/lib/supabase.ts`. On login, user object stored under key `cortexbuild_user`. Logout blacklists the JWT server-side via Redis.
- **API layer** — `src/services/api.ts` provides `apiFetch<T>()` which auto-converts snake_case DB columns to camelCase. **Critical**: responses from custom route handlers are returned as-is; only generic CRUD responses go through camelCase normalization. The `fetchAll()` helper unwraps the `{ data, pagination }` wrapper from generic routes.
- **State** — React Context (`AuthContext`, `ThemeContext`) for auth/theme. TanStack Query via `useData.ts` hooks for server state with caching, background refresh, and WebSocket invalidation.
- **CRUD hooks** — `src/hooks/useData.ts` exposes `makeHooks(resource)` factory generating `useList`, `useOne`, `useCreate`, `useUpdate`, `useDelete` per entity. WebSocket `ws:message` events auto-invalidate relevant queries.
- **Design system** — `src/components/daisyui/` contains 15+ DaisyUI-based primitives (Button, Modal, Table, etc.) with barrel `index.ts`.
- **Validations** — `src/lib/validations.ts` has Zod schemas for RFI, change orders, daily reports, safety reports, notifications.
- **PWA** — `src/hooks/usePWA.ts` registers a service worker. `public/sw.js` and `public/offline.html` handle offline.

### Backend

**Entry point**: `server/index.js` — Express 4 server with HTTP + WebSocket on port 3001. Middleware: dotenv, helmet (CSP), cors, express.json (10mb limit), cookieParser, requestLogger, rateLimiter.

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
| `generic.js` | Per-table CRUD factory (30+ tables) |

**API response normalization**: `apiFetch` in `src/services/api.ts` converts snake_case keys to camelCase recursively. Custom route handlers return raw JSON — snake_case stays snake_case unless the handler explicitly camelizes.

**Route registration order matters** in `server/index.js` — more specific paths must be registered before wildcard paths. e.g., `/api/tenders/ai` must come before `/api/tenders`.

**WebSocket system** (`server/lib/websocket.js`):
- Authenticated WS on `/ws?token=JWT`. Rooms model: user rooms + project rooms.
- `server/lib/ws-broadcast.js` provides server-side broadcast helpers for dashboard updates, notifications, alerts.
- Frontend `src/lib/eventBus.ts` is a typed singleton that propagates WS messages to TanStack Query invalidation.

### Authorization

**Permission middleware** (`server/middleware/checkPermission.js`):
- `checkPermission(module, action)` returns middleware enforcing role-based access per module.
- Routes using only `authMiddleware` are accessible to any authenticated user in the org — add `checkPermission` to restrict write operations.
- 6 roles: `super_admin`, `company_owner`, `admin`, `project_manager`, `field_worker`, `client`.
- `super_admin` and `company_owner` have wildcard `'*': ['*']` access.
- Module actions: create, read, update, delete, export, approve, view_financials.

### AI System

- **Local Ollama only** — `qwen3.5:latest` and `deepseek-r1:7b` via Docker container `cortexbuild-ollama` (port 11434).
- **Intent classifiers** in `server/routes/ai-intents/` handle natural language: invoices, daily reports, projects, team, safety, budget.
- **8 AI agents** with streaming UI — see `server/routes/ai-intents/`.
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
- `OLLAMA_HOST` — `http://localhost:11434` (local) or `http://ollama:11434` (Docker)
- `EMBEDDING_MODEL` — Must be `nomic-embed-text:latest`, NOT an LLM
- Feature flags: `FEATURE_AI_AGENTS`, `FEATURE_RAG_SEARCH`, `FEATURE_WEBSOCKET`, `FEATURE_FILE_UPLOAD`, `FEATURE_EMAIL`

## Common Issues

- **`ECONNREFUSED` on auth**: Inside Docker, `DB_HOST` must be `cortexbuild-db`, not `localhost`.
- **`organization_id = NULL` crashes routes**: `company_owner` users have `organization_id = NULL`. Routes that filter `WHERE organization_id = $1` will crash. Use `company_id` for company_owner, or handle NULL explicitly with `COALESCE(organization_id, company_id)`.
- **Route returns object but frontend expects array**: `GET /notifications` returns `{ notifications: [...], total }` (object). `apiFetch` does NOT unwrap this — callers must destructure. Always verify the actual response shape of custom route handlers.
- **Microsoft OAuth crashes**: Guard both `/microsoft` and `/microsoft/callback` routes — `MICROSOFT_CLIENT_ID` env var may be empty in dev.
- **`vi.mock()` in Vitest**: Must be at module top level, not inside `beforeEach()`.
- **Generic route ordering**: Register specific paths (`/tenders/ai`) before wildcard routes (`/tenders`) in `server/index.js`.
- **Generic router pagination**: Generic CRUD returns `{ data, pagination }` — the frontend `fetchAll()` helper handles the unwrap.
- **Test environment**: Vitest uses `happy-dom` (not jsdom). Setup file is `src/test/setup.ts`.
- **ESLint**: Flat config (`eslint.config.js`) ignores `server/`, `e2e/`, `prisma/`. Server code has no linter.
- **Docker Compose broken**: VPS has Docker Compose v1.29.2 which is broken. Use `docker run` commands or the deploy scripts.