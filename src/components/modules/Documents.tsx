import { useState } from 'react';
import {
  FileText, Plus, Search, Download, Eye, Edit2, Trash2, X, ChevronDown, ChevronUp, ChevronRight, Clock, Upload,
  Shield, FileCheck, Image, FolderOpen, CheckCircle2, BarChart3, Activity, Calendar, HardDrive, CheckSquare, Square
} from 'lucide-react';
import { DataImporter, ExportButton } from '../ui/DataImportExport';
import { useDocuments } from '../../hooks/useData';
import { uploadFile } from '../../services/api';
import { toast } from 'sonner';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';

type AnyRow = Record<string, unknown>;

interface Document {
  id: string;
  name: string;
  type: string;
  project: string;
  uploadedBy: string;
  uploadedDate: string;
  version: string;
  size: string;
  status: 'current' | 'for review' | 'superseded' | 'draft';
  category: 'PLANS' | 'DRAWINGS' | 'PERMITS' | 'RAMS' | 'CONTRACTS' | 'REPORTS' | 'SPECS' | 'PHOTOS';
}

const CATEGORIES = ['PLANS', 'DRAWINGS', 'PERMITS', 'RAMS', 'CONTRACTS', 'REPORTS', 'SPECS', 'PHOTOS'];
const STATUS_OPTIONS = ['draft', 'for review', 'current', 'superseded'];
const PROJECTS = ['Project A', 'Project B', 'Project C', 'Site 1', 'Site 2'];

const statusColour: Record<string, string> = {
  'current': 'bg-emerald-900/40 text-emerald-300',
  'for review': 'bg-amber-900/40 text-amber-300',
  'superseded': 'bg-gray-700 text-gray-400',
  'draft': 'bg-blue-900/40 text-blue-300',
};

const categoryIcons: Record<string, React.ReactNode> = {
  'PLANS': <FileText size={16} />,
  'DRAWINGS': <FileText size={16} />,
  'PERMITS': <FileCheck size={16} />,
  'RAMS': <Shield size={16} />,
  'CONTRACTS': <FileCheck size={16} />,
  'REPORTS': <BarChart3 size={16} />,
  'SPECS': <FileText size={16} />,
  'PHOTOS': <Image size={16} />,
};

const emptyForm = {
  name: '', category: 'PLANS' as const, project: 'Project A', version: '1.0',
  status: 'draft' as const, uploadedBy: '', uploadedDate: new Date().toISOString().split('T')[0],
  description: '', size: '0 MB'
};

const MOCK_ACTIVITY = [
  { id: '1', action: 'uploaded', doc: 'Foundation Plans Rev B', user: 'John Smith', time: '2 hours ago', icon: 'upload' },
  { id: '2', action: 'approved', doc: 'Structural Drawings', user: 'Sarah Jones', time: '4 hours ago', icon: 'check' },
  { id: '3', action: 'superseded', doc: 'Health & Safety Plan', user: 'Mike Brown', time: '1 day ago', icon: 'archive' },
  { id: '4', action: 'uploaded', doc: 'Site Photos - Week 3', user: 'Tom Wilson', time: '1 day ago', icon: 'upload' },
  { id: '5', action: 'downloaded', doc: 'Building Permits', user: 'Emma Davis', time: '2 days ago', icon: 'download' },
  { id: '6', action: 'approved', doc: 'Electrical Specifications', user: 'John Smith', time: '3 days ago', icon: 'check' },
];

