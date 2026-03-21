import { useState } from 'react';
import { Clock, Plus, Search, PoundSterling, Users, CheckCircle, AlertCircle, Edit2, Trash2, X, Calendar, XCircle } from 'lucide-react';
import { useTimesheets } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STATUS_OPTIONS = ['Pending','Submitted','Approved','Rejected','Paid'];

const statusColour: Record<string,string> = {
  'Pending':'bg-gray-700 text-gray-300',
  'Submitted':'bg-blue-500/20 text-blue-400',
  'Approved':'bg-green-500/20 text-green-400',
  'Rejected':'bg-red-500/20 text-red-400',
  'Paid':'bg-purple-500/20 text-purple-400',
};

const emptyForm = {
  workerName:'', projectId:'', weekEnding:'',
  regularHours:'', overtimeHours:'', dayworkHours:'',
  totalPay:'', status:'Pending', cisDeduction:'', notes:''
};

export function Timesheets() {
  const { useList, useCreate, useUpdate, useDelete } = useTimesheets;
  const { data: raw = [], isLoading } = useList();
  const timesheets = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState<'all'|'pending'|'approved'|'summary'>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  function getWorkerName(t: AnyRow) { return String(t.workerName ?? t.worker_name ?? ''); }
  function getWeekEnding(t: AnyRow) { return String(t.weekEnding ?? t.week_ending ?? ''); }
  function getTotalPay(t: AnyRow) { return Number(t.totalPay ?? t.total_pay ?? 0); }
  function getCisDeduction(t: AnyRow) { return Number(t.cisDeduction ?? t.cis_deduction ?? 0); }
  function getRegHours(t: AnyRow) { return Number(t.regularHours ?? t.regular_hours ?? 0); }
  function getOTHours(t: AnyRow) { return Number(t.overtimeHours ?? t.overtime_hours ?? 0); }
  function getDWHours(t: AnyRow) { return Number(t.dayworkHours ?? t.daywork_hours ?? 0); }
  function getTotalHours(t: AnyRow) { return getRegHours(t) + getOTHours(t) + getDWHours(t); }

  const setTab = (key: typeof subTab, filter: string) => { setSubTab(key); setStatusFilter(filter); };

  const filtered = timesheets.filter(t => {
    const name = getWorkerName(t).toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    let matchStatus = statusFilter === 'All' || t.status === statusFilter;
    if (subTab === 'pending') matchStatus = t.status === 'Submitted' || t.status === 'Pending';
    if (subTab === 'approved') matchStatus = t.status === 'Approved' || t.status === 'Paid';
    return matchSearch && matchStatus;
  });

  const totalPayroll = timesheets.reduce((s,t) => s + getTotalPay(t), 0);
  const pendingCount = timesheets.filter(t => t.status === 'Submitted' || t.status === 'Pending').length;
  const approvedCount = timesheets.filter(t => t.status === 'Approved' || t.status === 'Paid').length;

  const workerMap = new Map<string, { hours: number; pay: number; sheets: number }>();
  timesheets.filter(t => t.status === 'Approved' || t.status === 'Paid').forEach(t => {
    const name = getWorkerName(t) || 'Unknown';
    const h = getTotalHours(t); const p = getTotalPay(t);
    const existing = workerMap.get(name) ?? { hours: 0, pay: 0, sheets: 0 };
    workerMap.set(name, { hours: existing.hours + h, pay: existing.pay + p, sheets: existing.sheets + 1 });
  });
  const workerSummary = Array.from(workerMap.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.pay - a.pay);

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(t: AnyRow) {
    setEditing(t);
    setForm({
      workerName: getWorkerName(t),
      projectId: String(t.projectId ?? t.project_id ?? ''),
      weekEnding: getWeekEnding(t),
      regularHours: String(getRegHours(t)),
      overtimeHours: String(getOTHours(t)),
      dayworkHours: String(getDWHours(t)),
      totalPay: String(getTotalPay(t)),
      status: String(t.status ?? 'Pending'),
      cisDeduction: String(getCisDeduction(t)),
      notes: String(t.notes ?? ''),
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      worker_name: form.workerName,
      project_id: form.projectId,
      week_ending: form.weekEnding,
      regular_hours: Number(form.regularHours) || 0,
      overtime_hours: Number(form.overtimeHours) || 0,
      daywork_hours: Number(form.dayworkHours) || 0,
      total_pay: Number(form.totalPay) || 0,
      status: form.status,
      cis_deduction: Number(form.cisDeduction) || 0,
      notes: form.notes,
    };
    if (editing) { await updateMutation.mutateAsync({ id: String(editing.id), data: payload }); toast.success('Timesheet updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Timesheet submitted'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this timesheet?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Timesheet deleted');
  }

  async function approve(t: AnyRow) {
    await updateMutation.mutateAsync({ id: String(t.id), data: { status: 'Approved' } });
    toast.success('Timesheet approved');
  }

  async function reject(t: AnyRow) {
    await updateMutation.mutateAsync({ id: String(t.id), data: { status: 'Rejected' } });
    toast.success('Timesheet rejected');
  }

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500';
  const labelCls = 'block text-sm font-medium text-gray-300 mb-1';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Timesheets</h1>
          <p className="text-sm text-gray-400 mt-1">Weekly hours tracking & payroll calculation</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16} /><span>Submit Timesheet</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Payroll', value: `£${Math.round(totalPayroll).toLocaleString()}`, icon: PoundSterling, colour: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Total Sheets', value: timesheets.length, icon: Clock, colour: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Pending Approval', value: pendingCount, icon: AlertCircle, colour: pendingCount > 0 ? 'text-yellow-400' : 'text-gray-400', bg: pendingCount > 0 ? 'bg-yellow-500/10' : 'bg-gray-800' },
          { label: 'Approved', value: approvedCount, icon: CheckCircle, colour: 'text-green-400', bg: 'bg-green-500/10' },
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
          { key: 'all' as const, label: 'All Timesheets', filter: 'All', count: timesheets.length },
          { key: 'pending' as const, label: 'Pending Approval', filter: 'Pending', count: pendingCount },
          { key: 'approved' as const, label: 'Approved', filter: 'Approved', count: approvedCount },
          { key: 'summary' as const, label: 'Payroll Summary', filter: 'Approved', count: null },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key, t.filter)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab === t.key ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
            {t.label}
            {t.count !== null && <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key === 'pending' && t.count > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-400'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {subTab === 'summary' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-semibold text-white">Approved Payroll Summary</h3>
            <span className="text-sm text-gray-400">£{Math.round(timesheets.filter(t => t.status === 'Approved' || t.status === 'Paid').reduce((s, t) => s + getTotalPay(t), 0)).toLocaleString()} total approved</span>
          </div>
          {workerSummary.length === 0 ? (
            <div className="text-center py-12 text-gray-500"><Clock size={32} className="mx-auto mb-2 opacity-30" /><p>No approved timesheets yet</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50 border-b border-gray-800">
                <tr>{['Worker', 'Approved Sheets', 'Total Hours', 'Total Pay', 'Avg Hours/Week', 'Avg Pay/Week'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {workerSummary.map(w => (
                  <tr key={w.name} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {w.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <span className="font-medium text-white">{w.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{w.sheets}</td>
                    <td className="px-4 py-3 font-medium text-white">{w.hours}h</td>
                    <td className="px-4 py-3 font-semibold text-green-400">£{Math.round(w.pay).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-400">{w.sheets > 0 ? Math.round(w.hours / w.sheets) : 0}h</td>
                    <td className="px-4 py-3 text-gray-400">£{w.sheets > 0 ? Math.round(w.pay / w.sheets).toLocaleString() : 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {subTab !== 'summary' && (
        <div className="flex flex-wrap gap-3 items-center bg-gray-900 rounded-xl border border-gray-800 p-4">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search worker name…" className={inputCls + ' pl-9'} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
            {['All', ...STATUS_OPTIONS].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      )}

      {subTab !== 'summary' && (isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-800">
              <tr>{['Worker', 'Week Ending', 'Reg Hours', 'OT Hours', 'Daywork', 'Total Hrs', 'Total Pay', 'CIS Ded.', 'Status', ''].map((h, i) => <th key={i} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map(t => {
                const totalHrs = getTotalHours(t);
                const pay = getTotalPay(t);
                const cis = getCisDeduction(t);
                return (
                  <tr key={String(t.id)} className="hover:bg-gray-800/50">
                    <td className="px-3 py-3 font-medium text-white">{getWorkerName(t) || '—'}</td>
                    <td className="px-3 py-3 text-gray-400">{getWeekEnding(t) || '—'}</td>
                    <td className="px-3 py-3 text-center text-gray-300">{getRegHours(t) || '—'}</td>
                    <td className="px-3 py-3 text-center text-gray-300">{getOTHours(t) || '—'}</td>
                    <td className="px-3 py-3 text-center text-gray-300">{getDWHours(t) || '—'}</td>
                    <td className="px-3 py-3 font-semibold text-white">{totalHrs}h</td>
                    <td className="px-3 py-3 font-semibold text-green-400">£{Math.round(pay).toLocaleString()}</td>
                    <td className="px-3 py-3 text-red-400">{cis > 0 ? `£${Math.round(cis).toLocaleString()}` : '—'}</td>
                    <td className="px-3 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(t.status ?? '')] ?? 'bg-gray-700 text-gray-300'}`}>{String(t.status ?? '')}</span></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {(t.status === 'Submitted' || t.status === 'Pending') && (
                          <>
                            <button onClick={() => approve(t)} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded" title="Approve"><CheckCircle size={14} /></button>
                            <button onClick={() => reject(t)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded" title="Reject"><XCircle size={14} /></button>
                          </>
                        )}
                        <button onClick={() => openEdit(t)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/20 rounded"><Edit2 size={14} /></button>
                        <button onClick={() => handleDelete(String(t.id))} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/20 rounded"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-16 text-gray-500"><Clock size={40} className="mx-auto mb-3 opacity-30" /><p>No timesheets found</p></div>}
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Timesheet' : 'Submit Timesheet'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Worker Name *</label>
                  <input required value={form.workerName} onChange={e => setForm(f => ({ ...f, workerName: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Project</label>
                  <input value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))} placeholder="Project name or ID" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Week Ending</label>
                  <input type="date" value={form.weekEnding} onChange={e => setForm(f => ({ ...f, weekEnding: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Regular Hours</label>
                  <input type="number" step="0.5" min="0" value={form.regularHours} onChange={e => setForm(f => ({ ...f, regularHours: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Overtime Hours</label>
                  <input type="number" step="0.5" min="0" value={form.overtimeHours} onChange={e => setForm(f => ({ ...f, overtimeHours: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Daywork Hours</label>
                  <input type="number" step="0.5" min="0" value={form.dayworkHours} onChange={e => setForm(f => ({ ...f, dayworkHours: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Total Pay (£)</label>
                  <input type="number" step="0.01" min="0" value={form.totalPay} onChange={e => setForm(f => ({ ...f, totalPay: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>CIS Deduction (£)</label>
                  <input type="number" step="0.01" min="0" value={form.cisDeduction} onChange={e => setForm(f => ({ ...f, cisDeduction: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Notes</label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} />
                </div>
              </div>
              {(Number(form.regularHours) + Number(form.overtimeHours) + Number(form.dayworkHours)) > 0 && (
                <div className="grid grid-cols-2 gap-3 bg-gray-800 rounded-xl p-4 text-sm">
                  <div className="text-center"><p className="text-xs text-gray-500 mb-1">Total Hours</p><p className="font-bold text-white">{Number(form.regularHours) + Number(form.overtimeHours) + Number(form.dayworkHours)}h</p></div>
                  <div className="text-center"><p className="text-xs text-gray-500 mb-1">Total Pay</p><p className="font-bold text-green-400">£{Number(form.totalPay) > 0 ? Math.round(Number(form.totalPay)).toLocaleString() : '—'}</p></div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing ? 'Update Timesheet' : 'Submit Timesheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
