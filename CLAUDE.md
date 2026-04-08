# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CortexBuild Ultimate is an AI-Powered Unified Construction Management Platform for UK contractors. Enterprise SaaS combining 50+ construction modules with a local Ollama AI agent system.

**Stack**: React 19 + TypeScript + Vite (frontend) / Express.js + PostgreSQL + Redis (backend) / React Context (state) / WebSocket (real-time)

## Commands

### Frontend

```bash
npm run dev              # Dev server on http://localhost:5173 (proxies /api → localhost:3001)
npm run build            # Production build → dist/
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix ESLint
npm test                 # Run Vitest tests (jsdom environment)
npm run test:coverage    # Coverage report
npx vitest run path/to/file.test.ts          # Single test file
npx vitest run -t "pattern"                    # Tests matching name pattern
```

### Backend

```bash
cd server && npm install
npm run dev              # nodemon auto-reload on port 3001
npm start                # Production (plain node, not Docker)
```

The server requires `DB_PASSWORD` to be set — it exits with code 1 if missing.

### Full Verification

```bash
npm run verify:all       # Runs: TypeScript check + tests + lint + build
npm run check            # tsc --noEmit + lint + test
```

## Architecture

### Frontend

- **Vite app** (`src/`) — React + TypeScript. Entry: `src/main.tsx`. Import alias `@` → `src/`.
- **Module lazy-loading** — `src/App.tsx` registers 50+ modules via `React.lazy()`. Routes are defined in the `PAGES` map.
- **Auth** — `localStorage` stores JWT under `cortexbuild_token` key (NOT `'token'`). Use `getToken()` from `@/lib/supabase`. On login, user object stored under `cortexbuild_user`.
- **API layer** — `src/services/api.ts` provides `apiFetch<T>()` which auto-converts snake_case DB columns to camelCase. **Critical**: responses from custom route handlers are returned as-is; only generic CRUD responses go through camelCase normalization.
- **State** — React Context (`src/context/AuthContext.tsx`, `src/context/ThemeContext.tsx`). TanStack Query (`@tanstack/react-query`) used by `useData.ts` hooks for caching and background refresh.
- **CRUD hooks** — `src/hooks/useData.ts` exposes `makeHooks(resource)` factory generating `useList`, `useOne`, `useCreate`, `useUpdate`, `useDelete` for each entity.

### Backend

**Generic CRUD Router** (`server/routes/generic.js`):
- Factory `makeRouter(tableName)` for standard CRUD with column whitelists (`ALLOWED_COLUMNS`), order-by validation, audit logging, and WebSocket broadcast.
- Adding a table: add columns to `ALLOWED_COLUMNS`, register in `server/index.js`.
- Generic routes return paginated `{ data: Row[], pagination }` wrappers.

**Specialized Routes** (`server/routes/`):

| Route | Purpose |
|-------|---------|
| `auth.js` | JWT login/register (bcrypt 12 rounds). Stores sessions in Redis. |
| `oauth.js` | Google/Microsoft OAuth via Passport. CSRF state with 10-min expiry. |
| `ai.js` | Ollama streaming chat, intent routing, AI execute actions |
| `ai-intents/*.js` | Per-domain intent classifiers (invoices, daily-reports, etc.) |
| `rag.js` | Vector similarity via `pg_vector` cosine distance on `rag_embeddings` |
| `bim-models.js` | IFC upload, `IfcAPI` metadata extraction, clash detection |
| `notifications.js` | CRUD + mark-read/snooze/archive. Returns `{ notifications: [...], total, unreadCount }` |
| `files.js` / `upload.js` | Multer → `server/uploads/`, magic number validation |
| `generic.js` | Per-table CRUD factory (40+ tables) |

**API response normalization**: `apiFetch` in `src/services/api.ts` converts snake_case keys to camelCase recursively. However, custom route handlers (not generic CRUD) return raw JSON as-is — snake_case stays snake_case unless the handler explicitly camelizes.

