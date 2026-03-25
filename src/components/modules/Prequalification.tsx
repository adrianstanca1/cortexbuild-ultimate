import { useState, useEffect } from 'react';
import { Plus, Search, Users, FileCheck, Clock, AlertTriangle, Trash2, X, Upload, Edit } from 'lucide-react';
import { prequalificationApi, uploadFile } from '../../services/api';
import { toast } from 'sonner';

export default function Prequalification() {
  const [searchTerm, setSearchTerm] = useState('');
  const [prequal, setPrequal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [form, setForm] = useState({ contractor: '', project: '', questionnaireType: 'PAS 91', status: 'pending', score: '' });

  useEffect(() => {
    prequalificationApi.getAll().then((data: any[]) => {
      setPrequal(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = prequal.filter((p: any) =>
    (p.contractor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.project || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const approvedCount = prequal.filter((p: any) => p.status === 'approved').length;
  const pendingCount = prequal.filter((p: any) => p.status === 'pending').length;

  const handleCreate = async () => {
    if (!form.contractor) return;
    setCreating(true);
    try {
      const newRecord = {
        contractor: form.contractor,
        project: form.project || '',
        questionnaire_type: form.questionnaireType,
        status: form.status,
        score: parseInt(form.score) || 0,
      };
      const created = await prequalificationApi.create(newRecord);
      setPrequal(prev => [created, ...prev]);
      setShowCreateModal(false);
      setForm({ contractor: '', project: '', questionnaireType: 'PAS 91', status: 'pending', score: '' });
    } catch (err) {
      console.error('Failed to create:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prequalification record?')) return;
    try {
      await prequalificationApi.delete(id);
      setPrequal(prev => prev.filter((p: any) => String(p.id) !== String(id)));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !editItem.id) return;
    setSaving(true);
    try {
      const updated = {
        contractor: editItem.contractor,
        project: editItem.project || '',
        questionnaire_type: editItem.questionnaire_type,
        status: editItem.status,
        score: parseInt(editItem.score) || 0,
      };
      const result = await prequalificationApi.update(editItem.id, updated);
      setPrequal(prev => prev.map((p: any) => String(p.id) === String(editItem.id) ? result : p));
      setEditItem(null);
    } catch (err) {
      console.error('Failed to update:', err);
    } finally {
      setSaving(false);
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
          <h2 className="text-2xl font-bold text-white">Prequalification</h2>
          <p className="text-gray-400 text-sm mt-1">Manage contractor prequalification questionnaires</p>
        </div>
        <button type="button" onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> Send PQQ
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><FileCheck className="text-green-400" size={20} /></div><div><p className="text-gray-400 text-xs">Approved</p><p className="text-2xl font-bold text-green-400">{loading ? '...' : approvedCount}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><Clock className="text-amber-400" size={20} /></div><div><p className="text-gray-400 text-xs">Pending</p><p className="text-2xl font-bold text-amber-400">{loading ? '...' : pendingCount}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Users className="text-blue-400" size={20} /></div><div><p className="text-gray-400 text-xs">Total</p><p className="text-2xl font-bold text-blue-400">{loading ? '...' : prequal.length}</p></div></div></div>
      </div>
      <div className="card p-4">
        <input type="text" placeholder="Search contractors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4" />
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading prequalification data...</div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No prequalification records found</div>
            ) : filtered.map((p) => (
              <div key={p.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{p.contractor || 'Contractor'}</h3>
                  <p className="text-gray-400 text-sm">{p.questionnaire_type || 'PAS 91'} - {p.project || 'All Projects'}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <span className={`px-2 py-1 rounded text-xs ${p.status === 'approved' ? 'bg-green-500/10 text-green-400' : p.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-500/10 text-gray-400'}`}>{p.status || 'unknown'}</span>
                    {p.score > 0 && <p className="text-gray-400 text-xs mt-1">Score: {p.score}%</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(String(p.id))}
                    className="p-2 hover:bg-red-900/30 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditItem({ ...p, questionnaire_type: p.questionnaire_type || p.questionnaireType, score: p.score || '' })}
                    className="p-2 hover:bg-blue-900/30 rounded"
                    title="Edit"
                  >
                    <Edit size={16} className="text-blue-400" />
                  </button>
                  <input
                    type="file"
                    id={`upload-preq-${p.id}`}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadDoc(String(p.id), file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById(`upload-preq-${p.id}`)?.click()}
                    disabled={uploading === String(p.id)}
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
              <h3 className="text-xl font-bold text-white">Send PQQ</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="preqContractor" className="block text-gray-400 text-xs mb-1">Contractor *</label>
                <input id="preqContractor" type="text" value={form.contractor} onChange={e => setForm(f => ({ ...f, contractor: e.target.value }))} placeholder="Contractor name" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div>
                <label htmlFor="preqProject" className="block text-gray-400 text-xs mb-1">Project</label>
                <input id="preqProject" type="text" value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} placeholder="Project name" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="preqType" className="block text-gray-400 text-xs mb-1">Questionnaire Type</label>
                  <select id="preqType" value={form.questionnaireType} onChange={e => setForm(f => ({ ...f, questionnaireType: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="PAS 91">PAS 91</option>
                    <option value="SHE Q">SHE Q</option>
                    <option value="Financial">Financial</option>
                    <option value="Technical">Technical</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="preqStatus" className="block text-gray-400 text-xs mb-1">Status</label>
                  <select id="preqStatus" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="preqScore" className="block text-gray-400 text-xs mb-1">Score (%)</label>
                <input id="preqScore" type="number" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} placeholder="0" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleCreate} disabled={creating || !form.contractor} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {creating ? 'Creating...' : 'Send PQQ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Edit PQQ</h3>
              <button type="button" onClick={() => setEditItem(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="editContractor" className="block text-gray-400 text-xs mb-1">Contractor *</label>
                <input id="editContractor" type="text" value={editItem.contractor || ''} onChange={e => setEditItem((prev: any) => ({ ...prev, contractor: e.target.value }))} placeholder="Contractor name" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div>
                <label htmlFor="editProject" className="block text-gray-400 text-xs mb-1">Project</label>
                <input id="editProject" type="text" value={editItem.project || ''} onChange={e => setEditItem((prev: any) => ({ ...prev, project: e.target.value }))} placeholder="Project name" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editType" className="block text-gray-400 text-xs mb-1">Questionnaire Type</label>
                  <select id="editType" value={editItem.questionnaire_type || 'PAS 91'} onChange={e => setEditItem((prev: any) => ({ ...prev, questionnaire_type: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="PAS 91">PAS 91</option>
                    <option value="SHE Q">SHE Q</option>
                    <option value="Financial">Financial</option>
                    <option value="Technical">Technical</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="editStatus" className="block text-gray-400 text-xs mb-1">Status</label>
                  <select id="editStatus" value={editItem.status || 'pending'} onChange={e => setEditItem((prev: any) => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="editScore" className="block text-gray-400 text-xs mb-1">Score (%)</label>
                <input id="editScore" type="number" value={editItem.score || ''} onChange={e => setEditItem((prev: any) => ({ ...prev, score: e.target.value }))} placeholder="0" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleUpdate} disabled={saving || !editItem.contractor} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
