-- Seed audit_log with historical entries from existing data
DO $$
DECLARE
    demo_org_id UUID := '00000000-0000-0000-0000-000000000001';
    demo_company_id UUID := '00000000-0000-0000-0000-000000000002';
    demo_user_id UUID;
    now_ts TIMESTAMPTZ := NOW();
BEGIN
    -- Get the demo user id
    SELECT id INTO demo_user_id FROM users WHERE email = 'admin@cortexbuild.com' LIMIT 1;
    IF demo_user_id IS NULL THEN
        SELECT id INTO demo_user_id FROM users LIMIT 1;
    END IF;
    IF demo_user_id IS NULL THEN RETURN; END IF;

    -- Audit entries from existing projects
    INSERT INTO audit_log (user_id, action, table_name, record_id, changes, organization_id, company_id, created_at)
    SELECT demo_user_id, 'create', 'projects', id,
           jsonb_build_object('new', jsonb_build_object('name', name, 'status', status, 'client', client)),
           demo_org_id, demo_company_id,
           created_at + (floor(random() * 30)::int || ' days')::interval
    FROM projects
    WHERE organization_id = demo_org_id
    ON CONFLICT DO NOTHING;

    -- Audit entries from existing invoices
    INSERT INTO audit_log (user_id, action, table_name, record_id, changes, organization_id, company_id, created_at)
    SELECT demo_user_id, 'create', 'invoices', id,
           jsonb_build_object('new', jsonb_build_object('number', number, 'amount', amount, 'status', status)),
           demo_org_id, demo_company_id,
           created_at + (floor(random() * 30)::int || ' days')::interval
    FROM invoices
    WHERE organization_id = demo_org_id
    ON CONFLICT DO NOTHING;

    -- Audit entries from existing safety incidents
    INSERT INTO audit_log (user_id, action, table_name, record_id, changes, organization_id, company_id, created_at)
    SELECT demo_user_id, 'create', 'safety_incidents', id,
           jsonb_build_object('new', jsonb_build_object('title', title, 'severity', severity, 'status', status)),
           demo_org_id, demo_company_id,
           created_at + (floor(random() * 30)::int || ' days')::interval
    FROM safety_incidents
    WHERE organization_id = demo_org_id
    ON CONFLICT DO NOTHING;

    -- Audit entries from existing RFIs
    INSERT INTO audit_log (user_id, action, table_name, record_id, changes, organization_id, company_id, created_at)
    SELECT demo_user_id, 'create', 'rfis', id,
           jsonb_build_object('new', jsonb_build_object('title', title, 'status', status)),
           demo_org_id, demo_company_id,
           created_at + (floor(random() * 30)::int || ' days')::interval
    FROM rfis
    WHERE organization_id = demo_org_id
    ON CONFLICT DO NOTHING;

    -- Audit entries from existing team members
    INSERT INTO audit_log (user_id, action, table_name, record_id, changes, organization_id, company_id, created_at)
    SELECT demo_user_id, 'create', 'team_members', id,
           jsonb_build_object('new', jsonb_build_object('name', name, 'role', role, 'trade', trade)),
           demo_org_id, demo_company_id,
           created_at + (floor(random() * 30)::int || ' days')::interval
    FROM team_members
    WHERE organization_id = demo_org_id
    ON CONFLICT DO NOTHING;

    -- Recent login events
    INSERT INTO audit_log (user_id, action, table_name, record_id, changes, organization_id, company_id, created_at)
    VALUES
        (demo_user_id, 'login', 'users', demo_user_id, '{"new":{"email":"admin@cortexbuild.com"}}', demo_org_id, demo_company_id, now_ts - INTERVAL '5 days'),
        (demo_user_id, 'login', 'users', demo_user_id, '{"new":{"email":"admin@cortexbuild.com"}}', demo_org_id, demo_company_id, now_ts - INTERVAL '4 days'),
        (demo_user_id, 'login', 'users', demo_user_id, '{"new":{"email":"admin@cortexbuild.com"}}', demo_org_id, demo_company_id, now_ts - INTERVAL '3 days'),
        (demo_user_id, 'login', 'users', demo_user_id, '{"new":{"email":"admin@cortexbuild.com"}}', demo_org_id, demo_company_id, now_ts - INTERVAL '2 days'),
        (demo_user_id, 'login', 'users', demo_user_id, '{"new":{"email":"admin@cortexbuild.com"}}', demo_org_id, demo_company_id, now_ts - INTERVAL '1 day'),
        (demo_user_id, 'login', 'users', demo_user_id, '{"new":{"email":"admin@cortexbuild.com"}}', demo_org_id, demo_company_id, now_ts)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Seeded audit_log with % entries', (SELECT COUNT(*) FROM audit_log);
END $$;
