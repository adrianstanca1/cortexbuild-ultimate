import { useState } from 'react';
import { FileText, Plus, Search, Download, Eye, Folder, Upload, Edit2, Trash2, X, ChevronDown, ChevronUp, Clock, Tag } from 'lucide-react';
import { useDocuments } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const DOC_TYPES = ['Drawing','Specification','Contract','Report','Certificate','Letter','Form','Permit','Schedule','Other'];
const STATUS_OPTIONS = ['Draft','Under Review','Approved','Superseded','Archived'];
const DISCIPLINES = ['Architecture','Structural','MEP','Civil','H&S','QA','Legal','Commercial','General'];

const statusColour: Record<string,string> = {
  'Draft':'bg-gray-700 text-gray-300','Under Review':'bg-amber-900/40 text-amber-300',
  'Approved':'bg-emerald-900/40 text-emerald-300','Superseded':'bg-orange-900/40 text-orange-300','Archived':'bg-gray-800 text-gray-400',
};

const revisionColour = (rev: string): string => {
  const r = String(rev ?? 'A').toUpperCase()[0];
  if (r === 'A') return 'bg-gray-700 text-gray-300 border-gray-600';
  if (r === 'B') return 'bg-blue-900/50 text-blue-300 border-blue-700';
  if (r === 'C') return 'bg-orange-900/50 text-orange-300 border-orange-700';
  return 'bg-red-900/50 text-red-300 border-red-700';
};

const typeIcon = (t: string) => {
  const icons: Record<string,string> = { 'Drawing':'📐','Specification':'📋','Contract':'📜','Report':'📊','Certificate':'🏆','Letter':'✉️','Form':'📝','Permit':'🎫','Schedule':'📅' };
  return icons[t] ?? '📄';
};

const emptyForm = { title:'',document_type:'Drawing',discipline:'Architecture',revision:'A',status:'Draft',file_url:'',project_id:'',author:'',date_issued:'',description:'',document_number:'',supersedes:'',tags:'' };

