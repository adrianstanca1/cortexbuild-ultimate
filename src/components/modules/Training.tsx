import { useState } from 'react';
import { Plus, Search, GraduationCap, Award, Clock, AlertCircle } from 'lucide-react';

const mockTraining = [
  { id: '1', worker: 'John Smith', course: 'CITB CSCS Health & Safety', date: '2024-03-15', expiry: '2025-03-15', status: 'valid' },
  { id: '2', worker: 'Jane Doe', course: 'IPAF Powered Access', date: '2024-02-20', expiry: '2026-02-20', status: 'valid' },
  { id: '3', worker: 'Bob Wilson', course: 'First Aid at Work', date: '2023-06-10', expiry: '2024-06-10', status: 'expiring' },
];

export default function Training() {
  const [searchTerm, setSearchTerm] = useState('');
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Training & Certifications</h2>
          <p className="text-gray-400 text-sm mt-1">Track worker training records and qualifications</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> Add Training Record
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Award className="text-green-400" size={20} /></div><div><p className="text-gray-400 text-xs">Valid</p><p className="text-2xl font-bold text-green-400">{mockTraining.filter(t => t.status === 'valid').length}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><AlertCircle className="text-amber-400" size={20} /></div><div><p className="text-gray-400 text-xs">Expiring Soon</p><p className="text-2xl font-bold text-amber-400">{mockTraining.filter(t => t.status === 'expiring').length}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center"><Clock className="text-red-400" size={20} /></div><div><p className="text-gray-400 text-xs">Expired</p><p className="text-2xl font-bold text-red-400">{mockTraining.filter(t => t.status === 'expired').length}</p></div></div></div>
      </div>
      <div className="card p-4">
        <input type="text" placeholder="Search training records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4" />
        <div className="space-y-3">
          {mockTraining.map((t) => (
            <div key={t.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">{t.worker}</h3>
                <p className="text-gray-400 text-sm">{t.course}</p>
                <p className="text-gray-500 text-xs">Completed: {t.date}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs ${t.status === 'valid' ? 'bg-green-500/10 text-green-400' : t.status === 'expiring' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>{t.status}</span>
                <p className="text-gray-400 text-xs mt-1">Expires: {t.expiry}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
