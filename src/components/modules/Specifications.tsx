/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import {
  FileText, Plus, Search, Download, Clock, Eye, Edit, X, Upload, Trash2,
  CheckSquare, Square
} from 'lucide-react';
import { useSpecifications } from '../../hooks/useData';
import { toast } from 'sonner';
import { uploadFile } from '../../services/api';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';

interface Specification {
  id: string;
  ref: string;
  title: string;
  project: string;
  section: string;
  discipline: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'issued';
  issuedDate?: string;
  description: string;
  approvedBy?: string;
  documents?: { name: string; url: string }[];
}

export default function Specifications() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [uploading, setUploading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ title: '', project: '', section: '', discipline: '', description: '' });
  const [editItem, setEditItem] = useState<Record<string, any> | null>(null);

  const { useList, useCreate, useUpdate, useDelete } = useSpecifications;
  const { data: rawSpecs = [] } = (useList() as { data: Specification[] });
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} item(s)?`)) return;
    try {
      await Promise.all(ids.map(id => deleteMutation.mutateAsync(String(id))));
      clearSelection();
    } catch {
      toast.error('Bulk delete failed');
    }
  }

  const handleCreate = async () => {
    if (!form.title || !form.project) return;
    try {
      await createMutation.mutateAsync({
        reference: `SPEC-${String(Date.now()).slice(-6)}`,
        title: form.title,
        project: form.project,
        section: form.section,
        version: '1.0',
        status: 'draft',
        description: form.description,
      });
      toast.success('Specification created');
      setShowCreateModal(false);
      setForm({ title: '', project: '', section: '', discipline: '', description: '' });
    } catch {
      toast.error('Failed to create specification');
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !editItem.id) return;
    try {
      await updateMutation.mutateAsync({
        id: editItem.id,
        data: {
          title: editItem.title,
          project: editItem.project,
          section: editItem.section,
          discipline: editItem.discipline,
          description: editItem.description,
        },
      });
      toast.success('Specification updated');
      setEditItem(null);
    } catch {
      toast.error('Failed to update specification');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this specification?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Specification deleted');
    } catch {
      toast.error('Failed to delete specification');
    }
  };

  const handleUpload = async (specId: string, file: File) => {
    setUploading(specId);
    try {
      const result = await uploadFile(file, 'SPECS');
      const spec = rawSpecs.find((s: any) => String(s.id) === String(specId));
      if (spec) {
        await updateMutation.mutateAsync({
          id: String(specId),
          data: {
            ...spec,
            documents: [...(spec.documents || []), { name: file.name, url: String(result.file_url || result.name || '') }],
          },
        });
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const filtered = rawSpecs.filter((s: Specification) => {
    const matchesSearch = (s.ref || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.project || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/10' },
    review: { label: 'In Review', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    approved: { label: 'Approved', color: 'text-green-400', bg: 'bg-green-500/10' },
    issued: { label: 'Issued', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  };

  return (
    <>
      <ModuleBreadcrumbs currentModule="specifications" onNavigate={() => {}} />
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Specifications
          </h2>
          <p className="text-gray-400 text-sm mt-1">Technical specifications management and versioning</p>
        </div>
        <button type="button" className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> Add Specification
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search specifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 input input-bordered text-white placeholder-gray-500"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 input input-bordered text-white"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="review">In Review</option>
            <option value="approved">Approved</option>
            <option value="issued">Issued</option>
          </select>
        </div>

        <div className="space-y-3">
          {filtered.map((spec: Specification) => {
            const status = statusConfig[spec.status as keyof typeof statusConfig] || statusConfig.draft;
            const isSelected = selectedIds.has(String(spec.id));
            return (
              <div key={spec.id} className={`border border-gray-700 rounded-lg p-4 hover:border-orange-500/50 transition-colors ${isSelected ? 'border-blue-500/50 bg-blue-900/10' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggle(String(spec.id))}
                      className="text-gray-400 hover:text-white mt-1"
                    >
                      {isSelected ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
                    </button>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-orange-400">{spec.ref || `SPEC-${spec.id}`}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${status.bg} ${status.color}`}>{status.label}</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-500/10 text-gray-400">v{spec.version || '1.0'}</span>
                      </div>
                      <h3 className="text-white font-medium">{spec.title || 'Specification'}</h3>
                      <p className="text-gray-400 text-sm mt-1">{spec.project || 'No project'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><Eye size={16} /></button>
                    <button type="button" className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><Download size={16} /></button>
                    <input
                      type="file"
                      id={`upload-spec-${spec.id}`}
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleUpload(String(spec.id), file);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById(`upload-spec-${spec.id}`)?.click()}
                      disabled={uploading === String(spec.id)}
                      className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-50"
                      title="Upload spec document"
                    >
                      {uploading === String(spec.id) ? <Clock size={16} className="animate-spin" /> : <Upload size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditItem({ ...spec, title: spec.title || '', project: spec.project || '', section: spec.section || '', discipline: spec.discipline || '', description: spec.description || '' })}
                      className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(String(spec.id))}
                      className="p-2 hover:bg-red-900/30 rounded"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex gap-4 text-sm text-gray-400">
                  <span>Section: {spec.section || 'N/A'}</span>
                  <span>Discipline: {spec.discipline || 'General'}</span>
                  {spec.issuedDate && <span>Issued: {spec.issuedDate}</span>}
                </div>
                {spec.documents && spec.documents.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {(spec.documents as any[] || []).map((doc: any, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300 flex items-center gap-1">
                        <FileText size={12} /> {doc.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <BulkActionsBar
          selectedIds={Array.from(selectedIds)}
          actions={[
            { id: 'delete', label: 'Delete Selected', icon: Trash2, variant: 'danger' as const, onClick: handleBulkDelete, confirm: 'This action cannot be undone.' },
          ]}
          onClearSelection={clearSelection}
        />
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Add Specification</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-xs mb-1">Title</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Specification title..." className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Project</label>
                <select value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                  <option value="">Select project...</option>
                  <option>Canary Wharf Office Complex</option>
                  <option>Manchester City Apartments</option>
                  <option>Birmingham Road Bridge</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Section</label>
                  <input type="text" value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} placeholder="e.g. 05 00 00" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Discipline</label>
                  <input type="text" value={form.discipline} onChange={e => setForm(f => ({ ...f, discipline: e.target.value }))} placeholder="e.g. Structural" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Specification details..." className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleCreate} disabled={createMutation.isPending || !form.title || !form.project} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {createMutation.isPending ? 'Creating...' : 'Create Specification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Edit Specification</h3>
              <button type="button" onClick={() => setEditItem(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="edit-title" className="block text-gray-400 text-xs mb-1">Title</label>
                <input id="edit-title" type="text" value={editItem.title} onChange={e => setEditItem((f: any) => ({ ...f, title: e.target.value }))} placeholder="Specification title..." className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
              <div>
                <label htmlFor="edit-project" className="block text-gray-400 text-xs mb-1">Project</label>
                <select id="edit-project" value={editItem.project} onChange={e => setEditItem((f: any) => ({ ...f, project: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                  <option value="">Select project...</option>
                  <option>Canary Wharf Office Complex</option>
                  <option>Manchester City Apartments</option>
                  <option>Birmingham Road Bridge</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-section" className="block text-gray-400 text-xs mb-1">Section</label>
                  <input id="edit-section" type="text" value={editItem.section} onChange={e => setEditItem((f: any) => ({ ...f, section: e.target.value }))} placeholder="e.g. 05 00 00" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="edit-discipline" className="block text-gray-400 text-xs mb-1">Discipline</label>
                  <input id="edit-discipline" type="text" value={editItem.discipline} onChange={e => setEditItem((f: any) => ({ ...f, discipline: e.target.value }))} placeholder="e.g. Structural" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
              </div>
              <div>
                <label htmlFor="edit-description" className="block text-gray-400 text-xs mb-1">Description</label>
                <textarea id="edit-description" rows={3} value={editItem.description} onChange={e => setEditItem((f: any) => ({ ...f, description: e.target.value }))} placeholder="Specification details..." className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleUpdate} disabled={updateMutation.isPending || !editItem.title || !editItem.project} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
