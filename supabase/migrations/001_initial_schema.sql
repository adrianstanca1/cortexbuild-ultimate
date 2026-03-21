-- CortexBuild Ultimate — Initial Schema
-- Run via: supabase db push  OR  paste into Supabase SQL editor

-- ─── PROJECTS ────────────────────────────────────────────────────────────────
create table if not exists projects (
  id              text primary key default gen_random_uuid()::text,
  name            text not null,
  client          text,
  status          text default 'active',      -- active | on_hold | completed | planning
  progress        integer default 0,
  budget          numeric(12,2) default 0,
  spent           numeric(12,2) default 0,
  start_date      date,
  end_date        date,
  manager         text,
  location        text,
  type            text,                        -- Commercial | Residential | Civil | etc.
  phase           text,
  workers         integer default 0,
  contract_value  numeric(12,2) default 0,
  created_at      timestamptz default now()
);

-- ─── INVOICES ────────────────────────────────────────────────────────────────
create table if not exists invoices (
  id              text primary key default gen_random_uuid()::text,
  number          text unique not null,
  client          text,
  project         text references projects(name),
  amount          numeric(12,2) default 0,
  vat             numeric(12,2) default 0,
  cis_deduction   numeric(12,2) default 0,
  status          text default 'draft',        -- draft | sent | paid | overdue | disputed
  issue_date      date,
  due_date        date,
  description     text,
  created_at      timestamptz default now()
);

-- ─── SAFETY INCIDENTS ────────────────────────────────────────────────────────
create table if not exists safety_incidents (
  id              text primary key default gen_random_uuid()::text,
  type            text,                        -- incident | near-miss | hazard | toolbox-talk | mewp-check | riddor
  title           text not null,
  severity        text default 'minor',        -- minor | serious | critical
  status          text default 'open',         -- open | investigating | resolved | closed
  project         text references projects(name),
  reported_by     text,
  date            date,
  description     text,
  created_at      timestamptz default now()
);

-- ─── RFIS ────────────────────────────────────────────────────────────────────
create table if not exists rfis (
  id              text primary key default gen_random_uuid()::text,
  number          text unique not null,
  project         text references projects(name),
  subject         text,
  question        text,
  response        text,
  priority        text default 'medium',       -- low | medium | high | critical
  status          text default 'open',         -- open | pending | answered | closed
  submitted_by    text,
  submitted_date  date,
  due_date        date,
  assigned_to     text,
  ai_suggestion   text,
  created_at      timestamptz default now()
);

-- ─── CHANGE ORDERS ───────────────────────────────────────────────────────────
create table if not exists change_orders (
  id              text primary key default gen_random_uuid()::text,
  number          text unique not null,
  project         text references projects(name),
  title           text,
  description     text,
  amount          numeric(12,2) default 0,
  status          text default 'draft',        -- draft | pending | approved | rejected
  submitted_date  date,
  approved_date   date,
  reason          text,
  schedule_impact integer default 0,
  created_at      timestamptz default now()
);

-- ─── TEAM MEMBERS ────────────────────────────────────────────────────────────
create table if not exists team_members (
  id              text primary key default gen_random_uuid()::text,
  name            text not null,
  role            text,
  trade           text,
  email           text unique,
  phone           text,
  status          text default 'on_site',      -- on_site | off_site | leave | terminated
  cis_status      text default 'net',          -- gross | net | unverified
  utr_number      text,
  ni_number       text,
  projects        text[],
  hours_this_week numeric(5,1) default 0,
  rams_completed  boolean default false,
  created_at      timestamptz default now()
);

-- ─── EQUIPMENT ───────────────────────────────────────────────────────────────
create table if not exists equipment (
  id              text primary key default gen_random_uuid()::text,
  name            text not null,
  type            text,
  registration    text,
  status          text default 'available',    -- on_site | available | maintenance | hired_out
  location        text,
  next_service    date,
  daily_rate      numeric(8,2) default 0,
  created_at      timestamptz default now()
);