export function Documents() {
  const { useList, useCreate, useUpdate, useDelete } = useDocuments;
  const { data: raw = [], isLoading } = useList();
  const docs = (raw as AnyRow[]).map(d => ({
    id: String(d.id ?? ''),
    name: String(d.name ?? ''),
    type: String(d.type ?? ''),
    project: String(d.project ?? ''),
    uploadedBy: String(d.uploadedBy ?? ''),
    uploadedDate: String(d.uploadedDate ?? ''),
    version: String(d.version ?? ''),
    size: String(d.size ?? ''),
    status: String(d.status ?? 'draft') as 'current' | 'for review' | 'superseded' | 'draft',
    category: String(d.category ?? 'PLANS') as 'PLANS' | 'DRAWINGS' | 'PERMITS' | 'RAMS' | 'CONTRACTS' | 'REPORTS' | 'SPECS' | 'PHOTOS',
  }));
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [activeTab, setActiveTab] = useState<'library'|'categories'|'approvals'|'activity'>('library');
  const [selectedDoc, setSelectedDoc] = useState<AnyRow | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<string>('PLANS');
  const [showBulkImport, setShowBulkImport] = useState(false);

  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} document(s)?`)) return;
    try {
      await Promise.all(ids.map(id => deleteMutation.mutateAsync(id)));
      toast.success(`Deleted ${ids.length} document(s)`);
      clearSelection();
    } catch {
      toast.error('Bulk delete failed');
    }
  }

  async function handleBulkUpdateStatus(ids: string[], status: string) {
    try {
      await Promise.all(ids.map(id => updateMutation.mutateAsync({ id, data: { status } })));
      toast.success(`Updated ${ids.length} document(s) to ${status}`);
      clearSelection();
    } catch {
      toast.error('Bulk update failed');
    }
  }

  const filtered = docs.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || d.status === statusFilter;
    const matchCategory = categoryFilter === 'All' || d.category === categoryFilter;
    const matchProject = projectFilter === 'All' || d.project === projectFilter;
    return matchSearch && matchStatus && matchCategory && matchProject;
  });

  const totalDocs = docs.length;
  const currentRevisions = docs.filter(d => d.status === 'current').length;
  const forReviewCount = docs.filter(d => d.status === 'for review').length;
  const supersededCount = docs.filter(d => d.status === 'superseded').length;
  const draftCount = docs.filter(d => d.status === 'draft').length;
  const totalSize = docs.reduce((acc, d) => {
    const num = parseFloat(String(d.size ?? '0').replace(/[^0-9.]/g, ''));
    return acc + (isNaN(num) ? 0 : num);
  }, 0);

  const uniqueProjects = ['All', ...Array.from(new Set(docs.map(d => d.project).filter(Boolean)))];
  const categoryDocs = CATEGORIES.map(cat => ({
    name: cat,
    count: docs.filter(d => d.category === cat).length,
    lastUpdate: docs.filter(d => d.category === cat).sort((a, b) =>
      new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime()
    )[0]?.uploadedDate || 'N/A',
  }));

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, uploadedDate: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  }

  function openEdit(d: AnyRow) {
    setEditing(d);
    setForm({
      name: String(d.name ?? ''),
      category: String(d.category ?? 'PLANS') as any,
      project: String(d.project ?? ''),
      version: String(d.version ?? ''),
      status: String(d.status ?? 'draft') as any,
      uploadedBy: String(d.uploadedBy ?? ''),
      uploadedDate: String(d.uploadedDate ?? ''),
      description: String(d.description ?? ''),
      size: String(d.size ?? ''),
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await updateMutation.mutateAsync({ id: String(editing.id), data: form });
      toast.success('Document updated');
    } else {
      await createMutation.mutateAsync(form);
      toast.success('Document uploaded');
    }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document?')) return;
    await deleteMutation.mutateAsync(id);
    toast.success('Document deleted');
  }

  async function handleApprove(d: AnyRow) {
    await updateMutation.mutateAsync({ id: String(d.id), data: { status: 'current' } });
    toast.success('Document approved');
  }

  async function handleReject(d: AnyRow) {
    await updateMutation.mutateAsync({ id: String(d.id), data: { status: 'draft' } });
    toast.success('Document rejected');
  }

  function handleDownloadAll() {
    toast.success('Download started for all documents');
  }

  async function handleQuickUpload(file: File) {
    setUploading(true);
    try {
      await uploadFile(file, uploadCategory);
      toast.success(`Uploaded: ${file.name}`);
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleBulkImport(data: Record<string, unknown>[], mapping: any[]) {
    for (const row of data) {
      const mapped: Record<string, unknown> = {};
      mapping.forEach(m => { if (m.target) mapped[m.target] = row[m.source]; });
      try { await createMutation.mutateAsync(mapped as any); } catch { /* skip failed rows */ }
    }
    toast.success(`Imported ${data.length} document(s)`);
  }

  const getDaysPending = (date: string): number => {
    const days = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Documents</h1>
          <p className="text-sm text-gray-400 mt-1">UK construction document control & version management</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowBulkImport(true)} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm font-medium">
            <Download size={16}/><span>Import</span>
          </button>
          <ExportButton data={docs} filename="documents" />
          <select
            value={uploadCategory}
            onChange={e => setUploadCategory(e.target.value)}
            className="text-sm bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="file"
            id="quick-upload-doc"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg,.zip"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) { await handleQuickUpload(file); e.target.value = ''; }
            }}
          />
          <button
            type="button"
            onClick={() => document.getElementById('quick-upload-doc')?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Upload size={16} /><span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Documents', value: totalDocs, icon: FileText, colour: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-700' },
          { label: 'Current Revisions', value: currentRevisions, icon: CheckCircle2, colour: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-700' },
          { label: 'For Review', value: forReviewCount, icon: Clock, colour: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-700' },
          { label: 'Superseded', value: supersededCount, icon: FolderOpen, colour: 'text-gray-400', bg: 'bg-gray-800 border-gray-700' },
          { label: 'Storage Used', value: `${totalSize.toFixed(1)} MB`, icon: HardDrive, colour: 'text-purple-400', bg: 'bg-purple-900/20 border-purple-700' },
        ].map(stat => (
          <div key={stat.label} className={`bg-gray-800/40 rounded-lg border ${stat.bg} p-4`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.colour} mt-2`}>{stat.value}</p>
              </div>
              <stat.icon size={20} className={`${stat.colour} opacity-60`} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-700">
        {[
          { key: 'library', label: 'Document Library', icon: FileText },
          { key: 'categories', label: 'Categories', icon: FolderOpen },
          { key: 'approvals', label: 'Approvals', icon: CheckCircle2 },
          { key: 'activity', label: 'Recent Activity', icon: Activity },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key as any); setSelectedCategoryTab(null); }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.key ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      {/* Document Library Tab */}
      {activeTab === 'library' && (
        <>
          <div className="flex flex-wrap gap-3 items-center bg-gray-800 rounded-lg border border-gray-700 p-4">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or description…"
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-sm bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-sm bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              className="text-sm bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button type="button" onClick={handleDownloadAll} className="flex items-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 text-sm transition-colors">
              <Download size={14} />Download All
            </button>
            <span className="text-sm text-gray-400 ml-auto">{filtered.length} documents</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <button type="button" onClick={() => selectedIds.size > 0 ? clearSelection() : null} className="flex items-center justify-center">
                        {selectedIds.size > 0 ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
                      </button>
                    </th>
                    {['Name', 'Category', 'Project', 'Version', 'Status', 'Uploaded By', 'Date', 'Size', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filtered.map((d, idx) => {
                    const docId = String(d.id);
                    const isSelected = selectedIds.has(docId);
                    return (
                    <tr
                      key={docId}
                      onClick={() => setSelectedDoc(d)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-900/20' : idx % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-800/30'} hover:bg-gray-700/50`}
                    >
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={() => toggle(docId)} className="flex items-center justify-center">
                          {isSelected ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-200 max-w-xs truncate">{d.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-300 flex items-center gap-2">
                        {categoryIcons[d.category]}{d.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{d.project}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-300">{d.version}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[d.status] ?? 'bg-gray-700 text-gray-300'}`}>
                          {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{d.uploadedBy}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{d.uploadedDate}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{d.size}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => toast.success('Document viewed')} className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded" title="View">
                            <Eye size={14} />
                          </button>
                          <button type="button" onClick={() => openEdit(d)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 rounded" title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button type="button" onClick={() => handleDelete(String(d.id))} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <FileText size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No documents found</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <BulkActionsBar
        selectedIds={Array.from(selectedIds)}
        actions={[
          { id: 'delete', label: 'Delete Selected', icon: Trash2, variant: 'danger', onClick: handleBulkDelete, confirm: 'This action cannot be undone.' },
          { id: 'approve', label: 'Mark Current', icon: CheckCircle2, variant: 'primary', onClick: (ids) => handleBulkUpdateStatus(ids, 'current') },
          { id: 'review', label: 'Mark for Review', icon: FileCheck, variant: 'default', onClick: (ids) => handleBulkUpdateStatus(ids, 'for review') },
        ]}
        onClearSelection={clearSelection}
      />

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        selectedCategoryTab ? (
          <>
            <button type="button" onClick={() => setSelectedCategoryTab(null)} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4 text-sm font-medium">
              <ChevronUp size={16} />Back to Categories
            </button>
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    {['Name', 'Project', 'Version', 'Status', 'Uploaded By', 'Date', 'Size'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {docs.filter(d => d.category === selectedCategoryTab).map((d, idx) => (
                    <tr
                      key={String(d.id)}
                      onClick={() => setSelectedDoc(d)}
                      className={`cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-800/30'} hover:bg-gray-700/50`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-200">{d.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{d.project}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-300">{d.version}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[d.status]}`}>
                          {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{d.uploadedBy}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{d.uploadedDate}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{d.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryDocs.map(cat => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategoryTab(cat.name)}
                className="bg-gray-800 border border-gray-700 hover:border-blue-500/50 rounded-lg p-6 text-left transition-all hover:shadow-lg hover:shadow-blue-500/10"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-2xl text-blue-400">
                    {categoryIcons[cat.name as keyof typeof categoryIcons]}
                  </div>
                  <ChevronRight size={18} className="text-gray-600" />
                </div>
                <h3 className="font-semibold text-gray-200 mb-1">{cat.name}</h3>
                <p className="text-2xl font-bold text-white mb-3">{cat.count}</p>
                <p className="text-xs text-gray-400">
                  {cat.lastUpdate !== 'N/A' ? `Updated ${cat.lastUpdate}` : 'No documents'}
                </p>
              </button>
            ))}
          </div>
        )
      )}

      {/* Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                {['Document', 'Project', 'Submitted By', 'Submitted Date', 'Days Pending', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {docs.filter(d => d.status === 'draft' || d.status === 'for review').map((doc, idx) => {
                const daysPending = getDaysPending(doc.uploadedDate);
                const isOverdue = daysPending > 7;
                return (
                  <tr
                    key={String(doc.id)}
                    className={`transition-colors ${idx % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-800/30'} ${isOverdue ? 'hover:bg-amber-900/20' : 'hover:bg-gray-700/50'}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-200">{doc.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{doc.project}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{doc.uploadedBy}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{doc.uploadedDate}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${isOverdue ? 'text-amber-400' : 'text-gray-400'}`}>
                      {daysPending}d {isOverdue && <span className="text-amber-400 font-bold">(OVERDUE)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[doc.status]}`}>
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(doc)}
                          className="px-2 py-1 text-xs bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50 rounded border border-emerald-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(doc)}
                          className="px-2 py-1 text-xs bg-red-900/30 text-red-300 hover:bg-red-900/50 rounded border border-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {docs.filter(d => d.status === 'draft' || d.status === 'for review').length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <CheckCircle2 size={40} className="mx-auto mb-3 opacity-30" />
              <p>All documents approved</p>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          {MOCK_ACTIVITY.map((entry, idx) => (
            <div key={entry.id} className="flex items-start gap-4 p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
              <div className="flex-shrink-0 mt-1">
                {entry.icon === 'upload' && <Upload size={18} className="text-blue-400" />}
                {entry.icon === 'check' && <CheckCircle2 size={18} className="text-emerald-400" />}
                {entry.icon === 'archive' && <FolderOpen size={18} className="text-gray-400" />}
                {entry.icon === 'download' && <Download size={18} className="text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200">
                  Document <span className="text-blue-400">{entry.doc}</span> was <span className="font-semibold text-gray-100">{entry.action}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">by {entry.user} • {entry.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {selectedDoc && (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-gray-800 border-l border-gray-700 shadow-2xl overflow-y-auto z-40">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Document Details</h3>
              <button type="button" onClick={() => setSelectedDoc(null)} className="p-1 hover:bg-gray-700 rounded"><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Name</p>
                <p className="text-sm text-gray-200 mt-1">{String(selectedDoc.name ?? '—')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Category</p>
                  <p className="text-sm text-gray-300 mt-1">{String(selectedDoc.category ?? '—')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Version</p>
                  <p className="text-sm text-gray-300 mt-1">{String(selectedDoc.version ?? '—')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Project</p>
                  <p className="text-sm text-gray-300 mt-1">{String(selectedDoc.project ?? '—')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Size</p>
                  <p className="text-sm text-gray-300 mt-1">{String(selectedDoc.size ?? '—')}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Revision History</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-gray-700/50 rounded border border-gray-600">
                    <Clock size={14} className="text-blue-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-gray-200">v{String(selectedDoc.version ?? '1.0')}</p>
                      <p className="text-xs text-gray-400">{String(selectedDoc.uploadedDate ?? '—')}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-300 rounded border border-blue-700">Current</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Status</p>
                <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium mt-2 ${statusColour[String(selectedDoc.status ?? '')] ?? 'bg-gray-700 text-gray-300'}`}>
                  {String(selectedDoc.status ?? '').charAt(0).toUpperCase() + String(selectedDoc.status ?? '').slice(1)}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Uploaded By</p>
                <p className="text-sm text-gray-300 mt-1">{String(selectedDoc.uploadedBy ?? '—')}</p>
              </div>
              {Boolean(selectedDoc.description) && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase">Description</p>
                  <p className="text-sm text-gray-300 mt-1">{String(selectedDoc.description ?? '—')}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => { toast.success('Document downloaded'); }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 rounded border border-blue-700 text-sm font-medium">
                  <Download size={14} />Download
                </button>
                <button type="button" onClick={() => openEdit(selectedDoc)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-sm font-medium">
                  <Edit2 size={14} />Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Document' : 'Upload Document'}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-700 rounded-lg"><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Document Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Category *</label>
                  <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Project *</label>
                  <select required value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Version</label>
                  <input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} placeholder="1.0" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Uploaded By</label>
                  <input value={form.uploadedBy} onChange={e => setForm(f => ({ ...f, uploadedBy: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Upload Date</label>
                  <input type="date" value={form.uploadedDate} onChange={e => setForm(f => ({ ...f, uploadedDate: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">File Size (MB)</label>
                  <input value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} placeholder="0 MB" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Document description or notes" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-sm text-gray-300 hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {editing ? 'Update Document' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkImport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Import Items</h2>
              <button type="button" onClick={() => setShowBulkImport(false)} className="p-2 hover:bg-gray-800 rounded-lg"><X size={18} className="text-gray-400"/></button>
            </div>
            <div className="p-6">
              <DataImporter
                onImport={handleBulkImport}
                format="csv"
                exampleData={{ name: '', category: '', project: '', version: '', status: '' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

