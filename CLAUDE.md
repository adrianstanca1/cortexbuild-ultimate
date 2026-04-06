# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CortexBuild Ultimate is an AI-Powered Unified Construction Management Platform for UK contractors. It is an enterprise SaaS platform combining 50+ construction modules with an AI agent system.

**Stack**: React 19 + TypeScript + Vite (frontend) / Express.js + PostgreSQL (backend, raw SQL via `pg` pool) / Zustand (state) / WebSocket (real-time)

### Database Schema Statistics

- **4,500+ lines** of schema
- **85+ models** with full relations
- **55+ enums** for type safety
- **100+ indexes** for performance
- Complete audit trail on all entities

### v3.0.0 New Features

- **NotificationCenter** — Real-time notifications with filtering
- **NotificationPreferences** — Multi-channel notification settings
- **TeamChat** — Real-time team messaging
- **ActivityFeed** — Live activity stream
- **AdvancedAnalytics** — Business intelligence dashboard
- **ProjectCalendar** — Project scheduling with Month/Week/Day views

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

Migrations are plain SQL files under `server/migrations/` (not Prisma at runtime).

```bash
psql "$DATABASE_URL" -f server/migrations/XXX_description.sql
```

**Auth**: `md5` encryption required — node-postgres is incompatible with `scram-sha-256`.
After any `pg_hba.conf` edit:

```bash
chown postgres:postgres /etc/postgresql/16/main/pg_hba.conf
systemctl reload postgresql
```

## Architecture

### Frontend Structure

- **Vite app** (`src/`) — React + TypeScript UI. Entry: `src/main.tsx`. Import alias `@` → `src/`.
- **Module system** — `src/App.tsx` lazy-loads 50+ modules via `React.lazy()`. Sidebar navigation maps to `src/components/`.
- **State** — Zustand stores in `src/lib/store/` (`useAuthStore`, `useAppStore`).
- **Real-time** — WebSocket at `/ws` via `server/lib/websocket.js`.
- **BIM Viewer** — Native IFC visualization using `web-ifc-three` and `web-ifc`. Employs dynamic `import()` for 3D libraries to optimize LCP.

### Backend Structure

**Generic CRUD Router** (`server/routes/generic.js`):
- Factory `makeRouter(tableName)` for standard CRUD with SQL injection prevention (column whitelists), order-by validation, audit logging, and WebSocket broadcast.
- Adding a new table route: add columns to `ALLOWED_COLUMNS`, register in `server/index.js`.

**Specialized Routes**:

| Route | Purpose |
|-------|---------|
| `routes/auth.js` | JWT login/register (bcrypt) |
| `routes/oauth.js` | Google/Microsoft OAuth (Passport, CSRF-protected state) |
| `routes/ai.js` | Ollama AI streaming |
| `routes/files.js` / `routes/upload.js` | Multer uploads → `server/uploads/` |
| `routes/rag.js` | Vector similarity search via `pg_vector` for context injection |
| `routes/bim-models.js` | BIM file upload, metadata extraction (`IfcAPI`), clash detection |

### Authentication & Multi-tenancy

- **JWT**: Required on all `/api/*` except `/api/auth/*`, `/api/health`, `/api/deploy`.
- **RBAC roles**: `super_admin`, `company_owner`, `admin`, `project_manager`, `field_worker`, `client`.
- **Multi-tenancy**: Strict isolation using `organization_id` and `company_id` filters in all SQL queries.

### AI Features

- **Local Ollama only** — no external AI APIs. Intent classifiers in `server/routes/ai-intents/`.
- **RAG**: Vector similarity via `rag_embeddings` table and cosine similarity.

### AI Agents System

- **8 specialized agents** with streaming UI.
- **Subagents** for domain-specific tasks (RFI analysis, Change Orders, etc.).
- Agents located in `.agents/` directory. See `.agents/README.md`.

## Key Files

| Path | Purpose |
|------|---------|
| `src/App.tsx` | Main router (50+ lazy modules) |
| `src/hooks/useData.ts` | `makeHooks` factory for CRUD hooks |
| `src/lib/store/` | Zustand stores (auth, app state) |
| `src/lib/validations.ts` | Zod v4 schemas |
| `server/routes/generic.js` | CRUD factory + column whitelist |
| `server/db.js` | PostgreSQL pool |
| `server/index.js` | Express app entry + route registration |
| `server/middleware/auth.js` | JWT middleware |
| `server/lib/websocket.js` | WebSocket server |
| `server/lib/bootstrap-tenant.js` | Org/company/user creation for OAuth and self-registration |
| `BIM_ARCHITECTURE.md` | Specification for 3D rendering and coordinate systems |

