-- Migration 004: Add company_id and organization_id to report_templates
-- Fixes multi-tenancy gap in report templates schema

ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);

-- Backfill existing rows: set to NULL (existing templates will be orphaned until assigned by an admin)
UPDATE report_templates SET company_id = NULL, organization_id = NULL WHERE company_id IS NULL;
