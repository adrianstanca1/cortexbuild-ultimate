import React from 'react';
import { FolderOpen, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';

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
  const projectsResult = useProjects({ pageSize: 100 });
  const tasksResult = useTasks({ pageSize: 100 });

  // Compute stats directly from data (no need for useState/useEffect)
  const projects = projectsResult.projects || [];
  const tasks = tasksResult.tasks || [];

  const activeProjects = projects.filter((p: typeof projectsResult.projects[number]) => p.status === 'IN_PROGRESS' || p.status === 'ACTIVE').length;
  const completedTasks = tasks.filter((t: typeof tasksResult.tasks[number]) => t.status === 'COMPLETED').length;
  const pendingTasks = tasks.filter((t: typeof tasksResult.tasks[number]) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const overdueTasks = tasks.filter((t: typeof tasksResult.tasks[number]) => {
    if (!t.dueDate || t.status === 'COMPLETED') return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  const stats = { activeProjects, completedTasks, pendingTasks, overdueTasks };

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
