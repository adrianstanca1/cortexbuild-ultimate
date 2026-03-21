/**
 * CortexBuild Ultimate — Universal API Service
 * All CRUD operations are routed through here.
 * Falls back to mock data when Supabase is not configured.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockProjects, mockInvoices, mockTeamMembers, mockSafetyIncidents,
  mockRFIs, mockChangeOrders, mockRAMS, mockCISReturns, mockEquipment,
  mockSubcontractors, mockTimesheets, mockDocuments, mockTenders,
  mockDailyReports, mockMeetings, mockMaterials, mockPunchList,
  mockInspections, mockContacts, mockRiskRegister } from '../data/mockData';

// ─── Generic helpers ─────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

async function fetchAll<T>(table: string, fallback: T[]): Promise<T[]> {
  if (!isSupabaseConfigured) return fallback;
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
  if (error) { console.error(table, error.message); return fallback; }
  return (data as T[]) ?? fallback;
}

async function fetchById<T>(table: string, id: string): Promise<T | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
  if (error) { console.error(table, error.message); return null; }
  return data as T;
}

async function insertRow<T>(table: string, row: Row): Promise<T | null> {
  if (!isSupabaseConfigured) {
    // Return a fake object with a generated id so the UI still works
    return { id: crypto.randomUUID(), ...row, created_at: new Date().toISOString() } as unknown as T;
  }
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw new Error(error.message);
  return data as T;
}

async function updateRow<T>(table: string, id: string, updates: Row): Promise<T | null> {
  if (!isSupabaseConfigured) return { id, ...updates } as unknown as T;
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data as T;
}

async function deleteRow(table: string, id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export const projectsApi = {
  getAll: () => fetchAll('projects', mockProjects),
  getById: (id: string) => fetchById('projects', id),
  create: (data: Row) => insertRow('projects', data),
  update: (id: string, data: Row) => updateRow('projects', id, data),
  delete: (id: string) => deleteRow('projects', id),
};

// ─── Invoices ────────────────────────────────────────────────────────────────

export const invoicesApi = {
  getAll: () => fetchAll('invoices', mockInvoices),
  getById: (id: string) => fetchById('invoices', id),
  create: (data: Row) => insertRow('invoices', data),
  update: (id: string, data: Row) => updateRow('invoices', id, data),
  delete: (id: string) => deleteRow('invoices', id),
};

// ─── Team Members ────────────────────────────────────────────────────────────

export const teamApi = {
  getAll: () => fetchAll('team_members', mockTeamMembers),
  getById: (id: string) => fetchById('team_members', id),
  create: (data: Row) => insertRow('team_members', data),
  update: (id: string, data: Row) => updateRow('team_members', id, data),
  delete: (id: string) => deleteRow('team_members', id),
};

// ─── Safety Incidents ────────────────────────────────────────────────────────

export const safetyApi = {
  getAll: () => fetchAll('safety_incidents', mockSafetyIncidents),
  getById: (id: string) => fetchById('safety_incidents', id),
  create: (data: Row) => insertRow('safety_incidents', data),
  update: (id: string, data: Row) => updateRow('safety_incidents', id, data),
  delete: (id: string) => deleteRow('safety_incidents', id),
};

// ─── RFIs ────────────────────────────────────────────────────────────────────

export const rfisApi = {
  getAll: () => fetchAll('rfis', mockRFIs),
  getById: (id: string) => fetchById('rfis', id),
  create: (data: Row) => insertRow('rfis', data),
  update: (id: string, data: Row) => updateRow('rfis', id, data),
  delete: (id: string) => deleteRow('rfis', id),
};

// ─── Change Orders ───────────────────────────────────────────────────────────

export const changeOrdersApi = {
  getAll: () => fetchAll('change_orders', mockChangeOrders),
  getById: (id: string) => fetchById('change_orders', id),
  create: (data: Row) => insertRow('change_orders', data),
  update: (id: string, data: Row) => updateRow('change_orders', id, data),
  delete: (id: string) => deleteRow('change_orders', id),
};

// ─── RAMS ────────────────────────────────────────────────────────────────────

export const ramsApi = {
  getAll: () => fetchAll('rams', mockRAMS),
  getById: (id: string) => fetchById('rams', id),
  create: (data: Row) => insertRow('rams', data),
  update: (id: string, data: Row) => updateRow('rams', id, data),
  delete: (id: string) => deleteRow('rams', id),
};

// ─── CIS Returns ─────────────────────────────────────────────────────────────

export const cisApi = {
  getAll: () => fetchAll('cis_returns', mockCISReturns),
  getById: (id: string) => fetchById('cis_returns', id),
  create: (data: Row) => insertRow('cis_returns', data),
  update: (id: string, data: Row) => updateRow('cis_returns', id, data),
  delete: (id: string) => deleteRow('cis_returns', id),
};

// ─── Equipment / Plant ───────────────────────────────────────────────────────

export const equipmentApi = {
  getAll: () => fetchAll('equipment', mockEquipment),
  getById: (id: string) => fetchById('equipment', id),
  create: (data: Row) => insertRow('equipment', data),
  update: (id: string, data: Row) => updateRow('equipment', id, data),
  delete: (id: string) => deleteRow('equipment', id),
};

// ─── Subcontractors ──────────────────────────────────────────────────────────

export const subcontractorsApi = {
  getAll: () => fetchAll('subcontractors', mockSubcontractors),
  getById: (id: string) => fetchById('subcontractors', id),
  create: (data: Row) => insertRow('subcontractors', data),
  update: (id: string, data: Row) => updateRow('subcontractors', id, data),
  delete: (id: string) => deleteRow('subcontractors', id),
};

// ─── Timesheets ──────────────────────────────────────────────────────────────

export const timesheetsApi = {
  getAll: () => fetchAll('timesheets', mockTimesheets),
  getById: (id: string) => fetchById('timesheets', id),
  create: (data: Row) => insertRow('timesheets', data),
  update: (id: string, data: Row) => updateRow('timesheets', id, data),
  delete: (id: string) => deleteRow('timesheets', id),
};

// ─── Documents ───────────────────────────────────────────────────────────────

export const documentsApi = {
  getAll: () => fetchAll('documents', mockDocuments),
  getById: (id: string) => fetchById('documents', id),
  create: (data: Row) => insertRow('documents', data),
  update: (id: string, data: Row) => updateRow('documents', id, data),
  delete: (id: string) => deleteRow('documents', id),
  uploadFile: async (file: File, path: string): Promise<string | null> => {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.storage.from('documents').upload(path, file);
    if (error) throw new Error(error.message);
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(data.path);
    return urlData.publicUrl;
  },
};

// ─── Tenders ─────────────────────────────────────────────────────────────────

export const tendersApi = {
  getAll: () => fetchAll('tenders', mockTenders),
  getById: (id: string) => fetchById('tenders', id),
  create: (data: Row) => insertRow('tenders', data),
  update: (id: string, data: Row) => updateRow('tenders', id, data),
  delete: (id: string) => deleteRow('tenders', id),
};

// ─── Daily Reports ───────────────────────────────────────────────────────────

export const dailyReportsApi = {
  getAll: () => fetchAll('daily_reports', mockDailyReports),
  getById: (id: string) => fetchById('daily_reports', id),
  create: (data: Row) => insertRow('daily_reports', data),
  update: (id: string, data: Row) => updateRow('daily_reports', id, data),
  delete: (id: string) => deleteRow('daily_reports', id),
};

// ─── Meetings ────────────────────────────────────────────────────────────────

export const meetingsApi = {
  getAll: () => fetchAll('meetings', mockMeetings),
  getById: (id: string) => fetchById('meetings', id),
  create: (data: Row) => insertRow('meetings', data),
  update: (id: string, data: Row) => updateRow('meetings', id, data),
  delete: (id: string) => deleteRow('meetings', id),
};

// ─── Materials ───────────────────────────────────────────────────────────────

export const materialsApi = {
  getAll: () => fetchAll('materials', mockMaterials),
  getById: (id: string) => fetchById('materials', id),
  create: (data: Row) => insertRow('materials', data),
  update: (id: string, data: Row) => updateRow('materials', id, data),
  delete: (id: string) => deleteRow('materials', id),
};

// ─── Punch List ──────────────────────────────────────────────────────────────

export const punchListApi = {
  getAll: () => fetchAll('punch_list', mockPunchList),
  getById: (id: string) => fetchById('punch_list', id),
  create: (data: Row) => insertRow('punch_list', data),
  update: (id: string, data: Row) => updateRow('punch_list', id, data),
  delete: (id: string) => deleteRow('punch_list', id),
};

// ─── Inspections ─────────────────────────────────────────────────────────────

export const inspectionsApi = {
  getAll: () => fetchAll('inspections', mockInspections),
  getById: (id: string) => fetchById('inspections', id),
  create: (data: Row) => insertRow('inspections', data),
  update: (id: string, data: Row) => updateRow('inspections', id, data),
  delete: (id: string) => deleteRow('inspections', id),
};

// ─── Contacts (CRM) ──────────────────────────────────────────────────────────

export const contactsApi = {
  getAll: () => fetchAll('contacts', mockContacts),
  getById: (id: string) => fetchById('contacts', id),
  create: (data: Row) => insertRow('contacts', data),
  update: (id: string, data: Row) => updateRow('contacts', id, data),
  delete: (id: string) => deleteRow('contacts', id),
};

// ─── Risk Register ───────────────────────────────────────────────────────────

export const riskRegisterApi = {
  getAll: () => fetchAll('risk_register', mockRiskRegister),
  getById: (id: string) => fetchById('risk_register', id),
  create: (data: Row) => insertRow('risk_register', data),
  update: (id: string, data: Row) => updateRow('risk_register', id, data),
  delete: (id: string) => deleteRow('risk_register', id),
};
