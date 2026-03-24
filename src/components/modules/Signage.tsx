import { useState } from 'react';
import { Plus, Search, AlertTriangle, CheckCircle, Eye, Edit } from 'lucide-react';

const mockSignage = [
  { id: '1', name: 'Site Entrance Sign', location: 'Main Gate', type: 'Safety', status: 'installed' },
  { id: '2', name: 'Fire Exit Signs', location: 'Block A', type: 'Emergency', status: 'installed' },
  { id: '3', name: 'Danger Warning Signs', location: 'Level 2', type: 'Warning', status: 'pending' },
];

export default function Signage() {
  const [searchTerm, setSearchTerm] = useState('');
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Site Signage</h2>
          <p className="text-gray-400 text-sm mt-1">Manage safety, warning and information signage</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
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
        <div className="space-y-3">
          {mockSignage.map((s) => (
            <div key={s.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">{s.name}</h3>
                <p className="text-gray-400 text-sm">{s.location} - {s.type}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-xs ${s.status === 'installed' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {s.status}
                </span>
                <button className="p-2 hover:bg-gray-700 rounded"><Eye size={16} className="text-gray-400" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
