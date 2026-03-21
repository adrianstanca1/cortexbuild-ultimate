import { useState } from 'react';
import { Shield, Plus, Search, FileCheck, AlertTriangle, Clock, CheckCircle, Edit2, Trash2, X, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { useRAMS } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STATUS_OPTIONS = ['Draft','Under Review','Approved','Expired','Superseded'];
const ACTIVITY_TYPES = ['Groundworks','Structural Steel','Concrete Works','Roofing','Scaffolding','Electrical','Plumbing','MEWP Operations','Demolition','Excavation','Working at Height','Hot Works','Confined Space'];
const RISK_LEVELS = ['Low','Medium','High','Critical'];

const statusColour: Record<string,string> = {
  'Draft':'bg-gray-100 text-gray-700','Under Review':'bg-yellow-100 text-yellow-800',
  'Approved':'bg-green-100 text-green-800','Expired':'bg-red-100 text-red-700','Superseded':'bg-gray-100 text-gray-500',
};
const riskColour: Record<string,string> = {
  'Low':'bg-green-100 text-green-800','Medium':'bg-yellow-100 text-yellow-800','High':'bg-orange-100 text-orange-800','Critical':'bg-red-100 text-red-800',
};

const emptyForm = { title:'',activity_type:'',project_id:'',risk_level:'Medium',status:'Draft',reviewed_by:'',approved_by:'',valid_from:'',valid_until:'',hazards:'',controls:'',ppe_required:'',notes:'' };

export function RAMS() {
  const { useList, useCreate, useUpdate, useDelete } = useRAMS;
  const { data: raw = [], isLoading } = useList();
  const rams = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = rams.filter(r => {
    const title = String(r.title??'').toLowerCase();
    const activity = String(r.activity_type??'').toLowerCase();
    const matchSearch = title.includes(search.toLowerCase()) || activity.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const approvedCount = rams.filter(r=>r.status==='Approved').length;
  const reviewCount = rams.filter(r=>r.status==='Under Review').length;
  const expiredCount = rams.filter(r=>r.status==='Expired').length;
  const expiringSoon = rams.filter(r => {
    if (!r.valid_until || r.status !== 'Approved') return false;
    const diff = (new Date(String(r.valid_until)).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 30;
  }).length;

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(r: AnyRow) {
    setEditing(r);
    setForm({ title:String(r.title??''),activity_type:String(r.activity_type??''),project_id:String(r.project_id??''),risk_level:String(r.risk_level??'Medium'),status:String(r.status??'Draft'),reviewed_by:String(r.reviewed_by??''),approved_by:String(r.approved_by??''),valid_from:String(r.valid_from??''),valid_until:String(r.valid_until??''),hazards:String(r.hazards??''),controls:String(r.controls??''),ppe_required:String(r.ppe_required??''),notes:String(r.notes??'') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) { await updateMutation.mutateAsync({ id:String(editing.id), data:form }); toast.success('RAMS updated'); }
    else { await createMutation.mutateAsync(form); toast.success('RAMS created'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this RAMS document?')) return;
    await deleteMutation.mutateAsync(id); toast.success('RAMS deleted');
  }

  async function approve(r: AnyRow) {
    await updateMutation.mutateAsync({ id:String(r.id), data:{ status:'Approved' } });
    toast.success('RAMS approved');
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RAMS</h1>
          <p className="text-sm text-gray-500 mt-1">Risk Assessment & Method Statements</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>New RAMS</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Approved', value:approvedCount, icon:CheckCircle, colour:'text-green-600', bg:'bg-green-50' },
          { label:'Under Review', value:reviewCount, icon:Clock, colour:'text-yellow-600', bg:'bg-yellow-50' },
          { label:'Expired', value:expiredCount, icon:AlertTriangle, colour:'text-red-600', bg:'bg-red-50' },
          { label:'Expiring Soon', value:expiringSoon, icon:FileCheck, colour:expiringSoon>0?'text-orange-600':'text-gray-600', bg:expiringSoon>0?'bg-orange-50':'bg-gray-50' },
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
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title or activity…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><Shield size={40} className="mx-auto mb-3 opacity-30"/><p>No RAMS documents found</p></div>}
          {filtered.map(r => {
            const id = String(r.id??'');
            const isExp = expanded === id;
            return (
              <div key={id}>
                <div className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer" onClick={()=>setExpanded(isExp?null:id)}>
                  <div className={`p-2 rounded-lg flex-shrink-0 ${riskColour[String(r.risk_level??'')] ? 'bg-opacity-20' : 'bg-gray-50'}`}>
                    <Shield size={20} className={riskColour[String(r.risk_level??'')]?.split(' ')[1] ?? 'text-gray-400'}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{String(r.title??'Untitled')}</p>
                    <p className="text-sm text-gray-500">{String(r.activity_type??'')} {r.valid_until?`· Expires ${r.valid_until}`:''}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${riskColour[String(r.risk_level??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(r.risk_level??'')}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(r.status??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(r.status??'')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {r.status === 'Under Review' && <button onClick={e=>{e.stopPropagation();approve(r);}} className="p-1.5 text-green-600 hover:bg-green-50 rounded text-xs" title="Approve"><CheckCircle size={14}/></button>}
                    <button onClick={e=>{e.stopPropagation();openEdit(r);}} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                    <button onClick={e=>{e.stopPropagation();handleDelete(id);}} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded" title="Download"><Download size={14}/></button>
                    {isExp?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
                  </div>
                </div>
                {isExp && (
                  <div className="px-6 pb-4 bg-gray-50 space-y-3 text-sm">
                    {!!r.hazards && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Hazards Identified</p><p className="text-gray-700 whitespace-pre-wrap">{String(r.hazards)}</p></div>}
                    {!!r.controls && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Control Measures</p><p className="text-gray-700 whitespace-pre-wrap">{String(r.controls)}</p></div>}
                    {!!r.ppe_required && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">PPE Required</p><p className="text-gray-700">{String(r.ppe_required)}</p></div>}
                    <div className="flex gap-6">
                      {!!r.reviewed_by && <div><p className="text-xs text-gray-400">Reviewed By</p><p>{String(r.reviewed_by)}</p></div>}
                      {!!r.approved_by && <div><p className="text-xs text-gray-400">Approved By</p><p>{String(r.approved_by)}</p></div>}
                      {!!r.valid_from && <div><p className="text-xs text-gray-400">Valid From</p><p>{String(r.valid_from)}</p></div>}
                      {!!r.valid_until && <div><p className="text-xs text-gray-400">Valid Until</p><p>{String(r.valid_until)}</p></div>}
                    </div>
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
              <h2 className="text-lg font-semibold">{editing?'Edit RAMS':'New RAMS Document'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Title *</label>
                  <input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                  <select value={form.activity_type} onChange={e=>setForm(f=>({...f,activity_type:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select…</option>{ACTIVITY_TYPES.map(a=><option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                  <select value={form.risk_level} onChange={e=>setForm(f=>({...f,risk_level:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {RISK_LEVELS.map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reviewed By</label>
                  <input value={form.reviewed_by} onChange={e=>setForm(f=>({...f,reviewed_by:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Approved By</label>
                  <input value={form.approved_by} onChange={e=>setForm(f=>({...f,approved_by:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                  <input type="date" value={form.valid_from} onChange={e=>setForm(f=>({...f,valid_from:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                  <input type="date" value={form.valid_until} onChange={e=>setForm(f=>({...f,valid_until:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hazards Identified</label>
                  <textarea rows={3} value={form.hazards} onChange={e=>setForm(f=>({...f,hazards:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Control Measures</label>
                  <textarea rows={3} value={form.controls} onChange={e=>setForm(f=>({...f,controls:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">PPE Required</label>
                  <input value={form.ppe_required} onChange={e=>setForm(f=>({...f,ppe_required:e.target.value}))} placeholder="e.g. Hard hat, Hi-vis, Safety boots, Gloves" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing?'Update RAMS':'Create RAMS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
