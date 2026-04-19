# Memory (durable facts)

## This repository (`cortexbuild-ultimate`)

- **Path:** `/Users/adrianstanca/cortexbuild-ultimate`
- **Stack:** Vite + TypeScript (`src/`), ESLint on `.ts`/`.tsx`; **Vitest** for unit tests, **Playwright** for e2e; `server/` is a separate npm package (migrate/dev via root `npm run db:*` / `server:dev`).
- **Quality gates:** root scripts include `check` (`typecheck` + `lint` + `test`), `verify`, `verify:all`, `precommit` — prefer the narrowest command that matches the change; **do not claim green** without running the relevant script in this session.

## Machine-wide context

Authoritative cross-repo bullets (macOS, Cursor, Go tools, MCP symlink, global skill dirs, communication defaults) live in:

`~/.cursor/skills/local-handbook/memory.md`

Read that file when OS- or editor-level facts matter.

## Anti-patterns (repo + global)

- Broad refactors across `src/` and `server/` together unless the task explicitly requires it.
- Committing SendGrid or other API keys; use env + server config patterns already in the project.
