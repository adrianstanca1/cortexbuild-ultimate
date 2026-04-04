# Full repo error sweep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the repository pass the definition of done in `docs/superpowers/specs/2026-04-04-fix-codebase-errors-design.md`: clean `tsc`, `eslint` (errors + target zero warnings), `npm test`, `npm run build`, `npm run test:e2e`, `node --check` on the server entry, and no git conflict markers; align tests/docs with removed `src/lib/validation.ts`.

**Architecture:** Fix the **type root cause** first: generic CRUD list endpoints are typed as `unknown[]` because `fetchAll()` is called without a type argument. Export `Row` from `api.ts`, call `fetchAll<Row>(...)`, and bind `makeHooks` to `Row` so React Query returns `Row[]`. Then tighten **Dashboard** and **RecentProjects** mappers (`String(id)`, narrow `assignee`) so child components receive `RFI[]` / `Task[]` as required. Replace the orphaned **validation** test file with tests that target live modules. Clear **ESLint** warnings (prefix `_`, remove unused imports). Finish with **build**, **Playwright**, and **server** syntax check.

**Tech Stack:** TypeScript 5.x, Vite, React 19, TanStack Query, Vitest, Playwright, Express (CommonJS `server/`).

**Spec reference:** `docs/superpowers/specs/2026-04-04-fix-codebase-errors-design.md`

**Phased ESLint (allowed by spec §9):** If warning count blocks progress, complete Phase 1 (tsc + unit tests + build) and commit; Phase 2 = warning cleanup in a follow-up commit. Do not silently split—note in commit message.

---

### Task 1: Git hygiene — conflict markers

**Files:**
- Read-only: entire repo

- [ ] **Step 1: Search for merge conflict markers**

Run:

```bash
cd /Users/adrianstanca/cortexbuild-ultimate
rg '^(<<<<<<<|=======|>>>>>>>)' --glob '!node_modules' --glob '!.git' || true
```

Expected: no matches. If matches exist, resolve in the listed files before continuing.

- [ ] **Step 2: Record branch**

Run: `git status -sb`  
Expected: note current branch (e.g. `main`) for PR description.

- [ ] **Step 3: Commit**

```bash
# Only if you fixed conflicts
git add -A && git commit -m "chore: resolve merge conflict markers"
```

---

### Task 2: Type `fetchAll` results as `Row` in the API client

**Files:**
- Modify: `src/services/api.ts`

- [ ] **Step 1: Export the `Row` alias**

At the top of `api.ts`, change:

```typescript
type Row = Record<string, unknown>;
```

to:

```typescript
export type Row = Record<string, unknown>;
```

- [ ] **Step 2: Type every untyped `fetchAll` call used for list data**

In `src/services/api.ts`, replace calls so the generic is explicit:

