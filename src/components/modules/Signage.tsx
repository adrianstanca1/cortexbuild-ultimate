import { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, CheckCircle, Eye, Edit } from 'lucide-react';
import { signageApi } from '../../services/api';

export default function Signage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [signage, setSignage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    signageApi.getAll().then((data: any[]) => {
      setSignage(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = signage.filter((s: any) =>
    (s.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Site Signage</h2>
          <p className="text-gray-400 text-sm mt-1">Manage safety, warning and information signage</p>
        </div>
        <button type="button" className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> Add Sign
        </button>
      </div>
      <div className="card p-4">
        <input
          type="text"
          placeholder="Search signage..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4"
        />
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading signage...</div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No signage items found</div>
            ) : filtered.map((s) => (
              <div key={s.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{s.description || s.reference || 'Sign'}</h3>
                  <p className="text-gray-400 text-sm">{s.location || 'No location'} - {s.type || 'General'}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${s.status === 'installed' ? 'bg-green-500/10 text-green-400' : s.status === 'required' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-500/10 text-gray-400'}`}>
                    {s.status || 'unknown'}
                  </span>
                  <button type="button" className="p-2 hover:bg-gray-700 rounded"><Eye size={16} className="text-gray-400" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
