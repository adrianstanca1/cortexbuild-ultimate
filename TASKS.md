# Tasks

## Active

- [ ] **Settings persistence** — wire up company and users endpoints so Settings writes persist
  - Source: `docs/PLATFORM_SPEC.md` Phase 1
- [ ] **Teams sub-tabs UI** — Skills / Inductions / Availability tabs inside Teams module
  - Source: `docs/PLATFORM_SPEC.md` Phase 1
- [ ] **Zod request validation on critical endpoints** — add Zod schemas to sensitive routes
  - Source: `docs/PLATFORM_SPEC.md` Phase 1
- [ ] **Error message sanitization in generic routes** — stop leaking internals from `server/routes/generic.js`
  - Source: `docs/PLATFORM_SPEC.md` Phase 1
- [ ] **Progressive account lockout** — throttle repeated auth failures
  - Source: `docs/PLATFORM_SPEC.md` Phase 1
- [ ] **Finish 2026-04-04 codebase-errors plan** — close out the superpowers plan
  - Plan file: `docs/superpowers/plans/2026-04-04-fix-codebase-errors.md`
  - Task 1: Git hygiene — conflict markers
  - Task 2: Type `fetchAll` results as `Row` in the API client
  - Task 3: Bind `makeHooks` to `Row`
  - Task 4: Fix `RecentProjects` row narrowing
  - Task 5: Fix `Dashboard.tsx` live-intel mappers + safety filters (RFITimeline, TaskList, AIAvatar, SafetyStats)
  - Task 6: Replace orphaned `validation.test.ts` with smoke tests aligned to `validations.ts`
  - Task 7: Update `docs/QUICK_REFERENCE.md` — remove historical imports to deleted `src/lib` files
  - Task 8: ESLint — clear warnings in `src/` (zero-warnings strict gate)
  - Task 9: Production build (`npm run build`)
  - Task 10: Playwright E2E — run + fix failures
  - Task 11: Server syntax check (entry file)
  - Task 12: Final verification matrix — `tsc --noEmit` + ESLint + tests + build

## Waiting On

## Someday

<!-- Deferred features from docs/PLATFORM_SPEC.md — promote to Active when ready -->

- [ ] **MFA (TOTP)**
- [ ] **Workflow automation engine** — visual builder
- [ ] **Stripe billing integration**
- [ ] **Procore / QuickBooks / Slack integrations** — wire up the pre-built framework
- [ ] **Drawing revision tracking** — `drawing_revisions` table + UI
- [ ] **Offline-first PWA for field apps**
- [ ] **Timeline / cost prediction ML models**
- [ ] **Document OCR pipeline**
- [ ] **Image defect detection**
- [ ] **API gateway with key management**

## Done
