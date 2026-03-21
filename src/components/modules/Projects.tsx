// Module: Projects — CortexBuild Ultimate (Real Data)
import { useState } from 'react';
import { Plus, MapPin, Users, X, Loader2, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useProjects } from '../../hooks/useData';
import type { ProjectStatus } from '../../types';
import clsx from 'clsx';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Active',    color: 'text-green-400',  bg: 'bg-green-500/20 border border-green-600' },
  planning:  { label: 'Planning',  color: 'text-blue-400',   bg: 'bg-blue-500/20 border border-blue-600' },
  on_hold:   { label: 'On Hold',   color: 'text-yellow-400', bg: 'bg-yellow-500/20 border border-yellow-600' },
  completed: { label: 'Completed', color: 'text-emerald-400',bg: 'bg-emerald-500/20 border border-emerald-600' },
  archived:  { label: 'Archived',  color: 'text-gray-400',   bg: 'bg-gray-700 border border-gray-600' },
};

const defaultForm = {
  name: '', client: '', location: '', type: '', manager: '',
  budget: '', contract_value: '', workers: '0',
  start_date: '', end_date: '', status: 'planning', phase: 'Pre-construction', description: '',
};

type FormData = typeof defaultForm;

type AnyRow = Record<string, unknown>;

export function Projects() {
  const { useList, useCreate, useUpdate, useDelete } = useProjects;
  const { data: rawProjects = [], isLoading, refetch } = useList();
  const projects = rawProjects as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<FormData>(defaultForm);

  const filtered = filter === 'all' ? projects : projects.filter(p => String(p.status) === filter);
  const selected = projects.find(p => String(p.id) === selectedId);

  const counts: Record<string, number> = {
    all: projects.length,
    active:    projects.filter(p => p.status === 'active').length,
    planning:  projects.filter(p => p.status === 'planning').length,
    on_hold:   projects.filter(p => p.status === 'on_hold').length,
    completed: projects.filter(p => p.status === 'completed').length,
  };

  const chartData = filtered.map(p => ({
    name: String(p.name ?? '').split(' ').slice(0, 2).join(' '),
    progress: Number(p.progress) || 0,
    budget: +((Number(p.budget) || 0) / 1_000_000).toFixed(2),
    spent: +((Number(p.spent) || 0) / 1_000_000).toFixed(2),
  }));

  const openCreate = () => { setForm(defaultForm); setEditMode(false); setShowModal(true); };
  const openEdit = (p: Record<string, unknown>) => {
    setForm({
      name: String(p.name ?? ''), client: String(p.client ?? ''), location: String(p.location ?? ''),
      type: String(p.type ?? ''), manager: String(p.manager ?? ''),
      budget: String(p.budget ?? ''), contract_value: String(p.contract_value ?? p.contractValue ?? ''),
      workers: String(p.workers ?? '0'), start_date: String(p.start_date ?? p.startDate ?? ''),
      end_date: String(p.end_date ?? p.endDate ?? ''), status: String(p.status ?? 'planning'),
      phase: String(p.phase ?? ''), description: String(p.description ?? ''),
    });
    setEditMode(true);
    setSelectedId(String(p.id));
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      budget: Number(form.budget),
      contract_value: Number(form.contract_value),
      workers: Number(form.workers),
      spent: 0,
      progress: 0,
    };
    if (editMode && selectedId) {
      await updateMutation.mutateAsync({ id: selectedId, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setShowModal(false);
    setSelectedId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await deleteMutation.mutateAsync(id);
    setSelectedId(null);
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-sm text-gray-400 mt-1">{projects.length} total · {counts.active} active</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white hover:from-blue-500 hover:to-blue-600 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Status filters */}
      <div className="mb-6 flex gap-3 flex-wrap">
        {(['all', 'active', 'planning', 'on_hold', 'completed'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={clsx(
              'rounded-full px-4 py-1.5 text-sm font-semibold transition-all',
              filter === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            )}
          >
            {s === 'all' ? 'All' : statusConfig[s]?.label}
            <span className="ml-2 text-xs opacity-70">({counts[s] ?? 0})</span>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Projects Grid */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((proj: Record<string, unknown>) => {
          const config = statusConfig[String(proj.status)] ?? statusConfig.planning;
          const budget = Number(proj.budget) || 0;
          const spent = Number(proj.spent) || 0;
          const progress = Number(proj.progress) || 0;
          return (
            <div
              key={String(proj.id)}
              onClick={() => setSelectedId(String(proj.id))}
              className={clsx(
                'cursor-pointer rounded-2xl border border-gray-800 bg-gray-900 p-5 relative overflow-hidden',
                'transition-all duration-300 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-500/10',
                selectedId === proj.id && 'border-blue-600 ring-2 ring-blue-500/30'
              )}
            >
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-60" />

              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-semibold text-white truncate">{String(proj.name)}</h3>
                  <p className="text-xs text-gray-400">{String(proj.client)}</p>
                </div>
                <span className={clsx('rounded-full px-2.5 py-1 text-xs font-bold shrink-0', config.bg, config.color)}>
                  {config.label}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-400">Progress</span>
                  <span className="font-bold text-blue-400">{progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-700">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Budget bar */}
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-400">Budget</span>
                  <span className="text-gray-400">£{(spent/1e6).toFixed(2)}M / £{(budget/1e6).toFixed(2)}M</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-700">
                  <div
                    className={clsx('h-full rounded-full', spent/budget > 0.9 ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-orange-500')}
                    style={{ width: `${Math.min((spent/budget)*100 || 0, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-purple-400" />{String(proj.workers ?? 0)}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-400" />{String(proj.location ?? '—')}</span>
                <span className="text-gray-600">·</span>
                <span>{String(proj.type ?? '')}</span>
              </div>

              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => openEdit(proj)}
                  className="flex-1 rounded-lg bg-gray-800 py-1.5 text-xs font-medium text-white hover:bg-gray-700 flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(String(proj.id))}
                  className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/20"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {!isLoading && filtered.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 text-gray-500">
            <p className="text-lg font-medium">No projects found</p>
            <button onClick={openCreate} className="mt-4 text-sm text-blue-400 hover:text-blue-300">
              + Create your first project
            </button>
          </div>
        )}
      </div>

      {/* Chart */}
      {filtered.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Progress & Budget Overview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="progress" name="Progress %" fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="budget"   name="Budget £M"  fill="#8b5cf6" radius={[4,4,0,0]} />
              <Bar dataKey="spent"    name="Spent £M"   fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 p-6 my-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{editMode ? 'Edit Project' : 'New Project'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {[
                { label: 'Project Name', key: 'name', required: true },
                { label: 'Client', key: 'client', required: true },
                { label: 'Location', key: 'location' },
                { label: 'Type', key: 'type', placeholder: 'Commercial, Residential...' },
                { label: 'Project Manager', key: 'manager' },
                { label: 'Phase', key: 'phase' },
                { label: 'Budget (£)', key: 'budget', type: 'number' },
                { label: 'Contract Value (£)', key: 'contract_value', type: 'number' },
                { label: 'Workers', key: 'workers', type: 'number' },
              ].map(f => (
                <div key={f.key} className={f.key === 'name' ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-400 mb-1">{f.label}</label>
                  <input
                    type={f.type ?? 'text'}
                    required={f.required}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof FormData]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {Object.keys(statusConfig).map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Start Date</label>
                <input type="date" value={form.start_date} onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">End Date</label>
                <input type="date" value={form.end_date} onChange={e => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none" />
              </div>

              <div className="col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl bg-gray-800 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-700">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-2">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editMode ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail slide-out */}
      {selected && !showModal && (() => {
        const s = selected as AnyRow;
        return (
          <div className="fixed inset-0 z-40 flex" onClick={() => setSelectedId(null)}>
            <div className="flex-1" />
            <div className="w-full max-w-md bg-gray-900 border-l border-gray-700 p-6 overflow-y-auto shadow-2xl"
                 onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white truncate pr-2">{String(s.name ?? '')}</h2>
                <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Client', s.client], ['Status', statusConfig[String(s.status)]?.label],
                  ['Location', s.location], ['Type', s.type],
                  ['Manager', s.manager], ['Phase', s.phase],
                  ['Workers', s.workers], ['Progress', `${s.progress}%`],
                  ['Budget', `£${(Number(s.budget)/1e6).toFixed(2)}M`],
                  ['Spent', `£${(Number(s.spent)/1e6).toFixed(2)}M`],
                  ['Start Date', s.start_date ?? s.startDate],
                  ['End Date', s.end_date ?? s.endDate],
                ].map(([k, v]) => (
                  <div key={String(k)} className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">{String(k)}</p>
                    <p className="mt-1 font-medium text-white">{String(v ?? '—')}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => openEdit(s)}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 flex items-center justify-center gap-2">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => handleDelete(String(s.id))}
                  className="rounded-xl bg-red-900/30 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-900/50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
