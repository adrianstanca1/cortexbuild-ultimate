import { useState } from 'react';
import { ListChecks, Plus, Search, CheckCircle, Clock, AlertTriangle, Edit2, Trash2, X, ChevronDown, ChevronUp, Camera } from 'lucide-react';
import { usePunchList } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STATUS_OPTIONS = ['Open','In Progress','Resolved','Signed Off','Closed'];
const PRIORITY_OPTIONS = ['Low','Medium','High','Critical'];
const CATEGORY_OPTIONS = ['Snagging','Defect','Non-Compliance','Client Request','Safety','Quality','Other'];
const LOCATION_OPTIONS = ['Floor 1','Floor 2','External','Roof','Basement','Atrium','Common Area','Other'];

const statusColour: Record<string,string> = {
  'Open':'bg-red-100 text-red-700','In Progress':'bg-yellow-100 text-yellow-800',
  'Resolved':'bg-blue-100 text-blue-700','Signed Off':'bg-purple-100 text-purple-700','Closed':'bg-green-100 text-green-800',
};

const priorityColour: Record<string,string> = {
  'Low':'bg-gray-100 text-gray-600','Medium':'bg-yellow-100 text-yellow-700',
  'High':'bg-orange-100 text-orange-700','Critical':'bg-red-100 text-red-700',
};

