/**
 * CortexBuild Ultimate — API Service
 * All CRUD operations route to the local Express.js backend.
 */
import { getToken, API_BASE } from '../lib/supabase';
import { MOCK_DATA } from '../data/mockData';

type Row = Record<string, unknown>;

const MOCK_MAP: Record<string, unknown[]> = {
  'projects': MOCK_DATA.projects,
  'invoices': MOCK_DATA.invoices,
  'team': MOCK_DATA.team,
  'safety': MOCK_DATA.safetyIncidents,
  'rfis': MOCK_DATA.rfis,
  'change-orders': MOCK_DATA.changeOrders,
  'rams': MOCK_DATA.rams,
  'cis': MOCK_DATA.cisReturns,
  'equipment': MOCK_DATA.equipment,
  'subcontractors': MOCK_DATA.subcontractors,
  'timesheets': [],
  'documents': MOCK_DATA.documents,
  'tenders': MOCK_DATA.tenders,
  'daily-reports': MOCK_DATA.dailyReports,
  'meetings': MOCK_DATA.meetings,
  'materials': MOCK_DATA.materials,
  'punch-list': MOCK_DATA.punchList,
  'inspections': MOCK_DATA.inspections,
  'contacts': MOCK_DATA.contacts,
  'risk-register': MOCK_DATA.riskRegister,
  'purchase-orders': MOCK_DATA.purchaseOrders,
};

// ─── snake_case → camelCase normalizer ───────────────────────────────────────

function camelize(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function toCamel<T>(obj: unknown): T {
  if (Array.isArray(obj)) return obj.map(toCamel) as unknown as T;
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [camelize(k), toCamel(v)])
    ) as unknown as T;
  }
  return obj as T;
}

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  const data = await res.json();
  return toCamel<T>(data);
}

