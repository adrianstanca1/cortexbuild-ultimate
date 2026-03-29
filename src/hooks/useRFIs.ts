import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

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

interface RFIResponse {
  rfi: RFI;
}

export interface UseRFIsOptions {
  page?: number;
  pageSize?: number;
  projectId?: string;
  status?: string;
  assignedToId?: string;
  search?: string;
}

export interface UseRFIsResult {
  rfis: RFI[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: Error | null;
}

export interface UseRFIResult {
  rfi: RFI | null;
  loading: boolean;
  error: Error | null;
}

// Hooks for fetching data
export function useRFIs(options: UseRFIsOptions = {}): UseRFIsResult {
  const [data, setData] = useState<RFIsResponse>({
    rfis: [],
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
        if (options.assignedToId) params.set('assignedToId', options.assignedToId);
        if (options.search) params.set('search', options.search);

        const result = await apiGet<RFIsResponse>(
          `/rfis${params.toString() ? `?${params.toString()}` : ''}`
        );
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch RFIs'));
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
    options.assignedToId,
    options.search,
  ]);

  return { ...data, loading, error };
}

export function useRFI(id: string): UseRFIResult {
  const [rfi, setRFI] = useState<RFI | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setRFI(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiGet<RFIResponse>(`/rfis/${id}`);
        setRFI(result.rfi);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch RFI'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { rfi, loading, error };
}

// CRUD functions that return promises
export async function createRFI(data: Partial<RFI>): Promise<RFI> {
  const result = await apiPost<RFIResponse>('/rfis', data);
  return result.rfi;
}

export async function updateRFI(id: string, data: Partial<RFI>): Promise<RFI> {
  const result = await apiPut<RFIResponse>(`/rfis/${id}`, data);
  return result.rfi;
}

export async function deleteRFI(id: string): Promise<void> {
  await apiDelete(`/rfis/${id}`);
}

export async function fetchRFI(id: string): Promise<RFI> {
  const result = await apiGet<RFIResponse>(`/rfis/${id}`);
  return result.rfi;
}

export async function fetchRFIs(
  options: UseRFIsOptions = {}
): Promise<RFIsResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));
  if (options.projectId) params.set('projectId', options.projectId);
  if (options.status) params.set('status', options.status);
  if (options.assignedToId) params.set('assignedToId', options.assignedToId);
  if (options.search) params.set('search', options.search);

  return apiGet<RFIsResponse>(
    `/rfis${params.toString() ? `?${params.toString()}` : ''}`
  );
}
