import { useState } from 'react';
import { GitBranch, Plus, Search, PoundSterling, CheckCircle, Clock, XCircle, Edit2, Trash2, X, TrendingUp, AlertTriangle, BarChart3, Activity, CheckSquare } from 'lucide-react';
import { useChangeOrders } from '../../hooks/useData';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type AnyRow = Record<string, unknown>;

const STATUS_OPTIONS = ['Draft','Submitted','Under Review','Approved','Rejected','Withdrawn'];
const TYPES = ['Addition','Omission','Substitution','Variation','Provisional Sum'];
const REASONS = ['Client Request','Design Change','Unforeseen Condition','Specification Clarification','Regulatory Requirement','Other'];

const statusColour: Record<string,string> = {
  'Draft':'dark:bg-gray-700 dark:text-gray-300 bg-gray-100 text-gray-700',
  'Submitted':'dark:bg-blue-900 dark:text-blue-300 bg-blue-100 text-blue-800',
  'Under Review':'dark:bg-yellow-900 dark:text-yellow-300 bg-yellow-100 text-yellow-800',
  'Approved':'dark:bg-green-900 dark:text-green-300 bg-green-100 text-green-800',
  'Rejected':'dark:bg-red-900 dark:text-red-300 bg-red-100 text-red-700',
  'Withdrawn':'dark:bg-gray-700 dark:text-gray-400 bg-gray-100 text-gray-500',
};

const emptyForm = { co_number:'',title:'',type:'Addition',reason:'',value:'',days_extension:'0',status:'Draft',project_id:'',submitted_date:'',approved_date:'',description:'',rejection_reason:'' };

// Mock audit logs
function generateAuditLog(co: AnyRow): Array<{action: string; user: string; date: string}> {
  const logs: Array<{action: string; user: string; date: string}> = [];
  logs.push({ action: 'Created', user: 'System', date: '2026-01-15' });
  if (co.submitted_date) logs.push({ action: 'Submitted for approval', user: 'Project Manager', date: String(co.submitted_date) });
  if (co.status === 'Under Review') logs.push({ action: 'Under review', user: 'Approver', date: '2026-02-20' });
  if (co.status === 'Approved' && co.approved_date) logs.push({ action: 'Approved by Client', user: 'Client', date: String(co.approved_date) });
  if (co.status === 'Rejected') logs.push({ action: 'Rejected', user: 'Approver', date: '2026-02-25' });
  return logs;
}

// Mock chart data for 6 months
const chartData = [
  { month: 'Sep', value: 15000 },
  { month: 'Oct', value: 22000 },
  { month: 'Nov', value: 18500 },
  { month: 'Dec', value: 31000 },
  { month: 'Jan', value: 27500 },
  { month: 'Feb', value: 35000 },
];