-- ─── SUBCONTRACTORS ──────────────────────────────────────────────────────────
create table if not exists subcontractors (
  id              text primary key default gen_random_uuid()::text,
  company         text not null,
  trade           text,
  contact         text,
  email           text,
  phone           text,
  status          text default 'pending',      -- active | pending | inactive | blacklisted
  cis_verified    boolean default false,
  insurance_expiry date,
  rams_approved   boolean default false,
  current_project text references projects(name),
  contract_value  numeric(12,2) default 0,
  rating          numeric(2,1) default 0,
  created_at      timestamptz default now()
);

-- ─── DOCUMENTS ───────────────────────────────────────────────────────────────
create table if not exists documents (
  id              text primary key default gen_random_uuid()::text,
  name            text not null,
  type            text,                        -- PDF | XLSX | DOCX | DWG | IFC | etc.
  project         text references projects(name),
  uploaded_by     text,
  uploaded_date   date,
  version         text,
  size            text,
  status          text default 'current',      -- current | superseded | archived
  category        text,                        -- DRAWINGS | RAMS | CONTRACTS | PERMITS | REPORTS | etc.
  url             text,
  created_at      timestamptz default now()
);

-- ─── TIMESHEETS ──────────────────────────────────────────────────────────────
create table if not exists timesheets (
  id              text primary key default gen_random_uuid()::text,
  worker          text,
  project         text references projects(name),
  week            text,                        -- ISO week: 2026-W11
  regular_hours   numeric(5,1) default 0,
  overtime_hours  numeric(5,1) default 0,
  daywork_hours   numeric(5,1) default 0,
  total_pay       numeric(8,2) default 0,
  status          text default 'draft',        -- draft | submitted | approved | paid
  cis_deduction   numeric(8,2) default 0,
  created_at      timestamptz default now()
);

-- ─── MEETINGS ────────────────────────────────────────────────────────────────
create table if not exists meetings (
  id              text primary key default gen_random_uuid()::text,
  title           text not null,
  project         text references projects(name),
  date            date,
  time            text,
  location        text,
  attendees       text[],
  agenda          text[],
  action_items    jsonb default '[]',
  created_at      timestamptz default now()
);

-- ─── MATERIALS ───────────────────────────────────────────────────────────────
create table if not exists materials (
  id              text primary key default gen_random_uuid()::text,
  name            text not null,
  category        text,
  quantity        numeric(10,2) default 0,
  unit            text,
  unit_cost       numeric(10,2) default 0,
  total_cost      numeric(12,2) default 0,
  supplier        text,
  project         text references projects(name),
  status          text default 'ordered',      -- ordered | pending_delivery | on_site | delivered | used
  delivery_date   date,
  po_number       text,
  created_at      timestamptz default now()
);

-- ─── PUNCH LIST ───────────────────────────────────────────────────────────────
create table if not exists punch_list_items (
  id              text primary key default gen_random_uuid()::text,
  project         text references projects(name),
  location        text,
  description     text,
  assigned_to     text,
  priority        text default 'medium',       -- low | medium | high | critical
  status          text default 'open',         -- open | in_progress | completed
  due_date        date,
  photos          integer default 0,
  trade           text,
  created_at      timestamptz default now()
);

-- ─── INSPECTIONS ─────────────────────────────────────────────────────────────
create table if not exists inspections (
  id              text primary key default gen_random_uuid()::text,
  type            text not null,
  project         text references projects(name),
  inspector       text,
  date            date,
  status          text default 'scheduled',    -- scheduled | passed | failed | partial
  score           integer,
  items           jsonb default '[]',
  next_inspection date,
  created_at      timestamptz default now()
);

-- ─── RAMS DOCUMENTS ──────────────────────────────────────────────────────────
create table if not exists rams_documents (
  id              text primary key default gen_random_uuid()::text,
  title           text not null,
  project         text references projects(name),
  activity        text,
  version         text,
  status          text default 'draft',        -- draft | pending | approved | expired
  created_by      text,
  approved_by     text,
  review_date     date,
  hazards         jsonb default '[]',
  method_statement text[],
  ppe             text[],
  signatures      integer default 0,
  required        integer default 0,
  created_at      timestamptz default now()
);

