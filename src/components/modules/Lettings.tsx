import { useState } from 'react';
import { Plus, Search, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

const mockLettings = [
  { id: '1', package: 'Steelwork Package', status: 'awarded', contractor: 'SteelTech Fabrications Ltd', value: 2450000, awardDate: '2024-02-15' },
  { id: '2', package: 'M&E Installation', status: 'awarded', contractor: 'M&E Solutions NI', value: 890000, awardDate: '2024-02-20' },
  { id: '3', package: 'Cladding Package', status: 'evaluation', contractor: 'TBD', value: 0, awardDate: '' },
];

export default function Lettings() {
  const [searchTerm, setSearchTerm] = useState('');
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Contract Lettings</h2>
          <p className="text-gray-400 text-sm mt-1">Manage contract packages and contractor appointments</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> New Package
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><FileText className="text-blue-400" size={20} /></div><div><p className="text-gray-400 text-xs">Total Packages</p><p className="text-2xl font-bold text-white">{mockLettings.length}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle className="text-green-400" size={20} /></div><div><p className="text-gray-400 text-xs">Awarded</p><p className="text-2xl font-bold text-green-400">{mockLettings.filter(l => l.status === 'awarded').length}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><Clock className="text-amber-400" size={20} /></div><div><p className="text-gray-400 text-xs">In Evaluation</p><p className="text-2xl font-bold text-amber-400">{mockLettings.filter(l => l.status === 'evaluation').length}</p></div></div></div>
      </div>
      <div className="card p-4">
        <input type="text" placeholder="Search packages..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4" />
        <div className="space-y-3">
          {mockLettings.map((l) => (
            <div key={l.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">{l.package}</h3>
                <p className="text-gray-400 text-sm">{l.contractor}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs ${l.status === 'awarded' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>{l.status}</span>
                {l.value > 0 && <p className="text-white font-medium mt-1">£{l.value.toLocaleString()}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
