# CortexBuild Ultimate: Database Schema Audit Report

**Generated:** 2026-04-06
**Status:** CRITICAL ISSUES IDENTIFIED

## Executive Summary

The CortexBuild Ultimate database schema is **INCOMPLETE and PROBLEMATIC** with 6 critical/major issues:

1. **CRITICAL:** Core tables (users, projects, documents, etc.) are defined in `server/scripts/setup.sql`, NOT in the migration system
2. **CRITICAL:** Core tables LACK multi-tenancy columns (`organization_id`, `company_id`), violating security requirements
3. **CRITICAL:** 40+ duplicate/conflicting migration files with identical content but different numbers
4. **MAJOR:** Missing `drawings` table (referenced in CLAUDE.md as core module)
5. **MAJOR:** Missing `teams` table (code expects teams + team_members as separate tables)
6. **MAJOR:** Inconsistent type definitions between migrations (TIMESTAMP vs TIMESTAMPTZ, SERIAL vs UUID, DECIMAL vs NUMERIC)

---

## Critical Issues Breakdown

### ISSUE #1: Core Tables Not in Migration Pipeline

**Severity:** CRITICAL
**Location:** `server/scripts/setup.sql`

The following 23 core platform tables are defined OUTSIDE the migration system:

- users, projects, invoices, safety_incidents, rfis, change_orders
- team_members, equipment, subcontractors, documents, timesheets
- meetings, materials, punch_list, inspections, rams, cis_returns
- tenders, contacts, risk_register, purchase_orders, daily_reports

**Impact:**

- VPS deployment runs only files in `server/migrations/` — these core tables are NEVER created on production
- Multi-tenancy cannot be enforced on core tables
- Backend routes cannot filter by organization_id for core modules
- Data isolation violations possible

**Fix Required:**

- Create `0001_core_platform_tables.sql` in migrations/ containing all setup.sql content
- Ensure this runs BEFORE any dependent migrations

---

### ISSUE #2: Multi-Tenancy Enforcement Broken on Core Tables

**Severity:** CRITICAL
**Location:** `server/routes/generic.js`

The generic CRUD router enforces multi-tenancy via:

```javascript
function buildFilterAndParams(req) {
  return {
    filter: " WHERE organization_id = $1",
    params: [req.user.organization_id],
  };
}
```

But core tables have NO `organization_id` or `company_id` columns:

- Users table: MISSING
- Projects table: MISSING
- Documents table: MISSING
- (All other core tables: SAME ISSUE)

**Impact:**

- Queries like `SELECT * FROM projects WHERE organization_id = $1` will fail with "column not found"
- Data from different organizations will be readable by any authenticated user
- Backend routes will crash:
  - `routes/projects.js`
  - `routes/users.js`
  - `routes/documents.js`
  - `routes/generic.js` (all table routes)

**Fix Required:**
Add `organization_id` and `company_id` columns to all 23 core tables:

```sql
ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN company_id UUID REFERENCES companies(id);
-- (repeat for all 23 core tables)
```

---

### ISSUE #3: Duplicate Migration Files (40+ Conflicts)

**Severity:** CRITICAL

File duplicates identified:

- `004_embeddings.sql` / `0045_embeddings.sql` (772 bytes, IDENTICAL)
- `005_add_permissions.sql` / `0047_add_permissions.sql` (586 bytes, IDENTICAL)
- `005_add_team_member_data.sql` / `0046_add_team_member_data.sql` (2735 bytes, IDENTICAL)
- 34 more identical duplicates with different numbering

Plus `.tmp` files:

- `010_add_risk_mitigation_actions.sql.tmp`
- `009_add_equipment_permits.sql.tmp`

**Pattern:** Files created around 2026-04-06 08:58 are newer copies with corrected numbering.

**Impact:**

- Confusion about which versions to use
- Risk of running migrations in wrong order
- Maintenance burden

**Fix Required:**

- KEEP files numbered 000-038 (canonical versions)
- DELETE: `0045_embeddings.sql`, `0046_add_team_member_data.sql`, `0047_add_permissions.sql`
- DELETE: `.tmp` files

---

### ISSUE #4: Missing "drawings" Table

**Severity:** MAJOR

CLAUDE.md references "drawings" as core module
`generic.js` ALLOWED_COLUMNS has NO "drawings" entry
No CREATE TABLE drawings found in any migration

**Impact:**

- DrawingManager.tsx module cannot function
- No backend table to store drawing records

**Fix Required:**