**Route registration order matters** in `server/index.js` — more specific paths must be registered before wildcard paths. e.g., `/api/tenders/ai` must come before `/api/tenders`.

### Authorization

**Permission middleware** (`server/middleware/checkPermission.js`):
- `checkPermission(module, action)` returns middleware enforcing role-based access per module.
- Routes using only `authMiddleware` are accessible to any authenticated user in the org — add `checkPermission` to restrict write operations.
- super_admin and company_owner have wildcard `'*': ['*']` access.
- Examples: `checkPermission('report-templates', 'read')`, `checkPermission('email', 'send')`.

### AI System

- **Local Ollama only** — `qwen3.5:latest` and `deepseek-r1:7b` via Docker container `cortexbuild-ollama` (port 11434).
- **Intent classifiers** in `server/routes/ai-intents/` handle natural language: invoices, daily reports, projects, team, safety, budget.
- **8 AI agents** with streaming UI — see `server/routes/ai-intents/`.
- **Embedding model** — `EMBEDDING_MODEL` env var (default: `nomic-embed-text:latest`). This MUST be a dedicated embedding model — `qwen3.5` is an LLM and will produce null embeddings, breaking all vector similarity search (RAG).
- **Company_owner intent queries** — AI intent routes use `WHERE organization_id = $1 OR (organization_id IS NULL AND company_id = $2)` to scope to the user's org or company.

### Database Schema

**Users table** (authoritative columns): `id, name, email, password_hash, role, company, phone, avatar, created_at, organization_id, company_id, notification_preferences`
**No**: `first_name`, `last_name`, `job_title`, `is_active`, `updated_at`

**Tables without `updated_at`**: `projects`, `invoices`, `rfis`, `tenders`, `companies`, `cost_forecasts`. Do NOT use `updated_at = NOW()` in UPDATE/upsert queries for these tables.

**Invoice valid statuses**: `draft`, `sent`, `paid`, `overdue`, `disputed` — NOT `pending`, `unpaid`.

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
This script pulls from `/root/cortexbuild-work`, runs `npm ci --omit=dev`, builds the Docker image, replaces the container, and validates with `curl http://localhost:3001/api/health`.

If Redis/Ollama/DB containers stop:
```bash
docker start <container_id_or_name>
```

### Frontend

Self-hosted on the VPS. GitHub Actions triggers `/root/deploy-frontend.sh` on push to `main`, which pulls the latest code, runs `npm ci --ignore-scripts && npm run build`, and syncs `dist/` to `/var/www/cortexbuild-ultimate/dist/`.

Nginx already serves this directory and proxies `/api/` to the Docker API container.

**Manual frontend deploy:**
```bash
bash /root/deploy-frontend.sh
```

## Common Issues

- **`ECONNREFUSED` on auth**: Inside Docker, `DB_HOST` must be `cortexbuild-db`, not `localhost`.
- **`organization_id = NULL` crashes routes**: `company_owner` users have `organization_id = NULL`. Routes that filter `WHERE organization_id = $1` will crash (parameter position error or NULL comparison). Use `company_id` for company_owner, or handle NULL explicitly with `COALESCE(organization_id, company_id)`.
- **Route returns object but frontend expects array**: `GET /notifications` returns `{ notifications: [...], total }` (object). `apiFetch` does NOT unwrap this — callers must destructure. Always verify the actual response shape of custom route handlers.
- **Microsoft OAuth crashes**: Guard both `/microsoft` and `/microsoft/callback` routes — `MICROSOFT_CLIENT_ID` env var may be empty in dev.
- **`vi.mock()` in Vitest**: Must be at module top level, not inside `beforeEach()`.
- **Generic route ordering**: Register specific paths (`/tenders/ai`) before wildcard routes (`/tenders`) in `server/index.js`.
- **Generic router pagination**: Generic CRUD returns `{ data, pagination }` — the frontend `fetchAll()` helper handles the unwrap.
