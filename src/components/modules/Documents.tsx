import { useState, useRef } from 'react';
import { FileText, Plus, Search, Eye, Folder, Upload, Edit2, Trash2, X } from 'lucide-react';
import { useDocuments } from '../../hooks/useData';
import { documentsApi } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const DOC_TYPES = ['Drawing','Specification','Contract','Report','Certificate','Letter','Form','Permit','Schedule','Other'];
const STATUS_OPTIONS = ['Draft','Under Review','Approved','Superseded','Archived'];
const DISCIPLINES = ['Architecture','Structural','MEP','Civil','H&S','QA','Legal','Commercial','General'];

const statusColour: Record<string,string> = {
  'Draft':'bg-gray-800 text-gray-400','Under Review':'bg-yellow-900/50 text-yellow-300',
  'Approved':'bg-green-900/50 text-green-300','Superseded':'bg-orange-900/50 text-orange-300','Archived':'bg-gray-800 text-gray-500',
};
const typeIcon = (t: string) => {
  const icons: Record<string,string> = { 'Drawing':'📐','Specification':'📋','Contract':'📜','Report':'📊','Certificate':'🏆','Letter':'✉️','Form':'📝','Permit':'🎫','Schedule':'📅' };
  return icons[t] ?? '📄';
};

const emptyForm = { title:'',document_type:'Drawing',discipline:'Architecture',revision:'A',status:'Draft',file_url:'',project_id:'',author:'',date_issued:'',description:'' };

export function Documents() {
  const { useList, useCreate, useUpdate, useDelete } = useDocuments;
  const { data: raw = [], isLoading } = useList();
  const docs = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await documentsApi.uploadFile(file);
      toast.success('Document uploaded');
      qc.invalidateQueries({ queryKey: ['documents'] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  const [subTab, setSubTab] = useState('all');
  function setTab(key: string, filter: string) { setSubTab(key); setStatusFilter(filter); }
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const filtered = docs.filter(d => {
    const title = String(d.title??'').toLowerCase();
    const matchSearch = title.includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || d.document_type === typeFilter;
    const matchStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const approvedCount = docs.filter(d=>d.status==='Approved').length;
  const reviewCount = docs.filter(d=>d.status==='Under Review').length;
  const draftCount = docs.filter(d=>d.status==='Draft').length;

  function openCreate() { setEditing(null); setForm({ ...emptyForm, date_issued:new Date().toISOString().slice(0,10) }); setShowModal(true); }
  function openEdit(d: AnyRow) {
    setEditing(d);
    setForm({ title:String(d.title??''),document_type:String(d.document_type??'Drawing'),discipline:String(d.discipline??'Architecture'),revision:String(d.revision??'A'),status:String(d.status??'Draft'),file_url:String(d.file_url??''),project_id:String(d.project_id??''),author:String(d.author??''),date_issued:String(d.date_issued??''),description:String(d.description??'') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) { await updateMutation.mutateAsync({ id:String(editing.id), data:form }); toast.success('Document updated'); }
    else { await createMutation.mutateAsync(form); toast.success('Document registered'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Document deleted');
  }

  async function approve(d: AnyRow) {
    await updateMutation.mutateAsync({ id:String(d.id), data:{ status:'Approved' } });
    toast.success('Document approved');
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Project document register & version control</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg,.zip"
            onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
            <Upload size={16}/><span>{uploading ? 'Uploading…' : 'Upload File'}</span>
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
            <Plus size={16}/><span>Register Document</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Documents', value:docs.length, icon:FileText, colour:'text-blue-400', bg:'bg-blue-900/30' },
          { label:'Approved', value:approvedCount, icon:FileText, colour:'text-green-400', bg:'bg-green-900/30' },
          { label:'Under Review', value:reviewCount, icon:FileText, colour:'text-yellow-400', bg:'bg-yellow-900/30' },
          { label:'Drafts', value:draftCount, icon:FileText, colour:'text-gray-600', bg:'bg-gray-800' },
        ].map(kpi=>(
          <div key={kpi.label} className="bg-gray-900 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour}/></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-white">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-gray-700">
        {([
          { key:'all', label:'All Docs', filter:'All', count:docs.length, cls:'' },
          { key:'draft', label:'Draft', filter:'Draft', count:draftCount, cls:'' },
          { key:'review', label:'Under Review', filter:'Under Review', count:reviewCount, cls:'bg-amber-900/50 text-amber-400' },
          { key:'approved', label:'Approved', filter:'Approved', count:approvedCount, cls:'bg-green-900/50 text-green-400' },
        ]).map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key, t.filter)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab===t.key?'border-orange-600 text-orange-600':'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.cls||'bg-gray-800 text-gray-400'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-gray-900 rounded-xl border border-gray-700 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search documents…" className="w-full pl-9 pr-4 py-2 text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="text-sm bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...DOC_TYPES].map(t=><option key={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} docs</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>{['Type','Title','Discipline','Rev','Author','Date','Status',''].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map(d=>(
                <tr key={String(d.id)} className="hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-xl">{typeIcon(String(d.document_type??''))}</td>
                  <td className="px-4 py-3 font-medium text-white max-w-xs truncate">{String(d.title??'—')}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{String(d.discipline??'—')}</td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-gray-300">Rev {String(d.revision??'A')}</td>
                  <td className="px-4 py-3 text-gray-400">{String(d.author??'—')}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{String(d.date_issued??'—')}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(d.status??'')] ?? 'bg-gray-800 text-gray-300'}`}>{String(d.status??'')}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {d.status==='Under Review' && <button onClick={()=>approve(d)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Approve"><FileText size={14}/></button>}
                      {!!d.file_url && <a href={String(d.file_url)} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Eye size={14}/></a>}
                      <button onClick={()=>openEdit(d)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                      <button onClick={()=>handleDelete(String(d.id))} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><Folder size={40} className="mx-auto mb-3 opacity-30"/><p>No documents found</p></div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-white">{editing?'Edit Document':'Register Document'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Document Title *</label>
                  <input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                  <select value={form.document_type} onChange={e=>setForm(f=>({...f,document_type:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {DOC_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Discipline</label>
                  <select value={form.discipline} onChange={e=>setForm(f=>({...f,discipline:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {DISCIPLINES.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Revision</label>
                  <input value={form.revision} onChange={e=>setForm(f=>({...f,revision:e.target.value}))} placeholder="e.g. A, B, P1" className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Author</label>
                  <input value={form.author} onChange={e=>setForm(f=>({...f,author:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Date Issued</label>
                  <input type="date" value={form.date_issued} onChange={e=>setForm(f=>({...f,date_issued:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">File URL</label>
                  <input type="url" value={form.file_url} onChange={e=>setForm(f=>({...f,file_url:e.target.value}))} placeholder="https://…" className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-white font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
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
