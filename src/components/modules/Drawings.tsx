import { useState } from 'react';
import { Layers, Plus, Search, Eye, Download, Edit2, Trash2, X, ChevronDown, ChevronUp, FileImage, Cloud } from 'lucide-react';
import { useDocuments } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const DISCIPLINES = ['All','Architecture','Structural','MEP – Mechanical','MEP – Electrical','MEP – Plumbing','Civil','Landscape','Interior','Fire','Other'];
const STATUSES = ['Preliminary','For Coordination','For Construction','For Information','Superseded','As-Built'];
const SCALES = ['1:5','1:10','1:20','1:50','1:100','1:200','1:500','NTS'];

const statusColour: Record<string,string> = {
  'Preliminary':'bg-gray-700 text-gray-300','For Coordination':'bg-amber-900/40 text-amber-300',
  'For Construction':'bg-emerald-900/40 text-emerald-300','For Information':'bg-blue-900/40 text-blue-300',
  'Superseded':'bg-orange-900/40 text-orange-300','As-Built':'bg-purple-900/40 text-purple-300',
};

const revisionColour = (status: string): string => {
  if (status === 'Preliminary') return 'bg-gray-700 text-gray-300';
  if (status === 'For Coordination') return 'bg-amber-900/40 text-amber-300';
  if (status === 'For Construction') return 'bg-emerald-900/40 text-emerald-300';
  if (status === 'For Information') return 'bg-blue-900/40 text-blue-300';
  if (status === 'As-Built') return 'bg-purple-900/40 text-purple-300';
  return 'bg-orange-900/40 text-orange-300';
};

const emptyForm = { title:'',document_type:'Drawing',discipline:'Architecture',revision:'P01',status:'Preliminary',file_url:'',project_id:'',author:'',date_issued:'',description:'',drawing_number:'',scale:'1:100',sheet_size:'A1' };

