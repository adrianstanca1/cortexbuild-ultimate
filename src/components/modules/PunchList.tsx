import { useState } from 'react';
import { ListChecks, Plus, Search, CheckCircle, Clock, AlertTriangle, Edit2, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { usePunchList } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STATUS_OPTIONS = ['Open','In Progress','Resolved','Closed','Disputed'];
const PRIORITY_OPTIONS = ['Low','Medium','High','Critical'];
const TRADE_OPTIONS = ['Groundworks','Concrete','Structural Steel','Brickwork','Carpentry','Roofing','Electrical','Plumbing','HVAC','Plastering','Tiling','Painting','Other'];
const CATEGORY_OPTIONS = ['Snagging','Defect','Non-Compliance','Client Request','Safety','Quality','Other'];

const statusColour: Record<string,string> = {
  'Open':'bg-red-500/20 text-red-400','In Progress':'bg-yellow-500/20 text-yellow-400',
  'Resolved':'bg-blue-500/20 text-blue-400','Closed':'bg-green-500/20 text-green-400','Disputed':'bg-purple-500/20 text-purple-400',
};
const priorityColour: Record<string,string> = {
  'Low':'bg-gray-700 text-gray-400','Medium':'bg-yellow-500/20 text-yellow-400',
  'High':'bg-orange-500/20 text-orange-400','Critical':'bg-red-500/20 text-red-400',
};

const emptyForm = { item_number:'',description:'',category:'Snagging',location:'',assigned_to:'',priority:'Medium',status:'Open',due_date:'',project_id:'',trade:'',resolution:'',notes:'' };

export function PunchList() {
  const { useList, useCreate, useUpdate, useDelete } = usePunchList;
  const { data: raw = [], isLoading } = useList();
  const items = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState('open');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Open');
  const [priorityFilter, setPriorityFilter] = useState('All');
  function setTab(key: string, filter: string) { setSubTab(key); setStatusFilter(filter); }
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);

  function getField(i: AnyRow, snake: string, camel: string) { return i[camel] ?? i[snake] ?? ''; }

  const filtered = items.filter(i => {
    const desc = String(i.description ?? '').toLowerCase();
    const num = String(getField(i,'item_number','itemNumber')).toLowerCase();
    const matchSearch = desc.includes(search.toLowerCase()) || num.includes(search.toLowerCase());
    let matchStatus = statusFilter === 'All' || i.status === statusFilter;
    if (subTab === 'closed') matchStatus = ['Resolved','Closed','Disputed'].includes(String(i.status ?? ''));
    const matchPriority = priorityFilter === 'All' || i.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const openCount = items.filter(i => i.status === 'Open').length;
  const inProgressCount = items.filter(i => i.status === 'In Progress').length;
  const closedCount = items.filter(i => i.status === 'Closed').length;
  const criticalCount = items.filter(i => i.priority === 'Critical' && !['Closed','Resolved'].includes(String(i.status ?? ''))).length;

  function nextItemNumber() {
    const nums = items.map(i => parseInt(String(getField(i,'item_number','itemNumber') || '0').replace(/\D/g,''))).filter(n => !isNaN(n));
    return `PL-${String(nums.length > 0 ? Math.max(...nums) + 1 : 1).padStart(3,'0')}`;
  }

  function openCreate() { setEditing(null); setForm({ ...emptyForm, item_number: nextItemNumber() }); setShowModal(true); }
  function openEdit(i: AnyRow) {
    setEditing(i);
    setForm({
      item_number: String(getField(i,'item_number','itemNumber')),
      description: String(i.description ?? ''),
      category: String(i.category ?? 'Snagging'),
      location: String(i.location ?? ''),
      assigned_to: String(getField(i,'assigned_to','assignedTo')),
      priority: String(i.priority ?? 'Medium'),
      status: String(i.status ?? 'Open'),
      due_date: String(getField(i,'due_date','dueDate')),
      project_id: String(getField(i,'project_id','projectId')),
      trade: String(i.trade ?? ''),
      resolution: String(i.resolution ?? ''),
      notes: String(i.notes ?? ''),
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) { await updateMutation.mutateAsync({ id: String(editing.id), data: form }); toast.success('Punch list item updated'); }
    else { await createMutation.mutateAsync(form); toast.success('Item added to punch list'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this punch list item?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Item deleted');
  }

  async function markComplete(i: AnyRow) {
    await updateMutation.mutateAsync({ id: String(i.id), data: { status: 'Closed' } });
    toast.success('Item marked complete');
  }

  async function resolve(i: AnyRow) {
    await updateMutation.mutateAsync({ id: String(i.id), data: { status: 'Resolved' } });
    toast.success('Item marked resolved');
  }

  const closureRate = items.length > 0 ? Math.round((closedCount / items.length) * 100) : 0;

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500';
  const labelCls = 'block text-sm font-medium text-gray-300 mb-1';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Punch List</h1>
          <p className="text-sm text-gray-400 mt-1">Snagging, defects & closeout items</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16} /><span>Add Item</span>
        </button>
      </div>

      {criticalCount > 0 && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-red-400" />
          <p className="text-sm text-red-300"><span className="font-semibold">{criticalCount} critical item{criticalCount > 1 ? 's' : ''}</span> open — immediate attention required.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: openCount, icon: AlertTriangle, colour: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'In Progress', value: inProgressCount, icon: Clock, colour: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Closed', value: closedCount, icon: CheckCircle, colour: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Closure Rate', value: `${closureRate}%`, icon: ListChecks, colour: 'text-blue-400', bg: 'bg-blue-500/10' },
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
          { key: 'open', label: 'Open', filter: 'Open', count: openCount },
          { key: 'progress', label: 'In Progress', filter: 'In Progress', count: inProgressCount },
          { key: 'closed', label: 'Resolved / Closed', filter: 'Resolved', count: closedCount },
          { key: 'all', label: 'All Items', filter: 'All', count: items.length },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key, t.filter)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab === t.key ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key === 'open' && t.count > 0 ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-gray-900 rounded-xl border border-gray-800 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search description…" className={inputCls + ' pl-9'} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All', ...STATUS_OPTIONS].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All', ...PRIORITY_OPTIONS].map(p => <option key={p}>{p}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} items</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
          {filtered.length === 0 && <div className="text-center py-16 text-gray-500"><ListChecks size={40} className="mx-auto mb-3 opacity-30" /><p>No punch list items</p></div>}
          {filtered.map(i => {
            const id = String(i.id ?? '');
            const isExp = expanded === id;
            const itemNumber = String(getField(i,'item_number','itemNumber') || '—');
            const assignedTo = String(getField(i,'assigned_to','assignedTo') || '');
            const dueDate = String(getField(i,'due_date','dueDate') || '');
            return (
              <div key={id}>
                <div className="flex items-center gap-4 p-4 hover:bg-gray-800/50 cursor-pointer" onClick={() => setExpanded(isExp ? null : id)}>
                  <div className="w-16 flex-shrink-0">
                    <p className="text-xs font-bold text-orange-400 font-mono">{itemNumber}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{String(i.description ?? 'No description')}</p>
                    <p className="text-sm text-gray-400">{String(i.category ?? '')} {i.location ? `· ${i.location}` : ''} {i.trade ? `· ${i.trade}` : ''} {assignedTo ? `· ${assignedTo}` : ''}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColour[String(i.priority ?? '')] ?? 'bg-gray-700 text-gray-400'}`}>{String(i.priority ?? '')}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(i.status ?? '')] ?? 'bg-gray-700 text-gray-400'}`}>{String(i.status ?? '')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {(i.status === 'Open' || i.status === 'In Progress') && (
                      <button onClick={e => { e.stopPropagation(); markComplete(i); }} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded" title="Mark Complete"><CheckCircle size={14} /></button>
                    )}
                    {i.status === 'Open' && (
                      <button onClick={e => { e.stopPropagation(); resolve(i); }} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded" title="Resolve"><CheckCircle size={14} /></button>
                    )}
                    <button onClick={e => { e.stopPropagation(); openEdit(i); }} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/20 rounded"><Edit2 size={14} /></button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(id); }} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/20 rounded"><Trash2 size={14} /></button>
                    {isExp ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                  </div>
                </div>
                {isExp && (
                  <div className="px-6 pb-4 bg-gray-800/30 space-y-2 text-sm border-t border-gray-800 pt-3">
                    {!!i.description && <div><p className="text-xs text-gray-500 mb-1">Description</p><p className="text-gray-300">{String(i.description)}</p></div>}
                    {!!i.resolution && <div><p className="text-xs font-semibold text-green-500 mb-1">Resolution</p><p className="text-gray-300">{String(i.resolution)}</p></div>}
                    {!!dueDate && <div><p className="text-xs text-gray-500 mb-1">Due Date</p><p className="text-gray-300">{dueDate}</p></div>}
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
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Item' : 'New Punch List Item'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Item Number</label>
                  <input value={form.item_number} onChange={e => setForm(f => ({ ...f, item_number: e.target.value }))} className={inputCls + ' font-mono'} />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
                    {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Description *</label>
                  <textarea required rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls + ' resize-none'} />
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Level 2, Room 204" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Trade</label>
                  <select value={form.trade} onChange={e => setForm(f => ({ ...f, trade: e.target.value }))} className={inputCls}>
                    <option value="">Select…</option>{TRADE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Assigned To</label>
                  <input value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} className={inputCls} />
                </div>
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
                  <label className={labelCls}>Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Resolution</label>
                  <textarea rows={2} value={form.resolution} onChange={e => setForm(f => ({ ...f, resolution: e.target.value }))} className={inputCls + ' resize-none'} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
