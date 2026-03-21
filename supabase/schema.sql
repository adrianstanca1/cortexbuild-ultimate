-- ============================================================
-- CortexBuild Ultimate — PostgreSQL Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  role text not null default 'field_worker'
    check (role in ('super_admin','company_owner','admin','project_manager','field_worker','client')),
  company text not null default 'CortexBuild Ltd',
  phone text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can read all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- ============================================================
-- PROJECTS
-- ============================================================
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  client text not null,
  status text not null default 'planning'
    check (status in ('planning','active','on_hold','completed','archived')),
  progress integer not null default 0 check (progress between 0 and 100),
  budget numeric(12,2) not null default 0,
  spent numeric(12,2) not null default 0,
  start_date date,
  end_date date,
  manager_id uuid references public.profiles(id),
  manager text,
  location text,
  type text,
  phase text,
  workers integer default 0,
  contract_value numeric(12,2) default 0,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.projects enable row level security;
create policy "Authenticated users can read projects" on public.projects for select using (auth.role() = 'authenticated');
create policy "Admins can modify projects" on public.projects for all using (auth.role() = 'authenticated');

-- ============================================================
-- INVOICES
-- ============================================================
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  number text not null unique,
  client text not null,
  project_id uuid references public.projects(id),
  project text,
  amount numeric(12,2) not null default 0,
  vat numeric(12,2) not null default 0,
  cis_deduction numeric(12,2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft','sent','paid','overdue','disputed')),
  issue_date date default current_date,
  due_date date,
  description text,
  payment_terms text default 'Net 30',
  bank_account text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.invoices enable row level security;
create policy "Authenticated users can manage invoices" on public.invoices for all using (auth.role() = 'authenticated');

-- ============================================================
-- TEAM MEMBERS
-- ============================================================
create table public.team_members (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  role text not null,
  email text,
  phone text,
  department text,
  status text not null default 'active'
    check (status in ('active','on_leave','terminated')),
  project_id uuid references public.projects(id),
  start_date date default current_date,
  skills text[],
  certifications text[],
  day_rate numeric(8,2),
  cscs_card text,
  cscs_expiry date,
  emergency_contact text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.team_members enable row level security;
create policy "Authenticated users can manage team" on public.team_members for all using (auth.role() = 'authenticated');

-- ============================================================
-- SAFETY INCIDENTS
-- ============================================================
create table public.safety_incidents (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  type text not null
    check (type in ('near_miss','first_aid','riddor','dangerous_occurrence','environmental')),
  severity text not null default 'low'
    check (severity in ('low','medium','high','critical')),
  status text not null default 'open'
    check (status in ('open','investigating','closed','action_required')),
  project_id uuid references public.projects(id),
  project text,
  location text,
  date date default current_date,
  time time,
  description text,
  injured_party text,
  witnesses text[],
  immediate_action text,
  investigation text,
  corrective_action text,
  reported_by uuid references public.profiles(id),
  reported_by_name text,
  riddor_reportable boolean default false,
  riddor_reference text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.safety_incidents enable row level security;
create policy "Authenticated users can manage safety" on public.safety_incidents for all using (auth.role() = 'authenticated');

-- ============================================================
-- RFIs (Requests for Information)
-- ============================================================
create table public.rfis (
  id uuid default uuid_generate_v4() primary key,
  number text not null,
  title text not null,
  project_id uuid references public.projects(id),
  project text,
  status text not null default 'open'
    check (status in ('open','answered','closed','pending')),
  priority text not null default 'medium'
    check (priority in ('low','medium','high','critical')),
  submitted_by text,
  assigned_to text,
  date_submitted date default current_date,
  date_required date,
  date_answered date,
  question text,
  answer text,
  discipline text,
  spec_section text,
  drawing_reference text,
  cost_impact boolean default false,
  schedule_impact boolean default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.rfis enable row level security;
create policy "Authenticated users can manage rfis" on public.rfis for all using (auth.role() = 'authenticated');

-- ============================================================
-- CHANGE ORDERS
-- ============================================================
create table public.change_orders (
  id uuid default uuid_generate_v4() primary key,
  number text not null,
  title text not null,
  project_id uuid references public.projects(id),
  project text,
  status text not null default 'pending'
    check (status in ('draft','pending','approved','rejected','implemented')),
  type text default 'addition'
    check (type in ('addition','deletion','substitution','schedule')),
  amount numeric(12,2) default 0,
  schedule_impact integer default 0,
  submitted_by text,
  approved_by text,
  date_submitted date default current_date,
  date_required date,
  date_approved date,
  description text,
  reason text,
  scope_change text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.change_orders enable row level security;
create policy "Authenticated users can manage change orders" on public.change_orders for all using (auth.role() = 'authenticated');

-- ============================================================
-- RAMS (Risk Assessment & Method Statements)
-- ============================================================
create table public.rams (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  project_id uuid references public.projects(id),
  project text,
  status text not null default 'draft'
    check (status in ('draft','review','approved','expired','superseded')),
  type text default 'combined'
    check (type in ('risk_assessment','method_statement','combined')),
  activity text,
  risk_level text default 'medium'
    check (risk_level in ('low','medium','high','critical')),
  prepared_by text,
  approved_by text,
  review_date date,
  expiry_date date,
  version text default '1.0',
  hazards jsonb default '[]',
  controls jsonb default '[]',
  ppe_required text[],
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.rams enable row level security;
create policy "Authenticated users can manage rams" on public.rams for all using (auth.role() = 'authenticated');

-- ============================================================
-- CIS RETURNS
-- ============================================================
create table public.cis_returns (
  id uuid default uuid_generate_v4() primary key,
  period text not null,
  period_end date not null,
  contractor_name text not null,
  contractor_utr text,
  status text not null default 'draft'
    check (status in ('draft','submitted','accepted','amended')),
  total_payments numeric(12,2) default 0,
  total_deductions numeric(12,2) default 0,
  submission_date date,
  hmrc_reference text,
  subcontractors jsonb default '[]',
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.cis_returns enable row level security;
create policy "Authenticated users can manage cis" on public.cis_returns for all using (auth.role() = 'authenticated');

-- ============================================================
-- EQUIPMENT / PLANT
-- ============================================================
create table public.equipment (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text,
  category text default 'plant'
    check (category in ('plant','vehicle','tool','scaffold','mewp','other')),
  status text not null default 'available'
    check (status in ('available','in_use','maintenance','inspection_due','retired')),
  registration text,
  serial_number text,
  project_id uuid references public.projects(id),
  project text,
  location text,
  operator text,
  hire_company text,
  hire_rate numeric(10,2),
  hire_start date,
  hire_end date,
  last_inspection date,
  next_inspection date,
  insurance_expiry date,
  thorough_examination date,
  defects text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.equipment enable row level security;
create policy "Authenticated users can manage equipment" on public.equipment for all using (auth.role() = 'authenticated');

-- ============================================================
-- SUBCONTRACTORS
-- ============================================================
create table public.subcontractors (
  id uuid default uuid_generate_v4() primary key,
  company text not null,
  contact_name text,
  email text,
  phone text,
  trade text,
  status text not null default 'approved'
    check (status in ('approved','pending','suspended','blacklisted')),
  cis_status text default 'net'
    check (cis_status in ('gross','net','unverified')),
  utr text,
  verification_number text,
  insurance_expiry date,
  public_liability numeric(12,2),
  address text,
  accreditations text[],
  rating integer check (rating between 1 and 5),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.subcontractors enable row level security;
create policy "Authenticated users can manage subcontractors" on public.subcontractors for all using (auth.role() = 'authenticated');

-- ============================================================
-- TIMESHEETS
-- ============================================================
create table public.timesheets (
  id uuid default uuid_generate_v4() primary key,
  worker_id uuid references public.team_members(id),
  worker text not null,
  project_id uuid references public.projects(id),
  project text,
  week_ending date not null,
  status text not null default 'submitted'
    check (status in ('draft','submitted','approved','rejected','paid')),
  monday numeric(4,1) default 0,
  tuesday numeric(4,1) default 0,
  wednesday numeric(4,1) default 0,
  thursday numeric(4,1) default 0,
  friday numeric(4,1) default 0,
  saturday numeric(4,1) default 0,
  sunday numeric(4,1) default 0,
  total_hours numeric(5,1) generated always as (monday+tuesday+wednesday+thursday+friday+saturday+sunday) stored,
  day_rate numeric(8,2) default 0,
  total_pay numeric(10,2),
  cis_deduction numeric(10,2) default 0,
  overtime_hours numeric(4,1) default 0,
  notes text,
  approved_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.timesheets enable row level security;
create policy "Authenticated users can manage timesheets" on public.timesheets for all using (auth.role() = 'authenticated');

-- ============================================================
-- DOCUMENTS
-- ============================================================
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text,
  category text default 'general'
    check (category in ('contract','drawing','specification','rams','certificate','report','correspondence','other')),
  project_id uuid references public.projects(id),
  project text,
  file_url text,
  file_size integer,
  version text default '1.0',
  status text default 'current'
    check (status in ('draft','review','current','superseded','archived')),
  tags text[],
  description text,
  uploaded_by uuid references public.profiles(id),
  uploaded_by_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.documents enable row level security;
create policy "Authenticated users can manage documents" on public.documents for all using (auth.role() = 'authenticated');

-- ============================================================
-- TENDERS
-- ============================================================
create table public.tenders (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  client text not null,
  status text not null default 'reviewing'
    check (status in ('reviewing','pricing','submitted','won','lost','withdrawn')),
  value numeric(12,2),
  submission_date date,
  decision_date date,
  type text,
  location text,
  probability integer check (probability between 0 and 100),
  contact text,
  notes text,
  bid_manager text,
  tender_documents jsonb default '[]',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.tenders enable row level security;
create policy "Authenticated users can manage tenders" on public.tenders for all using (auth.role() = 'authenticated');

-- ============================================================
-- DAILY REPORTS
-- ============================================================
create table public.daily_reports (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id),
  project text not null,
  date date default current_date,
  weather text,
  temperature text,
  workers_on_site integer default 0,
  work_completed text,
  work_planned text,
  issues text,
  visitors text,
  deliveries text,
  safety_observations text,
  photos text[],
  submitted_by uuid references public.profiles(id),
  submitted_by_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.daily_reports enable row level security;
create policy "Authenticated users can manage daily reports" on public.daily_reports for all using (auth.role() = 'authenticated');

-- ============================================================
-- MEETINGS
-- ============================================================
create table public.meetings (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  type text default 'site'
    check (type in ('site','progress','design','safety','commercial','board','other')),
  project_id uuid references public.projects(id),
  project text,
  date date,
  time time,
  location text,
  status text default 'scheduled'
    check (status in ('scheduled','in_progress','completed','cancelled')),
  organiser text,
  attendees text[],
  agenda text,
  minutes text,
  action_items jsonb default '[]',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.meetings enable row level security;
create policy "Authenticated users can manage meetings" on public.meetings for all using (auth.role() = 'authenticated');

-- ============================================================
-- MATERIALS
-- ============================================================
create table public.materials (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text,
  sku text,
  unit text default 'unit',
  quantity_ordered numeric(10,2) default 0,
  quantity_delivered numeric(10,2) default 0,
  quantity_used numeric(10,2) default 0,
  unit_cost numeric(10,2) default 0,
  total_cost numeric(12,2),
  supplier text,
  project_id uuid references public.projects(id),
  project text,
  status text default 'ordered'
    check (status in ('ordered','partial','delivered','used','returned')),
  order_date date,
  delivery_date date,
  location text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.materials enable row level security;
create policy "Authenticated users can manage materials" on public.materials for all using (auth.role() = 'authenticated');

-- ============================================================
-- PUNCH LIST
-- ============================================================
create table public.punch_list (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  project_id uuid references public.projects(id),
  project text,
  status text not null default 'open'
    check (status in ('open','in_progress','completed','verified')),
  priority text default 'medium'
    check (priority in ('low','medium','high','critical')),
  category text,
  location text,
  assigned_to text,
  due_date date,
  completed_date date,
  description text,
  photos text[],
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.punch_list enable row level security;
create policy "Authenticated users can manage punch list" on public.punch_list for all using (auth.role() = 'authenticated');

-- ============================================================
-- INSPECTIONS
-- ============================================================
create table public.inspections (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  type text not null,
  project_id uuid references public.projects(id),
  project text,
  status text not null default 'scheduled'
    check (status in ('scheduled','in_progress','passed','failed','action_required')),
  date date,
  inspector text,
  result text,
  score integer,
  findings text,
  actions text,
  photos text[],
  certificate_url text,
  next_due date,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.inspections enable row level security;
create policy "Authenticated users can manage inspections" on public.inspections for all using (auth.role() = 'authenticated');

-- ============================================================
-- CONTACTS (CRM)
-- ============================================================
create table public.contacts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  company text,
  role text,
  email text,
  phone text,
  type text default 'client'
    check (type in ('client','supplier','subcontractor','consultant','authority','other')),
  status text default 'active'
    check (status in ('active','inactive','prospect')),
  address text,
  notes text,
  tags text[],
  last_contact date,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.contacts enable row level security;
create policy "Authenticated users can manage contacts" on public.contacts for all using (auth.role() = 'authenticated');

-- ============================================================
-- RISK REGISTER
-- ============================================================
create table public.risk_register (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  project_id uuid references public.projects(id),
  project text,
  category text,
  likelihood integer check (likelihood between 1 and 5),
  impact integer check (impact between 1 and 5),
  risk_score integer generated always as (likelihood * impact) stored,
  status text default 'open'
    check (status in ('open','mitigated','closed','accepted')),
  owner text,
  mitigation text,
  contingency text,
  review_date date,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.risk_register enable row level security;
create policy "Authenticated users can manage risks" on public.risk_register for all using (auth.role() = 'authenticated');

-- ============================================================
-- Trigger: auto-update updated_at
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','projects','invoices','team_members','safety_incidents',
    'rfis','change_orders','rams','cis_returns','equipment','subcontractors',
    'timesheets','documents','tenders','daily_reports','meetings','materials',
    'punch_list','inspections','contacts','risk_register'
  ] loop
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I for each row execute function update_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ============================================================
-- Auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, role, company)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'project_manager'),
    coalesce(new.raw_user_meta_data->>'company', 'CortexBuild Ltd')
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
