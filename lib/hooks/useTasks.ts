import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { name: string };
  assignee?: { name: string; email: string } | null;
}

interface TasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
}

interface UseTasksOptions {
  page?: number;
  pageSize?: number;
  projectId?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
}

async function fetchTasks(options: UseTasksOptions = {}): Promise<TasksResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));
  if (options.projectId) params.set('projectId', options.projectId);
  if (options.status) params.set('status', options.status);
  if (options.priority) params.set('priority', options.priority);
  if (options.assigneeId) params.set('assigneeId', options.assigneeId);

  const response = await fetch(`/api/tasks?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  return response.json();
}

async function fetchTask(id: string): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch task');
  }
  return response.json();
}

export function useTasks(options: UseTasksOptions = {}) {
  return useQuery({
    queryKey: ['tasks', options],
    queryFn: () => fetchTasks(options),
    staleTime: 1000 * 60 * 2,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => fetchTask(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Task>) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create task');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Task> & { id: string }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.id] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
