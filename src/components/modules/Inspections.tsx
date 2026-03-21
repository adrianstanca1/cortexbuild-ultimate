import { useState } from 'react';
import { ClipboardCheck, Plus, Search, CheckCircle, XCircle, Clock, AlertTriangle, Edit2, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useInspections } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STATUS_OPTIONS = ['Scheduled','In Progress','Passed','Failed','Conditional Pass','Cancelled'];
const INSPECTION_TYPES = ['Structural','Electrical','Plumbing','MEWP Pre-Use','Scaffold','Fire Safety','Health & Safety','Quality Assurance','Environmental','Third Party','Client Walk','Warranty'];

const statusColour: Record<string,string> = {
  'Scheduled':'bg-blue-500/20 text-blue-400','In Progress':'bg-yellow-500/20 text-yellow-400',
  'Passed':'bg-green-500/20 text-green-400','Failed':'bg-red-500/20 text-red-400',
  'Conditional Pass':'bg-orange-500/20 text-orange-400','Cancelled':'bg-gray-700 text-gray-500',
};

function scoreColour(score: number) {
  if (score >= 85) return 'bg-green-500/20 text-green-400';
  if (score >= 70) return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-red-500/20 text-red-400';
}

const emptyForm = { title:'',type:'Quality Assurance',date:'',inspector:'',location:'',status:'Scheduled',score:'',findings:'',corrective_actions:'',project_id:'',next_inspection:'',notes:'' };

