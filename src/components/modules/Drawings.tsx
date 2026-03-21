import { useState } from 'react';
import { Layers, Plus, Search, Eye, Edit2, Trash2, X, FileImage } from 'lucide-react';
import { useDocuments } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const DISCIPLINES = ['Architecture','Structural','MEP – Mechanical','MEP – Electrical','MEP – Plumbing','Civil','Landscape','Interior','Fire','Other'];
const STATUSES = ['Preliminary','For Coordination','For Construction','For Information','Superseded','As-Built'];
const SCALES = ['1:5','1:10','1:20','1:50','1:100','1:200','1:500','NTS'];

const statusColour: Record<string,string> = {
  'Preliminary':'bg-gray-700 text-gray-300',
  'For Coordination':'bg-yellow-900/50 text-yellow-300',
  'For Construction':'bg-green-900/50 text-green-300',
  'For Information':'bg-blue-900/50 text-blue-300',
  'Superseded':'bg-orange-900/50 text-orange-300',
  'As-Built':'bg-purple-900/50 text-purple-300',
};

const emptyForm = { title:'',document_type:'Drawing',discipline:'Architecture',revision:'P01',status:'Preliminary',file_url:'',project_id:'',author:'',date_issued:'',description:'',drawing_number:'',scale:'1:100' };

