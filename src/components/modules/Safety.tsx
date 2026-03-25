// Module: Safety — CortexBuild Ultimate (Enhanced with RIDDOR, Permits, Toolbox Talks)
import { useState } from 'react';
import { Plus, X, Loader2, Shield, AlertTriangle, CheckCircle2, RefreshCw, Search, Edit2, Trash2, FileText, AlertCircle, Clock, TrendingUp, Upload, CheckSquare, Square } from 'lucide-react';
import { useSafety } from '../../hooks/useData';
import { uploadFile } from '../../services/api';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';

const SAFETY_TREND_DATA = [
  { month:'Sep', incidents:3, nearMisses:8,  toolboxTalks:12 },
  { month:'Oct', incidents:2, nearMisses:6,  toolboxTalks:14 },
  { month:'Nov', incidents:1, nearMisses:9,  toolboxTalks:13 },
  { month:'Dec', incidents:0, nearMisses:5,  toolboxTalks:10 },
  { month:'Jan', incidents:2, nearMisses:7,  toolboxTalks:15 },
  { month:'Feb', incidents:1, nearMisses:4,  toolboxTalks:16 },
  { month:'Mar', incidents:2, nearMisses:5,  toolboxTalks:12 },
];

// Mock data for timeline
const INCIDENT_TIMELINE = [
  { date: '2026-03-20', status: 'open', note: 'Incident reported' },
  { date: '2026-03-21', status: 'investigating', note: 'Investigation started' },
  { date: '2026-03-22', status: 'action_required', note: 'Root cause identified, actions assigned' },
];

// Mock Permits Data
const MOCK_PERMITS = [
  { id: '1', permitNo: 'HW-2026-001', type: 'Hot Works', project: 'Main Tower', location: 'Level 5', startDate: '2026-03-20', endDate: '2026-03-25', issuedBy: 'John Smith', status: 'Active' },
  { id: '2', permitNo: 'CS-2026-002', type: 'Confined Space', project: 'Tank Maintenance', location: 'Tank A', startDate: '2026-03-18', endDate: '2026-03-20', issuedBy: 'Sarah Jones', status: 'Expired' },
  { id: '3', permitNo: 'EX-2026-003', type: 'Excavation', project: 'Foundation Work', location: 'Grid F2', startDate: '2026-03-21', endDate: '2026-03-28', issuedBy: 'Mike Brown', status: 'Active' },
  { id: '4', permitNo: 'MW-2026-004', type: 'MEWP', project: 'Facade Cleaning', location: 'South Face', startDate: '2026-03-19', endDate: '2026-03-19', issuedBy: 'Emma Wilson', status: 'Expired' },
  { id: '5', permitNo: 'EI-2026-005', type: 'Electrical Isolation', project: 'Rewiring', location: 'Level 3', startDate: '2026-03-22', endDate: '2026-03-30', issuedBy: 'David Lee', status: 'Active' },
];

// Mock Toolbox Talks Data
const MOCK_TOOLBOX_TALKS = [
  { id: '1', date: '2026-03-20', topic: 'Fall Protection Best Practices', location: 'Site Induction', presenter: 'Health & Safety Team', attendees: 24, signedOff: true },
  { id: '2', date: '2026-03-18', topic: 'Confined Space Entry Procedures', location: 'Tank Area', presenter: 'Sarah Jones', attendees: 8, signedOff: true },
  { id: '3', date: '2026-03-15', topic: 'PPE Requirements Update', location: 'Main Office', presenter: 'John Smith', attendees: 32, signedOff: true },
  { id: '4', date: '2026-03-10', topic: 'Fire Safety & Evacuation', location: 'All Zones', presenter: 'Emergency Coordinator', attendees: 47, signedOff: true },
];

type AnyRow = Record<string, unknown>;

