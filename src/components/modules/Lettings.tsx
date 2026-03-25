import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Clock, CheckCircle, XCircle, Trash2, X, Upload, Pencil } from 'lucide-react';
import { lettingsApi, uploadFile } from '../../services/api';
import { toast } from 'sonner';

export default function Lettings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [lettings, setLettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ packageName: '', trade: '', contractor: '', contractValue: '', status: 'tendering' });

  useEffect(() => {
    lettingsApi.getAll().then((data: any[]) => {
      setLettings(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = lettings.filter((l: any) =>
    (l.package_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.trade || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const awardedCount = lettings.filter((l: any) => l.status === 'awarded').length;
  const evaluatingCount = lettings.filter((l: any) => l.status === 'evaluation' || l.status === 'tendering' || l.status === 'advertising').length;

  const handleCreate = async () => {
    if (!form.packageName) return;
    setCreating(true);
    try {
      const newRecord = {
        package_name: form.packageName,
        trade: form.trade || '',
        contractor: form.contractor || '',
        contract_value: parseFloat(form.contractValue) || 0,
        status: form.status,
      };
      const created = await lettingsApi.create(newRecord);
      setLettings(prev => [created, ...prev]);
      setShowCreateModal(false);
      setForm({ packageName: '', trade: '', contractor: '', contractValue: '', status: 'tendering' });
    } catch (err) {
      console.error('Failed to create:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !editItem.id) return;
    setSaving(true);
    try {
      const updated = await lettingsApi.update(editItem.id, {
        package_name: editItem.package_name,
        trade: editItem.trade || '',
        contractor: editItem.contractor || '',
        contract_value: parseFloat(editItem.contract_value) || 0,
        status: editItem.status,
      });
      setLettings(prev => prev.map((l: any) => String(l.id) === String(editItem.id) ? updated : l));
      setEditItem(null);
    } catch (err) {
      console.error('Failed to update:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package?')) return;
    try {
      await lettingsApi.delete(id);
      setLettings(prev => prev.filter((l: any) => String(l.id) !== String(id)));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  async function handleUploadDoc(id: string, file: File) {
    setUploading(id);
    try {
      await uploadFile(file, 'REPORTS');
      toast.success(`Uploaded: ${file.name}`);
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Upload failed');
    } finally {
      setUploading(null);
    }
  }

  return (
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
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><FileText className="text-blue-400" size={20} /></div><div><p className="text-gray-400 text-xs">Total Packages</p><p className="text-2xl font-bold text-white">{loading ? '...' : lettings.length}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle className="text-green-400" size={20} /></div><div><p className="text-gray-400 text-xs">Awarded</p><p className="text-2xl font-bold text-green-400">{loading ? '...' : awardedCount}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><Clock className="text-amber-400" size={20} /></div><div><p className="text-gray-400 text-xs">In Evaluation</p><p className="text-2xl font-bold text-amber-400">{loading ? '...' : evaluatingCount}</p></div></div></div>
      </div>
      <div className="card p-4">
        <input type="text" placeholder="Search packages..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4" />
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading lettings data...</div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No packages found</div>
            ) : filtered.map((l) => (
              <div key={l.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
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
            ))}
          </div>
        )}
      </div>

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
                <input id="letPkg" type="text" value={form.packageName} onChange={e => setForm(f => ({ ...f, packageName: e.target.value }))} placeholder="e.g. M&E Installation" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div>
                <label htmlFor="letTrade" className="block text-gray-400 text-xs mb-1">Trade</label>
                <input id="letTrade" type="text" value={form.trade} onChange={e => setForm(f => ({ ...f, trade: e.target.value }))} placeholder="e.g. Electrical" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="letContractor" className="block text-gray-400 text-xs mb-1">Contractor</label>
                  <input id="letContractor" type="text" value={form.contractor} onChange={e => setForm(f => ({ ...f, contractor: e.target.value }))} placeholder="Contractor name" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="letValue" className="block text-gray-400 text-xs mb-1">Contract Value (£)</label>
                  <input id="letValue" type="number" value={form.contractValue} onChange={e => setForm(f => ({ ...f, contractValue: e.target.value }))} placeholder="0.00" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
              </div>
              <div>
                <label htmlFor="letStatus" className="block text-gray-400 text-xs mb-1">Status</label>
                <select id="letStatus" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
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
              <button type="button" onClick={handleCreate} disabled={creating || !form.packageName} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Package'}
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
                <input id="editPkg" type="text" value={editItem.package_name || ''} onChange={e => setEditItem((f: any) => ({ ...f, package_name: e.target.value }))} placeholder="e.g. M&E Installation" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div>
                <label htmlFor="editTrade" className="block text-gray-400 text-xs mb-1">Trade</label>
                <input id="editTrade" type="text" value={editItem.trade || ''} onChange={e => setEditItem((f: any) => ({ ...f, trade: e.target.value }))} placeholder="e.g. Electrical" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editContractor" className="block text-gray-400 text-xs mb-1">Contractor</label>
                  <input id="editContractor" type="text" value={editItem.contractor || ''} onChange={e => setEditItem((f: any) => ({ ...f, contractor: e.target.value }))} placeholder="Contractor name" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="editValue" className="block text-gray-400 text-xs mb-1">Contract Value (£)</label>
                  <input id="editValue" type="number" value={editItem.contract_value || ''} onChange={e => setEditItem((f: any) => ({ ...f, contract_value: e.target.value }))} placeholder="0.00" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
              </div>
              <div>
                <label htmlFor="editStatus" className="block text-gray-400 text-xs mb-1">Status</label>
                <select id="editStatus" value={editItem.status || 'tendering'} onChange={e => setEditItem((f: any) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
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
              <button type="button" onClick={handleUpdate} disabled={saving || !editItem.package_name} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
