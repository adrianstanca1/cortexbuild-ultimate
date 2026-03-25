import { useState, useEffect } from 'react';
import { Plus, Search, Shield, FileCheck, Clock, AlertTriangle, FileText, Upload } from 'lucide-react';
import { certificationsApi, uploadFile } from '../../services/api';

export default function Certifications() {
  const [searchTerm, setSearchTerm] = useState('');
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    certificationsApi.getAll().then((data: any[]) => {
      setCerts(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = certs.filter((c: any) =>
    (c.certification_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validCount = certs.filter((c: any) => c.status === 'active' || c.status === 'valid').length;
  const expiringCount = certs.filter((c: any) => {
    if (!c.expiry_date) return false;
    const daysUntil = (new Date(c.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntil > 0 && daysUntil <= 90;
  }).length;

  const handleUpload = async (certId: string, file: File) => {
    setUploading(certId);
    try {
      const result = await uploadFile(file, 'REPORTS');
      setCerts(prev => prev.map(c => {
        if (String(c.id) === String(certId)) {
          return { ...c, document_url: result.file_url || result.name, document_name: file.name };
        }
        return c;
      }));
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Certifications & Licenses</h2>
          <p className="text-gray-400 text-sm mt-1">Manage company certifications, accreditations and licenses</p>
        </div>
        <button type="button" className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> Add Certification
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><FileCheck className="text-green-400" size={20} /></div><div><p className="text-gray-400 text-xs">Active</p><p className="text-2xl font-bold text-green-400">{loading ? '...' : validCount}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><AlertTriangle className="text-amber-400" size={20} /></div><div><p className="text-gray-400 text-xs">Expiring Soon</p><p className="text-2xl font-bold text-amber-400">{loading ? '...' : expiringCount}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Shield className="text-blue-400" size={20} /></div><div><p className="text-gray-400 text-xs">Total</p><p className="text-2xl font-bold text-blue-400">{loading ? '...' : certs.length}</p></div></div></div>
      </div>
      <div className="card p-4">
        <input type="text" placeholder="Search certifications..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4" />
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading certifications...</div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No certifications found</div>
            ) : filtered.map((c) => (
              <div key={c.id} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
