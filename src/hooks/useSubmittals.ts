import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

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

interface SubmittalResponse {
  submittal: Submittal;
}

export interface UseSubmittalsOptions {
  page?: number;
  pageSize?: number;
  projectId?: string;
  status?: string;
  assignedToId?: string;
  search?: string;
}

export interface UseSubmittalsResult {
  submittals: Submittal[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: Error | null;
}

export interface UseSubmittalResult {
  submittal: Submittal | null;
  loading: boolean;
  error: Error | null;
}

// Hooks for fetching data
export function useSubmittals(
  options: UseSubmittalsOptions = {}
): UseSubmittalsResult {
  const [data, setData] = useState<SubmittalsResponse>({
    submittals: [],
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

        const result = await apiGet<SubmittalsResponse>(
          `/submittals${params.toString() ? `?${params.toString()}` : ''}`
        );
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to fetch submittals')
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
    options.assignedToId,
    options.search,
  ]);

  return { ...data, loading, error };
}

export function useSubmittal(id: string): UseSubmittalResult {
  const [submittal, setSubmittal] = useState<Submittal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setSubmittal(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiGet<SubmittalResponse>(`/submittals/${id}`);
        setSubmittal(result.submittal);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to fetch submittal')
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { submittal, loading, error };
}

// CRUD functions that return promises
export async function createSubmittal(data: Partial<Submittal>): Promise<Submittal> {
  const result = await apiPost<SubmittalResponse>('/submittals', data);
  return result.submittal;
}

export async function updateSubmittal(
  id: string,
  data: Partial<Submittal>
): Promise<Submittal> {
  const result = await apiPut<SubmittalResponse>(`/submittals/${id}`, data);
  return result.submittal;
}

export async function deleteSubmittal(id: string): Promise<void> {
  await apiDelete(`/submittals/${id}`);
}

export async function fetchSubmittal(id: string): Promise<Submittal> {
  const result = await apiGet<SubmittalResponse>(`/submittals/${id}`);
  return result.submittal;
}

export async function fetchSubmittals(
  options: UseSubmittalsOptions = {}
): Promise<SubmittalsResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));
  if (options.projectId) params.set('projectId', options.projectId);
  if (options.status) params.set('status', options.status);
  if (options.assignedToId) params.set('assignedToId', options.assignedToId);
  if (options.search) params.set('search', options.search);

  return apiGet<SubmittalsResponse>(
    `/submittals${params.toString() ? `?${params.toString()}` : ''}`
  );
}
