import { useState, useRef, useCallback } from 'react';
import { FileText, Plus, Search, Eye, Folder, Upload, Edit2, Trash2, X, Download, Clock, Tag, Filter, Grid, List, ChevronRight, File, Check, AlertCircle } from 'lucide-react';
import { useDocuments } from '../../hooks/useData';
import { documentsApi } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import clsx from 'clsx';

type AnyRow = Record<string, unknown>;

const DOC_TYPES = ['Drawing','Specification','Contract','Report','Certificate','Letter','Form','Permit','Schedule','Other'];
const STATUS_OPTIONS = ['Draft','Under Review','Approved','Superseded','Archived'];
const DISCIPLINES = ['Architecture','Structural','MEP','Civil','H&S','QA','Legal','Commercial','General'];

const statusColour: Record<string,string> = {
  'Draft':'bg-gray-800 text-gray-400','Under Review':'bg-yellow-900/50 text-yellow-300',
  'Approved':'bg-green-900/50 text-green-300','Superseded':'bg-orange-900/50 text-orange-300','Archived':'bg-gray-800 text-gray-500',
};

const typeColour: Record<string,string> = {
  'Drawing':'bg-blue-500/20 text-blue-300','Specification':'bg-purple-500/20 text-purple-300',
  'Contract':'bg-amber-500/20 text-amber-300','Report':'bg-emerald-500/20 text-emerald-300',
  'Certificate':'bg-teal-500/20 text-teal-300','Letter':'bg-gray-600/50 text-gray-300',
  'Form':'bg-pink-500/20 text-pink-300','Permit':'bg-red-500/20 text-red-300',
  'Schedule':'bg-indigo-500/20 text-indigo-300','Other':'bg-gray-700 text-gray-400',
};

const typeIcon = (t: string) => {
  const icons: Record<string,string> = { 'Drawing':'📐','Specification':'📋','Contract':'📜','Report':'📊','Certificate':'🏆','Letter':'✉️','Form':'📝','Permit':'🎫','Schedule':'📅' };
  return icons[t] ?? '📄';
};

const emptyForm = { name:'',type:'Drawing',discipline:'Architecture',version:'A',status:'Draft',file_url:'',project_id:'',uploaded_by:'',date_issued:'',description:'' };

export function Documents() {
  const { useList, useCreate, useUpdate, useDelete } = useDocuments;
  const { data: raw = [], isLoading } = useList();
  const docs = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDoc, setSelectedDoc] = useState<AnyRow | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  }, []);

  async function uploadFiles(files: File[]) {
    for (const file of files) {
      setUploading(true);
      setUploadProgress(0);
      try {
        const progressInterval = setInterval(() => {
          setUploadProgress(p => Math.min(p + 20, 90));
        }, 200);
        
        await documentsApi.uploadFile(file);
        clearInterval(progressInterval);
        setUploadProgress(100);
        toast.success(`Uploaded: ${file.name}`);
        qc.invalidateQueries({ queryKey: ['documents'] });
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : `Upload failed: ${file.name}`);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(Array.from(files));
    e.target.value = '';
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
    const title = String(d.name??'').toLowerCase();
    const matchSearch = title.includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || d.type === typeFilter;
    const matchStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const approvedCount = docs.filter(d=>d.status==='Approved').length;
  const reviewCount = docs.filter(d=>d.status==='Under Review').length;
  const draftCount = docs.filter(d=>d.status==='Draft').length;

  function openCreate() { setEditing(null); setForm({ ...emptyForm, date_issued:new Date().toISOString().slice(0,10) }); setShowModal(true); }
  function openEdit(d: AnyRow) {
    setEditing(d);
    setForm({ name:String(d.name??''),type:String(d.type??'Drawing'),discipline:String(d.discipline??'Architecture'),version:String(d.version??'A'),status:String(d.status??'Draft'),file_url:String(d.fileUrl??d.file_url??''),project_id:String(d.projectId??d.project_id??''),uploaded_by:String(d.uploadedBy??d.uploaded_by??''),date_issued:String(d.dateIssued??d.date_issued??''),description:String(d.description??'') });
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
      {/* Drag & Drop Upload Zone */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={clsx(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all',
          dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-900/50',
          uploading && 'pointer-events-none opacity-50'
        )}
      >
        <input ref={fileInputRef} type="file" className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg,.zip"
          onChange={handleFileUpload} multiple />
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <>
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Upload className="h-8 w-8 text-blue-400 animate-pulse"/>
              </div>
              <div className="w-48 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}/>
              </div>
              <p className="text-sm text-gray-400">Uploading… {uploadProgress}%</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                <Upload className="h-8 w-8 text-gray-400"/>
              </div>
              <div>
                <p className="text-white font-medium">Drop files here to upload</p>
                <p className="text-sm text-gray-500 mt-1">or <button onClick={() => fileInputRef.current?.click()} className="text-blue-400 hover:underline">browse</button> to select files</p>
              </div>
              <p className="text-xs text-gray-600">PDF, DOC, XLS, DWG, PNG, JPG, ZIP • Max 50MB</p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Project document register & version control</p>
        </div>
        <div className="flex gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
            <button onClick={() => setViewMode('grid')} className={clsx('p-2 rounded-md transition-colors', viewMode === 'grid' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white')}>
              <Grid size={16}/>
            </button>
            <button onClick={() => setViewMode('list')} className={clsx('p-2 rounded-md transition-colors', viewMode === 'list' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white')}>
              <List size={16}/>
            </button>
          </div>
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
                  <td className="px-4 py-3 text-xl">{typeIcon(String(d.type??''))}</td>
                  <td className="px-4 py-3 font-medium text-white max-w-xs truncate">{String(d.name??'—')}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{String(d.discipline??'—')}</td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-gray-300">Rev {String(d.version??'A')}</td>
                  <td className="px-4 py-3 text-gray-400">{String(d.uploadedBy??d.uploaded_by??'—')}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{String(d.date_issued??'—')}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(d.status??'')] ?? 'bg-gray-800 text-gray-300'}`}>{String(d.status??'')}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {d.status==='Under Review' && <button onClick={()=>approve(d)} className="p-1.5 text-green-600 hover:bg-green-500/20 rounded" title="Approve"><FileText size={14}/></button>}
                      {!!d.file_url && <a href={String(d.file_url)} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-600 hover:bg-blue-500/20 rounded"><Eye size={14}/></a>}
                      <button onClick={()=>openEdit(d)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-500/20 rounded"><Edit2 size={14}/></button>
                      <button onClick={()=>handleDelete(String(d.id))} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-500/20 rounded"><Trash2 size={14}/></button>
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
                  <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
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
                  <input value={form.version} onChange={e=>setForm(f=>({...f,version:e.target.value}))} placeholder="e.g. A, B, P1" className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Author</label>
                  <input value={form.uploaded_by} onChange={e=>setForm(f=>({...f,uploaded_by:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
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
