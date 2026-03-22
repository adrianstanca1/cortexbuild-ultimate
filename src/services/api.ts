/**
 * CortexBuild Ultimate — API Service
 * All CRUD operations route to the local Express.js backend.
 */
import { getToken, API_BASE } from '../lib/supabase';

type Row = Record<string, unknown>;

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
  return apiFetch<T[]>(`/${endpoint}`);
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
  search: (query: string, limit?: number) =>
    apiFetch<{ results: Row; total: number; query: string }>(
      `/search?q=${encodeURIComponent(query)}&limit=${limit || 20}`
    ),
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