async function fetchAll<T>(endpoint: string): Promise<T[]> {
  try {
    return await apiFetch<T[]>(`/${endpoint}`);
  } catch {
    const key = endpoint.replace(/^\//, '');
    return (MOCK_MAP[key] ?? []) as T[];
  }
}

async function insertRow<T>(endpoint: string, row: Row): Promise<T> {
  return apiFetch<T>(`/${endpoint}`, { method: 'POST', body: JSON.stringify(row) });
}

async function updateRow<T>(endpoint: string, id: string, data: Row): Promise<T> {
  return apiFetch<T>(`/${endpoint}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

async function deleteRow(endpoint: string, id: string): Promise<void> {
  await apiFetch(`/${endpoint}/${id}`, { method: 'DELETE' });
}

async function uploadFile(file: File, category: string, project?: string, projectId?: string): Promise<any> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  if (project) formData.append('project', project);
  if (projectId) formData.append('project_id', projectId);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Upload failed');
  }
  return res.json();
}

// ─── Entity APIs ──────────────────────────────────────────────────────────────

export const projectsApi = {
  getAll: () => fetchAll('projects'),
  getById: (id: string) => apiFetch(`/projects/${id}`),
  create: (data: Row) => insertRow('projects', data),
  update: (id: string, data: Row) => updateRow('projects', id, data),
  delete: (id: string) => deleteRow('projects', id),
};

export const invoicesApi = {
  getAll: () => fetchAll('invoices'),
  getById: (id: string) => apiFetch(`/invoices/${id}`),
  create: (data: Row) => insertRow('invoices', data),
  update: (id: string, data: Row) => updateRow('invoices', id, data),
  delete: (id: string) => deleteRow('invoices', id),
};

export const teamApi = {
  getAll: () => fetchAll('team'),
  getById: (id: string) => apiFetch(`/team/${id}`),
  create: (data: Row) => insertRow('team', data),
  update: (id: string, data: Row) => updateRow('team', id, data),
  delete: (id: string) => deleteRow('team', id),
  getMemberSkills: (memberId: string) => apiFetch(`/team-member-data/members/${memberId}/skills`),
  getMemberInductions: (memberId: string) => apiFetch(`/team-member-data/members/${memberId}/inductions`),
  getMemberAvailability: (memberId: string) => apiFetch(`/team-member-data/members/${memberId}/availability`),
};

export const safetyApi = {
  getAll: () => fetchAll('safety'),
  getById: (id: string) => apiFetch(`/safety/${id}`),
  create: (data: Row) => insertRow('safety', data),
  update: (id: string, data: Row) => updateRow('safety', id, data),
  delete: (id: string) => deleteRow('safety', id),
};

export const rfisApi = {
  getAll: () => fetchAll('rfis'),
  getById: (id: string) => apiFetch(`/rfis/${id}`),
  create: (data: Row) => insertRow('rfis', data),
  update: (id: string, data: Row) => updateRow('rfis', id, data),
  delete: (id: string) => deleteRow('rfis', id),
};

export const changeOrdersApi = {
  getAll: () => fetchAll('change-orders'),
  getById: (id: string) => apiFetch(`/change-orders/${id}`),
  create: (data: Row) => insertRow('change-orders', data),
  update: (id: string, data: Row) => updateRow('change-orders', id, data),
  delete: (id: string) => deleteRow('change-orders', id),
};

export const ramsApi = {
  getAll: () => fetchAll('rams'),
  getById: (id: string) => apiFetch(`/rams/${id}`),
  create: (data: Row) => insertRow('rams', data),
  update: (id: string, data: Row) => updateRow('rams', id, data),
  delete: (id: string) => deleteRow('rams', id),
};

export const cisApi = {
  getAll: () => fetchAll('cis'),
  getById: (id: string) => apiFetch(`/cis/${id}`),
  create: (data: Row) => insertRow('cis', data),
  update: (id: string, data: Row) => updateRow('cis', id, data),
  delete: (id: string) => deleteRow('cis', id),
};

export const equipmentApi = {
  getAll: () => fetchAll('equipment'),
  getById: (id: string) => apiFetch(`/equipment/${id}`),
  create: (data: Row) => insertRow('equipment', data),
  update: (id: string, data: Row) => updateRow('equipment', id, data),
  delete: (id: string) => deleteRow('equipment', id),
  getServiceLogs: () => fetchAll('equipment-service-logs'),
  createServiceLog: (data: Row) => insertRow('equipment-service-logs', data),
  deleteServiceLog: (id: string) => deleteRow('equipment-service-logs', id),
  getHireLogs: () => fetchAll('equipment-hire-logs'),
  createHireLog: (data: Row) => insertRow('equipment-hire-logs', data),
  updateHireLog: (id: string, data: Row) => updateRow('equipment-hire-logs', id, data),
  deleteHireLog: (id: string) => deleteRow('equipment-hire-logs', id),
};

export const sitePermitsApi = {
  getAll: () => fetchAll('site-permits'),
  getById: (id: string) => apiFetch(`/site-permits/${id}`),
  create: (data: Row) => insertRow('site-permits', data),
  update: (id: string, data: Row) => updateRow('site-permits', id, data),
  delete: (id: string) => deleteRow('site-permits', id),
};

export const subcontractorsApi = {
  getAll: () => fetchAll('subcontractors'),
  getById: (id: string) => apiFetch(`/subcontractors/${id}`),
  create: (data: Row) => insertRow('subcontractors', data),
  update: (id: string, data: Row) => updateRow('subcontractors', id, data),
  delete: (id: string) => deleteRow('subcontractors', id),
};

export const timesheetsApi = {
  getAll: () => fetchAll('timesheets'),
  getById: (id: string) => apiFetch(`/timesheets/${id}`),
  create: (data: Row) => insertRow('timesheets', data),
  update: (id: string, data: Row) => updateRow('timesheets', id, data),
  delete: (id: string) => deleteRow('timesheets', id),
};

export const documentsApi = {
  getAll: () => fetchAll('documents'),
  getById: (id: string) => apiFetch(`/documents/${id}`),
  create: (data: Row) => insertRow('documents', data),
  update: (id: string, data: Row) => updateRow('documents', id, data),
  delete: (id: string) => deleteRow('documents', id),
  uploadFile: async (file: File, options?: { project?: string; projectId?: string; category?: string }): Promise<Row> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    if (options?.project)    formData.append('project', options.project);
    if (options?.projectId)  formData.append('project_id', options.projectId);
    if (options?.category)   formData.append('category', options.category);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return toCamel<Row>(await res.json());
  },
};

export const tendersApi = {
  getAll: () => fetchAll('tenders'),
  getById: (id: string) => apiFetch(`/tenders/${id}`),
  create: (data: Row) => insertRow('tenders', data),
  update: (id: string, data: Row) => updateRow('tenders', id, data),
  delete: (id: string) => deleteRow('tenders', id),
};

export const dailyReportsApi = {
  getAll: () => fetchAll('daily-reports'),
  getById: (id: string) => apiFetch(`/daily-reports/${id}`),
  create: (data: Row) => insertRow('daily-reports', data),
  update: (id: string, data: Row) => updateRow('daily-reports', id, data),
  delete: (id: string) => deleteRow('daily-reports', id),
};

export const meetingsApi = {
  getAll: () => fetchAll('meetings'),
  getById: (id: string) => apiFetch(`/meetings/${id}`),
  create: (data: Row) => insertRow('meetings', data),
  update: (id: string, data: Row) => updateRow('meetings', id, data),
  delete: (id: string) => deleteRow('meetings', id),
};

export const materialsApi = {
  getAll: () => fetchAll('materials'),
  getById: (id: string) => apiFetch(`/materials/${id}`),
  create: (data: Row) => insertRow('materials', data),
  update: (id: string, data: Row) => updateRow('materials', id, data),
  delete: (id: string) => deleteRow('materials', id),
};

export const punchListApi = {
  getAll: () => fetchAll('punch-list'),
  getById: (id: string) => apiFetch(`/punch-list/${id}`),
  create: (data: Row) => insertRow('punch-list', data),
  update: (id: string, data: Row) => updateRow('punch-list', id, data),
  delete: (id: string) => deleteRow('punch-list', id),
};

export const inspectionsApi = {
  getAll: () => fetchAll('inspections'),
  getById: (id: string) => apiFetch(`/inspections/${id}`),
  create: (data: Row) => insertRow('inspections', data),
  update: (id: string, data: Row) => updateRow('inspections', id, data),
  delete: (id: string) => deleteRow('inspections', id),
};

export const contactsApi = {
  getAll: () => fetchAll('contacts'),
  getById: (id: string) => apiFetch(`/contacts/${id}`),
  create: (data: Row) => insertRow('contacts', data),
  update: (id: string, data: Row) => updateRow('contacts', id, data),
  delete: (id: string) => deleteRow('contacts', id),
};

export const riskRegisterApi = {
  getAll: () => fetchAll('risk-register'),
  getById: (id: string) => apiFetch(`/risk-register/${id}`),
  create: (data: Row) => insertRow('risk-register', data),
  update: (id: string, data: Row) => updateRow('risk-register', id, data),
  delete: (id: string) => deleteRow('risk-register', id),
};

export const purchaseOrdersApi = {
  getAll: () => fetchAll('purchase-orders'),
  getById: (id: string) => apiFetch(`/purchase-orders/${id}`),
  create: (data: Row) => insertRow('purchase-orders', data),
  update: (id: string, data: Row) => updateRow('purchase-orders', id, data),
  delete: (id: string) => deleteRow('purchase-orders', id),
};

export const aiApi = {
  chat: (message: string, context?: string) =>
    apiFetch<{ reply: string; data?: unknown; suggestions: string[] }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    }),
};

export const usersApi = {
  getAll: () => apiFetch<Row[]>('/auth/users'),
  create: (data: Row) => apiFetch<Row>('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/auth/users/${id}`, { method: 'DELETE' }),
};

export const notificationsApi = {
  getAll: () => apiFetch<Row[]>('/notifications'),
  getUnreadCount: () => apiFetch<{ count: number }>('/notifications/unread-count'),
  markAsRead: (id: string) => apiFetch<Row>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () => apiFetch<void>('/notifications/read-all', { method: 'PUT' }),
  delete: (id: string) => apiFetch<void>(`/notifications/${id}`, { method: 'DELETE' }),
  clearAll: () => apiFetch<void>('/notifications', { method: 'DELETE' }),
  generateAlerts: () => apiFetch<{ generated: number }>('/notifications/generate-alerts', { method: 'POST' }),
};

export const financialReportsApi = {
  getSummary: () => apiFetch<{
    totalRevenue: number;
    totalCosts: number;
    grossProfit: number;
    netProfit: number;
    outstandingInvoices: number;
    overdueAmount: number;
    monthlyBurn: number;
    projectCount: number;
    invoiceCount: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
  }>('/financial-reports/summary'),
  getCashFlow: (startDate?: string, endDate?: string) =>
    apiFetch<{ month: string; income: number; expenses: number; net: number }[]>(
      `/financial-reports/cashflow?startDate=${startDate || ''}&endDate=${endDate || ''}`
    ),
  getProjectFinancials: () => apiFetch<Row[]>('/financial-reports/projects'),
  getInvoiceAnalysis: () => apiFetch<{
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    invoices: Row[];
  }>('/financial-reports/invoices/analysis'),
};

export const searchApi = {
  search: async (query: string, limit?: number) => {
    try {
      return await apiFetch<{ results: Row; total: number; query: string }>(
        `/search?q=${encodeURIComponent(query)}&limit=${limit || 20}`
      );
    } catch {
      const q = query.toLowerCase();
      const results = {
        projects: MOCK_DATA.projects.filter((p: any) =>
          p.name?.toLowerCase().includes(q) || p.client?.toLowerCase().includes(q)
        ),
        invoices: MOCK_DATA.invoices.filter((i: any) =>
          i.number?.toLowerCase().includes(q) || i.client?.toLowerCase().includes(q)
        ),
        contacts: MOCK_DATA.contacts.filter((c: any) =>
          c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q)
        ),
        rfis: MOCK_DATA.rfis.filter((r: any) =>
          r.number?.toLowerCase().includes(q) || r.subject?.toLowerCase().includes(q)
        ),
        documents: MOCK_DATA.documents.filter((d: any) =>
          d.name?.toLowerCase().includes(q)
        ),
        team: MOCK_DATA.team.filter((t: any) =>
          t.name?.toLowerCase().includes(q) || t.role?.toLowerCase().includes(q)
        ),
      };
      return { results };
    }
  },
};

