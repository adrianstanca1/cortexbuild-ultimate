import React, { useMemo } from 'react';
import { FolderOpen, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useProjects, useProjectTasks } from '../../hooks/useData';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color: 'blue' | 'green' | 'yellow' | 'red';
}

function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          {trend && (
            <p className={`mt-1 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function QuickStats() {
  const { data: projects } = useProjects.useList();
  const { data: tasks } = useProjectTasks.useList();

  // Compute stats directly from data (no need for useState/useEffect)
  const projectList = (projects || []) as { status?: string }[];
  const taskList = (tasks || []) as { status?: string; dueDate?: string }[];

  // ⚡ Bolt Performance Optimization
  // Replaced multiple O(n) array `.filter().length` passes that created intermediate arrays
  // with a single O(n) loop calculating all metrics directly.
  // We use `projects` and `tasks` in the dependency array directly to avoid reference instability from the `|| []` fallback.
  const stats = useMemo(() => {
    let activeProjects = 0;
    let completedTasks = 0;
    let pendingTasks = 0;
    let overdueTasks = 0;

    // Cache Date.now() instead of repeatedly instantiating `new Date()` inside the loop
    const now = Date.now();

    for (let i = 0; i < projectList.length; i++) {
      const status = projectList[i].status;
      if (status === 'IN_PROGRESS' || status === 'ACTIVE') {
        activeProjects++;
      }
    }

    for (let i = 0; i < taskList.length; i++) {
      const t = taskList[i];
      const status = t.status;

      if (status === 'COMPLETED') {
        completedTasks++;
      } else {
        if (status === 'PENDING' || status === 'IN_PROGRESS') {
          pendingTasks++;
        }
        if (t.dueDate && new Date(t.dueDate).getTime() < now) {
          overdueTasks++;
        }
      }
    }

    return { activeProjects, completedTasks, pendingTasks, overdueTasks };
  }, [projects, tasks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Active Projects"
        value={stats.activeProjects}
        icon={<FolderOpen className="w-6 h-6" />}
        color="blue"
        trend={{ value: 12, isPositive: true }}
      />
      <StatCard
        title="Completed Tasks"
        value={stats.completedTasks}
        icon={<CheckCircle className="w-6 h-6" />}
        color="green"
        trend={{ value: 8, isPositive: true }}
      />
      <StatCard
        title="Pending Tasks"
        value={stats.pendingTasks}
        icon={<Clock className="w-6 h-6" />}
        color="yellow"
      />
      <StatCard
        title="Overdue Tasks"
        value={stats.overdueTasks}
        icon={<AlertTriangle className="w-6 h-6" />}
        color="red"
      />
    </div>
  );
}
