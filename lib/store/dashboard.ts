import { create } from 'zustand';

interface Project {
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

interface DashboardState {
  projects: Project[];
  loading: boolean;
  setProjects: (projects: Project[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  projects: [
    { id: '1', name: 'Metro Station Extension', status: 'IN_PROGRESS', location: 'London', budget: 2500000, tasksCount: 45, openRFIs: 3 },
    { id: '2', name: 'Office Complex Tower', status: 'IN_PROGRESS', location: 'Manchester', budget: 5200000, tasksCount: 78, openRFIs: 7 },
    { id: '3', name: 'Residential Development', status: 'PLANNING', location: 'Birmingham', budget: 1800000, tasksCount: 12, openRFIs: 0 },
    { id: '4', name: 'Hospital Wing Renovation', status: 'ON_HOLD', location: 'Bristol', budget: 950000, tasksCount: 23, openRFIs: 2 },
  ],
  loading: false,
  setProjects: (projects) => set({ projects }),
  setLoading: (loading) => set({ loading }),
}));
