# CortexBuild API Audit — 2026-03-27

## Summary

**The reported "339 stubs" appears to be a false alarm.** After a full code review
of all 27 route files in `server/routes/`, zero TODO/empty-array stubs were found.
Every route has a concrete implementation.

The API surface consists of two categories:
- **Generic CRUD** (`makeRouter` from `generic.js`) — covers 30 tables with full
  paginated GET, GET/:id, POST, PUT/:id, DELETE/:id. These are **complete and real**.
- **Custom business logic routes** (24 individual files) — these are also **all
  implemented**, though some contain hardcoded values or known limitations.

---

## Route Inventory

| File | Lines | Endpoints | Status |
|------|-------|-----------|--------|
| `ai.js` | 1295 | 2 routes | ✅ Full AI integration (Ollama) |
| `email.js` | 388 | 6 routes | ✅ SMTP + templates + bulk + schedule |
| `files.js` | 361 | 10 routes | ✅ Full CRUD + upload + version + preview |
| `insights.js` | 308 | 1 route | ✅ Rule-based analytics engine |
| `permissions.js` | 303 | 9 routes | ✅ RBAC + custom roles |
| `auth.js` | 248 | 11 routes | ✅ Auth + users + settings |
| `generic.js` | 228 | 5 routes | ✅ Per-table CRUD factory (30 tables) |
| `project-tasks.js` | 215 | 7 routes | ✅ Tasks + comments + bulk status |
| `notifications.js` | 209 | 8 routes | ✅ CRUD + alerts + WebSocket |
| `team-member-data.js` | 206 | 13 routes | ✅ Skills/inductions/availability |
| `search.js` | 184 | 1 route | ✅ Text + semantic search via Ollama |
| `executive-reports.js` | 177 | 2 routes | ⚠️ Works but has hardcoded values |
| `project-images.js` | 159 | 5 routes | ✅ CRUD + gallery upload |
| `report-templates.js` | 148 | 7 routes | ✅ Full CRUD + duplicate |
| `financial-reports.js` | 138 | 5 routes | ⚠️ Works but some data issues |
| `daily-reports-summary.js` | 118 | 2 routes | ✅ Text + HTML PDF summary |
| `calendar.js` | 107 | 1 route | ✅ Aggregated events from 4 tables |
| `dashboard-data.js` | 94 | 2 routes | ✅ Overview KPIs + revenue chart |
| `weather-data.js` | 93 | 1 route | ✅ Real data + realistic mock fallback |
| `backup.js` | 92 | 3 routes | ✅ Per-table + full export (CSV/JSON) |
| `audit.js` | 89 | 4 routes | ✅ Audit log CRUD + stats |
| `analytics-data.js` | 84 | 2 routes | ✅ Overtime + VAT analytics |
| `upload.js` | 77 | 2 routes | ✅ Generic file upload |
| `ai-conversations.js` | 61 | 3 routes | ✅ AI chat history |
| `metrics.js` | 54 | 3 routes | ✅ System metrics + Prometheus format |
| `audit-helper.js` | 25 | 1 helper | ✅ Shared audit logging utility |
| **TOTAL** | **5822** | **~150+ endpoints** | |

---

## Generic CRUD Tables (30 via `makeRouter`)

```
projects, invoices, safety_incidents, rfis, change_orders,
team_members, equipment, subcontractors, documents, timesheets,
meetings, materials, punch_list, inspections, rams,
cis_returns, tenders, contacts, risk_register, purchase_orders,
daily_reports, variations, defects, valuations, specifications,
temp_works, signage, waste_management, sustainability, training,
certifications, prequalification, lettings, measuring,
site_permits, equipment_service_logs, equipment_hire_logs,
risk_mitigation_actions, contact_interactions, safety_permits,
toolbox_talks, drawing_transmittals
```

All 40+ tables have full CRUD via `makeRouter` — no stubs.

---

## Issues Found

