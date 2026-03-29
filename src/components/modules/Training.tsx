import { useState, useEffect, useRef } from 'react';
import { Plus, GraduationCap, Award, Clock, AlertCircle, FileCheck, Trash2, X, Edit, CheckSquare, Square, Download } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { DataImporter, ExportButton } from '../ui/DataImportExport';
import { trainingApi, uploadFile } from '../../services/api';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { toast } from 'sonner';

export default function Training() {
  const [searchTerm, setSearchTerm] = useState('');
  const [training, setTraining] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', provider: '', type: '', status: 'scheduled', scheduledDate: '', completedDate: '', certification: '' });
  const [editItem, setEditItem] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} item(s)?`)) return;
    try {
      await Promise.all(ids.map(id => trainingApi.delete(id)));
      setTraining(prev => prev.filter((t: any) => !ids.includes(String(t.id))));
      toast.success(`Deleted ${ids.length} item(s)`);
      clearSelection();
    } catch {
      toast.error('Bulk delete failed');
    }
  }

  useEffect(() => {
    trainingApi.getAll().then((data: any[]) => {
      setTraining(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = training.filter((t: any) =>
    (t.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.provider || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validCount = training.filter((t: any) => t.status === 'completed' || t.status === 'certified').length;
  const expiringCount = training.filter((t: any) => t.status === 'scheduled').length;
  const totalCount = training.length;

  const handleCreate = async () => {
    if (!form.title) return;
    setCreating(true);
    try {
      const newRecord = {
        title: form.title,
        provider: form.provider || 'CortexBuild Training',
        type: form.type || 'General',
        status: form.status,
        scheduled_date: form.scheduledDate || null,
        completed_date: form.completedDate || null,
        certification: form.certification || '',
      };
      const created = await trainingApi.create(newRecord);
      setTraining(prev => [created, ...prev]);
      setShowCreateModal(false);
      setForm({ title: '', provider: '', type: '', status: 'scheduled', scheduledDate: '', completedDate: '', certification: '' });
    } catch {
      console.error('Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this training record?')) return;
    try {
      await trainingApi.delete(id);
      setTraining(prev => prev.filter((t: any) => String(t.id) !== String(id)));
    } catch {
      console.error('Failed to create');
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !editItem.title) return;
    setSaving(true);
    try {
      const updated = await trainingApi.update(editItem.id, {
        title: editItem.title,
        provider: editItem.provider,
        type: editItem.type,
        status: editItem.status,
        scheduled_date: editItem.scheduledDate || null,
        completed_date: editItem.completedDate || null,
        certification: editItem.certification,
      });
      setTraining(prev => prev.map((t: any) => String(t.id) === String(editItem.id) ? updated : t));
      setEditItem(null);
      toast.success('Training record updated');
    } catch {
      console.error('Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadCert = async (id: string, file: File) => {
    setUploading(true);
    setSelectedId(id);
    try {
      const result = await uploadFile(file, 'REPORTS');
      setTraining(prev => prev.map((t: any) => {
        if (String(t.id) === String(id)) {
          return { ...t, certification: file.name, certification_url: result.file_url || result.name };
        }
        return t;
      }));
    } catch {
      console.error('Upload failed');
    } finally {
      setUploading(false);
      setSelectedId(null);
    }
  };

  async function handleBulkImport(data: Record<string, unknown>[], mapping: any[]) {
    let failed = 0;
    for (const row of data) {
      const mapped: Record<string, unknown> = {};
      mapping.forEach(m => { if (m.target) mapped[m.target] = row[m.source]; });
      try {
        await trainingApi.create({
          title: String(mapped.title || ''),
          provider: String(mapped.provider || 'CortexBuild Training'),
          type: String(mapped.type || 'General'),
          status: String(mapped.status || 'scheduled'),
          scheduled_date: mapped.scheduled_date || null,
          completed_date: mapped.completed_date || null,
          certification: String(mapped.certification || ''),
        });
      } catch { failed++; }
    }
    if (failed > 0) toast.error(`${failed} row(s) failed to import`);
    toast.success(`${data.length - failed} training record(s) imported`);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Training & Certifications</h2>
          <p className="text-gray-400 text-sm mt-1">Track worker training records and qualifications</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowBulkImport(true)} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm font-medium">
            <Download size={16}/><span>Import</span>
          </button>
          <ExportButton data={training} filename="training" />
          <button type="button" onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
            <Plus size={18} /> Add Training Record
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Award className="text-green-400" size={20} /></div><div><p className="text-gray-400 text-xs">Completed</p><p className="text-2xl font-bold text-green-400">{loading ? '...' : validCount}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><AlertCircle className="text-amber-400" size={20} /></div><div><p className="text-gray-400 text-xs">Scheduled</p><p className="text-2xl font-bold text-amber-400">{loading ? '...' : expiringCount}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><GraduationCap className="text-blue-400" size={20} /></div><div><p className="text-gray-400 text-xs">Total Records</p><p className="text-2xl font-bold text-blue-400">{loading ? '...' : totalCount}</p></div></div></div>
      </div>
      <div className="card p-4">
        <input type="text" placeholder="Search training records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4" />
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading training data...</div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No training records found"
                description="Add training records to track workforce qualifications and certifications."
                variant="safety"
              />
            ) : filtered.map((t) => {
              const isSelected = selectedIds.has(String(t.id));
              return (
              <div key={t.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => toggle(String(t.id))}>
                    {isSelected ? <CheckSquare size={18} className="text-blue-400"/> : <Square size={18} className="text-gray-500"/>}
                  </button>
                </div>
                <div>
                  <h3 className="text-white font-medium">{t.title || 'Training'}</h3>
                  <p className="text-gray-400 text-sm">{t.provider || 'Provider TBC'} - {t.type || 'General'}</p>
                  <p className="text-gray-500 text-xs">Completed: {t.completed_date || t.scheduled_date || 'TBD'}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <span className={`px-2 py-1 rounded text-xs ${t.status === 'completed' ? 'bg-green-500/10 text-green-400' : t.status === 'scheduled' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-500/10 text-gray-400'}`}>{t.status || 'unknown'}</span>
                    <p className="text-gray-400 text-xs mt-1">Cert: {t.certification || 'Upload cert'}</p>
                  </div>
                  <input
                    type="file"
                    id={`upload-cert-${t.id}`}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        await handleUploadCert(String(t.id), file);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById(`upload-cert-${t.id}`)?.click()}
                    disabled={uploading && selectedId === String(t.id)}
                    className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-50"
                    title="Upload certificate"
                  >
                    {uploading && selectedId === String(t.id) ? <Clock size={16} className="animate-spin" /> : <FileCheck size={16} />}
                  </button>
                  <button type="button" onClick={() => setEditItem({ ...t, scheduledDate: t.scheduled_date || '', completedDate: t.completed_date || '' })} className="p-2 hover:bg-gray-700 rounded"><Edit size={16} className="text-gray-400" /></button>
                  <button
                    type="button"
                    onClick={() => handleDelete(String(t.id))}
                    className="p-2 hover:bg-red-900/30 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-400" />
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
              <h3 className="text-xl font-bold text-white">Add Training Record</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-xs mb-1">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. CSCS Health & Safety" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Provider</label>
                <input type="text" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} placeholder="e.g. CITB" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="">Select type...</option>
                    <option value="Health & Safety">Health & Safety</option>
                    <option value="Technical">Technical</option>
                    <option value="Management">Management</option>
                    <option value="Compliance">Compliance</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Scheduled Date</label>
                  <input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Completed Date</label>
                  <input type="date" value={form.completedDate} onChange={e => setForm(f => ({ ...f, completedDate: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Certification Reference</label>
                <input type="text" value={form.certification} onChange={e => setForm(f => ({ ...f, certification: e.target.value }))} placeholder="e.g. CSCS-123456" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleCreate} disabled={creating || !form.title} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {creating ? 'Creating...' : 'Add Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Edit Training Record</h3>
              <button type="button" onClick={() => setEditItem(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-xs mb-1">Title *</label>
                <input type="text" value={editItem.title} onChange={e => setEditItem(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Provider</label>
                <input type="text" value={editItem.provider} onChange={e => setEditItem(f => ({ ...f, provider: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Type</label>
                  <select value={editItem.type} onChange={e => setEditItem(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="">Select type...</option>
                    <option value="Health & Safety">Health & Safety</option>
                    <option value="Technical">Technical</option>
                    <option value="Management">Management</option>
                    <option value="Compliance">Compliance</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Status</label>
                  <select value={editItem.status} onChange={e => setEditItem(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Scheduled Date</label>
                  <input type="date" value={editItem.scheduledDate} onChange={e => setEditItem(f => ({ ...f, scheduledDate: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Completed Date</label>
                  <input type="date" value={editItem.completedDate} onChange={e => setEditItem(f => ({ ...f, completedDate: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Certification Reference</label>
                <input type="text" value={editItem.certification} onChange={e => setEditItem(f => ({ ...f, certification: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleUpdate} disabled={saving || !editItem.title} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
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
                exampleData={{ title: '', provider: '', date: '', expiry_date: '', status: '', notes: '' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
