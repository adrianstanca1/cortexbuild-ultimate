// Module: Projects — CortexBuild Ultimate
import { useState } from 'react';
import { Plus, MapPin, Users, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { projects } from '../../data/mockData';
import type { ProjectStatus } from '../../types';
import clsx from 'clsx';

export function Projects() {
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const statusConfig: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
    active: { label: 'Active', color: 'text-green-400', bg: 'bg-green-500/20 border-green-600' },
    planning: { label: 'Planning', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-600' },
    on_hold: { label: 'On Hold', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-600' },
    completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-600' },
    archived: { label: 'Archived', color: 'text-gray-400', bg: 'bg-gray-700 border-gray-600' }
  };

  const statusCounts: Record<string, number> = {
    all: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    planning: projects.filter(p => p.status === 'planning').length,
    on_hold: projects.filter(p => p.status === 'on_hold').length,
    completed: projects.filter(p => p.status === 'completed').length
  };

  const filteredProjects = filter === 'all' ? projects : projects.filter(p => p.status === filter);
  const selectedProjectData = projects.find(p => p.id === selectedProject);

  const chartData = filteredProjects.map(p => ({
    name: p.name.split(' ').slice(0, 2).join(' '),
    progress: p.progress,
    budget: p.budget / 1000000,
    spent: p.spent / 1000000
  }));

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Projects</h1>
        <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-blue-600">
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Status Pills */}
      <div className="mb-6 flex gap-3">
        {['all', 'active', 'planning', 'on_hold', 'completed'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status as ProjectStatus | 'all')}
            className={clsx(
              'rounded-full px-4 py-2 text-sm font-semibold transition-all',
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            )}
          >
            {status === 'all' ? 'All' : statusConfig[status as ProjectStatus]?.label}
            <span className="ml-2 text-xs font-medium">
              ({status === 'all' ? statusCounts.all : statusCounts[status as ProjectStatus] || 0})
            </span>
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        {filteredProjects.map(proj => {
          const config = statusConfig[proj.status];
          return (
            <div
              key={proj.id}
              onClick={() => setSelectedProject(proj.id)}
              className={clsx(
                'cursor-pointer rounded-2xl border border-gray-800 bg-gray-900 p-5',
                'transition-all duration-300 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-500/10',
                'relative overflow-hidden',
                selectedProject === proj.id && 'border-blue-600 ring-2 ring-blue-500/50'
              )}
            >
              <div className={clsx('absolute top-0 left-0 h-1 w-full', config.bg)} />

              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{proj.name}</h3>
                  <p className="text-xs text-gray-400">{proj.client}</p>
                </div>
                <span className={clsx('rounded-full px-2.5 py-1 text-xs font-bold', config.bg, config.color)}>
                  {config.label}
                </span>
              </div>

              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Progress</span>
                  <span className="font-bold text-blue-400">{proj.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="mb-2 text-xs text-gray-400">Budget</div>
                <div className="h-2 w-full rounded-full bg-gray-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: `${Math.min((proj.spent / proj.budget) * 100, 100)}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>£{(proj.spent / 1000000).toFixed(2)}M</span>
                  <span>£{(proj.budget / 1000000).toFixed(2)}M</span>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-4 border-t border-gray-800 pt-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span className="text-gray-400">{proj.workers} workers</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <MapPin className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-400">{proj.location}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 rounded-lg bg-gray-800 py-1.5 text-xs font-medium text-white transition hover:bg-gray-700">
                  Details
                </button>
                <button className="flex-1 rounded-lg bg-gray-800 py-1.5 text-xs font-medium text-white transition hover:bg-gray-700">
                  RFI
                </button>
                <button className="flex-1 rounded-lg bg-gray-800 py-1.5 text-xs font-medium text-white transition hover:bg-gray-700">
                  Report
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Chart */}
      {filteredProjects.length > 0 && (
        <div className="mb-8 rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Progress Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} />
              <Legend />
              <Bar dataKey="progress" fill="#3b82f6" />
              <Bar dataKey="spent" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detail Modal */}
      {selectedProjectData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">{selectedProjectData.name}</h2>
              <button
                onClick={() => setSelectedProject(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="rounded-lg bg-gray-800/50 p-3">
                <p className="text-xs text-gray-400">Status</p>
                <p className="mt-1 font-semibold text-white">{statusConfig[selectedProjectData.status].label}</p>
              </div>
              <div className="rounded-lg bg-gray-800/50 p-3">
                <p className="text-xs text-gray-400">Progress</p>
                <p className="mt-1 font-semibold text-blue-400">{selectedProjectData.progress}%</p>
              </div>
              <div className="rounded-lg bg-gray-800/50 p-3">
                <p className="text-xs text-gray-400">Budget</p>
                <p className="mt-1 font-semibold text-white">£{(selectedProjectData.budget / 1000000).toFixed(1)}M</p>
              </div>
              <div className="rounded-lg bg-gray-800/50 p-3">
                <p className="text-xs text-gray-400">Spent</p>
                <p className="mt-1 font-semibold text-orange-400">£{(selectedProjectData.spent / 1000000).toFixed(1)}M</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400">Client</p>
                <p className="mt-1 text-white">{selectedProjectData.client}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400">Location</p>
                <p className="mt-1 text-white">{selectedProjectData.location}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400">Manager</p>
                <p className="mt-1 text-white">{selectedProjectData.manager}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400">Workers</p>
                <p className="mt-1 text-white">{selectedProjectData.workers}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedProject(null)}
                className="flex-1 rounded-lg bg-gray-800 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
              >
                Close
              </button>
              <button className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-500">
                Edit Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
