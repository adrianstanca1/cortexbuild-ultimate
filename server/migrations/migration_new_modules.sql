-- Migration: Add new construction modules tables
-- Run on VPS: PGPASSWORD=postgres psql -h localhost -U postgres -d cortexbuild -f migration_new_modules.sql

-- Variations
CREATE TABLE IF NOT EXISTS variations (
    id SERIAL PRIMARY KEY,
    ref VARCHAR(50) UNIQUE,
    title VARCHAR(255),
    project_id INTEGER,
    project VARCHAR(255),
    subcontractor VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',
    type VARCHAR(50),
    value DECIMAL(12,2) DEFAULT 0,
    original_value DECIMAL(12,2) DEFAULT 0,
    impact VARCHAR(20),
    submitted_date DATE,
    responded_date DATE,
    description TEXT,
    reason TEXT,
    affected_items TEXT[],
    approval_chain JSONB,
    documents JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Defects
CREATE TABLE IF NOT EXISTS defects (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE,
    title VARCHAR(255),
    project_id INTEGER,
    project VARCHAR(255),
    location VARCHAR(255),
    description TEXT,
    priority VARCHAR(20),
    status VARCHAR(50) DEFAULT 'open',
    trade VARCHAR(100),
    raised_by VARCHAR(255),
    assigned_to VARCHAR(255),
    due_date DATE,
    closed_date DATE,
    photos INTEGER DEFAULT 0,
    cost DECIMAL(10,2),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Valuations
CREATE TABLE IF NOT EXISTS valuations (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE,
    project_id INTEGER,
    project VARCHAR(255),
    application_number VARCHAR(50),
    period_start DATE,
    period_end DATE,
    status VARCHAR(50) DEFAULT 'draft',
    contractor_name VARCHAR(255),
    client_name VARCHAR(255),
    original_value DECIMAL(12,2) DEFAULT 0,
    variations DECIMAL(12,2) DEFAULT 0,
    total_value DECIMAL(12,2) DEFAULT 0,
    retention DECIMAL(10,2) DEFAULT 0,
    amount_due DECIMAL(12,2) DEFAULT 0,
    submitted_date DATE,
    certified_date DATE,
    certified_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Specifications
CREATE TABLE IF NOT EXISTS specifications (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE,
    title VARCHAR(255),
    project_id INTEGER,
    project VARCHAR(255),
    section VARCHAR(100),
    version VARCHAR(20),
    status VARCHAR(50) DEFAULT 'draft',
    description TEXT,
    specifications JSONB,
    materials JSONB,
    standards TEXT[],
    approved_by VARCHAR(255),
    approved_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Temp Works
CREATE TABLE IF NOT EXISTS temp_works (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE,
    title VARCHAR(255),
    project_id INTEGER,
    project VARCHAR(255),
    description TEXT,
    type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    location VARCHAR(255),
    design_by VARCHAR(255),
    approved_by VARCHAR(255),
    design_date DATE,
    approval_date DATE,
    erected_by VARCHAR(255),
    erected_date DATE,
    inspected_by VARCHAR(255),
    inspected_date DATE,
    load_capacity DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Signage
CREATE TABLE IF NOT EXISTS signage (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE,
    project_id INTEGER,
    project VARCHAR(255),
    type VARCHAR(100),
    description VARCHAR(255),
    location VARCHAR(255),
    size VARCHAR(50),
    material VARCHAR(100),
    quantity INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'required',
    required_date DATE,
    installed_date DATE,
    installed_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Waste Management
CREATE TABLE IF NOT EXISTS waste_management (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE,
    project_id INTEGER,
    project VARCHAR(255),
    waste_type VARCHAR(100),
    carrier VARCHAR(255),
    license_number VARCHAR(100),
    skip_number VARCHAR(50),
    collection_date DATE,
    quantity DECIMAL(10,2),
    unit VARCHAR(20),
    cost DECIMAL(10,2),
    disposal_site VARCHAR(255),
    waste_code VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sustainability
CREATE TABLE IF NOT EXISTS sustainability (
    id SERIAL PRIMARY KEY,
    project_id INTEGER,
    project VARCHAR(255),
    metric_type VARCHAR(100),
    target DECIMAL(10,2),
    actual DECIMAL(10,2),
    unit VARCHAR(20),
    period VARCHAR(50),
    status VARCHAR(50) DEFAULT 'tracking',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training
CREATE TABLE IF NOT EXISTS training (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE,
    title VARCHAR(255),
    project_id INTEGER,
    project VARCHAR(255),
    type VARCHAR(100),
    provider VARCHAR(255),
    duration VARCHAR(50),
    cost DECIMAL(10,2),
    attendees JSONB,
    status VARCHAR(50) DEFAULT 'scheduled',
    scheduled_date DATE,
    completed_date DATE,
    certification VARCHAR(255),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certifications
CREATE TABLE IF NOT EXISTS certifications (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE,
    company VARCHAR(255),
    certification_type VARCHAR(100),
    body VARCHAR(255),
    grade VARCHAR(50),
    expiry_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    renewal_date DATE,
    cost DECIMAL(10,2),
    scope TEXT,
    accreditation_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prequalification
CREATE TABLE IF NOT EXISTS prequalification (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE,
    contractor VARCHAR(255),
    project_id INTEGER,
    project VARCHAR(255),
    questionnaire_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    score DECIMAL(5,2),
    approved_by VARCHAR(255),
    approved_date DATE,
    expiry_date DATE,
    documents JSONB,
    sections_completed INTEGER DEFAULT 0,
    total_sections INTEGER DEFAULT 8,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lettings
CREATE TABLE IF NOT EXISTS lettings (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE,
    project_id INTEGER,
    project VARCHAR(255),
    package_name VARCHAR(255),
    trade VARCHAR(100),
    status VARCHAR(50) DEFAULT 'advertising',
    tender_closing_date DATE,
    award_date DATE,
    contractor VARCHAR(255),
    contract_value DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Measuring
CREATE TABLE IF NOT EXISTS measuring (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE,
    project_id INTEGER,
    project VARCHAR(255),
    survey_type VARCHAR(100),
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled',
    surveyor VARCHAR(255),
    survey_date DATE,
    completed_date DATE,
    areas JSONB,
    total_area DECIMAL(12,2),
    unit VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert seed data for new modules
INSERT INTO variations (ref, title, project, subcontractor, status, type, value, original_value, impact, submitted_date, description, reason) VALUES
('VAR-001', 'Additional RC8 RC12 Rafter Installation', 'Canary Wharf Office Complex', 'SteelTech Fabrications Ltd', 'approved', 'addition', 24500, 180000, 'increase', '2024-03-15', 'Additional rafter sections RC8 and RC12 require bespoke fabrication due to site access constraints.', 'Site condition / Design coordination'),
('VAR-002', 'M&E Rerouting - Level 3', 'Manchester City Apartments', 'M&E Solutions NI', 'pending', 'addition', 8750, 95000, 'increase', '2024-03-20', 'Structural beam conflict with planned M&E route at Level 3 requires rerouting.', 'Structural conflict / Coordination'),
('VAR-003', 'Groundworks Omission - Soft Spot', 'Birmingham Road Bridge', 'ABC Groundworks', 'rejected', 'omission', -4200, 45000, 'decrease', '2024-03-10', 'Area previously classified as soft spot no longer requires full excavation and import.', 'Ground condition improvement')
ON CONFLICT (ref) DO NOTHING;

INSERT INTO defects (reference, title, project, location, description, priority, status, trade, raised_by, assigned_to, due_date) VALUES
('DEF-001', 'Crack in concrete floor - Level 3', 'Canary Wharf Office Complex', 'Level 3 - East Wing', 'Visible crack approximately 2m long in ground floor concrete slab', 'high', 'open', 'Concrete', 'James Harrington', 'Tom Bradley', '2026-04-01'),
('DEF-002', 'Window frame misalignment - Floor 5', 'Manchester City Apartments', 'Floor 5 - Block A', 'Window frame not square, gap of 15mm at corner', 'medium', 'in_progress', 'Glazing', 'Sarah Mitchell', 'Dave Patel', '2026-03-28'),
('DEF-003', 'Drainage cover trip hazard', 'Birmingham Road Bridge', 'Carriageway - Chainage 250', 'Drainage cover proud of road surface by 20mm', 'high', 'open', 'Highways', 'Tom Bradley', 'Kevin Walsh', '2026-03-25')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO valuations (reference, project, application_number, period_start, period_end, status, contractor_name, client_name, original_value, variations, total_value, retention, amount_due, submitted_date) VALUES
('VAL-001', 'Canary Wharf Office Complex', 'APP-001', '2026-02-01', '2026-02-28', 'submitted', 'CortexBuild Ltd', 'Meridian Properties', 4200000, 24500, 185000, 9250, 175750, '2026-03-05'),
('VAL-002', 'Manchester City Apartments', 'APP-001', '2026-02-01', '2026-02-28', 'certified', 'CortexBuild Ltd', 'Northern Living Ltd', 2800000, 0, 94500, 4725, 89775, '2026-03-01'),
('VAL-003', 'Birmingham Road Bridge', 'APP-FINAL', '2026-01-01', '2026-03-30', 'draft', 'CortexBuild Ltd', 'West Midlands Council', 1600000, 125000, 67200, 3360, 63840, '2026-03-20')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO specifications (reference, title, project, section, version, status, description) VALUES
('SPEC-001', 'Structural Steelwork Specification', 'Canary Wharf Office Complex', '05 00 00', '2.0', 'approved', 'Detailed specification for structural steelwork including tolerances, fabrication standards, and inspection requirements.'),
('SPEC-002', 'M&E General Requirements', 'Manchester City Apartments', '01 00 00', '1.0', 'review', 'General M&E requirements covering coordination, commissioning, and testing procedures.'),
('SPEC-003', 'Concrete Works Specification', 'Birmingham Road Bridge', '03 00 00', '1.0', 'approved', 'Specification for all concrete works including mix designs, placement, and curing requirements.')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO temp_works (reference, title, project, type, status, location, design_by, approved_by) VALUES
('TW-001', 'Scaffolding System - Tower A', 'Canary Wharf Office Complex', 'Scaffolding', 'approved', 'Tower A - Level 1-12', 'Scaffold Design Ltd', 'James Harrington'),
('TW-002', 'Temporary Propping - Basement', 'Manchester City Apartments', 'Propping', 'pending', 'Block A - Basement', 'Structural Solutions', 'Sarah Mitchell'),
('TW-003', 'Excavation Support System', 'Birmingham Road Bridge', 'Excavation Support', 'completed', 'Abutment A', 'GeoTech Design', 'Tom Bradley')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO certifications (reference, company, certification_type, body, grade, expiry_date, status, accreditation_number) VALUES
('CERT-001', 'CortexBuild Ltd', 'ISO 9001:2015', 'BSi', 'Quality Management', '2027-06-30', 'active', 'FS123456'),
('CERT-002', 'CortexBuild Ltd', 'ISO 14001:2015', 'BSi', 'Environmental', '2027-06-30', 'active', 'EN789012'),
('CERT-003', 'CortexBuild Ltd', 'ISO 45001:2018', 'BSi', 'Health & Safety', '2027-06-30', 'active', 'HS456789'),
('CERT-004', 'CortexBuild Ltd', 'Constructionline Gold', 'Constructionline', 'Gold Member', '2026-12-31', 'active', 'CLG-2024-5678'),
('CERT-005', 'CortexBuild Ltd', 'SSIP', 'ABBET', 'Safe Contractor', '2026-09-30', 'active', 'SSIP-2024-9012')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO waste_management (reference, project, waste_type, carrier, license_number, collection_date, quantity, unit, cost, disposal_site, status) VALUES
('WM-001', 'Canary Wharf Office Complex', 'Concrete & Brick', 'EnviroSkip Ltd', 'ENV/LIC/2024/001', '2026-03-25', 12, 'tonnes', 840, 'North London Recycling Centre', 'scheduled'),
('WM-002', 'Manchester City Apartments', 'Mixed Construction', 'Birmingham Waste Co', 'BWC/LIC/2024/015', '2026-03-22', 8, 'tonnes', 560, 'Manchester Waste Facility', 'collected'),
('WM-003', 'Birmingham Road Bridge', 'Excavated Material', 'WM Council Skip', 'WMC/LIC/2024/008', '2026-03-20', 25, 'tonnes', 0, 'Council Tip - No Charge', 'collected')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO sustainability (project_id, project, metric_type, target, actual, unit, period, status) VALUES
(1, 'Canary Wharf Office Complex', 'Carbon Reduction', 30, 22, '%', '2026 Q1', 'tracking'),
(1, 'Canary Wharf Office Complex', 'Waste Recycled', 85, 78, '%', '2026 Q1', 'tracking'),
(2, 'Manchester City Apartments', 'Carbon Reduction', 25, 18, '%', '2026 Q1', 'tracking'),
(3, 'Birmingham Road Bridge', 'Local Supply Chain', 60, 65, '%', '2026 Q1', 'achieved')
ON CONFLICT DO NOTHING;

INSERT INTO signage (reference, project, type, description, location, quantity, status, required_date) VALUES
('SIG-001', 'Canary Wharf Office Complex', 'Safety', 'Hard Hat Area', 'Site Entrance', 2, 'installed', '2026-03-01'),
('SIG-002', 'Canary Wharf Office Complex', 'Warning', 'Deep Excavation', 'Perimeter Fencing', 8, 'installed', '2026-03-01'),
('SIG-003', 'Manchester City Apartments', 'Safety', 'Construction Traffic', 'Site Entrance', 4, 'required', '2026-03-30')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO training (reference, title, project, type, provider, duration, cost, status, scheduled_date, certification) VALUES
('TRN-001', 'SMSTS Site Manager Training', 'Canary Wharf Office Complex', 'Safety', 'CITB', '5 days', 650, 'completed', '2026-02-15', 'SMSTS Certificate'),
('TRN-002', 'IOSH Working Safely', 'All Projects', 'Safety', 'IOSH', '1 day', 150, 'scheduled', '2026-04-10', 'IOSH Certificate'),
('TRN-003', 'CPCS Excavator Operator', 'Manchester City Apartments', 'Plant', 'CITB', '3 days', 450, 'completed', '2026-03-01', 'CPCS Card')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO prequalification (reference, contractor, project, questionnaire_type, status, score, approved_by, approved_date) VALUES
('PQ-001', 'Turner Steelwork Ltd', 'Canary Wharf Office Complex', 'PAS 91', 'approved', 85, 'Claire Watson', '2026-01-15'),
('PQ-002', 'Northern Groundworks Ltd', 'Manchester City Apartments', 'PAS 91', 'approved', 78, 'Sarah Mitchell', '2026-02-01'),
('PQ-003', 'Apex Electrical Services', 'Edinburgh Data Centre', 'PAS 91', 'pending', NULL, NULL, NULL)
ON CONFLICT (reference) DO NOTHING;

INSERT INTO lettings (reference, project, package_name, trade, status, tender_closing_date, award_date, contractor, contract_value) VALUES
('LET-001', 'Canary Wharf Office Complex', 'Curtain Walling', 'Facade', 'awarded', '2025-12-01', '2026-01-15', 'Facade Systems Ltd', 850000),
('LET-002', 'Manchester City Apartments', 'Mechanical Installation', 'M&E', 'tendering', '2026-04-01', NULL, NULL, 420000),
('LET-003', 'Birmingham Road Bridge', 'Expansion Joints', 'Specialist', 'advertising', '2026-04-15', NULL, NULL, 85000)
ON CONFLICT (reference) DO NOTHING;

INSERT INTO measuring (reference, project, survey_type, location, status, surveyor, survey_date, total_area, unit) VALUES
('SURV-001', 'Canary Wharf Office Complex', 'Area Survey', 'All Floors', 'completed', 'Thomas Surveying', '2026-03-15', 12500, 'm²'),
('SURV-002', 'Manchester City Apartments', 'Topographical', 'Site Boundary', 'completed', 'Northern Surveys', '2026-02-20', 2800, 'm²'),
('SURV-003', 'Birmingham Road Bridge', 'As-built Survey', 'Full Structure', 'scheduled', 'WM Council Surveyor', '2026-04-01', 0, 'm²')
ON CONFLICT (reference) DO NOTHING;
