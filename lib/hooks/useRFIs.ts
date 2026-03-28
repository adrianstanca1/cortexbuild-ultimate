import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface RFI {
  id: string;
  number: string;
  title: string;
  question: string;
  answer: string | null;
  status: 'OPEN' | 'ANSWERED' | 'CLOSED' | 'OVERDUE';
  dueDate: string | null;
  projectId: string;
  createdById: string;
  assignedToId: string | null;
  answeredById: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
  createdBy?: { id: string; name: string; email: string };
  assignedTo?: { id: string; name: string; email: string } | null;
  answeredBy?: { id: string; name: string; email: string } | null;
}

interface RFIsResponse {
  rfis: RFI[];
  total: number;
  page: number;
  pageSize: number;
}

interface UseRFIsOptions {
  page?: number;
  pageSize?: number;
  projectId?: string;
  status?: string;
  assignedToId?: string;
  search?: string;
}

async function fetchRFIs(options: UseRFIsOptions = {}): Promise<RFIsResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));
  if (options.projectId) params.set('projectId', options.projectId);
  if (options.status) params.set('status', options.status);
  if (options.assignedToId) params.set('assignedToId', options.assignedToId);
  if (options.search) params.set('search', options.search);

  const response = await fetch(`/api/rfis?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch RFIs');
  return response.json();
}

async function fetchRFI(id: string): Promise<RFI> {
  const response = await fetch(`/api/rfis/${id}`);
  if (!response.ok) throw new Error('Failed to fetch RFI');
  return response.json();
}

export function useRFIs(options: UseRFIsOptions = {}) {
  return useQuery({
    queryKey: ['rfis', options],
    queryFn: () => fetchRFIs(options),
    staleTime: 1000 * 60 * 2,
  });
}

export function useRFI(id: string) {
  return useQuery({
    queryKey: ['rfi', id],
    queryFn: () => fetchRFI(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateRFI() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<RFI>) => {
      const response = await fetch('/api/rfis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create RFI');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rfis'] }),
  });
}

export function useUpdateRFI() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<RFI> & { id: string }) => {
      const response = await fetch(`/api/rfis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update RFI');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rfis'] });
      queryClient.invalidateQueries({ queryKey: ['rfi', variables.id] });
    },
  });
}

export function useDeleteRFI() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/rfis/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete RFI');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rfis'] }),
  });
}
