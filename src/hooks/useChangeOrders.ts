import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

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

interface ChangeOrderResponse {
  changeOrder: ChangeOrder;
}

export interface UseChangeOrdersOptions {
  page?: number;
  pageSize?: number;
  projectId?: string;
  status?: string;
  search?: string;
}

export interface UseChangeOrdersResult {
  changeOrders: ChangeOrder[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: Error | null;
}

export interface UseChangeOrderResult {
  changeOrder: ChangeOrder | null;
  loading: boolean;
  error: Error | null;
}

// Hooks for fetching data
export function useChangeOrders(
  options: UseChangeOrdersOptions = {}
): UseChangeOrdersResult {
  const [data, setData] = useState<ChangeOrdersResponse>({
    changeOrders: [],
    total: 0,
    page: options.page || 1,
    pageSize: options.pageSize || 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (options.page) params.set('page', String(options.page));
        if (options.pageSize) params.set('pageSize', String(options.pageSize));
        if (options.projectId) params.set('projectId', options.projectId);
        if (options.status) params.set('status', options.status);
        if (options.search) params.set('search', options.search);

        const result = await apiGet<ChangeOrdersResponse>(
          `/change-orders${params.toString() ? `?${params.toString()}` : ''}`
        );
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to fetch change orders')
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    options.page,
    options.pageSize,
    options.projectId,
    options.status,
    options.search,
  ]);

  return { ...data, loading, error };
}

export function useChangeOrder(id: string): UseChangeOrderResult {
  const [changeOrder, setChangeOrder] = useState<ChangeOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setChangeOrder(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiGet<ChangeOrderResponse>(`/change-orders/${id}`);
        setChangeOrder(result.changeOrder);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to fetch change order')
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { changeOrder, loading, error };
}

// CRUD functions that return promises
export async function createChangeOrder(
  data: Partial<ChangeOrder>
): Promise<ChangeOrder> {
  const result = await apiPost<ChangeOrderResponse>('/change-orders', data);
  return result.changeOrder;
}

export async function updateChangeOrder(
  id: string,
  data: Partial<ChangeOrder>
): Promise<ChangeOrder> {
  const result = await apiPut<ChangeOrderResponse>(`/change-orders/${id}`, data);
  return result.changeOrder;
}

export async function deleteChangeOrder(id: string): Promise<void> {
  await apiDelete(`/change-orders/${id}`);
}

export async function fetchChangeOrder(id: string): Promise<ChangeOrder> {
  const result = await apiGet<ChangeOrderResponse>(`/change-orders/${id}`);
  return result.changeOrder;
}

export async function fetchChangeOrders(
  options: UseChangeOrdersOptions = {}
): Promise<ChangeOrdersResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));
  if (options.projectId) params.set('projectId', options.projectId);
  if (options.status) params.set('status', options.status);
  if (options.search) params.set('search', options.search);

  return apiGet<ChangeOrdersResponse>(
    `/change-orders${params.toString() ? `?${params.toString()}` : ''}`
  );
}
