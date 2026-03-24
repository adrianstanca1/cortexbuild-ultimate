import { useState, useEffect } from 'react';
import { Plus, Search, Leaf, Recycle, AlertCircle, Trash2 } from 'lucide-react';
import { wasteManagementApi } from '../../services/api';

export default function WasteManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [waste, setWaste] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wasteManagementApi.getAll().then((data: any[]) => {
      setWaste(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = waste.filter((w: any) =>
    (w.waste_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.project || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRecycling = waste.reduce((acc: number, w: any) => {
    const qty = Number(w.quantity) || 0;
    const actualRecycled = Number(w.recycling_rate) || (w.status === 'collected' ? 75 : 0);
    return acc + (actualRecycled * qty / 100);
  }, 0);
  const totalWaste = waste.reduce((acc: number, w: any) => acc + Number(w.quantity || 0), 0);
  const recyclingRate = totalWaste > 0 ? Math.round(totalRecycling/totalWaste*100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Waste Management</h2>
          <p className="text-gray-400 text-sm mt-1">Track site waste, recycling and environmental compliance</p>
        </div>
        <button type="button" className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> Log Waste
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Recycle className="text-emerald-400" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Total Recycled</p>
              <p className="text-2xl font-bold text-emerald-400">{loading ? '...' : `${totalRecycling.toFixed(1)}t`}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Trash2 className="text-amber-400" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Total Waste</p>
              <p className="text-2xl font-bold text-amber-400">{loading ? '...' : `${totalWaste.toFixed(1)}t`}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Leaf className="text-green-400" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Recycling Rate</p>
              <p className="text-2xl font-bold text-green-400">{loading ? '...' : `${recyclingRate}%`}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <input
          type="text"
          placeholder="Search waste records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4"
        />
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading waste data...</div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No waste records found</div>
            ) : filtered.map((w) => (
              <div key={w.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{w.waste_type || 'Waste'}</h3>
                  <p className="text-gray-400 text-sm">{w.quantity || 0} {w.unit || 'tonnes'} - {w.carrier || 'TBC'} - {w.collection_date || 'TBD'}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${w.status === 'collected' ? 'text-green-400' : 'text-amber-400'}`}>
                    {w.recycling_rate || 0}%
                  </p>
                  <p className="text-gray-400 text-xs">recycled</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
