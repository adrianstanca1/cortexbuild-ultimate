# Memory (durable facts)

## This repository (`cortexbuild-ultimate`)

- **Path:** `/Users/adrianstanca/cortexbuild-ultimate`
- **Stack:** Vite + TypeScript (`src/`), ESLint on `.ts`/`.tsx`; **Vitest** (unit), **Playwright** (e2e); **`server/`** is its own npm workspace (`npm run` from root delegates with `server:*` / `db:*` scripts).
- **Hooks:** Husky + lint-staged + route verification + **`pre-commit-check.sh`** — expect **tens of seconds** per commit on `main`.

### Verification (pick narrowest match)

- **`npm run typecheck`** — TS only.
- **`npm run lint`** — ESLint when only style/static issues expected.
- **`npm test`** — Vitest unit suite (`NODE_ENV=test vitest run`).
- **`npm run check`** — `typecheck` + `lint` + `test`.
- **`npm run verify`** / **`npm run verify:all`** — heavier gates (routes + pre-commit bundle); use when touching routes, server integration, or release-sensitive areas.

### Commits

- Subjects must match **Conventional Commits**: `type(scope): description` with **lowercase** description (enforced by **commit-msg** hook).

## Machine-wide context

Cross-machine bullets live in **`~/.cursor/skills/local-handbook/memory.md`**.

## Anti-patterns (repo + global)

- Broad coupled changes across **`src/`** and **`server/`** without explicit scope.
- Committing SendGrid or other third-party secrets; follow existing env patterns.
- Claiming **`check`** / **`verify`** passed without running them in this session.