- Replace `fetchAll('` with `fetchAll<Row>('` (use editor replace_all).
- Replace `` fetchAll(` `` with `` fetchAll<Row>(` `` (template-literal calls, e.g. `project-tasks`, `project-images`).

Do **not** change calls that already pass a generic (e.g. `apiFetch<Something>`).

- [ ] **Step 3: Verify TypeScript still resolves**

Run: `npx tsc --noEmit 2>&1 | head -40`  
Expected: error set may shrink; remaining errors are in components (next tasks).

- [ ] **Step 4: Commit**

```bash
git add src/services/api.ts && git commit -m "fix(types): parameterize fetchAll with Row for list endpoints"
```

---

### Task 3: Bind `makeHooks` to `Row`

**Files:**
- Modify: `src/hooks/useData.ts`

- [ ] **Step 1: Import `Row` and constrain the factory**

Add import:

```typescript
import type { Row } from '../services/api';
```

Change the factory signature from:

```typescript
function makeHooks<T>(key: string, tableName: string, api: {
  getAll: () => Promise<T[]>;
```

to:

```typescript
function makeHooks<T extends Row = Row>(key: string, tableName: string, api: {
  getAll: () => Promise<T[]>;
```

Keep `useQuery<T[]>` as-is; `T` now defaults to `Row`.

- [ ] **Step 2: Run tsc**

Run: `npx tsc --noEmit`  
Expected: `RecentProjects` / `Dashboard` may still error on property narrowing (next task).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useData.ts && git commit -m "fix(types): default makeHooks rows to Api Row type"
```

---

### Task 4: Fix `RecentProjects` row narrowing

**Files:**
- Modify: `src/components/dashboard/RecentProjects.tsx`

- [ ] **Step 1: Treat list items as `Row` and stringify ids for UI**

Add at top (after imports):

```typescript
import type { Row } from '../../services/api';
```

After `useProjects.useList()`:

```typescript
const { data: projectsRaw, isLoading } = useProjects.useList();
const projects = (projectsRaw ?? []) as Row[];
```

In the `.map((project) =>` callback, use safe coercions, e.g.:

```typescript
const id = String(project.id ?? '');
const name = String(project.name ?? 'Untitled');
const status = String(project.status ?? 'PLANNING');
const client = String(project.client ?? project.company ?? '');
```

Use `id` for `key` and `href`, `name` / `status` / `client` for display. Adjust field names to match your API (`snake_case` keys are camelized by `apiFetch`).

- [ ] **Step 2: Run tsc**

Run: `npx tsc --noEmit`  
Expected: no errors in `RecentProjects.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/RecentProjects.tsx && git commit -m "fix(types): narrow project rows in RecentProjects"
```

---

### Task 5: Fix `Dashboard.tsx` live-intel mappers and safety filters

**Files:**
- Modify: `src/components/modules/Dashboard.tsx`

- [ ] **Step 1: Normalize hook data to `AnyRow[]` at the destructuring site**

Where you have:

```typescript
const { data: safetyIncidents = [] } = useSafety.useList();
const { data: rfis = [] } = useRFIData.useList();
const { data: tasks = [] } = useProjectTasks.useList();
const { data: liveProjects = [] } = useProjectsData.useList();
```

Replace with explicit aliases and casts:

```typescript
const { data: safetyRaw = [] } = useSafety.useList();
const safetyIncidents = safetyRaw as AnyRow[];
const { data: rfisRaw = [] } = useRFIData.useList();
const rfis = rfisRaw as AnyRow[];
const { data: tasksRaw = [] } = useProjectTasks.useList();
const tasks = tasksRaw as AnyRow[];
const { data: liveProjectsRaw = [] } = useProjectsData.useList();
const liveProjects = liveProjectsRaw as AnyRow[];
```

- [ ] **Step 2: Fix `RFITimeline` mapper to satisfy `RFI[]`**

Replace the inline `.map((r: AnyRow) => ({` with a mapper that returns **strings** for `id` and `title`:

```typescript
rfis.slice(0, 5).map((r) => {
  const row = r as AnyRow;
  const statusRaw = String(row.status ?? 'OPEN');
  const status = statusRaw === 'OVERDUE' ? 'OPEN' : statusRaw;
  return {
    id: String(row.id ?? ''),
    number: String(row.number ?? row.rfi_number ?? ''),
    title: String(row.title ?? row.subject ?? ''),
    status: status as 'OPEN' | 'ANSWERED' | 'CLOSED',
    dueDate: row.dueDate ?? row.due_date,
    createdAt: row.createdAt ?? row.created_at,
  };
})
```

- [ ] **Step 3: Fix `TaskList` mapper — `assignee.name`**

```typescript
tasks.slice(0, 6).map((t) => {
  const row = t as AnyRow;
  const assigneeRaw = row.assignee;
  const assigneeObj =
    assigneeRaw && typeof assigneeRaw === 'object' && assigneeRaw !== null
      ? (assigneeRaw as Record<string, unknown>)
      : undefined;
  const assigneeName = assigneeObj && typeof assigneeObj.name === 'string' ? assigneeObj.name : undefined;
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    status: row.status as 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETE' | 'BLOCKED',
    priority: row.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    dueDate: row.dueDate ?? row.due_date,
    assignee: assigneeName ? { name: assigneeName } : undefined,
  };
})
```

- [ ] **Step 4: Fix `AIAvatar` `projectId`**

Change:

```typescript
<AIAvatar projectId={liveProjects[0]?.id} />
```

to:

```typescript
<AIAvatar projectId={liveProjects[0] != null ? String(liveProjects[0].id) : undefined} />
```

(Adjust if `AIAvatar` expects `number`—match its prop type.)

- [ ] **Step 5: Fix `SafetyStats` filters — typed incident rows**

At the top of the file (after `AnyRow`), add:

```typescript
type SafetyRow = AnyRow & { status?: string; severity?: string };
```

Cast once:

```typescript
const safetyList = safetyIncidents as SafetyRow[];
```

Use `safetyList.filter((i) => ...)` in the `SafetyStats` props instead of `safetyIncidents.filter`.

- [ ] **Step 6: Run tsc**

Run: `npx tsc --noEmit`  
Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/modules/Dashboard.tsx && git commit -m "fix(types): normalize dashboard hook data and mappers"
```

---

### Task 6: Replace orphaned `validation.test.ts`

**Files:**
- Delete: `src/test/validation.test.ts`
- Create: `src/test/validations-smoke.test.ts`

- [ ] **Step 1: Delete the old test file**

```bash
rm src/test/validation.test.ts
```

- [ ] **Step 2: Add smoke tests aligned with `validations.ts` + `validateNotification`**

Create `src/test/validations-smoke.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { rfiSchema } from '../lib/validations';
import { validateNotification } from '../lib/validateNotification';

describe('validations smoke', () => {
  it('parses a minimal RFI payload', () => {
    const parsed = rfiSchema.parse({
      number: 'RFI-1',
      subject: 'Clarification',
      question: 'What is the ceiling height?',
    });
    expect(parsed.number).toBe('RFI-1');
    expect(parsed.status).toBe('open');
  });

  it('validateNotification returns null for invalid payload', () => {
    expect(validateNotification({})).toBeNull();
  });
});
```

- [ ] **Step 3: Run unit tests**

Run: `npm test`  
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/test && git commit -m "test: replace removed validation module tests with validations smoke tests"
```

---

### Task 7: Update `docs/QUICK_REFERENCE.md`

**Files:**
- Modify: `docs/QUICK_REFERENCE.md`

- [ ] **Step 1: Remove or mark historical imports to deleted `src/lib` files**

Replace the block that references `./lib/integrations`, `./lib/workflowEngine`, `./lib/aiSearch` with a short note:

```markdown
> **Note:** Legacy examples referencing `integrations`, `workflowEngine`, and `aiSearch` under `src/lib/` are removed. Use `src/services/api.ts`, `src/hooks/useData.ts`, and `src/lib/validations.ts` for current patterns.
```

- [ ] **Step 2: Commit**

```bash
git add docs/QUICK_REFERENCE.md && git commit -m "docs: drop references to removed src/lib helper modules"
```

---

### Task 8: ESLint — clear warnings in `src/`

**Files:**
- Modify: files reported by ESLint (examples from inventory):  
  `src/components/ui/MemoizedComponents.tsx`, `NotificationCenter.tsx`, `ResponsiveGrid.tsx`, `TeamChat.tsx`, `src/components/widgets/DocumentUpdatesWidget.tsx`, `TeamPresenceWidget.tsx`, `src/test/utilities.test.ts`, `src/test/validation.test.ts` (deleted in Task 6 — skip)

- [ ] **Step 1: Run ESLint with zero max warnings (strict gate)**

Run:

```bash
npx eslint src --ext .ts,.tsx --max-warnings 0
```

- [ ] **Step 2: Fix each warning**

- Unused imports: remove or prefix with `_`.
- Unused destructured state: rename to `_setIsTyping` etc.
- `no-explicit-any`: replace with `unknown` + narrow, or a minimal interface.

- [ ] **Step 3: Re-run until clean**

Run: `npx eslint src --ext .ts,.tsx --max-warnings 0`  
Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore(lint): clear eslint warnings in src"
```

---

### Task 9: Production build

**Files:**
- None (verification)

- [ ] **Step 1: Run build**

Run: `npm run build`  
Expected: completes without error; `dist/` updated.

- [ ] **Step 2: Commit** (only if build changed artifacts you track—usually do **not** commit `dist/`)

```bash
# Typically no commit for dist; if only generated output changed, skip commit
```

---

### Task 10: Playwright E2E

**Files:**
- Possibly modify: `playwright.config.ts`, `e2e/**/*.spec.ts` (only if tests fail)

- [ ] **Step 1: Run E2E**

Run: `npm run test:e2e`  
Expected: all green, or document in **Deferred** (spec §7) with exact env missing (e.g. API URL, auth seed).

- [ ] **Step 2: Fix failures**

Prefer stable `getByRole` / `data-testid` selectors; avoid `networkidle` unless necessary.

- [ ] **Step 3: Commit**

```bash
git add e2e playwright.config.ts && git commit -m "test(e2e): stabilize playwright suite for CI" || true
```

---

### Task 11: Server syntax check

**Files:**
- Read-only: `server/index.js` (and entrypoints if you add them)

- [ ] **Step 1: Syntax-check server entry**

Run:

```bash
node --check /Users/adrianstanca/cortexbuild-ultimate/server/index.js
```

Expected: no output, exit code 0.

- [ ] **Step 2: If you changed server JS in this sweep, re-run**

```bash
node --check server/index.js
```

---

### Task 12: Final verification matrix

- [ ] **Step 1: Run full matrix**

```bash
cd /Users/adrianstanca/cortexbuild-ultimate
rg '^(<<<<<<<|=======|>>>>>>>)' --glob '!node_modules' || true
npx tsc --noEmit
npx eslint src --ext .ts,.tsx --max-warnings 0
npm test
npm run build
npm run test:e2e
node --check server/index.js
```

Expected: all succeed per spec. If `test:e2e` cannot run locally, add a **Deferred** bullet to the design doc §7 and note the blocker in the PR.

- [ ] **Step 2: Final commit** (if any doc deferral updates)

```bash
git add docs/superpowers/specs/2026-04-04-fix-codebase-errors-design.md && git commit -m "docs: record deferred e2e/env items for error sweep" || true
```

---

## Plan self-review (author)

| Spec section | Covered by |
|--------------|------------|
| §2 TypeScript / build | Tasks 2–5, 9, 12 |
| §2 ESLint | Task 8 |
| §2 Unit tests | Task 6 |
| §2 E2E | Task 10 |
| §2 Server syntax | Task 11 |
| §2 Git | Task 1, 12 |
| §3 hook / unknown issues | Tasks 2–5 |
| §3 deleted validation | Task 6 |
| §3 docs drift | Task 7 |
| §4 order | Tasks follow spec order |
| §7 Deferred | Task 10 / 12 note for e2e |
| Placeholder scan | No TBD steps; mappers include concrete code |

---

**Plan complete and saved to** `docs/superpowers/plans/2026-04-04-fix-codebase-errors.md`.

**Execution options:**

1. **Subagent-driven (recommended)** — Dispatch a fresh subagent per task; review between tasks.  
2. **Inline execution** — Run tasks in this session with checkpoints between Task groups.

Which approach do you want?
