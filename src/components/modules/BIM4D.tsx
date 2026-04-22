/**
 * BIM4D — 4D BIM time-linked construction sequence viewer.
 * Uses bim4dApi from services/api.ts.
 * Shows construction phases overlaid on a timeline scrubber.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Play, Pause, SkipBack, ChevronLeft, ChevronRight,
  Calendar, Clock, Layers, Plus
} from 'lucide-react';
import { bim4dApi } from '../../services/api';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { EmptyState } from '../ui/EmptyState';
import { toast } from 'sonner';

type BIM4DModel = {
  id: string;
  project_id: string;
  project_name?: string;
  name: string;
  description?: string;
  model_url?: string;
  thumbnail_url?: string;
  ifc_version?: string;
  simulation_start?: string;
  simulation_end?: string;
  phase?: string;
  status: string;
  task_count?: number;
};

type BIM4DTask = {
  id: string;
  model_id: string;
  task_id: string;
  task_name?: string;
  element_ids: string[];
  start_date?: string;
  end_date?: string;
  colour?: string;
  percent_complete?: number;
};

const PHASE_COLOURS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
];

export function BIM4D() {
  const [models, setModels] = useState<BIM4DModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<BIM4DModel | null>(null);
  const [tasks, setTasks] = useState<BIM4DTask[]>([]);
  const [, setTasksLoading] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [form, setForm] = useState({
    name: '', project_id: 'demo-project', description: '',
    model_url: '', simulation_start: '', simulation_end: '',
  });

  const fetchModels = useCallback(async () => {
    try {
      const res = await bim4dApi.getProjectModels('demo-project');
      const data = Array.isArray(res.data) ? res.data : [];
      setModels(data);
      if (data.length > 0) {
        setSelectedModel(data[0]);
      }
    } catch {
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  useEffect(() => {
    if (!selectedModel) return;
    setTasksLoading(true);
    bim4dApi.getTasks(selectedModel.id)
      .then(res => setTasks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setTasks([]))
      .finally(() => setTasksLoading(false));
  }, [selectedModel]);

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying || tasks.length === 0) return;
    const interval = setInterval(() => {
      setCurrentPhaseIndex(i => (i + 1) % Math.max(tasks.length, 1));
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying, tasks.length]);

  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bim4dApi.create({
        project_id: form.project_id,
        name: form.name,
        description: form.description,
        model_url: form.model_url || undefined,
        simulation_start: form.simulation_start || undefined,
        simulation_end: form.simulation_end || undefined,
      });
      toast.success('4D model created');
      setShowModelModal(false);
      fetchModels();
    } catch {
      toast.error('Failed to create 4D model');
    }
  };

  const fmtDate = (d: string | undefined) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const totalDays = selectedModel?.simulation_start && selectedModel?.simulation_end
    ? Math.round((new Date(selectedModel.simulation_end).getTime() - new Date(selectedModel.simulation_start).getTime()) / 86400000)
    : 0;

  const getTaskPosition = (task: BIM4DTask) => {
    if (!selectedModel?.simulation_start || !selectedModel?.simulation_end || !task.start_date) return { left: 0, width: 0 };
    const start = new Date(selectedModel.simulation_start).getTime();
    const end = new Date(selectedModel.simulation_end).getTime();
    const taskStart = new Date(task.start_date).getTime();
    const taskEnd = task.end_date ? new Date(task.end_date).getTime() : taskStart;
    const total = end - start;
    const left = ((taskStart - start) / total) * 100;
    const width = ((taskEnd - taskStart) / total) * 100;
    return { left: Math.max(0, left), width: Math.min(100 - left, width) };
  };

  const getPhaseColour = (index: number) => PHASE_COLOURS[index % PHASE_COLOURS.length];

  return (
    <>
      <ModuleBreadcrumbs currentModule="bim-4d" onNavigate={() => {}} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Box size={20} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-display text-white">4D BIM</h1>
              <p className="text-sm text-gray-400">Time-linked construction sequence viewer</p>
            </div>
          </div>
          <button
            onClick={() => setShowModelModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            <Plus size={16} /> New 4D Model
          </button>
        </div>

        {/* Model Selector */}
        {models.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {models.map(m => (
              <button
                key={m.id}
                onClick={() => { setSelectedModel(m); setCurrentPhaseIndex(0); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedModel?.id === m.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>
        ) : models.length === 0 ? (
          <EmptyState
            icon={Box}
            title="No 4D models configured"
            description="Create a 4D BIM model to view the construction sequence timeline."
          />
        ) : (
          <>
            {/* Model Info */}
            {selectedModel && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    {selectedModel.thumbnail_url ? (
                      <img src={selectedModel.thumbnail_url} alt={selectedModel.name} className="w-16 h-16 rounded-lg object-cover bg-gray-800" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <Box size={24} className="text-indigo-400" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-semibold text-white">{selectedModel.name}</h2>
                      <p className="text-sm text-gray-400">{selectedModel.description || 'No description'}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        {selectedModel.simulation_start && (
                          <span className="flex items-center gap-1"><Calendar size={10} /> {fmtDate(selectedModel.simulation_start)}</span>
                        )}
                        {totalDays > 0 && (
                          <span className="flex items-center gap-1"><Clock size={10} /> {totalDays} days</span>
                        )}
                        {selectedModel.task_count !== undefined && (
                          <span className="flex items-center gap-1"><Layers size={10} /> {selectedModel.task_count} tasks</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPhaseIndex(0)}
                      className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors"
                      title="Reset"
                    >
                      <SkipBack size={16} />
                    </button>
                    <button
                      onClick={() => setCurrentPhaseIndex(i => Math.max(0, i - 1))}
                      disabled={currentPhaseIndex === 0}
                      className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors disabled:opacity-30"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setIsPlaying(p => !p)}
                      className={`p-2 rounded-lg transition-colors ${isPlaying ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-400'}`}
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                      onClick={() => setCurrentPhaseIndex(i => Math.min(tasks.length - 1, i + 1))}
                      disabled={currentPhaseIndex >= tasks.length - 1}
                      className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors disabled:opacity-30"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            {tasks.length > 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers size={14} className="text-indigo-400" />
                    Construction Timeline — Phase {currentPhaseIndex + 1} of {tasks.length}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {tasks[currentPhaseIndex]?.task_name || 'Unknown phase'}
                  </p>
                </div>

                {/* Gantt Bars */}
                <div className="relative p-6">
                  {/* Phase labels */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {tasks.map((task, i) => {
                      const colour = task.colour || getPhaseColour(i);
                      return (
                        <button
                          key={task.id}
                          onClick={() => setCurrentPhaseIndex(i)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            currentPhaseIndex === i
                              ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900'
                              : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: colour + '30', color: colour, borderColor: colour + '60' }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: colour }}
                          />
                          {task.task_name || `Phase ${i + 1}`}
                        </button>
                      );
                    })}
                  </div>

                  {/* Gantt bars */}
                  <div className="relative h-12 bg-gray-800/50 rounded-lg overflow-hidden">
                    {/* Grid lines */}
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l border-gray-700/50"
                        style={{ left: `${i * 10}%` }}
                      />
                    ))}
                    {/* Task bars */}
                    {tasks.map((task, i) => {
                      const pos = getTaskPosition(task);
                      const colour = task.colour || getPhaseColour(i);
                      const isActive = currentPhaseIndex === i;
                      return (
                        <div
                          key={task.id}
                          className={`absolute top-2 bottom-2 rounded transition-all duration-300 cursor-pointer hover:brightness-110 ${
                            isActive ? 'ring-2 ring-white' : ''
                          }`}
                          style={{
                            left: `${pos.left}%`,
                            width: `${Math.max(pos.width, 2)}%`,
                            backgroundColor: colour,
                            opacity: isActive ? 1 : 0.5,
                          }}
                          onClick={() => setCurrentPhaseIndex(i)}
                          title={`${task.task_name || 'Phase'}: ${task.start_date || ''} → ${task.end_date || ''}`}
                        />
                      );
                    })}
                  </div>

                  {/* Date labels */}
                  {selectedModel && (
                    <div className="flex justify-between text-xs text-gray-600 mt-1 px-1">
                      <span>{fmtDate(selectedModel.simulation_start)}</span>
                      <span>{fmtDate(selectedModel.simulation_end)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Phase Detail */}
            {tasks.length > 0 && currentPhaseIndex < tasks.length && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-4 h-4 rounded mt-0.5 flex-shrink-0"
                    style={{ backgroundColor: tasks[currentPhaseIndex].colour || getPhaseColour(currentPhaseIndex) }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {tasks[currentPhaseIndex].task_name || `Phase ${currentPhaseIndex + 1}`}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>{fmtDate(tasks[currentPhaseIndex].start_date)}</span>
                      <span>→</span>
                      <span>{fmtDate(tasks[currentPhaseIndex].end_date)}</span>
                      {tasks[currentPhaseIndex].element_ids.length > 0 && (
                        <span>{tasks[currentPhaseIndex].element_ids.length} elements</span>
                      )}
                    </div>
                  </div>
                  {tasks[currentPhaseIndex].percent_complete !== undefined && (
                    <div className="ml-auto flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${tasks[currentPhaseIndex].percent_complete}%`,
                            backgroundColor: tasks[currentPhaseIndex].colour || getPhaseColour(currentPhaseIndex),
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{tasks[currentPhaseIndex].percent_complete}%</span>
                    </div>
                  )}
                </div>

                {selectedModel?.model_url && (
                  <div className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-center h-48">
                    <div className="text-center">
                      <Box size={32} className="mx-auto mb-2 text-gray-600" />
                      <p className="text-sm text-gray-500">IFC Viewer — connect to BIMViewer for full 3D view</p>
                      <a href={selectedModel.model_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline mt-1 block">
                        Open model file
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Task Table */}
            {tasks.length > 0 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                  <h3 className="text-sm font-semibold text-white">All Phases</h3>
                </div>
                <div className="cb-table-scroll touch-pan-x">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800/50 border-b border-gray-800">
                      <tr>
                        {['Phase', 'Task Name', 'Start', 'End', 'Duration', 'Elements', 'Progress'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-display text-gray-500 tracking-widest uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {tasks.map((task, i) => {
                        const days = task.start_date && task.end_date
                          ? Math.round((new Date(task.end_date).getTime() - new Date(task.start_date).getTime()) / 86400000)
                          : null;
                        const colour = task.colour || getPhaseColour(i);
                        return (
                          <tr
                            key={task.id}
                            className={`hover:bg-gray-800/30 cursor-pointer ${currentPhaseIndex === i ? 'bg-gray-800/50' : ''}`}
                            onClick={() => setCurrentPhaseIndex(i)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: colour }} />
                                <span className="text-gray-400">{i + 1}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-white font-medium">{task.task_name || '—'}</td>
                            <td className="px-4 py-3 text-gray-400">{fmtDate(task.start_date)}</td>
                            <td className="px-4 py-3 text-gray-400">{fmtDate(task.end_date)}</td>
                            <td className="px-4 py-3 text-gray-400">{days !== null ? `${days}d` : '—'}</td>
                            <td className="px-4 py-3 text-gray-400">{task.element_ids.length}</td>
                            <td className="px-4 py-3">
                              {task.percent_complete !== undefined ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${task.percent_complete}%`, backgroundColor: colour }} />
                                  </div>
                                  <span className="text-xs text-gray-400">{task.percent_complete}%</span>
                                </div>
                              ) : <span className="text-gray-600">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Create Model Modal */}
        {showModelModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700">
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h2 className="text-lg font-semibold text-white">New 4D Model</h2>
                <button onClick={() => setShowModelModal(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><Plus size={18} /></button>
              </div>
              <form onSubmit={handleCreateModel} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Model Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Canary Wharf Phase 1"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Project ID *</label>
                  <input
                    value={form.project_id}
                    onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                    placeholder="proj_xxxxx"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Sim Start</label>
                    <input
                      type="date"
                      value={form.simulation_start}
                      onChange={e => setForm(f => ({ ...f, simulation_start: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Sim End</label>
                    <input
                      type="date"
                      value={form.simulation_end}
                      onChange={e => setForm(f => ({ ...f, simulation_end: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModelModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default BIM4D;
