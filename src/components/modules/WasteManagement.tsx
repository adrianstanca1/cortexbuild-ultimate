import { useState } from 'react';
import { Plus, Search, Leaf, Recycle, AlertCircle, Trash2 } from 'lucide-react';

const mockWaste = [
  { id: '1', type: 'Mixed Construction', quantity: 12.5, unit: 'tonnes', disposal: 'Skip Hire', recycling: 78, date: '2024-03-20' },
  { id: '2', type: 'Timber Offcuts', quantity: 2.1, unit: 'tonnes', disposal: 'Recycled', recycling: 100, date: '2024-03-18' },
  { id: '3', type: 'Metal Scrap', quantity: 1.8, unit: 'tonnes', disposal: 'Scrap Yard', recycling: 100, date: '2024-03-15' },
];

export default function WasteManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const totalRecycling = mockWaste.reduce((acc, w) => acc + (w.recycling * w.quantity / 100), 0);
  const totalWaste = mockWaste.reduce((acc, w) => acc + w.quantity, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Waste Management</h2>
          <p className="text-gray-400 text-sm mt-1">Track site waste, recycling and environmental compliance</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
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
              <p className="text-2xl font-bold text-emerald-400">{totalRecycling.toFixed(1)}t</p>
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
              <p className="text-2xl font-bold text-amber-400">{totalWaste.toFixed(1)}t</p>
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
              <p className="text-2xl font-bold text-green-400">{Math.round(totalRecycling/totalWaste*100)}%</p>
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
        <div className="space-y-3">
          {mockWaste.map((w) => (
            <div key={w.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">{w.type}</h3>
                <p className="text-gray-400 text-sm">{w.quantity} {w.unit} - {w.disposal} - {w.date}</p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${w.recycling === 100 ? 'text-green-400' : 'text-amber-400'}`}>{w.recycling}%</p>
                <p className="text-gray-400 text-xs">recycled</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
