-- Drone / Reality Capture table for site aerial and progress imagery
CREATE TABLE IF NOT EXISTS drone_captures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    organization_id UUID,
    company_id UUID,
    capture_type TEXT NOT NULL CHECK (capture_type IN ('aerial_photo', 'orthomosaic', 'point_cloud', 'video', 'thermal', 'inspection', 'progress')),
    capture_date DATE NOT NULL,
    location_name TEXT,
    altitude_m NUMERIC,
    resolution_mpix NUMERIC,
    file_url TEXT,
    thumbnail_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
    analysis_summary TEXT,
    inspector TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drone_captures_project ON drone_captures(project_id);
CREATE INDEX IF NOT EXISTS idx_drone_captures_org ON drone_captures(organization_id);
CREATE INDEX IF NOT EXISTS idx_drone_captures_type ON drone_captures(capture_type);
CREATE INDEX IF NOT EXISTS idx_drone_captures_date ON drone_captures(capture_date DESC);

COMMENT ON TABLE drone_captures IS 'Aerial and site reality capture data: drone imagery, orthomosaics, point clouds, thermal surveys';