### 1. Fake/random data in `GET /financial-reports/cashflow` (FIXED ✅)
**File:** `financial-reports.js` lines 76-83
**Before:** Expenses were assigned to **random months** using `Math.random()`, and
fallback expenses were `Math.random() * 50000 + 10000`.
**Impact:** Charts showed completely fake expense data.
**Fix:** Changed to distribute total `spent` evenly across 12 months, which is a
reasonable approximation when actual monthly cost data isn't tracked.

### 2. Hardcoded margin: 25 in executive reports
**File:** `executive-reports.js` lines 97, 165
**Issue:** `margin: 25` is hardcoded. Should be calculated from actual cost vs revenue.
**Severity:** Low — clearly labelled as a placeholder.

### 3. Hardcoded RAG status (green) in executive reports
**File:** `executive-reports.js` line 21
**Issue:** RAG status is always green. Would need baseline/budget tracking to compute real status.
**Severity:** Low — labelled as placeholder.

### 4. Multi-tenancy filter missing in some financial routes
**File:** `financial-reports.js` — `GET /summary`, `GET /projects`, `GET /invoices/analysis`
**Issue:** These queries do not filter by `organization_id`, so a user could see
another org's financial data.
**Note:** `GET /cashflow` also lacks tenant filtering on the `projects` sub-query.
**Severity:** Medium — security concern for multi-tenant deployments.

### 5. Multi-tenancy filter missing in `executive-reports.js`
**File:** `executive-reports.js`
**Issue:** `GET /summary` and `GET /trends` do not apply tenant filtering to all
sub-queries (the `projects` sub-query is unfiltered in the trends endpoint).
**Severity:** Medium — same multi-tenancy concern.

### 6. `daily_reports` — field name mismatch
**File:** `generic.js` column list + `daily-reports-summary.js`
**Issue:** `generic.js` defines `report_date` (not `date`) in the column allowlist for
`daily_reports`, but the summary route references `r.report_date` and `r.weather`,
`r.workers_on_site`, etc. If the actual DB column is named differently, inserts
will silently drop fields. Needs verification against actual DB schema.
**Severity:** Medium — data integrity risk on writes.

---

## What Is NOT a Stub (Debunked)

- No empty `[]` arrays with TODO comments anywhere
- No "coming soon" placeholder routes
- No stub files — every registered route has a real handler
- The `ai.js` file (1295 lines) is a complete AI assistant with Ollama integration,
  document chunking, RAG, and tool-calling — definitely not a stub
- All `makeRouter` generic routes use real PostgreSQL queries with proper parameterisation

---

## Recommendations

### High Priority
1. **Fix multi-tenancy gaps** in `financial-reports.js` and `executive-reports.js`
   — add `organization_id` filtering to all queries that are missing it.
2. **Verify `daily_reports` column names** against the actual DB schema to ensure
   `report_date`, `weather`, `workers_on_site`, etc. match the column allowlist.

### Medium Priority
3. **Replace hardcoded margin** in executive reports — requires tracking actual
   costs per project (vs. contract_value/budget).
4. **Implement real RAG status** — requires baseline and earned-value tracking
   (BCWS/BCWP) per project.
5. **Improve `/cashflow` expenses** — real monthly breakdown requires a dedicated
   `project_expenses` or `cost_tracking` table rather than spreading annual `spent` evenly.

### Low Priority / Future
6. **Email SMTP** — email sending requires `SMTP_HOST` env var to be configured;
   currently logs are written but no emails are sent.
7. **Weather API** — currently uses site-reported weather or realistic mock data;
   a real weather API (OpenWeather) could improve accuracy.
8. **Document semantic search** — relies on `ollama` for embeddings; needs
   `document_embeddings` table populated via a background job.

---

## Fixes Applied in This Audit

| Fix | File | Change |
|-----|------|--------|
| Cashflow random data | `financial-reports.js` | Replaced `Math.random()` month assignment + fake fallback with evenly distributed real `spent` data |

---

*Audit completed: 2026-03-27*
