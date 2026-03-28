import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Search, Download, Eye, Edit2, Trash2, X, Upload, FileCheck, Image, FolderOpen,
  BarChart3, Grid, List, FileIcon as FileIconDefault, History, UploadCloud
} from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { EmptyState } from '../ui/EmptyState';

interface DocumentVersion {
  id: string;
  version: string;
  file_path: string;
  uploaded_by: string;
  changes: string;
  created_at: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  project_id: string;
  project: string;
  uploaded_by: string;
  version: string;
  size: string;
  status: string;
  category: string;
  file_path?: string;
  access_level: string;
  parent_folder: string;
  created_at: string;
  versions?: DocumentVersion[];
}

const CATEGORIES = ['PLANS', 'DRAWINGS', 'PERMITS', 'RAMS', 'CONTRACTS', 'REPORTS', 'SPECS', 'PHOTOS'];
const ACCESS_LEVELS = [
  { value: 'public', label: 'Public', color: 'text-green-400' },
  { value: 'internal', label: 'Internal', color: 'text-blue-400' },
  { value: 'restricted', label: 'Restricted', color: 'text-amber-400' },
  { value: 'confidential', label: 'Confidential', color: 'text-red-400' },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getFileIcon(type: string) {
  switch (type.toUpperCase()) {
    case 'PDF': return FileText;
    case 'DOC': case 'DOCX': return FileCheck;
    case 'XLS': case 'XLSX': return BarChart3;
    case 'JPG': case 'JPEG': case 'PNG': case 'GIF': case 'WEBP': return Image;
    default: return FileIconDefault;
  }
}

function getTypeColor(type: string) {
  switch (type.toUpperCase()) {
    case 'PDF': return 'bg-red-500/20 text-red-400';
    case 'DOC': case 'DOCX': return 'bg-blue-500/20 text-blue-400';
    case 'XLS': case 'XLSX': return 'bg-green-500/20 text-green-400';
    case 'JPG': case 'JPEG': case 'PNG': case 'GIF': case 'WEBP': return 'bg-purple-500/20 text-purple-400';
    default: return 'bg-slate-700 text-slate-400';
  }
}

export function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('REPORTS');
  const [selectedAccess, setSelectedAccess] = useState<string>('public');
  const [dragOver, setDragOver] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('include_versions', 'true');
      const res = await fetch(`/api/files?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setDocuments(data.data || []);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchQuery]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleUpload = async (file: File, category: string, access: string) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('access_level', access);
    formData.append('name', file.name);
    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      toast.success(`Uploaded ${file.name}`);
      setShowUploadModal(false);
      fetchDocuments();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleUploadVersion = async (docId: string, file: File, changes: string) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('changes', changes);
    try {
      const res = await fetch(`/api/files/${docId}/upload-version`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      toast.success('New version uploaded');
      setShowVersionHistory(false);
      fetchDocuments();
    } catch (err) { toast.error('Upload failed'); }
  };

  const handleDownload = async (doc: Document) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/files/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = doc.name;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) { toast.error('Download failed'); }
  };

  const handlePreview = (doc: Document) => {
    const token = localStorage.getItem('token');
    const previewUrl = `/api/files/${doc.id}/preview?token=${token}`;
    setPreviewDoc({ ...doc, file_path: previewUrl });
  };

  const handleUpdate = async (docId: string, updates: Partial<Document>) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/files/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Document updated');
      setEditingDoc(null);
      fetchDocuments();
    } catch (err) { toast.error('Update failed'); }
  };

  const handleDelete = async (docId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/files/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Document deleted');
      setSelectedDoc(null);
      fetchDocuments();
    } catch (err) { toast.error('Delete failed'); }
  };

  const filteredDocs = documents.filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const isImage = (type: string) => ['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP'].includes(type.toUpperCase());
  const isPdf = (type: string) => type.toUpperCase() === 'PDF';

  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold text-white">Documents</h1><p className="text-sm text-slate-400 mt-1">{documents.length} files</p></div>
        <button onClick={() => setShowUploadModal(true)} className="btn-primary flex items-center gap-2"><UploadCloud className="w-4 h-4" /> Upload</button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1" style={{minWidth: '200px'}}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search documents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input pl-10 w-full" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input w-auto">
          <option value="ALL">All Categories</option>
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <div className="flex gap-1">
          <button onClick={() => setViewMode('grid')} className={clsx('btn-secondary p-2', viewMode === 'grid' && 'bg-slate-600')}><Grid className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('list')} className={clsx('btn-secondary p-2', viewMode === 'list' && 'bg-slate-600')}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="card p-4 animate-pulse"><div className="h-20 bg-slate-800 rounded mb-3"></div><div className="h-4 bg-slate-800 rounded w-3/4 mb-2"></div><div className="h-3 bg-slate-800 rounded w-1/2"></div></div>)}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredDocs.map(doc => {
            const FileIcon = getFileIcon(doc.type);
            return (
              <div key={doc.id} className="card p-4 cursor-pointer hover:border-amber-500/50 transition-all" onClick={() => setSelectedDoc(doc)}>
                <div className="flex items-start justify-between mb-3">
                  <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', getTypeColor(doc.type))}><FileIcon className="w-6 h-6" /></div>
                  <span className="badge bg-slate-700 text-slate-300 text-xs">{doc.category}</span>
                </div>
                <h4 className="font-medium text-slate-200 text-sm mb-1 truncate" title={doc.name}>{doc.name}</h4>
                <p className="text-xs text-slate-500 mb-2">{doc.type} - {doc.size} - v{doc.version}</p>
                <div className="flex items-center justify-between">
                  <span className={clsx('text-xs', ACCESS_LEVELS.find(al => al.value === doc.access_level)?.color || 'text-slate-500')}>{doc.access_level}</span>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handlePreview(doc); }} className="p-1.5 hover:bg-slate-700 rounded text-slate-400"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDownload(doc); }} className="p-1.5 hover:bg-slate-700 rounded text-slate-400"><Download className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Type</th><th>Category</th><th>Access</th><th>Version</th><th>Size</th><th className="w-24">Actions</th></tr></thead>
            <tbody>
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                  <td><div className="flex items-center gap-2">{React.createElement(getFileIcon(doc.type), { className: 'w-4 h-4 text-slate-400' })}<span className="truncate max-w-xs">{doc.name}</span></div></td>
                  <td>{doc.type}</td><td><span className="badge bg-slate-700 text-slate-300 text-xs">{doc.category}</span></td>
                  <td><span className={clsx('text-xs', ACCESS_LEVELS.find(al => al.value === doc.access_level)?.color)}>{doc.access_level}</span></td>
                  <td>v{doc.version}</td><td>{doc.size}</td>
                  <td><div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handlePreview(doc); }} className="p-1.5 hover:bg-slate-700 rounded"><Eye className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDownload(doc); }} className="p-1.5 hover:bg-slate-700 rounded"><Download className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setShowVersionHistory(true); setSelectedDoc(doc); }} className="p-1.5 hover:bg-slate-700 rounded"><History className="w-4 h-4" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredDocs.length === 0 && !loading && (
        <EmptyState
          icon={FolderOpen}
          title="No documents found"
          description="Upload your first document to get started."
        />
      )}

      {selectedDoc && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-900 border-l border-slate-800 z-50 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-semibold">Document Details</h2><button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-slate-800 rounded"><X className="w-5 h-5" /></button></div>
            <div className="space-y-4">
              <div className={clsx('w-20 h-20 rounded-lg flex items-center justify-center mx-auto', getTypeColor(selectedDoc.type))}>{React.createElement(getFileIcon(selectedDoc.type), { className: 'w-10 h-10' })}</div>
              <div className="text-center"><h3 className="font-medium text-white break-words">{selectedDoc.name}</h3><p className="text-sm text-slate-500">{selectedDoc.type} - {selectedDoc.size}</p></div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-800 p-3 rounded-lg"><p className="text-slate-500 mb-1">Category</p><p className="text-white">{selectedDoc.category}</p></div>
                <div className="bg-slate-800 p-3 rounded-lg"><p className="text-slate-500 mb-1">Version</p><p className="text-white">v{selectedDoc.version}</p></div>
                <div className="bg-slate-800 p-3 rounded-lg"><p className="text-slate-500 mb-1">Access</p><p className={ACCESS_LEVELS.find(al => al.value === selectedDoc.access_level)?.color}>{selectedDoc.access_level}</p></div>
                <div className="bg-slate-800 p-3 rounded-lg"><p className="text-slate-500 mb-1">Uploaded By</p><p className="text-white truncate">{selectedDoc.uploaded_by}</p></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handlePreview(selectedDoc)} className="btn-primary flex-1"><Eye className="w-4 h-4 mr-1" /> Preview</button>
                <button onClick={() => handleDownload(selectedDoc)} className="btn-secondary flex-1"><Download className="w-4 h-4 mr-1" /> Download</button>
              </div>
              <div className="border-t border-slate-800 pt-4"><button onClick={() => setShowVersionHistory(true)} className="w-full btn-secondary"><History className="w-4 h-4 mr-1" /> Version History</button></div>
              <div className="border-t border-slate-800 pt-4"><button onClick={() => setEditingDoc(selectedDoc)} className="w-full btn-secondary"><Edit2 className="w-4 h-4 mr-1" /> Edit Details</button></div>
              <div className="border-t border-slate-800 pt-4"><button onClick={() => handleDelete(selectedDoc.id)} className="w-full btn-secondary text-red-400 hover:bg-red-500/20"><Trash2 className="w-4 h-4 mr-1" /> Delete</button></div>
            </div>
          </div>
        </div>
      )}

      {showVersionHistory && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="dialog-overlay absolute inset-0" onClick={() => setShowVersionHistory(false)} />
          <div className="dialog-content p-6 w-full max-w-2xl relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Version History - {selectedDoc.name}</h3><button onClick={() => setShowVersionHistory(false)} className="p-2 hover:bg-slate-700 rounded"><X className="w-5 h-5" /></button></div>
            <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-amber-500 mb-4">
              <div className="flex items-center justify-between"><span className="font-medium text-amber-400">Current: v{selectedDoc.version}</span><span className="text-sm text-slate-500">{formatDateTime(selectedDoc.created_at)}</span></div>
              <p className="text-sm text-slate-400 mt-1">Current version</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800">
              <h4 className="font-medium mb-3">Upload New Version</h4>
              <div className="flex gap-3">
                <input type="text" placeholder="Describe changes..." id="versionChanges" className="input flex-1" />
                <input type="file" id="versionFileInput" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUploadVersion(selectedDoc.id, file, (document.getElementById('versionChanges') as HTMLInputElement).value || 'Updated'); }} />
                <button onClick={() => document.getElementById('versionFileInput')?.click()} className="btn-secondary"><Upload className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="dialog-overlay absolute inset-0" onClick={() => setShowUploadModal(false)} />
          <div className="dialog-content p-6 w-full max-w-lg relative z-10">
            <h3 className="text-lg font-semibold mb-4">Upload Document</h3>
            <div className={clsx('border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-4', dragOver ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 hover:border-slate-600')}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleUpload(file, selectedCategory, selectedAccess); }}
              onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.onchange = (e: any) => handleUpload(e.target.files[0], selectedCategory, selectedAccess); input.click(); }}>
              <UploadCloud className={clsx('w-10 h-10 mx-auto mb-3', dragOver ? 'text-amber-500' : 'text-slate-500')} />
              <p className="text-slate-300">Drag and drop or click to upload</p>
              <p className="text-sm text-slate-500 mt-1">PDF, DOC, XLS, PNG, JPG up to 100MB</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div><label className="text-sm text-slate-400 mb-1 block">Category</label><select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="input w-full">{CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
              <div><label className="text-sm text-slate-400 mb-1 block">Access Level</label><select value={selectedAccess} onChange={e => setSelectedAccess(e.target.value)} className="input w-full">{ACCESS_LEVELS.map(al => <option key={al.value} value={al.value}>{al.label}</option>)}</select></div>
            </div>
            <div className="flex justify-end gap-3"><button onClick={() => setShowUploadModal(false)} className="btn-secondary">Cancel</button></div>
          </div>
        </div>
      )}

      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="dialog-overlay absolute inset-0" onClick={() => setEditingDoc(null)} />
          <div className="dialog-content p-6 w-full max-w-md relative z-10">
            <h3 className="text-lg font-semibold mb-4">Edit Document</h3>
            <div className="space-y-4">
              <div><label className="text-sm text-slate-400 mb-1 block">Name</label><input type="text" defaultValue={editingDoc.name} id="editName" className="input w-full" /></div>
              <div><label className="text-sm text-slate-400 mb-1 block">Category</label><select defaultValue={editingDoc.category} id="editCategory" className="input w-full">{CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
              <div><label className="text-sm text-slate-400 mb-1 block">Access Level</label><select defaultValue={editingDoc.access_level} id="editAccess" className="input w-full">{ACCESS_LEVELS.map(al => <option key={al.value} value={al.value}>{al.label}</option>)}</select></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingDoc(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => { handleUpdate(editingDoc.id, { name: (document.getElementById('editName') as HTMLInputElement).value, category: (document.getElementById('editCategory') as HTMLSelectElement).value, access_level: (document.getElementById('editAccess') as HTMLSelectElement).value }); }} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <button onClick={() => setPreviewDoc(null)} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700"><X className="w-6 h-6" /></button>
          <div className="max-w-5xl max-h-[90vh] flex items-center justify-center">
            {isImage(previewDoc.type) ? <img src={previewDoc.file_path} alt={previewDoc.name} className="max-w-full max-h-[85vh] object-contain rounded-lg" /> :
             isPdf(previewDoc.type) ? <iframe src={previewDoc.file_path} className="w-[80vw] h-[85vh] rounded-lg" /> :
             <div className="text-center p-8"><FileIconDefault className="w-24 h-24 mx-auto mb-4 text-slate-600" /><p className="text-slate-400 mb-4">Preview not available</p><button onClick={() => handleDownload(previewDoc)} className="btn-primary">Download to View</button></div>}
          </div>
        </div>
      )}
    </div>
  );
}
