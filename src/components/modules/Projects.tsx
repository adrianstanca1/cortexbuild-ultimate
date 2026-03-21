// Module: Projects — CortexBuild Ultimate (Enhanced)
import { useState } from 'react';
import {
  Plus, MapPin, Users, X, Loader2, Trash2, Edit2, RefreshCw,
  TrendingUp, PoundSterling, AlertTriangle, CheckCircle2,
  BarChart3, Clock, Building2, Search, Filter, ChevronRight, Calendar,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useProjects } from '../../hooks/useData';
import type { ProjectStatus } from '../../types';
import clsx from 'clsx';

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active:    { label: 'Active',    color: 'text-green-400',   bg: 'bg-green-500/15 border border-green-600/50',    dot: 'bg-green-400' },
  planning:  { label: 'Planning',  color: 'text-blue-400',    bg: 'bg-blue-500/15 border border-blue-600/50',      dot: 'bg-blue-400' },
  on_hold:   { label: 'On Hold',   color: 'text-yellow-400',  bg: 'bg-yellow-500/15 border border-yellow-600/50',  dot: 'bg-yellow-400' },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border border-emerald-600/50',dot: 'bg-emerald-400' },
  archived:  { label: 'Archived',  color: 'text-gray-500',    bg: 'bg-gray-700/50 border border-gray-600',         dot: 'bg-gray-500' },
};

const typeColors: Record<string, string> = {
  Commercial: 'text-purple-400', Residential: 'text-blue-400', Civil: 'text-orange-400',
  Industrial: 'text-yellow-400', Healthcare: 'text-red-400', 'Fit-Out': 'text-pink-400',
  Infrastructure: 'text-cyan-400', Refurbishment: 'text-teal-400',
};

const PROJECT_TYPES = ['Commercial','Residential','Civil','Industrial','Healthcare','Fit-Out','Infrastructure','Refurbishment'];
const PROJECT_PHASES = ['Pre-construction','Tender','Design','Foundation','Structural','Envelope','Internal Fit-Out','MEP','Finishing','Snagging','Handover'];

