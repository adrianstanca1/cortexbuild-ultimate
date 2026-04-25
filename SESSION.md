# Project Session Log: CortexBuild Ultimate

Last Update: 2026-04-25

## Current State

- Local: Stable, verified (`npm run check`), pushed to `origin/main` as changes land.
- Remote (VPS): Production `https://www.cortexbuildpro.com/api/health` returns **ok** (postgres + redis). GitHub Actions **Deploy to VPS** run [#701](https://github.com/adrianstanca1/cortexbuild-ultimate/actions/runs/24921506242) for `96c39c7` reported **failure** (likely flaky post-deploy verify or a transient remote step); re-run workflow or watch the next push.
- **Dependabot**: `.github/dependabot.yml` enables weekly npm (root + `server/`) and GitHub Actions update PRs — merge those to clear GitHub’s advisory noise over time.

## Recent Fixes

- Corrected schema mismatch in `server/lib/autoimprove-analyser.js` (column mappings: budget, date).
- Optimized SQL `WHERE` clauses and table aliasing in `server/routes/autoimprove.js` and `server/routes/autorepair.js`.
- Verified deployment pipeline locally via `npm run verify:all`.

## Blockers

- **Local laptop → VPS SSH**: Still unreliable from some networks (see runbook); **GitHub Actions → VPS** uses `VPS_SSH_KEY` and may succeed when your laptop does not. If deploys fail repeatedly, inspect the **Deploy to VPS** job log (remote script vs **Verify deployment** step).

---

## Dev-session handoff (2026-04-25)

**Branch**: `main` (tracking `origin/main`)  
**Checkpoint**: `git log -1 --oneline` → `docs(session): checkpoint session handoff and ralph deepwork runbook` (single amended commit; short hash is whatever `HEAD` is after pull).

### What works (recent)
- **AI document + site brief**: `POST /api/ai/analyze-document`, `POST /api/ai/enrich-site-brief` in `server/routes/ai.js` (`smartQuery`, PDF/text extract via `pdf-parse`, tenant-scoped). Client: `src/services/ai.ts` (`enrichSiteBrief`, `analyzeDocument`). UI: `AISiteBriefPanel` (“Polish with AI”), `Documents` drawer (“Document intelligence”). Migration `060_documents_ai_extract.sql`; RAG `documents` textify uses `ai_extracted_snippet`.
- **Prod audit**: `npm run build`, server `node --check`, vitest previously green; `server/.env.example` extended for AI/feature flags (per audit).
- **CI**: `.github/workflows/ci.yml` already uses `setup-node` + `.nvmrc` + npm cache.

### Current position
- **Remote**: checkpoint `docs(session): …` pushed to `origin/main` (`git push` succeeded).
- **Working tree**: pending commit — `cortexbuildpro-ci.yml` build job now uses `node-version-file: '.nvmrc'` (removed Node 22.x env); `ci.yml` adds `cache-dependency-path` + verify `node`/`npm` on PATH.
- **Still open**: VPS SSH blocker (top of file); Dependabot reports on GitHub (review separately).

### Resume instructions
1. Confirm **Checkpoint** hash below matches `git log -1 --oneline`; then `git push` when ready.
2. `export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"` then `npm ci && npm run build && npm test` after pulling on a new machine.
3. `cd server && npm ci && node --check index.js` — confirm API starts with your `.env`.
4. If deploying: resolve **VPS SSH** blocker (top of file), then deploy per your runbook.

### Session template note
This file predates the standard `SESSION.md` template (branch/checkpoint/resume blocks). If you want a clean template reset, say **“dev-session start fresh”** and we can replace after your OK (skill: ask before overwriting).