export function Documents() {
  const { useList, useCreate, useUpdate, useDelete } = useDocuments;
  const { data: raw = [], isLoading } = useList();
  const docs = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [activeTab, setActiveTab] = useState<'register'|'folder'|'issued'>('register');
  const [selectedDoc, setSelectedDoc] = useState<AnyRow | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['Architecture']));
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [disciplineFilter, setDisciplineFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const filtered = docs.filter(d => {
    const title = String(d.title??'').toLowerCase();
    const num = String(d.document_number??'').toLowerCase();
    const matchSearch = title.includes(search.toLowerCase()) || num.includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || d.document_type === typeFilter;
    const matchStatus = statusFilter === 'All' || d.status === statusFilter;
    const matchDisc = disciplineFilter === 'All' || d.discipline === disciplineFilter;
    return matchSearch && matchType && matchStatus && matchDisc;
  });

  const approvedCount = docs.filter(d=>d.status==='Approved').length;
  const reviewCount = docs.filter(d=>d.status==='Under Review').length;
  const draftCount = docs.filter(d=>d.status==='Draft').length;
  const supersededCount = docs.filter(d=>d.status==='Superseded').length;

  const uniqueDisciplines = ['All', ...Array.from(new Set(docs.map(d=>String(d.discipline??'')).filter(Boolean)))];
  const disciplineGroups = DISCIPLINES.reduce((acc, disc) => {
    acc[disc] = docs.filter(d => d.discipline === disc);
    return acc;
  }, {} as Record<string, AnyRow[]>);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, date_issued:new Date().toISOString().slice(0,10), document_number:`DOC-${new Date().getFullYear()}-${String(docs.length + 1).padStart(3, '0')}` });
    setShowModal(true);
  }

  function openEdit(d: AnyRow) {
    setEditing(d);
    setForm({
      title:String(d.title??''),
      document_type:String(d.document_type??'Drawing'),
      discipline:String(d.discipline??'Architecture'),
      revision:String(d.revision??'A'),
      status:String(d.status??'Draft'),
      file_url:String(d.file_url??''),
      project_id:String(d.project_id??''),
      author:String(d.author??''),
      date_issued:String(d.date_issued??''),
      description:String(d.description??''),
      document_number:String(d.document_number??''),
      supersedes:String(d.supersedes??''),
      tags:String(d.tags??'')
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await updateMutation.mutateAsync({ id:String(editing.id), data:form });
      toast.success('Document updated');
    } else {
      await createMutation.mutateAsync(form);
      toast.success('Document registered');
    }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document?')) return;
    await deleteMutation.mutateAsync(id);
    toast.success('Document deleted');
  }

  async function approve(d: AnyRow) {
    await updateMutation.mutateAsync({ id:String(d.id), data:{ status:'Approved' } });
    toast.success('Document approved');
  }

  function toggleFolder(disc: string) {
    const next = new Set(expandedFolders);
    if (next.has(disc)) next.delete(disc);
    else next.add(disc);
    setExpandedFolders(next);
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Documents</h1>
          <p className="text-sm text-gray-400 mt-1">Project document register & version control</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors">
          <Plus size={16}/><span>Register Document</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Documents', value:docs.length, colour:'text-blue-400', bg:'bg-blue-900/30 border-blue-700' },
          { label:'Approved', value:approvedCount, colour:'text-emerald-400', bg:'bg-emerald-900/30 border-emerald-700' },
          { label:'Under Review', value:reviewCount, colour:'text-amber-400', bg:'bg-amber-900/30 border-amber-700' },
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
          { key:'register', label:'Register', icon:'📋' },
          { key:'folder', label:'By Discipline', icon:'📁' },
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

      {activeTab === 'register' && (
        <>
          <div className="flex flex-wrap gap-3 items-center bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
              <input
                value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="Search documents…"
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={typeFilter}
              onChange={e=>setTypeFilter(e.target.value)}
              className="text-sm bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {['All',...DOC_TYPES].map(t=><option key={t}>{t}</option>)}
            </select>
            <select
              value={disciplineFilter}
              onChange={e=>setDisciplineFilter(e.target.value)}
              className="text-sm bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {uniqueDisciplines.map(d=><option key={d}>{d}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e=>setStatusFilter(e.target.value)}
              className="text-sm bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
            </select>
            <span className="text-sm text-gray-400 ml-auto">{filtered.length} docs</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
          ) : (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>{['No.', 'Title','Type','Discipline','Rev','Status','Issued By','Date',''].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filtered.map((d, idx)=>(
                    <tr
                      key={String(d.id)}
                      onClick={()=>setSelectedDoc(d)}
                      className={`cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-800/30'} hover:bg-gray-700/50`}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-gray-400">{String(d.document_number??'—')}</td>
                      <td className="px-4 py-3 font-medium text-gray-200 max-w-xs truncate">{String(d.title??'—')}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{typeIcon(String(d.document_type??''))}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{String(d.discipline??'—')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded border font-mono font-bold ${revisionColour(String(d.revision??'A'))}`}>
                          {String(d.revision??'A')}
                        </span>
                      </td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(d.status??'')] ?? 'bg-gray-700 text-gray-300'}`}>{String(d.status??'')}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-400">{String(d.author??'—')}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{String(d.date_issued??'—')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {d.status==='Under Review' && <button onClick={(e)=>{e.stopPropagation();approve(d);}} className="p-1.5 text-emerald-400 hover:bg-emerald-900/30 rounded" title="Approve"><FileText size={14}/></button>}
                          {!!d.file_url && <a href={String(d.file_url)} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded" onClick={e=>e.stopPropagation()}><Eye size={14}/></a>}
                          <button onClick={(e)=>{e.stopPropagation();openEdit(d);}} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 rounded"><Edit2 size={14}/></button>
                          <button onClick={(e)=>{e.stopPropagation();handleDelete(String(d.id));}} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="text-center py-16 text-gray-500"><Folder size={40} className="mx-auto mb-3 opacity-30"/><p>No documents found</p></div>}
            </div>
          )}
        </>
      )}

      {activeTab === 'folder' && (
        <div className="space-y-3">
          {uniqueDisciplines.filter(d => d !== 'All').map(disc => {
            const docCount = disciplineGroups[disc]?.length ?? 0;
            const isExpanded = expandedFolders.has(disc);
            return (
              <div key={disc} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <button
                  onClick={() => toggleFolder(disc)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{isExpanded ? '📂' : '📁'}</span>
                    <div className="text-left">
                      <p className="font-medium text-gray-200">{disc}</p>
                      <p className="text-xs text-gray-400">{docCount} document{docCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className="text-gray-400">{isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</span>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-700 bg-gray-900/50 divide-y divide-gray-700">
                    {disciplineGroups[disc]?.map(doc => (
                      <div
                        key={String(doc.id)}
                        onClick={() => setSelectedDoc(doc)}
                        className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-700/30 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-300">{String(doc.title??'—')}</p>
                          <p className="text-xs text-gray-500">{String(doc.document_number??'—')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${revisionColour(String(doc.revision??'A'))}`}>
                            Rev {String(doc.revision??'A')}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(doc.status??'')] ?? 'bg-gray-700 text-gray-300'}`}>
                            {String(doc.status??'')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'issued' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>{['Document','Issued By','Status','Date Issued','Version'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {docs.filter(d => d.status === 'Approved' || d.status === 'Superseded').map(doc => (
                <tr key={String(doc.id)} className="bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-200">{String(doc.title??'—')}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{String(doc.author??'—')}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(doc.status??'')] ?? 'bg-gray-700 text-gray-300'}`}>{String(doc.status??'')}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-400">{String(doc.date_issued??'—')}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">Rev {String(doc.revision??'A')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {docs.filter(d => d.status === 'Approved' || d.status === 'Superseded').length === 0 &&
            <div className="text-center py-12 text-gray-500"><p>No issued documents</p></div>}
        </div>
      )}

      {selectedDoc && (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-gray-800 border-l border-gray-700 shadow-2xl overflow-y-auto z-40">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Document Details</h3>
              <button onClick={() => setSelectedDoc(null)} className="p-1 hover:bg-gray-700 rounded"><X size={20} className="text-gray-400"/></button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Document Number</p>
                <p className="text-sm font-mono text-gray-200 mt-1">{String(selectedDoc.document_number??'—')}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Title</p>
                <p className="text-sm text-gray-200 mt-1">{String(selectedDoc.title??'—')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Type</p>
                  <p className="text-sm text-gray-300 mt-1">{String(selectedDoc.document_type??'—')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Discipline</p>
                  <p className="text-sm text-gray-300 mt-1">{String(selectedDoc.discipline??'—')}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Revision History</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-gray-700/50 rounded border border-gray-600">
                    <Clock size={14} className="text-orange-400"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-gray-200">Rev {String(selectedDoc.revision??'A')}</p>
                      <p className="text-xs text-gray-400">{String(selectedDoc.date_issued??'—')}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-orange-900/30 text-orange-300 rounded border border-orange-700">Current</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Status</p>
                <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium mt-2 ${statusColour[String(selectedDoc.status??'')] ?? 'bg-gray-700 text-gray-300'}`}>
                  {String(selectedDoc.status??'')}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Issued By</p>
                <p className="text-sm text-gray-300 mt-1">{String(selectedDoc.author??'—')}</p>
              </div>
              {Boolean(selectedDoc.description) && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Description</p>
                  <p className="text-sm text-gray-300 mt-1">{String(selectedDoc.description??'—')}</p>
                </div>
              )}
              {Boolean(selectedDoc.tags) && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {String(selectedDoc.tags??'').split(',').map(tag => (
                      <span key={tag.trim()} className="text-xs px-2 py-1 bg-blue-900/30 text-blue-300 rounded border border-blue-700">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                {Boolean(selectedDoc.file_url) && <a href={String(selectedDoc.file_url)} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 rounded border border-blue-700 text-sm font-medium"><Download size={14}/>Download</a>}
                <button onClick={() => openEdit(selectedDoc)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm font-medium"><Edit2 size={14}/>Edit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <h2 className="text-lg font-semibold text-white">{editing?'Edit Document':'Register Document'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-700 rounded-lg"><X size={18} className="text-gray-400"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Document Title *</label>
                  <input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Document Number</label>
                  <input value={form.document_number} onChange={e=>setForm(f=>({...f,document_number:e.target.value}))} placeholder="DOC-YYYY-NNN" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Type</label>
                  <select value={form.document_type} onChange={e=>setForm(f=>({...f,document_type:e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {DOC_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Discipline</label>
                  <select value={form.discipline} onChange={e=>setForm(f=>({...f,discipline:e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {DISCIPLINES.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Revision Letter</label>
                  <input value={form.revision} onChange={e=>setForm(f=>({...f,revision:e.target.value}))} placeholder="A, B, C..." className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Author</label>
                  <input value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Date Issued</label>
                  <input type="date" value={form.date_issued} onChange={e=>setForm(f=>({...f,date_issued:e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Supersedes (Doc No)</label>
                  <input value={form.supersedes} onChange={e=>setForm(f=>({...f,supersedes:e.target.value}))} placeholder="Reference to older doc" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">File URL</label>
                  <input type="url" value={form.file_url} onChange={e=>setForm(f=>({...f,file_url:e.target.value}))} placeholder="https://…" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Tags</label>
                  <input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="Comma-separated tags" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Description / Notes</label>
                  <textarea rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-sm text-gray-300 hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors">
                  {editing?'Update Document':'Register Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
