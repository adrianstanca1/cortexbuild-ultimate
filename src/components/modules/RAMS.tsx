import { useState } from 'react';
import { Shield, Plus, Search, AlertTriangle, CheckCircle2, FileText, Users, ClipboardCheck, Eye, X, ChevronRight, Lock, Unlock, Edit2, Trash2, Clock } from 'lucide-react';
import { useRAMS } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STATUS_OPTIONS = ['Draft', 'Under Review', 'Approved', 'Expired', 'Superseded'];
const ACTIVITY_TYPES = ['Groundworks', 'Structural Steel', 'Concrete Works', 'Roofing', 'Scaffolding', 'Electrical', 'Plumbing', 'MEWP Operations', 'Demolition', 'Excavation', 'Working at Height', 'Hot Works', 'Confined Space'];
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const PROJECTS = ['Project Alpha', 'Project Beta', 'Project Gamma', 'Project Delta'];

const statusColour: Record<string, string> = {
  'Draft': 'bg-gray-700/50 text-gray-300',
  'Under Review': 'bg-yellow-900/50 text-yellow-300',
  'Approved': 'bg-green-900/50 text-green-300',
  'Expired': 'bg-red-900/50 text-red-300',
  'Superseded': 'bg-gray-700/50 text-gray-400',
};

const riskColour: Record<string, string> = {
  'Low': 'bg-green-900/30 text-green-300',
  'Medium': 'bg-yellow-900/30 text-yellow-300',
  'High': 'bg-orange-900/30 text-orange-300',
  'Critical': 'bg-red-900/30 text-red-300',
};

const riskBgColour: Record<string, string> = {
  'Low': 'bg-green-900/10 border-green-700/50',
  'Medium': 'bg-yellow-900/10 border-yellow-700/50',
  'High': 'bg-orange-900/10 border-orange-700/50',
  'Critical': 'bg-red-900/10 border-red-700/50',
};

const emptyForm = {
  title: '', activity_type: '', project_id: '', risk_level: 'Medium', status: 'Draft',
  reviewed_by: '', approved_by: '', valid_from: '', valid_until: '', hazards: '', controls: '', ppe_required: '', notes: ''
};

interface HazardRow {
  id: string;
  hazard: string;
  atrisk: string;
  likelihood: number;
  severity: number;
  controls: string;
}

interface MethodStep {
  id: string;
  step: number;
  description: string;
}

