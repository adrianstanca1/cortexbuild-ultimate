import { useState } from 'react';
import { Plus, Search, Leaf, Cloud, Factory, Gauge } from 'lucide-react';

const mockData = [
  { id: '1', metric: 'Carbon Emissions', value: 124.5, unit: 'tonnes CO2e', period: 'March 2024', target: 130 },
  { id: '2', metric: 'Energy Consumption', value: 45200, unit: 'kWh', period: 'March 2024', target: 50000 },
  { id: '3', metric: 'Water Usage', value: 1820, unit: 'm³', period: 'March 2024', target: 2000 },
];

export default function Sustainability() {
  const [searchTerm, setSearchTerm] = useState('');
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Sustainability & ESG</h2>
          <p className="text-gray-400 text-sm mt-1">Track carbon emissions, energy and environmental metrics</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> Log Metrics
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Cloud className="text-green-400" size={20} /></div>
            <div><p className="text-gray-400 text-xs">Carbon This Month</p><p className="text-2xl font-bold text-green-400">124.5t</p></div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><Factory className="text-amber-400" size={20} /></div>
            <div><p className="text-gray-400 text-xs">Energy Used</p><p className="text-2xl font-bold text-amber-400">45,200 kWh</p></div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Gauge className="text-blue-400" size={20} /></div>
            <div><p className="text-gray-400 text-xs">BREEAM Score</p><p className="text-2xl font-bold text-blue-400">68/90</p></div>
          </div>
        </div>
      </div>
      <div className="card p-4">
        <input type="text" placeholder="Search metrics..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4" />
        <div className="space-y-3">
          {mockData.map((d) => (
            <div key={d.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">{d.metric}</h3>
                <p className="text-gray-400 text-sm">{d.period}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">{d.value} {d.unit}</p>
                <p className="text-gray-400 text-xs">Target: {d.target}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
