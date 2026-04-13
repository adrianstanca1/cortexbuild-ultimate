-- Migration: 059_add_tenant_columns_remaining
-- Purpose: Add organization_id (and company_id where appropriate) to the
--          remaining tables that lack direct tenant isolation. These tables
--          currently rely on FK joins for tenant scope, which the generic CRUD
--          router and tenantFilter middleware cannot use.
-- Run: After migrations 000-058.
-- Note: organizations table is skipped — it IS the root entity.

-- ─── 1. Add columns ──────────────────────────────────────────────────────────

ALTER TABLE app_settings          ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE bim4d_tasks           ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE bim_model_layers      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE bim_processing_queue  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE document_embeddings   ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE document_versions     ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE equipment_telemetry   ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE webhook_deliveries     ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Also add company_id for tables where it's meaningful (mirrors migration 055 pattern)
ALTER TABLE app_settings          ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE bim4d_tasks           ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE bim_model_layers      ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE bim_processing_queue  ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE document_embeddings   ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE document_versions     ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE equipment_telemetry   ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE webhook_deliveries     ADD COLUMN IF NOT EXISTS company_id UUID;

-- ─── 2. Backfill from parent tables ──────────────────────────────────────────

UPDATE app_settings SET organization_id = (SELECT organization_id FROM users WHERE users.id = app_settings.user_id)
WHERE app_settings.organization_id IS NULL AND app_settings.user_id IS NOT NULL;

UPDATE bim4d_tasks SET organization_id = (SELECT organization_id FROM bim4d_models WHERE bim4d_models.id = bim4d_tasks.model_id)
WHERE bim4d_tasks.organization_id IS NULL;

UPDATE bim_model_layers SET organization_id = (SELECT organization_id FROM bim_models WHERE bim_models.id = bim_model_layers.model_id)
WHERE bim_model_layers.organization_id IS NULL;

UPDATE bim_processing_queue SET organization_id = (SELECT organization_id FROM bim_models WHERE bim_models.id = bim_processing_queue.model_id)
WHERE bim_processing_queue.organization_id IS NULL;

UPDATE document_embeddings SET organization_id = (SELECT organization_id FROM documents WHERE documents.id = document_embeddings.document_id)
WHERE document_embeddings.organization_id IS NULL;

UPDATE document_versions SET organization_id = (SELECT organization_id FROM documents WHERE documents.id = document_versions.document_id)
WHERE document_versions.organization_id IS NULL;

UPDATE equipment_telemetry SET organization_id = (SELECT organization_id FROM equipment_devices WHERE equipment_devices.id = equipment_telemetry.device_id)
WHERE equipment_telemetry.organization_id IS NULL;

UPDATE notification_settings SET organization_id = (SELECT organization_id FROM users WHERE users.id = notification_settings.user_id)
WHERE notification_settings.organization_id IS NULL AND notification_settings.user_id IS NOT NULL;

UPDATE webhook_deliveries SET organization_id = (SELECT organization_id FROM webhooks WHERE webhooks.id = webhook_deliveries.webhook_id)
WHERE webhook_deliveries.organization_id IS NULL;

-- ─── 3. Indexes for tenant-filtered queries ──────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_app_settings_organization_id          ON app_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_bim4d_tasks_organization_id            ON bim4d_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_bim_model_layers_organization_id      ON bim_model_layers(organization_id);
CREATE INDEX IF NOT EXISTS idx_bim_processing_queue_organization_id   ON bim_processing_queue(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_organization_id    ON document_embeddings(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_organization_id      ON document_versions(organization_id);
CREATE INDEX IF NOT EXISTS idx_equipment_telemetry_organization_id    ON equipment_telemetry(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_organization_id  ON notification_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_organization_id     ON webhook_deliveries(organization_id);