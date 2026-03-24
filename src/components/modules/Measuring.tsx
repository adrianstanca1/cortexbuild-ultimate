import { useState, useEffect } from 'react';
import { Plus, Search, Ruler, MapPin, Camera, FileText } from 'lucide-react';
import { measuringApi } from '../../services/api';

export default function Measuring() {
  const [searchTerm, setSearchTerm] = useState('');
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    measuringApi.getAll().then((data: any[]) => {
      setMeasurements(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = measurements.filter((m: any) =>
    (m.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.survey_type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedCount = measurements.filter((m: any) => m.status === 'completed').length;
  const pendingCount = measurements.filter((m: any) => m.status === 'pending' || m.status === 'scheduled').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Site Measuring & Surveys</h2>
          <p className="text-gray-400 text-sm mt-1">Record site measurements, surveys and as-built data</p>
        </div>
        <button type="button" className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> New Measurement
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Ruler className="text-blue-400" size={20} /></div><div><p className="text-gray-400 text-xs">Total Surveys</p><p className="text-2xl font-bold text-white">{loading ? '...' : measurements.length}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><FileText className="text-green-400" size={20} /></div><div><p className="text-gray-400 text-xs">Completed</p><p className="text-2xl font-bold text-green-400">{loading ? '...' : completedCount}</p></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><MapPin className="text-amber-400" size={20} /></div><div><p className="text-gray-400 text-xs">Pending</p><p className="text-2xl font-bold text-amber-400">{loading ? '...' : pendingCount}</p></div></div></div>
      </div>
      <div className="card p-4">
        <input type="text" placeholder="Search measurements..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4" />
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading measurements...</div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No measurements found</div>
            ) : filtered.map((m) => (
              <div key={m.id} className="border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{m.location || 'Location TBC'}</h3>
                  <p className="text-gray-400 text-sm">{m.survey_type || 'Survey'} - Surveyor: {m.surveyor || 'TBC'}</p>
                  <p className="text-gray-500 text-xs">Date: {m.survey_date || 'TBD'}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${m.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>{m.status || 'unknown'}</span>
                  <p className="text-white font-medium mt-1">{m.total_area || 0} {m.unit || 'm²'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