const defaultForm = {
  name: '', client: '', location: '', type: 'Commercial', manager: '',
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
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<FormData>(defaultForm);

  const filtered = projects
    .filter(p => filter === 'all' || String(p.status) === filter)
    .filter(p => !search || String(p.name).toLowerCase().includes(search.toLowerCase()) ||
      String(p.client).toLowerCase().includes(search.toLowerCase()) ||
      String(p.location).toLowerCase().includes(search.toLowerCase()));

  const selected = projects.find(p => String(p.id) === selectedId) as AnyRow | undefined;

  const totalContractValue = projects.reduce((s, p) => s + (Number(p.contract_value ?? p.contractValue) || 0), 0);
  const totalBudget  = projects.reduce((s, p) => s + (Number(p.budget) || 0), 0);
  const totalSpent   = projects.reduce((s, p) => s + (Number(p.spent) || 0), 0);
  const totalWorkers = projects.reduce((s, p) => s + (Number(p.workers) || 0), 0);
  const activeCount  = projects.filter(p => p.status === 'active').length;
  const avgProgress  = projects.length ? Math.round(projects.reduce((s, p) => s + (Number(p.progress) || 0), 0) / projects.length) : 0;
  const budgetAtRisk = projects.filter(p => (Number(p.spent) / (Number(p.budget) || 1)) > 0.85 && p.status === 'active').length;

  const counts: Record<string, number> = {
    all: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    planning: projects.filter(p => p.status === 'planning').length,
    on_hold:  projects.filter(p => p.status === 'on_hold').length,
    completed:projects.filter(p => p.status === 'completed').length,
  };

  const statusPieData = (['active','planning','on_hold','completed'] as const)
    .map(k => ({ name: statusConfig[k].label, value: counts[k], fill: k==='active'?'#22c55e':k==='planning'?'#3b82f6':k==='on_hold'?'#eab308':'#10b981' }))
    .filter(d => d.value > 0);

  const chartData = filtered.map(p => ({
    name: String(p.name??'').split(' ').slice(0,2).join(' '),
    progress: Number(p.progress)||0,
    budget: +((Number(p.budget)||0)/1_000_000).toFixed(2),
    spent:  +((Number(p.spent) ||0)/1_000_000).toFixed(2),
  }));

  const openCreate = () => { setForm(defaultForm); setEditMode(false); setShowModal(true); };
  const openEdit = (p: AnyRow) => {
    setForm({
      name: String(p.name??''), client: String(p.client??''), location: String(p.location??''),
      type: String(p.type??'Commercial'), manager: String(p.manager??''),
      budget: String(p.budget??''), contract_value: String(p.contract_value??p.contractValue??''),
      workers: String(p.workers??'0'), start_date: String(p.start_date??p.startDate??''),
      end_date: String(p.end_date??p.endDate??''), status: String(p.status??'planning'),
      phase: String(p.phase??''), description: String(p.description??''),
    });
    setEditMode(true); setSelectedId(String(p.id)); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, budget: Number(form.budget), contract_value: Number(form.contract_value), workers: Number(form.workers), spent: 0, progress: 0 };
    if (editMode && selectedId) { await updateMutation.mutateAsync({ id: selectedId, data: payload }); }
    else { await createMutation.mutateAsync(payload); }
    setShowModal(false); setSelectedId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    await deleteMutation.mutateAsync(id); setSelectedId(null);
  };

  const fmt = (n: number) => n >= 1e6 ? `£${(n/1e6).toFixed(2)}M` : `£${n.toLocaleString('en-GB')}`;
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors";
  const lbl = "block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide";

  return (
    <div className="min-h-full space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-sm text-gray-400 mt-1">{projects.length} projects · {activeCount} active · {totalWorkers} workers on site</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => refetch()} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <div className="flex rounded-xl bg-gray-800 p-1">
            {(['grid','table'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize',
                  view===v ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white')}>{v}</button>
            ))}
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Contract Value', value: fmt(totalContractValue), icon: PoundSterling, color: 'text-blue-400',    bg: 'from-blue-500/10 to-blue-600/5',      border: 'border-blue-800/40' },
          { label: 'Total Budget',   value: fmt(totalBudget),        icon: BarChart3,     color: 'text-purple-400',  bg: 'from-purple-500/10 to-purple-600/5',  border: 'border-purple-800/40' },
          { label: 'Spent to Date',  value: fmt(totalSpent),         icon: TrendingUp,    color: 'text-orange-400',  bg: 'from-orange-500/10 to-orange-600/5',  border: 'border-orange-800/40' },
          { label: 'Avg Progress',   value: `${avgProgress}%`,       icon: CheckCircle2,  color: 'text-emerald-400', bg: 'from-emerald-500/10 to-emerald-600/5',border: 'border-emerald-800/40' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={clsx('rounded-2xl border bg-gradient-to-br p-5', bg, border)}>
            <div className="flex items-start justify-between">
              <div><p className="text-xs text-gray-400 mb-1">{label}</p><p className={clsx('text-2xl font-bold', color)}>{value}</p></div>
              <div className="p-2 rounded-xl bg-gray-800/60"><Icon className={clsx('w-5 h-5', color)} /></div>
            </div>
          </div>
        ))}
      </div>

      {budgetAtRisk > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-600/30">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300 font-medium">{budgetAtRisk} active project{budgetAtRisk>1?'s are':' is'} over 85% budget utilisation — review spending</p>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, client, location..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500" />
          {(['all','active','planning','on_hold','completed'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={clsx('rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5',
                filter===s ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800 text-gray-300 hover:bg-gray-700')}>
              {s!=='all' && <span className={clsx('w-1.5 h-1.5 rounded-full', statusConfig[s]?.dot)} />}
              {s==='all' ? 'All' : statusConfig[s]?.label}
              <span className="opacity-60">({counts[s]??0})</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}

      {/* Grid View */}
      {!isLoading && view==='grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(proj => {
            const cfg = statusConfig[String(proj.status)] ?? statusConfig.planning;
            const budget = Number(proj.budget)||0;
            const spent  = Number(proj.spent)||0;
            const progress = Number(proj.progress)||0;
            const budgetPct = budget ? (spent/budget)*100 : 0;
            const contractVal = Number(proj.contract_value??proj.contractValue)||0;
            const isAtRisk = budgetPct>85 && proj.status==='active';
            return (
              <div key={String(proj.id)}
                className={clsx(
                  'group relative rounded-2xl border bg-gray-900 overflow-hidden cursor-pointer',
                  'transition-all duration-300 hover:border-blue-600/60 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-0.5',
                  selectedId===String(proj.id) ? 'border-blue-600 ring-2 ring-blue-500/25' : 'border-gray-800'
                )}
                onClick={() => setSelectedId(prev => prev===String(proj.id) ? null : String(proj.id))}>
                <div className={clsx('h-1.5 w-full',
                  proj.status==='active'?'bg-gradient-to-r from-green-500 to-emerald-400':
                  proj.status==='planning'?'bg-gradient-to-r from-blue-500 to-indigo-400':
                  proj.status==='on_hold'?'bg-gradient-to-r from-yellow-500 to-amber-400':
                  proj.status==='completed'?'bg-gradient-to-r from-emerald-500 to-teal-400':'bg-gray-700'
                )} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-sm leading-snug">{String(proj.name)}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{String(proj.client)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={clsx('rounded-full px-2 py-0.5 text-xs font-bold flex items-center gap-1', cfg.bg, cfg.color)}>
                        <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />{cfg.label}
                      </span>
                      {!!proj.type && <span className={clsx('text-xs', typeColors[String(proj.type)]??'text-gray-500')}>{String(proj.type)}</span>}
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className={clsx('font-bold', progress>=75?'text-emerald-400':'text-blue-400')}>{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-800">
                      <div className={clsx('h-full rounded-full', progress>=75?'bg-gradient-to-r from-emerald-500 to-green-400':'bg-gradient-to-r from-blue-500 to-indigo-400')}
                           style={{width:`${progress}%`}} />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Budget</span>
                      <span className={clsx('font-semibold', isAtRisk?'text-red-400':'text-gray-400')}>{fmt(spent)} / {fmt(budget)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-800">
                      <div className={clsx('h-full rounded-full', isAtRisk?'bg-gradient-to-r from-red-500 to-orange-500':'bg-gradient-to-r from-amber-500 to-orange-400')}
                           style={{width:`${Math.min(budgetPct,100)}%`}} />
                    </div>
                    {isAtRisk && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Budget at risk</p>}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
                    {!!proj.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-400" />{String(proj.location)}</span>}
                    {proj.workers!==undefined && <span className="flex items-center gap-1"><Users className="w-3 h-3 text-purple-400" />{String(proj.workers)} workers</span>}
                    {!!proj.phase && <span className="flex items-center gap-1"><Building2 className="w-3 h-3 text-orange-400" />{String(proj.phase)}</span>}
                  </div>
                  {contractVal>0 && (
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/60 mb-4 text-xs">
                      <span className="text-gray-500">Contract Value</span>
                      <span className="font-bold text-white">{fmt(contractVal)}</span>
                    </div>
                  )}
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(proj)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-gray-800 hover:bg-gray-700 py-2 text-xs font-semibold text-white transition-colors">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => setSelectedId(String(proj.id))}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 py-2 text-xs font-semibold text-blue-400 transition-colors">
                      Details <ChevronRight className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDelete(String(proj.id))}
                      className="rounded-xl bg-gray-800 hover:bg-red-900/20 px-2.5 py-2 text-red-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length===0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center"><Building2 className="w-8 h-8 text-gray-600" /></div>
              <div className="text-center"><p className="text-gray-400 font-medium">No projects found</p><p className="text-gray-600 text-sm mt-1">Adjust filters or create a new project</p></div>
              <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors">
                <Plus className="w-4 h-4" /> Create First Project
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {!isLoading && view==='table' && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Project','Client','Status','Progress','Budget','Spent','Workers','Phase','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filtered.map(proj => {
                  const cfg = statusConfig[String(proj.status)]??statusConfig.planning;
                  const budget = Number(proj.budget)||0, spent=Number(proj.spent)||0, progress=Number(proj.progress)||0;
                  return (
                    <tr key={String(proj.id)} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">{String(proj.name)}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{String(proj.location??'—')}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{String(proj.client)}</td>
                      <td className="px-4 py-3"><span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-bold', cfg.bg, cfg.color)}>{cfg.label}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-700"><div className="h-full rounded-full bg-blue-500" style={{width:`${progress}%`}} /></div>
                          <span className="text-xs font-bold text-blue-400 w-8 shrink-0">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white font-semibold whitespace-nowrap">{fmt(budget)}</td>
                      <td className="px-4 py-3 text-orange-400 whitespace-nowrap">{fmt(spent)}</td>
                      <td className="px-4 py-3 text-purple-400">{String(proj.workers??0)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{String(proj.phase??'—')}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(proj)} className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-blue-400 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(String(proj.id))} className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts */}
      {filtered.length>0 && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="text-sm font-bold text-white mb-0.5">Budget vs Spent vs Progress</h3>
            <p className="text-xs text-gray-500 mb-4">Budget/Spent in £M · Progress in %</p>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={chartData} barSize={9} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" tick={{fontSize:10}} />
                <YAxis stroke="#6b7280" tick={{fontSize:10}} />
                <Tooltip contentStyle={{backgroundColor:'#111827',border:'1px solid #374151',borderRadius:10,fontSize:11}} />
                <Legend wrapperStyle={{fontSize:11}} />
                <Bar dataKey="budget"   name="Budget £M"  fill="#6366f1" radius={[3,3,0,0]} />
                <Bar dataKey="spent"    name="Spent £M"   fill="#f59e0b" radius={[3,3,0,0]} />
                <Bar dataKey="progress" name="Progress %" fill="#22c55e" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="text-sm font-bold text-white mb-0.5">Status Breakdown</h3>
            <p className="text-xs text-gray-500 mb-2">By project count</p>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                  {statusPieData.map((entry,i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{backgroundColor:'#111827',border:'1px solid #374151',borderRadius:8,fontSize:11}} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {statusPieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{background:d.fill}} />
                  <span className="text-gray-400">{d.name}</span>
                  <span className="text-white font-bold ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl my-4">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-white">{editMode?'Edit Project':'New Project'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editMode?'Update project details':'Add a new construction project'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={lbl}>Project Name *</label>
                <input required value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Canary Wharf Office Complex" className={inp} />
              </div>
              <div>
                <label className={lbl}>Client *</label>
                <input required value={form.client} onChange={e => setForm(p=>({...p,client:e.target.value}))} placeholder="Client name" className={inp} />
              </div>
              <div>
                <label className={lbl}>Location</label>
                <input value={form.location} onChange={e => setForm(p=>({...p,location:e.target.value}))} placeholder="City, Postcode" className={inp} />
              </div>
              <div>
                <label className={lbl}>Project Manager</label>
                <input value={form.manager} onChange={e => setForm(p=>({...p,manager:e.target.value}))} placeholder="Manager name" className={inp} />
              </div>
              <div>
                <label className={lbl}>Type</label>
                <select value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))} className={inp}>
                  {PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Phase</label>
                <select value={form.phase} onChange={e => setForm(p=>({...p,phase:e.target.value}))} className={inp}>
                  {PROJECT_PHASES.map(ph => <option key={ph}>{ph}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select value={form.status} onChange={e => setForm(p=>({...p,status:e.target.value}))} className={inp}>
                  {Object.keys(statusConfig).map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Workers on Site</label>
                <input type="number" min="0" value={form.workers} onChange={e => setForm(p=>({...p,workers:e.target.value}))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Budget (£)</label>
                <input type="number" value={form.budget} onChange={e => setForm(p=>({...p,budget:e.target.value}))} placeholder="0" className={inp} />
              </div>
              <div>
                <label className={lbl}>Contract Value (£)</label>
                <input type="number" value={form.contract_value} onChange={e => setForm(p=>({...p,contract_value:e.target.value}))} placeholder="0" className={inp} />
              </div>
              <div>
                <label className={lbl}>Start Date</label>
                <input type="date" value={form.start_date} onChange={e => setForm(p=>({...p,start_date:e.target.value}))} className={inp} />
              </div>
              <div>
                <label className={lbl}>End Date</label>
                <input type="date" value={form.end_date} onChange={e => setForm(p=>({...p,end_date:e.target.value}))} className={inp} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))}
                  placeholder="Scope of works, key deliverables..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none" />
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl bg-gray-800 hover:bg-gray-700 py-3 text-sm font-semibold text-gray-300 transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending}
                  className="flex-[2] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3 text-sm font-bold text-white transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {(createMutation.isPending||updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editMode?'Save Changes':'+ Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Slide-out */}
      {selected && !showModal && (() => {
        const s = selected;
        const budget=Number(s.budget)||0, spent=Number(s.spent)||0, contractVal=Number(s.contract_value??s.contractValue)||0;
        const progress=Number(s.progress)||0, budgetPct=budget?Math.round((spent/budget)*100):0;
        const cfg = statusConfig[String(s.status)]??statusConfig.planning;
        return (
          <div className="fixed inset-0 z-40 flex" onClick={() => setSelectedId(null)}>
            <div className="flex-1 bg-black/20 backdrop-blur-sm" />
            <div className="w-full max-w-md bg-gray-900 border-l border-gray-800 overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className={clsx('rounded-full px-2.5 py-1 text-xs font-bold flex items-center gap-1', cfg.bg, cfg.color)}>
                    <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />{cfg.label}
                  </span>
                  {!!s.type && <span className={clsx('text-xs font-medium', typeColors[String(s.type)]??'text-gray-400')}>{String(s.type)}</span>}
                </div>
                <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-white leading-snug">{String(s.name)}</h2>
                  <p className="text-gray-400 text-sm mt-1">{String(s.client)}</p>
                  {!!s.description && <p className="text-gray-500 text-xs mt-2 leading-relaxed">{String(s.description)}</p>}
                </div>
                <div className="rounded-xl bg-gray-800/60 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Overall Progress</span>
                    <span className={clsx('text-2xl font-black', progress>=75?'text-emerald-400':'text-blue-400')}>{progress}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-700">
                    <div className={clsx('h-full rounded-full', progress>=75?'bg-gradient-to-r from-emerald-500 to-green-400':'bg-gradient-to-r from-blue-500 to-indigo-400')} style={{width:`${progress}%`}} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[['Budget',fmt(budget),'text-blue-400'],['Spent',fmt(spent),budgetPct>85?'text-red-400':'text-orange-400'],['Contract',fmt(contractVal),'text-purple-400']].map(([l,v,c]) => (
                    <div key={String(l)} className="rounded-xl bg-gray-800/60 p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">{String(l)}</p><p className={clsx('text-sm font-bold',c)}>{String(v)}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-gray-800/60 p-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">Budget utilisation</span>
                    <span className={clsx('font-bold', budgetPct>85?'text-red-400':'text-gray-300')}>{budgetPct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-700">
                    <div className={clsx('h-full rounded-full', budgetPct>85?'bg-red-500':'bg-amber-500')} style={{width:`${Math.min(budgetPct,100)}%`}} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[['Location',s.location],['Manager',s.manager],['Phase',s.phase],['Workers',s.workers],['Start',s.start_date??s.startDate],['End',s.end_date??s.endDate]].map(([k,v]) => (
                    <div key={String(k)} className="rounded-xl bg-gray-800/40 p-3">
                      <p className="text-xs text-gray-500 mb-0.5">{String(k)}</p>
                      <p className="text-sm font-medium text-white">{String(v??'—')}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => openEdit(s)} className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-sm font-bold text-white transition-colors flex items-center justify-center gap-2">
                    <Edit2 className="w-4 h-4" /> Edit Project
                  </button>
                  <button onClick={() => handleDelete(String(s.id))} className="rounded-xl bg-gray-800 hover:bg-red-900/30 border border-gray-700 hover:border-red-800 px-4 py-3 text-red-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