const severityConfig: Record<string, { label: string; color: string; bg: string }> = {
  low:      { label: 'Low',      color: 'text-green-400',  bg: 'bg-green-500/15 border border-green-600/40' },
  medium:   { label: 'Medium',   color: 'text-yellow-400', bg: 'bg-yellow-500/15 border border-yellow-600/40' },
  high:     { label: 'High',     color: 'text-orange-400', bg: 'bg-orange-500/15 border border-orange-600/40' },
  critical: { label: 'Critical', color: 'text-red-400',    bg: 'bg-red-500/15 border border-red-600/40' },
  minor:    { label: 'Minor',    color: 'text-green-400',  bg: 'bg-green-500/15 border border-green-600/40' },
  serious:  { label: 'Serious',  color: 'text-orange-400', bg: 'bg-orange-500/15 border border-orange-600/40' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  open:              { label: 'Open',             color: 'text-red-400' },
  investigating:     { label: 'Investigating',    color: 'text-yellow-400' },
  action_required:   { label: 'Action Required',  color: 'text-orange-400' },
  closed:            { label: 'Closed',            color: 'text-green-400' },
  resolved:          { label: 'Resolved',          color: 'text-emerald-400' },
};

const typeConfig: Record<string, { label: string; icon: typeof Shield }> = {
  near_miss:            { label: 'Near Miss',           icon: AlertTriangle },
  first_aid:            { label: 'First Aid',           icon: AlertCircle },
  riddor:               { label: 'RIDDOR',              icon: AlertCircle },
  dangerous_occurrence: { label: 'Dangerous Occurrence',icon: AlertTriangle },
  environmental:        { label: 'Environmental',        icon: Shield },
  'near-miss':          { label: 'Near Miss',           icon: AlertTriangle },
  incident:             { label: 'Incident',            icon: AlertCircle },
  hazard:               { label: 'Hazard',              icon: AlertTriangle },
  'toolbox-talk':       { label: 'Toolbox Talk',        icon: FileText },
  'mewp-check':         { label: 'MEWP Check',          icon: CheckCircle2 },
};

const defaultForm = {
  title: '', type: 'near_miss', severity: 'medium', status: 'open',
  project: '', location: '', date: new Date().toISOString().split('T')[0],
  description: '', immediate_action: '', injured_party: '',
  reported_by_name: '', riddor_reportable: false,
  // Enhanced RIDDOR fields
  injury_type: 'None', body_part_affected: 'Head', days_lost: 0,
  witness_name: '', root_cause: 'Human Error', corrective_action: '', target_closure_date: '',
};
type FormData = typeof defaultForm;

const defaultPermit = {
  permitNo: '', type: 'Hot Works', project: '', location: '',
  startDate: new Date().toISOString().split('T')[0], endDate: '',
  issuedBy: '', status: 'Active',
};
type PermitFormData = typeof defaultPermit;

const defaultTalk = {
  date: new Date().toISOString().split('T')[0], topic: '', location: '',
  presenter: '', attendees: 0, signedOff: false,
};
type TalkFormData = typeof defaultTalk;

export function Safety() {
  const { useList, useCreate, useUpdate, useDelete } = useSafety;
  const { data: raw = [], isLoading, refetch } = useList();
  const incidents = raw as AnyRow[];
  const createM = useCreate(); const updateM = useUpdate(); const deleteM = useDelete();

  // Main navigation tabs
  const [mainTab, setMainTab] = useState('incidents');
  const [categoryTab, setCategoryTab] = useState('all');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Permits state
  const [permits, setPermits] = useState(MOCK_PERMITS);
  const [showPermitModal, setShowPermitModal] = useState(false);
  const [permitForm, setPermitForm] = useState<PermitFormData>(defaultPermit);
  const [editPermitId, setEditPermitId] = useState<string | null>(null);

  // Toolbox Talks state
  const [talks, setTalks] = useState(MOCK_TOOLBOX_TALKS);
  const [showTalkModal, setShowTalkModal] = useState(false);
  const [talkForm, setTalkForm] = useState<TalkFormData>(defaultTalk);
  const [editTalkId, setEditTalkId] = useState<string | null>(null);
  const [uploadingPermit, setUploadingPermit] = useState<string | null>(null);
  const [uploadingTalk, setUploadingTalk] = useState<string | null>(null);

  // Bulk selection
  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} incident(s)?`)) return;
    try {
      await Promise.all(ids.map(id => deleteM.mutateAsync(id)));
      toast.success(`Deleted ${ids.length} incident(s)`);
      clearSelection();
    } catch {
      toast.error('Bulk delete failed');
    }
  }

  const TYPE_MAP: Record<string, string[]> = {
    all:          [],
    incidents:    ['incident','first_aid','riddor'],
    near_misses:  ['near-miss','near_miss'],
    hazards:      ['hazard','dangerous_occurrence','environmental'],
    mewp:         ['mewp-check','mewp_check'],
    toolbox:      ['toolbox-talk','toolbox_talk'],
    riddor:       ['riddor'],
  };

  const filtered = incidents
    .filter(i => {
      if (categoryTab !== 'all') {
        const types = TYPE_MAP[categoryTab] ?? [];
        return types.includes(String(i.type ?? ''));
      }
      return true;
    })
    .filter(i => filter === 'all' || i.status === filter || i.severity === filter)
    .filter(i => !search || String(i.title).toLowerCase().includes(search.toLowerCase()) ||
      String(i.project).toLowerCase().includes(search.toLowerCase()));

  const counts = {
    daysSinceIncident: 3,
    totalIncidentsYear: 12,
    openRiddorReports: incidents.filter(i => (i.riddor_reportable || i.type === 'riddor') && i.status !== 'closed').length,
    activePermits: permits.filter(p => p.status === 'Active').length,
    open: incidents.filter(i => i.status === 'open' || i.status === 'investigating' || i.status === 'action_required').length,
    critical: incidents.filter(i => i.severity === 'critical' || i.severity === 'serious').length,
    riddor: incidents.filter(i => i.riddor_reportable || i.type === 'riddor').length,
    closed: incidents.filter(i => i.status === 'closed' || i.status === 'resolved').length,
  };

  const selected = incidents.find(i => String(i.id) === selectedId);

  const openCreate = () => { setForm(defaultForm); setEditId(null); setShowModal(true); };
  const openEdit = (i: AnyRow) => {
    setForm({
      title: String(i.title??''), type: String(i.type??'near_miss'), severity: String(i.severity??'medium'),
      status: String(i.status??'open'), project: String(i.project??''), location: String(i.location??''),
      date: String(i.date??new Date().toISOString().split('T')[0]), description: String(i.description??''),
      immediate_action: String(i.immediate_action??''), injured_party: String(i.injured_party??''),
      reported_by_name: String(i.reported_by_name??i.reportedBy??''), riddor_reportable: Boolean(i.riddor_reportable),
      injury_type: String(i.injury_type??'None'), body_part_affected: String(i.body_part_affected??'Head'),
      days_lost: Number(i.days_lost??0), witness_name: String(i.witness_name??''),
      root_cause: String(i.root_cause??'Human Error'), corrective_action: String(i.corrective_action??''),
      target_closure_date: String(i.target_closure_date??''),
    });
    setEditId(String(i.id)); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) { await updateM.mutateAsync({ id: editId, data: form }); }
    else { await createM.mutateAsync(form); }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this incident record?')) return;
    await deleteM.mutateAsync(id); setSelectedId(null);
  };

  const handleSavePermit = () => {
    if (editPermitId) {
      setPermits(permits.map(p => p.id === editPermitId ? { ...permitForm, id: editPermitId } : p));
    } else {
      setPermits([...permits, { ...permitForm, id: String(Date.now()) }]);
    }
    setShowPermitModal(false);
    setPermitForm(defaultPermit);
    setEditPermitId(null);
  };

  const handleDeletePermit = (id: string) => {
    if (confirm('Delete this permit?')) {
      setPermits(permits.filter(p => p.id !== id));
    }
  };

  const handleSaveTalk = () => {
    if (editTalkId) {
      setTalks(talks.map(t => t.id === editTalkId ? { ...talkForm, id: editTalkId } : t));
    } else {
      setTalks([...talks, { ...talkForm, id: String(Date.now()) }]);
    }
    setShowTalkModal(false);
    setTalkForm(defaultTalk);
    setEditTalkId(null);
  };

  const handleDeleteTalk = (id: string) => {
    if (confirm('Delete this toolbox talk record?')) {
      setTalks(talks.filter(t => t.id !== id));
    }
  };

  const handleUploadPermitDoc = async (permitId: string, file: File) => {
    setUploadingPermit(permitId);
    try {
      await uploadFile(file, 'PERMITS');
      toast.success(`Uploaded: ${file.name}`);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploadingPermit(null);
    }
  };

  const handleUploadTalkDoc = async (talkId: string, file: File) => {
    setUploadingTalk(talkId);
    try {
      await uploadFile(file, 'REPORTS');
      toast.success(`Uploaded: ${file.name}`);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploadingTalk(null);
    }
  };

  const inp = "w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors";
  const lbl = "block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide";

  return (
    <div className="min-h-full space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Safety</h1>
          <p className="text-sm text-gray-400 mt-1">{incidents.length} records · {counts.open} open · {counts.riddor} RIDDOR reportable</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => refetch()} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
          {mainTab === 'incidents' && (
            <button type="button" onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white hover:from-red-500 transition-all shadow-lg shadow-red-500/20">
              <Plus className="w-4 h-4" /> Report Incident
            </button>
          )}
          {mainTab === 'permits' && (
            <button type="button" onClick={() => { setPermitForm(defaultPermit); setEditPermitId(null); setShowPermitModal(true); }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:from-blue-500 transition-all shadow-lg shadow-blue-500/20">
              <Plus className="w-4 h-4" /> New Permit
            </button>
          )}
          {mainTab === 'talks' && (
            <button type="button" onClick={() => { setTalkForm(defaultTalk); setEditTalkId(null); setShowTalkModal(true); }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white hover:from-emerald-500 transition-all shadow-lg shadow-emerald-500/20">
              <Plus className="w-4 h-4" /> New Talk
            </button>
          )}
        </div>
      </div>

      {/* Safety Stats KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Days Since Last Incident', value: counts.daysSinceIncident, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-emerald-600/5', border: 'border-emerald-800/40', icon: TrendingUp },
          { label: 'Total Incidents This Year', value: counts.totalIncidentsYear, color: 'text-orange-400', bg: 'from-orange-500/10 to-orange-600/5', border: 'border-orange-800/40', icon: AlertTriangle },
          { label: 'Open RIDDOR Reports', value: counts.openRiddorReports, color: 'text-purple-400', bg: 'from-purple-500/10 to-purple-600/5', border: 'border-purple-800/40', icon: FileText },
          { label: 'Active Permits', value: counts.activePermits, color: 'text-blue-400', bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-800/40', icon: CheckCircle2 },
        ].map(({ label, value, color, bg, border, icon: Icon }) => (
          <div key={label} className={clsx('rounded-2xl border bg-gradient-to-br p-5', bg, border)}>
            <div className="flex items-start justify-between">
              <div><p className="text-xs text-gray-400 mb-1">{label}</p><p className={clsx('text-3xl font-black', color)}>{value}</p></div>
              <div className="p-2 rounded-xl bg-gray-800/60"><Icon className={clsx('w-5 h-5', color)} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Tab Navigation */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
        {[
          { id: 'incidents', label: 'Incidents' },
          { id: 'permits', label: 'Permits' },
          { id: 'talks', label: 'Toolbox Talks' },
        ].map(t => (
          <button type="button"  key={t.id} onClick={() => setMainTab(t.id)}
            className={clsx('px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              mainTab === t.id ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* INCIDENTS TAB */}
      {mainTab === 'incidents' && (
        <div className="space-y-6">
          {/* Trend Chart */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="text-sm font-bold text-white mb-0.5">7-Month Safety Trend</h3>
            <p className="text-xs text-gray-500 mb-4">Incidents, near misses and toolbox talks</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={SAFETY_TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 10, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="incidents"    name="Incidents"      stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="nearMisses"   name="Near Misses"    stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="toolboxTalks" name="Toolbox Talks"  stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category sub-nav */}
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
            {[
              {id:'all',        label:'All Records'},
              {id:'incidents',  label:'Incidents'},
              {id:'near_misses',label:'Near Misses'},
              {id:'hazards',    label:'Hazards'},
              {id:'riddor',     label:'RIDDOR'},
            ].map(t => (
              <button type="button"  key={t.id} onClick={() => setCategoryTab(t.id)}
                className={clsx('px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  categoryTab===t.id ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800')}>
                {t.label}
                <span className={clsx('ml-1.5 text-xs', categoryTab===t.id ? 'text-red-200' : 'text-gray-600')}>
                  {t.id==='all' ? incidents.length
                    : incidents.filter(i => (TYPE_MAP[t.id]??[]).includes(String(i.type??''))).length}
                </span>
              </button>
            ))}
          </div>

          {/* Search + Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search incidents..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500" />
            </div>
            {['all','open','investigating','closed'].map(s => (
              <button type="button"  key={s} onClick={() => setFilter(s)}
                className={clsx('rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all capitalize',
                  filter===s ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700')}>
                {s==='all' ? 'All' : s}
              </button>
            ))}
          </div>

          {isLoading && <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>}

          {/* Incidents List */}
          <div className="space-y-3">
            {filtered.map(inc => {
              const sev = severityConfig[String(inc.severity)] ?? severityConfig.low;
              const stat = statusConfig[String(inc.status)] ?? statusConfig.open;
              const typeInfo = typeConfig[String(inc.type)] ?? { label: String(inc.type), icon: Shield };
              const TypeIcon = typeInfo.icon;
              const incId = String(inc.id);
              const isSelected = selectedIds.has(incId);
              return (
                <div key={incId}
                  className={clsx(
                    'rounded-2xl border bg-gray-900 p-5 cursor-pointer transition-all hover:border-gray-700',
                    selectedId === incId ? 'border-red-600/50 ring-1 ring-red-500/20' : 'border-gray-800',
                    isSelected && 'border-blue-500/50 ring-1 ring-blue-500/20'
                  )}
                  onClick={() => setSelectedId(prev => prev===incId?null:incId)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); toggle(incId); }}
                        className="flex-shrink-0 p-1 mt-1"
                      >
                        {isSelected ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
                      </button>
                      <div className={clsx('p-2 rounded-xl shrink-0', sev.bg)}>
                        <TypeIcon className={clsx('w-4 h-4', sev.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-white text-sm">{String(inc.title)}</h3>
                          {(inc.riddor_reportable || inc.type === 'riddor') && (
                            <span className="rounded-full bg-purple-500/20 border border-purple-600/40 px-2 py-0.5 text-xs font-bold text-purple-400">RIDDOR</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                          <span>{typeInfo.label}</span>
                          {!!inc.project && <span>{String(inc.project)}</span>}
                          {!!inc.date && <span>{String(inc.date)}</span>}
                          {(inc.reported_by_name || inc.reportedBy) ? <span>By: {String(inc.reported_by_name ?? inc.reportedBy)}</span> : null}
                        </div>
                        {selectedId === incId && !!inc.description && (
                          <p className="mt-2 text-xs text-gray-400 leading-relaxed">{String(inc.description)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={clsx('rounded-full px-2.5 py-1 text-xs font-bold', sev.bg, sev.color)}>{sev.label}</span>
                      <span className={clsx('text-xs font-semibold', stat.color)}>{stat.label}</span>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {selectedId === String(inc.id) && (
                    <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
                      {/* Timeline */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-300 mb-3 uppercase">Status Timeline</h4>
                        <div className="space-y-2">
                          {INCIDENT_TIMELINE.map((entry, idx) => (
                            <div key={idx} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                                {idx < INCIDENT_TIMELINE.length - 1 && <div className="w-0.5 h-6 bg-gray-700 mt-1"></div>}
                              </div>
                              <div className="flex-1 pb-2">
                                <p className="text-xs font-semibold text-gray-300">{entry.note}</p>
                                <p className="text-xs text-gray-500">{entry.date}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Corrective Actions */}
                      {Boolean(inc.corrective_action || inc.root_cause) && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-300 mb-2 uppercase">Root Cause & Corrective Actions</h4>
                          {Boolean(inc.root_cause) && (
                            <div className="mb-2 p-2 rounded-lg bg-gray-800/50 border border-gray-700">
                              <p className="text-xs text-gray-400">Root Cause</p>
                              <p className="text-sm text-gray-300">{String(inc.root_cause)}</p>
                            </div>
                          )}
                          {Boolean(inc.corrective_action) && (
                            <div className="p-2 rounded-lg bg-gray-800/50 border border-gray-700">
                              <p className="text-xs text-gray-400">Action Required</p>
                              <p className="text-sm text-gray-300">{String(inc.corrective_action)}</p>
                              {Boolean(inc.target_closure_date) && (
                                <p className="text-xs text-gray-500 mt-1">Target Closure: {String(inc.target_closure_date)}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-gray-800" onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={() => openEdit(inc)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 py-2 text-xs font-semibold text-white transition-colors">
                          <Edit2 className="w-3.5 h-3.5" /> Edit Record
                        </button>
                        {String(inc.status) !== 'closed' && (
                          <button type="button" onClick={() => updateM.mutateAsync({ id: String(inc.id), data: { status: 'closed' } })}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 py-2 text-xs font-semibold text-green-400 transition-colors">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Close Incident
                          </button>
                        )}
                        <button type="button" onClick={() => handleDelete(String(inc.id))}
                          className="rounded-xl bg-gray-800 hover:bg-red-900/20 px-3 py-2 text-red-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                <p className="font-medium">No incidents recorded</p>
                <button type="button" onClick={openCreate} className="mt-3 text-sm text-red-400 hover:text-red-300">+ Report an incident</button>
              </div>
            )}
          </div>
        </div>
      )}

      <BulkActionsBar
        selectedIds={Array.from(selectedIds)}
        actions={[
          { id: 'delete', label: 'Delete Selected', icon: Trash2, variant: 'danger', onClick: handleBulkDelete, confirm: 'This action cannot be undone.' },
          { id: 'close', label: 'Close Incidents', icon: CheckCircle2, variant: 'primary', onClick: async (ids) => { await Promise.all(ids.map(id => updateM.mutateAsync({ id, data: { status: 'closed' } }))); toast.success(`Closed ${ids.length} incident(s)`); clearSelection(); } },
        ]}
        onClearSelection={clearSelection}
      />

      {/* PERMITS TAB */}
      {mainTab === 'permits' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/50">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Permit No.</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Start Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">End Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Issued By</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {permits.map((permit) => (
                    <tr key={permit.id} className={clsx('border-b border-gray-800 transition-colors',
                      permit.status === 'Active' ? 'bg-green-500/5 hover:bg-green-500/10' : 'bg-red-500/5 hover:bg-red-500/10')}>
                      <td className="px-4 py-3 text-white font-semibold">{permit.permitNo}</td>
                      <td className="px-4 py-3 text-gray-300">{permit.type}</td>
                      <td className="px-4 py-3 text-gray-300">{permit.project}</td>
                      <td className="px-4 py-3 text-gray-300">{permit.location}</td>
                      <td className="px-4 py-3 text-gray-300">{permit.startDate}</td>
                      <td className="px-4 py-3 text-gray-300">{permit.endDate}</td>
                      <td className="px-4 py-3 text-gray-300">{permit.issuedBy}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('rounded-full px-2 py-1 text-xs font-bold',
                          permit.status === 'Active'
                            ? 'bg-green-500/20 text-green-400 border border-green-600/40'
                            : 'bg-red-500/20 text-red-400 border border-red-600/40')}>
                          {permit.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        <input
                          type="file"
                          id={`upload-permit-${permit.id}`}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) { await handleUploadPermitDoc(permit.id, file); e.target.value = ''; }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById(`upload-permit-${permit.id}`)?.click()}
                          disabled={uploadingPermit === permit.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-900/30 hover:bg-blue-900/50 px-2 py-1 text-xs text-blue-400 transition-colors disabled:opacity-50"
                        >
                          <Upload className="w-3 h-3" /> {uploadingPermit === permit.id ? '...' : 'Upload'}
                        </button>
                        <button type="button" onClick={() => { setPermitForm(permit); setEditPermitId(permit.id); setShowPermitModal(true); }}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-800 hover:bg-gray-700 px-2 py-1 text-xs text-white transition-colors">
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button type="button" onClick={() => handleDeletePermit(permit.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-900/20 hover:bg-red-900/30 px-2 py-1 text-xs text-red-400 transition-colors">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TOOLBOX TALKS TAB */}
      {mainTab === 'talks' && (
        <div className="space-y-3">
          {talks.map((talk) => (
            <div key={talk.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white text-sm">{talk.topic}</h3>
                    {talk.signedOff && (
                      <span className="rounded-full bg-green-500/20 border border-green-600/40 px-2 py-0.5 text-xs font-bold text-green-400">Signed Off</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span>{talk.date}</span>
                    <span>{talk.location}</span>
                    <span>By: {talk.presenter}</span>
                    <span>{talk.attendees} attendees</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <input
                    type="file"
                    id={`upload-talk-${talk.id}`}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) { await handleUploadTalkDoc(talk.id, file); e.target.value = ''; }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById(`upload-talk-${talk.id}`)?.click()}
                    disabled={uploadingTalk === talk.id}
                    className="rounded-xl bg-blue-900/30 hover:bg-blue-900/50 p-2 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                    title="Upload document"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => { setTalkForm(talk); setEditTalkId(talk.id); setShowTalkModal(true); }}
                    className="rounded-xl bg-gray-800 hover:bg-gray-700 p-2 text-gray-400 hover:text-white transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => handleDeleteTalk(talk.id)}
                    className="rounded-xl bg-gray-800 hover:bg-red-900/20 p-2 text-red-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Incident Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl my-4">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-white">{editId ? 'Edit Incident' : 'Report Incident'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Record safety incident with enhanced RIDDOR fields</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4 overflow-y-auto max-h-[70vh]">
              {/* Basic Info */}
              <div className="col-span-2">
                <label className={lbl}>Title *</label>
                <input required value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} placeholder="Brief description of the incident" className={inp} />
              </div>
              <div>
                <label className={lbl}>Type</label>
                <select value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))} className={inp}>
                  {Object.entries(typeConfig).slice(0,5).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Severity</label>
                <select value={form.severity} onChange={e => setForm(p=>({...p,severity:e.target.value}))} className={inp}>
                  {['low','medium','high','critical'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select value={form.status} onChange={e => setForm(p=>({...p,status:e.target.value}))} className={inp}>
                  {Object.keys(statusConfig).map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(p=>({...p,date:e.target.value}))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Project</label>
                <input value={form.project} onChange={e => setForm(p=>({...p,project:e.target.value}))} placeholder="Project name" className={inp} />
              </div>
              <div>
                <label className={lbl}>Location</label>
                <input value={form.location} onChange={e => setForm(p=>({...p,location:e.target.value}))} placeholder="e.g. Level 7, Grid C4" className={inp} />
              </div>
              <div>
                <label className={lbl}>Reported By</label>
                <input value={form.reported_by_name} onChange={e => setForm(p=>({...p,reported_by_name:e.target.value}))} placeholder="Name" className={inp} />
              </div>
              <div>
                <label className={lbl}>Injured Party (if any)</label>
                <input value={form.injured_party} onChange={e => setForm(p=>({...p,injured_party:e.target.value}))} placeholder="Name / N/A" className={inp} />
              </div>
              <div>
                <label className={lbl}>Witness Name</label>
                <input value={form.witness_name} onChange={e => setForm(p=>({...p,witness_name:e.target.value}))} placeholder="Name / N/A" className={inp} />
              </div>

              {/* RIDDOR Fields */}
              <div>
                <label className={lbl}>Injury Type</label>
                <select value={form.injury_type} onChange={e => setForm(p=>({...p,injury_type:e.target.value}))} className={inp}>
                  {['None','Cut/Laceration','Fracture','Bruising','Burns','Eye Injury','Fatality','Ill Health'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Body Part Affected</label>
                <select value={form.body_part_affected} onChange={e => setForm(p=>({...p,body_part_affected:e.target.value}))} className={inp}>
                  {['Head','Hand','Foot','Back','Eye','Multiple'].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Days Lost from Work</label>
                <input type="number" value={form.days_lost} onChange={e => setForm(p=>({...p,days_lost:Number(e.target.value)}))} placeholder="0" className={inp} />
              </div>
              <div>
                <label className={lbl}>Root Cause</label>
                <select value={form.root_cause} onChange={e => setForm(p=>({...p,root_cause:e.target.value}))} className={inp}>
                  {['Human Error','Equipment Failure','Environmental','Procedure Not Followed','Inadequate Training'].map(rc => <option key={rc} value={rc}>{rc}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={lbl}>Target Closure Date</label>
                <input type="date" value={form.target_closure_date} onChange={e => setForm(p=>({...p,target_closure_date:e.target.value}))} className={inp} />
              </div>

              {/* Descriptions */}
              <div className="col-span-2">
                <label className={lbl}>Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))}
                  placeholder="What happened? Include sequence of events..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors resize-none" />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Immediate Action Taken</label>
                <textarea rows={2} value={form.immediate_action} onChange={e => setForm(p=>({...p,immediate_action:e.target.value}))}
                  placeholder="Steps taken immediately after the incident..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors resize-none" />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Corrective Action Required</label>
                <textarea rows={2} value={form.corrective_action} onChange={e => setForm(p=>({...p,corrective_action:e.target.value}))}
                  placeholder="Actions required to prevent recurrence..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors resize-none" />
              </div>
              <div className="col-span-2 flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-600/30">
                <input type="checkbox" id="riddor" checked={form.riddor_reportable}
                  onChange={e => setForm(p=>({...p,riddor_reportable:e.target.checked}))}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500" />
                <label htmlFor="riddor" className="text-sm text-purple-300 cursor-pointer">
                  <span className="font-bold">RIDDOR reportable</span> — must be reported to HSE within 10 days
                </label>
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl bg-gray-800 hover:bg-gray-700 py-3 text-sm font-semibold text-gray-300 transition-colors">Cancel</button>
                <button type="submit" disabled={createM.isPending||updateM.isPending}
                  className="flex-[2] rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 py-3 text-sm font-bold text-white transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {(createM.isPending||updateM.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editId ? 'Save Changes' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permit Modal */}
      {showPermitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl my-4">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-white">{editPermitId ? 'Edit Permit' : 'New Permit to Work'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Create or edit a Permit to Work</p>
              </div>
              <button type="button" onClick={() => setShowPermitModal(false)} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSavePermit(); }} className="p-6 grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Permit No. *</label>
                <input required value={permitForm.permitNo} onChange={e => setPermitForm(p=>({...p,permitNo:e.target.value}))} placeholder="e.g. HW-2026-001" className={inp} />
              </div>
              <div>
                <label className={lbl}>Type *</label>
                <select value={permitForm.type} onChange={e => setPermitForm(p=>({...p,type:e.target.value}))} className={inp}>
                  {['Hot Works','Confined Space','Excavation','MEWP','Electrical Isolation'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Project</label>
                <input value={permitForm.project} onChange={e => setPermitForm(p=>({...p,project:e.target.value}))} placeholder="Project name" className={inp} />
              </div>
              <div>
                <label className={lbl}>Location</label>
                <input value={permitForm.location} onChange={e => setPermitForm(p=>({...p,location:e.target.value}))} placeholder="Site location" className={inp} />
              </div>
              <div>
                <label className={lbl}>Start Date *</label>
                <input required type="date" value={permitForm.startDate} onChange={e => setPermitForm(p=>({...p,startDate:e.target.value}))} className={inp} />
              </div>
              <div>
                <label className={lbl}>End Date *</label>
                <input required type="date" value={permitForm.endDate} onChange={e => setPermitForm(p=>({...p,endDate:e.target.value}))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Issued By</label>
                <input value={permitForm.issuedBy} onChange={e => setPermitForm(p=>({...p,issuedBy:e.target.value}))} placeholder="Name" className={inp} />
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select value={permitForm.status} onChange={e => setPermitForm(p=>({...p,status:e.target.value}))} className={inp}>
                  {['Active','Expired','Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPermitModal(false)}
                  className="flex-1 rounded-xl bg-gray-800 hover:bg-gray-700 py-3 text-sm font-semibold text-gray-300 transition-colors">Cancel</button>
                <button type="submit"
                  className="flex-[2] rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 py-3 text-sm font-bold text-white transition-all shadow-lg shadow-blue-500/20">
                  {editPermitId ? 'Save Permit' : 'Create Permit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toolbox Talk Modal */}
      {showTalkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl my-4">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-white">{editTalkId ? 'Edit Toolbox Talk' : 'Record Toolbox Talk'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Log a new toolbox talk or safety briefing</p>
              </div>
              <button type="button" onClick={() => setShowTalkModal(false)} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveTalk(); }} className="p-6 grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Date *</label>
                <input required type="date" value={talkForm.date} onChange={e => setTalkForm(p=>({...p,date:e.target.value}))} className={inp} />
              </div>
              <div>
                <label className={lbl}>Topic *</label>
                <input required value={talkForm.topic} onChange={e => setTalkForm(p=>({...p,topic:e.target.value}))} placeholder="Talk topic" className={inp} />
              </div>
              <div>
                <label className={lbl}>Location</label>
                <input value={talkForm.location} onChange={e => setTalkForm(p=>({...p,location:e.target.value}))} placeholder="e.g. Site Induction Room" className={inp} />
              </div>
              <div>
                <label className={lbl}>Presenter</label>
                <input value={talkForm.presenter} onChange={e => setTalkForm(p=>({...p,presenter:e.target.value}))} placeholder="Name" className={inp} />
              </div>
              <div>
                <label className={lbl}>Attendees</label>
                <input type="number" value={talkForm.attendees} onChange={e => setTalkForm(p=>({...p,attendees:Number(e.target.value)}))} placeholder="0" className={inp} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={talkForm.signedOff}
                    onChange={e => setTalkForm(p=>({...p,signedOff:e.target.checked}))}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500" />
                  <span className="text-sm text-gray-300">Signed Off</span>
                </label>
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTalkModal(false)}
                  className="flex-1 rounded-xl bg-gray-800 hover:bg-gray-700 py-3 text-sm font-semibold text-gray-300 transition-colors">Cancel</button>
                <button type="submit"
                  className="flex-[2] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 py-3 text-sm font-bold text-white transition-all shadow-lg shadow-emerald-500/20">
                  {editTalkId ? 'Save Talk' : 'Record Talk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
