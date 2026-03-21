import { useState } from 'react';
import { MessageSquare, Plus, Search, Clock, CheckCircle, AlertTriangle, Edit2, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useRFIs } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STATUS_OPTIONS = ['Open','Pending Response','Answered','Closed','Overdue'];
const PRIORITY_OPTIONS = ['Low','Medium','High','Critical'];
const DISCIPLINE_OPTIONS = ['Architecture','Structural','MEP','Civil','Geotechnical','Planning','Other'];

const statusColour: Record<string,string> = {
  'Open':'bg-blue-500/20 text-blue-400','Pending Response':'bg-yellow-500/20 text-yellow-400',
  'Answered':'bg-green-500/20 text-green-400','Closed':'bg-gray-700 text-gray-400','Overdue':'bg-red-500/20 text-red-400',
};
const priorityColour: Record<string,string> = {
  'Low':'bg-green-500/20 text-green-400','Medium':'bg-yellow-500/20 text-yellow-400',
  'High':'bg-orange-500/20 text-orange-400','Critical':'bg-red-500/20 text-red-400',
};

const emptyForm = { rfi_number:'',title:'',question:'',answer:'',discipline:'',priority:'Medium',status:'Open',assigned_to:'',submitted_by:'',project_id:'',due_date:'',notes:'' };

