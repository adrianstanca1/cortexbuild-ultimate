---
name: cortexbuild-patterns
description: Coding patterns from cortexbuild-ultimate
version: 1.0.0
source: local-git-analysis
analyzed_commits: 100
---

# CortexBuild Ultimate Patterns

## Commit Conventions

Uses **conventional commits** with scope:
- `feat:` — New features (26 commits)
- `fix:` — Bug fixes (20 commits)
- `chore:` — Maintenance, deps, config (18 commits)
- `feat(ui):`, `feat(ai):` — Scoped features
- `fix(nginx):`, `fix(server):`, `fix(hooks):` — Scoped fixes
- `ci:` — CI/CD changes
- `docs:` — Documentation

Format: `<type>(<scope>): <description>`

## Code Architecture

```
src/
├── components/
│   ├── modules/     # 50+ lazy-loaded page modules (PascalCase.tsx)
│   ├── layout/     # Header, Sidebar, etc.
│   ├── dashboard/ # Dashboard widgets
│   ├── forms/      # Reusable form components
│   ├── auth/       # Login, auth pages
│   └── ui/         # Shared UI (BulkActions, Charts, Skeleton, etc.)
├── hooks/           # Custom hooks (use*.ts) — data hooks + useToast, usePWA, useNotifications
├── lib/
│   ├── agents/     # AI agents (change-order-agent, rfi-analyzer, safety-agent)
│   ├── api.ts      # API client with JWT handling
│   ├── eventBus.ts # Event bus for cross-module communication
│   └── validations.ts
├── services/        # API service layer (api.ts, ai.ts)
├── types/           # TypeScript types
└── context/         # React context (auth, app)

server/
├── routes/          # 28+ Express route files (generic CRUD + specialized)
├── middleware/      # Auth, error handling
├── migrations/      # SQL migrations
└── db.js            # PostgreSQL connection pool
```

## Module System

- 50+ modules lazy-loaded via `React.lazy()` in `App.tsx`
- Modules are self-contained with their own state, forms, and API calls
- Pattern: each module imports data hooks and uses them directly
- Modules follow consistent layout: header with stats, table with bulk actions, modals

## Data Hooks

Custom `useData.ts` factory pattern using `makeHooks(name, table, api)`:
- Generates `use<Data>` hooks from generic CRUD operations
- All API calls go through service layer
- Error handling via `useToast` (console.error + toast notifications)

## Backend Patterns

- **Generic CRUD router** (`server/routes/generic.js`) — factory for all standard entities
- Per-table `ALLOWED_COLUMNS` whitelist prevents column injection
- `order-by` limited to `VALID_ORDER_COLS`
- Automatic audit logging on mutations
- WebSocket broadcast after dashboard-relevant changes
- WebSocket at `/ws` endpoint

## Testing Patterns

- Vitest with jsdom environment
- Test files: `src/test/*.test.ts` or `*.test.tsx` alongside components
- Setup in `src/test/setup.ts`

## Workflows

### Adding a New Module
1. Create `src/components/modules/ModuleName.tsx`
2. Add data hook to `src/hooks/useData.ts` if needed
3. Register in `src/App.tsx` via `React.lazy()`
4. Add sidebar navigation entry

### Adding a New Backend Route
1. If generic CRUD: add table to `ALLOWED_COLUMNS` in `generic.js` and register in `server/index.js`
2. If specialized: create `server/routes/<name>.js` with domain logic

### Error Handling Pattern
```ts
.catch((err) => {
  console.error('Failed to load X:', err);
  // toast.error('Failed to load X'); // use toast if module imports it
})
```

## Environment

- Frontend: `VITE_API_BASE_URL` → `http://localhost:3001` in dev
- Backend: `DB_PASSWORD` required, `JWT_SECRET`, `CORS_ORIGIN`
- PostgreSQL: uses `md5` auth (not `scram-sha-256`)
