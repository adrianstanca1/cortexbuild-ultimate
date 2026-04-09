/**
 * DroneCapture — Reality capture management for drone imagery, orthomosaics, and point clouds.
 * Uses droneApi from services/api.ts.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Drone, Plus, Search, Camera, Map, UploadCloud, CheckCircle, XCircle,
  AlertTriangle, Clock, ChevronDown, ChevronUp, Loader2, Eye, Trash2, RefreshCw
} from 'lucide-react';
import { droneApi } from '../../services/api';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { EmptyState } from '../ui/EmptyState';
import { toast } from 'sonner';

type DroneCapture = {
  id: string;
  project_id: string;
  capture_type: 'aerial_photo' | 'orthomosaic' | 'point_cloud' | 'video' | 'thermal' | 'inspection' | 'progress';
  capture_date: string;
  location_name?: string;
  altitude_m?: number;
  resolution_mpix?: number;
  file_url?: string;
  thumbnail_url?: string;
  status: string;
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  analysis_summary?: string;
  inspector?: string;
  notes?: string;
};

const CAPTURE_TYPES = [
  { value: 'aerial_photo', label: 'Aerial Photo', icon: Camera },
  { value: 'orthomosaic', label: 'Orthomosaic', icon: Map },
  { value: 'point_cloud', label: '3D Point Cloud', icon: Map },
  { value: 'video', label: 'Video Survey', icon: Camera },
  { value: 'thermal', label: 'Thermal Inspection', icon: AlertTriangle },
  { value: 'inspection', label: 'Close Inspection', icon: Eye },
  { value: 'progress', label: 'Progress Monitoring', icon: Clock },
];

const TYPE_LABELS: Record<string, string> = {
  aerial_photo: 'Aerial Photo', orthomosaic: 'Orthomosaic', point_cloud: '3D Point Cloud',
  video: 'Video Survey', thermal: 'Thermal', inspection: 'Inspection', progress: 'Progress',
};

export function DroneCapture() {
  const [captures, setCaptures] = useState<DroneCapture[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [analyseLoading, setAnalyseLoading] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: '', capture_type: 'progress', capture_date: '', location_name: '',
    altitude_m: '', resolution_mpix: '', inspector: '', notes: '',
  });

  const fetchCaptures = useCallback(async () => {
    try {
      // For demo, use a placeholder project ID — in production this would be from context
      const res = await droneApi.getProjectCaptures('demo-project');
      setCaptures(Array.isArray(res.data) ? res.data : []);
    } catch {
      // Silently fail — API may not have test data
      setCaptures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCaptures(); }, [fetchCaptures]);

  async function handleAnalyse(id: string) {
    setAnalyseLoading(id);
    try {
      await droneApi.analyse(id);
      toast.success('Analysis queued — check back shortly');
      fetchCaptures();
    } catch {
      toast.error('Failed to start analysis');
    } finally {
      setAnalyseLoading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.project_id) {
      toast.error('Project ID is required');
      return;
    }
    try {
      await droneApi.create({
        project_id: form.project_id,
        capture_type: form.capture_type,
        capture_date: form.capture_date || undefined,
        location_name: form.location_name || undefined,
        altitude_m: form.altitude_m ? parseFloat(form.altitude_m) : undefined,
        resolution_mpix: form.resolution_mpix ? parseFloat(form.resolution_mpix) : undefined,
        inspector: form.inspector || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Capture record created');
      setShowModal(false);
      setForm({ project_id: '', capture_type: 'progress', capture_date: '', location_name: '', altitude_m: '', resolution_mpix: '', inspector: '', notes: '' });
      fetchCaptures();
    } catch {
      toast.error('Failed to create capture');
    }
  }

  const filtered = captures.filter(c => {
    const matchSearch = !search ||
      c.location_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.inspector?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || c.capture_type === typeFilter;
    const matchStatus = statusFilter === 'all' || c.analysis_status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const analysisColour = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'processing': return 'bg-yellow-500/20 text-yellow-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-700/30 text-gray-400';
    }
  };

  const typeColour = (t: string) => {
    switch (t) {
      case 'aerial_photo': return 'bg-blue-500/20 text-blue-400';
      case 'orthomosaic': return 'bg-purple-500/20 text-purple-400';
      case 'point_cloud': return 'bg-cyan-500/20 text-cyan-400';
      case 'video': return 'bg-pink-500/20 text-pink-400';
      case 'thermal': return 'bg-orange-500/20 text-orange-400';
      case 'inspection': return 'bg-indigo-500/20 text-indigo-400';
      case 'progress': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-700/30 text-gray-400';
    }
  };

  return (
    <>
      <ModuleBreadcrumbs currentModule="drone-capture" onNavigate={() => {}} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Drone size={20} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Drone & Reality Capture</h1>
              <p className="text-sm text-gray-400">Upload drone imagery, orthomosaics, and 3D point clouds</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            <Plus size={16} /> New Capture
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center bg-gray-900 rounded-xl border border-gray-800 p-4">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by location or inspector..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Types</option>
            {CAPTURE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <button
            onClick={fetchCaptures}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Drone}
            title="No captures found"
            description="Upload drone imagery to create reality capture records."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => {
              const TypeIcon = CAPTURE_TYPES.find(t => t.value === c.capture_type)?.icon ?? Camera;
              return (
                <div key={c.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-purple-500/30 transition-colors">
                  {/* Thumbnail */}
                  <div className="h-40 bg-gray-800 relative flex items-center justify-center">
                    {c.thumbnail_url ? (
                      <img src={c.thumbnail_url} alt={c.location_name} className="w-full h-full object-cover" />
                    ) : (
                      <TypeIcon size={40} className="text-gray-700" />
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColour(c.capture_type)}`}>
                        {TYPE_LABELS[c.capture_type] ?? c.capture_type}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-white">{c.location_name || 'Unnamed Capture'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{c.capture_date || 'No date'}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${analysisColour(c.analysis_status)}`}>
                        {c.analysis_status}
                      </span>
                    </div>

                    {c.inspector && (
                      <p className="text-xs text-gray-400 mb-2">Inspector: {c.inspector}</p>
                    )}

                    {c.analysis_summary && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{c.analysis_summary}</p>
                    )}

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                        className="flex-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition-colors"
                      >
                        {expandedId === c.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {expandedId === c.id ? 'Less' : 'More'}
                      </button>
                      {c.analysis_status === 'pending' && (
                        <button
                          onClick={() => handleAnalyse(c.id)}
                          disabled={analyseLoading === c.id}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs transition-colors disabled:opacity-50"
                        >
                          {analyseLoading === c.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                          Analyse
                        </button>
                      )}
                    </div>

                    {expandedId === c.id && (
                      <div className="mt-3 pt-3 border-t border-gray-800 space-y-2 text-xs">
                        {c.altitude_m && <div className="flex justify-between"><span className="text-gray-500">Altitude</span><span className="text-gray-300">{c.altitude_m}m</span></div>}
                        {c.resolution_mpix && <div className="flex justify-between"><span className="text-gray-500">Resolution</span><span className="text-gray-300">{c.resolution_mpix} MP</span></div>}
                        {c.file_url && <div className="flex justify-between"><span className="text-gray-500">File</span><a href={c.file_url} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">View</a></div>}
                        {c.notes && <div className="mt-2"><span className="text-gray-500 block mb-1">Notes</span><p className="text-gray-300">{c.notes}</p></div>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
                <h2 className="text-lg font-semibold text-white">New Drone Capture</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><XCircle size={18} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Project ID *</label>
                  <input
                    value={form.project_id}
                    onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                    placeholder="e.g. proj_xxxxx"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Capture Type</label>
                  <select
                    value={form.capture_type}
                    onChange={e => setForm(f => ({ ...f, capture_type: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {CAPTURE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Capture Date</label>
                    <input
                      type="date"
                      value={form.capture_date}
                      onChange={e => setForm(f => ({ ...f, capture_date: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Location Name</label>
                    <input
                      value={form.location_name}
                      onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))}
                      placeholder="e.g. North Wing"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Altitude (m)</label>
                    <input
                      type="number"
                      value={form.altitude_m}
                      onChange={e => setForm(f => ({ ...f, altitude_m: e.target.value }))}
                      placeholder="e.g. 120"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Resolution (MP)</label>
                    <input
                      type="number"
                      value={form.resolution_mpix}
                      onChange={e => setForm(f => ({ ...f, resolution_mpix: e.target.value }))}
                      placeholder="e.g. 45"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Inspector</label>
                  <input
                    value={form.inspector}
                    onChange={e => setForm(f => ({ ...f, inspector: e.target.value }))}
                    placeholder="Pilot name or company"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    placeholder="Flight conditions, equipment used, etc."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 flex items-start gap-2">
                  <UploadCloud size={14} className="text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-purple-300">
                    File upload coming soon. Create the capture record now and upload imagery separately.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default DroneCapture;
