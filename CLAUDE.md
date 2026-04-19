# Project North Star: CortexBuild Ultimate

## High-Level Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS (DaisyUI).
- **Backend**: Express.js, PostgreSQL 16 (PgVector), Redis 7.
- **AI Layer**: Hybrid Local/Remote (Ollama $\leftrightarrow$ OpenRouter).
- **Deploy**: Dockerized API, Nginx Reverse Proxy, GitHub Actions CI/CD.

## Core Conventions

- **Persistence**: `SESSION.md` for handoffs, `CLAUDE.md` for project rules.
- **Build**: `scripts/build.py` $\rightarrow$ `npm run build` $\rightarrow$ `dist/`.
- **Style**: Layered development (Data $\rightarrow$ API $\rightarrow$ UI).

## Hard-Learned Lessons

- **Build Tooling**: Never rely on global `tsc`. Always use `npm run typecheck`.
- **Vite Dist**: Do not recursive-copy `dist/` folders; verify existence after build.
- **Docker**: Do not use `docker-compose up` on VPS; use `docker start` and specific deploy scripts.
- **Database**: Handle `organization_id = NULL` for company owners using `COALESCE`.
- **Server Env**: Loading `.env` from `server/` subdirectory, not project root.