export const auditApi = {
  getAll: (params?: { table?: string; recordId?: string; userId?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.table) searchParams.append('table', params.table);
    if (params?.recordId) searchParams.append('record_id', params.recordId);
    if (params?.userId) searchParams.append('user_id', params.userId);
    if (params?.limit) searchParams.append('limit', String(params.limit));
    return apiFetch<Row[]>(`/audit?${searchParams.toString()}`);
  },
  create: (data: { table_name: string; record_id?: string; action: string; changes?: Row; user_id?: string }) =>
    apiFetch<Row>('/audit', { method: 'POST', body: JSON.stringify(data) }),
  getStats: () => apiFetch<{ byAction: Row[]; byTable: Row[]; last24Hours: number }>('/audit/stats'),
};

export const calendarApi = {
  getEvents: (start?: string, end?: string) =>
    apiFetch<{
      id: string;
      title: string;
      type: string;
      subtype: string;
      startDate: string;
      endDate?: string;
      status: string;
      project?: string;
      url: string;
    }[]>(`/calendar?start=${start || ''}&end=${end || ''}`),
};

export const emailApi = {
  getTemplates: () => apiFetch<Record<string, { subject: string; template: string; description: string }>>('/email/templates'),
  getHistory: (limit = 50, offset = 0) =>
    apiFetch<{ emails: Row[]; total: number }>(`/email/history?limit=${limit}&offset=${offset}`),
  send: (data: { to: string; type: string; data?: Row; subject?: string; body?: string }) =>
    apiFetch<{ success: boolean; email: Row }>('/email/send', { method: 'POST', body: JSON.stringify(data) }),
  sendBulk: (data: { recipients: string[]; type: string; data?: Row; subject?: string; body?: string }) =>
    apiFetch<{ success: boolean; results: Row[] }>('/email/bulk', { method: 'POST', body: JSON.stringify(data) }),
  schedule: (data: { to: string; type: string; data?: Row; scheduledAt: string }) =>
    apiFetch<{ success: boolean; scheduled: Row }>('/email/schedule', { method: 'POST', body: JSON.stringify(data) }),
};

