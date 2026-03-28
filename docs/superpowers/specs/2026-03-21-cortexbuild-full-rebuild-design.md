# CortexBuild Ultimate — Full Rebuild Design Spec
**Date:** 2026-03-21
**Status:** Approved

---

## 1. Goal

Replace Supabase with a self-hosted PostgreSQL + Express.js stack on the VPS. Build all 30 modules with real, persistent functionality. Remove all Supabase dependencies. Keep the existing React/TypeScript/Tailwind frontend intact — only swap the data layer and auth.

---

## 2. Architecture

```
nginx (:80)
  ├── /* → React SPA (static, /var/www/cortexbuild-ultimate/dist)
  └── /api/* → Express.js API (:3001, managed by PM2)
                └── PostgreSQL (:5432)
```

### Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| State | React Query (data) + Zustand (UI state) |
| API | Express.js + Node.js |
| Database | PostgreSQL 16 |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Process manager | PM2 |
| Reverse proxy | nginx |

---

## 3. Database Schema (20 entities)

All tables include `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` and `created_at TIMESTAMPTZ DEFAULT NOW()`.

| Table | Key fields |
|---|---|
| `users` | name, email, password_hash, role, company, phone |
| `projects` | name, client, status, progress, budget, spent, start_date, end_date, manager, location, type, phase, workers, contract_value |
| `invoices` | number, client, project_id, amount, vat, cis_deduction, status, issue_date, due_date, description |
| `safety_incidents` | type, title, severity, status, project_id, reported_by, date, description, root_cause, corrective_actions |
| `rfis` | number, project_id, subject, question, priority, status, submitted_by, submitted_date, due_date, assigned_to, response |
| `change_orders` | number, project_id, title, description, amount, status, submitted_date, approved_date, reason, schedule_impact |
| `team_members` | name, role, trade, email, phone, status, cis_status, utr_number, ni_number, hours_this_week, rams_completed |
| `equipment` | name, type, registration, status, location, next_service, daily_rate, hire_period |
| `subcontractors` | company, trade, contact, email, phone, status, cis_verified, insurance_expiry, rams_approved, current_project, contract_value, rating |
| `documents` | name, type, project_id, uploaded_by, version, size, status, category |
| `timesheets` | worker_id, project_id, week, regular_hours, overtime_hours, daywork_hours, total_pay, status, cis_deduction |
| `meetings` | title, meeting_type, project_id, date, time, location, attendees, agenda, minutes, actions, status, link |
| `materials` | name, category, quantity, unit, unit_cost, total_cost, supplier, project_id, status, delivery_date, po_number |
| `punch_list` | project_id, location, description, assigned_to, priority, status, due_date, photos, trade |
| `inspections` | type, project_id, inspector, date, status, score, items, next_inspection |
| `rams` | title, project_id, activity, version, status, created_by, approved_by, review_date, hazards, method_statement, ppe, signatures, required |
| `cis_returns` | contractor, utr, period, gross_payment, materials_cost, labour_net, cis_deduction, status, verification_status |
| `tenders` | title, client, value, deadline, status, probability, type, location, ai_score, notes |
| `contacts` | name, company, role, email, phone, type, value, last_contact, status, projects |
| `risk_register` | title, project_id, category, likelihood, impact, risk_score, owner, status, mitigation, review_date |
| `purchase_orders` | number, supplier, project_id, amount, status, order_date, delivery_date, items, notes |
| `daily_reports` | project_id, date, prepared_by, weather, temperature, workers_on_site, activities, materials, equipment, issues, photos, progress |

---

## 4. API Design

### Auth endpoints
- `POST /api/auth/login` — returns JWT
- `POST /api/auth/logout`
- `GET /api/auth/me` — returns current user from JWT

### CRUD pattern (all entities)
- `GET /api/:entity` — list all
- `GET /api/:entity/:id` — get one
- `POST /api/:entity` — create
- `PUT /api/:entity/:id` — update
- `DELETE /api/:entity/:id` — delete

All requests (except login) require `Authorization: Bearer <token>` header.

---

## 5. Frontend Changes

### Replace `src/services/api.ts`
- Remove all Supabase imports
- `fetchAll` → `GET /api/<table>`
- `insertRow` → `POST /api/<table>`
- `updateRow` → `PUT /api/<table>/<id>`
- `deleteRow` → `DELETE /api/<table>/<id>`
- Auth token stored in `localStorage` and sent as Bearer header

### Replace `src/lib/supabase.ts`
- Remove Supabase client
- Export `getToken()` / `setToken()` helpers

### Replace `src/context/AuthContext.tsx`
- Remove Supabase Auth
- Call `POST /api/auth/login` with email/password
- Store JWT in localStorage
- Expose `user`, `isAuthenticated`, `login()`, `logout()`

### Remove from `package.json`
- `@supabase/supabase-js`

---

## 6. Server Structure

```
server/
  index.js          — Express app entry point
  db.js             — PostgreSQL pool (pg)
  middleware/
    auth.js         — JWT verification middleware
  routes/
    auth.js
    projects.js
    invoices.js
    safety.js
    rfis.js
    changeOrders.js
    team.js
    equipment.js
    subcontractors.js
    documents.js
    timesheets.js
    meetings.js
    materials.js
    punchList.js
    inspections.js
    rams.js
    cis.js
    tenders.js
    contacts.js
    riskRegister.js
    procurement.js
    dailyReports.js
  scripts/
    setup.sql       — CREATE TABLE statements
    seed.sql        — INSERT mock data
```

---

## 7. Module Coverage (all 30)

Every module gets:
- Full list view with search + filter
- Create / Edit modal with form validation
- Delete with confirmation
- Status management (approve, reject, complete, etc.)
- Stats/KPI header cards
- Linked data (e.g. project filter on invoices)

---

## 8. Deployment

1. Install PostgreSQL 16 on VPS
2. Create `cortexbuild` database and user
3. Run `setup.sql` → create all tables
4. Run `seed.sql` → load mock data
5. `npm install` in `server/`
6. PM2 start `server/index.js` on port 3001
7. Build React app: `npm run build` in project root
8. Nginx: serve `/dist` for `/*`, proxy `/api/*` to `:3001`
