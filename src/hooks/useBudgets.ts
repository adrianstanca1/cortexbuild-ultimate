import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

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

interface CostItemResponse {
  costItem: CostItem;
}

export interface UseBudgetsOptions {
  projectId?: string;
  category?: string;
}

export interface UseBudgetsResult {
  costItems: CostItem[];
  totalBudget: number;
  loading: boolean;
  error: Error | null;
}

// Hook for fetching budgets
export function useBudgets(options: UseBudgetsOptions = {}): UseBudgetsResult {
  const [data, setData] = useState<BudgetsResponse>({
    costItems: [],
    totalBudget: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (options.projectId) params.set('projectId', options.projectId);
        if (options.category) params.set('category', options.category);

        const result = await apiGet<BudgetsResponse>(
          `/budgets${params.toString() ? `?${params.toString()}` : ''}`
        );
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch budgets'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [options.projectId, options.category]);

  return { ...data, loading, error };
}

// CRUD functions that return promises
export async function createBudget(data: Partial<CostItem>): Promise<CostItem> {
  const result = await apiPost<CostItemResponse>('/budgets', data);
  return result.costItem;
}

export async function deleteBudget(id: string): Promise<void> {
  await apiDelete(`/budgets/${id}`);
}

export async function fetchBudgets(
  options: UseBudgetsOptions = {}
): Promise<BudgetsResponse> {
  const params = new URLSearchParams();
  if (options.projectId) params.set('projectId', options.projectId);
  if (options.category) params.set('category', options.category);

  return apiGet<BudgetsResponse>(
    `/budgets${params.toString() ? `?${params.toString()}` : ''}`
  );
}
