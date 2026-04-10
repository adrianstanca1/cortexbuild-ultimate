import { useState, useRef } from 'react';
import { Shield, Plus, Search, FileCheck, AlertTriangle, Clock, CheckCircle, Edit2, Trash2, X, ChevronDown, ChevronUp, Download, Award, Upload, CheckSquare, Square, PenLine } from 'lucide-react';
import { DataImporter, ExportButton } from '../ui/DataImportExport';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { useRAMS } from '../../hooks/useData';
import { uploadFile, signaturesApi } from '../../services/api';
import { EmptyState } from '../ui/EmptyState';
import { SignatureCapture, SignatureDisplay } from '../ui/SignatureCapture';
import { toast } from 'sonner';
import { z } from 'zod';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { useAuth } from '../../context/AuthContext';
import type { Signature } from '../../services/api';

type AnyRow = Record<string, unknown>;

const ramsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  activity: z.string().min(1, 'Activity is required'),
  project_id: z.string().optional(),
  doc_type: z.enum(['RAMS', 'Method Statement', 'Risk Assessment']).optional(),
  status: z.enum(['Draft', 'Under Review', 'Approved', 'Superseded']).optional(),
  reviewed_by: z.string().optional(),
  approved_by: z.string().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  hazards: z.string().optional(),
  controls: z.string().optional(),
  ppe: z.string().optional(),
  version: z.string().optional(),
  created_by: z.string().optional(),
  review_date: z.string().optional(),
  likelihood: z.union([z.string(), z.number()]).optional(),
  severity: z.union([z.string(), z.number()]).optional(),
  notes: z.string().optional(),
});

const STATUS_OPTIONS = ['Draft','Under Review','Approved','Superseded'];
const DOCUMENT_TYPES = ['RAMS','Method Statement','Risk Assessment'];
const ACTIVITY_TYPES = ['Groundworks','Structural Steel','Concrete Works','Roofing','Scaffolding','Electrical','Plumbing','MEWP Operations','Demolition','Excavation','Working at Height','Hot Works','Confined Space'];
const HAZARD_LEVELS = [1, 2, 3, 4, 5];

const statusColour: Record<string,string> = {
  'Draft':'bg-gray-700 text-gray-400','Under Review':'bg-yellow-500/20 text-yellow-400',
  'Approved':'bg-green-500/20 text-green-400','Superseded':'bg-gray-700 text-gray-500',
};

const emptyForm = { title:'',activity:'',project_id:'',doc_type:'RAMS',status:'Draft',reviewed_by:'',approved_by:'',valid_from:'',valid_until:'',hazards:'',controls:'',ppe:'',version:'1',created_by:'',review_date:'',likelihood:'3',severity:'3',notes:'' };

const TEMPLATES = [
  { name: 'Excavation', activity: 'Excavation', hazards: 'Collapse, Struck by equipment, Utilities damage' },
  { name: 'Working at Height', activity: 'Working at Height', hazards: 'Falls, Dropped objects, Weather exposure' },
  { name: 'Electrical', activity: 'Electrical', hazards: 'Electric shock, Arc flash, Electrocution' },
  { name: 'Demolition', activity: 'Demolition', hazards: 'Structural collapse, Dust inhalation, Asbestos' },
  { name: 'Hot Works', activity: 'Hot Works', hazards: 'Fire, Explosions, Thermal burns' },
  { name: 'Confined Space', activity: 'Confined Space', hazards: 'Oxygen depletion, Gas poisoning, Entrapment' },
  { name: 'Manual Handling', activity: 'Excavation', hazards: 'Back injury, Repetitive strain, Muscle damage' },
];

