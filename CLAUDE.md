# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CortexBuild Ultimate is an AI-Powered Unified Construction Management Platform for UK contractors. It combines 50+ construction modules with AI agents into a single enterprise SaaS platform.

**Stack**: React + TypeScript + Vite (frontend) / Express.js + PostgreSQL (backend, no ORM at runtime) / Zustand (state) / WebSocket (real-time)

> Note: `prisma/` contains schema definitions for reference, but the live backend uses raw SQL via `pg` pool — not Prisma at runtime.

## Commands

### Frontend
```bash
cd /root/cortexbuild-work
npm install
npm run dev              # Dev server on http://localhost:5173
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

### Backend
```bash
cd /root/cortexbuild-work/server
npm install
npm run dev              # nodemon auto-reload on port 3001
npm start                # Production (plain node)
```

### PM2 (production)
```bash
pm2 list                                        # Check running processes
pm2 restart cortexbuild-api --update-env        # Restart after env changes
pm2 logs cortexbuild-api                        # Tail logs
```

### Database Migrations
```bash
# Run in order — migrations are plain SQL files, not managed by Prisma
psql -d cortexbuild -f server/migrations/001_add_audit_log.sql
# ... see server/migrations/ for full list
```

## Architecture

### Backend: Generic CRUD Router
`server/routes/generic.js` exports a `makeRouter(tableName)` factory used for all standard entities. It provides GET/POST/PUT/DELETE with:
- Column-name injection prevention via per-table `ALLOWED_COLUMNS` whitelist
- Order-by limited to `VALID_ORDER_COLS` set
- Automatic audit logging on mutations
- WebSocket broadcast on dashboard-relevant changes

**Adding a new table route requires two steps:**
1. Add the table's allowed columns to `ALLOWED_COLUMNS` in `generic.js`
2. Register `app.use('/api/your-table', makeRouter('your_table'))` in `server/index.js`

### Specialized Backend Routes
Beyond the generic router, these handle domain-specific logic:
- `routes/auth.js` — JWT login/register (bcrypt passwords)
- `routes/ai.js` — Ollama AI integration (streaming)
- `routes/ai-conversations.js` — Chat history persistence
- `routes/files.js` / `routes/upload.js` — Multer file uploads to `server/uploads/`
- `routes/email.js` — Nodemailer + SendGrid with rate limiting
- `routes/search.js` — Global cross-table search
- `routes/audit.js` — Audit log reads
- `routes/permissions.js` — RBAC custom roles
- `routes/financial-reports.js`, `routes/analytics-data.js`, etc. — aggregated data endpoints
- `routes/metrics.js` — Health metrics (**excluded from JWT auth**)

### Authentication
All `/api/*` routes require JWT Bearer token **except** `/api/auth/*`, `/api/health`, `/api/deploy`, and `/api/metrics`. The middleware is `server/middleware/auth.js`. RBAC roles: `super_admin`, `company_owner`, `admin`, `project_manager`, `field_worker`.

### Frontend Module System
`src/App.tsx` lazy-loads 50+ modules via `React.lazy()`. The sidebar nav maps to module components in `src/components/` and `src/pages/` (or equivalent).

### State Management
Zustand stores in `src/lib/store/` — key stores: `useAuthStore` (JWT token + user), `useAppStore` (UI state). No Redux.

### Real-time
WebSocket server runs alongside Express in `server/index.js` (`/ws` endpoint via `server/lib/websocket.js`). Broadcast helper at `server/lib/ws-broadcast.js` pushes dashboard updates after mutations.

### AI Features
AI routes use **local Ollama** only — no external AI API calls. The `routes/ai.js` streams Ollama completions. External AI provider configs in `ARCHITECTURE.md` are aspirational, not implemented.

## Environment

### Backend (`server/.env`)
```
DB_PASSWORD=<required — server refuses to start without this>
DB_HOST=127.0.0.1          # Must be IP, not 'localhost', for TCP (not Unix socket)
DB_NAME=cortexbuild
DB_USER=cortexbuild
DB_PORT=5432
JWT_SECRET=<your-secret>
PORT=3001
CORS_ORIGIN=http://localhost:5173   # Required — CORS denies all if unset
REDIS_URL=redis://localhost:6379    # Optional, used for pub/sub
```

### Frontend (`.env.local`)
```
VITE_API_BASE_URL=http://localhost:3001
```

### PostgreSQL Auth
pg_hba.conf must use `md5` (not `scram-sha-256`) for node-postgres compatibility. Always set password with `password_encryption='md5'` in the same session. After editing pg_hba.conf: `chown postgres:postgres /etc/postgresql/16/main/pg_hba.conf`.

## Design System

Dark industrial theme using CSS variables:
- `--slate-*` — backgrounds, surfaces
- `--amber-*` — accents, highlights
- `--emerald-*` — success states
- `--red-*` — errors, danger
- `--cyan-*` — info states

## Key Files

| Path | Purpose |
|------|---------|
| `src/App.tsx` | Main router with lazy-loaded modules |
| `src/services/api.ts` | API client with JWT handling |
| `src/lib/store/` | Zustand state stores |
| `server/index.js` | Express + WebSocket entry point, all route registrations |
| `server/routes/generic.js` | Generic CRUD factory + ALLOWED_COLUMNS whitelist |
| `server/db.js` | PostgreSQL connection pool (requires DB_PASSWORD) |
| `server/middleware/auth.js` | JWT verification middleware |
| `server/lib/websocket.js` | WebSocket init + message routing |
| `server/lib/ws-broadcast.js` | Broadcast helper for real-time updates |
| `prisma/schema.prisma` | Schema reference (85+ models, not used at runtime) |
| `server/migrations/` | Ordered SQL migration files |
