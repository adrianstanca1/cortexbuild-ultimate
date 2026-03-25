# Dev Session — CortexBuild Ultimate

## Project
**CortexBuild Ultimate** — UK Construction Management SaaS
**URL**: https://cortexbuildpro.com | **VPS**: 72.62.132.43
**Branch**: `main`

## Current Phase
Full system audit complete — all CRUD + upload working, code-splitting improved.

## Last Updated
2026-03-25

## Last Commit
`31c497a` — "feat: add vitest tests for rate limiter, audit log export with backup API, full backup route"

## What Works
- **Upload**: All 16 modules have file upload (Teams, Documents, Safety, RAMS, Certifications, Training, Specifications, Valuations, Defects, Signage, Lettings, Measuring, Prequalification, Sustainability, WasteManagement, TempWorks)
- **CRUD**: All 32+ backend routes via generic.js router — fully functional
- **Code Splitting**: index.js 171KB (88% reduction) — modules lazy-loaded
- **Bulk Actions**: BulkActionsBar + useBulkSelection integrated in ALL 40+ modules with bulk delete
- **Bulk Import**: DataImporter component integrated in 6 modules (Teams, Safety, Documents, Subcontractors, Training, RAMS) — CSV import with column mapping + CSV/JSON export
- **Edit Modals**: 27 modules have edit modals; 28 modules are intentionally read-only (analytics, dashboards, logs, reports, settings)
- **Database**: 43 tables, all aligned with backend generic.js ALLOWED_COLUMNS
- **Auth**: JWT middleware active on all API endpoints
- **Security**: 0 npm vulnerabilities (vercel package removed as it was unused)
- **Rate Limiting**: In-memory rate limiter middleware (100 req/min per token) at `server/middleware/rateLimiter.js`
- **Dark/Light Theme**: Toggle already built — ThemeProvider + useTheme in Header with light/dark/system options + localStorage persistence
- **Dashboard Customization**: Widget visibility toggle panel (Customize button) with localStorage persistence — 7 toggleable widgets (KPI bar, revenue chart, project status, alerts, project table, activity feed, safety chart)
- **Data Export/Backup**: Backend backup routes at `/api/backup/export/:table` and `/api/backup/export-all` (CSV + JSON). Frontend `backupApi` in `services/api.ts`. Audit Log Export tab wired up with functional Export + Full Platform Backup buttons.
- **Unit Tests**: Vitest suite with 18 tests passing (BulkActions, DataImportExport, usePWA, rateLimiter)
- **Audit Log**: Export tab fully functional — audit trail export (CSV/JSON) and full platform backup via backup API
- **Form Validation**: Zod schemas added to 7 modules: Teams, Safety, RAMS, Documents, Subcontractors, RFIs, ChangeOrders

## Architecture (Two API Patterns)
1. **Direct api.ts** (19 modules): `useEffect` → `api.getAll()` — legacy pattern
2. **React Query useData hook** (28 modules): `useList()`, `useCreate()` — modern pattern

## Modules with Bulk Import
Teams, Safety, Documents, Subcontractors, Training, RAMS (CSV import + CSV/JSON export)

## Modules with Edit Modals (27)
RAMS, Subcontractors, Documents, Safety, Projects, Tenders, Invoicing, Accounting, CIS, CRM, Drawings, RiskRegister, PunchList, Materials, Meetings, DailyReports, Procurement, Inspections, Timesheets, ChangeOrders, RFIs, Teams, TempWorks, PlantEquipment, Calendar, Lettings

## Modules WITHOUT Edit Modals (intentionally read-only)
Analytics, FieldView, SiteOperations, AuditLog, FinancialReports, PredictiveAnalytics, Insights, AIAssistant, Marketplace, Settings, ExecutiveReports, PermissionsManager, Valuations, Variations, Defects, Specifications, Certifications, Signage, Sustainability, Training, WasteManagement, EmailHistory, Prequalification, Measuring, Dashboard, GlobalSearch

## Current Position
All remaining tasks from the previous session have been completed. The platform now has: Zod validation (7 modules), dark/light theme toggle, dashboard customization (7 toggleable widgets), API rate limiting (100 req/min), data export/backup (CSV/JSON, per-table or full), vitest unit tests (18 passing), and functional Audit Log export with backup API integration. Build passes, all tests pass, deployed to VPS.

## Resume Instructions
1. `npm run build` locally (verify build passes)
2. `npm test` to run unit tests (18 tests)
3. `ssh root@72.62.132.43` → `cd /var/www/cortexbuild-ultimate && git pull && npm run build && pkill -f "node server/index.js"; node server/index.js &` (API runs via `node server/index.js`, not PM2)
4. Next: Explore new features, enhance existing modules, or optimize performance

## Key Patterns
- Upload: `uploadFile(file, 'CATEGORY')` from `src/services/api.ts`
- Toast: `import { toast } from 'sonner'`
- Upload button: hidden `<input type="file">` + trigger with `document.getElementById(...)?.click()`
- Backend: `POST /api/upload` (multer, 50MB, categories: PLANS/DRAWINGS/PERMS/RAMS/CONTRACTS/REPORTS/SPECS/PHOTOS)
- Bulk actions: `useBulkSelection()` hook + `BulkActionsBar` component from `components/ui/BulkActions`
- Bulk import: `DataImporter` + `ExportButton` from `components/ui/DataImportExport`
- Zod validation: `z.object({...}).safeParse(form)` pattern, error at `error.issues[0].message` (Zod v4)
- Dark/light theme: `useTheme()` from `context/ThemeContext` — `theme`, `setTheme`, `resolvedTheme`
- Dashboard customization: `visibleWidgets` state with localStorage persistence, toggle per widget key
- Rate limiter: `server/middleware/rateLimiter.js` — 100 req/min per token, in-memory Map
- Backup export: `GET /api/backup/export/:table?format=csv|json` or `/api/backup/export-all`
- Vitest tests: `npm test` — 18 tests passing, test files in `src/test/`
- DB password: `postgres` user password set to `Cumparavinde12@`
- Backend DB pool uses `user=postgres` not `user=cortexbuild` (both work via peer/md5 auth)
- API server: `node server/index.js` (NOT PM2) on port 3001, restart with `pkill -f "node server/index.js"; node server/index.js &`
