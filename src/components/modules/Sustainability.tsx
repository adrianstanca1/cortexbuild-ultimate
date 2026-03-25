import { useState, useEffect } from 'react';
import { Plus, Search, Leaf, Cloud, Factory, Gauge, Trash2, X, Upload, Pencil, CheckSquare, Square } from 'lucide-react';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { sustainabilityApi, uploadFile } from '../../services/api';
import { toast } from 'sonner';

export default function Sustainability() {
  const [searchTerm, setSearchTerm] = useState('');
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [form, setForm] = useState({ metricType: '', project: '', period: '', actual: '', target: '', unit: 'kgCO2' });

  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} metric(s)?`)) return;
    try {
      await Promise.all(ids.map(id => sustainabilityApi.delete(id)));
      setMetrics(prev => prev.filter((m: any) => !ids.includes(String(m.id))));
      toast.success(`Deleted ${ids.length} metric(s)`);
      clearSelection();
    } catch {
      toast.error('Bulk delete failed');
    }
  }

  useEffect(() => {
    sustainabilityApi.getAll().then((data: any[]) => {
      setMetrics(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = metrics.filter((m: any) =>
    (m.metric_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.project || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCarbon = metrics.filter((m: any) => m.metric_type?.toLowerCase().includes('carbon')).reduce((acc: number, m: any) => acc + Number(m.actual || 0), 0);
  const totalEnergy = metrics.filter((m: any) => m.metric_type?.toLowerCase().includes('energy')).reduce((acc: number, m: any) => acc + Number(m.actual || 0), 0);

  const handleCreate = async () => {
    if (!form.metricType) return;
    setCreating(true);
    try {
      const newRecord = {
        metric_type: form.metricType,
        project: form.project || '',
        period: form.period || '',
        actual: parseFloat(form.actual) || 0,
        target: parseFloat(form.target) || 0,
        unit: form.unit,
      };
      const created = await sustainabilityApi.create(newRecord);
      setMetrics(prev => [created, ...prev]);
      setShowCreateModal(false);
      setForm({ metricType: '', project: '', period: '', actual: '', target: '', unit: 'kgCO2' });
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
      const updated = await sustainabilityApi.update(editItem.id, {
        metric_type: editItem.metric_type,
        project: editItem.project || '',
        period: editItem.period || '',
        actual: parseFloat(editItem.actual) || 0,
        target: parseFloat(editItem.target) || 0,
        unit: editItem.unit,
      });
      setMetrics(prev => prev.map((m: any) => String(m.id) === String(editItem.id) ? updated : m));
      setEditItem(null);
    } catch (err) {
      console.error('Failed to update:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this metric?')) return;
    try {
      await sustainabilityApi.delete(id);
      setMetrics(prev => prev.filter((m: any) => String(m.id) !== String(id)));
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
          <h2 className="text-2xl font-bold text-white">Sustainability & ESG</h2>
          <p className="text-gray-400 text-sm mt-1">Track carbon emissions, energy and environmental metrics</p>
        </div>
        <button type="button" onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> Log Metrics
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Cloud className="text-green-400" size={20} /></div>
            <div><p className="text-gray-400 text-xs">Carbon Reduction</p><p className="text-2xl font-bold text-green-400">{loading ? '...' : `${totalCarbon}%`}</p></div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><Factory className="text-amber-400" size={20} /></div>
            <div><p className="text-gray-400 text-xs">Energy Used</p><p className="text-2xl font-bold text-amber-400">{loading ? '...' : `${totalEnergy.toLocaleString()} kWh`}</p></div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Gauge className="text-blue-400" size={20} /></div>
            <div><p className="text-gray-400 text-xs">BREEAM Score</p><p className="text-2xl font-bold text-blue-400">68/90</p></div>
          </div>
        </div>
      </div>
      <div className="card p-4">
        <input type="text" placeholder="Search metrics..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4" />
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading sustainability data...</div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No metrics found</div>
            ) : filtered.map((d) => {
              const isSelected = selectedIds.has(String(d.id));
              return (
              <div key={d.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                <button type="button" onClick={e => { e.stopPropagation(); toggle(String(d.id)); }}>
                  {isSelected ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
                </button>
                <div>
                  <h3 className="text-white font-medium">{d.metric_type || 'Metric'}</h3>
                  <p className="text-gray-400 text-sm">{d.project || 'All Projects'} - {d.period || 'Q1 2026'}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="text-lg font-bold text-white">{d.actual || 0} {d.unit || ''}</p>
                    <p className="text-gray-400 text-xs">Target: {d.target || 0}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditItem(d)}
                    className="p-2 hover:bg-blue-900/30 rounded"
                    title="Edit"
                  >
                    <Pencil size={16} className="text-blue-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(String(d.id))}
                    className="p-2 hover:bg-red-900/30 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                  <input
                    type="file"
                    id={`upload-sust-${d.id}`}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadDoc(String(d.id), file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById(`upload-sust-${d.id}`)?.click()}
                    disabled={uploading === String(d.id)}
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
              <h3 className="text-xl font-bold text-white">Log Sustainability Metric</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="sustType" className="block text-gray-400 text-xs mb-1">Metric Type *</label>
                <select id="sustType" value={form.metricType} onChange={e => setForm(f => ({ ...f, metricType: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                  <option value="">Select type...</option>
                  <option value="Carbon Emissions">Carbon Emissions</option>
                  <option value="Energy Consumption">Energy Consumption</option>
                  <option value="Water Usage">Water Usage</option>
                  <option value="Waste Recycled">Waste Recycled</option>
                  <option value="Renewable Energy">Renewable Energy</option>
                </select>
              </div>
              <div>
                <label htmlFor="sustProject" className="block text-gray-400 text-xs mb-1">Project</label>
                <input id="sustProject" type="text" value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} placeholder="Project name" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sustPeriod" className="block text-gray-400 text-xs mb-1">Period</label>
                  <input id="sustPeriod" type="text" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} placeholder="e.g. Q1 2026" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="sustUnit" className="block text-gray-400 text-xs mb-1">Unit</label>
                  <select id="sustUnit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="kgCO2">kgCO2</option>
                    <option value="kWh">kWh</option>
                    <option value="m3">m3</option>
                    <option value="tonnes">tonnes</option>
                    <option value="%">%</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sustActual" className="block text-gray-400 text-xs mb-1">Actual Value</label>
                  <input id="sustActual" type="number" value={form.actual} onChange={e => setForm(f => ({ ...f, actual: e.target.value }))} placeholder="0" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="sustTarget" className="block text-gray-400 text-xs mb-1">Target</label>
                  <input id="sustTarget" type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} placeholder="0" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleCreate} disabled={creating || !form.metricType} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {creating ? 'Creating...' : 'Log Metric'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Edit Sustainability Metric</h3>
              <button type="button" onClick={() => setEditItem(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="editSustType" className="block text-gray-400 text-xs mb-1">Metric Type *</label>
                <select id="editSustType" value={editItem.metric_type || ''} onChange={e => setEditItem((prev: any) => ({ ...prev, metric_type: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                  <option value="">Select type...</option>
                  <option value="Carbon Emissions">Carbon Emissions</option>
                  <option value="Energy Consumption">Energy Consumption</option>
                  <option value="Water Usage">Water Usage</option>
                  <option value="Waste Recycled">Waste Recycled</option>
                  <option value="Renewable Energy">Renewable Energy</option>
                </select>
              </div>
              <div>
                <label htmlFor="editSustProject" className="block text-gray-400 text-xs mb-1">Project</label>
                <input id="editSustProject" type="text" value={editItem.project || ''} onChange={e => setEditItem((prev: any) => ({ ...prev, project: e.target.value }))} placeholder="Project name" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editSustPeriod" className="block text-gray-400 text-xs mb-1">Period</label>
                  <input id="editSustPeriod" type="text" value={editItem.period || ''} onChange={e => setEditItem((prev: any) => ({ ...prev, period: e.target.value }))} placeholder="e.g. Q1 2026" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="editSustUnit" className="block text-gray-400 text-xs mb-1">Unit</label>
                  <select id="editSustUnit" value={editItem.unit || 'kgCO2'} onChange={e => setEditItem((prev: any) => ({ ...prev, unit: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="kgCO2">kgCO2</option>
                    <option value="kWh">kWh</option>
                    <option value="m3">m3</option>
                    <option value="tonnes">tonnes</option>
                    <option value="%">%</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editSustActual" className="block text-gray-400 text-xs mb-1">Actual Value</label>
                  <input id="editSustActual" type="number" value={editItem.actual || ''} onChange={e => setEditItem((prev: any) => ({ ...prev, actual: e.target.value }))} placeholder="0" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="editSustTarget" className="block text-gray-400 text-xs mb-1">Target</label>
                  <input id="editSustTarget" type="number" value={editItem.target || ''} onChange={e => setEditItem((prev: any) => ({ ...prev, target: e.target.value }))} placeholder="0" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleUpdate} disabled={saving || !editItem.metric_type} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