-- ─── CIS RETURNS ─────────────────────────────────────────────────────────────
create table if not exists cis_returns (
  id              text primary key default gen_random_uuid()::text,
  contractor      text not null,
  utr             text,
  period          text,
  gross_payment   numeric(10,2) default 0,
  materials_cost  numeric(10,2) default 0,
  labour_net      numeric(10,2) default 0,
  cis_deduction   numeric(10,2) default 0,
  status          text default 'pending',      -- pending | submitted | accepted
  verification_status text default 'net',      -- gross | net | unverified
  created_at      timestamptz default now()
);

-- ─── TENDERS ──────────────────────────────────────────────────────────────────
create table if not exists tenders (
  id              text primary key default gen_random_uuid()::text,
  title           text not null,
  client          text,
  value           numeric(12,2) default 0,
  deadline        date,
  status          text default 'identified',   -- identified | drafting | submitted | shortlisted | won | lost
  probability     integer default 50,
  type            text,
  location        text,
  ai_score        integer,
  notes           text,
  created_at      timestamptz default now()
);

-- ─── CONTACTS ────────────────────────────────────────────────────────────────
create table if not exists contacts (
  id              text primary key default gen_random_uuid()::text,
  name            text not null,
  company         text,
  role            text,
  email           text,
  phone           text,
  type            text default 'client',       -- client | subcontractor | consultant | supplier | other
  value           numeric(12,2) default 0,
  last_contact    date,
  status          text default 'active',
  projects        integer default 0,
  created_at      timestamptz default now()
);

-- ─── DAILY REPORTS ───────────────────────────────────────────────────────────
create table if not exists daily_reports (
  id              text primary key default gen_random_uuid()::text,
  project         text references projects(name),
  date            date not null,
  prepared_by     text,
  weather         text,
  temperature     text,
  workers_on_site integer default 0,
  activities      text[],
  materials       text[],
  equipment       text[],
  issues          text[],
  photos          integer default 0,
  progress        integer default 0,
  ai_summary      text,
  created_at      timestamptz default now()
);

-- ─── PURCHASE ORDERS ─────────────────────────────────────────────────────────
create table if not exists purchase_orders (
  id              text primary key default gen_random_uuid()::text,
  po_number       text unique not null,
  supplier        text,
  description     text,
  value           numeric(12,2) default 0,
  project         text references projects(name),
  status          text default 'ordered',      -- pending_approval | ordered | pending_delivery | on_site | delivered
  order_date      date,
  delivery_date   date,
  category        text,
  notes           text,
  created_at      timestamptz default now()
);

-- ─── RISK REGISTER ───────────────────────────────────────────────────────────
create table if not exists risk_register (
  id              text primary key default gen_random_uuid()::text,
  title           text not null,
  project         text,
  category        text,
  likelihood      integer check (likelihood between 1 and 5),
  impact          integer check (impact between 1 and 5),
  status          text default 'open',         -- open | mitigated | closed | accepted
  owner           text,
  mitigation      text,
  review_date     date,
  created_at      timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
-- Enable RLS on all tables (configure policies per your auth requirements)
alter table projects          enable row level security;
alter table invoices          enable row level security;
alter table safety_incidents  enable row level security;
alter table rfis               enable row level security;
alter table change_orders     enable row level security;
alter table team_members      enable row level security;
alter table equipment         enable row level security;
alter table subcontractors    enable row level security;
alter table documents         enable row level security;
alter table timesheets        enable row level security;
alter table meetings          enable row level security;
alter table materials         enable row level security;
alter table punch_list_items  enable row level security;
alter table inspections       enable row level security;
alter table rams_documents    enable row level security;
alter table cis_returns       enable row level security;
alter table tenders           enable row level security;
alter table contacts          enable row level security;
alter table daily_reports     enable row level security;
alter table purchase_orders   enable row level security;
alter table risk_register     enable row level security;

-- ─── BASIC POLICY: authenticated users can read/write their company data ──────
-- Replace with your own policy logic (multi-tenant, role-based, etc.)
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'projects','invoices','safety_incidents','rfis','change_orders',
    'team_members','equipment','subcontractors','documents','timesheets',
    'meetings','materials','punch_list_items','inspections','rams_documents',
    'cis_returns','tenders','contacts','daily_reports','purchase_orders','risk_register'
  ]
  loop
    execute format(
      'create policy "Allow authenticated" on %I for all to authenticated using (true) with check (true)',
      tbl
    );
  end loop;
end $$;
