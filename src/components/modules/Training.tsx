import { useState, useEffect, useRef } from 'react';
import { Plus, Search, GraduationCap, Award, Clock, AlertCircle, FileCheck, Upload } from 'lucide-react';
import { trainingApi, uploadFile } from '../../services/api';

export default function Training() {
  const [searchTerm, setSearchTerm] = useState('');
  const [training, setTraining] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    trainingApi.getAll().then((data: any[]) => {
      setTraining(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = training.filter((t: any) =>
    (t.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.project || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validCount = training.filter((t: any) => t.status === 'completed' || t.status === 'certified').length;
  const expiringCount = training.filter((t: any) => t.status === 'scheduled').length;
  const totalCount = training.length;

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
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      setSelectedId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Training & Certifications</h2>
          <p className="text-gray-400 text-sm mt-1">Track worker training records and qualifications</p>
        </div>
        <button type="button" className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> Add Training Record
        </button>
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
              <div className="text-center py-8 text-gray-500">No training records found</div>
            ) : filtered.map((t) => (
              <div key={t.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
