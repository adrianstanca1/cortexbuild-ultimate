import { useState, useEffect } from 'react';
import { Plus, Search, Users, FileCheck, Clock, AlertTriangle } from 'lucide-react';
import { prequalificationApi } from '../../services/api';

export default function Prequalification() {
  const [searchTerm, setSearchTerm] = useState('');
  const [prequal, setPrequal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Prequalification</h2>
          <p className="text-gray-400 text-sm mt-1">Manage contractor prequalification questionnaires</p>
        </div>
        <button type="button" className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
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
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${p.status === 'approved' ? 'bg-green-500/10 text-green-400' : p.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-500/10 text-gray-400'}`}>{p.status || 'unknown'}</span>
                  {p.score > 0 && <p className="text-gray-400 text-xs mt-1">Score: {p.score}%</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
