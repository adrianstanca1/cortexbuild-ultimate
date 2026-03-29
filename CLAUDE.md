# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CortexBuild Ultimate is an AI-Powered Unified Construction Management Platform for UK contractors. It combines 50+ construction modules with AI agents into a single enterprise SaaS platform.

**Stack**: React + TypeScript + Vite (frontend) / Express.js + PostgreSQL + Prisma (backend) / Zustand (state) / WebSocket (real-time)

## Commands

### Frontend
```bash
cd /root/cortexbuild-work
npm install
npm run dev              # Dev server on http://localhost:5173
npm run build            # Production build → dist/
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix ESLint
npm run test             # Run Vitest tests
npm run test:coverage    # Coverage report
```

### Backend
```bash
cd /root/cortexbuild-work/server
npm install
npm run dev              # nodemon auto-reload on port 3001
npm start                # Production
```

### Docker (full stack with PostgreSQL, Redis, Ollama)
```bash
cd /root/cortexbuild-work
docker-compose up -d     # Starts all services
docker-compose down      # Stop services
```

### Database Migrations
```bash
psql -d cortexbuild -f server/migrations/001_add_audit_log.sql
psql -d cortexbuild -f server/migrations/002_add_email_tables.sql
# ... see server/migrations/ for all migrations
```

## Architecture

### Frontend Module System
The app uses **lazy loading** for 50+ modules defined in `src/App.tsx`. Each module is a React component loaded via `React.lazy()`:

- **Core**: Dashboard, Projects, Invoicing, Accounting, FinancialReports, Procurement
- **Operations**: Safety, Teams, Tenders, SiteOperations, PlantEquipment, Materials, Timesheets, Subcontractors, DailyReports
- **Quality**: RAMS, CIS, Inspections, RiskRegister, PunchList, RFIs, ChangeOrders
- **Intelligence**: AIAssistant, Analytics, Insights, ExecutiveReports, PredictiveAnalytics
- **Collaboration**: Documents, Meetings, Drawings, Calendar, CRM

### Backend Route Architecture
The backend uses a **generic CRUD router** factory (`makeRouter`) for standard entities plus specialized routers:
- `routes/auth.js` — JWT login/register
- `routes/files.js` — Multer file uploads
- `routes/ai.js` — Ollama AI integration
- `routes/email.js` — Nodemailer + SendGrid
- `routes/search.js` — Global search
- `routes/audit.js` — Audit log
- `routes/permissions.js` — RBAC

All `/api/*` routes require JWT authentication.

### AI Agents System
Located in `/root/cortexbuild-work/agents/` and `/root/cortexbuild-work/.agents/`:
- **Main agents**: project-analyzer, financial-agent, quality-agent, safety-compliance, schedule-agent, document-processor
- **TypeScript agents**: safety-agent.ts, rfi-analyzer.ts, daily-report-agent.ts, change-order-agent.ts
- **Orchestrator**: `.agents/orchestrator.js` coordinates agent execution
- **Agent config**: `.agents/agents/*.agent.js` — each defines instructions, tools, and subagents

### Database Schema
Prisma schemas in `prisma/` define 85+ models covering the full construction domain. The app uses raw SQL migrations in `server/migrations/` for production.

### State Management
Zustand stores in `src/lib/store/` manage UI state. Key stores: `useAuthStore`, `useAppStore`. No Redux.

### Real-time Architecture
WebSocket server runs alongside Express in `server/index.js`. Clients connect at `/ws` for:
- Notification push
- Live collaboration events
- AI agent progress streaming

### API Communication
Frontend proxies `/api` and `/ws` to backend via Vite config. API base: `VITE_API_BASE_URL` (default `http://localhost:3001`).

## Environment Setup

**Frontend** (`.env.local`):
```
VITE_API_BASE_URL=http://localhost:3001
```

**Backend** (`.env`):
```
DATABASE_URL=postgresql://user:pass@localhost:5432/cortexbuild
JWT_SECRET=your-secret
PORT=3001
REDIS_URL=redis://localhost:6379
```

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
| `server/index.js` | Express + WebSocket entry point |
| `server/routes/` | API route handlers |
| `server/db.js` | PostgreSQL connection pool |
| `prisma/schema.prisma` | Core data models |
| `agents/` | AI agent implementations |

## Testing

Tests use Vitest. Place test files in `src/test/` or alongside components with `.test.ts`/`.test.tsx` suffix.

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```
