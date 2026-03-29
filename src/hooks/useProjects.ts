import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  ownerId: string;
  // Optional extended fields returned by some API endpoints
  location?: string | null;
  progress?: number;
  manager?: string | null;
  teamSize?: number | null;
  tasksCount?: number | null;
}

interface ProjectsResponse {
  projects: Project[];
  total: number;
  page: number;
  pageSize: number;
}

interface ProjectResponse {
  project: Project;
}

export interface UseProjectsOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export interface UseProjectsResult {
  projects: Project[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: Error | null;
}

export interface UseProjectResult {
  project: Project | null;
  loading: boolean;
  error: Error | null;
}

// Hooks for fetching data
export function useProjects(options: UseProjectsOptions = {}): UseProjectsResult {
  const [data, setData] = useState<ProjectsResponse>({
    projects: [],
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
        if (options.status) params.set('status', options.status);
        if (options.search) params.set('search', options.search);

        const result = await apiGet<ProjectsResponse>(
          `/projects${params.toString() ? `?${params.toString()}` : ''}`
        );
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch projects'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [options.page, options.pageSize, options.status, options.search]);

  return { ...data, loading, error };
}

export function useProject(id: string): UseProjectResult {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setProject(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiGet<ProjectResponse>(`/projects/${id}`);
        setProject(result.project);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch project'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { project, loading, error };
}

// CRUD functions that return promises
export async function createProject(data: Partial<Project>): Promise<Project> {
  const result = await apiPost<ProjectResponse>('/projects', data);
  return result.project;
}

export async function updateProject(
  id: string,
  data: Partial<Project>
): Promise<Project> {
  const result = await apiPut<ProjectResponse>(`/projects/${id}`, data);
  return result.project;
}

export async function deleteProject(id: string): Promise<void> {
  await apiDelete(`/projects/${id}`);
}

export async function fetchProject(id: string): Promise<Project> {
  const result = await apiGet<ProjectResponse>(`/projects/${id}`);
  return result.project;
}

export async function fetchProjects(
  options: UseProjectsOptions = {}
): Promise<ProjectsResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));
  if (options.status) params.set('status', options.status);
  if (options.search) params.set('search', options.search);

  return apiGet<ProjectsResponse>(
    `/projects${params.toString() ? `?${params.toString()}` : ''}`
  );
}