export function RAMS() {
  const { useList, useCreate, useUpdate, useDelete } = useRAMS;
  const { data: raw = [], isLoading } = useList();
  const rams = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState<'documents'|'method_statements'|'risk_assessments'|'templates'|'approvals'>('documents');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const _fileInputRef = useRef<HTMLInputElement>(null);
  const [_selectedUploadId, _setSelectedUploadId] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signingDoc, setSigningDoc] = useState<AnyRow | null>(null);
  const [existingSignatures, setExistingSignatures] = useState<Signature[]>([]);

  const { user } = useAuth();

  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} RAMS document(s)?`)) return;
    try {
      await Promise.all(ids.map(id => deleteMutation.mutateAsync(id)));
      toast.success(`Deleted ${ids.length} document(s)`);
      clearSelection();
    } catch {
      toast.error('Bulk delete failed');
    }
  }

  async function handleBulkApprove(ids: string[]) {
    try {
      await Promise.all(ids.map(id => updateMutation.mutateAsync({ id, data: { status: 'Approved' } })));
      toast.success(`Approved ${ids.length} document(s)`);
      clearSelection();
    } catch {
      toast.error('Bulk approve failed');
    }
  }

  const filtered = rams.filter(r => {
    const title = String(r.title ?? '').toLowerCase();
    const activity = String(r.activity ?? '').toLowerCase();
    const matchSearch = title.includes(search.toLowerCase()) || activity.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const approvedCount = rams.filter(r => r.status === 'Approved').length;
  const reviewCount = rams.filter(r => r.status === 'Under Review').length;
  const _draftCount = rams.filter(r => r.status === 'Draft').length;
  const expiringSoon = rams.filter(r => {
    const until = r.validUntil;
    if (!until || r.status !== 'Approved') return false;
    const diff = (new Date(String(until)).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 30;
  }).length;

  const riskAssessments = rams.filter(r => r.doc_type === 'Risk Assessment' || !r.doc_type);

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(r: AnyRow) {
    setEditing(r);
    setForm({
      title: String(r.title ?? ''),
      activity: String(r.activity ?? ''),
      project_id: String(r.project_id ?? ''),
      doc_type: String(r.doc_type ?? 'RAMS'),
      status: String(r.status ?? 'Draft'),
      reviewed_by: String(r.reviewed_by ?? ''),
      approved_by: String(r.approved_by ?? ''),
      valid_from: String(r.valid_from ?? ''),
      valid_until: String(r.valid_until ?? ''),
      hazards: String(r.hazards ?? ''),
      controls: String(r.controls ?? ''),
      ppe: String(r.ppe ?? ''),
      version: String(r.version ?? '1'),
      created_by: String(r.created_by ?? ''),
      review_date: String(r.review_date ?? ''),
      likelihood: String(r.likelihood ?? '3'),
      severity: String(r.severity ?? '3'),
      notes: String(r.notes ?? ''),
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = ramsSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
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

  function applyTemplate(template: typeof TEMPLATES[0]) {
    setEditing(null);
    setForm({
      ...emptyForm,
      activity: template.activity,
      hazards: template.hazards,
    });
    setShowModal(true);
  }

  async function handleUploadDoc(ramId: string, file: File) {
    setUploading(ramId);
    try {
      const _result = await uploadFile(file, 'RAMS');
      toast.success(`Document uploaded: ${file.name}`);
    } catch {
      console.error('Upload failed');
      toast.error('Upload failed');
    } finally {
      setUploading(null);
    }
  }

  async function openSignModal(r: AnyRow) {
    setSigningDoc(r);
    setShowSignModal(true);
    try {
      const res = await signaturesApi.getByDocument('rams', String(r.id));
      setExistingSignatures(Array.isArray(res.data) ? res.data : []);
    } catch {
      setExistingSignatures([]);
    }
  }

  async function handleSignature(signatureData: string) {
    if (!signingDoc || !user) return;
    try {
      await signaturesApi.create({
        document_type: 'rams',
        document_id: String(signingDoc.id),
        signer_name: user.name || user.email || 'Unknown',
        signer_role: user.role || 'RAMS Approver',
        signer_email: user.email,
        signature_data: signatureData,
      });
      toast.success('Document signed successfully');
      setShowSignModal(false);
      setSigningDoc(null);
    } catch {
      toast.error('Failed to save signature');
    }
  }

  async function handleBulkImport(data: Record<string, unknown>[], mapping: { source: string; target: string }[]) {
    let failed = 0;
    for (const row of data) {
      const mapped: Record<string, unknown> = {};
      mapping.forEach(m => { if (m.target) mapped[m.target] = row[m.source]; });
      try { await createMutation.mutateAsync(mapped); } catch { failed++; }
    }
    if (failed > 0) toast.error(`${failed} row(s) failed to import`);
    toast.success(`${data.length - failed} RAMS document(s) imported`);
  }

  const inputCls = 'w-full input input-bordered w-full placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500';
  const labelCls = 'block text-sm font-medium text-gray-300 mb-1';

  return (
    <>
      <ModuleBreadcrumbs currentModule="rams" onNavigate={() => {}} />
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">RAMS</h1>
          <p className="text-sm text-gray-400 mt-1">Risk assessments, method statements & approvals</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowBulkImport(true)} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm font-medium">
            <Download size={16}/><span>Import</span>
          </button>
          <ExportButton data={rams} filename="rams" />
          <button type="button" onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
            <Plus size={16} /><span>New RAMS</span>
          </button>
        </div>
      </div>

      {expiringSoon > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400" />
          <span className="text-sm font-medium text-red-300">{expiringSoon} document{expiringSoon !== 1 ? 's' : ''} expiring in ≤30 days</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', value: rams.length, icon: FileCheck, colour: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Approved', value: approvedCount, icon: CheckCircle, colour: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Under Review', value: reviewCount, icon: Clock, colour: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Expiring Soon', value: expiringSoon, icon: AlertTriangle, colour: expiringSoon > 0 ? 'text-red-400' : 'text-gray-400', bg: expiringSoon > 0 ? 'bg-red-500/10' : 'bg-gray-800' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour} /></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-white">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-gray-800">
        {([
          { key: 'documents', label: 'Documents', count: rams.length },
          { key: 'method_statements', label: 'Method Statements', count: rams.filter(r => r.doc_type === 'Method Statement').length },
          { key: 'risk_assessments', label: 'Risk Assessments', count: riskAssessments.length },
          { key: 'templates', label: 'Templates', count: TEMPLATES.length },
          { key: 'approvals', label: 'Approvals', count: reviewCount },
        ] as const).map(t => (
          <button type="button"  key={t.key} onClick={() => setSubTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab === t.key ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key === 'approvals' && t.count > 0 ? 'bg-yellow-900/40 text-yellow-400' : 'bg-gray-800 text-gray-400'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {subTab !== 'templates' && subTab !== 'approvals' && (
        <div className="flex flex-wrap gap-3 items-center bg-gray-900 rounded-xl border border-gray-800 p-4">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or activity…" className={inputCls + ' pl-9'} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-orange-500">
            {['All', ...STATUS_OPTIONS].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      )}

      {subTab === 'documents' && (
        <>
          {isLoading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
              {filtered.length === 0 && (
                <EmptyState
                  icon={Shield}
                  title="No RAMS documents found"
                  description="Create a RAMS document to assess and communicate workplace risks."
                />
              )}
              {filtered.map(r => {
                const id = String(r.id ?? '');
                const isExp = expanded === id;
                const isSelected = selectedIds.has(id);
                const validUntil = r.validUntil;
                const version = r.version;
                return (
                  <div key={id} className={`${isSelected ? 'bg-blue-900/10' : ''}`}>
                    <div className="flex items-center gap-4 p-4 hover:bg-gray-800/50 cursor-pointer" onClick={() => setExpanded(isExp ? null : id)}>
                      <button type="button" onClick={e => { e.stopPropagation(); toggle(id); }} className="flex-shrink-0">
                        {isSelected ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
                      </button>
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 text-xs font-bold">
                        {String(r.title ?? '?').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white truncate">{String(r.title ?? 'Untitled')}</p>
                          {!!version && <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">v{String(version)}</span>}
                        </div>
                        <p className="text-sm text-gray-400">{String(r.activity ?? '')} {validUntil ? `· Expires ${validUntil}` : ''}</p>
                      </div>
                      <div className="hidden md:flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(r.status ?? '')] ?? 'bg-gray-700 text-gray-400'}`}>{String(r.status ?? '')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {r.status === 'Under Review' && <button type="button" onClick={e => { e.stopPropagation(); approve(r); }} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded" title="Approve"><CheckCircle size={14} /></button>}
                        <button type="button" onClick={e => { e.stopPropagation(); openSignModal(r); }} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded" title="Sign document"><PenLine size={14} /></button>
                        <button type="button" onClick={e => { e.stopPropagation(); openEdit(r); }} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/20 rounded"><Edit2 size={14} /></button>
                        <button type="button" onClick={e => { e.stopPropagation(); handleDelete(id); }} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/20 rounded"><Trash2 size={14} /></button>
                        <button className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded" title="Download"><Download size={14} /></button>
                        {isExp ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                      </div>
                    </div>
                    {isExp && (
                      <div className="px-6 pb-4 bg-gray-800/30 space-y-3 text-sm border-t border-gray-800">
                        {!!(r.hazards) && <div className="pt-3"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Hazards Identified</p><p className="text-gray-300 whitespace-pre-wrap">{String(r.hazards)}</p></div>}
                        {!!(r.controls) && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Control Measures</p><p className="text-gray-300 whitespace-pre-wrap">{String(r.controls)}</p></div>}
                        {!!(r.ppe) && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">PPE Required</p><p className="text-gray-300">{String(r.ppe)}</p></div>}
                        <div className="flex gap-6 flex-wrap pb-2">
                          {!!(r.reviewedBy) && <div><p className="text-xs text-gray-500">Reviewed By</p><p className="text-gray-300">{String(r.reviewedBy)}</p></div>}
                          {!!(r.approvedBy) && <div><p className="text-xs text-gray-500">Approved By</p><p className="text-gray-300">{String(r.approvedBy)}</p></div>}
                          {!!(r.createdBy) && <div><p className="text-xs text-gray-500">Created By</p><p className="text-gray-300">{String(r.createdBy)}</p></div>}
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-gray-700">
                          <input
                            type="file"
                            id={`upload-rams-${r.id}`}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) { await handleUploadDoc(String(r.id), file); e.target.value = ''; }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById(`upload-rams-${r.id}`)?.click()}
                            disabled={uploading === String(r.id)}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs transition-colors disabled:opacity-50"
                          >
                            <Upload size={14} /> {uploading === String(r.id) ? 'Uploading...' : 'Upload Document'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openSignModal(r)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-700 hover:bg-blue-600 text-gray-300 rounded-lg text-xs transition-colors"
                          >
                            <PenLine size={14} /> Sign
                          </button>
                        </div>
                        {(() => {
                          const sigs = existingSignatures.filter(s => String(s.document_id) === String(r.id));
                          if (sigs.length === 0) return null;
                          return (
                            <div className="pt-2 border-t border-gray-700 space-y-2">
                              {sigs.map(sig => <SignatureDisplay key={sig.id} signature={sig} compact />)}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <BulkActionsBar
        selectedIds={Array.from(selectedIds)}
        actions={[
          { id: 'delete', label: 'Delete Selected', icon: Trash2, variant: 'danger', onClick: handleBulkDelete, confirm: 'This action cannot be undone.' },
          { id: 'approve', label: 'Approve Selected', icon: CheckCircle, variant: 'primary', onClick: handleBulkApprove },
        ]}
        onClearSelection={clearSelection}
      />

      {subTab === 'method_statements' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
          {rams.filter(r => r.doc_type === 'Method Statement').map(r => (
            <div key={String(r.id ?? '')} className="p-4 hover:bg-gray-800/50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-white">{String(r.title ?? '')}</p>
                  <p className="text-sm text-gray-400">{String(r.activity ?? '')} · {String(r.created_by ?? '—')}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(r.status ?? '')] ?? 'bg-gray-700 text-gray-400'}`}>{String(r.status ?? '')}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {String(r.ppe ?? '').split(',').map((item, idx) => item.trim() && <span key={idx} className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full">{item.trim()}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'risk_assessments' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
          {riskAssessments.map(r => {
            const likelihood = Number(r.likelihood ?? 3);
            const severity = Number(r.severity ?? 3);
            const riskScore = likelihood * severity;
            const riskColour = riskScore <= 6 ? 'bg-green-500/20 text-green-400' : riskScore <= 12 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400';
            return (
              <div key={String(r.id ?? '')} className="p-4 hover:bg-gray-800/50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-white">{String(r.hazards ?? 'Hazard')}</p>
                    <p className="text-xs text-gray-500">{String(r.activity ?? '')}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${riskColour}`}>Score: {riskScore}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div><p className="text-gray-500">Likelihood</p><p className="text-white font-semibold">{likelihood}/5</p></div>
                  <div><p className="text-gray-500">Severity</p><p className="text-white font-semibold">{severity}/5</p></div>
                  <div><p className="text-gray-500">Controls</p><p className="text-gray-300">{String(r.controls ?? '—').slice(0, 20)}...</p></div>
                  <div><p className="text-gray-500">Residual Risk</p><p className="text-green-400 font-semibold">Low</p></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map(template => (
            <div key={template.name} className="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-orange-500/50 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <Award size={18} className="text-orange-400" />
                <h3 className="font-semibold text-white">{template.name}</h3>
              </div>
              <p className="text-xs text-gray-400 mb-3">{template.hazards}</p>
              <button type="button" onClick={() => applyTemplate(template)} className="w-full px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700">
                Use Template
              </button>
            </div>
          ))}
        </div>
      )}

      {subTab === 'approvals' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {rams.filter(r => r.status === 'Under Review').length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-900 rounded-xl border border-gray-800">
              <CheckCircle size={32} className="mx-auto mb-2 opacity-30 text-green-500" />
              <p>No documents awaiting approval</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50 border-b border-gray-800">
                <tr>{['Document', 'Requestor', 'Approval Chain', 'Sign-off', 'Action'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {rams.filter(r => r.status === 'Under Review').map(r => (
                  <tr key={String(r.id ?? '')} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-white">{String(r.title ?? '')}</td>
                    <td className="px-4 py-3 text-gray-400">{String(r.created_by ?? '—')}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">Principal Contractor → Client</td>
                    <td className="px-4 py-3"><input type="text" placeholder="Name" className="w-32 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white" /></td>
                    <td className="px-4 py-3"><button type="button" onClick={() => approve(r)} className="text-xs px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Approve</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-white">{editing ? 'Edit RAMS' : 'New RAMS Document'}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Document Title *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Activity Type</label>
                  <select value={form.activity} onChange={e => setForm(f => ({ ...f, activity: e.target.value }))} className={inputCls}>
                    <option value="">Select…</option>{ACTIVITY_TYPES.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Document Type</label>
                  <select value={form.doc_type} onChange={e => setForm(f => ({ ...f, doc_type: e.target.value }))} className={inputCls}>
                    {DOCUMENT_TYPES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Likelihood (1-5)</label>
                  <select value={form.likelihood} onChange={e => setForm(f => ({ ...f, likelihood: e.target.value }))} className={inputCls}>
                    {HAZARD_LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Severity (1-5)</label>
                  <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} className={inputCls}>
                    {HAZARD_LEVELS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Version</label>
                  <input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} placeholder="e.g. 1.0" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Created By</label>
                  <input value={form.created_by} onChange={e => setForm(f => ({ ...f, created_by: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Review Date</label>
                  <input type="date" value={form.review_date} onChange={e => setForm(f => ({ ...f, review_date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Reviewed By</label>
                  <input value={form.reviewed_by} onChange={e => setForm(f => ({ ...f, reviewed_by: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Approved By</label>
                  <input value={form.approved_by} onChange={e => setForm(f => ({ ...f, approved_by: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Valid From</label>
                  <input type="date" value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Valid Until</label>
                  <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Hazards Identified</label>
                  <textarea rows={3} value={form.hazards} onChange={e => setForm(f => ({ ...f, hazards: e.target.value }))} className={inputCls + ' resize-none'} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Control Measures</label>
                  <textarea rows={3} value={form.controls} onChange={e => setForm(f => ({ ...f, controls: e.target.value }))} className={inputCls + ' resize-none'} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>PPE Required</label>
                  <input value={form.ppe} onChange={e => setForm(f => ({ ...f, ppe: e.target.value }))} placeholder="e.g. Hard hat, Hi-vis, Safety boots, Gloves" className={inputCls} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing ? 'Update RAMS' : 'Create RAMS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkImport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Import Items</h2>
              <button type="button" onClick={() => setShowBulkImport(false)} className="p-2 hover:bg-gray-800 rounded-lg"><X size={18} className="text-gray-400"/></button>
            </div>
            <div className="p-6">
              <DataImporter
                onImport={handleBulkImport}
                format="csv"
                exampleData={{ title: '', activity: '', status: '', valid_until: '', reviewed_by: '' }}
              />
            </div>
          </div>
        </div>
      )}

      {showSignModal && signingDoc && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-white">Sign RAMS Document</h2>
                <p className="text-sm text-gray-400 mt-0.5">{String(signingDoc.title ?? '')}</p>
              </div>
              <button type="button" onClick={() => { setShowSignModal(false); setSigningDoc(null); }} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-6">
              <SignatureCapture
                onSign={handleSignature}
                onCancel={() => { setShowSignModal(false); setSigningDoc(null); }}
                signerName={user?.name || user?.email}
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
export default RAMS;
