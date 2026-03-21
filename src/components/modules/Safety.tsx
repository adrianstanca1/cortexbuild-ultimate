// Module: Safety — CortexBuild Ultimate (Real Data)
import { useState } from 'react';
import { Plus, X, Loader2, Shield, AlertTriangle, CheckCircle2, RefreshCw, Search, Edit2, Trash2, FileText, AlertCircle } from 'lucide-react';
import { useSafety } from '../../hooks/useData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { safetyTrendData } from '../../data/mockData';
import clsx from 'clsx';

type AnyRow = Record<string, unknown>;

const severityConfig: Record<string, { label: string; color: string; bg: string }> = {
  low:      { label: 'Low',      color: 'text-green-400',  bg: 'bg-green-500/15 border border-green-600/40' },
  medium:   { label: 'Medium',   color: 'text-yellow-400', bg: 'bg-yellow-500/15 border border-yellow-600/40' },
  high:     { label: 'High',     color: 'text-orange-400', bg: 'bg-orange-500/15 border border-orange-600/40' },
  critical: { label: 'Critical', color: 'text-red-400',    bg: 'bg-red-500/15 border border-red-600/40' },
  // Legacy aliases from mock data
  minor:    { label: 'Minor',    color: 'text-green-400',  bg: 'bg-green-500/15 border border-green-600/40' },
  serious:  { label: 'Serious',  color: 'text-orange-400', bg: 'bg-orange-500/15 border border-orange-600/40' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  open:              { label: 'Open',             color: 'text-red-400' },
  investigating:     { label: 'Investigating',    color: 'text-yellow-400' },
  action_required:   { label: 'Action Required',  color: 'text-orange-400' },
  closed:            { label: 'Closed',            color: 'text-green-400' },
  resolved:          { label: 'Resolved',          color: 'text-emerald-400' },
};

const typeConfig: Record<string, { label: string; icon: typeof Shield }> = {
  near_miss:            { label: 'Near Miss',           icon: AlertTriangle },
  first_aid:            { label: 'First Aid',           icon: AlertCircle },
  riddor:               { label: 'RIDDOR',              icon: AlertCircle },
  dangerous_occurrence: { label: 'Dangerous Occurrence',icon: AlertTriangle },
  environmental:        { label: 'Environmental',        icon: Shield },
  // Legacy
  'near-miss':          { label: 'Near Miss',           icon: AlertTriangle },
  incident:             { label: 'Incident',            icon: AlertCircle },
  hazard:               { label: 'Hazard',              icon: AlertTriangle },
  'toolbox-talk':       { label: 'Toolbox Talk',        icon: FileText },
  'mewp-check':         { label: 'MEWP Check',          icon: CheckCircle2 },
};

const defaultForm = {
  title: '', type: 'near_miss', severity: 'medium', status: 'open',
  project: '', location: '', date: new Date().toISOString().split('T')[0],
  description: '', immediate_action: '', injured_party: '',
  reported_by_name: '', riddor_reportable: false,
};
type FormData = typeof defaultForm;

export function Safety() {
  const { useList, useCreate, useUpdate, useDelete } = useSafety;
  const { data: raw = [], isLoading, refetch } = useList();
  const incidents = raw as AnyRow[];
  const createM = useCreate(); const updateM = useUpdate(); const deleteM = useDelete();

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = incidents
    .filter(i => filter === 'all' || i.status === filter || i.severity === filter)
    .filter(i => !search || String(i.title).toLowerCase().includes(search.toLowerCase()) ||
      String(i.project).toLowerCase().includes(search.toLowerCase()));

  const counts = {
    open: incidents.filter(i => i.status === 'open' || i.status === 'investigating' || i.status === 'action_required').length,
    critical: incidents.filter(i => i.severity === 'critical' || i.severity === 'serious').length,
    riddor: incidents.filter(i => i.riddor_reportable || i.type === 'riddor').length,
    closed: incidents.filter(i => i.status === 'closed' || i.status === 'resolved').length,
  };

  const selected = incidents.find(i => String(i.id) === selectedId);

  const openCreate = () => { setForm(defaultForm); setEditId(null); setShowModal(true); };
  const openEdit = (i: AnyRow) => {
    setForm({
      title: String(i.title??''), type: String(i.type??'near_miss'), severity: String(i.severity??'medium'),
      status: String(i.status??'open'), project: String(i.project??''), location: String(i.location??''),
      date: String(i.date??new Date().toISOString().split('T')[0]), description: String(i.description??''),
      immediate_action: String(i.immediate_action??''), injured_party: String(i.injured_party??''),
      reported_by_name: String(i.reported_by_name??i.reportedBy??''), riddor_reportable: Boolean(i.riddor_reportable),
    });
    setEditId(String(i.id)); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) { await updateM.mutateAsync({ id: editId, data: form }); }
    else { await createM.mutateAsync(form); }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this incident record?')) return;
    await deleteM.mutateAsync(id); setSelectedId(null);
  };

  const inp = "w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors";
  const lbl = "block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide";

  return (
    <div className="min-h-full space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Safety</h1>
          <p className="text-sm text-gray-400 mt-1">{incidents.length} records · {counts.open} open · {counts.riddor} RIDDOR reportable</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white hover:from-red-500 transition-all shadow-lg shadow-red-500/20">
            <Plus className="w-4 h-4" /> Report Incident
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open Incidents',  value: counts.open,     color: 'text-red-400',    bg: 'from-red-500/10 to-red-600/5',      border: 'border-red-800/40',     icon: AlertCircle },
          { label: 'Critical / Serious', value: counts.critical, color: 'text-orange-400', bg: 'from-orange-500/10 to-orange-600/5', border: 'border-orange-800/40',  icon: AlertTriangle },
          { label: 'RIDDOR Reportable', value: counts.riddor,  color: 'text-purple-400', bg: 'from-purple-500/10 to-purple-600/5', border: 'border-purple-800/40',  icon: FileText },
          { label: 'Closed / Resolved', value: counts.closed, color: 'text-emerald-400',bg: 'from-emerald-500/10 to-emerald-600/5',border: 'border-emerald-800/40',icon: CheckCircle2 },
        ].map(({ label, value, color, bg, border, icon: Icon }) => (
          <div key={label} className={clsx('rounded-2xl border bg-gradient-to-br p-5', bg, border)}>
            <div className="flex items-start justify-between">
              <div><p className="text-xs text-gray-400 mb-1">{label}</p><p className={clsx('text-3xl font-black', color)}>{value}</p></div>
              <div className="p-2 rounded-xl bg-gray-800/60"><Icon className={clsx('w-5 h-5', color)} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <h3 className="text-sm font-bold text-white mb-0.5">7-Month Safety Trend</h3>
        <p className="text-xs text-gray-500 mb-4">Incidents, near misses and toolbox talks</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={safetyTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 10, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="incidents"    name="Incidents"      stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="nearMisses"   name="Near Misses"    stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="toolboxTalks" name="Toolbox Talks"  stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search incidents..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500" />
        </div>
        {['all','open','investigating','closed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={clsx('rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all capitalize',
              filter===s ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700')}>
            {s==='all' ? 'All' : s}
          </button>
        ))}
      </div>

      {isLoading && <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>}

      {/* Incidents List */}
      <div className="space-y-3">
        {filtered.map(inc => {
          const sev = severityConfig[String(inc.severity)] ?? severityConfig.low;
          const stat = statusConfig[String(inc.status)] ?? statusConfig.open;
          const typeInfo = typeConfig[String(inc.type)] ?? { label: String(inc.type), icon: Shield };
          const TypeIcon = typeInfo.icon;
          return (
            <div key={String(inc.id)}
              className={clsx(
                'rounded-2xl border bg-gray-900 p-5 cursor-pointer transition-all hover:border-gray-700',
                selectedId === String(inc.id) ? 'border-red-600/50 ring-1 ring-red-500/20' : 'border-gray-800'
              )}
              onClick={() => setSelectedId(prev => prev===String(inc.id)?null:String(inc.id))}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={clsx('p-2 rounded-xl shrink-0', sev.bg)}>
                    <TypeIcon className={clsx('w-4 h-4', sev.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white text-sm">{String(inc.title)}</h3>
                      {(inc.riddor_reportable || inc.type === 'riddor') && (
                        <span className="rounded-full bg-purple-500/20 border border-purple-600/40 px-2 py-0.5 text-xs font-bold text-purple-400">RIDDOR</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                      <span>{typeInfo.label}</span>
                      {!!inc.project && <span>{String(inc.project)}</span>}
                      {!!inc.date && <span>{String(inc.date)}</span>}
                      {(inc.reported_by_name || inc.reportedBy) ? <span>By: {String(inc.reported_by_name ?? inc.reportedBy)}</span> : null}
                    </div>
                    {selectedId === String(inc.id) && !!inc.description && (
                      <p className="mt-2 text-xs text-gray-400 leading-relaxed">{String(inc.description)}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={clsx('rounded-full px-2.5 py-1 text-xs font-bold', sev.bg, sev.color)}>{sev.label}</span>
                  <span className={clsx('text-xs font-semibold', stat.color)}>{stat.label}</span>
                </div>
              </div>
              {selectedId === String(inc.id) && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(inc)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 py-2 text-xs font-semibold text-white transition-colors">
                    <Edit2 className="w-3.5 h-3.5" /> Edit Record
                  </button>
                  {String(inc.status) !== 'closed' && (
                    <button onClick={() => updateM.mutateAsync({ id: String(inc.id), data: { status: 'closed' } })}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 py-2 text-xs font-semibold text-green-400 transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Close Incident
                    </button>
                  )}
                  <button onClick={() => handleDelete(String(inc.id))}
                    className="rounded-xl bg-gray-800 hover:bg-red-900/20 px-3 py-2 text-red-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-3 text-gray-700" />
            <p className="font-medium">No incidents recorded</p>
            <button onClick={openCreate} className="mt-3 text-sm text-red-400 hover:text-red-300">+ Report an incident</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl my-4">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-white">{editId ? 'Edit Incident' : 'Report Incident'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Record a safety incident, near miss or hazard</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={lbl}>Title *</label>
                <input required value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} placeholder="Brief description of the incident" className={inp} />
              </div>
              <div>
                <label className={lbl}>Type</label>
                <select value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))} className={inp}>
                  {Object.entries(typeConfig).slice(0,5).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Severity</label>
                <select value={form.severity} onChange={e => setForm(p=>({...p,severity:e.target.value}))} className={inp}>
                  {['low','medium','high','critical'].map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select value={form.status} onChange={e => setForm(p=>({...p,status:e.target.value}))} className={inp}>
                  {Object.keys(statusConfig).map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(p=>({...p,date:e.target.value}))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Project</label>
                <input value={form.project} onChange={e => setForm(p=>({...p,project:e.target.value}))} placeholder="Project name" className={inp} />
              </div>
              <div>
                <label className={lbl}>Location on Site</label>
                <input value={form.location} onChange={e => setForm(p=>({...p,location:e.target.value}))} placeholder="e.g. Level 7, Grid C4" className={inp} />
              </div>
              <div>
                <label className={lbl}>Reported By</label>
                <input value={form.reported_by_name} onChange={e => setForm(p=>({...p,reported_by_name:e.target.value}))} placeholder="Name" className={inp} />
              </div>
              <div>
                <label className={lbl}>Injured Party (if any)</label>
                <input value={form.injured_party} onChange={e => setForm(p=>({...p,injured_party:e.target.value}))} placeholder="Name / N/A" className={inp} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))}
                  placeholder="What happened? Include sequence of events..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors resize-none" />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Immediate Action Taken</label>
                <textarea rows={2} value={form.immediate_action} onChange={e => setForm(p=>({...p,immediate_action:e.target.value}))}
                  placeholder="Steps taken immediately after the incident..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors resize-none" />
              </div>
              <div className="col-span-2 flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-600/30">
                <input type="checkbox" id="riddor" checked={form.riddor_reportable}
                  onChange={e => setForm(p=>({...p,riddor_reportable:e.target.checked}))}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500" />
                <label htmlFor="riddor" className="text-sm text-purple-300 cursor-pointer">
                  <span className="font-bold">RIDDOR reportable</span> — must be reported to HSE within 10 days
                </label>
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl bg-gray-800 hover:bg-gray-700 py-3 text-sm font-semibold text-gray-300 transition-colors">Cancel</button>
                <button type="submit" disabled={createM.isPending||updateM.isPending}
                  className="flex-[2] rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 py-3 text-sm font-bold text-white transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {(createM.isPending||updateM.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editId ? 'Save Changes' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