const priorityStripColour: Record<string,string> = {
  'Critical':'bg-red-600','High':'bg-orange-500','Medium':'bg-yellow-500','Low':'bg-gray-400',
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
  const [locationFilter, setLocationFilter] = useState('All');
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
    if (subTab==='closed') matchStatus = ['Resolved','Signed Off','Closed'].includes(String(i.status??''));
    const matchPriority = priorityFilter === 'All' || i.priority === priorityFilter;
    const matchLocation = locationFilter === 'All' || i.location === locationFilter;
    return matchSearch && matchStatus && matchPriority && matchLocation;
  });

  const openCount = items.filter(i=>i.status==='Open').length;
  const inProgressCount = items.filter(i=>i.status==='In Progress').length;
  const resolvedCount = items.filter(i=>i.status==='Resolved').length;
  const signedOffCount = items.filter(i=>i.status==='Signed Off').length;
  const closedCount = items.filter(i=>i.status==='Closed').length;
  const criticalCount = items.filter(i=>i.priority==='Critical' && !['Closed','Signed Off'].includes(String(i.status??''))).length;

  const projectIds = [...new Set(items.map(i=>String(i.project_id??'')).filter(Boolean))];
  const projectCompletion = projectIds.map(pid => {
    const projectItems = items.filter(i=>String(i.project_id??'')=== pid);
    const closedProj = projectItems.filter(i=>i.status==='Closed').length;
    const pct = projectItems.length > 0 ? Math.round((closedProj/projectItems.length)*100) : 0;
    return { projectId: pid, total: projectItems.length, closed: closedProj, percent: pct };
  });

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

  async function markInProgress(i: AnyRow) {
    await updateMutation.mutateAsync({ id:String(i.id), data:{ status:'In Progress' } });
    toast.success('Item marked in progress');
  }

  async function resolve(i: AnyRow) {
    await updateMutation.mutateAsync({ id:String(i.id), data:{ status:'Resolved' } });
    toast.success('Item marked resolved');
  }

  async function requestSignOff(i: AnyRow) {
    await updateMutation.mutateAsync({ id:String(i.id), data:{ status:'Signed Off' } });
    toast.success('Client sign-off requested');
  }

  async function close(i: AnyRow) {
    await updateMutation.mutateAsync({ id:String(i.id), data:{ status:'Closed' } });
    toast.success('Item closed');
  }

  const closureRate = items.length > 0 ? Math.round((closedCount/items.length)*100) : 0;

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Punch List</h1>
          <p className="text-sm text-gray-400 mt-1">Snagging, defects & closeout items</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>Add Item</span>
        </button>
      </div>

      {criticalCount > 0 && (
        <div className="flex items-center gap-3 bg-red-900/30 border border-red-700 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-red-500"/>
          <p className="text-sm text-red-200"><span className="font-semibold">{criticalCount} critical item{criticalCount>1?'s':''}</span> open — immediate attention required.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label:'Open', value:openCount, dot:'bg-red-500' },
          { label:'In Progress', value:inProgressCount, dot:'bg-yellow-500' },
          { label:'Resolved', value:resolvedCount, dot:'bg-blue-500' },
          { label:'Signed Off', value:signedOffCount, dot:'bg-purple-500' },
          { label:'Closed', value:closedCount, dot:'bg-green-500' },
        ].map(kpi=>(
          <div key={kpi.label} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${kpi.dot}`}/>
              <div><p className="text-xs text-gray-400">{kpi.label}</p><p className="text-xl font-bold text-white">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      {projectCompletion.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Completion % per Project</h3>
          {projectCompletion.map(proj => (
            <div key={proj.projectId}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-300">{proj.projectId || 'Unassigned'}</span>
                <span className="text-sm font-semibold text-white">{proj.percent}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{width: `${proj.percent}%`}}/>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-700 overflow-x-auto">
        {([
          { key:'open',     label:'Open',        filter:'Open',        count:openCount },
          { key:'progress', label:'In Progress',  filter:'In Progress', count:inProgressCount },
          { key:'closed',   label:'Resolved / Signed / Closed', filter:'Resolved', count:resolvedCount + signedOffCount + closedCount },
          { key:'all',      label:'All Items',   filter:'All',         count:items.length },
        ]).map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key,t.filter)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${subTab===t.key?'border-orange-500 text-orange-500':'border-transparent text-gray-400 hover:text-gray-300'}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key==='open'&&t.count>0?'bg-red-900 text-red-300':'bg-gray-700 text-gray-400'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search description…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-600 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"/>
        </div>
        <select value={locationFilter} onChange={e=>setLocationFilter(e.target.value)} className="text-sm border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...LOCATION_OPTIONS].map(l=><option key={l}>{l}</option>)}
        </select>
        <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)} className="text-sm border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...PRIORITY_OPTIONS].map(p=><option key={p}>{p}</option>)}
        </select>
        <span className="text-sm text-gray-400 ml-auto">{filtered.length} items</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.length === 0 && <div className="col-span-full text-center py-16 text-gray-500"><ListChecks size={40} className="mx-auto mb-3 opacity-30"/><p>No punch list items</p></div>}
          {filtered.map(i => {
            const id = String(i.id??'');
            const isExp = expanded === id;
            const priority = String(i.priority??'Medium');
            const status = String(i.status??'Open');
            return (
              <div key={id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors">
                <div className="relative p-4 space-y-3">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${priorityStripColour[priority]??'bg-gray-600'}`}/>

                  <div className="flex items-start justify-between gap-3 pl-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-block px-2 py-1 bg-gray-700 text-gray-300 text-xs font-bold rounded font-mono">{String(i.item_number??'—')}</span>
                        <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${priorityColour[priority]??'bg-gray-700 text-gray-400'}`}>{priority}</span>
                      </div>
                      <p className="font-semibold text-white truncate">{String(i.description??'No description')}</p>
                      <p className="text-sm text-gray-400 mt-1">{String(i.category??'')} {Boolean(i.location)?`· ${i.location}`:''}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusColour[status]??'bg-gray-700 text-gray-400'}`}>{status}</span>
                  </div>

                  {Boolean(i.assigned_to) && <p className="text-xs text-gray-400">Assigned to: <span className="text-gray-300">{String(i.assigned_to)}</span></p>}
                  {Boolean(i.due_date) && <p className="text-xs text-gray-400">Due: <span className="text-gray-300">{String(i.due_date)}</span></p>}

                  <div className="bg-gray-900 rounded-lg h-24 border border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:text-gray-300 cursor-pointer transition-colors">
                    <Camera size={20} className="mb-1"/>
                    <p className="text-xs">Tap to attach photo</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {status === 'Open' && (
                      <button onClick={() => markInProgress(i)} className="flex-1 text-xs px-2 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-medium transition-colors">
                        Start Work
                      </button>
                    )}
                    {status === 'In Progress' && (
                      <button onClick={() => resolve(i)} className="flex-1 text-xs px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors">
                        Mark Resolved
                      </button>
                    )}
                    {status === 'Resolved' && (
                      <button onClick={() => requestSignOff(i)} className="flex-1 text-xs px-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors">
                        Request Sign-off
                      </button>
                    )}
                    {status === 'Signed Off' && (
                      <button onClick={() => close(i)} className="flex-1 text-xs px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors">
                        Close Item
                      </button>
                    )}
                    <button onClick={() => openEdit(i)} className="px-2 py-1.5 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded transition-colors">
                      <Edit2 size={14}/>
                    </button>
                    <button onClick={() => handleDelete(id)} className="px-2 py-1.5 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded transition-colors">
                      <Trash2 size={14}/>
                    </button>
                    <button onClick={() => setExpanded(isExp ? null : id)} className="px-2 py-1.5 text-gray-500 hover:text-gray-400">
                      {isExp ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </button>
                  </div>
                </div>

                {isExp && (
                  <div className="px-6 pb-4 bg-gray-900/50 space-y-2 text-sm border-t border-gray-700">
                    {Boolean(i.description) && <div><p className="text-xs text-gray-500 mb-1">DESCRIPTION</p><p className="text-gray-300">{String(i.description)}</p></div>}
                    {Boolean(i.resolution) && <div><p className="text-xs font-semibold text-green-400 mb-1">RESOLUTION</p><p className="text-gray-300">{String(i.resolution)}</p></div>}
                    {Boolean(i.notes) && <div><p className="text-xs text-gray-500 mb-1">NOTES</p><p className="text-gray-300">{String(i.notes)}</p></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <h2 className="text-lg font-semibold text-white">{editing?'Edit Item':'New Punch List Item'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Item Number</label>
                  <input value={form.item_number} onChange={e=>setForm(f=>({...f,item_number:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {CATEGORY_OPTIONS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description *</label>
                  <textarea required rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                  <select value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select location</option>
                    {LOCATION_OPTIONS.map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Assigned To</label>
                  <input value={form.assigned_to} onChange={e=>setForm(f=>({...f,assigned_to:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                  <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {PRIORITY_OPTIONS.map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Resolution</label>
                  <textarea rows={2} value={form.resolution} onChange={e=>setForm(f=>({...f,resolution:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-sm text-gray-300 hover:bg-gray-700">Cancel</button>
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
