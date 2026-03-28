import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface SafetyIncident {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  incidentDate: string;
  location: string | null;
  projectId: string;
  reportedById: string;
  assignedToId: string | null;
  rootCause: string | null;
  correctiveAction: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
  reportedBy?: { id: string; name: string; email: string };
  assignedTo?: { id: string; name: string; email: string } | null;
}

interface SafetyIncidentsResponse {
  incidents: SafetyIncident[];
  total: number;
  page: number;
  pageSize: number;
}

interface UseSafetyIncidentsOptions {
  page?: number;
  pageSize?: number;
  projectId?: string;
  severity?: string;
  status?: string;
  search?: string;
}

async function fetchSafetyIncidents(options: UseSafetyIncidentsOptions = {}): Promise<SafetyIncidentsResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));
  if (options.projectId) params.set('projectId', options.projectId);
  if (options.severity) params.set('severity', options.severity);
  if (options.status) params.set('status', options.status);
  if (options.search) params.set('search', options.search);

  const response = await fetch(`/api/safety-incidents?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch safety incidents');
  return response.json();
}

async function fetchSafetyIncident(id: string): Promise<SafetyIncident> {
  const response = await fetch(`/api/safety-incidents/${id}`);
  if (!response.ok) throw new Error('Failed to fetch safety incident');
  return response.json();
}

export function useSafetyIncidents(options: UseSafetyIncidentsOptions = {}) {
  return useQuery({
    queryKey: ['safetyIncidents', options],
    queryFn: () => fetchSafetyIncidents(options),
    staleTime: 1000 * 60 * 2,
  });
}

export function useSafetyIncident(id: string) {
  return useQuery({
    queryKey: ['safetyIncident', id],
    queryFn: () => fetchSafetyIncident(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateSafetyIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SafetyIncident>) => {
      const response = await fetch('/api/safety-incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create safety incident');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['safetyIncidents'] }),
  });
}

export function useUpdateSafetyIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<SafetyIncident> & { id: string }) => {
      const response = await fetch(`/api/safety-incidents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update safety incident');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['safetyIncidents'] });
      queryClient.invalidateQueries({ queryKey: ['safetyIncident', variables.id] });
    },
  });
}

export function useDeleteSafetyIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/safety-incidents/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete safety incident');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['safetyIncidents'] }),
  });
}
