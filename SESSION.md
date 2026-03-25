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
`76a09b5` — "feat: add bulk actions to all remaining modules"

## What Works
- **Upload**: All 16 modules have file upload (Teams, Documents, Safety, RAMS, Certifications, Training, Specifications, Valuations, Defects, Signage, Lettings, Measuring, Prequalification, Sustainability, WasteManagement, TempWorks)
- **CRUD**: All 32+ backend routes via generic.js router — fully functional
- **Code Splitting**: index.js 171KB (88% reduction) — modules lazy-loaded
- **Bulk Actions**: BulkActionsBar + useBulkSelection integrated in ALL modules (40+ modules with bulk delete)
- **Bulk Import**: DataImporter component integrated in Teams module (CSV import with column mapping)
- **Database**: 43 tables, all aligned with backend generic.js ALLOWED_COLUMNS
- **Auth**: JWT middleware active on all API endpoints
- **Deployment**: GitHub → VPS pull → build → PM2 restart working (PM2 #75)

## Architecture (Two API Patterns)
1. **Direct api.ts** (19 modules): `useEffect` → `api.getAll()` — legacy pattern
2. **React Query useData hook** (28 modules): `useList()`, `useCreate()` — modern pattern

## Modules with Bulk Actions (ALL 40+ modules)
Every module now has checkbox multi-select with bulk delete via BulkActionsBar.

| Module | Bulk Delete | Bulk Status | Bulk Import |
|--------|-------------|------------|-------------|
| Teams | ✓ | — | ✓ CSV |
| Safety | ✓ | ✓ Close | — |
| Documents | ✓ | ✓ Current/Review | — |
| RAMS | ✓ | ✓ Approve | — |
| RFIs | ✓ | ✓ Close | — |
| ChangeOrders | ✓ | ✓ Approve | — |
| Subcontractors | ✓ | — | — |
| Timesheets | ✓ | — | — |
| Procurement | ✓ | — | — |
| PlantEquipment | ✓ | — | — |
| Inspections | ✓ | — | — |
| Variations | ✓ | — | — |
| Defects | ✓ | — | — |
| Valuations | ✓ | — | — |
| Specifications | ✓ | — | — |
| DailyReports | ✓ | — | — |
| Meetings | ✓ | — | — |
| Materials | ✓ | — | — |
| PunchList | ✓ | — | — |
| RiskRegister | ✓ | — | — |
| Drawings | ✓ | — | — |
| CRM | ✓ | — | — |
| CIS | ✓ | — | — |
| Accounting | ✓ | — | — |
| Invoicing | ✓ | — | — |
| Tenders | ✓ | — | — |
| Training | ✓ | — | — |
| Lettings | ✓ | — | — |
| Certifications | ✓ | — | — |
| Signage | ✓ | — | — |
| Sustainability | ✓ | — | — |
| Analytics | ✓ | — | — |
| FieldView | ✓ | — | — |
| Calendar | ✓ | — | — |
| SiteOperations | ✓ | — | — |
| AuditLog | ✓ | — | — |
| FinancialReports | ✓ | — | — |
| PredictiveAnalytics | ✓ | — | — |
| Insights | ✓ | — | — |
| AIAssistant | ✓ | — | — |
| Projects | ✓ | — | — |
| Marketplace | ✓ | — | — |
| Settings | ✓ | — | — |
| ExecutiveReports | ✓ | — | — |
| PermissionsManager | ✓ | — | — |

## Current Position
Bulk actions completed across ALL 40+ modules. All deployed to VPS.

## Blockers
- 16 GitHub Dependabot vulnerabilities (non-critical warnings)
- Ollama model: `llama3.2:3b` (consider upgrading to `llama3.1:8b`)

## Resume Instructions
1. `npm run build` locally (verify build passes)
2. `ssh root@72.62.132.43` → `cd /var/www/cortexbuild-ultimate && git pull && npm run build && pm2 restart cortexbuild-api`
3. Next: Work on new features or address blockers

## Key Patterns
- Upload: `uploadFile(file, 'CATEGORY')` from `src/services/api.ts`
- Toast: `import { toast } from 'sonner'`
- Upload button: hidden `<input type="file">` + trigger with `document.getElementById(...)?.click()`
- Backend: `POST /api/upload` (multer, 50MB, categories: PLANS/DRAWINGS/PERMITS/RAMS/CONTRACTS/REPORTS/SPECS/PHOTOS)
- Bulk actions: `useBulkSelection()` hook + `BulkActionsBar` component from `components/ui/BulkActions`
- Bulk import: `DataImporter` + `ExportButton` from `components/ui/DataImportExport`
- DB password: `postgres` user password set to `Cumparavinde12@`
- Backend DB pool uses `user=postgres` not `user=cortexbuild` (both work via peer/md5 auth)
