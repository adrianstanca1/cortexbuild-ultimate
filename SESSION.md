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
`973eaf4` — "Add Zod validation to Teams and Safety modules"

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
- **Deployment**: GitHub → VPS pull → build → PM2 restart working (PM2 #77)

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
All major CRUD features complete: bulk actions (40+ modules), bulk import (6 modules), edit modals (27 modules), file upload (16 modules). 0 security vulnerabilities. Zod validation added to Teams + Safety. Notification system DB table created + seeded. Deployed to VPS.

## Form Validation (Zod)
Modules with Zod schemas: Teams, Safety (done). Next: RAMS, Documents, Subcontractors, RFIs, ChangeOrders.

## Notification System
DB table `notifications` created (VPS). 5 sample notifications seeded. Backend WebSocket + routes exist. Frontend `NotificationsPanel.tsx` + `useNotifications.ts` hook built.

## Resume Instructions
1. `npm run build` locally (verify build passes)
2. `ssh root@72.62.132.43` → `cd /var/www/cortexbuild-ultimate && git pull && npm run build` (API runs via `node server/index.js`, not PM2)
3. Next: Continue Zod validation, add dark/light theme toggle, dashboard customization, API rate limiting, data export, unit/E2E tests

## Key Patterns
- Upload: `uploadFile(file, 'CATEGORY')` from `src/services/api.ts`
- Toast: `import { toast } from 'sonner'`
- Upload button: hidden `<input type="file">` + trigger with `document.getElementById(...)?.click()`
- Backend: `POST /api/upload` (multer, 50MB, categories: PLANS/DRAWINGS/PERMITS/RAMS/CONTRACTS/REPORTS/SPECS/PHOTOS)
- Bulk actions: `useBulkSelection()` hook + `BulkActionsBar` component from `components/ui/BulkActions`
- Bulk import: `DataImporter` + `ExportButton` from `components/ui/DataImportExport`
- DB password: `postgres` user password set to `Cumparavinde12@`
- Backend DB pool uses `user=postgres` not `user=cortexbuild` (both work via peer/md5 auth)
