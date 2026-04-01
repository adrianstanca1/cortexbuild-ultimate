/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Plus, Edit, Trash2, X, Upload, CheckSquare, Square } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { uploadFile } from '../../services/api';
import { useSignage } from '../../hooks/useData';

export default function Signage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ description: '', location: '', type: 'safety', status: 'required' });
  const [uploading, setUploading] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Record<string, any> | null>(null);

  const { useList, useCreate, useUpdate, useDelete } = useSignage;
  const { data: signage = [], isLoading } = useList() as { data: any[]; isLoading: boolean };
  const createMutation = useCreate() as { mutateAsync: (data: Record<string, unknown>) => Promise<unknown>; isPending: boolean };
  const updateMutation = useUpdate() as { mutateAsync: (data: { id: string; data: Record<string, unknown> }) => Promise<unknown>; isPending: boolean };
  const deleteMutation = useDelete() as { mutateAsync: (id: string) => Promise<void>; isPending: boolean };

  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} signage item(s)?`)) return;
    try {
      await Promise.all(ids.map(id => deleteMutation.mutateAsync(id)));
      clearSelection();
    } catch {
      // error handled by hook
    }
  }

  const filtered = signage.filter((s: any) =>
    (s.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.description) return;
    try {
      await createMutation.mutateAsync({
        description: form.description,
        location: form.location || '',
        type: form.type,
        status: form.status,
      });
      setShowCreateModal(false);
      setForm({ description: '', location: '', type: 'safety', status: 'required' });
    } catch {
      // error handled by hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this signage record?')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // error handled by hook
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !editItem.description) return;
    try {
      await updateMutation.mutateAsync({
        id: editItem.id,
        data: {
          description: editItem.description,
          location: editItem.location,
          type: editItem.type,
          status: editItem.status,
        },
      });
      setEditItem(null);
    } catch {
      // error handled by hook
    }
  };

  async function handleUploadDoc(id: string, file: File) {
    setUploading(id);
    try {
      await uploadFile(file, 'REPORTS');
    } catch {
      // error handled inline
    } finally {
      setUploading(null);
    }
  }

  return (
    <>
      <ModuleBreadcrumbs currentModule="signage" onNavigate={() => {}} />
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Site Signage</h2>
          <p className="text-gray-400 text-sm mt-1">Manage safety, warning and information signage</p>
        </div>
        <button type="button" onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> Add Sign
        </button>
      </div>
      <div className="card p-4">
        <input
          type="text"
          placeholder="Search signage..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4"
        />
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Loading signage...</div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <EmptyState title="No signage items found" />
            ) : filtered.map((s) => {
              const isSelected = selectedIds.has(String(s.id));
              return (
              <div key={s.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                <button type="button" onClick={e => { e.stopPropagation(); toggle(String(s.id)); }}>
                  {isSelected ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
                </button>
                <div>
                  <h3 className="text-white font-medium">{s.description || s.reference || 'Sign'}</h3>
                  <p className="text-gray-400 text-sm">{s.location || 'No location'} - {s.type || 'General'}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${s.status === 'installed' ? 'bg-green-500/10 text-green-400' : s.status === 'required' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-500/10 text-gray-400'}`}>
                    {s.status || 'unknown'}
                  </span>
                  <button type="button" onClick={() => setEditItem(s)} className="p-2 hover:bg-gray-700 rounded"><Edit size={16} className="text-gray-400" /></button>
                  <button
                    type="button"
                    onClick={() => handleDelete(String(s.id))}
                    className="p-2 hover:bg-red-900/30 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                  <input
                    type="file"
                    id={`upload-sign-${s.id}`}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadDoc(String(s.id), file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById(`upload-sign-${s.id}`)?.click()}
                    disabled={uploading === String(s.id)}
                    className="p-2 hover:bg-blue-900/30 rounded disabled:opacity-50"
                    title="Upload Document"
                  >
                    <Upload size={16} className="text-blue-400" />
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      <BulkActionsBar
        selectedIds={Array.from(selectedIds)}
        actions={[
          { id: 'delete', label: 'Delete Selected', icon: Trash2, variant: 'danger', onClick: handleBulkDelete, confirm: 'This action cannot be undone.' },
        ]}
        onClearSelection={clearSelection}
      />

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Add Signage</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="signDesc" className="block text-gray-400 text-xs mb-1">Description *</label>
                <input id="signDesc" type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Hard Hat Area" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div>
                <label htmlFor="signLocation" className="block text-gray-400 text-xs mb-1">Location</label>
                <input id="signLocation" type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Site Entrance" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="signType" className="block text-gray-400 text-xs mb-1">Type</label>
                  <select id="signType" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="safety">Safety</option>
                    <option value="warning">Warning</option>
                    <option value="information">Information</option>
                    <option value="mandatory">Mandatory</option>
                    <option value="prohibition">Prohibition</option>
                    <option value="fire">Fire</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="signStatus" className="block text-gray-400 text-xs mb-1">Status</label>
                  <select id="signStatus" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="required">Required</option>
                    <option value="ordered">Ordered</option>
                    <option value="installed">Installed</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleCreate} disabled={createMutation.isPending || !form.description} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {createMutation.isPending ? 'Creating...' : 'Add Sign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Edit Signage</h3>
              <button type="button" onClick={() => setEditItem(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="editSignDesc" className="block text-gray-400 text-xs mb-1">Description *</label>
                <input id="editSignDesc" type="text" value={editItem.description} onChange={e => setEditItem(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div>
                <label htmlFor="editSignLocation" className="block text-gray-400 text-xs mb-1">Location</label>
                <input id="editSignLocation" type="text" value={editItem.location} onChange={e => setEditItem(f => ({ ...f, location: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editSignType" className="block text-gray-400 text-xs mb-1">Type</label>
                  <select id="editSignType" value={editItem.type} onChange={e => setEditItem(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="safety">Safety</option>
                    <option value="warning">Warning</option>
                    <option value="information">Information</option>
                    <option value="mandatory">Mandatory</option>
                    <option value="prohibition">Prohibition</option>
                    <option value="fire">Fire</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="editSignStatus" className="block text-gray-400 text-xs mb-1">Status</label>
                  <select id="editSignStatus" value={editItem.status} onChange={e => setEditItem(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="required">Required</option>
                    <option value="ordered">Ordered</option>
                    <option value="installed">Installed</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleUpdate} disabled={updateMutation.isPending || !editItem.description} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
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