export function Drawings() {
  const { useList, useCreate, useUpdate, useDelete } = useDocuments;
  const { data: raw = [], isLoading } = useList();
  const allDocs = raw as AnyRow[];
  const drawings = allDocs.filter(d => String(d.document_type??'').toLowerCase().includes('draw') || String(d.document_type??'') === 'Drawing' || !d.document_type);

  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [activeTab, setActiveTab] = useState<'register'|'issued'>('register');
  const [disciplineFilter, setDisciplineFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedDrawing, setSelectedDrawing] = useState<AnyRow | null>(null);
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

  const uniqueDisciplines = ['All', ...Array.from(new Set(drawings.map(d=>String(d.discipline??'')).filter(Boolean)))];
  const discStats = DISCIPLINES.map(discipline => ({
    name: discipline,
    count: drawings.filter(d => d.discipline === discipline).length
  })).filter(d => d.count > 0 || d.name === 'All');

  const forConstructionCount = drawings.filter(d=>d.status==='For Construction').length;
  const supersededCount = drawings.filter(d=>d.status==='Superseded').length;
  const issuedCount = drawings.filter(d=>['For Construction','For Information','As-Built'].includes(String(d.status??''))).length;

  function openCreate() {
    setEditing(null);
    const num = drawings.length + 1;
    setForm({
      ...emptyForm,
      date_issued:new Date().toISOString().slice(0,10),
      document_type:'Drawing',
      drawing_number:`DWG-ARCH-${String(num).padStart(3, '0')}`
    });
    setShowModal(true);
  }

  function openEdit(d: AnyRow) {
    setEditing(d);
    setForm({
      title:String(d.title??''),
      document_type:'Drawing',
      discipline:String(d.discipline??'Architecture'),
      revision:String(d.revision??'P01'),
      status:String(d.status??'Preliminary'),
      file_url:String(d.file_url??''),
      project_id:String(d.project_id??''),
      author:String(d.author??''),
      date_issued:String(d.date_issued??''),
      description:String(d.description??''),
      drawing_number:String(d.drawing_number??''),
      scale:String(d.scale??'1:100'),
      sheet_size:String(d.sheet_size??'A1')
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, document_type: 'Drawing' };
    if (editing) {
      await updateMutation.mutateAsync({ id:String(editing.id), data:payload });
      toast.success('Drawing updated');
    } else {
      await createMutation.mutateAsync(payload);
      toast.success('Drawing registered');
    }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this drawing?')) return;
    await deleteMutation.mutateAsync(id);
    toast.success('Drawing deleted');
  }

  async function issueForConstruction(d: AnyRow) {
    await updateMutation.mutateAsync({ id:String(d.id), data:{ status:'For Construction' } });
    toast.success('Issued for Construction');
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Drawings</h1>
          <p className="text-sm text-gray-400 mt-1">Drawing register & revision control</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors">
          <Plus size={16}/><span>Add Drawing</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Drawings', value:drawings.length, colour:'text-blue-400', bg:'bg-blue-900/30 border-blue-700' },
          { label:'For Construction', value:forConstructionCount, colour:'text-emerald-400', bg:'bg-emerald-900/30 border-emerald-700' },
          { label:'Issued', value:issuedCount, colour:'text-blue-400', bg:'bg-blue-900/30 border-blue-700' },
          { label:'Superseded', value:supersededCount, colour:'text-orange-400', bg:'bg-orange-900/30 border-orange-700' },
        ].map(kpi=>(
          <div key={kpi.label} className={`bg-gray-800/40 rounded-xl border ${kpi.bg} p-4`}>
            <p className="text-xs text-gray-400">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.colour} mt-1`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-0 border-b border-gray-700">
        {[
          { key:'register', label:'Drawing Register', icon:'📋' },
          { key:'issued', label:'Issued Log', icon:'📤' },
        ].map(t=>(
          <button
            key={t.key}
            onClick={()=>setActiveTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab===t.key?'border-orange-500 text-orange-400':'border-transparent text-gray-400 hover:text-gray-300'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-4">
        {DISCIPLINES.map(disc => {
          const count = drawings.filter(d => d.discipline === disc).length;
          return (
            <button
              key={disc}
              onClick={() => setDisciplineFilter(disc)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                disciplineFilter === disc
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-700'
              }`}
            >
              {disc}
              {count > 0 && <span className={`text-xs px-1.5 rounded-full ${disciplineFilter === disc ? 'bg-orange-700' : 'bg-gray-700'}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      {activeTab === 'register' && (
        <>
          <div className="flex flex-wrap gap-3 items-center bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
              <input
                value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="Search drawing title or number…"
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e=>setStatusFilter(e.target.value)}
              className="text-sm bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {['All',...STATUSES].map(s=><option key={s}>{s}</option>)}
            </select>
            <span className="text-sm text-gray-400 ml-auto">{filtered.length} drawing{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
          ) : (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>{['No.','Title','Discipline','Sheet Size','Scale','Rev','Status','Issue Date',''].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filtered.map((d, idx)=>(
                    <tr
                      key={String(d.id)}
                      onClick={()=>setSelectedDrawing(d)}
                      className={`cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-800/30'} hover:bg-gray-700/50`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{String(d.drawing_number??'—')}</td>
                      <td className="px-4 py-3 font-medium text-gray-200 max-w-xs truncate">{String(d.title??'—')}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{String(d.discipline??'—')}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{String(d.sheet_size??'A1')}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-400">{String(d.scale??'—')}</td>
                      <td className="px-4 py-3 text-xs font-mono font-bold text-orange-400">Rev {String(d.revision??'—')}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(d.status??'')] ?? 'bg-gray-700 text-gray-300'}`}>{String(d.status??'')}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-400">{String(d.date_issued??'—')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {d.status==='For Coordination' && <button onClick={(e)=>{e.stopPropagation();issueForConstruction(d);}} className="p-1.5 text-emerald-400 hover:bg-emerald-900/30 rounded text-xs" title="Issue for Construction"><FileImage size={14}/></button>}
                          {!!d.file_url && <a href={String(d.file_url)} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded" onClick={e=>e.stopPropagation()}><Eye size={14}/></a>}
                          <button onClick={(e)=>{e.stopPropagation();openEdit(d);}} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 rounded"><Edit2 size={14}/></button>
                          <button onClick={(e)=>{e.stopPropagation();handleDelete(String(d.id));}} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="text-center py-16 text-gray-500"><Layers size={40} className="mx-auto mb-3 opacity-30"/><p>No drawings found</p></div>}
            </div>
          )}
        </>
      )}

      {activeTab === 'issued' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>{['Drawing No.','Title','Discipline','Issued Date','Status','Issued By','Transmittal Ref'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {drawings.filter(d => ['For Construction','For Information','As-Built'].includes(String(d.status??''))).map((d, idx) => (
                <tr key={String(d.id)} className={`transition-colors ${idx % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-800/30'} hover:bg-gray-700/50`}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{String(d.drawing_number??'—')}</td>
                  <td className="px-4 py-3 font-medium text-gray-200">{String(d.title??'—')}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{String(d.discipline??'—')}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{String(d.date_issued??'—')}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(d.status??'')] ?? 'bg-gray-700 text-gray-300'}`}>{String(d.status??'')}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-400">{String(d.author??'—')}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">TRX-{String(d.id??'').slice(0,6).toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {drawings.filter(d => ['For Construction','For Information','As-Built'].includes(String(d.status??''))).length === 0 &&
            <div className="text-center py-12 text-gray-500"><p>No issued drawings</p></div>}
        </div>
      )}

      {selectedDrawing && (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-gray-800 border-l border-gray-700 shadow-2xl overflow-y-auto z-40">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Drawing Viewer</h3>
              <button onClick={() => setSelectedDrawing(null)} className="p-1 hover:bg-gray-700 rounded"><X size={20} className="text-gray-400"/></button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Drawing Number</p>
                  <p className="text-sm font-mono text-gray-200 mt-1">{String(selectedDrawing.drawing_number??'—')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Title</p>
                  <p className="text-sm text-gray-200 mt-1">{String(selectedDrawing.title??'—')}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Scale</p>
                    <p className="text-sm text-gray-300 mt-1">{String(selectedDrawing.scale??'—')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">Sheet Size</p>
                    <p className="text-sm text-gray-300 mt-1">{String(selectedDrawing.sheet_size??'A1')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-dashed border-gray-600 rounded-lg h-40 flex flex-col items-center justify-center text-center p-4">
                <Cloud size={32} className="text-gray-500 mb-2"/>
                <p className="text-sm font-medium text-gray-300">Drawing Preview</p>
                <p className="text-xs text-gray-500 mt-1">Connect cloud storage to view</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase">Revision History</p>
                <div className="bg-gray-700/30 rounded border border-gray-600 p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"/>
                    <div className="flex-1">
                      <p className="text-sm font-mono font-bold text-orange-400">Rev {String(selectedDrawing.revision??'P01')}</p>
                      <p className="text-xs text-gray-400">{String(selectedDrawing.date_issued??'—')}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-orange-900/30 text-orange-300 rounded border border-orange-700">Current</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{String(selectedDrawing.status??'Preliminary')}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Status</p>
                <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${statusColour[String(selectedDrawing.status??'')] ?? 'bg-gray-700 text-gray-300'}`}>
                  {String(selectedDrawing.status??'')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-400 uppercase font-semibold">Discipline</p>
                  <p className="text-gray-200 mt-1">{String(selectedDrawing.discipline??'—')}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase font-semibold">Drawn By</p>
                  <p className="text-gray-200 mt-1">{String(selectedDrawing.author??'—')}</p>
                </div>
              </div>

              {Boolean(selectedDrawing.description) && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Description</p>
                  <p className="text-sm text-gray-300 mt-1">{String(selectedDrawing.description??'—')}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-700">
                {Boolean(selectedDrawing.file_url) && <a href={String(selectedDrawing.file_url)} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 rounded border border-blue-700 text-sm font-medium"><Download size={14}/>Download</a>}
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm font-medium"><Edit2 size={14}/>Mark Up</button>
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm font-medium"><FileImage size={14}/>Issue</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <h2 className="text-lg font-semibold text-white">{editing?'Edit Drawing':'Register Drawing'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-700 rounded-lg"><X size={18} className="text-gray-400"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Drawing Title *</label>
                  <input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Drawing Number</label>
                  <input value={form.drawing_number} onChange={e=>setForm(f=>({...f,drawing_number:e.target.value}))} placeholder="DWG-ARCH-001" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Discipline</label>
                  <select value={form.discipline} onChange={e=>setForm(f=>({...f,discipline:e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {DISCIPLINES.filter(d => d !== 'All').map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Sheet Size</label>
                  <select value={form.sheet_size} onChange={e=>setForm(f=>({...f,sheet_size:e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {['A0','A1','A2','A3','A4'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Scale</label>
                  <select value={form.scale} onChange={e=>setForm(f=>({...f,scale:e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {SCALES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Revision</label>
                  <input value={form.revision} onChange={e=>setForm(f=>({...f,revision:e.target.value}))} placeholder="P01, C02, etc." className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUSES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Drawn By / Author</label>
                  <input value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Date Issued</label>
                  <input type="date" value={form.date_issued} onChange={e=>setForm(f=>({...f,date_issued:e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">File / CAD URL</label>
                  <input type="url" value={form.file_url} onChange={e=>setForm(f=>({...f,file_url:e.target.value}))} placeholder="https://…" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Description / Notes</label>
                  <textarea rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-sm text-gray-300 hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors">
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
