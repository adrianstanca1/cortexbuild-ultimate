import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface CostItem {
  id: string;
  code: string;
  description: string;
  amount: number;
  category: string;
  projectId: string;
  project?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

interface BudgetsResponse {
  costItems: CostItem[];
  totalBudget: number;
}

interface UseBudgetsOptions {
  projectId?: string;
  category?: string;
}

async function fetchBudgets(options: UseBudgetsOptions = {}): Promise<BudgetsResponse> {
  const params = new URLSearchParams();
  if (options.projectId) params.set('projectId', options.projectId);
  if (options.category) params.set('category', options.category);

  const response = await fetch(`/api/budgets?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch budgets');
  }
  return response.json();
}

async function createBudget(data: Partial<CostItem>): Promise<CostItem> {
  const response = await fetch('/api/budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create budget');
  }
  return response.json();
}

async function deleteBudget(id: string): Promise<void> {
  const response = await fetch(`/api/budgets/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete budget');
  }
}

export function useBudgets(options: UseBudgetsOptions = {}) {
  return useQuery({
    queryKey: ['budgets', options],
    queryFn: () => fetchBudgets(options),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}
