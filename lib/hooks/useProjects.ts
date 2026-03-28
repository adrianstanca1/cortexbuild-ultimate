import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
}

interface ProjectsResponse {
  projects: Project[];
  total: number;
  page: number;
  pageSize: number;
}

interface UseProjectsOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

async function fetchProjects(options: UseProjectsOptions = {}): Promise<ProjectsResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));
  if (options.status) params.set('status', options.status);
  if (options.search) params.set('search', options.search);

  const response = await fetch(`/api/projects?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  return response.json();
}

async function fetchProject(id: string): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch project');
  }
  return response.json();
}

export function useProjects(options: UseProjectsOptions = {}) {
  return useQuery({
    queryKey: ['projects', options],
    queryFn: () => fetchProjects(options),
    staleTime: 1000 * 60 * 5,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => fetchProject(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Project>) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create project');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Project> & { id: string }) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update project');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
