import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

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

interface TaskResponse {
  task: Task;
}

export interface UseTasksOptions {
  page?: number;
  pageSize?: number;
  projectId?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
}

export interface UseTasksResult {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: Error | null;
}

export interface UseTaskResult {
  task: Task | null;
  loading: boolean;
  error: Error | null;
}

// Hooks for fetching data
export function useTasks(options: UseTasksOptions = {}): UseTasksResult {
  const [data, setData] = useState<TasksResponse>({
    tasks: [],
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
        if (options.priority) params.set('priority', options.priority);
        if (options.assigneeId) params.set('assigneeId', options.assigneeId);

        const result = await apiGet<TasksResponse>(
          `/tasks${params.toString() ? `?${params.toString()}` : ''}`
        );
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
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
    options.priority,
    options.assigneeId,
  ]);

  return { ...data, loading, error };
}

export function useTask(id: string): UseTaskResult {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setTask(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiGet<TaskResponse>(`/tasks/${id}`);
        setTask(result.task);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch task'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { task, loading, error };
}

// CRUD functions that return promises
export async function createTask(data: Partial<Task>): Promise<Task> {
  const result = await apiPost<TaskResponse>('/tasks', data);
  return result.task;
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task> {
  const result = await apiPut<TaskResponse>(`/tasks/${id}`, data);
  return result.task;
}

export async function deleteTask(id: string): Promise<void> {
  await apiDelete(`/tasks/${id}`);
}

export async function fetchTask(id: string): Promise<Task> {
  const result = await apiGet<TaskResponse>(`/tasks/${id}`);
  return result.task;
}

export async function fetchTasks(
  options: UseTasksOptions = {}
): Promise<TasksResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.pageSize) params.set('pageSize', String(options.pageSize));
  if (options.projectId) params.set('projectId', options.projectId);
  if (options.status) params.set('status', options.status);
  if (options.priority) params.set('priority', options.priority);
  if (options.assigneeId) params.set('assigneeId', options.assigneeId);

  return apiGet<TasksResponse>(
    `/tasks${params.toString() ? `?${params.toString()}` : ''}`
  );
}
