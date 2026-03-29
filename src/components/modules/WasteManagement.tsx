/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Plus, Leaf, Recycle, Trash2, X, Upload, Edit } from 'lucide-react';
import { wasteManagementApi, uploadFile } from '../../services/api';
import { toast } from 'sonner';
import { EmptyState } from '../ui/EmptyState';

export default function WasteManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [waste, setWaste] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [form, setForm] = useState({ wasteType: '', quantity: '', unit: 'tonnes', carrier: '', collectionDate: '', recyclingRate: '75', status: 'pending' });
  const [editItem, setEditItem] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    wasteManagementApi.getAll().then((data: any[]) => {
      setWaste(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = waste.filter((w: any) =>
    (w.waste_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.project || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRecycling = waste.reduce((acc: number, w: any) => {
    const qty = Number(w.quantity) || 0;
    const actualRecycled = Number(w.recycling_rate) || (w.status === 'collected' ? 75 : 0);
    return acc + (actualRecycled * qty / 100);
  }, 0);
  const totalWaste = waste.reduce((acc: number, w: any) => acc + Number(w.quantity || 0), 0);
  const recyclingRate = totalWaste > 0 ? Math.round(totalRecycling/totalWaste*100) : 0;

  const handleCreate = async () => {
    if (!form.wasteType) return;
    setCreating(true);
    try {
      const newRecord = {
        waste_type: form.wasteType,
        project: '',
        quantity: parseFloat(form.quantity) || 0,
        unit: form.unit,
        carrier: form.carrier || '',
        collection_date: form.collectionDate || null,
        recycling_rate: parseInt(form.recyclingRate) || 0,
        status: form.status,
      };
      const created = await wasteManagementApi.create(newRecord);
      setWaste(prev => [created, ...prev]);
      setShowCreateModal(false);
      setForm({ wasteType: '', quantity: '', unit: 'tonnes', carrier: '', collectionDate: '', recyclingRate: '75', status: 'pending' });
    } catch {
      console.error('Failed to create');
      toast.error('Failed to create waste record');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !editItem.id) return;
    setSaving(true);
    try {
      const updated = await wasteManagementApi.update(editItem.id, {
        waste_type: editItem.wasteType,
        quantity: parseFloat(editItem.quantity) || 0,
        unit: editItem.unit,
        carrier: editItem.carrier || '',
        collection_date: editItem.collectionDate || null,
        recycling_rate: parseInt(editItem.recyclingRate) || 0,
        status: editItem.status,
      });
      setWaste(prev => prev.map((w: any) => String(w.id) === String(editItem.id) ? updated : w));
      setEditItem(null);
      toast.success('Waste record updated');
    } catch {
      console.error('Failed to create');
      toast.error('Failed to update waste record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this waste record?')) return;
    try {
      await wasteManagementApi.delete(id);
      setWaste(prev => prev.filter((w: any) => String(w.id) !== String(id)));
    } catch {
      console.error('Failed to create');
    }
  };

  async function handleUploadDoc(id: string, file: File) {
    setUploading(id);
    try {
      await uploadFile(file, 'REPORTS');
      toast.success(`Uploaded: ${file.name}`);
    } catch {
      console.error('Upload failed');
      toast.error('Upload failed');
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Waste Management</h2>
          <p className="text-gray-400 text-sm mt-1">Track site waste, recycling and environmental compliance</p>
        </div>
        <button type="button" onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> Log Waste
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Recycle className="text-emerald-400" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Total Recycled</p>
              <p className="text-2xl font-bold text-emerald-400">{loading ? '...' : `${totalRecycling.toFixed(1)}t`}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Trash2 className="text-amber-400" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Total Waste</p>
              <p className="text-2xl font-bold text-amber-400">{loading ? '...' : `${totalWaste.toFixed(1)}t`}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Leaf className="text-green-400" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Recycling Rate</p>
              <p className="text-2xl font-bold text-green-400">{loading ? '...' : `${recyclingRate}%`}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <input
          type="text"
          placeholder="Search waste records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4"
        />
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading waste data...</div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <EmptyState icon={Leaf} title="No waste records found" description="Start tracking waste by creating a waste record." variant="default" />
            ) : filtered.map((w) => (
              <div key={w.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{w.waste_type || 'Waste'}</h3>
                  <p className="text-gray-400 text-sm">{w.quantity || 0} {w.unit || 'tonnes'} - {w.carrier || 'TBC'} - {w.collection_date || 'TBD'}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className={`text-lg font-bold ${w.status === 'collected' ? 'text-green-400' : 'text-amber-400'}`}>
                      {w.recycling_rate || 0}%
                    </p>
                    <p className="text-gray-400 text-xs">recycled</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(String(w.id))}
                    className="p-2 hover:bg-red-900/30 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditItem({ ...w, wasteType: w.waste_type, quantity: String(w.quantity), unit: w.unit || 'tonnes', carrier: w.carrier || '', collectionDate: w.collection_date || '', recyclingRate: String(w.recycling_rate || 75), status: w.status })}
                    className="p-2 hover:bg-gray-700 rounded"
                    title="Edit"
                  >
                    <Edit size={16} className="text-gray-400" />
                  </button>
                  <input
                    type="file"
                    id={`upload-waste-${w.id}`}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadDoc(String(w.id), file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById(`upload-waste-${w.id}`)?.click()}
                    disabled={uploading === String(w.id)}
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
              <h3 className="text-xl font-bold text-white">Log Waste</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="wmType" className="block text-gray-400 text-xs mb-1">Waste Type *</label>
                <select id="wmType" value={form.wasteType} onChange={e => setForm(f => ({ ...f, wasteType: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                  <option value="">Select type...</option>
                  <option value="Hardcore">Hardcore</option>
                  <option value="Concrete">Concrete</option>
                  <option value="Timber">Timber</option>
                  <option value="Metal">Metal</option>
                  <option value="Plasterboard">Plasterboard</option>
                  <option value="Mixed Construction">Mixed Construction</option>
                  <option value="Hazardous">Hazardous</option>
                  <option value="General Waste">General Waste</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="wmQty" className="block text-gray-400 text-xs mb-1">Quantity</label>
                  <input id="wmQty" type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0.00" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="wmUnit" className="block text-gray-400 text-xs mb-1">Unit</label>
                  <select id="wmUnit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="tonnes">Tonnes</option>
                    <option value="kg">Kilograms</option>
                    <option value="m3">Cubic Metres</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="wmCarrier" className="block text-gray-400 text-xs mb-1">Waste Carrier</label>
                <input id="wmCarrier" type="text" value={form.carrier} onChange={e => setForm(f => ({ ...f, carrier: e.target.value }))} placeholder="Carrier company name" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="wmDate" className="block text-gray-400 text-xs mb-1">Collection Date</label>
                  <input id="wmDate" type="date" value={form.collectionDate} onChange={e => setForm(f => ({ ...f, collectionDate: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                </div>
                <div>
                  <label htmlFor="wmRate" className="block text-gray-400 text-xs mb-1">Recycling Rate (%)</label>
                  <input id="wmRate" type="number" value={form.recyclingRate} onChange={e => setForm(f => ({ ...f, recyclingRate: e.target.value }))} placeholder="75" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
              </div>
              <div>
                <label htmlFor="wmStatus" className="block text-gray-400 text-xs mb-1">Status</label>
                <select id="wmStatus" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                  <option value="pending">Pending Collection</option>
                  <option value="collected">Collected</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleCreate} disabled={creating || !form.wasteType} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {creating ? 'Creating...' : 'Log Waste'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Edit Waste Record</h3>
              <button type="button" onClick={() => setEditItem(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="editWmType" className="block text-gray-400 text-xs mb-1">Waste Type *</label>
                <select id="editWmType" value={editItem.wasteType || ''} onChange={e => setEditItem((f: any) => ({ ...f, wasteType: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                  <option value="">Select type...</option>
                  <option value="Hardcore">Hardcore</option>
                  <option value="Concrete">Concrete</option>
                  <option value="Timber">Timber</option>
                  <option value="Metal">Metal</option>
                  <option value="Plasterboard">Plasterboard</option>
                  <option value="Mixed Construction">Mixed Construction</option>
                  <option value="Hazardous">Hazardous</option>
                  <option value="General Waste">General Waste</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editWmQty" className="block text-gray-400 text-xs mb-1">Quantity</label>
                  <input id="editWmQty" type="number" value={editItem.quantity || ''} onChange={e => setEditItem((f: any) => ({ ...f, quantity: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="editWmUnit" className="block text-gray-400 text-xs mb-1">Unit</label>
                  <select id="editWmUnit" value={editItem.unit || 'tonnes'} onChange={e => setEditItem((f: any) => ({ ...f, unit: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="tonnes">Tonnes</option>
                    <option value="kg">Kilograms</option>
                    <option value="m3">Cubic Metres</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="editWmCarrier" className="block text-gray-400 text-xs mb-1">Waste Carrier</label>
                <input id="editWmCarrier" type="text" value={editItem.carrier || ''} onChange={e => setEditItem((f: any) => ({ ...f, carrier: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editWmDate" className="block text-gray-400 text-xs mb-1">Collection Date</label>
                  <input id="editWmDate" type="date" value={editItem.collectionDate || ''} onChange={e => setEditItem((f: any) => ({ ...f, collectionDate: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                </div>
                <div>
                  <label htmlFor="editWmRate" className="block text-gray-400 text-xs mb-1">Recycling Rate (%)</label>
                  <input id="editWmRate" type="number" value={editItem.recyclingRate || '75'} onChange={e => setEditItem((f: any) => ({ ...f, recyclingRate: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
              </div>
              <div>
                <label htmlFor="editWmStatus" className="block text-gray-400 text-xs mb-1">Status</label>
                <select id="editWmStatus" value={editItem.status || 'pending'} onChange={e => setEditItem((f: any) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                  <option value="pending">Pending Collection</option>
                  <option value="collected">Collected</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleUpdate} disabled={saving || !editItem.wasteType} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
