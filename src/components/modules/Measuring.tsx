/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Plus, Ruler, MapPin, FileText, Trash2, X, Upload, Pencil } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { uploadFile } from '../../services/api';
import { toast } from 'sonner';
import { useMeasuring } from '../../hooks/useData';

export default function Measuring() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState({ location: '', surveyType: '', surveyor: '', surveyDate: '', totalArea: '', unit: 'm²', status: 'pending' });

  const { data: measurements = [] } = useMeasuring.useList();
  const typedMeasurements = measurements as unknown as any[];
  const createMutation = useMeasuring.useCreate();
  const updateMutation = useMeasuring.useUpdate();
  const deleteMutation = useMeasuring.useDelete();

  const filtered = typedMeasurements.filter((m: any) =>
    (m.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.survey_type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedCount = typedMeasurements.filter((m: any) => m.status === 'completed').length;
  const pendingCount = typedMeasurements.filter((m: any) => m.status === 'pending' || m.status === 'scheduled').length;

  const handleCreate = async () => {
    if (!form.location) return;
    await createMutation.mutateAsync({
      data: {
        location: form.location,
        survey_type: form.surveyType || '',
        surveyor: form.surveyor || '',
        survey_date: form.surveyDate || null,
        total_area: parseFloat(form.totalArea) || 0,
        unit: form.unit,
        status: form.status,
      },
    });
    setShowCreateModal(false);
    setForm({ location: '', surveyType: '', surveyor: '', surveyDate: '', totalArea: '', unit: 'm²', status: 'pending' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this measurement?')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      toast.error(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !editItem.id) return;
    await updateMutation.mutateAsync({
      id: editItem.id,
      data: {
        location: editItem.location,
        survey_type: editItem.surveyType || '',
        surveyor: editItem.surveyor || '',
        survey_date: editItem.surveyDate || null,
        total_area: parseFloat(editItem.totalArea) || 0,
        unit: editItem.unit,
        status: editItem.status,
      },
    });
    setEditItem(null);
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
      <ModuleBreadcrumbs currentModule="measuring" onNavigate={() => {}} />
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Site Measuring & Surveys</h2>
          <p className="text-gray-400 text-sm mt-1">Record site measurements, surveys and as-built data</p>
        </div>
        <button type="button" onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> New Measurement
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Ruler className="text-blue-400" size={20} /></div><div><p className="text-gray-400 text-xs">Total Surveys</p><p className="text-2xl font-bold text-white">{typedMeasurements.length}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><FileText className="text-green-400" size={20} /></div><div><p className="text-gray-400 text-xs">Completed</p><p className="text-2xl font-bold text-green-400">{completedCount}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><MapPin className="text-amber-400" size={20} /></div><div><p className="text-gray-400 text-xs">Pending</p><p className="text-2xl font-bold text-amber-400">{pendingCount}</p></div></div></div>
      </div>
      <div className="card p-4">
        <input type="text" placeholder="Search measurements..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 input input-bordered text-white mb-4" />
        {typedMeasurements.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Loading measurements...</div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <EmptyState
                icon={Ruler}
                title="No measurements found"
                description="Add measurements to track quantities and survey data."
                variant="default"
              />
            ) : filtered.map((m) => (
              <div key={m.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{m.location || 'Location TBC'}</h3>
                  <p className="text-gray-400 text-sm">{m.survey_type || 'Survey'} - Surveyor: {m.surveyor || 'TBC'}</p>
                  <p className="text-gray-500 text-xs">Date: {m.survey_date || 'TBD'}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <span className={`px-2 py-1 rounded text-xs ${m.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>{m.status || 'unknown'}</span>
                    <p className="text-white font-medium mt-1">{m.total_area || 0} {m.unit || 'm²'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(String(m.id))}
                    className="p-2 hover:bg-red-900/30 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditItem({
                      id: m.id,
                      location: m.location || '',
                      surveyType: m.survey_type || '',
                      surveyor: m.surveyor || '',
                      surveyDate: m.survey_date || '',
                      totalArea: String(m.total_area || ''),
                      unit: m.unit || 'm²',
                      status: m.status || 'pending',
                    })}
                    className="p-2 hover:bg-blue-900/30 rounded"
                    title="Edit"
                  >
                    <Pencil size={16} className="text-blue-400" />
                  </button>
                  <input
                    type="file"
                    id={`upload-meas-${m.id}`}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadDoc(String(m.id), file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById(`upload-meas-${m.id}`)?.click()}
                    disabled={uploading === String(m.id)}
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
              <h3 className="text-xl font-bold text-white">New Measurement</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="measLoc" className="block text-gray-400 text-xs mb-1">Location *</label>
                <input id="measLoc" type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Building A - Level 2" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="measType" className="block text-gray-400 text-xs mb-1">Survey Type</label>
                  <select id="measType" value={form.surveyType} onChange={e => setForm(f => ({ ...f, surveyType: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                    <option value="">Select type...</option>
                    <option value="Area Survey">Area Survey</option>
                    <option value="Level Survey">Level Survey</option>
                    <option value="As-Built">As-Built</option>
                    <option value="Setting Out">Setting Out</option>
                    <option value="Topographic">Topographic</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="measSurveyor" className="block text-gray-400 text-xs mb-1">Surveyor</label>
                  <input id="measSurveyor" type="text" value={form.surveyor} onChange={e => setForm(f => ({ ...f, surveyor: e.target.value }))} placeholder="Surveyor name" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="measDate" className="block text-gray-400 text-xs mb-1">Survey Date</label>
                  <input id="measDate" type="date" value={form.surveyDate} onChange={e => setForm(f => ({ ...f, surveyDate: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white" />
                </div>
                <div>
                  <label htmlFor="measStatus" className="block text-gray-400 text-xs mb-1">Status</label>
                  <select id="measStatus" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="measArea" className="block text-gray-400 text-xs mb-1">Total Area</label>
                  <input id="measArea" type="number" value={form.totalArea} onChange={e => setForm(f => ({ ...f, totalArea: e.target.value }))} placeholder="0.00" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="measUnit" className="block text-gray-400 text-xs mb-1">Unit</label>
                  <select id="measUnit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                    <option value="m²">m²</option>
                    <option value="m³">m³</option>
                    <option value="lin m">lin m</option>
                    <option value="items">items</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleCreate} disabled={createMutation.isPending || !form.location} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {createMutation.isPending ? 'Creating...' : 'Create Measurement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Edit Measurement</h3>
              <button type="button" onClick={() => setEditItem(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="editMeasLoc" className="block text-gray-400 text-xs mb-1">Location *</label>
                <input id="editMeasLoc" type="text" value={editItem.location} onChange={e => setEditItem(item => item ? { ...item, location: e.target.value } : null)} placeholder="e.g. Building A - Level 2" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editMeasType" className="block text-gray-400 text-xs mb-1">Survey Type</label>
                  <select id="editMeasType" value={editItem.surveyType} onChange={e => setEditItem(item => item ? { ...item, surveyType: e.target.value } : null)} className="w-full px-3 py-2 input input-bordered text-white">
                    <option value="">Select type...</option>
                    <option value="Area Survey">Area Survey</option>
                    <option value="Level Survey">Level Survey</option>
                    <option value="As-Built">As-Built</option>
                    <option value="Setting Out">Setting Out</option>
                    <option value="Topographic">Topographic</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="editMeasSurveyor" className="block text-gray-400 text-xs mb-1">Surveyor</label>
                  <input id="editMeasSurveyor" type="text" value={editItem.surveyor} onChange={e => setEditItem(item => item ? { ...item, surveyor: e.target.value } : null)} placeholder="Surveyor name" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editMeasDate" className="block text-gray-400 text-xs mb-1">Survey Date</label>
                  <input id="editMeasDate" type="date" value={editItem.surveyDate} onChange={e => setEditItem(item => item ? { ...item, surveyDate: e.target.value } : null)} className="w-full px-3 py-2 input input-bordered text-white" />
                </div>
                <div>
                  <label htmlFor="editMeasStatus" className="block text-gray-400 text-xs mb-1">Status</label>
                  <select id="editMeasStatus" value={editItem.status} onChange={e => setEditItem(item => item ? { ...item, status: e.target.value } : null)} className="w-full px-3 py-2 input input-bordered text-white">
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editMeasArea" className="block text-gray-400 text-xs mb-1">Total Area</label>
                  <input id="editMeasArea" type="number" value={editItem.totalArea} onChange={e => setEditItem(item => item ? { ...item, totalArea: e.target.value } : null)} placeholder="0.00" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="editMeasUnit" className="block text-gray-400 text-xs mb-1">Unit</label>
                  <select id="editMeasUnit" value={editItem.unit} onChange={e => setEditItem(item => item ? { ...item, unit: e.target.value } : null)} className="w-full px-3 py-2 input input-bordered text-white">
                    <option value="m²">m²</option>
                    <option value="m³">m³</option>
                    <option value="lin m">lin m</option>
                    <option value="items">items</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleUpdate} disabled={updateMutation.isPending || !editItem.location} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50">
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
