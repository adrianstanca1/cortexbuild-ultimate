'use client';

import Link from 'next/link';
import { useProjects } from '@/lib/hooks/useProjects';
import { formatDistanceToNow } from 'date-fns';
import { FolderIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const statusColors: Record<string, string> = {
  PLANNING: 'bg-purple-100 text-purple-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-orange-100 text-orange-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function RecentProjects() {
  const { data, isLoading } = useProjects({ pageSize: 5 });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const projects = data?.projects || [];

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h3>
        <p className="text-gray-500 text-sm">No projects yet. Create your first project to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
        <Link
          href="/dashboard/projects"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View all <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {projects.map(project => (
          <Link
            key={project.id}
            href={`/dashboard/projects/${project.id}`}
            className="block p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FolderIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{project.name}</h4>
                  {project.description && (
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                    {project.budget && (
                      <span className="text-xs text-gray-500">
                        Budget: ${project.budget.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
