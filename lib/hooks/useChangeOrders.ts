import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ChangeOrder {
  id: string;
  number: string;
  title: string;
  description: string | null;
  amount: number;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  projectId: string;
  createdById: string;
  approvedById: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
  createdBy?: { id: string; name: string; email: string };
  approvedBy?: { id: string; name: string; email: string } | null;
}

interface ChangeOrdersResponse {
  changeOrders: ChangeOrder[];
  total: number;
  page: number;
  pageSize: number;
}

interface UseChangeOrdersOptions {
  page?: number;
  pageSize?: number;
  projectId?: string;
  status?: string;
  search?: string;
}

async function fetchChangeOrders(options: UseChangeOrdersOptions = {}): Promise<ChangeOrdersResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));
  if (options.projectId) params.set('projectId', options.projectId);
  if (options.status) params.set('status', options.status);
  if (options.search) params.set('search', options.search);

  const response = await fetch(`/api/change-orders?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch change orders');
  return response.json();
}

async function fetchChangeOrder(id: string): Promise<ChangeOrder> {
  const response = await fetch(`/api/change-orders/${id}`);
  if (!response.ok) throw new Error('Failed to fetch change order');
  return response.json();
}

export function useChangeOrders(options: UseChangeOrdersOptions = {}) {
  return useQuery({
    queryKey: ['changeOrders', options],
    queryFn: () => fetchChangeOrders(options),
    staleTime: 1000 * 60 * 2,
  });
}

export function useChangeOrder(id: string) {
  return useQuery({
    queryKey: ['changeOrder', id],
    queryFn: () => fetchChangeOrder(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateChangeOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ChangeOrder>) => {
      const response = await fetch('/api/change-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create change order');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['changeOrders'] }),
  });
}

export function useUpdateChangeOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ChangeOrder> & { id: string }) => {
      const response = await fetch(`/api/change-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update change order');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['changeOrders'] });
      queryClient.invalidateQueries({ queryKey: ['changeOrder', variables.id] });
    },
  });
}

export function useDeleteChangeOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/change-orders/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete change order');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['changeOrders'] }),
  });
}
