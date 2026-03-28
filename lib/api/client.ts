export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  projects: {
    list: () => fetchAPI<{ projects: any[] }>('/api/projects'),
    get: (id: string) => fetchAPI<{ project: any }>(`/api/projects/${id}`),
    create: (data: any) => fetchAPI<{ project: any }>('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI<{ project: any }>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI<{ success: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),
  },
  tasks: {
    list: (projectId?: string) => fetchAPI<{ tasks: any[] }>(`/api/tasks${projectId ? `?projectId=${projectId}` : ''}`),
    get: (id: string) => fetchAPI<{ task: any }>(`/api/tasks/${id}`),
    create: (data: any) => fetchAPI<{ task: any }>('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI<{ task: any }>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  rfis: {
    list: (projectId?: string) => fetchAPI<{ rfis: any[] }>(`/api/rfis${projectId ? `?projectId=${projectId}` : ''}`),
    create: (data: any) => fetchAPI<{ rfi: any }>('/api/rfis', { method: 'POST', body: JSON.stringify(data) }),
  },
  safety: {
    incidents: () => fetchAPI<{ incidents: any[] }>('/api/safety/incidents'),
    toolboxTalks: () => fetchAPI<{ talks: any[] }>('/api/safety/toolbox-talks'),
    mewpChecks: () => fetchAPI<{ checks: any[] }>('/api/safety/mewp-checks'),
  },
};
