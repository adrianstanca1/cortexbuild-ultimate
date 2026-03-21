import { useState } from 'react';
import { MessageSquare, Plus, Search, Clock, CheckCircle, AlertTriangle, Edit2, Trash2, X, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { useRFIs } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STATUS_OPTIONS = ['Open','Pending Response','Answered','Closed','Overdue'];
const PRIORITY_OPTIONS = ['Low','Medium','High','Critical'];
const DISCIPLINE_OPTIONS = ['Architecture','Structural','MEP','Civil','Geotechnical','Planning','Other'];

const statusColour: Record<string,string> = {
  'Open':'bg-blue-100 text-blue-800','Pending Response':'bg-yellow-100 text-yellow-800',
  'Answered':'bg-green-100 text-green-800','Closed':'bg-gray-100 text-gray-600','Overdue':'bg-red-100 text-red-700',
};
const priorityColour: Record<string,string> = {
  'Low':'bg-green-100 text-green-700','Medium':'bg-yellow-100 text-yellow-700',
  'High':'bg-orange-100 text-orange-700','Critical':'bg-red-100 text-red-700',
};

const emptyForm = { rfi_number:'',title:'',question:'',answer:'',discipline:'',priority:'Medium',status:'Open',assigned_to:'',project_id:'',due_date:'',notes:'' };

export function RFIs() {
  const { useList, useCreate, useUpdate, useDelete } = useRFIs;
  const { data: raw = [], isLoading } = useList();
  const rfis = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = rfis.filter(r => {
    const title = String(r.title??'').toLowerCase();
    const num = String(r.rfi_number??'').toLowerCase();
    const matchSearch = title.includes(search.toLowerCase()) || num.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchPriority = priorityFilter === 'All' || r.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const openCount = rfis.filter(r=>r.status==='Open').length;
  const overdueCount = rfis.filter(r=>r.status==='Overdue').length;
  const answeredCount = rfis.filter(r=>['Answered','Closed'].includes(String(r.status??''))).length;
  const avgDays = rfis.length > 0 ? Math.round(rfis.filter(r=>r.created_at && r.status!=='Closed').length * 3.5) : 0;

  function nextRFINumber() {
    const nums = rfis.map(r => parseInt(String(r.rfi_number??'0').replace(/\D/g,''))).filter(n=>!isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `RFI-${String(next).padStart(3,'0')}`;
  }

  function openCreate() { setEditing(null); setForm({ ...emptyForm, rfi_number:nextRFINumber() }); setShowModal(true); }
  function openEdit(r: AnyRow) {
    setEditing(r);
    setForm({ rfi_number:String(r.rfi_number??''),title:String(r.title??''),question:String(r.question??''),answer:String(r.answer??''),discipline:String(r.discipline??''),priority:String(r.priority??'Medium'),status:String(r.status??'Open'),assigned_to:String(r.assigned_to??''),project_id:String(r.project_id??''),due_date:String(r.due_date??''),notes:String(r.notes??'') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) { await updateMutation.mutateAsync({ id:String(editing.id), data:form }); toast.success('RFI updated'); }
    else { await createMutation.mutateAsync(form); toast.success('RFI created'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this RFI?')) return;
    await deleteMutation.mutateAsync(id); toast.success('RFI deleted');
  }

  async function markAnswered(r: AnyRow) {
    await updateMutation.mutateAsync({ id:String(r.id), data:{ status:'Answered' } });
    toast.success('RFI marked as answered');
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RFIs</h1>
          <p className="text-sm text-gray-500 mt-1">Requests for Information — design & technical queries</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>New RFI</span>
        </button>
      </div>

      {overdueCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-red-600 flex-shrink-0"/>
          <p className="text-sm text-red-700"><span className="font-semibold">{overdueCount} overdue RFI{overdueCount>1?'s':''}</span> — requiring urgent response.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Open', value:openCount, icon:MessageSquare, colour:'text-blue-600', bg:'bg-blue-50' },
          { label:'Overdue', value:overdueCount, icon:AlertTriangle, colour:overdueCount>0?'text-red-600':'text-gray-600', bg:overdueCount>0?'bg-red-50':'bg-gray-50' },
          { label:'Answered / Closed', value:answeredCount, icon:CheckCircle, colour:'text-green-600', bg:'bg-green-50' },
          { label:'Total Raised', value:rfis.length, icon:Clock, colour:'text-purple-600', bg:'bg-purple-50' },
        ].map(kpi=>(
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour}/></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-gray-900">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search RFI number or title…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...PRIORITY_OPTIONS].map(p=><option key={p}>{p}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} RFIs</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><MessageSquare size={40} className="mx-auto mb-3 opacity-30"/><p>No RFIs found</p></div>}
          {filtered.map(r => {
            const id = String(r.id??'');
            const isExp = expanded === id;
            return (
              <div key={id}>
                <div className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer" onClick={()=>setExpanded(isExp?null:id)}>
                  <div className="w-16 flex-shrink-0 text-center">
                    <p className="text-xs font-bold text-orange-600 font-mono">{String(r.rfi_number??'—')}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{String(r.title??'Untitled')}</p>
                    <p className="text-sm text-gray-500">{String(r.discipline??'')} {r.assigned_to?`· Assigned: ${r.assigned_to}`:''} {r.due_date?`· Due: ${r.due_date}`:''}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColour[String(r.priority??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(r.priority??'')}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(r.status??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(r.status??'')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {r.status==='Pending Response' && <button onClick={e=>{e.stopPropagation();markAnswered(r);}} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Mark Answered"><CheckCircle size={14}/></button>}
                    <button onClick={e=>{e.stopPropagation();openEdit(r);}} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                    <button onClick={e=>{e.stopPropagation();handleDelete(id);}} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                    {isExp?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
                  </div>
                </div>
                {isExp && (
                  <div className="px-6 pb-5 bg-gray-50 space-y-3 text-sm">
                    {!!r.question && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Question</p><p className="text-gray-700 leading-relaxed">{String(r.question)}</p></div>}
                    {!!r.answer && <div><p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Answer / Response</p><p className="text-gray-700 leading-relaxed">{String(r.answer)}</p></div>}
                    {!!r.notes && <div><p className="text-xs text-gray-400 mb-1">Notes</p><p className="text-gray-600">{String(r.notes)}</p></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">{editing?'Edit RFI':'New RFI'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RFI Number</label>
                  <input value={form.rfi_number} onChange={e=>setForm(f=>({...f,rfi_number:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
                  <select value={form.discipline} onChange={e=>setForm(f=>({...f,discipline:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select…</option>{DISCIPLINE_OPTIONS.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title / Subject *</label>
                  <input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                  <textarea rows={3} value={form.question} onChange={e=>setForm(f=>({...f,question:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Answer / Response</label>
                  <textarea rows={3} value={form.answer} onChange={e=>setForm(f=>({...f,answer:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {PRIORITY_OPTIONS.map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <input value={form.assigned_to} onChange={e=>setForm(f=>({...f,assigned_to:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing?'Update RFI':'Submit RFI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
