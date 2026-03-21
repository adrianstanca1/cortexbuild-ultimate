import { useState } from 'react';
import { Clock, Plus, Search, PoundSterling, Users, CheckCircle, AlertCircle, Edit2, Trash2, X, Calendar } from 'lucide-react';
import { useTimesheets } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STATUS_OPTIONS = ['Pending','Approved','Rejected','Paid'];
const DAY_TYPES = ['Normal','Overtime','Weekend','Bank Holiday'];

const statusColour: Record<string,string> = {
  'Pending':'bg-yellow-100 text-yellow-800','Approved':'bg-green-100 text-green-800',
  'Rejected':'bg-red-100 text-red-700','Paid':'bg-blue-100 text-blue-800',
};

const emptyForm = { worker_name:'',project_id:'',week_ending:'',monday:'0',tuesday:'0',wednesday:'0',thursday:'0',friday:'0',saturday:'0',sunday:'0',day_type:'Normal',hourly_rate:'',status:'Pending',notes:'' };

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

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
  function setTab(key: 'all'|'pending'|'approved'|'summary', filter: string) { setSubTab(key); setStatusFilter(filter); }
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
  function getTotalPay(t: AnyRow) {
    return getTotalHours(t) * Number(t.hourly_rate??0);
  }

  const totalHours = timesheets.reduce((s,t)=>s+getTotalHours(t),0);
  const totalPayroll = timesheets.reduce((s,t)=>s+getTotalPay(t),0);
  const pendingCount = timesheets.filter(t=>t.status==='Pending').length;
  const approvedCount = timesheets.filter(t=>t.status==='Approved').length;

  // Summary by worker
  const workerMap = new Map<string, { hours: number; pay: number; sheets: number }>();
  timesheets.filter(t=>t.status==='Approved').forEach(t => {
    const name = String(t.worker_name??'Unknown');
    const h = getTotalHours(t); const p = getTotalPay(t);
    const existing = workerMap.get(name) ?? { hours:0, pay:0, sheets:0 };
    workerMap.set(name, { hours: existing.hours+h, pay: existing.pay+p, sheets: existing.sheets+1 });
  });
  const workerSummary = Array.from(workerMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a,b) => b.pay - a.pay);

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
    await updateMutation.mutateAsync({ id:String(t.id), data:{ status:'Approved' } });
    toast.success('Timesheet approved');
  }

  const formTotalHours = DAYS.reduce((s,d)=>s+Number(form[d]||0),0);
  const formTotalPay = formTotalHours * (Number(form.hourly_rate)||0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timesheets</h1>
          <p className="text-sm text-gray-500 mt-1">Weekly hours tracking & payroll calculation</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>Submit Timesheet</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Hours', value:`${totalHours.toFixed(0)}h`, icon:Clock, colour:'text-blue-600', bg:'bg-blue-50' },
          { label:'Total Payroll', value:`£${Math.round(totalPayroll).toLocaleString()}`, icon:PoundSterling, colour:'text-green-600', bg:'bg-green-50' },
          { label:'Pending Approval', value:pendingCount, icon:AlertCircle, colour:pendingCount>0?'text-yellow-600':'text-gray-600', bg:pendingCount>0?'bg-yellow-50':'bg-gray-50' },
          { label:'Approved', value:approvedCount, icon:CheckCircle, colour:'text-green-600', bg:'bg-green-50' },
        ].map(kpi=>(
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour}/></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-gray-900">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {([
          { key:'all'      as const, label:'All Timesheets',   filter:'All',       count:timesheets.length },
          { key:'pending'  as const, label:'Pending Approval', filter:'Pending',   count:pendingCount },
          { key:'approved' as const, label:'Approved',         filter:'Approved',  count:approvedCount },
          { key:'summary'  as const, label:'Payroll Summary',  filter:'Approved',  count:null },
        ]).map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key, t.filter)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab===t.key?'border-orange-600 text-orange-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
            {t.count!==null && <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key==='pending'&&t.count>0?'bg-amber-100 text-amber-700':'bg-gray-100 text-gray-600'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Payroll Summary tab */}
      {subTab==='summary' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Approved Payroll Summary</h3>
            <span className="text-sm text-gray-500">£{Math.round(timesheets.filter(t=>t.status==='Approved').reduce((s,t)=>s+getTotalPay(t),0)).toLocaleString()} total approved</span>
          </div>
          {workerSummary.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Clock size={32} className="mx-auto mb-2 opacity-30"/><p>No approved timesheets yet</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Worker','Approved Sheets','Total Hours','Total Pay','Avg Hours/Week','Avg Pay/Week'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workerSummary.map(w=>(
                  <tr key={w.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {w.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
                        </div>
                        <span className="font-medium text-gray-900">{w.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{w.sheets}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{w.hours}h</td>
                    <td className="px-4 py-3 font-semibold text-green-700">£{Math.round(w.pay).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{w.sheets > 0 ? Math.round(w.hours/w.sheets) : 0}h</td>
                    <td className="px-4 py-3 text-gray-600">£{w.sheets > 0 ? Math.round(w.pay/w.sheets).toLocaleString() : 0}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td className="px-4 py-3 font-semibold text-gray-900">Total</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{workerSummary.reduce((s,w)=>s+w.sheets,0)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{workerSummary.reduce((s,w)=>s+w.hours,0)}h</td>
                  <td className="px-4 py-3 font-semibold text-green-700">£{Math.round(workerSummary.reduce((s,w)=>s+w.pay,0)).toLocaleString()}</td>
                  <td colSpan={2}/>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {subTab !== 'summary' && <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search worker name…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>}

      {subTab !== 'summary' && (isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Worker','Week Ending','M','T','W','T','F','S','S','Total Hrs','Rate','Total Pay','Status',''].map((h,i)=><th key={i} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(t=>{
                const total = getTotalHours(t);
                const pay = getTotalPay(t);
                return (
                  <tr key={String(t.id)} className="hover:bg-gray-50">
                    <td className="px-3 py-3 font-medium text-gray-900">{String(t.worker_name??'—')}</td>
                    <td className="px-3 py-3 text-gray-600">{String(t.week_ending??'—')}</td>
                    {DAYS.map(d=><td key={d} className="px-3 py-3 text-center text-sm text-gray-600">{Number(t[d]??0)||'—'}</td>)}
                    <td className="px-3 py-3 font-semibold text-gray-900">{total}h</td>
                    <td className="px-3 py-3 text-gray-600">£{Number(t.hourly_rate??0)}/h</td>
                    <td className="px-3 py-3 font-semibold text-green-700">£{Math.round(pay).toLocaleString()}</td>
                    <td className="px-3 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(t.status??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(t.status??'')}</span></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {t.status==='Pending' && <button onClick={()=>approve(t)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Approve"><CheckCircle size={14}/></button>}
                        <button onClick={()=>openEdit(t)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                        <button onClick={()=>handleDelete(String(t.id))} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><Clock size={40} className="mx-auto mb-3 opacity-30"/><p>No timesheets found</p></div>}
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">{editing?'Edit Timesheet':'Submit Timesheet'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formTotalHours > 0 && (
                <div className="grid grid-cols-2 gap-3 bg-green-50 rounded-xl p-4 text-sm">
                  <div className="text-center"><p className="text-xs text-gray-500 mb-1">Total Hours</p><p className="font-bold text-gray-900">{formTotalHours}h</p></div>
                  <div className="text-center"><p className="text-xs text-gray-500 mb-1">Total Pay</p><p className="font-bold text-green-700">£{Math.round(formTotalPay).toLocaleString()}</p></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name *</label>
                  <input required value={form.worker_name} onChange={e=>setForm(f=>({...f,worker_name:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Week Ending</label>
                  <input type="date" value={form.week_ending} onChange={e=>setForm(f=>({...f,week_ending:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (£)</label>
                  <input type="number" step="0.01" value={form.hourly_rate} onChange={e=>setForm(f=>({...f,hourly_rate:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day Type</label>
                  <select value={form.day_type} onChange={e=>setForm(f=>({...f,day_type:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {DAY_TYPES.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hours Per Day</label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map((d,i)=>(
                    <div key={d} className="text-center">
                      <p className="text-xs text-gray-500 mb-1">{DAY_LABELS[i]}</p>
                      <input type="number" min="0" max="24" step="0.5" value={form[d]} onChange={e=>setForm(f=>({...f,[d]:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                  {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing?'Update Timesheet':'Submit Timesheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
