/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Plus, Shield, FileCheck, Clock, AlertTriangle, FileText, Upload, Trash2, X, Edit, CheckSquare, Square } from 'lucide-react';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { EmptyState } from '../ui/EmptyState';
import { useCertifications } from '../../hooks/useData';
import { uploadFile } from '../../services/api';
import { toast } from 'sonner';

export default function Certifications() {
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ certificationType: '', company: '', body: '', accreditationNumber: '', grade: '', expiryDate: '', status: 'active' });
  const [editItem, setEditItem] = useState<Record<string, any> | null>(null);

  const { useList, useCreate, useUpdate, useDelete } = useCertifications;
  const { data: certs = [], isLoading } = useList();
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} certification(s)?`)) return;
    try {
      await Promise.all(ids.map(id => deleteMutation.mutateAsync(String(id))));
      toast.success(`Deleted ${ids.length} certification(s)`);
      clearSelection();
    } catch {
      toast.error('Bulk delete failed');
    }
  }

  const filtered = (certs as any[]).filter(c =>
    (c.certification_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validCount = (certs as any[]).filter(c => c.status === 'active' || c.status === 'valid').length;
  const expiringCount = (certs as any[]).filter(c => {
    if (!c.expiry_date) return false;
    const daysUntil = (new Date(c.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntil > 0 && daysUntil <= 90;
  }).length;

  const handleCreate = async () => {
    if (!form.certificationType) return;
    try {
      await createMutation.mutateAsync({
        certification_type: form.certificationType,
        company: form.company || 'CortexBuild Ltd',
        body: form.body || '',
        accreditation_number: form.accreditationNumber || '',
        grade: form.grade || '',
        expiry_date: form.expiryDate || null,
        status: form.status,
      });
      toast.success('Certification created');
      setShowCreateModal(false);
      setForm({ certificationType: '', company: '', body: '', accreditationNumber: '', grade: '', expiryDate: '', status: 'active' });
    } catch {
      toast.error('Failed to create certification');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this certification?')) return;
    try {
      await deleteMutation.mutateAsync(String(id));
      toast.success('Certification deleted');
    } catch {
      toast.error('Failed to delete certification');
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !editItem.certificationType) return;
    try {
      await updateMutation.mutateAsync({
        id: editItem.id,
        data: {
          certification_type: editItem.certificationType,
          company: editItem.company,
          body: editItem.body,
          accreditation_number: editItem.accreditationNumber,
          grade: editItem.grade,
          expiry_date: editItem.expiryDate || null,
          status: editItem.status,
        },
      });
      toast.success('Certification updated');
      setEditItem(null);
    } catch {
      toast.error('Failed to update certification');
    }
  };

  const handleUpload = async (certId: string, file: File) => {
    setUploading(certId);
    try {
      const result = await uploadFile(file, 'REPORTS');
      const cert = (certs as any[]).find(c => String(c.id) === String(certId));
      if (cert) {
        await updateMutation.mutateAsync({
          id: String(certId),
          data: { ...cert, document_url: result.file_url || result.name, document_name: file.name },
        });
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(null);
    }
  };

  return (
    <>
      <ModuleBreadcrumbs currentModule="certifications" onNavigate={() => {}} />
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Certifications & Licenses</h2>
          <p className="text-gray-400 text-sm mt-1">Manage company certifications, accreditations and licenses</p>
        </div>
        <button type="button" onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> Add Certification
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><FileCheck className="text-green-400" size={20} /></div><div><p className="text-gray-400 text-xs">Active</p><p className="text-2xl font-bold text-green-400">{isLoading ? '...' : validCount}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><AlertTriangle className="text-amber-400" size={20} /></div><div><p className="text-gray-400 text-xs">Expiring Soon</p><p className="text-2xl font-bold text-amber-400">{isLoading ? '...' : expiringCount}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Shield className="text-blue-400" size={20} /></div><div><p className="text-gray-400 text-xs">Total</p><p className="text-2xl font-bold text-blue-400">{isLoading ? '...' : certs.length}</p></div></div></div>
      </div>
      <div className="card p-4">
        <input type="text" placeholder="Search certifications..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4" />
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Loading certifications...</div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No certifications found"
                description="Add certifications and licences to keep your workforce compliant."
              />
            ) : filtered.map((c) => {
              const isSelected = selectedIds.has(String(c.id));
              return (
              <div key={c.id} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <button type="button" onClick={e => { e.stopPropagation(); toggle(String(c.id)); }}>
                    {isSelected ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
                  </button>
                  <div>
                    <h3 className="text-white font-medium">{c.certification_type || 'Certification'}</h3>
                    <p className="text-gray-400 text-sm">{c.company || 'CortexBuild Ltd'} - {c.body || 'Body'}</p>
                    <p className="text-gray-500 text-xs">Grade: {c.grade || 'N/A'} | Accreditation: {c.accreditation_number || 'N/A'}</p>
                    {c.document_name && (
                      <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                        <FileText size={12} /> {c.document_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs ${c.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>{c.status || 'unknown'}</span>
                      <p className="text-gray-400 text-xs mt-1">Expires: {c.expiry_date || 'N/A'}</p>
                    </div>
                    <input
                      type="file"
                      id={`upload-cert-${c.id}`}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleUpload(String(c.id), file);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById(`upload-cert-${c.id}`)?.click()}
                      disabled={uploading === String(c.id)}
                      className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-50"
                      title="Upload certification document"
                    >
                      {uploading === String(c.id) ? <Clock size={16} className="animate-spin" /> : <Upload size={16} />}
                    </button>
                    <button type="button" onClick={() => setEditItem({ ...c, certificationType: c.certification_type, accreditationNumber: c.accreditation_number, expiryDate: c.expiry_date || '' })} className="p-2 hover:bg-gray-700 rounded"><Edit size={16} className="text-gray-400" /></button>
                    <button
                      type="button"
                      onClick={() => handleDelete(String(c.id))}
                      className="p-2 hover:bg-red-900/30 rounded"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
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
              <h3 className="text-xl font-bold text-white">Add Certification</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="certType" className="block text-gray-400 text-xs mb-1">Certification Type *</label>
                <input id="certType" type="text" value={form.certificationType} onChange={e => setForm(f => ({ ...f, certificationType: e.target.value }))} placeholder="e.g. ISO 9001" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div>
                <label htmlFor="certCompany" className="block text-gray-400 text-xs mb-1">Company</label>
                <input id="certCompany" type="text" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Company name" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="certBody" className="block text-gray-400 text-xs mb-1">Issuing Body</label>
                  <input id="certBody" type="text" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="e.g. BSI" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="certGrade" className="block text-gray-400 text-xs mb-1">Grade</label>
                  <input id="certGrade" type="text" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} placeholder="e.g. A" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
              </div>
              <div>
                <label htmlFor="certAccred" className="block text-gray-400 text-xs mb-1">Accreditation Number</label>
                <input id="certAccred" type="text" value={form.accreditationNumber} onChange={e => setForm(f => ({ ...f, accreditationNumber: e.target.value }))} placeholder="e.g. ABC-12345" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="certExpiry" className="block text-gray-400 text-xs mb-1">Expiry Date</label>
                  <input id="certExpiry" type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                </div>
                <div>
                  <label htmlFor="certStatus" className="block text-gray-400 text-xs mb-1">Status</label>
                  <select id="certStatus" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="expired">Expired</option>
                    <option value="revoked">Revoked</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleCreate} disabled={createMutation.isPending || !form.certificationType} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {createMutation.isPending ? 'Creating...' : 'Add Certification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Edit Certification</h3>
              <button type="button" onClick={() => setEditItem(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="editCertType" className="block text-gray-400 text-xs mb-1">Certification Type *</label>
                <input id="editCertType" type="text" value={editItem.certificationType} onChange={e => setEditItem(f => ({ ...f, certificationType: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div>
                <label htmlFor="editCertCompany" className="block text-gray-400 text-xs mb-1">Company</label>
                <input id="editCertCompany" type="text" value={editItem.company} onChange={e => setEditItem(f => ({ ...f, company: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editCertBody" className="block text-gray-400 text-xs mb-1">Issuing Body</label>
                  <input id="editCertBody" type="text" value={editItem.body} onChange={e => setEditItem(f => ({ ...f, body: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="editCertGrade" className="block text-gray-400 text-xs mb-1">Grade</label>
                  <input id="editCertGrade" type="text" value={editItem.grade} onChange={e => setEditItem(f => ({ ...f, grade: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
              </div>
              <div>
                <label htmlFor="editCertAccred" className="block text-gray-400 text-xs mb-1">Accreditation Number</label>
                <input id="editCertAccred" type="text" value={editItem.accreditationNumber} onChange={e => setEditItem(f => ({ ...f, accreditationNumber: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editCertExpiry" className="block text-gray-400 text-xs mb-1">Expiry Date</label>
                  <input id="editCertExpiry" type="date" value={editItem.expiryDate} onChange={e => setEditItem(f => ({ ...f, expiryDate: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                </div>
                <div>
                  <label htmlFor="editCertStatus" className="block text-gray-400 text-xs mb-1">Status</label>
                  <select id="editCertStatus" value={editItem.status} onChange={e => setEditItem(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="expired">Expired</option>
                    <option value="revoked">Revoked</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleUpdate} disabled={updateMutation.isPending || !editItem.certificationType} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
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
