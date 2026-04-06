# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
CortexBuild Ultimate is an AI-Powered Unified Construction Management Platform for UK contractors. It is an enterprise SaaS platform combining 50+ construction modules with an AI agent system.

**Stack**: React 19 + TypeScript + Vite (frontend) / Express.js + PostgreSQL (backend, raw SQL via `pg` pool) / Zustand (state) / WebSocket (real-time)

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
Migrations are plain SQL files under `server/migrations/`.
```bash
psql "$DATABASE_URL" -f server/migrations/XXX_description.sql
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
- `routes/auth.js`: JWT login/register (bcrypt).
- `routes/oauth.js`: Google/Microsoft OAuth (Passport).
- `routes/ai.js`: Ollama AI streaming and intent handling.
- `routes/rag.js`: Vector similarity search via `pg_vector` for context injection.
- `routes/bim-models.js`: BIM file upload, metadata extraction (`IfcAPI`), and clash detection.

### Authentication & Multi-tenancy
- **JWT**: Required on all `/api/*` except auth, health, and deploy.
- **Multi-tenancy**: Strict isolation using `organization_id` and `company_id` filters in all SQL queries.
- **RBAC**: Roles include `super_admin`, `company_owner`, `admin`, `project_manager`, `field_worker`.

### AI Features
- Local Ollama only. Intent classifiers in `server/routes/ai-intents/` for natural language queries.
- RAG (Retrieval-Augmented Generation) using `rag_embeddings` table and cosine similarity.

## Key Files
- `src/App.tsx`: Main router (50+ lazy modules).
- `src/hooks/useData.ts`: `makeHooks` factory for CRUD hooks.
- `server/routes/generic.js`: CRUD factory + column whitelist.
- `server/db.js`: PostgreSQL pool.
- `server/index.js`: Express app entry + route registration.
- `BIM_ARCHITECTURE.md`: Specification for 3D rendering and coordinate systems.

## Security
- **File uploads**: Path traversal prevention via `path.normalize()` + `startsWith(dir + path.sep)`; magic number validation.
- **SQL injection**: Column whitelists in generic CRUD routes.
- **IDOR Prevention**: All resource access is scoped by `organization_id` or `company_id`.
- **Resource Enumeration**: Unauthorized resource requests return `404 Not Found` instead of `403 Forbidden`.

## Production Deployment
- **VPS**: `root@72.62.132.43`
- **Docker containers**: `cortexbuild-api`, `cortexbuild-db`, `cortexbuild-redis`, `cortexbuild-nginx`, `cortexbuild-ollama`, `cortexbuild-prometheus`, `cortexbuild-grafana`.
- **Frontend**: Syncs via `./deploy/sync-code.sh` (rsync dist/ to VPS).
- **API**: Updated via `deploy/vps-sync.sh`.
