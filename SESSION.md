# Dev Session — CortexBuild Ultimate

## Project
**CortexBuild Ultimate** — UK Construction Management SaaS  
**URL**: https://cortexbuildpro.com | **VPS**: 72.62.132.43  
**Branch**: `main`

## Current Phase
File upload rollout across all modules — Phase 2 complete.

## Last Updated
2026-03-25

## Last Commit
`9ec295a` — "Add file upload to 7 modules: Signage, Lettings, Measuring, Prequalification, Sustainability, WasteManagement, TempWorks"

## What Works
- **Upload**: All 16 modules now have file upload capability (REPORTS category). Modules: Teams, Documents, Safety, RAMS, Certifications, Training, Specifications, Valuations, Defects, Signage, Lettings, Measuring, Prequalification, Sustainability, WasteManagement, TempWorks
- **CRUD**: Create + Delete on all 9 new modules (Training, Certifications, Signage, TempWorks, WasteManagement, Sustainability, Prequalification, Lettings, Measuring)
- **Deployment**: GitHub → VPS pull → build → PM2 restart working end-to-end

## Current Position
Session clean. All work committed and pushed. Last successful deploy: `9ec295a` deployed to VPS, PM2 restart #68, API health OK.

## Blockers
None currently.

## Resume Instructions
1. Run `npm run build` locally to verify
2. `git pull origin main` on VPS
3. `npm run build` on VPS
4. `pm2 restart cortexbuild-api`
5. Next phase ideas: code-splitting (1.2MB bundle warning), Edit/Update modals for remaining modules, full CRUD on all modules

## Key Patterns
- Upload uses `uploadFile(file, 'CATEGORY')` from `src/services/api.ts`
- Toast notifications via `import { toast } from 'sonner'`
- Upload button pattern: hidden `<input type="file">` + trigger button with `document.getElementById(...)?.click()`
- Backend route: `POST /api/upload` (multer, 50MB max, categories: PLANS/DRAWINGS/PERMITS/RAMS/CONTRACTS/REPORTS/SPECS/PHOTOS)
