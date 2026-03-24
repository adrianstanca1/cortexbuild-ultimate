import { useState } from 'react';
import { Plus, Search, Users, FileCheck, Clock, AlertTriangle } from 'lucide-react';

const mockPrequal = [
  { id: '1', company: 'SteelTech Fabrications Ltd', submissionDate: '2024-03-01', status: 'approved', score: 92 },
  { id: '2', company: 'M&E Solutions NI', submissionDate: '2024-03-05', status: 'pending', score: 0 },
  { id: '3', company: 'ABC Groundworks', submissionDate: '2024-03-10', status: 'rejected', score: 45 },
];

export default function Prequalification() {
  const [searchTerm, setSearchTerm] = useState('');
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Prequalification</h2>
          <p className="text-gray-400 text-sm mt-1">Manage contractor prequalification questionnaires</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> Send PQQ
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><FileCheck className="text-green-400" size={20} /></div><div><p className="text-gray-400 text-xs">Approved</p><p className="text-2xl font-bold text-green-400">{mockPrequal.filter(p => p.status === 'approved').length}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><Clock className="text-amber-400" size={20} /></div><div><p className="text-gray-400 text-xs">Pending</p><p className="text-2xl font-bold text-amber-400">{mockPrequal.filter(p => p.status === 'pending').length}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center"><AlertTriangle className="text-red-400" size={20} /></div><div><p className="text-gray-400 text-xs">Rejected</p><p className="text-2xl font-bold text-red-400">{mockPrequal.filter(p => p.status === 'rejected').length}</p></div></div></div>
      </div>
      <div className="card p-4">
        <input type="text" placeholder="Search contractors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4" />
        <div className="space-y-3">
          {mockPrequal.map((p) => (
            <div key={p.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">{p.company}</h3>
                <p className="text-gray-400 text-sm">Submitted: {p.submissionDate}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs ${p.status === 'approved' ? 'bg-green-500/10 text-green-400' : p.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>{p.status}</span>
                {p.score > 0 && <p className="text-gray-400 text-xs mt-1">Score: {p.score}%</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
