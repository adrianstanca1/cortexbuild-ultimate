# Project Session Log: CortexBuild Ultimate

Last Update: 2026-04-19

## Current State

- Local: Stable, Verified, Pushed to Origin Main.
- Remote (VPS): API online (port 3001), but SSH broken (Connection Refused/Permission Denied).

## Recent Fixes

- Corrected schema mismatch in `server/lib/autoimprove-analyser.js` (column mappings: budget, date).
- Optimized SQL `WHERE` clauses and table aliasing in `server/routes/autoimprove.js` and `server/routes/autorepair.js`.
- Verified deployment pipeline locally via `npm run verify:all`.

## Blockers

- **VPS SSH Access**: Remote deployment of latest commits is blocked. Requires host-level SSHD restart or key correction.
