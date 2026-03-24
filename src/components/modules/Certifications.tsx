import { useState } from 'react';
import { Plus, Search, Shield, FileCheck, Clock, AlertTriangle } from 'lucide-react';

const mockCerts = [
  { id: '1', name: 'ISO 9001:2015', holder: 'CortexBuild Ltd', issueDate: '2024-01-15', expiryDate: '2027-01-15', status: 'valid' },
  { id: '2', name: 'ISO 14001:2015', holder: 'CortexBuild Ltd', issueDate: '2024-01-15', expiryDate: '2027-01-15', status: 'valid' },
  { id: '3', name: 'Constructionline Gold', holder: 'CortexBuild Ltd', issueDate: '2023-06-01', expiryDate: '2024-06-01', status: 'expiring' },
];

export default function Certifications() {
  const [searchTerm, setSearchTerm] = useState('');
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Certifications & Licenses</h2>
          <p className="text-gray-400 text-sm mt-1">Manage company certifications, accreditations and licenses</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> Add Certification
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><FileCheck className="text-green-400" size={20} /></div><div><p className="text-gray-400 text-xs">Valid</p><p className="text-2xl font-bold text-green-400">{mockCerts.filter(c => c.status === 'valid').length}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><AlertTriangle className="text-amber-400" size={20} /></div><div><p className="text-gray-400 text-xs">Expiring</p><p className="text-2xl font-bold text-amber-400">{mockCerts.filter(c => c.status === 'expiring').length}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center"><Clock className="text-red-400" size={20} /></div><div><p className="text-gray-400 text-xs">Expired</p><p className="text-2xl font-bold text-red-400">{mockCerts.filter(c => c.status === 'expired').length}</p></div></div></div>
      </div>
      <div className="card p-4">
        <input type="text" placeholder="Search certifications..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4" />
        <div className="space-y-3">
          {mockCerts.map((c) => (
            <div key={c.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">{c.name}</h3>
                <p className="text-gray-400 text-sm">{c.holder}</p>
                <p className="text-gray-500 text-xs">Issued: {c.issueDate}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs ${c.status === 'valid' ? 'bg-green-500/10 text-green-400' : c.status === 'expiring' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>{c.status}</span>
                <p className="text-gray-400 text-xs mt-1">Expires: {c.expiryDate}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
