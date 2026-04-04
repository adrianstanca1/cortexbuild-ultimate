# Design: Full repo error and conflict sweep

**Date:** 2026-04-04  
**Status:** Approved (brainstorming gate passed)  
**Scope option:** C — full repository sweep

## 1. Purpose

Establish a single, repeatable definition of “healthy” for the CortexBuild Ultimate monorepo and execute fixes so tooling, types, tests, and documentation align. This spec records **what** must be true before implementation planning; implementation follows the **writing-plans** skill.

## 2. Definition of done

| Layer | Command / check | Pass criteria |
|--------|-------------------|---------------|
| TypeScript | `npx tsc --noEmit` | Zero errors |
| Build | `npm run build` (`tsc -b && vite build`) | Success |
| ESLint | `npx eslint src --ext .ts,.tsx` | Zero **errors**; target **zero warnings** for this sweep (CI `deploy.yml` uses `--quiet` for errors-only — we still clear warnings unless listed under Deferred) |
| Unit tests | `npm test` | All pass |
| E2E | `npm run test:e2e` | All pass, or explicit skip with reason in §7 Deferred |
| Server (syntax) | `node --check` on primary entry (e.g. `server/index.js`) | No syntax errors |
| Git | `git status`, grep for conflict markers | No `<<<<<<<` / `=======` / `>>>>>>>` in tracked files; merge conflicts resolved or documented |

## 3. Known issues (inventory baseline)

- **TS2349 / hook shape:** `makeHooks` (or equivalent) returns an object `{ useList, useCreate, … }` but some dashboard code **calls** the return value as a function. Affected areas include `QuickStats.tsx`, `RecentProjects.tsx`, `Dashboard.tsx`.
- **TS7006:** Implicit `any` on callbacks in the same dashboard files.
- **ESLint:** Dozens of warnings (unused vars/imports, `no-explicit-any` in tests) when warnings are not suppressed.
- **Deleted `src/lib` modules:** `aiSearch.ts`, `integrations.ts`, `validation.ts`, `workflowEngine.ts` removed from tree; **`src/test/validation.test.ts`** still imports `../lib/validation` — must be rewritten or removed.
- **Docs drift:** `docs/QUICK_REFERENCE.md` references removed lib paths — update or mark as historical.

## 4. Execution order (implementation plan input)

1. **Git hygiene** — Confirm branch, resolve conflict markers if present; avoid mixing unrelated feature work in the same commit series if possible.
2. **Shared / hooks layer** — Fix typing and usage contract in `src/hooks/useData.ts` (and related helpers) so consumers use **one** pattern consistently.
3. **Components** — Update dashboard and any other files until `tsc` is clean.
4. **Tests** — Fix or delete broken tests (`validation.test.ts`); ensure `npm test` passes.
5. **ESLint** — Clear warnings in `src/` (prefix unused with `_` or remove; replace `any` where trivial).
6. **Production build** — `npm run build`.
7. **Playwright** — Fix failures (env, selectors, timing); document environment prerequisites if failures are infra-related.
8. **Server** — `node --check` on agreed entrypoints; fix syntax issues only in this sweep unless a bug blocks checks.
9. **Final verification** — Re-run §2 table; update §7 Deferred for anything intentionally left open.

## 5. Architecture / constraints

- **No scope expansion:** Unrelated refactors (large UI rewrites, new features) are out of scope; park under Deferred.
- **Follow existing patterns:** Prefer matching established hook and API patterns in `src/hooks/useData.ts` and `server/routes/generic.js` conventions.
- **Docs:** Keep `CLAUDE.md` / `AGENTS.md` accurate only if this sweep touches areas they describe; otherwise defer doc updates to a follow-up unless required to unblock developers.

## 6. Risks

| Risk | Mitigation |
|------|------------|
| E2E requires DB/API/browser setup | Document required env and `playwright.config` assumptions in Deferred if tests cannot run headless in CI-like conditions |
| Flaky E2E | Prefer stable selectors; avoid blanket `test.skip` without reason in spec |
| Server has no root ESLint for `.js` | Use `node --check` for this sweep; full server lint policy is Deferred |

## 7. Deferred (explicit exceptions)

Items listed here are **not** required for “done” unless promoted during implementation:

- Comprehensive ESLint coverage for `server/**/*.js` (unless already configured).
- Recovery scripts that intentionally use permissive SSH (e.g. `StrictHostKeyChecking=no`).
- Restoring full functionality of deleted libs if product decision was to remove features — tests/docs must still be consistent.

## 8. Next step

Invoke the **writing-plans** skill to produce a step-by-step implementation plan with file-level tasks and verification checkpoints after each layer.

## 9. Spec self-review (2026-04-04)

- **Placeholders:** None; dates and paths are concrete.
- **Consistency:** §2 and §4 align; §3 issues map to §4 order.
- **Scope:** Single cohesive sweep; §7 bounds deferrals.
- **Ambiguity:** “Target zero ESLint warnings” — if volume is extreme, implementation plan may propose a phased warning cleanup with first PR = errors + tsc + tests, second = warnings; that split must be recorded in the implementation plan, not silently assumed.
