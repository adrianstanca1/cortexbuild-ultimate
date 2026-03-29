import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

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

interface SafetyIncidentResponse {
  incident: SafetyIncident;
}

export interface UseSafetyIncidentsOptions {
  page?: number;
  pageSize?: number;
  projectId?: string;
  severity?: string;
  status?: string;
  search?: string;
}

export interface UseSafetyIncidentsResult {
  incidents: SafetyIncident[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: Error | null;
}

export interface UseSafetyIncidentResult {
  incident: SafetyIncident | null;
  loading: boolean;
  error: Error | null;
}

// Hooks for fetching data
export function useSafetyIncidents(
  options: UseSafetyIncidentsOptions = {}
): UseSafetyIncidentsResult {
  const [data, setData] = useState<SafetyIncidentsResponse>({
    incidents: [],
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
        if (options.severity) params.set('severity', options.severity);
        if (options.status) params.set('status', options.status);
        if (options.search) params.set('search', options.search);

        const result = await apiGet<SafetyIncidentsResponse>(
          `/safety${params.toString() ? `?${params.toString()}` : ''}`
        );
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to fetch safety incidents')
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
    options.severity,
    options.status,
    options.search,
  ]);

  return { ...data, loading, error };
}

export function useSafetyIncident(id: string): UseSafetyIncidentResult {
  const [incident, setIncident] = useState<SafetyIncident | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setIncident(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiGet<SafetyIncidentResponse>(`/safety/${id}`);
        setIncident(result.incident);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to fetch safety incident')
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { incident, loading, error };
}

// CRUD functions that return promises
export async function createSafetyIncident(
  data: Partial<SafetyIncident>
): Promise<SafetyIncident> {
  const result = await apiPost<SafetyIncidentResponse>('/safety', data);
  return result.incident;
}

export async function updateSafetyIncident(
  id: string,
  data: Partial<SafetyIncident>
): Promise<SafetyIncident> {
  const result = await apiPut<SafetyIncidentResponse>(`/safety/${id}`, data);
  return result.incident;
}

export async function deleteSafetyIncident(id: string): Promise<void> {
  await apiDelete(`/safety/${id}`);
}

export async function fetchSafetyIncident(id: string): Promise<SafetyIncident> {
  const result = await apiGet<SafetyIncidentResponse>(`/safety/${id}`);
  return result.incident;
}

export async function fetchSafetyIncidents(
  options: UseSafetyIncidentsOptions = {}
): Promise<SafetyIncidentsResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));
  if (options.projectId) params.set('projectId', options.projectId);
  if (options.severity) params.set('severity', options.severity);
  if (options.status) params.set('status', options.status);
  if (options.search) params.set('search', options.search);

  return apiGet<SafetyIncidentsResponse>(
    `/safety${params.toString() ? `?${params.toString()}` : ''}`
  );
}