export function RFIs() {
  const { useList, useCreate, useUpdate, useDelete } = useRFIs;
  const { data: raw = [], isLoading } = useList();
  const rfis = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  function setTab(key: string, filter: string) { setSubTab(key); setStatusFilter(filter); }
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);

  function getField(r: AnyRow, snake: string, camel: string) { return r[camel] ?? r[snake] ?? ''; }

  const filtered = rfis.filter(r => {
    const title = String(getField(r,'title','title')).toLowerCase();
    const num = String(getField(r,'rfi_number','rfiNumber')).toLowerCase();
    const matchSearch = title.includes(search.toLowerCase()) || num.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchPriority = priorityFilter === 'All' || r.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const openCount = rfis.filter(r => r.status === 'Open').length;
  const overdueCount = rfis.filter(r => r.status === 'Overdue').length;
  const answeredCount = rfis.filter(r => ['Answered','Closed'].includes(String(r.status ?? ''))).length;

  function nextRFINumber() {
    const nums = rfis.map(r => parseInt(String(getField(r,'rfi_number','rfiNumber') || '0').replace(/\D/g,''))).filter(n => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `RFI-${String(next).padStart(3,'0')}`;
  }

  function openCreate() { setEditing(null); setForm({ ...emptyForm, rfi_number: nextRFINumber() }); setShowModal(true); }
  function openEdit(r: AnyRow) {
    setEditing(r);
    setForm({
      rfi_number: String(getField(r,'rfi_number','rfiNumber')),
      title: String(getField(r,'title','title')),
      question: String(getField(r,'question','question')),
      answer: String(getField(r,'answer','answer')),
      discipline: String(getField(r,'discipline','discipline')),
      priority: String(r.priority ?? 'Medium'),
      status: String(r.status ?? 'Open'),
      assigned_to: String(getField(r,'assigned_to','assignedTo')),
      submitted_by: String(getField(r,'submitted_by','submittedBy')),
      project_id: String(getField(r,'project_id','projectId')),
      due_date: String(getField(r,'due_date','dueDate')),
      notes: String(r.notes ?? ''),
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) { await updateMutation.mutateAsync({ id: String(editing.id), data: form }); toast.success('RFI updated'); }
    else { await createMutation.mutateAsync(form); toast.success('RFI created'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this RFI?')) return;
    await deleteMutation.mutateAsync(id); toast.success('RFI deleted');
  }

  async function markAnswered(r: AnyRow) {
    await updateMutation.mutateAsync({ id: String(r.id), data: { status: 'Answered' } });
    toast.success('RFI marked as answered');
  }

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500';
  const labelCls = 'block text-sm font-medium text-gray-300 mb-1';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">RFIs</h1>
          <p className="text-sm text-gray-400 mt-1">Requests for Information — design & technical queries</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16} /><span>New RFI</span>
        </button>
      </div>

      {overdueCount > 0 && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300"><span className="font-semibold">{overdueCount} overdue RFI{overdueCount > 1 ? 's' : ''}</span> — requiring urgent response.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: openCount, icon: MessageSquare, colour: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Overdue', value: overdueCount, icon: AlertTriangle, colour: overdueCount > 0 ? 'text-red-400' : 'text-gray-400', bg: overdueCount > 0 ? 'bg-red-500/10' : 'bg-gray-800' },
          { label: 'Answered / Closed', value: answeredCount, icon: CheckCircle, colour: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Total Raised', value: rfis.length, icon: Clock, colour: 'text-purple-400', bg: 'bg-purple-500/10' },
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
          { key: 'all', label: 'All RFIs', filter: 'All', count: rfis.length },
          { key: 'open', label: 'Open', filter: 'Open', count: openCount },
          { key: 'pending', label: 'Pending Response', filter: 'Pending Response', count: rfis.filter(r => r.status === 'Pending Response').length },
          { key: 'answered', label: 'Answered / Closed', filter: 'Answered', count: answeredCount },
          { key: 'overdue', label: 'Overdue', filter: 'Overdue', count: overdueCount },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key, t.filter)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab === t.key ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key === 'overdue' && t.count > 0 ? 'bg-red-500/20 text-red-400' : t.key === 'open' && t.count > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-800 text-gray-400'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-gray-900 rounded-xl border border-gray-800 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search RFI number or title…" className={inputCls + ' pl-9'} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All', ...STATUS_OPTIONS].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All', ...PRIORITY_OPTIONS].map(p => <option key={p}>{p}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} RFIs</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
          {filtered.length === 0 && <div className="text-center py-16 text-gray-500"><MessageSquare size={40} className="mx-auto mb-3 opacity-30" /><p>No RFIs found</p></div>}
          {filtered.map(r => {
            const id = String(r.id ?? '');
            const isExp = expanded === id;
            const rfiNumber = String(getField(r,'rfi_number','rfiNumber') || '—');
            const assignedTo = String(getField(r,'assigned_to','assignedTo') || '');
            const dueDate = String(getField(r,'due_date','dueDate') || '');
            const submittedBy = String(getField(r,'submitted_by','submittedBy') || '');
            return (
              <div key={id}>
                <div className="flex items-center gap-4 p-4 hover:bg-gray-800/50 cursor-pointer" onClick={() => setExpanded(isExp ? null : id)}>
                  <div className="w-20 flex-shrink-0 text-center">
                    <p className="text-xs font-bold text-orange-400 font-mono">{rfiNumber}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{String(r.title ?? 'Untitled')}</p>
                    <p className="text-sm text-gray-400">{String(r.discipline ?? '')} {assignedTo ? `· Assigned: ${assignedTo}` : ''} {submittedBy ? `· By: ${submittedBy}` : ''} {dueDate ? `· Due: ${dueDate}` : ''}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColour[String(r.priority ?? '')] ?? 'bg-gray-700 text-gray-400'}`}>{String(r.priority ?? '')}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(r.status ?? '')] ?? 'bg-gray-700 text-gray-400'}`}>{String(r.status ?? '')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {r.status === 'Pending Response' && <button onClick={e => { e.stopPropagation(); markAnswered(r); }} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded" title="Mark Answered"><CheckCircle size={14} /></button>}
                    <button onClick={e => { e.stopPropagation(); openEdit(r); }} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/20 rounded"><Edit2 size={14} /></button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(id); }} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/20 rounded"><Trash2 size={14} /></button>
                    {isExp ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                  </div>
                </div>
                {isExp && (
                  <div className="px-6 pb-5 bg-gray-800/30 space-y-3 text-sm border-t border-gray-800 pt-3">
                    {!!r.question && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Question</p><p className="text-gray-300 leading-relaxed">{String(r.question)}</p></div>}
                    {!!r.answer && <div><p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">Answer / Response</p><p className="text-gray-300 leading-relaxed">{String(r.answer)}</p></div>}
                    {!!r.notes && <div><p className="text-xs text-gray-500 mb-1">Notes</p><p className="text-gray-400">{String(r.notes)}</p></div>}
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
              <h2 className="text-lg font-semibold text-white">{editing ? 'Edit RFI' : 'New RFI'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>RFI Number</label>
                  <input value={form.rfi_number} onChange={e => setForm(f => ({ ...f, rfi_number: e.target.value }))} className={inputCls + ' font-mono'} />
                </div>
                <div>
                  <label className={labelCls}>Discipline</label>
                  <select value={form.discipline} onChange={e => setForm(f => ({ ...f, discipline: e.target.value }))} className={inputCls}>
                    <option value="">Select…</option>{DISCIPLINE_OPTIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Subject / Title *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Question</label>
                  <textarea rows={3} value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} className={inputCls + ' resize-none'} />
                </div>
                {editing && (
                  <div className="col-span-2">
                    <label className={labelCls}>Answer / Response</label>
                    <textarea rows={3} value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} className={inputCls + ' resize-none'} />
                  </div>
                )}
                <div>
                  <label className={labelCls}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className={inputCls}>
                    {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Submitted By</label>
                  <input value={form.submitted_by} onChange={e => setForm(f => ({ ...f, submitted_by: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Assigned To</label>
                  <input value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing ? 'Update RFI' : 'Submit RFI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
