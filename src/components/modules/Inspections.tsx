import { useState } from 'react';
import { ClipboardCheck, Plus, Search, CheckCircle, XCircle, Clock, AlertTriangle, Edit2, Trash2, X, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { useInspections } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STATUS_OPTIONS = ['Scheduled','In Progress','Passed','Failed','Conditional Pass','Cancelled'];
const INSPECTION_TYPES = ['Structural','Electrical','Plumbing','MEWP Pre-Use','Scaffold','Fire Safety','Health & Safety','Quality Assurance','Environmental','Third Party','Client Walk','Warranty'];

const statusColour: Record<string,string> = {
  'Scheduled':'bg-blue-100 text-blue-800','In Progress':'bg-yellow-100 text-yellow-800',
  'Passed':'bg-green-100 text-green-800','Failed':'bg-red-100 text-red-700',
  'Conditional Pass':'bg-orange-100 text-orange-700','Cancelled':'bg-gray-100 text-gray-500',
};

const emptyForm = { title:'',inspection_type:'Quality Assurance',inspection_date:'',inspector:'',location:'',status:'Scheduled',score:'',findings:'',corrective_actions:'',project_id:'',next_due:'',notes:'' };

export function Inspections() {
  const { useList, useCreate, useUpdate, useDelete } = useInspections;
  const { data: raw = [], isLoading } = useList();
  const inspections = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0,10);

  const filtered = inspections.filter(i => {
    const title = String(i.title??'').toLowerCase();
    const matchSearch = title.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || i.status === statusFilter;
    const matchType = typeFilter === 'All' || i.inspection_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const scheduledCount = inspections.filter(i=>i.status==='Scheduled').length;
  const passedCount = inspections.filter(i=>i.status==='Passed').length;
  const failedCount = inspections.filter(i=>i.status==='Failed').length;
  const dueSoon = inspections.filter(i => {
    if (!i.next_due) return false;
    const diff = (new Date(String(i.next_due)).getTime()-Date.now())/86400000;
    return diff >= 0 && diff <= 14;
  }).length;

  function openCreate() { setEditing(null); setForm({ ...emptyForm, inspection_date:today }); setShowModal(true); }
  function openEdit(i: AnyRow) {
    setEditing(i);
    setForm({ title:String(i.title??''),inspection_type:String(i.inspection_type??'Quality Assurance'),inspection_date:String(i.inspection_date??''),inspector:String(i.inspector??''),location:String(i.location??''),status:String(i.status??'Scheduled'),score:String(i.score??''),findings:String(i.findings??''),corrective_actions:String(i.corrective_actions??''),project_id:String(i.project_id??''),next_due:String(i.next_due??''),notes:String(i.notes??'') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, score: form.score ? Number(form.score) : null };
    if (editing) { await updateMutation.mutateAsync({ id:String(editing.id), data:payload }); toast.success('Inspection updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Inspection created'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this inspection?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Inspection deleted');
  }

  async function markPassed(i: AnyRow) {
    await updateMutation.mutateAsync({ id:String(i.id), data:{ status:'Passed' } });
    toast.success('Inspection passed');
  }

  async function markFailed(i: AnyRow) {
    await updateMutation.mutateAsync({ id:String(i.id), data:{ status:'Failed' } });
    toast.warning('Inspection marked failed');
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspections</h1>
          <p className="text-sm text-gray-500 mt-1">Quality, safety & compliance inspections</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>Schedule Inspection</span>
        </button>
      </div>

      {failedCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <XCircle size={18} className="text-red-600"/>
          <p className="text-sm text-red-700"><span className="font-semibold">{failedCount} failed inspection{failedCount>1?'s':''}</span> — corrective actions required.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Scheduled', value:scheduledCount, icon:Clock, colour:'text-blue-600', bg:'bg-blue-50' },
          { label:'Passed', value:passedCount, icon:CheckCircle, colour:'text-green-600', bg:'bg-green-50' },
          { label:'Failed', value:failedCount, icon:XCircle, colour:failedCount>0?'text-red-600':'text-gray-600', bg:failedCount>0?'bg-red-50':'bg-gray-50' },
          { label:'Due in 14 Days', value:dueSoon, icon:AlertTriangle, colour:dueSoon>0?'text-orange-600':'text-gray-600', bg:dueSoon>0?'bg-orange-50':'bg-gray-50' },
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
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search inspections…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...INSPECTION_TYPES].map(t=><option key={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} inspections</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><ClipboardCheck size={40} className="mx-auto mb-3 opacity-30"/><p>No inspections found</p></div>}
          {filtered.map(i => {
            const id = String(i.id??'');
            const isExp = expanded === id;
            const score = Number(i.score??0);
            return (
              <div key={id}>
                <div className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer" onClick={()=>setExpanded(isExp?null:id)}>
                  <div className="w-20 flex-shrink-0 text-center">
                    <p className="text-xs font-bold text-gray-700">{String(i.inspection_date??'—')}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{String(i.title??'Untitled')}</p>
                    <p className="text-sm text-gray-500">{String(i.inspection_type??'')} {i.inspector?`· ${i.inspector}`:''} {i.location?`· ${i.location}`:''}</p>
                  </div>
                  {score > 0 && (
                    <div className="hidden md:flex items-center gap-1">
                      <Star size={12} className="text-yellow-500 fill-yellow-500"/>
                      <span className="text-sm font-semibold">{score}%</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(i.status??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(i.status??'')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {i.status==='In Progress' && <>
                      <button onClick={e=>{e.stopPropagation();markPassed(i);}} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Pass"><CheckCircle size={14}/></button>
                      <button onClick={e=>{e.stopPropagation();markFailed(i);}} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Fail"><XCircle size={14}/></button>
                    </>}
                    <button onClick={e=>{e.stopPropagation();openEdit(i);}} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                    <button onClick={e=>{e.stopPropagation();handleDelete(id);}} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                    {isExp?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
                  </div>
                </div>
                {isExp && (
                  <div className="px-6 pb-4 bg-gray-50 space-y-3 text-sm">
                    {!!i.findings && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Findings</p><p className="text-gray-700 whitespace-pre-wrap">{String(i.findings)}</p></div>}
                    {!!i.corrective_actions && <div><p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Corrective Actions</p><p className="text-gray-700 whitespace-pre-wrap">{String(i.corrective_actions)}</p></div>}
                    {!!i.next_due && <div><p className="text-xs text-gray-400 mb-1">Next Inspection Due</p><p>{String(i.next_due)}</p></div>}
                    {!!i.notes && <div><p className="text-xs text-gray-400 mb-1">Notes</p><p className="text-gray-600">{String(i.notes)}</p></div>}
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
              <h2 className="text-lg font-semibold">{editing?'Edit Inspection':'Schedule Inspection'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Title *</label>
                  <input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.inspection_type} onChange={e=>setForm(f=>({...f,inspection_type:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {INSPECTION_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Date</label>
                  <input type="date" value={form.inspection_date} onChange={e=>setForm(f=>({...f,inspection_date:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inspector</label>
                  <input value={form.inspector} onChange={e=>setForm(f=>({...f,inspector:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Score (%)</label>
                  <input type="number" min="0" max="100" value={form.score} onChange={e=>setForm(f=>({...f,score:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
                  <input type="date" value={form.next_due} onChange={e=>setForm(f=>({...f,next_due:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Findings</label>
                  <textarea rows={3} value={form.findings} onChange={e=>setForm(f=>({...f,findings:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Corrective Actions</label>
                  <textarea rows={3} value={form.corrective_actions} onChange={e=>setForm(f=>({...f,corrective_actions:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing?'Update Inspection':'Schedule Inspection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