export interface ReportTemplate {
  id: number;
  name: string;
  type: string;
  description: string;
  config: {
    columns?: string[];
    filters?: Record<string, unknown>;
    groupBy?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    chartType?: 'bar' | 'line' | 'pie' | 'table';
    dateRange?: string;
  };
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const reportTemplatesApi = {
  getAll: (type?: string) =>
    apiFetch<ReportTemplate[]>(`/report-templates${type ? `?type=${type}` : ''}`),
  getById: (id: string) => apiFetch<ReportTemplate>(`/report-templates/${id}`),
  create: (data: { name: string; type: string; description?: string; config: ReportTemplate['config']; isDefault?: boolean }) =>
    apiFetch<ReportTemplate>('/report-templates', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<ReportTemplate>) =>
    apiFetch<ReportTemplate>(`/report-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/report-templates/${id}`, { method: 'DELETE' }),
  duplicate: (id: string) => apiFetch<ReportTemplate>(`/report-templates/${id}/duplicate`, { method: 'POST' }),
};

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, string[]>;
  isSystem?: boolean;
  isCustom?: boolean;
}

export interface Permissions {
  modules: Record<string, { label: string; defaultRole: string }>;
  actions: Record<string, { label: string; description: string }>;
}

export const permissionsApi = {
  getPermissions: () => apiFetch<Permissions>('/permissions/permissions'),
  getRoles: () => apiFetch<Role[]>('/permissions/roles'),
  getRoleById: (id: string) => apiFetch<Role>(`/permissions/roles/${id}`),
  createRole: (data: { name: string; description?: string; permissions: Record<string, string[]> }) =>
    apiFetch<Role>('/permissions/roles', { method: 'POST', body: JSON.stringify(data) }),
  updateRole: (id: string, data: Partial<Role>) =>
    apiFetch<Role>(`/permissions/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRole: (id: string) => apiFetch<void>(`/permissions/roles/${id}`, { method: 'DELETE' }),
  checkPermission: (userId: string, module: string, action: string) =>
    apiFetch<{ allowed: boolean }>('/permissions/check', {
      method: 'POST',
      body: JSON.stringify({ userId, module, action }),
    }),
};

export const variationsApi = {
  getAll: () => fetchAll('variations'),
  getById: (id: string) => apiFetch(`/variations/${id}`),
  create: (data: Row) => insertRow('variations', data),
  update: (id: string, data: Row) => updateRow('variations', id, data),
  delete: (id: string) => deleteRow('variations', id),
};

export const defectsApi = {
  getAll: () => fetchAll('defects'),
  getById: (id: string) => apiFetch(`/defects/${id}`),
  create: (data: Row) => insertRow('defects', data),
  update: (id: string, data: Row) => updateRow('defects', id, data),
  delete: (id: string) => deleteRow('defects', id),
};

export const valuationsApi = {
  getAll: () => fetchAll('valuations'),
  getById: (id: string) => apiFetch(`/valuations/${id}`),
  create: (data: Row) => insertRow('valuations', data),
  update: (id: string, data: Row) => updateRow('valuations', id, data),
  delete: (id: string) => deleteRow('valuations', id),
};

export const specificationsApi = {
  getAll: () => fetchAll('specifications'),
  getById: (id: string) => apiFetch(`/specifications/${id}`),
  create: (data: Row) => insertRow('specifications', data),
  update: (id: string, data: Row) => updateRow('specifications', id, data),
  delete: (id: string) => deleteRow('specifications', id),
};

export const tempWorksApi = {
  getAll: () => fetchAll('temp-works'),
  getById: (id: string) => apiFetch(`/temp-works/${id}`),
  create: (data: Row) => insertRow('temp-works', data),
  update: (id: string, data: Row) => updateRow('temp-works', id, data),
  delete: (id: string) => deleteRow('temp-works', id),
};

export const signageApi = {
  getAll: () => fetchAll('signage'),
  getById: (id: string) => apiFetch(`/signage/${id}`),
  create: (data: Row) => insertRow('signage', data),
  update: (id: string, data: Row) => updateRow('signage', id, data),
  delete: (id: string) => deleteRow('signage', id),
};

export const wasteManagementApi = {
  getAll: () => fetchAll('waste-management'),
  getById: (id: string) => apiFetch(`/waste-management/${id}`),
  create: (data: Row) => insertRow('waste-management', data),
  update: (id: string, data: Row) => updateRow('waste-management', id, data),
  delete: (id: string) => deleteRow('waste-management', id),
};

export const sustainabilityApi = {
  getAll: () => fetchAll('sustainability'),
  getById: (id: string) => apiFetch(`/sustainability/${id}`),
  create: (data: Row) => insertRow('sustainability', data),
  update: (id: string, data: Row) => updateRow('sustainability', id, data),
  delete: (id: string) => deleteRow('sustainability', id),
};

export const trainingApi = {
  getAll: () => fetchAll('training'),
  getById: (id: string) => apiFetch(`/training/${id}`),
  create: (data: Row) => insertRow('training', data),
  update: (id: string, data: Row) => updateRow('training', id, data),
  delete: (id: string) => deleteRow('training', id),
};

export const certificationsApi = {
  getAll: () => fetchAll('certifications'),
  getById: (id: string) => apiFetch(`/certifications/${id}`),
  create: (data: Row) => insertRow('certifications', data),
  update: (id: string, data: Row) => updateRow('certifications', id, data),
  delete: (id: string) => deleteRow('certifications', id),
};

export const prequalificationApi = {
  getAll: () => fetchAll('prequalification'),
  getById: (id: string) => apiFetch(`/prequalification/${id}`),
  create: (data: Row) => insertRow('prequalification', data),
  update: (id: string, data: Row) => updateRow('prequalification', id, data),
  delete: (id: string) => deleteRow('prequalification', id),
};

export const lettingsApi = {
  getAll: () => fetchAll('lettings'),
  getById: (id: string) => apiFetch(`/lettings/${id}`),
  create: (data: Row) => insertRow('lettings', data),
  update: (id: string, data: Row) => updateRow('lettings', id, data),
  delete: (id: string) => deleteRow('lettings', id),
};

export const measuringApi = {
  getAll: () => fetchAll('measuring'),
  getById: (id: string) => apiFetch(`/measuring/${id}`),
  create: (data: Row) => insertRow('measuring', data),
  update: (id: string, data: Row) => updateRow('measuring', id, data),
  delete: (id: string) => deleteRow('measuring', id),
};

export const backupApi = {
  getTables: () => apiFetch<{ tables: string[] }>('/backup/tables'),
  exportTable: (table: string, format: 'json' | 'csv' = 'json') => {
    const url = `/backup/export/${table}?format=${format}`;
    return fetch(`${API_BASE}${url}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => {
      if (!r.ok) throw new Error(`Export failed: ${r.statusText}`);
      if (format === 'csv') return r.text();
      return r.json();
    });
  },
  exportAll: () => {
    const url = '/backup/export-all';
    return fetch(`${API_BASE}${url}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => {
      if (!r.ok) throw new Error(`Export failed: ${r.statusText}`);
      return r.json();
    });
  },
};

export { uploadFile };
