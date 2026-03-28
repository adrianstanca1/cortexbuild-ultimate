# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CortexBuild Ultimate is an AI-Powered Unified Construction Management Platform for UK Contractors. The codebase is split into two parts:
- **Frontend**: React + TypeScript + Vite (port 5173)
- **Backend**: Express.js + PostgreSQL (port 3001)

## Key Commands

### Frontend (in `/root/cortexbuild-work`)
```bash
npm install              # Install frontend dependencies
npm run dev              # Start Vite dev server on http://localhost:5173
npm run build            # Production build to dist/
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix ESLint issues
npm run test             # Run Vitest tests
npm run test:watch       # Watch mode for tests
```

### Backend (in `/root/cortexbuild-work/server`)
```bash
cd server && npm install  # Install backend dependencies
npm run dev               # Start with nodemon (auto-reload)
npm start                 # Start production server
```

### Database Migrations
```bash
psql -d cortexbuild -f server/migrations/001_add_audit_log.sql
psql -d cortexbuild -f server/migrations/002_add_email_tables.sql
psql -d cortexbuild -f server/migrations/003_add_report_templates.sql
psql -d cortexbuild -f server/migrations/004_add_permissions.sql
```

## Architecture

### Frontend Structure (`src/`)
- `App.tsx` - Main application component with routing
- `components/` - Reusable UI components
- `context/` - React context providers (auth, etc.)
- `hooks/` - Custom React hooks
- `lib/` - Utility functions
- `services/` - API service layer
- `types/` - TypeScript type definitions
- `index.css` - Global styles with CSS variables

### Backend Structure (`server/`)
- `index.js` - Express server entry point with WebSocket
- `db.js` - PostgreSQL connection pool
- `middleware/` - Auth, error handling middleware
- `routes/` - Express route handlers
- `migrations/` - SQL schema migrations
- `uploads/` - File upload storage

### State Management
Frontend uses Zustand for global state (no Redux).

### API Communication
Frontend communicates via `services/api.ts` → backend at `VITE_API_BASE_URL` (default: `http://localhost:3001`). All routes require JWT token.

## Environment Configuration

Copy `.env.example` to `.env.local` for frontend:
```
VITE_API_BASE_URL=http://localhost:3001
```

Copy `.env.example` to `.env` for backend:
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PORT=3001
```

## Testing

Vitest is configured at project root. Tests live in `src/test/` or alongside components with `.test.ts`/`.test.tsx` suffix.

## Design System

Uses custom CSS variables for dark industrial theme:
- `--slate-*` - Backgrounds and text
- `--amber-*` - Accents and highlights
- `--emerald-*` - Success states
- `--red-*` - Error/danger states