```sql
CREATE TABLE drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  organization_id UUID REFERENCES organizations(id),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  drawing_number TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  revision TEXT DEFAULT '1.0',
  uploaded_by TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### ISSUE #5: Missing "teams" Table

**Severity:** MAJOR

Current state:

- `team_members` table exists (individual workers)
- `teams` table is MISSING (for team/squad management)

Expected:

- `teams` table: team/squad information (name, type, project_id, manager_id)
- `team_members` linked to teams via `team_id` FK

**Impact:**

- Cannot assign workers to teams/squads
- Team-level operations not possible (capacity planning, shifts, team summaries)
- Modules expecting team grouping (DailyReport team analytics) cannot function

**Fix Required:**

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  organization_id UUID REFERENCES organizations(id),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'crew',
  manager_id UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE team_members ADD COLUMN team_id UUID REFERENCES teams(id);
```

---

### ISSUE #6: Type Inconsistencies Across Migrations

**Severity:** MAJOR

**Timestamp Types:**

- setup.sql: `TIMESTAMPTZ DEFAULT NOW()`
- 036_wire_shell_modules.sql: `TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
- 037_new_modules.sql: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

**Primary Keys:**

- Core tables: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- New modules: `id SERIAL PRIMARY KEY`

**Blocking Error Example:**

```
variations.project_id = INTEGER
projects.id = UUID
→ Foreign key constraint WILL FAIL
```

This affects all 13 new module tables:

- variations, defects, valuations, specifications
- temp_works, signage, waste_management, sustainability
- training, certifications, prequalification, lettings, measuring

**Fix Required:**

1. Standardize on `TIMESTAMPTZ DEFAULT NOW()` everywhere
2. Standardize on UUID for all primary keys (change SERIAL to UUID)
3. Use `NUMERIC(14,2)` for monetary columns, `NUMERIC(10,2)` for smaller amounts
4. Use TEXT for unbounded text, `VARCHAR(n)` only for fixed-width codes
5. Fix all foreign key references where types don't match

---

## Schema Inventory

### Core Platform Tables (23 total)

✓ users (missing org tenancy)
✓ projects (missing org tenancy)
✓ invoices
✓ safety_incidents
✓ rfis
✓ change_orders
✓ team_members
✓ equipment
✓ subcontractors
✓ documents (missing org tenancy)
✓ timesheets
✓ meetings
✓ materials
✓ punch_list
✓ inspections
✓ rams
✓ cis_returns
✓ tenders
✓ contacts
✓ risk_register
✓ purchase_orders
✓ daily_reports
**MISSING:** teams, drawings

### AI & RAG Tables (5 total)

✓ ai_conversations
✓ document_versions
✓ rag_embeddings
✓ document_embeddings
✓ app_settings

### Multi-Tenancy Tables (4 total)

✓ organizations
✓ companies
✓ oauth_providers
✓ audit_log

### Email System (4 total)

✓ email_templates
✓ email_logs
✓ email_preferences
✓ scheduled_emails

### BIM Viewer (4 total)

✓ bim_models
✓ bim_clashes_detections
✓ bim_model_layers
✓ bim_processing_queue

### Enhanced Projects (3 total)

✓ project_images
✓ project_tasks (conflicts with work_packages)
✓ project_task_comments

### Cost Management (3 total)

✓ cost_codes
✓ budget_items
✓ cost_forecasts

### Submittals (3 total)

✓ submittals
✓ submittal_comments
✓ submittal_attachments

### Chat/Activity (4 total)

✓ chat_channels
✓ chat_channel_members
✓ chat_messages
✓ activity_log

### Work Packages & Tasks (2 total)

✓ work_packages
✓ tasks (conflicts with project_tasks)

### New Construction Modules (13 total) - ALL WITH TYPE MISMATCHES

✓ variations (FK type mismatch)
✓ defects (FK type mismatch)
✓ valuations (FK type mismatch)
✓ specifications (FK type mismatch)
✓ temp_works (FK type mismatch)
✓ signage (FK type mismatch)
✓ waste_management (FK type mismatch)
✓ sustainability (FK type mismatch)
✓ training (FK type mismatch)
✓ certifications (FK type mismatch)
✓ prequalification (FK type mismatch)
✓ lettings (FK type mismatch)
✓ measuring (FK type mismatch)

### Safety & Risk Tables (8 total)

✓ contact_interactions
✓ risk_mitigation_actions
✓ safety_permits
✓ toolbox_talks
✓ site_permits
✓ drawing_transmittals
✓ equipment_service_logs
✓ equipment_hire_logs

### Team Member Extensions (3 total)

✓ team_member_availability
✓ team_member_inductions
✓ team_member_skills

### Reporting (1 total)

✓ report_templates

### Notifications (2 total)

✓ notifications
✓ notification_preferences

### Permissions & RBAC (1 total)

✓ custom_roles

**TOTAL TABLES:** 101 (should be 103 with missing teams + drawings)
**TABLES WITH ISSUES:** 23 (missing tenancy) + 13 (type mismatches) = 36

---

## Action Plan

### PRIORITY 1 (BLOCKER - Do Immediately)

1. **Move core tables to migrations**
   - Create `0001_core_platform_tables.sql` with all setup.sql content
   - Integrate into standard migration pipeline

2. **Add multi-tenancy columns to core tables**
   - Execute 23 ALTER TABLE statements (see Critical Missing Columns section)
   - Add indexes: `idx_TABLE_organization_id`, `idx_TABLE_company_id`

3. **Delete duplicate migration files**
   - `rm server/migrations/0045_embeddings.sql`
   - `rm server/migrations/0046_add_team_member_data.sql`
   - `rm server/migrations/0047_add_permissions.sql`
   - `rm server/migrations/010_add_risk_mitigation_actions.sql.tmp`
   - `rm server/migrations/009_add_equipment_permits.sql.tmp`

4. **Fix type mismatches in 037_new_modules.sql**
   - Change all `project_id INTEGER` → `project_id UUID`
   - Change all `id SERIAL` → `id UUID DEFAULT gen_random_uuid()`
   - Change all `TIMESTAMP` → `TIMESTAMPTZ DEFAULT NOW()`
   - Verify all foreign key types match target table primary key types

5. **Re-run 038_add_multitenancy_to_new_modules.sql**
   - After fixes in step 4

### PRIORITY 2 (HIGH - Before Production)

6. **Create missing tables**
   - teams table (with manager_id FK and created_at)
   - drawings table

7. **Add missing indexes**
   - All core tables: `idx_TABLE_organization_id`, `idx_TABLE_company_id`
   - Performance-critical columns: status, project_id, created_at

8. **Reconcile task duplication**
   - project_tasks (from migration 013) vs tasks (from migration 032)
   - Decide: merge or keep separate with clear purpose
   - Update generic.js ALLOWED_COLUMNS accordingly

9. **Add inter-table foreign keys**
   - team_members → teams(id)
   - timesheets → team_members(id)
   - equipment_hire_logs → equipment(id)
   - custom_roles → organizations(id)

### PRIORITY 3 (MAINTENANCE)

10. **Create 0039_core_table_indexes.sql**
    - All missing indexes
    - Composite indexes for common queries

11. **Create migration validation script**
    - Check all FKs resolve
    - Check all types consistent
    - Check all tables have id, created_at, organization_id

12. **Document schema standards**
    - UUID for all primary keys
    - TIMESTAMPTZ for all timestamps
    - NUMERIC for all monetary amounts
    - Text/Varchar conventions
    - Tenancy column requirements

---

## Affected Backend Components

These routes will fail with "column not found" errors until multi-tenancy columns are added:

- `routes/projects.js`
- `routes/users.js`
- `routes/documents.js`
- `routes/invoices.js`
- `routes/safety.js`
- `routes/generic.js` (ALL table routes)

These frontend modules will fail until missing tables are created:

- `DrawingManager.tsx` (missing drawings table)
- `TeamManager.tsx` (missing teams table, missing team_id on team_members)

---

## Compliance Checklist

Use this to validate fixes:

- [ ] Core tables in migrations/ (not setup.sql)
- [ ] All tables have organization_id + company_id (except organizations/companies)
- [ ] All primary keys are UUID (no SERIAL)
- [ ] All timestamps are TIMESTAMPTZ DEFAULT NOW()
- [ ] All numeric columns use NUMERIC (not DECIMAL)
- [ ] No duplicate migration files
- [ ] No .tmp files in migrations/
- [ ] All FKs have matching types (UUID → UUID, not INT → UUID)
- [ ] Missing tables created (teams, drawings)
- [ ] Task table duplication resolved
- [ ] All tables in generic.js ALLOWED_COLUMNS exist in schema
- [ ] Performance indexes created
- [ ] Audit log configured and tested
- [ ] Multi-tenancy tested (cross-org isolation verified)

---

## Files Referenced

- **Schema definitions:** `/server/scripts/setup.sql`, `/server/migrations/000-038_*.sql`
- **Generic CRUD router:** `/server/routes/generic.js` (ALLOWED_COLUMNS, getTenantScope)
- **Project configuration:** `/CLAUDE.md` (architecture, requirements)
- **SQL files (migrations):** `/server/migrations/` (40+ files, many duplicates)
