/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Plus, FileText, Clock, CheckCircle, Trash2, X, Upload, Pencil, CheckSquare, Square, Home } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { uploadFile } from '../../services/api';
import { toast } from 'sonner';
import { useLettings } from '../../hooks/useData';

export default function Lettings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState({ packageName: '', trade: '', contractor: '', contractValue: '', status: 'tendering' });

  const { data: lettings = [] } = useLettings.useList();
  const typedLettings = lettings as unknown as any[];
  const createMutation = useLettings.useCreate();
  const updateMutation = useLettings.useUpdate();
  const deleteMutation = useLettings.useDelete();

  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} item(s)?`)) return;
    await Promise.all(ids.map(id => deleteMutation.mutateAsync(id)));
    toast.success(`Deleted ${ids.length} item(s)`);
    clearSelection();
  }

  const filtered = typedLettings.filter((l: any) =>
    (l.package_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.trade || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const awardedCount = typedLettings.filter((l: any) => l.status === 'awarded').length;
  const evaluatingCount = typedLettings.filter((l: any) => l.status === 'evaluation' || l.status === 'tendering' || l.status === 'advertising').length;

  const handleCreate = async () => {
    if (!form.packageName) return;
    await createMutation.mutateAsync({
      data: {
        package_name: form.packageName,
        trade: form.trade || '',
        contractor: form.contractor || '',
        contract_value: parseFloat(form.contractValue) || 0,
        status: form.status,
      },
    });
    setShowCreateModal(false);
    setForm({ packageName: '', trade: '', contractor: '', contractValue: '', status: 'tendering' });
  };

  const handleUpdate = async () => {
    if (!editItem || !editItem.id) return;
    await updateMutation.mutateAsync({
      id: editItem.id,
      data: {
        package_name: editItem.package_name,
        trade: editItem.trade || '',
        contractor: editItem.contractor || '',
        contract_value: parseFloat(editItem.contract_value) || 0,
        status: editItem.status,
      },
    });
    setEditItem(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package?')) return;
    deleteMutation.mutateAsync(id);
  };

  async function handleUploadDoc(id: string, file: File) {
    setUploading(id);
    try {
      await uploadFile(file, 'REPORTS');
      toast.success(`Uploaded: ${file.name}`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(null);
    }
  }

  return (
    <>
      <ModuleBreadcrumbs currentModule="lettings" onNavigate={() => {}} />
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Contract Lettings</h2>
          <p className="text-gray-400 text-sm mt-1">Manage contract packages and contractor appointments</p>
        </div>
        <button type="button" onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> New Package
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><FileText className="text-blue-400" size={20} /></div><div><p className="text-gray-400 text-xs">Total Packages</p><p className="text-2xl font-bold text-white">{typedLettings.length}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle className="text-green-400" size={20} /></div><div><p className="text-gray-400 text-xs">Awarded</p><p className="text-2xl font-bold text-green-400">{awardedCount}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><Clock className="text-amber-400" size={20} /></div><div><p className="text-gray-400 text-xs">In Evaluation</p><p className="text-2xl font-bold text-amber-400">{evaluatingCount}</p></div></div></div>
      </div>
      <div className="card p-4">
        <input type="text" placeholder="Search packages..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 input input-bordered text-white mb-4" />
        {typedLettings.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Loading lettings data...</div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <EmptyState
                icon={Home}
                title="No packages found"
                description="Add letting packages to track available properties and tenancies."
                variant="default"
              />
            ) : filtered.map((l) => {
              const isSelected = selectedIds.has(String(l.id));
              return (
              <div key={l.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                <button type="button" onClick={e => { e.stopPropagation(); toggle(String(l.id)); }}>
                  {isSelected ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
                </button>
                <div>
                  <h3 className="text-white font-medium">{l.package_name || 'Package'}</h3>
                  <p className="text-gray-400 text-sm">{l.trade || 'General'} - {l.contractor || 'TBD'}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <span className={`px-2 py-1 rounded text-xs ${l.status === 'awarded' ? 'bg-green-500/10 text-green-400' : l.status === 'tendering' || l.status === 'evaluation' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-500/10 text-gray-400'}`}>{l.status || 'unknown'}</span>
                    {l.contract_value > 0 && <p className="text-white font-medium mt-1">£{Number(l.contract_value).toLocaleString()}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditItem(l)}
                    className="p-2 hover:bg-blue-900/30 rounded"
                    title="Edit"
                  >
                    <Pencil size={16} className="text-blue-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(String(l.id))}
                    className="p-2 hover:bg-red-900/30 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                  <input
                    type="file"
                    id={`upload-let-${l.id}`}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadDoc(String(l.id), file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById(`upload-let-${l.id}`)?.click()}
                    disabled={uploading === String(l.id)}
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
              <h3 className="text-xl font-bold text-white">New Package</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="letPkg" className="block text-gray-400 text-xs mb-1">Package Name *</label>
                <input id="letPkg" type="text" value={form.packageName} onChange={e => setForm(f => ({ ...f, packageName: e.target.value }))} placeholder="e.g. M&E Installation" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
              <div>
                <label htmlFor="letTrade" className="block text-gray-400 text-xs mb-1">Trade</label>
                <input id="letTrade" type="text" value={form.trade} onChange={e => setForm(f => ({ ...f, trade: e.target.value }))} placeholder="e.g. Electrical" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="letContractor" className="block text-gray-400 text-xs mb-1">Contractor</label>
                  <input id="letContractor" type="text" value={form.contractor} onChange={e => setForm(f => ({ ...f, contractor: e.target.value }))} placeholder="Contractor name" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="letValue" className="block text-gray-400 text-xs mb-1">Contract Value (£)</label>
                  <input id="letValue" type="number" value={form.contractValue} onChange={e => setForm(f => ({ ...f, contractValue: e.target.value }))} placeholder="0.00" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
              </div>
              <div>
                <label htmlFor="letStatus" className="block text-gray-400 text-xs mb-1">Status</label>
                <select id="letStatus" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                  <option value="advertising">Advertising</option>
                  <option value="tendering">Tendering</option>
                  <option value="evaluation">Evaluation</option>
                  <option value="awarded">Awarded</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleCreate} disabled={createMutation.isPending || !form.packageName} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {createMutation.isPending ? 'Creating...' : 'Create Package'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Edit Package</h3>
              <button type="button" onClick={() => setEditItem(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="editPkg" className="block text-gray-400 text-xs mb-1">Package Name *</label>
                <input id="editPkg" type="text" value={editItem.package_name || ''} onChange={e => setEditItem((f: any) => ({ ...f, package_name: e.target.value }))} placeholder="e.g. M&E Installation" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
              <div>
                <label htmlFor="editTrade" className="block text-gray-400 text-xs mb-1">Trade</label>
                <input id="editTrade" type="text" value={editItem.trade || ''} onChange={e => setEditItem((f: any) => ({ ...f, trade: e.target.value }))} placeholder="e.g. Electrical" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editContractor" className="block text-gray-400 text-xs mb-1">Contractor</label>
                  <input id="editContractor" type="text" value={editItem.contractor || ''} onChange={e => setEditItem((f: any) => ({ ...f, contractor: e.target.value }))} placeholder="Contractor name" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="editValue" className="block text-gray-400 text-xs mb-1">Contract Value (£)</label>
                  <input id="editValue" type="number" value={editItem.contract_value || ''} onChange={e => setEditItem((f: any) => ({ ...f, contract_value: e.target.value }))} placeholder="0.00" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
              </div>
              <div>
                <label htmlFor="editStatus" className="block text-gray-400 text-xs mb-1">Status</label>
                <select id="editStatus" value={editItem.status || 'tendering'} onChange={e => setEditItem((f: any) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                  <option value="advertising">Advertising</option>
                  <option value="tendering">Tendering</option>
                  <option value="evaluation">Evaluation</option>
                  <option value="awarded">Awarded</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleUpdate} disabled={updateMutation.isPending || !editItem.package_name} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50">
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
