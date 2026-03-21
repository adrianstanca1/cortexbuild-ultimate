import { useState } from 'react';
import { ListChecks, Plus, Search, CheckCircle, Clock, AlertTriangle, Edit2, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { usePunchList } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STATUS_OPTIONS = ['Open','In Progress','Resolved','Closed','Disputed'];
const PRIORITY_OPTIONS = ['Low','Medium','High','Critical'];
const CATEGORY_OPTIONS = ['Snagging','Defect','Non-Compliance','Client Request','Safety','Quality','Other'];

const statusColour: Record<string,string> = {
  'Open':'bg-red-100 text-red-700','In Progress':'bg-yellow-100 text-yellow-800',
  'Resolved':'bg-blue-100 text-blue-700','Closed':'bg-green-100 text-green-800','Disputed':'bg-purple-100 text-purple-700',
};
const priorityColour: Record<string,string> = {
  'Low':'bg-gray-100 text-gray-600','Medium':'bg-yellow-100 text-yellow-700',
  'High':'bg-orange-100 text-orange-700','Critical':'bg-red-100 text-red-700',
};

const emptyForm = { item_number:'',description:'',category:'Snagging',location:'',assigned_to:'',priority:'Medium',status:'Open',due_date:'',project_id:'',resolution:'',notes:'' };

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

  const filtered = items.filter(i => {
    const desc = String(i.description??'').toLowerCase();
    const num = String(i.item_number??'').toLowerCase();
    const matchSearch = desc.includes(search.toLowerCase()) || num.includes(search.toLowerCase());
    let matchStatus = statusFilter === 'All' || i.status === statusFilter;
    if (subTab==='closed') matchStatus = ['Resolved','Closed','Disputed'].includes(String(i.status??''));
    const matchPriority = priorityFilter === 'All' || i.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const openCount = items.filter(i=>i.status==='Open').length;
  const inProgressCount = items.filter(i=>i.status==='In Progress').length;
  const closedCount = items.filter(i=>i.status==='Closed').length;
  const criticalCount = items.filter(i=>i.priority==='Critical' && !['Closed','Resolved'].includes(String(i.status??''))).length;

  function nextItemNumber() {
    const nums = items.map(i=>parseInt(String(i.item_number??'0').replace(/\D/g,''))).filter(n=>!isNaN(n));
    return `PL-${String(nums.length>0?Math.max(...nums)+1:1).padStart(3,'0')}`;
  }

  function openCreate() { setEditing(null); setForm({ ...emptyForm, item_number:nextItemNumber() }); setShowModal(true); }
  function openEdit(i: AnyRow) {
    setEditing(i);
    setForm({ item_number:String(i.item_number??''),description:String(i.description??''),category:String(i.category??'Snagging'),location:String(i.location??''),assigned_to:String(i.assigned_to??''),priority:String(i.priority??'Medium'),status:String(i.status??'Open'),due_date:String(i.due_date??''),project_id:String(i.project_id??''),resolution:String(i.resolution??''),notes:String(i.notes??'') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) { await updateMutation.mutateAsync({ id:String(editing.id), data:form }); toast.success('Punch list item updated'); }
    else { await createMutation.mutateAsync(form); toast.success('Item added to punch list'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this punch list item?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Item deleted');
  }

  async function resolve(i: AnyRow) {
    await updateMutation.mutateAsync({ id:String(i.id), data:{ status:'Resolved' } });
    toast.success('Item marked resolved');
  }

  async function close(i: AnyRow) {
    await updateMutation.mutateAsync({ id:String(i.id), data:{ status:'Closed' } });
    toast.success('Item closed');
  }

  const closureRate = items.length > 0 ? Math.round((closedCount/items.length)*100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Punch List</h1>
          <p className="text-sm text-gray-500 mt-1">Snagging, defects & closeout items</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>Add Item</span>
        </button>
      </div>

      {criticalCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-red-600"/>
          <p className="text-sm text-red-700"><span className="font-semibold">{criticalCount} critical item{criticalCount>1?'s':''}</span> open — immediate attention required.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Open', value:openCount, icon:AlertTriangle, colour:'text-red-600', bg:'bg-red-50' },
          { label:'In Progress', value:inProgressCount, icon:Clock, colour:'text-yellow-600', bg:'bg-yellow-50' },
          { label:'Closed', value:closedCount, icon:CheckCircle, colour:'text-green-600', bg:'bg-green-50' },
          { label:'Closure Rate', value:`${closureRate}%`, icon:ListChecks, colour:'text-blue-600', bg:'bg-blue-50' },
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
          { key:'open',     label:'Open',        filter:'Open',        count:openCount },
          { key:'progress', label:'In Progress',  filter:'In Progress', count:inProgressCount },
          { key:'closed',   label:'Resolved / Closed', filter:'Resolved', count:closedCount },
          { key:'all',      label:'All Items',   filter:'All',         count:items.length },
        ]).map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key,t.filter)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab===t.key?'border-orange-600 text-orange-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key==='open'&&t.count>0?'bg-red-100 text-red-700':'bg-gray-100 text-gray-600'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search description…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...PRIORITY_OPTIONS].map(p=><option key={p}>{p}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} items</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><ListChecks size={40} className="mx-auto mb-3 opacity-30"/><p>No punch list items</p></div>}
          {filtered.map(i => {
            const id = String(i.id??'');
            const isExp = expanded === id;
            return (
              <div key={id}>
                <div className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer" onClick={()=>setExpanded(isExp?null:id)}>
                  <div className="w-16 flex-shrink-0">
                    <p className="text-xs font-bold text-orange-600 font-mono">{String(i.item_number??'—')}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{String(i.description??'No description')}</p>
                    <p className="text-sm text-gray-500">{String(i.category??'')} {i.location?`· ${i.location}`:''} {i.assigned_to?`· ${i.assigned_to}`:''}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColour[String(i.priority??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(i.priority??'')}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(i.status??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(i.status??'')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {i.status==='Open' && <button onClick={e=>{e.stopPropagation();resolve(i);}} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Resolve"><CheckCircle size={14}/></button>}
                    {i.status==='Resolved' && <button onClick={e=>{e.stopPropagation();close(i);}} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Close"><CheckCircle size={14}/></button>}
                    <button onClick={e=>{e.stopPropagation();openEdit(i);}} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                    <button onClick={e=>{e.stopPropagation();handleDelete(id);}} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                    {isExp?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
                  </div>
                </div>
                {isExp && (
                  <div className="px-6 pb-4 bg-gray-50 space-y-2 text-sm">
                    {!!i.description && <div><p className="text-xs text-gray-400 mb-1">Description</p><p className="text-gray-700">{String(i.description)}</p></div>}
                    {!!i.resolution && <div><p className="text-xs font-semibold text-green-600 mb-1">Resolution</p><p className="text-gray-700">{String(i.resolution)}</p></div>}
                    {!!i.due_date && <div><p className="text-xs text-gray-400 mb-1">Due Date</p><p>{String(i.due_date)}</p></div>}
                    {!!i.notes && <div><p className="text-xs text-gray-400 mb-1">Notes</p><p className="text-gray-700">{String(i.notes)}</p></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">{editing?'Edit Item':'New Punch List Item'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Number</label>
                  <input value={form.item_number} onChange={e=>setForm(f=>({...f,item_number:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {CATEGORY_OPTIONS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea required rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="e.g. Level 2, Room 204" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <input value={form.assigned_to} onChange={e=>setForm(f=>({...f,assigned_to:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                  <textarea rows={2} value={form.resolution} onChange={e=>setForm(f=>({...f,resolution:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing?'Update Item':'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
