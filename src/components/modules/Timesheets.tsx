import { useState } from 'react';
import { Clock, Plus, Search, PoundSterling, Users, CheckCircle, AlertCircle, Edit2, Trash2, X, Calendar, BarChart3, TrendingUp, Download } from 'lucide-react';
import { useTimesheets } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STATUS_OPTIONS = ['Pending','Approved','Rejected','Paid'];
const DAY_TYPES = ['Normal','Overtime','Weekend','Bank Holiday'];

const statusColour: Record<string,string> = {
  'Pending':'bg-yellow-900 text-yellow-100','Approved':'bg-green-900 text-green-100',
  'Rejected':'bg-red-900 text-red-100','Paid':'bg-blue-900 text-blue-100',
};

const emptyForm = { worker_name:'',project_id:'',week_ending:'',monday:'0',tuesday:'0',wednesday:'0',thursday:'0',friday:'0',saturday:'0',sunday:'0',day_type:'Normal',hourly_rate:'',status:'Pending',notes:'' };

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

interface TimesheetRow {
  id: string;
  worker_name: string;
  project_id: string;
  week_ending: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  day_type: string;
  hourly_rate: number;
  status: string;
  notes: string;
  approved_by?: string;
  rejection_reason?: string;
}

export function Timesheets() {
  const { useList, useCreate, useUpdate, useDelete } = useTimesheets;
  const { data: raw = [], isLoading } = useList();
  const timesheets = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState<'weekly'|'allocation'|'payroll'>('weekly');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const filtered = timesheets.filter(t => {
    const name = String(t.worker_name??'').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function getTotalHours(t: AnyRow) {
    return DAYS.reduce((s,d)=>s+Number(t[d]??0),0);
  }

  function getRegularHours(t: AnyRow) {
    const total = getTotalHours(t);
    return Math.min(total, 40);
  }

  function getOvertimeHours(t: AnyRow) {
    const total = getTotalHours(t);
    return Math.max(0, total - 40);
  }

  function getTotalPay(t: AnyRow) {
    const rate = Number(t.hourly_rate??0);
    const regular = getRegularHours(t);
    const overtime = getOvertimeHours(t);
    return (regular * rate) + (overtime * rate * 1.5);
  }

  function getDailyHours(t: AnyRow, day: string): number {
    return Number(t[day]??0);
  }

  function getDayColor(hours: number, isWeekend: boolean): string {
    if (isWeekend) return 'bg-purple-900 text-purple-100';
    if (hours > 8) return 'bg-amber-900 text-amber-100';
    return 'bg-gray-800 text-gray-100';
  }

  const totalHours = timesheets.reduce((s,t)=>s+getTotalHours(t),0);
  const totalPayroll = timesheets.reduce((s,t)=>s+getTotalPay(t),0);
  const pendingCount = timesheets.filter(t=>t.status==='Pending').length;
  const approvedCount = timesheets.filter(t=>t.status==='Approved').length;

  // Worker summary
  const workerMap = new Map<string, { hours: number; regularHours: number; overtimeHours: number; pay: number; sheets: number }>();
  timesheets.filter(t=>t.status==='Approved').forEach(t => {
    const name = String(t.worker_name??'Unknown');
    const h = getTotalHours(t);
    const rh = getRegularHours(t);
    const oh = getOvertimeHours(t);
    const p = getTotalPay(t);
    const existing = workerMap.get(name) ?? { hours:0, regularHours:0, overtimeHours:0, pay:0, sheets:0 };
    workerMap.set(name, {
      hours: existing.hours+h,
      regularHours: existing.regularHours+rh,
      overtimeHours: existing.overtimeHours+oh,
      pay: existing.pay+p,
      sheets: existing.sheets+1
    });
  });
  const workerSummary = Array.from(workerMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a,b) => b.pay - a.pay);

  // Project allocation
  const projectMap = new Map<string, { hours: number; cost: number; workers: Set<string> }>();
  timesheets.filter(t=>t.status==='Approved').forEach(t => {
    const project = String(t.project_id??'Unassigned');
    const h = getTotalHours(t);
    const p = getTotalPay(t);
    const worker = String(t.worker_name??'');
    const existing = projectMap.get(project) ?? { hours:0, cost:0, workers:new Set() };
    existing.workers.add(worker);
    projectMap.set(project, { hours: existing.hours+h, cost: existing.cost+p, workers: existing.workers });
  });
  const projectAllocation = Array.from(projectMap.entries())
    .map(([project, v]) => ({ project, ...v, workerCount: v.workers.size }))
    .sort((a,b) => b.cost - a.cost);

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(t: AnyRow) {
    setEditing(t);
    setForm({ worker_name:String(t.worker_name??''),project_id:String(t.project_id??''),week_ending:String(t.week_ending??''),monday:String(t.monday??'0'),tuesday:String(t.tuesday??'0'),wednesday:String(t.wednesday??'0'),thursday:String(t.thursday??'0'),friday:String(t.friday??'0'),saturday:String(t.saturday??'0'),sunday:String(t.sunday??'0'),day_type:String(t.day_type??'Normal'),hourly_rate:String(t.hourly_rate??''),status:String(t.status??'Pending'),notes:String(t.notes??'') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, monday:Number(form.monday)||0,tuesday:Number(form.tuesday)||0,wednesday:Number(form.wednesday)||0,thursday:Number(form.thursday)||0,friday:Number(form.friday)||0,saturday:Number(form.saturday)||0,sunday:Number(form.sunday)||0,hourly_rate:Number(form.hourly_rate)||0 };
    if (editing) { await updateMutation.mutateAsync({ id:String(editing.id), data:payload }); toast.success('Timesheet updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Timesheet submitted'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this timesheet?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Timesheet deleted');
  }

  async function approve(t: AnyRow) {
    await updateMutation.mutateAsync({ id:String(t.id), data:{ status:'Approved', approved_by: 'Current User' } });
    toast.success('Timesheet approved');
  }

  async function reject(id: string) {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    await updateMutation.mutateAsync({ id, data:{ status:'Rejected', rejection_reason: rejectionReason } });
    toast.success('Timesheet rejected');
    setShowRejectModal(false);
    setRejectingId(null);
    setRejectionReason('');
  }

  async function approveAllPending() {
    const pending = timesheets.filter(t=>t.status==='Pending');
    for (const t of pending) {
      await updateMutation.mutateAsync({ id:String(t.id), data:{ status:'Approved', approved_by: 'Current User' } });
    }
    toast.success(`${pending.length} timesheets approved`);
  }

  const formTotalHours = DAYS.reduce((s,d)=>s+Number(form[d]||0),0);
  const formTotalPay = formTotalHours * (Number(form.hourly_rate)||0);

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen text-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Timesheets</h1>
          <p className="text-sm text-gray-400 mt-1">Weekly hours tracking & payroll calculation</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>Submit Timesheet</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Hours', value:`${totalHours.toFixed(0)}h`, icon:Clock, colour:'text-blue-400', bg:'bg-blue-900/30' },
          { label:'Total Payroll', value:`£${Math.round(totalPayroll).toLocaleString()}`, icon:PoundSterling, colour:'text-green-400', bg:'bg-green-900/30' },
          { label:'Pending Approval', value:pendingCount, icon:AlertCircle, colour:pendingCount>0?'text-amber-400':'text-gray-500', bg:pendingCount>0?'bg-amber-900/30':'bg-gray-800' },
          { label:'Approved', value:approvedCount, icon:CheckCircle, colour:'text-green-400', bg:'bg-green-900/30' },
        ].map(kpi=>(
          <div key={kpi.label} className={`rounded-xl border border-gray-700 p-4 ${kpi.bg}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-800"><kpi.icon size={20} className={kpi.colour}/></div>
              <div><p className="text-xs text-gray-400">{kpi.label}</p><p className="text-xl font-bold text-white">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-700">
        {([
          { key:'weekly'      as const, label:'Weekly Grid',        count:timesheets.length },
          { key:'allocation'  as const, label:'Project Allocation', count:projectAllocation.length },
          { key:'payroll'     as const, label:'Payroll Summary',    count:null },
        ]).map(t=>(
          <button key={t.key} onClick={()=>setSubTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab===t.key?'border-orange-600 text-orange-400':'border-transparent text-gray-400 hover:text-gray-300'}`}>
            {t.label}
            {t.count!==null && <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key==='weekly'&&pendingCount>0?'bg-amber-900 text-amber-200':'bg-gray-800 text-gray-400'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Weekly Grid View */}
      {subTab === 'weekly' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center bg-gray-900 rounded-xl border border-gray-700 p-4">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search worker name…" className="w-full pl-9 pr-4 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
            </div>
            {pendingCount > 0 && (
              <button onClick={approveAllPending} className="flex items-center gap-2 px-4 py-2 bg-green-900 text-green-100 rounded-lg hover:bg-green-800 text-sm font-medium border border-green-700">
                <CheckCircle size={16}/><span>Approve All ({pendingCount})</span>
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Worker</th>
                    {DAY_LABELS.map((d,i)=><th key={d} className="px-3 py-3 text-center text-xs font-semibold text-gray-300 uppercase">{d}</th>)}
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-300 uppercase">Total</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-300 uppercase">Reg Hrs</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-300 uppercase">OT Hrs</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-300 uppercase">Rate</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-300 uppercase">Cost</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-300 uppercase">Status</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filtered.map(t=>{
                    const total = getTotalHours(t);
                    const regHrs = getRegularHours(t);
                    const otHrs = getOvertimeHours(t);
                    const pay = getTotalPay(t);
                    const isWeekend = (h: number) => Number(t.saturday) > 0 || Number(t.sunday) > 0;
                    return (
                      <tr key={String(t.id)} className="hover:bg-gray-800 border-b border-gray-700">
                        <td className="px-4 py-3 font-medium text-white">{String(t.worker_name??'—')}</td>
                        {DAYS.map((d,i)=>{
                          const hours = getDailyHours(t, d);
                          const isWkend = i >= 5;
                          return (
                            <td key={d} className="px-3 py-3 text-center">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getDayColor(hours, isWkend)}`}>
                                {hours || '—'}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-3 py-3 text-center font-semibold text-white">{total}h</td>
                        <td className="px-3 py-3 text-center text-gray-300">{regHrs}h</td>
                        <td className="px-3 py-3 text-center text-amber-400 font-medium">{otHrs}h</td>
                        <td className="px-3 py-3 text-center text-gray-400">£{Number(t.hourly_rate??0)}/h</td>
                        <td className="px-3 py-3 text-center font-semibold text-green-400">£{Math.round(pay).toLocaleString()}</td>
                        <td className="px-3 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(t.status??'')] ?? 'bg-gray-800 text-gray-300'}`}>
                            {String(t.status??'')}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            {t.status==='Pending' && (
                              <>
                                <button onClick={()=>approve(t)} className="p-1.5 text-green-400 hover:bg-green-900/30 rounded" title="Approve"><CheckCircle size={14}/></button>
                                <button onClick={()=>{setRejectingId(String(t.id)); setShowRejectModal(true);}} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded" title="Reject"><X size={14}/></button>
                              </>
                            )}
                            <button onClick={()=>openEdit(t)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-900/30 rounded"><Edit2 size={14}/></button>
                            <button onClick={()=>handleDelete(String(t.id))} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/30 rounded"><Trash2 size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="text-center py-16 text-gray-500"><Clock size={40} className="mx-auto mb-3 opacity-30"/><p>No timesheets found</p></div>}
            </div>
          )}
        </div>
      )}

      {/* Project Allocation Tab */}
      {subTab === 'allocation' && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="font-semibold text-white flex items-center gap-2"><BarChart3 size={18}/>Project Labour Allocation</h3>
          </div>
          {projectAllocation.length === 0 ? (
            <div className="text-center py-12 text-gray-500"><BarChart3 size={32} className="mx-auto mb-2 opacity-30"/><p>No project allocations</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>{['Project','Workers','Total Hours','Cost','% of Labour'].map(h=><th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {projectAllocation.map(p=>{
                  const totalCost = projectAllocation.reduce((s,x)=>s+x.cost,0);
                  const pct = totalCost > 0 ? ((p.cost / totalCost) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={p.project} className="hover:bg-gray-800">
                      <td className="px-6 py-4 font-medium text-white">{p.project}</td>
                      <td className="px-6 py-4 text-gray-300">{p.workerCount} workers</td>
                      <td className="px-6 py-4 text-gray-300">{p.hours}h</td>
                      <td className="px-6 py-4 font-semibold text-green-400">£{Math.round(p.cost).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-700 rounded-full h-2 max-w-xs"><div className="bg-orange-600 h-2 rounded-full" style={{width: `${pct}%`}}/></div>
                          <span className="text-gray-400">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-800 border-t border-gray-700">
                <tr>
                  <td className="px-6 py-4 font-semibold text-white">Total</td>
                  <td className="px-6 py-4 font-semibold text-white">{projectAllocation.reduce((s,p)=>s+p.workerCount,0)} workers</td>
                  <td className="px-6 py-4 font-semibold text-white">{projectAllocation.reduce((s,p)=>s+p.hours,0)}h</td>
                  <td className="px-6 py-4 font-semibold text-green-400">£{Math.round(totalPayroll).toLocaleString()}</td>
                  <td/>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* Payroll Summary Tab */}
      {subTab === 'payroll' && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2"><TrendingUp size={18}/>Payroll Summary</h3>
            <span className="text-sm text-gray-400">£{Math.round(timesheets.filter(t=>t.status==='Approved').reduce((s,t)=>s+getTotalPay(t),0)).toLocaleString()} total approved</span>
          </div>
          {workerSummary.length === 0 ? (
            <div className="text-center py-12 text-gray-500"><Clock size={32} className="mx-auto mb-2 opacity-30"/><p>No approved timesheets yet</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>{['Worker','Sheets','Reg Hrs','OT Hrs','Gross Pay','CIS (20%)','Net Pay'].map(h=><th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {workerSummary.map(w=>{
                  const cis = w.pay * 0.2;
                  const net = w.pay - cis;
                  return (
                    <tr key={w.name} className="hover:bg-gray-800">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {w.name.split(' ').map((n:string)=>n[0]).slice(0,2).join('')}
                          </div>
                          <span className="font-medium text-white">{w.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{w.sheets}</td>
                      <td className="px-6 py-4 text-gray-300">{w.regularHours}h</td>
                      <td className="px-6 py-4 text-amber-400 font-medium">{w.overtimeHours}h</td>
                      <td className="px-6 py-4 font-semibold text-green-400">£{Math.round(w.pay).toLocaleString()}</td>
                      <td className="px-6 py-4 text-gray-400">£{Math.round(cis).toLocaleString()}</td>
                      <td className="px-6 py-4 font-semibold text-white">£{Math.round(net).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-800 border-t border-gray-700">
                <tr>
                  <td className="px-6 py-4 font-semibold text-white">Total</td>
                  <td className="px-6 py-4 font-semibold text-white">{workerSummary.reduce((s,w)=>s+w.sheets,0)}</td>
                  <td className="px-6 py-4 font-semibold text-white">{workerSummary.reduce((s,w)=>s+w.regularHours,0)}h</td>
                  <td className="px-6 py-4 font-semibold text-amber-400">{workerSummary.reduce((s,w)=>s+w.overtimeHours,0)}h</td>
                  <td className="px-6 py-4 font-semibold text-green-400">£{Math.round(workerSummary.reduce((s,w)=>s+w.pay,0)).toLocaleString()}</td>
                  <td className="px-6 py-4 font-semibold text-gray-400">£{Math.round(workerSummary.reduce((s,w)=>s+w.pay*0.2,0)).toLocaleString()}</td>
                  <td className="px-6 py-4 font-semibold text-white">£{Math.round(workerSummary.reduce((s,w)=>s+w.pay*0.8,0)).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* Submit/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-white">{editing?'Edit Timesheet':'Submit Timesheet'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg"><X size={18} className="text-gray-400"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formTotalHours > 0 && (
                <div className="grid grid-cols-2 gap-3 bg-green-900/30 border border-green-700 rounded-xl p-4 text-sm">
                  <div className="text-center"><p className="text-xs text-gray-400 mb-1">Total Hours</p><p className="font-bold text-white">{formTotalHours}h</p></div>
                  <div className="text-center"><p className="text-xs text-gray-400 mb-1">Total Pay</p><p className="font-bold text-green-400">£{Math.round(formTotalPay).toLocaleString()}</p></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Worker Name *</label>
                  <input required value={form.worker_name} onChange={e=>setForm(f=>({...f,worker_name:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Week Ending</label>
                  <input type="date" value={form.week_ending} onChange={e=>setForm(f=>({...f,week_ending:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Hourly Rate (£)</label>
                  <input type="number" step="0.01" value={form.hourly_rate} onChange={e=>setForm(f=>({...f,hourly_rate:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Day Type</label>
                  <select value={form.day_type} onChange={e=>setForm(f=>({...f,day_type:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {DAY_TYPES.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Hours Per Day</label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map((d,i)=>(
                    <div key={d} className="text-center">
                      <p className="text-xs text-gray-400 mb-1">{DAY_LABELS[i]}</p>
                      <input type="number" min="0" max="24" step="0.5" value={form[d]} onChange={e=>setForm(f=>({...f,[d]:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-sm text-center text-white focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing?'Update Timesheet':'Submit Timesheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Reject Timesheet</h2>
              <button onClick={()=>{setShowRejectModal(false); setRejectingId(null); setRejectionReason('');}} className="p-2 hover:bg-gray-800 rounded-lg"><X size={18} className="text-gray-400"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Rejection Reason *</label>
                <textarea value={rejectionReason} onChange={e=>setRejectionReason(e.target.value)} placeholder="Explain why this timesheet is being rejected..." rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={()=>{setShowRejectModal(false); setRejectingId(null); setRejectionReason('');}} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
                <button type="button" onClick={()=>reject(rejectingId!)} disabled={updateMutation.isPending} className="flex-1 px-4 py-2 bg-red-900 text-red-100 rounded-lg text-sm font-medium hover:bg-red-800 disabled:opacity-50 border border-red-700">
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
