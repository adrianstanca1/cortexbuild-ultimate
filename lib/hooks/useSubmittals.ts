import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Submittal {
  id: string;
  number: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  dueDate: string | null;
  projectId: string;
  createdById: string;
  assignedToId: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
  createdBy?: { id: string; name: string; email: string };
  assignedTo?: { id: string; name: string; email: string } | null;
  reviewedBy?: { id: string; name: string; email: string } | null;
}

interface SubmittalsResponse {
  submittals: Submittal[];
  total: number;
  page: number;
  pageSize: number;
}

interface UseSubmittalsOptions {
  page?: number;
  pageSize?: number;
  projectId?: string;
  status?: string;
  assignedToId?: string;
  search?: string;
}

async function fetchSubmittals(options: UseSubmittalsOptions = {}): Promise<SubmittalsResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));
  if (options.projectId) params.set('projectId', options.projectId);
  if (options.status) params.set('status', options.status);
  if (options.assignedToId) params.set('assignedToId', options.assignedToId);
  if (options.search) params.set('search', options.search);

  const response = await fetch(`/api/submittals?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch submittals');
  return response.json();
}

async function fetchSubmittal(id: string): Promise<Submittal> {
  const response = await fetch(`/api/submittals/${id}`);
  if (!response.ok) throw new Error('Failed to fetch submittal');
  return response.json();
}

export function useSubmittals(options: UseSubmittalsOptions = {}) {
  return useQuery({
    queryKey: ['submittals', options],
    queryFn: () => fetchSubmittals(options),
    staleTime: 1000 * 60 * 2,
  });
}

export function useSubmittal(id: string) {
  return useQuery({
    queryKey: ['submittal', id],
    queryFn: () => fetchSubmittal(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateSubmittal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Submittal>) => {
      const response = await fetch('/api/submittals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create submittal');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submittals'] }),
  });
}

export function useUpdateSubmittal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Submittal> & { id: string }) => {
      const response = await fetch(`/api/submittals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update submittal');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submittals'] });
      queryClient.invalidateQueries({ queryKey: ['submittal', variables.id] });
    },
  });
}

export function useDeleteSubmittal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/submittals/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete submittal');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submittals'] }),
  });
}
