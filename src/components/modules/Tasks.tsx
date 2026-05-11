import React, { useState, useMemo, useCallback } from 'react';
import {
  LayoutKanban, List as ListIcon, Calendar, Plus, Search, X, Edit2, Trash2,
  CheckSquare, Square, Clock, CalendarDays, Repeat, FileText, Copy,
  AlertTriangle, ChevronDown, Link2, MoreHorizontal, CheckCircle2, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { useTasks } from '../../hooks/useData';
import { tasksApi } from '../../services/api';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { EmptyState } from '../ui/EmptyState';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

type AnyRow = Record<string, unknown>;

type ViewMode = 'kanban' | 'list' | 'calendar' | 'templates' | 'recurring' | 'analytics';

const STATUSES = ['todo', 'in_progress', 'review', 'done', 'blocked'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done', blocked: 'Blocked'
};
const STATUS_BG: Record<string, string> = {
  todo: 'bg-gray-800 border-gray-700',
  in_progress: 'bg-blue-900/20 border-blue-800',
  review: 'bg-purple-900/20 border-purple-800',
  done: 'bg-green-900/20 border-green-800',
  blocked: 'bg-red-900/20 border-red-800',
};
const STATUS_DOT: Record<string, string> = {
  todo: 'bg-gray-400', in_progress: 'bg-blue-400', review: 'bg-purple-400',
  done: 'bg-green-400', blocked: 'bg-red-400'
};
const PRIORITY_COLOR: Record<string, string> = {
  low: 'text-green-400', medium: 'text-yellow-400', high: 'text-orange-400', critical: 'text-red-400'
};

const emptyForm = {
  title: '', description: '', status: 'todo' as string,
  priority: 'medium' as string, assigned_to: '', due_date: '',
  category: 'general', estimated_hours: '', tags: '', project_id: ''
};

const emptyRecurring = {
  title: '', description: '', frequency: 'weekly' as string,
  interval_count: '1', next_run_date: '', end_date: '',
  assigned_to: '', category: 'general', estimated_hours: '', project_id: ''
};

const emptyTemplate = {
  name: '', title_pattern: '', description_template: '',
  category: 'general', estimated_hours: ''
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

/* ─── Date helpers ─── */
function isoDate(d: Date) { return d.toISOString().split('T')[0]; }
function addDays(d: string | Date, days: number) {
  const x = new Date(d); x.setDate(x.getDate()+days); return isoDate(x);
}
function nextDate(frequency: string, base: string) {
  const map: Record<string,number> = { daily:1, weekly:7, monthly:30, quarterly:90, yearly:365 };
  return addDays(base, map[frequency] || 7);
}

/* ─── Component ─── */
export default function TasksModule() {
  const { useList, useCreate, useUpdate, useDelete } = useTasks;
  const { data: raw = [], isLoading, refetch } = useList();
  const allTasks = raw as AnyRow[];

  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [view, setView] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const [showSubtasks, setShowSubtasks] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [subtaskForm, setSubtaskForm] = useState({ title: '', done: false });
  const [subtasks, setSubtasks] = useState<AnyRow[]>([]);

  const [showDeps, setShowDeps] = useState(false);
  const [deps, setDeps] = useState<AnyRow[]>([]);
  const [depForm, setDepForm] = useState('');

  // Recurring
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recForm, setRecForm] = useState({ ...emptyRecurring });
  const [recurringTasks, setRecurringTasks] = useState<AnyRow[]>([]);

  // Templates
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({ ...emptyTemplate });
  const [templates, setTemplates] = useState<AnyRow[]>([]);

  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  /* ─── Load side data ─── */
  React.useEffect(() => {
    tasksApi.getRecurringTasks().then(data => setRecurringTasks(data as AnyRow[])).catch(()=>{});
    tasksApi.getTemplates().then(data => setTemplates(data as AnyRow[])).catch(()=>{});
  }, []);

  /* ─── Filters ─── */
  const tasks = useMemo(() => {
    return allTasks.filter(t => {
      if (search && !String(t.title??'').toLowerCase().includes(search.toLowerCase()) && !String(t.description??'').toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [allTasks, search, statusFilter, priorityFilter]);

  const byStatus = useMemo(() => {
    return STATUSES.reduce((acc, s) => {
      acc[s] = tasks.filter(t => t.status === s);
      return acc;
    }, {} as Record<string, AnyRow[]>);
  }, [tasks]);

  /* ─── Calendar buckets ─── */
  const calendarBuckets = useMemo(() => {
    const today = isoDate(new Date());
    const buckets: Record<string, AnyRow[]> = { [today]: [] };
    tasks.forEach(t => {
      const d = t.due_date ? String(t.due_date).split('T')[0] : '';
      if (!d) return;
      if (!buckets[d]) buckets[d] = [];
      buckets[d].push(t);
    });
    return buckets;
  }, [tasks]);

  /* ─── Analytics ─── */
  const analytics = useMemo(() => {
    const total = tasks.length;
    const doneCount = tasks.filter(t => t.status === 'done').length;
    const overdue = tasks.filter(t => t.due_date && t.status !== 'done' && String(t.due_date).split('T')[0] < isoDate(new Date())).length;
    const statsByStatus = STATUSES.map(s => ({ name: STATUS_LABELS[s], value: tasks.filter(t => t.status === s).length }));
    const byPriority = PRIORITIES.map(p => ({ name: p, value: tasks.filter(t => t.priority === p).length }));
    return { total, doneCount, overdue, statsByStatus, byPriority };
  }, [tasks]);

  /* ─── Actions ─── */
  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const payload = {
      ...form,
      estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
      project_id: form.project_id || null,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: String(editing.id), data: payload });
        toast.success('Task updated');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Task created');
      }
      setShowModal(false); setEditing(null); setForm({ ...emptyForm }); refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Save failed');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this task?')) return;
    await deleteMutation.mutateAsync(id);
    toast.success('Task deleted'); refetch();
  }

  async function moveStatus(id: string, newStatus: string) {
    await updateMutation.mutateAsync({ id, data: { status: newStatus } });
    refetch();
    toast.success(`Moved to ${STATUS_LABELS[newStatus]}`);
  }

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} tasks?`)) return;
    await Promise.all(ids.map(id => deleteMutation.mutateAsync(id)));
    toast.success(`Deleted ${ids.length} tasks`);
    clearSelection(); refetch();
  }

  async function handleBulkStatus(ids: string[], status: string) {
    await Promise.all(ids.map(id => updateMutation.mutateAsync({ id, data: { status } })));
    toast.success(`Updated ${ids.length} tasks to ${STATUS_LABELS[status]}`);
    clearSelection(); refetch();
  }

  function openCreate() {
    setEditing(null); setForm({ ...emptyForm }); setShowModal(true); setShowSubtasks(false); setShowDeps(false);
  }
  function openEdit(t: AnyRow) {
    setEditing(t);
    setForm({
      title: String(t.title??''), description: String(t.description??''), status: String(t.status??'todo'),
      priority: String(t.priority??'medium'), assigned_to: String(t.assigned_to??''), due_date: String(t.due_date??'').split('T')[0],
      category: String(t.category??'general'), estimated_hours: String(t.estimated_hours??''), tags: String(t.tags??''),
      project_id: String(t.project_id??'')
    });
    setActiveTaskId(null); setShowModal(true); setShowSubtasks(false); setShowDeps(false);
  }

  /* ─── Subtask helpers ─── */
  async function loadSubtasks(taskId: string) {
    setActiveTaskId(taskId);
    const data = await tasksApi.getSubtasks(taskId);
    setSubtasks(data as AnyRow[]);
    setShowSubtasks(true);
  }
  async function addSubtask() {
    if (!activeTaskId || !subtaskForm.title.trim()) return;
    await tasksApi.createSubtask({ task_id: activeTaskId, title: subtaskForm.title, done: subtaskForm.done });
    toast.success('Subtask added');
    setSubtaskForm({ title: '', done: false });
    loadSubtasks(activeTaskId);
  }
  async function toggleSubtask(id: string, done: boolean) {
    await tasksApi.updateSubtask(id, { done: !done });
    if (activeTaskId) loadSubtasks(activeTaskId);
  }
  async function removeSubtask(id: string) {
    await tasksApi.deleteSubtask(id);
    if (activeTaskId) loadSubtasks(activeTaskId);
  }

  /* ─── Dependency helpers ─── */
  async function loadDeps(taskId: string) {
    setActiveTaskId(taskId);
    const data = await tasksApi.getDependencies(taskId);
    setDeps(data as AnyRow[]);
    setShowDeps(true);
  }
  async function addDep() {
    if (!activeTaskId || !depForm) return;
    const target = allTasks.find(t => String(t.id) === depForm);
    if (!target) { toast.error('Task not found'); return; }
    await tasksApi.createDependency({ task_id: activeTaskId, depends_on_id: depForm });
    toast.success('Dependency added');
    setDepForm(''); loadDeps(activeTaskId);
  }
  async function removeDep(id: string) {
    await tasksApi.deleteDependency(id);
    if (activeTaskId) loadDeps(activeTaskId);
  }

  /* ─── Recurring helpers ─── */
  async function saveRecurring() {
    try {
      const payload = { ...recForm, interval_count: Number(recForm.interval_count) || 1, estimated_hours: recForm.estimated_hours ? Number(recForm.estimated_hours) : null, project_id: recForm.project_id || null };
      await tasksApi.createRecurringTask(payload);
      toast.success('Recurring task created');
      setShowRecurringModal(false);
      setRecForm({ ...emptyRecurring });
      const data = await tasksApi.getRecurringTasks();
      setRecurringTasks(data as AnyRow[]);
    } catch (err: any) { toast.error(err?.message || 'Save failed'); }
  }
  async function deleteRecurring(id: string) {
    if (!confirm('Delete recurring task?')) return;
    await tasksApi.deleteRecurringTask(id);
    toast.success('Deleted');
    const data = await tasksApi.getRecurringTasks();
    setRecurringTasks(data as AnyRow[]);
  }

  /* ─── Template helpers ─── */
  async function saveTemplate() {
    try {
      const payload = { ...templateForm, estimated_hours: templateForm.estimated_hours ? Number(templateForm.estimated_hours) : null };
      await tasksApi.createTemplate(payload);
      toast.success('Template created');
      setShowTemplateModal(false); setTemplateForm({ ...emptyTemplate });
      const data = await tasksApi.getTemplates();
      setTemplates(data as AnyRow[]);
    } catch (err: any) { toast.error(err?.message || 'Save failed'); }
  }
  async function deleteTemplate(id: string) {
    if (!confirm('Delete template?')) return;
    await tasksApi.deleteTemplate(id);
    setTemplates(templates.filter(t => String(t.id) !== id));
    toast.success('Deleted');
  }
  function useTemplate(t: AnyRow) {
    setForm({
      ...emptyForm,
      title: String(t.title_pattern??''),
      description: String(t.description_template??''),
      category: String(t.category??'general'),
      estimated_hours: String(t.estimated_hours??''),
    });
    setEditing(null); setShowModal(true);
  }

  /* ─── Render ─── */
  return (
    <div className="space-y-6">
      <ModuleBreadcrumbs currentModule="tasks" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LayoutKanban size={24} className="text-orange-500" />
            Tasks
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage project tasks across all teams</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openCreate} className="btn btn-primary bg-orange-600 hover:bg-orange-700 border-none text-white flex items-center gap-2">
            <Plus size={18} /> New Task
          </button>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'kanban' as ViewMode, label: 'Kanban', icon: LayoutKanban },
          { key: 'list' as ViewMode, label: 'List', icon: ListIcon },
          { key: 'calendar' as ViewMode, label: 'Calendar', icon: Calendar },
          { key: 'templates' as ViewMode, label: 'Templates', icon: FileText },
          { key: 'recurring' as ViewMode, label: 'Recurring', icon: Repeat },
          { key: 'analytics' as ViewMode, label: 'Analytics', icon: TrendingUp },
        ].map(v => (
          <button key={v.key} onClick={() => setView(v.key)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${view===v.key ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
            <v.icon size={16} /> {v.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {view !== 'analytics' && view !== 'templates' && view !== 'recurring' && (
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks…" className="w-full input input-bordered pl-9 bg-gray-900 border-gray-700 text-white" />
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="select select-bordered bg-gray-900 border-gray-700 text-white">
            <option value="All">All Statuses</option>
            {STATUSES.map(s=>(<option key={s} value={s}>{STATUS_LABELS[s]}</option>))}
          </select>
          <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)} className="select select-bordered bg-gray-900 border-gray-700 text-white">
            <option value="All">All Priorities</option>
            {PRIORITIES.map(p=>(<option key={p} value={p}>{p[0].toUpperCase()+p.slice(1)}</option>))}
          </select>
        </div>
      )}

      {/* Bulk actions */}
      {selectedIds.size > 0 && view !== 'analytics' && view !== 'templates' && view !== 'recurring' && (
        <BulkActionsBar
          count={selectedIds.size}
          onClear={clearSelection}
          actions={[
            { label: 'Delete Selected', icon: Trash2, variant: 'danger', onClick: () => handleBulkDelete(Array.from(selectedIds)) },
            { label: 'Mark Done', icon: CheckCircle2, variant: 'primary', onClick: () => handleBulkStatus(Array.from(selectedIds), 'done') },
            { label: 'Mark In Progress', icon: Clock, variant: 'primary', onClick: () => handleBulkStatus(Array.from(selectedIds), 'in_progress') },
          ]}
        />
      )}

      {/* Views */}
      {isLoading && <div className="text-gray-400 text-center py-12">Loading tasks…</div>}
      {!isLoading && view === 'kanban' && <KanbanView byStatus={byStatus} openEdit={openEdit} moveStatus={moveStatus} toggleSelect={toggle} />}
      {!isLoading && view === 'list' && <ListView tasks={tasks} openEdit={openEdit} handleDelete={handleDelete} toggleSelect={toggle} />}
      {!isLoading && view === 'calendar' && <CalendarView buckets={calendarBuckets} openEdit={openEdit} />}
      {!isLoading && view === 'templates' && <TemplatesView templates={templates} useTemplate={useTemplate} deleteTemplate={deleteTemplate} onNew={()=>setShowTemplateModal(true)} />}
      {!isLoading && view === 'recurring' && <RecurringView tasks={recurringTasks} onDelete={deleteRecurring} onNew={()=>setShowRecurringModal(true)} />}
      {!isLoading && view === 'analytics' && <AnalyticsView analytics={analytics} />}

      {/* Task Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{editing ? 'Edit Task' : 'New Task'}</h3>
              <button onClick={()=>setShowModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm text-gray-400">Title</label>
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="w-full input input-bordered bg-gray-800 border-gray-700 text-white mt-1" placeholder="Task title" />
              </div>
              <div>
                <label className="text-sm text-gray-400">Description</label>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="w-full textarea textarea-bordered bg-gray-800 border-gray-700 text-white mt-1 h-20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full select select-bordered bg-gray-800 border-gray-700 text-white mt-1">
                    {STATUSES.map(s=>(<option key={s} value={s}>{STATUS_LABELS[s]}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Priority</label>
                  <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} className="w-full select select-bordered bg-gray-800 border-gray-700 text-white mt-1">
                    {PRIORITIES.map(p=>(<option key={p} value={p}>{p[0].toUpperCase()+p.slice(1)}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))} className="w-full input input-bordered bg-gray-800 border-gray-700 text-white mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Est. Hours</label>
                  <input type="number" value={form.estimated_hours} onChange={e=>setForm(f=>({...f,estimated_hours:e.target.value}))} className="w-full input input-bordered bg-gray-800 border-gray-700 text-white mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Category</label>
                <input value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="w-full input input-bordered bg-gray-800 border-gray-700 text-white mt-1" placeholder="general" />
              </div>

              {editing && (
                <div className="flex gap-2">
                  <button type="button" onClick={()=>loadSubtasks(String(editing.id))} className="btn btn-sm bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 flex-1">
                    <CheckSquare size={14} className="mr-1" /> Subtasks
                  </button>
                  <button type="button" onClick={()=>loadDeps(String(editing.id))} className="btn btn-sm bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 flex-1">
                    <Link2 size={14} className="mr-1" /> Dependencies
                  </button>
                </div>
              )}

              {showSubtasks && editing && (
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <p className="text-sm font-medium text-white mb-2">Subtasks</p>
                  <div className="space-y-1 mb-2">
                    {subtasks.map(s=> (
                      <div key={String(s.id)} className="flex items-center gap-2">
                        <button onClick={()=>toggleSubtask(String(s.id), Boolean(s.done))}>
                          {s.done ? <CheckSquare size={14} className="text-green-400" /> : <Square size={14} className="text-gray-500" />}
                        </button>
                        <span className={`text-sm flex-1 ${s.done ? 'line-through text-gray-500' : 'text-gray-200'}`}>{String(s.title??'')}</span>
                        <button onClick={()=>removeSubtask(String(s.id))} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                      </div>
                    ))}
                    {subtasks.length === 0 && <p className="text-xs text-gray-500 italic">No subtasks yet</p>}
                  </div>
                  <div className="flex gap-2">
                    <input value={subtaskForm.title} onChange={e=>setSubtaskForm(f=>({...f,title:e.target.value}))}
                      onKeyDown={e=>e.key==='Enter' && addSubtask()}
                      placeholder="New subtask" className="flex-1 input input-sm input-bordered bg-gray-900 border-gray-600 text-white" />
                    <button onClick={addSubtask} className="btn btn-sm btn-primary bg-orange-600 border-none text-white">Add</button>
                  </div>
                </div>
              )}

              {showDeps && editing && (
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <p className="text-sm font-medium text-white mb-2">Dependencies (this task depends on)</p>
                  <div className="space-y-1 mb-2">
                    {deps.map(d=> (
                      <div key={String(d.id)} className="flex justify-between text-sm text-gray-300">
                        <span>{String(d.depends_on_title?? d.depends_on_id??'')}</span>
                        <button onClick={()=>removeDep(String(d.id))} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                      </div>
                    ))}
                    {deps.length === 0 && <p className="text-xs text-gray-500 italic">No dependencies</p>}
                  </div>
                  <div className="flex gap-2">
                    <select value={depForm} onChange={e=>setDepForm(e.target.value)} className="flex-1 select select-sm select-bordered bg-gray-900 border-gray-600 text-white">
                      <option value="">Select task…</option>
                      {allTasks.filter(t=>String(t.id)!==String(editing!.id)).map(t=>(
                        <option key={String(t.id)} value={String(t.id)}>{String(t.title??'')}</option>
                      ))}
                    </select>
                    <button onClick={addDep} className="btn btn-sm btn-primary bg-orange-600 border-none text-white">Link</button>
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-700 flex justify-end gap-2">
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost text-gray-300">Cancel</button>
              <button onClick={handleSubmit} className="btn btn-primary bg-orange-600 hover:bg-orange-700 border-none text-white">{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Modal */}
      {showRecurringModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">New Recurring Task</h3>
              <button onClick={()=>setShowRecurringModal(false)}><X size={20} className="text-gray-400 hover:text-white" /></button>
            </div>
            <div className="p-5 space-y-3">
              <input value={recForm.title} onChange={e=>setRecForm(f=>({...f,title:e.target.value}))} placeholder="Title" className="w-full input input-bordered bg-gray-800 border-gray-700 text-white" />
              <textarea value={recForm.description} onChange={e=>setRecForm(f=>({...f,description:e.target.value}))} placeholder="Description" className="w-full textarea textarea-bordered bg-gray-800 border-gray-700 text-white" />
              <div className="grid grid-cols-2 gap-3">
                <select value={recForm.frequency} onChange={e=>setRecForm(f=>({...f,frequency:e.target.value}))} className="select select-bordered bg-gray-800 border-gray-700 text-white">
                  <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option>
                </select>
                <input type="number" value={recForm.interval_count} onChange={e=>setRecForm(f=>({...f,interval_count:e.target.value}))} placeholder="Interval" className="w-full input input-bordered bg-gray-800 border-gray-700 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={recForm.next_run_date} onChange={e=>setRecForm(f=>({...f,next_run_date:e.target.value}))} className="w-full input input-bordered bg-gray-800 border-gray-700 text-white" />
                <input type="date" value={recForm.end_date} onChange={e=>setRecForm(f=>({...f,end_date:e.target.value}))} className="w-full input input-bordered bg-gray-800 border-gray-700 text-white" placeholder="End date (opt)" />
              </div>
              <input type="number" value={recForm.estimated_hours} onChange={e=>setRecForm(f=>({...f,estimated_hours:e.target.value}))} placeholder="Est. hours" className="w-full input input-bordered bg-gray-800 border-gray-700 text-white" />
            </div>
            <div className="p-5 border-t border-gray-700 flex justify-end gap-2">
              <button onClick={()=>setShowRecurringModal(false)} className="btn btn-ghost text-gray-300">Cancel</button>
              <button onClick={saveRecurring} className="btn btn-primary bg-orange-600 text-white">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">New Task Template</h3>
              <button onClick={()=>setShowTemplateModal(false)}><X size={20} className="text-gray-400 hover:text-white" /></button>
            </div>
            <div className="p-5 space-y-3">
              <input value={templateForm.name} onChange={e=>setTemplateForm(f=>({...f,name:e.target.value}))} placeholder="Template name" className="w-full input input-bordered bg-gray-800 border-gray-700 text-white" />
              <input value={templateForm.title_pattern} onChange={e=>setTemplateForm(f=>({...f,title_pattern:e.target.value}))} placeholder="Title pattern e.g. 'Survey {location}'" className="w-full input input-bordered bg-gray-800 border-gray-700 text-white" />
              <textarea value={templateForm.description_template} onChange={e=>setTemplateForm(f=>({...f,description_template:e.target.value}))} placeholder="Description template" className="w-full textarea textarea-bordered bg-gray-800 border-gray-700 text-white h-20" />
              <input value={templateForm.estimated_hours} onChange={e=>setTemplateForm(f=>({...f,estimated_hours:e.target.value}))} type="number" placeholder="Default est. hours" className="w-full input input-bordered bg-gray-800 border-gray-700 text-white" />
            </div>
            <div className="p-5 border-t border-gray-700 flex justify-end gap-2">
              <button onClick={()=>setShowTemplateModal(false)} className="btn btn-ghost text-gray-300">Cancel</button>
              <button onClick={saveTemplate} className="btn btn-primary bg-orange-600 text-white">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */
function KanbanView({ byStatus, openEdit, moveStatus, toggleSelect }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {STATUSES.map(status => (
        <div key={status} className={`rounded-xl border p-3 ${STATUS_BG[status]}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
              <h3 className="text-sm font-semibold text-white">{STATUS_LABELS[status]}</h3>
            </div>
            <span className="text-xs text-gray-500 bg-gray-900/40 px-2 py-0.5 rounded-full">{byStatus[status]?.length||0}</span>
          </div>
          <div className="space-y-2">
            {(byStatus[status]||[]).map((task: AnyRow) => (
              <div key={String(task.id)} className="bg-gray-900 rounded border border-gray-700 p-3 hover:border-orange-500/40 transition group">
                <div className="flex items-start gap-2">
                  <Square onClick={()=>toggleSelect(String(task.id))} size={16} className="text-gray-500 cursor-pointer mt-0.5 flex-shrink-0 hover:text-orange-500" />
                  <div className="flex-1 min-w-0">
                    <p onClick={()=>openEdit(task)} className="text-sm font-medium text-gray-100 cursor-pointer hover:text-orange-400 truncate">{String(task.title??'')}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-semibold uppercase ${PRIORITY_COLOR[String(task.priority??'')] || 'text-gray-400'}`}>{String(task.priority??'')}</span>
                      {task.due_date && <span className="text-[10px] text-gray-500 flex items-center gap-1"><Clock size={10}/>{String(task.due_date??'').split('T')[0]}</span>}
                    </div>
                  </div>
                  <select
                    value={String(task.status)}
                    onChange={e => moveStatus(String(task.id), e.target.value)}
                    className="bg-transparent text-[10px] text-gray-400 border-none outline-none cursor-pointer"
                  >
                    {STATUSES.map(s=> (<option key={s} value={s}>{STATUS_LABELS[s]}</option>))}
                  </select>
                </div>
              </div>
            ))}
            {(byStatus[status]||[]).length === 0 && <p className="text-xs text-gray-600 text-center py-4 italic">No tasks</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListView({ tasks, openEdit, handleDelete, toggleSelect }: { tasks: AnyRow[], openEdit: (t: AnyRow)=>void, handleDelete: (id: string)=>void, toggleSelect: (id: string)=>void }) {
  if (tasks.length === 0) return <EmptyState title="No tasks" description="Create a task to get started" icon={CheckSquare} />;
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-800 text-gray-400">
          <tr>
            <th className="px-3 py-2 w-8"></th>
            <th className="px-3 py-2 text-left">Task</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Priority</th>
            <th className="px-3 py-2 text-left">Due</th>
            <th className="px-3 py-2 text-left">Est.</th>
            <th className="px-3 py-2 w-16"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {tasks.map(t=> (
            <tr key={String(t.id)} className="hover:bg-gray-800/40">
              <td className="px-3 py-2"><button onClick={()=>toggleSelect(String(t.id))}><Square size={14} className="text-gray-500 hover:text-orange-500" /></button></td>
              <td className="px-3 py-3">
                <p className="font-medium text-gray-200 cursor-pointer hover:text-orange-400" onClick={()=>openEdit(t)}>{String(t.title??'')}</p>
                <p className="text-xs text-gray-500 truncate max-w-[200px]">{String(t.description??'')}</p>
              </td>
              <td className="px-3 py-3"><span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_DOT[t.status as string] ? '' : 'bg-gray-800 text-gray-400 border-gray-700'}`} style={{backgroundColor:'transparent', color:'#94a3b8'}}>{STATUS_LABELS[String(t.status??'')]||String(t.status??'')}</span></td>
              <td className="px-3 py-3"><span className={`text-xs font-bold uppercase ${PRIORITY_COLOR[String(t.priority??'')]||'text-gray-400'}`}>{String(t.priority??'')}</span></td>
              <td className="px-3 py-3 text-gray-400">{t.due_date ? String(t.due_date).split('T')[0] : '—'}</td>
              <td className="px-3 py-3 text-gray-400">{t.estimated_hours ? `${t.estimated_hours}h` : '—'}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-1">
                  <button onClick={()=>openEdit(t)} className="text-gray-500 hover:text-white"><Edit2 size={14} /></button>
                  <button onClick={()=>handleDelete(String(t.id))} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CalendarView({ buckets, openEdit }: { buckets: Record<string,AnyRow[]>, openEdit: (t:AnyRow)=>void }) {
  const today = isoDate(new Date());
  const [month, setMonth] = useState(today.substring(0,7));
  const days: { d:string, tasks:AnyRow[] }[] = [];
  const y = Number(month.split('-')[0]), m = Number(month.split('-')[1]);
  const first = new Date(y, m-1, 1);
  const lastDay = new Date(y, m, 0).getDate();
  for (let i=1;i<=lastDay;i++) { days.push({ d: `${month}-${String(i).padStart(2,'0')}`, tasks: buckets[`${month}-${String(i).padStart(2,'0')}`]||[] }); }
  const weekStart = first.getDay();
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">{first.toLocaleString('default',{month:'long',year:'numeric'})}</h3>
        <div className="flex gap-2">
          <button onClick={()=>{const [y2,m2]=month.split('-').map(Number);const nm=new Date(y2,m2-2,1);setMonth(`${nm.getFullYear()}-${String(nm.getMonth()+1).padStart(2,'0')}`);}} className="btn btn-sm bg-gray-800 text-gray-300 border-gray-700">←</button>
          <button onClick={()=>setMonth(today.substring(0,7))} className="btn btn-sm bg-gray-800 text-gray-300 border-gray-700">Today</button>
          <button onClick={()=>{const [y2,m2]=month.split('-').map(Number);const nm=new Date(y2,m2,1);setMonth(`${nm.getFullYear()}-${String(nm.getMonth()+1).padStart(2,'0')}`);}} className="btn btn-sm bg-gray-800 text-gray-300 border-gray-700">→</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-1 text-center">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>(<span key={d}>{d}</span>))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({length:weekStart}).map((_,i)=>(<div key={`pad-${i}`} className="h-24 bg-gray-800/30 rounded" />))}
        {days.map(({d,tasks})=> {
          const isToday = d===today;
          return (
            <div key={d} className={`h-24 border rounded p-1 overflow-hidden ${isToday ? 'border-orange-500 bg-orange-500/5' : 'border-gray-700 bg-gray-800/40'}`}>
              <div className={`text-[10px] font-medium mb-1 ${isToday ? 'text-orange-400' : 'text-gray-500'}`}>{Number(d.split('-')[2])}</div>
              <div className="space-y-0.5">
                {tasks.slice(0,3).map(t=> (
                  <button key={String(t.id)} onClick={()=>openEdit(t)} className="text-[10px] block w-full text-left text-gray-300 truncate hover:text-orange-400 px-1 rounded bg-gray-900/50">{String(t.title??'')}</button>
                ))}
                {tasks.length>3 && <span className="text-[9px] text-gray-600 px-1">+{tasks.length-3} more</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TemplatesView({ templates, useTemplate, deleteTemplate, onNew }: { templates: AnyRow[], useTemplate: (t:AnyRow)=>void, deleteTemplate: (id:string)=>void, onNew: ()=>void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button onClick={onNew} className="btn btn-sm bg-orange-600 text-white"><Plus size={14} className="mr-1"/>Template</button></div>
      {templates.length===0 && <EmptyState title="No templates" description="Create reusable task templates for common work" icon={FileText} />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t=> (
          <div key={String(t.id)} className="bg-gray-900 border border-gray-700 rounded-xl p-4 hover:border-orange-500/30 transition">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-white font-semibold">{String(t.name??'')}</h4>
              <div className="flex gap-1">
                <button onClick={()=>useTemplate(t)} className="text-gray-500 hover:text-orange-400" title="Use template"><Copy size={14}/></button>
                <button onClick={()=>deleteTemplate(String(t.id))} className="text-gray-500 hover:text-red-400" title="Delete"><Trash2 size={14}/></button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-1">Pattern: {String(t.title_pattern??'')}</p>
            <p className="text-xs text-gray-500 line-clamp-2">{String(t.description_template??'')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecurringView({ tasks, onDelete, onNew }: { tasks: AnyRow[], onDelete: (id:string)=>void, onNew: ()=>void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button onClick={onNew} className="btn btn-sm bg-orange-600 text-white"><Plus size={14} className="mr-1"/>Recurring</button></div>
      {tasks.length===0 && <EmptyState title="No recurring tasks" description="Set up tasks that repeat on a schedule" icon={Repeat} />}
      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400"><tr><th className="px-3 py-2 text-left">Title</th><th className="px-3 py-2 text-left">Freq</th><th className="px-3 py-2 text-left">Next Run</th><th className="px-3 py-2 text-left">Active</th><th className="px-3 py-2 w-16"></th></tr></thead>
          <tbody className="divide-y divide-gray-700">
            {tasks.map(t=> (
              <tr key={String(t.id)} className="hover:bg-gray-800/40">
                <td className="px-3 py-3 font-medium text-gray-200">{String(t.title??'')}</td>
                <td className="px-3 py-3 text-gray-400">{String(t.frequency??'')} ×{t.interval_count||1}</td>
                <td className="px-3 py-3 text-gray-400">{t.next_run_date ? String(t.next_run_date).split('T')[0] : '—'}</td>
                <td className="px-3 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${t.active ? 'bg-green-900/20 text-green-400 border border-green-800' : 'bg-gray-800 text-gray-500'}`}>{t.active ? 'Active' : 'Paused'}</span></td>
                <td className="px-3 py-3"><button onClick={()=>onDelete(String(t.id))} className="text-gray-500 hover:text-red-400"><Trash2 size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyticsView({ analytics }: { analytics: { total:number, doneCount:number, overdue:number, statsByStatus:{name:string,value:number}[], byPriority:{name:string,value:number}[] } }) {
  const completion = analytics.total ? Math.round((analytics.doneCount/analytics.total)*100) : 0;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
        <p className="text-sm text-gray-400">Total Tasks</p>
        <p className="text-3xl font-bold text-white mt-1">{analytics.total}</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden"><div className="bg-green-500 h-2 rounded-full" style={{width:`${completion}%`}} /></div>
          <span className="text-xs text-gray-400">{completion}% done</span>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
        <p className="text-sm text-gray-400">Overdue</p>
        <p className="text-3xl font-bold text-red-400 mt-1">{analytics.overdue}</p>
        <p className="text-xs text-gray-500 mt-1">Tasks past due not yet completed</p>
      </div>
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
        <p className="text-sm text-gray-400">Completion Rate</p>
        <p className="text-3xl font-bold text-white mt-1">{analytics.total?Math.round(completion):0}%</p>
        <p className="text-xs text-gray-500 mt-1">{analytics.doneCount}/{analytics.total} tasks finished</p>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 lg:col-span-2">
        <h4 className="text-sm font-semibold text-white mb-4">Status Distribution</h4>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.statsByStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{fill:'#9ca3af',fontSize:12}} />
              <YAxis tick={{fill:'#9ca3af',fontSize:12}} />
              <Tooltip contentStyle={{background:'#111827',borderColor:'#374151',color:'#fff'}} />
              <Bar dataKey="value" radius={[4,4,0,0]}>{analytics.statsByStatus.map((_,i)=>(<Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />))}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-white mb-4">Priority Breakdown</h4>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie dataKey="value" data={analytics.byPriority} outerRadius={70} label={({name,value})=>value?`${name[0].toUpperCase()}${name.slice(1)}: ${value}`:''}>
                {analytics.byPriority.map((_,i)=>(<Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />))}
              </Pie>
              <Tooltip contentStyle={{background:'#111827',borderColor:'#374151',color:'#fff'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