export function Inspections() {
  const { useList, useCreate, useUpdate, useDelete } = useInspections;
  const { data: raw = [], isLoading } = useList();
  const inspections = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState('all');
  function setTab(key: string, filter: string) { setSubTab(key); setStatusFilter(filter); }
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0,10);

  function getField(i: AnyRow, snake: string, camel: string) { return i[camel] ?? i[snake] ?? ''; }

  const filtered = inspections.filter(i => {
    const title = String(i.title ?? '').toLowerCase();
    const matchSearch = title.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || i.status === statusFilter;
    const matchType = typeFilter === 'All' || (i.inspectionType ?? i.type) === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const scheduledCount = inspections.filter(i => i.status === 'Scheduled').length;
  const passedCount = inspections.filter(i => i.status === 'Passed').length;
  const failedCount = inspections.filter(i => i.status === 'Failed').length;
  const dueSoon = inspections.filter(i => {
    const nextDue = i.nextInspection ?? i.next_inspection;
    if (!nextDue) return false;
    const diff = (new Date(String(nextDue)).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 14;
  }).length;

  function openCreate() { setEditing(null); setForm({ ...emptyForm, date: today }); setShowModal(true); }
  function openEdit(i: AnyRow) {
    setEditing(i);
    setForm({
      title: String(i.title ?? ''),
      type: String(i.inspectionType ?? i.type ?? 'Quality Assurance'),
      date: String(i.inspectionDate ?? i.date ?? ''),
      inspector: String(i.inspector ?? ''),
      location: String(i.location ?? ''),
      status: String(i.status ?? 'Scheduled'),
      score: String(i.score ?? ''),
      findings: String(i.findings ?? ''),
      corrective_actions: String(i.correctiveActions ?? i.corrective_actions ?? ''),
      project_id: String(i.projectId ?? i.project_id ?? ''),
      next_inspection: String(i.nextInspection ?? i.next_inspection ?? ''),
      notes: String(i.notes ?? ''),
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, score: form.score ? Number(form.score) : null };
    if (editing) { await updateMutation.mutateAsync({ id: String(editing.id), data: payload }); toast.success('Inspection updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Inspection created'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this inspection?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Inspection deleted');
  }

  async function markPassed(i: AnyRow) {
    await updateMutation.mutateAsync({ id: String(i.id), data: { status: 'Passed' } });
    toast.success('Inspection passed');
  }

  async function markFailed(i: AnyRow) {
    await updateMutation.mutateAsync({ id: String(i.id), data: { status: 'Failed' } });
    toast.warning('Inspection marked failed');
  }

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500';
  const labelCls = 'block text-sm font-medium text-gray-300 mb-1';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inspections</h1>
          <p className="text-sm text-gray-400 mt-1">Quality, safety & compliance inspections</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16} /><span>Schedule Inspection</span>
        </button>
      </div>

      {failedCount > 0 && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <XCircle size={18} className="text-red-400" />
          <p className="text-sm text-red-300"><span className="font-semibold">{failedCount} failed inspection{failedCount > 1 ? 's' : ''}</span> — corrective actions required.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Scheduled', value: scheduledCount, icon: Clock, colour: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Passed', value: passedCount, icon: CheckCircle, colour: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Failed', value: failedCount, icon: XCircle, colour: failedCount > 0 ? 'text-red-400' : 'text-gray-400', bg: failedCount > 0 ? 'bg-red-500/10' : 'bg-gray-800' },
          { label: 'Due in 14 Days', value: dueSoon, icon: AlertTriangle, colour: dueSoon > 0 ? 'text-orange-400' : 'text-gray-400', bg: dueSoon > 0 ? 'bg-orange-500/10' : 'bg-gray-800' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour} /></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-white">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-gray-800">
        {([
          { key: 'all', label: 'All', filter: 'All', count: inspections.length, cls: '' },
          { key: 'scheduled', label: 'Scheduled', filter: 'Scheduled', count: scheduledCount, cls: 'bg-blue-500/20 text-blue-400' },
          { key: 'passed', label: 'Passed', filter: 'Passed', count: passedCount, cls: 'bg-green-500/20 text-green-400' },
          { key: 'failed', label: 'Failed', filter: 'Failed', count: failedCount, cls: 'bg-red-500/20 text-red-400' },
          { key: 'duesoon', label: 'Due Soon', filter: 'Scheduled', count: dueSoon, cls: 'bg-amber-500/20 text-amber-400' },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key, t.filter)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab === t.key ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.cls || 'bg-gray-800 text-gray-400'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-gray-900 rounded-xl border border-gray-800 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inspections…" className={inputCls + ' pl-9'} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All', ...INSPECTION_TYPES].map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All', ...STATUS_OPTIONS].map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} inspections</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
          {filtered.length === 0 && <div className="text-center py-16 text-gray-500"><ClipboardCheck size={40} className="mx-auto mb-3 opacity-30" /><p>No inspections found</p></div>}
          {filtered.map(i => {
            const id = String(i.id ?? '');
            const isExp = expanded === id;
            const score = Number(i.score ?? 0);
            const inspDate = String(i.inspectionDate ?? i.date ?? '—');
            const inspType = String(i.inspectionType ?? i.type ?? '');
            const nextDue = String(i.nextInspection ?? i.next_inspection ?? '');
            return (
              <div key={id}>
                <div className="flex items-center gap-4 p-4 hover:bg-gray-800/50 cursor-pointer" onClick={() => setExpanded(isExp ? null : id)}>
                  <div className="w-20 flex-shrink-0 text-center">
                    <p className="text-xs font-bold text-gray-300">{inspDate}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{String(i.title ?? 'Untitled')}</p>
                    <p className="text-sm text-gray-400">{inspType} {i.inspector ? `· ${i.inspector}` : ''} {i.location ? `· ${i.location}` : ''}</p>
                  </div>
                  {score > 0 && (
                    <div className="hidden md:block">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${scoreColour(score)}`}>{score}%</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(i.status ?? '')] ?? 'bg-gray-700 text-gray-400'}`}>{String(i.status ?? '')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {i.status === 'In Progress' && (
                      <>
                        <button onClick={e => { e.stopPropagation(); markPassed(i); }} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded" title="Pass"><CheckCircle size={14} /></button>
                        <button onClick={e => { e.stopPropagation(); markFailed(i); }} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded" title="Fail"><XCircle size={14} /></button>
                      </>
                    )}
                    <button onClick={e => { e.stopPropagation(); openEdit(i); }} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/20 rounded"><Edit2 size={14} /></button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(id); }} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/20 rounded"><Trash2 size={14} /></button>
                    {isExp ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                  </div>
                </div>
                {isExp && (
                  <div className="px-6 pb-4 bg-gray-800/30 space-y-3 text-sm border-t border-gray-800 pt-3">
                    {!!i.findings && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Findings</p><p className="text-gray-300 whitespace-pre-wrap">{String(i.findings)}</p></div>}
                    {!!(i.corrective_actions ?? i.correctiveActions) && <div><p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">Corrective Actions</p><p className="text-gray-300 whitespace-pre-wrap">{String(i.corrective_actions ?? i.correctiveActions)}</p></div>}
                    {!!nextDue && <div><p className="text-xs text-gray-500 mb-1">Next Inspection Due</p><p className="text-gray-300">{nextDue}</p></div>}
                    {!!i.notes && <div><p className="text-xs text-gray-500 mb-1">Notes</p><p className="text-gray-400">{String(i.notes)}</p></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Inspection' : 'Schedule Inspection'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Inspection Title *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>
                    {INSPECTION_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Inspection Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Inspector</label>
                  <input value={form.inspector} onChange={e => setForm(f => ({ ...f, inspector: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Score (%) <span className="text-gray-500 font-normal">≥85 pass, 70-84 conditional, &lt;70 fail</span></label>
                  <input type="number" min="0" max="100" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Next Due Date</label>
                  <input type="date" value={form.next_inspection} onChange={e => setForm(f => ({ ...f, next_inspection: e.target.value }))} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Findings</label>
                  <textarea rows={3} value={form.findings} onChange={e => setForm(f => ({ ...f, findings: e.target.value }))} className={inputCls + ' resize-none'} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Corrective Actions</label>
                  <textarea rows={3} value={form.corrective_actions} onChange={e => setForm(f => ({ ...f, corrective_actions: e.target.value }))} className={inputCls + ' resize-none'} />
                </div>
              </div>
              {form.score !== '' && Number(form.score) > 0 && (
                <div className={`rounded-xl px-4 py-3 text-sm ${scoreColour(Number(form.score))}`}>
                  Score {form.score}% — {Number(form.score) >= 85 ? 'Pass' : Number(form.score) >= 70 ? 'Conditional Pass' : 'Fail'}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing ? 'Update Inspection' : 'Schedule Inspection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
