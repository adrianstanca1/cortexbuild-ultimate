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
`HEAD` — WIP: Bulk actions, batch delete, bulk import added to Teams, Safety, Documents modules

## What Works
- **Upload**: All 16 modules have file upload (Teams, Documents, Safety, RAMS, Certifications, Training, Specifications, Valuations, Defects, Signage, Lettings, Measuring, Prequalification, Sustainability, WasteManagement, TempWorks)
- **CRUD**: All 32+ backend routes via generic.js router — fully functional
- **Code Splitting**: index.js 170KB (88% reduction) — modules lazy-loaded
- **Bulk Actions**: BulkActionsBar + useBulkSelection integrated in Teams, Safety, Documents — batch delete, status updates
- **Bulk Import**: DataImporter component integrated in Teams module (CSV import with column mapping)
- **Database**: 43 tables, all aligned with backend generic.js ALLOWED_COLUMNS
- **Auth**: JWT middleware active on all API endpoints
- **Deployment**: GitHub → VPS pull → build → PM2 restart #69 working

## Architecture (Two API Patterns)
1. **Direct api.ts** (19 modules): `useEffect` → `api.getAll()` — legacy pattern
2. **React Query useData hook** (28 modules): `useList()`, `useCreate()` — modern pattern

## Current Position
Bulk actions implemented in Teams, Safety, Documents. Need to: commit changes, deploy to VPS, integrate remaining modules.

## Blockers
- 5 static/mock modules: ExecutiveReports, Insights, Marketplace, Settings, AIAssistant (no CRUD)
- 16 GitHub Dependabot vulnerabilities (non-critical warnings)
- Ollama model: `llama3.2:3b` (consider upgrading to `llama3.1:8b`)

## Resume Instructions
1. Commit changes: `git add . && git commit -m "feat: add bulk actions, batch delete, bulk import"`
2. `npm run build` locally (verify build passes)
3. `ssh root@72.62.132.43` → `cd /var/www/cortexbuild-ultimate && git pull && npm run build && pm2 restart cortexbuild-api`
4. Next: Integrate bulk actions into remaining modules (RAMS, RFIs, ChangeOrders, Subcontractors, etc.)

## Key Patterns
- Upload: `uploadFile(file, 'CATEGORY')` from `src/services/api.ts`
- Toast: `import { toast } from 'sonner'`
- Upload button: hidden `<input type="file">` + trigger with `document.getElementById(...)?.click()`
- Backend: `POST /api/upload` (multer, 50MB, categories: PLANS/DRAWINGS/PERMITS/RAMS/CONTRACTS/REPORTS/SPECS/PHOTOS)
- Bulk actions: `useBulkSelection()` hook + `BulkActionsBar` component from `components/ui/BulkActions`
- Bulk import: `DataImporter` + `ExportButton` from `components/ui/DataImportExport`
- DB password: `postgres` user password set to `Cumparavinde12@`
- Backend DB pool uses `user=postgres` not `user=cortexbuild` (both work via peer/md5 auth)
