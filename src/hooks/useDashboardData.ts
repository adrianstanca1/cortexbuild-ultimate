import { useState, useEffect, useRef } from 'react';
import { apiGet } from '@/lib/api';

export interface DashboardProject {
  id: string;
  name: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
  location?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  manager?: string;
  tasksCount: number;
  openRFIs: number;
}

interface DashboardDataResponse {
  projects: DashboardProject[];
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  spentBudget: number;
  openTasks: number;
  openRFIs: number;
  openSafetyIncidents: number;
}

export interface UseDashboardDataResult {
  projects: DashboardProject[];
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  spentBudget: number;
  openTasks: number;
  openRFIs: number;
  openSafetyIncidents: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Hook for fetching dashboard data
export function useDashboardData(): UseDashboardDataResult {
  const [data, setData] = useState<DashboardDataResponse>({
    projects: [],
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalBudget: 0,
    spentBudget: 0,
    openTasks: 0,
    openRFIs: 0,
    openSafetyIncidents: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cancelledRef = { current: false };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet<DashboardDataResponse>('/dashboard-data/overview');
      if (cancelledRef.current) return;
      setData(result);
    } catch (err) {
      if (cancelledRef.current) return;
      setError(
        err instanceof Error ? err : new Error('Failed to fetch dashboard data')
      );
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const cancelledRef = { current: false };
    fetchData();
    return () => { cancelledRef.current = true; };
  }, []);

  return { ...data, loading, error, refetch: fetchData };
}

// Standalone function for fetching dashboard data
export async function fetchDashboardData(): Promise<DashboardDataResponse> {
  return apiGet<DashboardDataResponse>('/dashboard-data/overview');
}