export function Drawings() {
  const { useList, useCreate, useUpdate, useDelete } = useDocuments;
  const { data: raw = [], isLoading } = useList();
  const allDocs = raw as AnyRow[];
  const drawings = allDocs.filter(d => String(d.document_type??'').toLowerCase().includes('draw') || String(d.document_type??'') === 'Drawing' || !d.document_type);

  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState('all');
  function setTab(key: string, filter: string) { setSubTab(key); setStatusFilter(filter); }
  const [search, setSearch] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [view, setView] = useState<'grid'|'list'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const filtered = drawings.filter(d => {
    const title = String(d.title??'').toLowerCase();
    const num = String(d.drawing_number??d.title??'').toLowerCase();
    const matchSearch = title.includes(search.toLowerCase()) || num.includes(search.toLowerCase());
    const matchDisc = disciplineFilter === 'All' || d.discipline === disciplineFilter;
    const matchStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchSearch && matchDisc && matchStatus;
  });

  const forConstructionCount = drawings.filter(d=>d.status==='For Construction').length;
  const supersededCount = drawings.filter(d=>d.status==='Superseded').length;
  const latestRev = drawings.reduce((max,d) => {
    const r = String(d.revision??'');
    return r > max ? r : max;
  }, 'A');

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, date_issued:new Date().toISOString().slice(0,10), document_type:'Drawing' });
    setShowModal(true);
  }
  function openEdit(d: AnyRow) {
    setEditing(d);
    setForm({ title:String(d.title??''),document_type:'Drawing',discipline:String(d.discipline??'Architecture'),revision:String(d.revision??'P01'),status:String(d.status??'Preliminary'),file_url:String(d.file_url??''),project_id:String(d.project_id??''),author:String(d.author??''),date_issued:String(d.date_issued??''),description:String(d.description??''),drawing_number:String(d.drawing_number??''),scale:String(d.scale??'1:100') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, document_type: 'Drawing' };
    if (editing) { await updateMutation.mutateAsync({ id:String(editing.id), data:payload }); toast.success('Drawing updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Drawing registered'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this drawing?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Drawing deleted');
  }

  async function issueForConstruction(d: AnyRow) {
    await updateMutation.mutateAsync({ id:String(d.id), data:{ status:'For Construction' } });
    toast.success('Issued for Construction');
  }

  const uniqueDisciplines = ['All', ...Array.from(new Set(drawings.map(d=>String(d.discipline??'')).filter(Boolean)))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Drawings</h1>
          <p className="text-sm text-gray-400 mt-1">Drawing register & revision control</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-800 rounded-lg p-1">
            {(['grid','list'] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${view===v?'bg-gray-600 text-white shadow':'text-gray-400 hover:text-gray-200'}`}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={16}/><span>Add Drawing</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Drawings', value:drawings.length, icon:Layers, colour:'text-blue-400' },
          { label:'For Construction', value:forConstructionCount, icon:FileImage, colour:'text-green-400' },
          { label:'Superseded', value:supersededCount, icon:Layers, colour:'text-orange-400' },
          { label:'Latest Revision', value:latestRev||'—', icon:Layers, colour:'text-purple-400' },
        ].map(kpi=>(
          <div key={kpi.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400">{kpi.label}</p>
              <kpi.icon size={18} className={kpi.colour}/>
            </div>
            <p className={`text-2xl font-bold ${kpi.colour}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-gray-700">
        {([
          { key:'all', label:'All Drawings', filter:'All', count:drawings.length, cls:'' },
          { key:'forconst', label:'For Construction', filter:'For Construction', count:forConstructionCount, cls:'bg-green-900/40 text-green-400' },
          { key:'superseded', label:'Superseded', filter:'Superseded', count:supersededCount, cls:'bg-gray-700 text-gray-400' },
        ]).map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key, t.filter)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab===t.key?'border-orange-500 text-orange-400':'border-transparent text-gray-400 hover:text-gray-200'}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.cls||'bg-gray-800 text-gray-400'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search drawing title or number…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"/>
        </div>
        <select value={disciplineFilter} onChange={e=>setDisciplineFilter(e.target.value)}
          className="text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500">
          {uniqueDisciplines.map(d=><option key={d}>{d}</option>)}
        </select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
          className="text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500">
          {['All',...STATUSES].map(s=><option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} drawings</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"/></div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl text-center py-16 text-gray-500">
          <Layers size={40} className="mx-auto mb-3 opacity-30"/><p>No drawings found</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(d=>(
            <div key={String(d.id)} className="bg-gray-900 border border-gray-800 hover:border-gray-600 transition-colors rounded-xl overflow-hidden group">
              <div className="bg-gradient-to-br from-gray-800 to-gray-950 h-32 flex items-center justify-center relative">
                <Layers size={40} className="text-gray-600"/>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!!d.file_url && (
                    <a href={String(d.file_url)} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-white">
                      <Eye size={12}/>
                    </a>
                  )}
                  <button onClick={()=>openEdit(d)} className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-white"><Edit2 size={12}/></button>
                  <button onClick={()=>handleDelete(String(d.id))} className="p-1.5 bg-white/10 hover:bg-red-500/50 rounded text-white"><Trash2 size={12}/></button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColour[String(d.status??'')] ?? 'bg-gray-700 text-gray-300'}`}>
                    {String(d.status??'')}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <p className="font-semibold text-white text-sm truncate">{String(d.title??'Untitled')}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">{String(d.discipline??'')} {d.drawing_number?`· ${d.drawing_number}`:''}</p>
                  <span className="text-xs font-mono font-bold text-orange-400">Rev {String(d.revision??'—')}</span>
                </div>
                {!!d.scale && <p className="text-xs text-gray-500 mt-0.5">Scale: {String(d.scale)}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/60 border-b border-gray-700">
              <tr>{['#','Title','Discipline','Scale','Rev','Author','Date','Status',''].map(h=>(
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map(d=>(
                <tr key={String(d.id)} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{String(d.drawing_number??'—')}</td>
                  <td className="px-4 py-3 font-medium text-white max-w-xs truncate">{String(d.title??'—')}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{String(d.discipline??'—')}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{String(d.scale??'—')}</td>
                  <td className="px-4 py-3 font-mono font-bold text-xs text-orange-400">Rev {String(d.revision??'—')}</td>
                  <td className="px-4 py-3 text-gray-400">{String(d.author??'—')}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{String(d.date_issued??'—')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(d.status??'')] ?? 'bg-gray-700 text-gray-300'}`}>
                      {String(d.status??'')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {d.status==='For Coordination' && (
                        <button onClick={()=>issueForConstruction(d)} className="p-1.5 text-green-400 hover:bg-green-900/30 rounded" title="Issue for Construction">
                          <FileImage size={14}/>
                        </button>
                      )}
                      {!!d.file_url && (
                        <a href={String(d.file_url)} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded">
                          <Eye size={14}/>
                        </a>
                      )}
                      <button onClick={()=>openEdit(d)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 rounded"><Edit2 size={14}/></button>
                      <button onClick={()=>handleDelete(String(d.id))} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-bold text-white">{editing?'Edit Drawing':'Register Drawing'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Drawing Title *</label>
                  <input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Drawing Number</label>
                  <input value={form.drawing_number} onChange={e=>setForm(f=>({...f,drawing_number:e.target.value}))} placeholder="e.g. A-GA-001"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-orange-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Discipline</label>
                  <select value={form.discipline} onChange={e=>setForm(f=>({...f,discipline:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                    {DISCIPLINES.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Revision</label>
                  <input value={form.revision} onChange={e=>setForm(f=>({...f,revision:e.target.value}))} placeholder="e.g. P01, C02"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-orange-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                    {STATUSES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Scale</label>
                  <select value={form.scale} onChange={e=>setForm(f=>({...f,scale:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                    {SCALES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Author / Drawn By</label>
                  <input value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Date Issued</label>
                  <input type="date" value={form.date_issued} onChange={e=>setForm(f=>({...f,date_issued:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">File / CAD URL</label>
                  <input type="url" value={form.file_url} onChange={e=>setForm(f=>({...f,file_url:e.target.value}))} placeholder="https://…"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                  <textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {editing?'Update Drawing':'Register Drawing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
