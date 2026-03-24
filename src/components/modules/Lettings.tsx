import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { lettingsApi } from '../../services/api';

export default function Lettings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [lettings, setLettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Contract Lettings</h2>
          <p className="text-gray-400 text-sm mt-1">Manage contract packages and contractor appointments</p>
        </div>
        <button type="button" className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
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
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${l.status === 'awarded' ? 'bg-green-500/10 text-green-400' : l.status === 'tendering' || l.status === 'evaluation' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-500/10 text-gray-400'}`}>{l.status || 'unknown'}</span>
                  {l.contract_value > 0 && <p className="text-white font-medium mt-1">£{Number(l.contract_value).toLocaleString()}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