export function RAMS() {
  const { useList, useCreate, useUpdate, useDelete } = useRAMS;
  const { data: raw = [], isLoading } = useList();
  const rams = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [activeTab, setActiveTab] = useState('library');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [detailsOpen, setDetailsOpen] = useState<string | null>(null);

  const [hazardRows, setHazardRows] = useState<HazardRow[]>([
    { id: '1', hazard: 'Fall from height', atrisk: 'All workers', likelihood: 4, severity: 5, controls: 'Safety harness, guardrails' }
  ]);
  const [methodSteps, setMethodSteps] = useState<MethodStep[]>([
    { id: '1', step: 1, description: 'Conduct site induction' }
  ]);
  const [hazardTemplate, setHazardTemplate] = useState({ title: '', project: '' });

  const filtered = rams.filter(r => {
    const title = String(r.title ?? '').toLowerCase();
    const activity = String(r.activity_type ?? '').toLowerCase();
    const matchSearch = title.includes(search.toLowerCase()) || activity.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchProject = projectFilter === 'All' || r.project_id === projectFilter;
    return matchSearch && matchStatus && matchProject;
  });

  const totalCount = rams.length;
  const approvedCount = rams.filter(r => r.status === 'Approved').length;
  const reviewCount = rams.filter(r => r.status === 'Under Review').length;
  const signatureCount = rams.filter(r => {
    const sigs = String(r.signatures ?? '0/0').split('/');
    return parseInt(sigs[0]) < parseInt(sigs[1]);
  }).length;

  const getRiskScore = (likelihood: number, severity: number): number => likelihood * severity;
  const getRiskLevel = (score: number): string => {
    if (score <= 4) return 'Low';
    if (score <= 12) return 'Medium';
    if (score <= 16) return 'High';
    return 'Critical';
  };

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  }

  function openEdit(r: AnyRow) {
    setEditing(r);
    setForm({
      title: String(r.title ?? ''), activity_type: String(r.activity_type ?? ''), project_id: String(r.project_id ?? ''),
      risk_level: String(r.risk_level ?? 'Medium'), status: String(r.status ?? 'Draft'), reviewed_by: String(r.reviewed_by ?? ''),
      approved_by: String(r.approved_by ?? ''), valid_from: String(r.valid_from ?? ''), valid_until: String(r.valid_until ?? ''),
      hazards: String(r.hazards ?? ''), controls: String(r.controls ?? ''), ppe_required: String(r.ppe_required ?? ''), notes: String(r.notes ?? '')
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await updateMutation.mutateAsync({ id: String(editing.id), data: form });
      toast.success('RAMS updated');
    } else {
      await createMutation.mutateAsync(form);
      toast.success('RAMS created');
    }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this RAMS document?')) return;
    await deleteMutation.mutateAsync(id);
    toast.success('RAMS deleted');
  }

  async function approve(r: AnyRow) {
    await updateMutation.mutateAsync({ id: String(r.id), data: { status: 'Approved' } });
    toast.success('RAMS approved');
  }

  function addHazardRow() {
    setHazardRows([...hazardRows, { id: Date.now().toString(), hazard: '', atrisk: '', likelihood: 3, severity: 3, controls: '' }]);
  }

  function removeHazardRow(id: string) {
    setHazardRows(hazardRows.filter(r => r.id !== id));
  }

  function addMethodStep() {
    const newStep = Math.max(...methodSteps.map(s => s.step), 0) + 1;
    setMethodSteps([...methodSteps, { id: Date.now().toString(), step: newStep, description: '' }]);
  }

  function removeMethodStep(id: string) {
    const remaining = methodSteps.filter(r => r.id !== id).map((s, i) => ({ ...s, step: i + 1 }));
    setMethodSteps(remaining);
  }

  async function saveHazardTemplate() {
    if (!hazardTemplate.title) { toast.error('Template name required'); return; }
    const templateData = {
      title: hazardTemplate.title, project_id: hazardTemplate.project, status: 'Draft', activity_type: 'Custom',
      hazards: JSON.stringify(hazardRows), controls: JSON.stringify(methodSteps), ppe_required: ''
    };
    await createMutation.mutateAsync(templateData);
    toast.success('RAMS template saved');
    setHazardTemplate({ title: '', project: '' });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">RAMS</h1>
          <p className="text-sm text-gray-400 mt-1">Risk Assessment & Method Statements</p>
        </div>
        {activeTab === 'library' && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
            <Plus size={16} /><span>New RAMS</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total RAMS', value: totalCount, icon: Shield, colour: 'text-blue-400', bg: 'bg-blue-900/30' },
          { label: 'Approved', value: approvedCount, icon: CheckCircle2, colour: 'text-green-400', bg: 'bg-green-900/30' },
          { label: 'Pending Review', value: reviewCount, icon: Clock, colour: 'text-yellow-400', bg: 'bg-yellow-900/30' },
          { label: 'Signatures Outstanding', value: signatureCount, icon: FileText, colour: 'text-orange-400', bg: 'bg-orange-900/30' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour} /></div>
              <div><p className="text-xs text-gray-400">{kpi.label}</p><p className="text-xl font-bold text-gray-100">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-gray-700">
        {[
          { key: 'library', label: 'RAMS Library', icon: FileText },
          { key: 'hazard', label: 'Hazard Builder', icon: AlertTriangle },
          { key: 'compliance', label: 'Compliance', icon: ClipboardCheck },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === t.key ? 'border-orange-600 text-orange-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
          >
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      {activeTab === 'library' && (
        <>
          <div className="flex flex-wrap gap-3 items-center bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or activity…" className="w-full pl-9 pr-4 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500">
              {['All', ...STATUS_OPTIONS].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="text-sm bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500">
              {['All', ...PROJECTS].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" /></div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.length === 0 && <div className="col-span-full text-center py-16 text-gray-400"><Shield size={40} className="mx-auto mb-3 opacity-30" /><p>No RAMS documents found</p></div>}
              {filtered.map(r => {
                const id = String(r.id ?? '');
                const hazardCount = String(r.hazards ?? '').split('\n').filter(Boolean).length || 0;
                const ppe = String(r.ppe_required ?? '').split(',').filter(Boolean);
                const sigs = String(r.signatures ?? '0/0').split('/');
                return (
                  <div key={id} className={`bg-gray-800 rounded-xl border border-gray-700 p-4 ${riskBgColour[String(r.risk_level ?? 'Low')]}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-100">{String(r.title ?? 'Untitled')}</p>
                        <p className="text-xs text-gray-400 mt-1">{String(r.project_id ?? 'No project')}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(r.status ?? '')]}`}>{String(r.status ?? '')}</span>
                    </div>
                    <div className="space-y-2 mb-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2"><Shield size={14} /><span>{String(r.activity_type ?? 'N/A')}</span></div>
                      <div className="flex items-center gap-2"><AlertTriangle size={14} /><span>{hazardCount} hazards</span></div>
                      <div className="flex items-center gap-2"><Users size={14} /><span>{ppe.length} PPE items</span></div>
                      <div className="flex items-center gap-2"><CheckCircle2 size={14} /><span>{sigs[0]}/{sigs[1]} signatures</span></div>
                    </div>
                    {!!r.valid_until && <p className="text-xs text-gray-500 mb-4">Expires: {String(r.valid_until)}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => setDetailsOpen(detailsOpen === String(id) ? null : String(id))} className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded-lg">
                        <Eye size={14} className="inline mr-1" />View
                      </button>
                      <button onClick={() => openEdit(r)} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 rounded"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(String(id))} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded"><Trash2 size={14} /></button>
                    </div>
                    {detailsOpen === String(id) && (
                      <div className="mt-4 pt-4 border-t border-gray-700 space-y-3 text-sm">
                        {!!r.hazards && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Hazards</p><p className="text-gray-200 text-xs whitespace-pre-wrap">{String(r.hazards).substring(0, 100)}...</p></div>}
                        {!!r.controls && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Controls</p><p className="text-gray-200 text-xs whitespace-pre-wrap">{String(r.controls).substring(0, 100)}...</p></div>}
                        {ppe.length > 0 && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">PPE</p><p className="text-gray-200 text-xs">{ppe.join(', ')}</p></div>}
                        <div className="flex gap-4 text-xs">
                          {!!r.reviewed_by && <div><p className="text-gray-400">Reviewed</p><p className="text-gray-200">{String(r.reviewed_by)}</p></div>}
                          {!!r.approved_by && <div><p className="text-gray-400">Approved</p><p className="text-gray-200">{String(r.approved_by)}</p></div>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'hazard' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-700/50 border-b border-gray-700">
                    <th className="px-4 py-3 text-left text-gray-300 font-semibold">Hazard</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-semibold">Who is at Risk</th>
                    <th className="px-4 py-3 text-center text-gray-300 font-semibold">Likelihood</th>
                    <th className="px-4 py-3 text-center text-gray-300 font-semibold">Severity</th>
                    <th className="px-4 py-3 text-center text-gray-300 font-semibold">Risk Score</th>
                    <th className="px-4 py-3 text-center text-gray-300 font-semibold">Risk Level</th>
                    <th className="px-4 py-3 text-left text-gray-300 font-semibold">Controls</th>
                    <th className="px-4 py-3 text-center text-gray-300 font-semibold w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {hazardRows.map(row => {
                    const score = getRiskScore(row.likelihood, row.severity);
                    const level = getRiskLevel(score);
                    return (
                      <tr key={row.id} className={`hover:bg-gray-700/30 ${riskBgColour[level]}`}>
                        <td className="px-4 py-3"><input value={row.hazard} onChange={e => setHazardRows(hazardRows.map(r => r.id === row.id ? { ...r, hazard: e.target.value } : r))} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500" /></td>
                        <td className="px-4 py-3"><input value={row.atrisk} onChange={e => setHazardRows(hazardRows.map(r => r.id === row.id ? { ...r, atrisk: e.target.value } : r))} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500" /></td>
                        <td className="px-4 py-3 text-center"><input type="number" min="1" max="5" value={row.likelihood} onChange={e => setHazardRows(hazardRows.map(r => r.id === row.id ? { ...r, likelihood: parseInt(e.target.value) || 3 } : r))} className="w-12 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-100 text-xs text-center focus:outline-none focus:ring-2 focus:ring-orange-500" /></td>
                        <td className="px-4 py-3 text-center"><input type="number" min="1" max="5" value={row.severity} onChange={e => setHazardRows(hazardRows.map(r => r.id === row.id ? { ...r, severity: parseInt(e.target.value) || 3 } : r))} className="w-12 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-100 text-xs text-center focus:outline-none focus:ring-2 focus:ring-orange-500" /></td>
                        <td className="px-4 py-3 text-center font-semibold text-gray-100">{score}</td>
                        <td className="px-4 py-3 text-center"><span className={`text-xs px-2 py-1 rounded font-semibold ${riskColour[level]}`}>{level}</span></td>
                        <td className="px-4 py-3"><input value={row.controls} onChange={e => setHazardRows(hazardRows.map(r => r.id === row.id ? { ...r, controls: e.target.value } : r))} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500" /></td>
                        <td className="px-4 py-3 text-center"><button onClick={() => removeHazardRow(row.id)} className="p-1 text-red-400 hover:bg-red-900/30 rounded"><X size={14} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-700 bg-gray-700/20">
              <button onClick={addHazardRow} className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium">
                <Plus size={14} />Add Hazard Row
              </button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Method Statement</h3>
            <div className="space-y-3">
              {methodSteps.map(step => (
                <div key={step.id} className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white font-semibold text-sm">{step.step}</div>
                  <input value={step.description} onChange={e => setMethodSteps(methodSteps.map(s => s.id === step.id ? { ...s, description: e.target.value } : s))} placeholder="Describe the method step…" className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  <button onClick={() => removeMethodStep(step.id)} className="p-2 text-red-400 hover:bg-red-900/30 rounded"><X size={14} /></button>
                </div>
              ))}
            </div>
            <button onClick={addMethodStep} className="mt-4 flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium">
              <Plus size={14} />Add Step
            </button>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Save as RAMS Template</h3>
            <div className="grid grid-cols-2 gap-4">
              <input value={hazardTemplate.title} onChange={e => setHazardTemplate({ ...hazardTemplate, title: e.target.value })} placeholder="Template name…" className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              <select value={hazardTemplate.project} onChange={e => setHazardTemplate({ ...hazardTemplate, project: e.target.value })} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select project…</option>{PROJECTS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <button onClick={saveHazardTemplate} className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
              <CheckCircle2 size={14} className="inline mr-2" />Save Template
            </button>
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-700/50 border-b border-gray-700">
                  <th className="px-6 py-3 text-left text-gray-300 font-semibold">RAMS Title</th>
                  <th className="px-6 py-3 text-left text-gray-300 font-semibold">Project</th>
                  <th className="px-6 py-3 text-left text-gray-300 font-semibold">Expires</th>
                  <th className="px-6 py-3 text-center text-gray-300 font-semibold">Signatures</th>
                  <th className="px-6 py-3 text-center text-gray-300 font-semibold">Completion</th>
                  <th className="px-6 py-3 text-left text-gray-300 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map(r => {
                  const sigs = String(r.signatures ?? '0/0').split('/');
                  const sigCount = parseInt(sigs[0]);
                  const sigTotal = parseInt(sigs[1]);
                  const progress = sigTotal > 0 ? (sigCount / sigTotal) * 100 : 0;
                  const now = new Date();
                  const expiry = r.valid_until ? new Date(String(r.valid_until)) : null;
                  const daysLeft = expiry ? Math.floor((expiry.getTime() - now.getTime()) / 86400000) : null;
                  const isOverdue = daysLeft !== null && daysLeft < 0;
                  const isExpiring = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;

                  return (
                    <tr key={String(r.id)} className="hover:bg-gray-700/30">
                      <td className="px-6 py-3 text-gray-100 font-medium">{String(r.title ?? '')}</td>
                      <td className="px-6 py-3 text-gray-400">{String(r.project_id ?? 'N/A')}</td>
                      <td className="px-6 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${isOverdue ? 'bg-red-900/50 text-red-300' : isExpiring ? 'bg-yellow-900/50 text-yellow-300' : 'text-gray-400'}`}>{r.valid_until ? String(r.valid_until) : 'N/A'}</span></td>
                      <td className="px-6 py-3 text-center text-gray-100">{sigCount}/{sigTotal}</td>
                      <td className="px-6 py-3">
                        <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full ${progress === 100 ? 'bg-green-600' : progress > 50 ? 'bg-yellow-600' : 'bg-red-600'}`} style={{ width: `${progress}%` }}></div>
                        </div>
                      </td>
                      <td className="px-6 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(r.status ?? '')]}`}>{String(r.status ?? '')}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center py-16 text-gray-400 col-span-full"><Shield size={40} className="mx-auto mb-3 opacity-30" /><p>No RAMS documents found</p></div>}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <h2 className="text-lg font-semibold text-gray-100">{editing ? 'Edit RAMS' : 'New RAMS Document'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-700 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Document Title *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Activity Type</label>
                  <select value={form.activity_type} onChange={e => setForm(f => ({ ...f, activity_type: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select…</option>{ACTIVITY_TYPES.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Project</label>
                  <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select…</option>{PROJECTS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Risk Level</label>
                  <select value={form.risk_level} onChange={e => setForm(f => ({ ...f, risk_level: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {RISK_LEVELS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Reviewed By</label>
                  <input value={form.reviewed_by} onChange={e => setForm(f => ({ ...f, reviewed_by: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Approved By</label>
                  <input value={form.approved_by} onChange={e => setForm(f => ({ ...f, approved_by: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Valid From</label>
                  <input type="date" value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Valid Until</label>
                  <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Hazards Identified</label>
                  <textarea rows={3} value={form.hazards} onChange={e => setForm(f => ({ ...f, hazards: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Control Measures</label>
                  <textarea rows={3} value={form.controls} onChange={e => setForm(f => ({ ...f, controls: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">PPE Required</label>
                  <input value={form.ppe_required} onChange={e => setForm(f => ({ ...f, ppe_required: e.target.value }))} placeholder="e.g. Hard hat, Hi-vis, Safety boots, Gloves" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-sm text-gray-300 hover:bg-gray-700">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing ? 'Update RAMS' : 'Create RAMS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