// Approval workflow timeline
function ApprovalTimeline({ status }: { status: string }) {
  const steps = [
    { label: 'Draft', icon: '📝' },
    { label: 'Submitted', icon: '📤' },
    { label: 'Under Review', icon: '👁️' },
    { label: 'Approved', icon: '✅' },
  ];

  const stepIndex = steps.findIndex(s => s.label === status);
  const isRejected = status === 'Rejected';

  return (
    <div className="flex items-center justify-between mb-6 p-4 dark:bg-gray-700 bg-gray-100 rounded-lg">
      {steps.map((step, idx) => (
        <div key={step.label} className="flex flex-col items-center flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
            idx <= stepIndex && !isRejected
              ? 'dark:bg-green-600 dark:text-white bg-green-500 text-white'
              : 'dark:bg-gray-600 dark:text-gray-400 bg-gray-300 text-gray-500'
          }`}>
            {step.icon}
          </div>
          <p className={`text-xs mt-2 font-medium ${
            idx <= stepIndex && !isRejected
              ? 'dark:text-green-400 text-green-600'
              : 'dark:text-gray-400 text-gray-500'
          }`}>
            {step.label}
          </p>
          {idx < steps.length - 1 && (
            <div className={`h-1 w-8 mt-4 ${
              idx < stepIndex && !isRejected
                ? 'dark:bg-green-600 bg-green-500'
                : 'dark:bg-gray-600 bg-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

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
  const [expandedCoId, setExpandedCoId] = useState<string | null>(null);
  function setTab(key: string, filter: string) { setSubTab(key); setStatusFilter(filter); }
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const PENDING_STATUSES = ['Draft','Submitted','Under Review'];
  const REJECTED_STATUSES = ['Rejected','Withdrawn'];
  const filtered = orders.filter(o => {
    const title = String(o.title??'').toLowerCase();
    const num = String(o.co_number??'').toLowerCase();
    const matchSearch = title.includes(search.toLowerCase()) || num.includes(search.toLowerCase());
    let matchStatus = statusFilter === 'All' || o.status === statusFilter;
    if (subTab === 'pending') matchStatus = PENDING_STATUSES.includes(String(o.status??''));
    if (subTab === 'rejected') matchStatus = REJECTED_STATUSES.includes(String(o.status??''));
    return matchSearch && matchStatus;
  });

  const totalValue = orders.filter(o=>o.status==='Approved').reduce((s,o)=>s+Number(o.value??0),0);
  const pendingValue = orders.filter(o=>['Submitted','Under Review'].includes(String(o.status??''))).reduce((s,o)=>s+Number(o.value??0),0);
  const approvedCount = orders.filter(o=>o.status==='Approved').length;
  const totalDays = orders.filter(o=>o.status==='Approved').reduce((s,o)=>s+Number(o.days_extension??0),0);
  const underReviewCount = orders.filter(o => o.status === 'Under Review').length;

  function nextCONumber() {
    const nums = orders.map(o=>parseInt(String(o.co_number??'0').replace(/\D/g,''))).filter(n=>!isNaN(n));
    const next = nums.length>0?Math.max(...nums)+1:1;
    return `CO-${String(next).padStart(3,'0')}`;
  }

  function openCreate() { setEditing(null); setForm({ ...emptyForm, co_number:nextCONumber() }); setShowModal(true); }
  function openEdit(o: AnyRow) {
    setEditing(o);
    setForm({ co_number:String(o.co_number??''),title:String(o.title??''),type:String(o.type??'Addition'),reason:String(o.reason??''),value:String(o.value??''),days_extension:String(o.days_extension??'0'),status:String(o.status??'Draft'),project_id:String(o.project_id??''),submitted_date:String(o.submitted_date??''),approved_date:String(o.approved_date??''),description:String(o.description??''),rejection_reason:String(o.rejection_reason??'') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, value:Number(form.value)||0, days_extension:Number(form.days_extension)||0 };
    if (editing) { await updateMutation.mutateAsync({ id:String(editing.id), data:payload }); toast.success('Change order updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Change order created'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this change order?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Change order deleted');
  }

  async function approve(o: AnyRow) {
    await updateMutation.mutateAsync({ id:String(o.id), data:{ status:'Approved', approved_date:new Date().toISOString().slice(0,10) } });
    toast.success('Change order approved');
  }

  async function approveAll() {
    const underReview = orders.filter(o => o.status === 'Under Review');
    for (const co of underReview) {
      await updateMutation.mutateAsync({ id:String(co.id), data:{ status:'Approved', approved_date:new Date().toISOString().slice(0,10) } });
    }
    toast.success(`${underReview.length} change orders approved`);
  }

  return (
    <div className="p-6 space-y-6 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white text-gray-900">Change Orders</h1>
          <p className="text-sm dark:text-gray-400 text-gray-500 mt-1">Contract variations, additions & omissions</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>New CO</span>
        </button>
      </div>

      {/* Review Pending Banner */}
      {underReviewCount > 0 && (
        <div className="flex items-center justify-between p-4 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20}/>
            <span className="font-medium">Review Pending ({underReviewCount})</span>
          </div>
          <button onClick={approveAll} className="flex items-center gap-2 px-3 py-1.5 dark:bg-yellow-700 dark:hover:bg-yellow-600 bg-yellow-600 text-white rounded text-sm font-medium hover:bg-yellow-700">
            <CheckSquare size={14}/> Approve All
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Approved Value', value:`£${totalValue.toLocaleString()}`, icon:PoundSterling, colour:'dark:text-green-400 text-green-600', bg:'dark:bg-green-900/30 bg-green-50', border:'dark:border-green-700 border-green-200' },
          { label:'Pending Value', value:`£${pendingValue.toLocaleString()}`, icon:Clock, colour:'dark:text-yellow-400 text-yellow-600', bg:'dark:bg-yellow-900/30 bg-yellow-50', border:'dark:border-yellow-700 border-yellow-200' },
          { label:'Approved COs', value:approvedCount, icon:CheckCircle, colour:'dark:text-green-400 text-green-600', bg:'dark:bg-green-900/30 bg-green-50', border:'dark:border-green-700 border-green-200' },
          { label:'Extension Days', value:totalDays, icon:TrendingUp, colour:'dark:text-orange-400 text-orange-600', bg:'dark:bg-orange-900/30 bg-orange-50', border:'dark:border-orange-700 border-orange-200' },
        ].map(kpi=>(
          <div key={kpi.label} className={`dark:bg-gray-800 dark:border-gray-700 rounded-xl border ${kpi.border} bg-white p-4`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour}/></div>
              <div><p className="text-xs dark:text-gray-400 text-gray-500">{kpi.label}</p><p className="text-xl font-bold dark:text-white text-gray-900">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 dark:border-gray-700 border-b border-gray-200">
        {([
          { key:'all',      label:'All COs',       filter:'All',          count:orders.length },
          { key:'pending',  label:'Pending',        filter:'Submitted',    count:orders.filter(o=>['Draft','Submitted','Under Review'].includes(String(o.status??''))).length },
          { key:'analytics',label:'Analytics',      filter:'Analytics',    count:0 },
          { key:'approved', label:'Approved',       filter:'Approved',     count:approvedCount },
          { key:'rejected', label:'Rejected',       filter:'Rejected',     count:orders.filter(o=>['Rejected','Withdrawn'].includes(String(o.status??''))).length },
        ]).map(t=>(
          <button key={t.key} onClick={()=>{ setSubTab(t.key); if(t.key==='pending'){ setStatusFilter('All'); } else if(t.key!=='analytics'){ setStatusFilter(t.filter); } }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium dark:border-gray-700 dark:text-gray-400 border-b-2 -mb-px transition-colors ${subTab===t.key?'dark:border-orange-600 dark:text-orange-400 border-orange-600 text-orange-600':'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {t.label}
            {t.count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key==='approved'?'dark:bg-green-900 dark:text-green-300 bg-green-100 text-green-700':t.key==='rejected'?'dark:bg-red-900 dark:text-red-300 bg-red-100 text-red-700':'dark:bg-gray-700 dark:text-gray-300 bg-gray-100 text-gray-600'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Analytics Tab */}
      {subTab === 'analytics' && (
        <div className="dark:bg-gray-800 dark:border-gray-700 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 size={20}/>Approved CO Values by Month
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444"/>
              <XAxis dataKey="month" stroke="#888"/>
              <YAxis stroke="#888"/>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444', borderRadius: '8px', color: '#fff' }}/>
              <Bar dataKey="value" fill="#f97316" radius={[8, 8, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Search & Filter */}
      {subTab !== 'analytics' && (
        <div className="flex flex-wrap gap-3 items-center dark:bg-gray-800 dark:border-gray-700 bg-white rounded-xl border border-gray-200 p-4">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-500 text-gray-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search CO number or title…" className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
            {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : subTab !== 'analytics' ? (
        <div className="dark:bg-gray-800 dark:border-gray-700 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="dark:bg-gray-700 dark:border-gray-600 bg-gray-50 border-b border-gray-200">
              <tr>{['CO #','Title','Type','Value','Extension','Status','Submitted',''].map(h=><th key={h} className="px-4 py-3 text-left text-xs dark:text-gray-400 font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="dark:divide-gray-700 divide-y divide-gray-100">
              {filtered.map(o=>(
                <div key={String(o.id)}>
                  <tr className="dark:hover:bg-gray-700/50 hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedCoId(expandedCoId === String(o.id) ? null : String(o.id))}>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-orange-600">{String(o.co_number??'—')}</td>
                    <td className="px-4 py-3 font-medium dark:text-white text-gray-900 max-w-xs truncate">{String(o.title??'—')}</td>
                    <td className="px-4 py-3 dark:text-gray-300 text-gray-600 text-sm">{String(o.type??'—')}</td>
                    <td className="px-4 py-3 font-semibold dark:text-white text-gray-900">£{Number(o.value??0).toLocaleString()}</td>
                    <td className="px-4 py-3 dark:text-gray-300 text-gray-600 text-sm">{Number(o.days_extension??0)>0?`+${o.days_extension}d`:'—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(o.status??'')] ?? 'dark:bg-gray-700 dark:text-gray-300 bg-gray-100 text-gray-700'}`}>{String(o.status??'')}</span></td>
                    <td className="px-4 py-3 dark:text-gray-400 text-gray-500 text-sm">{String(o.submitted_date??'—')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {o.status==='Under Review' && <button onClick={(e)=>{ e.stopPropagation(); approve(o); }} className="p-1.5 dark:text-green-400 text-green-600 dark:hover:bg-green-900/30 hover:bg-green-50 rounded" title="Approve"><CheckCircle size={14}/></button>}
                        <button onClick={(e)=>{ e.stopPropagation(); openEdit(o); }} className="p-1.5 dark:text-gray-500 dark:hover:text-blue-400 text-gray-400 hover:text-blue-600 dark:hover:bg-blue-900/30 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                        <button onClick={(e)=>{ e.stopPropagation(); handleDelete(String(o.id)); }} className="p-1.5 dark:text-gray-500 dark:hover:text-red-400 text-gray-400 hover:text-red-600 dark:hover:bg-red-900/30 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded Row */}
                  {expandedCoId === String(o.id) && (
                    <tr className="dark:bg-gray-700/50 bg-gray-50">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="space-y-4">
                          {/* Approval Timeline */}
                          <ApprovalTimeline status={String(o.status??'Draft')}/>

                          {/* Rejection Reason */}
                          {o.status === 'Rejected' && (
                            <div className="p-4 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-start gap-3">
                              <AlertTriangle size={20} className="flex-shrink-0 mt-0.5"/>
                              <div>
                                <p className="font-semibold">Rejection Reason</p>
                                <p className="text-sm mt-1">{String(o.rejection_reason || 'No reason provided')}</p>
                              </div>
                            </div>
                          )}

                          {/* Impact Analysis */}
                          <div className="grid grid-cols-3 gap-3 p-4 dark:bg-gray-600 bg-gray-100 rounded-lg">
                            <div>
                              <p className="text-xs dark:text-gray-400 text-gray-600 uppercase tracking-wide font-semibold">Contract Impact</p>
                              <p className="text-lg font-bold dark:text-white text-gray-900 mt-1">£{Number(o.value??0).toLocaleString()}</p>
                              <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">{((Number(o.value??0) / 1000000) * 100).toFixed(2)}% of base</p>
                            </div>
                            <div>
                              <p className="text-xs dark:text-gray-400 text-gray-600 uppercase tracking-wide font-semibold">Programme Extension</p>
                              <p className="text-lg font-bold dark:text-white text-gray-900 mt-1">+{Number(o.days_extension??0)}d</p>
                              <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">{(Number(o.days_extension??0) / 7).toFixed(1)} weeks</p>
                            </div>
                            <div>
                              <p className="text-xs dark:text-gray-400 text-gray-600 uppercase tracking-wide font-semibold">Cumulative Approved</p>
                              <p className="text-lg font-bold dark:text-white text-gray-900 mt-1">£{totalValue.toLocaleString()}</p>
                              <p className="text-xs dark:text-gray-400 text-gray-500 mt-0.5">{approvedCount} change orders</p>
                            </div>
                          </div>

                          {/* Audit Log */}
                          <div className="dark:bg-gray-600 bg-gray-100 rounded-lg p-4">
                            <p className="text-sm font-semibold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
                              <Activity size={16}/>Activity Log
                            </p>
                            <div className="space-y-2">
                              {generateAuditLog(o).map((log, idx) => (
                                <div key={idx} className="text-xs dark:text-gray-300 text-gray-600 flex items-start gap-2">
                                  <span className="dark:text-gray-400 text-gray-500">{log.date}</span>
                                  <span>•</span>
                                  <span><span className="font-semibold">{log.action}</span> by {log.user}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Description */}
                          {Boolean(o.description) && (
                            <div className="dark:bg-gray-600 bg-gray-100 rounded-lg p-4">
                              <p className="text-sm font-semibold dark:text-white text-gray-900 mb-2">Description</p>
                              <p className="text-sm dark:text-gray-300 text-gray-700">{String(o.description)}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </div>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-16 dark:text-gray-500 text-gray-400"><GitBranch size={40} className="mx-auto mb-3 opacity-30"/><p>No change orders found</p></div>}
        </div>
      ) : null}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 dark:bg-black/70 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="dark:bg-gray-800 dark:border-gray-700 bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex items-center justify-between p-6 dark:border-gray-700 dark:bg-gray-800 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold dark:text-white text-gray-900">{editing?'Edit Change Order':'New Change Order'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 dark:hover:bg-gray-700 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">CO Number</label>
                  <input value={form.co_number} onChange={e=>setForm(f=>({...f,co_number:e.target.value}))} className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">Title *</label>
                  <input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">Value (£)</label>
                  <input type="number" value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))} className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">Extension Days</label>
                  <input type="number" value={form.days_extension} onChange={e=>setForm(f=>({...f,days_extension:e.target.value}))} className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">Reason</label>
                  <select value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select…</option>{REASONS.map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">Submitted Date</label>
                  <input type="date" value={form.submitted_date} onChange={e=>setForm(f=>({...f,submitted_date:e.target.value}))} className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                {form.status === 'Rejected' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">Rejection Reason</label>
                    <input value={form.rejection_reason} onChange={e=>setForm(f=>({...f,rejection_reason:e.target.value}))} placeholder="Explain why this change order was rejected…" className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">Description</label>
                  <textarea rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing?'Update CO':'Create CO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
