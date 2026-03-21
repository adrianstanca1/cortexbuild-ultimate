import { useState } from 'react';
import { GitBranch, Plus, Search, PoundSterling, CheckCircle, Clock, Edit2, Trash2, X, TrendingUp, AlertTriangle } from 'lucide-react';
import { useChangeOrders } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STATUS_OPTIONS = ['Draft','Submitted','Under Review','Approved','Rejected','Withdrawn'];
const TYPES = ['Addition','Omission','Substitution','Variation','Provisional Sum'];
const REASONS = ['Client Request','Design Change','Unforeseen Condition','Specification Clarification','Regulatory Requirement','Other'];

const statusColour: Record<string,string> = {
  'Draft':'bg-gray-700 text-gray-400','Submitted':'bg-blue-500/20 text-blue-400',
  'Under Review':'bg-yellow-500/20 text-yellow-400','Approved':'bg-green-500/20 text-green-400',
  'Rejected':'bg-red-500/20 text-red-400','Withdrawn':'bg-gray-700 text-gray-500',
};

const emptyForm = { number:'',title:'',type:'Addition',reason:'',amount:'',days_extension:'0',status:'Draft',project_id:'',submitted_date:'',approved_date:'',description:'',schedule_impact:'' };

export function ChangeOrders() {
  const { useList, useCreate, useUpdate, useDelete } = useChangeOrders;
  const { data: raw = [], isLoading } = useList();
  const orders = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  function getField(o: AnyRow, snake: string, camel: string) { return o[camel] ?? o[snake] ?? ''; }

  const PENDING_STATUSES = ['Draft','Submitted','Under Review'];
  const REJECTED_STATUSES = ['Rejected','Withdrawn'];
  const filtered = orders.filter(o => {
    const title = String(o.title ?? '').toLowerCase();
    const num = String(o.number ?? '').toLowerCase();
    const matchSearch = title.includes(search.toLowerCase()) || num.includes(search.toLowerCase());
    let matchStatus = statusFilter === 'All' || o.status === statusFilter;
    if (subTab === 'pending') matchStatus = PENDING_STATUSES.includes(String(o.status ?? ''));
    if (subTab === 'rejected') matchStatus = REJECTED_STATUSES.includes(String(o.status ?? ''));
    return matchSearch && matchStatus;
  });

  const totalValue = orders.filter(o => o.status === 'Approved').reduce((s, o) => s + Number(o.amount ?? 0), 0);
  const pendingValue = orders.filter(o => ['Submitted','Under Review'].includes(String(o.status ?? ''))).reduce((s, o) => s + Number(o.amount ?? 0), 0);
  const approvedCount = orders.filter(o => o.status === 'Approved').length;
  const totalDays = orders.filter(o => o.status === 'Approved').reduce((s, o) => s + Number(o.days_extension ?? o.daysExtension ?? 0), 0);

  function nextCONumber() {
    const nums = orders.map(o => parseInt(String(o.number ?? '0').replace(/\D/g,''))).filter(n => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `CO-${String(next).padStart(3,'0')}`;
  }

  function openCreate() { setEditing(null); setForm({ ...emptyForm, number: nextCONumber() }); setShowModal(true); }
  function openEdit(o: AnyRow) {
    setEditing(o);
    setForm({
      number: String(o.number ?? ''),
      title: String(o.title ?? ''),
      type: String(o.type ?? 'Addition'),
      reason: String(o.reason ?? ''),
      amount: String(o.amount ?? ''),
      days_extension: String(o.daysExtension ?? o.days_extension ?? '0'),
      status: String(o.status ?? 'Draft'),
      project_id: String(o.projectId ?? o.project_id ?? ''),
      submitted_date: String(o.submittedDate ?? o.submitted_date ?? ''),
      approved_date: String(o.approvedDate ?? o.approved_date ?? ''),
      description: String(o.description ?? ''),
      schedule_impact: String(o.scheduleImpact ?? o.schedule_impact ?? ''),
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, amount: Number(form.amount) || 0, days_extension: Number(form.days_extension) || 0 };
    if (editing) { await updateMutation.mutateAsync({ id: String(editing.id), data: payload }); toast.success('Change order updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Change order created'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this change order?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Change order deleted');
  }

  async function approve(o: AnyRow) {
    await updateMutation.mutateAsync({ id: String(o.id), data: { status: 'Approved', approved_date: new Date().toISOString().slice(0,10) } });
    toast.success('Change order approved');
  }

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500';
  const labelCls = 'block text-sm font-medium text-gray-300 mb-1';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Change Orders</h1>
          <p className="text-sm text-gray-400 mt-1">Contract variations, additions & omissions</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16} /><span>New CO</span>
        </button>
      </div>

      {/* Total value summary card */}
      <div className="bg-gradient-to-r from-orange-600/20 to-orange-500/10 border border-orange-500/30 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-orange-300 font-medium">Total Contract Variation Value</p>
            <p className="text-3xl font-bold text-white mt-1">£{totalValue.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Approved change orders only</p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-sm text-yellow-400">£{Math.round(pendingValue).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-green-400">{approvedCount}</p>
              <p className="text-xs text-gray-500">Approved COs</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-400">{totalDays}d</p>
              <p className="text-xs text-gray-500">Extension Days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Approved Value', value: `£${totalValue.toLocaleString()}`, icon: PoundSterling, colour: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Pending Value', value: `£${pendingValue.toLocaleString()}`, icon: Clock, colour: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Approved COs', value: approvedCount, icon: CheckCircle, colour: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Extension Days', value: totalDays, icon: TrendingUp, colour: 'text-orange-400', bg: 'bg-orange-500/10' },
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
          { key: 'all', label: 'All COs', filter: 'All', count: orders.length },
          { key: 'pending', label: 'Pending', filter: 'Submitted', count: orders.filter(o => ['Draft','Submitted','Under Review'].includes(String(o.status ?? ''))).length },
          { key: 'approved', label: 'Approved', filter: 'Approved', count: approvedCount },
          { key: 'rejected', label: 'Rejected', filter: 'Rejected', count: orders.filter(o => ['Rejected','Withdrawn'].includes(String(o.status ?? ''))).length },
        ]).map(t => (
          <button key={t.key} onClick={() => { setSubTab(t.key); if (t.key === 'pending') setStatusFilter('All'); else setStatusFilter(t.filter); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab === t.key ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key === 'approved' ? 'bg-green-500/20 text-green-400' : t.key === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-gray-900 rounded-xl border border-gray-800 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search CO number or title…" className={inputCls + ' pl-9'} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All', ...STATUS_OPTIONS].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-800">
              <tr>{['CO #','Title','Type','Amount','Extension','Schedule Impact','Status','Submitted',''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map(o => {
                const coNumber = String(o.number || '—');
                const daysExt = Number(o.days_extension ?? o.daysExtension ?? 0);
                const scheduleImpact = String(o.schedule_impact ?? o.scheduleImpact ?? '');
                const submittedDate = String(o.submittedDate ?? o.submitted_date ?? '—');
                return (
                  <tr key={String(o.id)} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-orange-400">{coNumber}</td>
                    <td className="px-4 py-3 font-medium text-white max-w-xs truncate">{String(o.title ?? '—')}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{String(o.type ?? '—')}</td>
                    <td className="px-4 py-3 font-semibold text-white">£{Number(o.amount ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{daysExt > 0 ? `+${daysExt}d` : '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm max-w-xs truncate">{scheduleImpact || '—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(o.status ?? '')] ?? 'bg-gray-700 text-gray-400'}`}>{String(o.status ?? '')}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{submittedDate}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {o.status === 'Under Review' && <button onClick={() => approve(o)} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded" title="Approve"><CheckCircle size={14} /></button>}
                        <button onClick={() => openEdit(o)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/20 rounded"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(String(o.id))} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/20 rounded"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-16 text-gray-500"><GitBranch size={40} className="mx-auto mb-3 opacity-30" /><p>No change orders found</p></div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Change Order' : 'New Change Order'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>CO Number</label>
                  <input value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} className={inputCls + ' font-mono'} />
                </div>
                <div>
                  <label className={labelCls}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Title *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Amount (£)</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Extension Days</label>
                  <input type="number" value={form.days_extension} onChange={e => setForm(f => ({ ...f, days_extension: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Reason</label>
                  <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className={inputCls}>
                    <option value="">Select…</option>{REASONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Submitted Date</label>
                  <input type="date" value={form.submitted_date} onChange={e => setForm(f => ({ ...f, submitted_date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Schedule Impact</label>
                  <input value={form.schedule_impact} onChange={e => setForm(f => ({ ...f, schedule_impact: e.target.value }))} placeholder="e.g. 2 weeks delay to completion" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Description</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls + ' resize-none'} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing ? 'Update CO' : 'Create CO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