## Keyboard Shortcuts

| Shortcut | Action          |
| -------- | --------------- |
| Ctrl+1   | Go to Dashboard |
| Ctrl+2   | Go to Projects  |
| Ctrl+3   | Go to Invoicing |
| Ctrl+4   | Go to Safety    |
| Ctrl+K   | Global Search   |
| Ctrl+B   | Toggle Sidebar  |
| Shift+?  | Show Shortcuts  |

## Security

- **File uploads**: Path traversal prevention via `path.normalize()` + `startsWith(dir + path.sep)`; magic number validation.
- **SQL injection**: Column whitelists (`ALLOWED_COLUMNS`) in generic CRUD routes.
- **Multi-tenancy**: `organization_id` filtering on all operations.
- **OAuth**: CSRF state with 10-min expiry; rate limiting on callback (10 req/15 min).
- **XSS**: Middleware enabled on POST/PUT routes.
- **bcrypt**: 12 rounds for password hashing.
- **IDOR Prevention**: Unauthorized resource requests return `404 Not Found` instead of `403 Forbidden`.

## Production Deployment

**VPS**: `root@72.62.132.43`

Docker containers (managed via `docker run`, not docker-compose):
- `cortexbuild-api` (port 3001)
- `cortexbuild-db` (PostgreSQL 5432)
- `cortexbuild-redis` (6379)
- `cortexbuild-ollama` (11434)
- `cortexbuild-prometheus` (9090)
- `cortexbuild-grafana` (3002)

**⚠️ docker-compose v1.29.2 is broken on this VPS.** Never run `docker-compose up` — it takes down DB/Redis/Ollama containers. Use direct `docker run` commands.

**Frontend** syncs via `./deploy/sync-code.sh` (rsync dist/ to VPS).

**API updates** — safe restart workflow:

```bash
docker build -f Dockerfile.api -t cortexbuild-ultimate-api:latest .
docker stop cortexbuild-api && docker rm cortexbuild-api
docker run -d --name cortexbuild-api --restart always \
  --network cortexbuild-ultimate_cortexbuild \
  -p 127.0.0.1:3001:3001 \
  -v /path/to/uploads:/app/uploads \
  -e DB_HOST=cortexbuild-db \
  -e DB_PORT=5432 \
  -e DB_NAME=cortexbuild \
  -e DB_USER=cortexbuild \
  -e DB_PASSWORD=<password> \
  -e JWT_SECRET=<secret> \
  -e PORT=3001 \
  -e NODE_ENV=production \
  -e CORS_ORIGIN=https://www.cortexbuildpro.com \
  -e FRONTEND_URL=https://www.cortexbuildpro.com \
  -e OLLAMA_HOST=http://cortexbuild-ollama:11434 \
  -e OLLAMA_MODEL=qwen3.5:latest \
  -e GOOGLE_CLIENT_ID=<id> \
  -e GOOGLE_CLIENT_SECRET=<secret> \
  -e GOOGLE_CALLBACK_URL=https://www.cortexbuildpro.com/api/auth/google/callback \
  -e REDIS_URL=redis://cortexbuild-redis:6379 \
  cortexbuild-ultimate-api:latest
```

**Nginx** runs on the host machine (not Docker) and handles SSL on ports 80/443.

If DB/Redis/Ollama containers go down:

```bash
docker start <container_id_or_name>
docker start 0ebd917a60e4_cortexbuild-db 1686e7f94afe_cortexbuild-ollama
docker start cortexbuild-redis
```

## Observability

- **Grafana** — Metrics dashboards (port 3002)
- **Prometheus** — Alerting and metrics collection (port 9090)
- **Sentry** — Error tracking
- OpenTelemetry for distributed tracing

## Common Issues

- **`ECONNREFUSED` on auth routes**: `DB_HOST=localhost` inside Docker — must be `cortexbuild-db`.
- **`server/lib/bootstrap-tenant.js` INSERT failures**: Schema drift — INSERT columns must match actual DB schema (verify with `psql -c "\d organizations"` and `psql -c "\d companies"`).
- **Microsoft OAuth crash**: `MICROSOFT_CLIENT_ID` is empty — both `/microsoft` and `/microsoft/callback` routes must be guarded.
- **Mock hoisting**: `vi.mock()` calls in Vitest must be at module top level, not inside `beforeEach()`.
- **Server is CommonJS**: `server/` uses `require()`/`module.exports`, not ESM `import`/`export`.
- **ESM root**: Root package is ESM (`"type": "module"`).
