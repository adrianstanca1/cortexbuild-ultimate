/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import {
  FileText, Plus, Search, Download, Clock, Eye, Edit, X, Upload, Trash2,
  CheckSquare, Square, ChevronDown, ChevronRight, CheckCircle, AlertCircle,
  FileCheck, Check, ThumbsUp, ThumbsDown, Archive, FileJson
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useSpecifications } from '../../hooks/useData';
import { toast } from 'sonner';
import { uploadFile } from '../../services/api';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';

interface Specification {
  id: string;
  ref: string;
  title: string;
  project: string;
  section: string;
  discipline: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'issued';
  issuedDate?: string;
  description: string;
  approvedBy?: string;
  documents?: { name: string; url: string }[];
}

interface ComplianceItem {
  id: string;
  section_number: string;
  title: string;
  requirement: string;
  status: 'Compliant' | 'Non-Compliant' | 'Pending' | 'N/A';
  evidence: string;
  verified_by: string;
  date: string;
}

interface SubstitutionRequest {
  id: string;
  request_number: string;
  original_spec: string;
  proposed_substitute: string;
  requestor: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  technical_justification: string;
  manufacturer: string;
}

interface SpecRevision {
  id: string;
  spec_ref: string;
  spec_title: string;
  rev_number: string;
  date: string;
  author: string;
  description: string;
  changed_sections: string[];
}

// Mock NBS data
const nbsSections = [
  { code: 'A', title: 'General' },
  { code: 'C', title: 'Demolition' },
  { code: 'D', title: 'Groundwork' },
  { code: 'E', title: 'In-situ Concrete' },
  { code: 'F', title: 'Masonry' },
  { code: 'G', title: 'Structural/Carcassing Metal/Timber' },
  { code: 'H', title: 'Cladding/Covering' },
  { code: 'J', title: 'Waterproofing' },
  { code: 'K', title: 'Linings/Sheathing/Partitioning' },
];

const nbsClauses = [
  { code: 'A10', title: 'Contract', mandatory: true, description: 'Standard building contract terms and conditions' },
  { code: 'C10', title: 'Demolition & Site Clearance', mandatory: false, description: 'Removal of existing structures and site preparation' },
  { code: 'D01', title: 'Ground Investigation', mandatory: true, description: 'Site surveys and soil testing requirements' },
  { code: 'E10', title: 'In-situ Concrete Foundations', mandatory: true, description: 'Concrete design and placement standards' },
  { code: 'F10', title: 'Brickwork/Blockwork', mandatory: true, description: 'Masonry material specifications' },
  { code: 'G10', title: 'Structural Steel Frame', mandatory: false, description: 'Steel fabrication and erection' },
  { code: 'H30', title: 'Roof Coverings', mandatory: true, description: 'Tile, slate, or membrane specifications' },
  { code: 'J40', title: 'Damp Proof Membranes', mandatory: true, description: 'DPM installation and testing' },
  { code: 'K10', title: 'Partition Framing/Linings', mandatory: false, description: 'Internal partitioning systems' },
];

const submittalData = [
  { id: 1, item: 'Steel Column Section Details', section: 'G10', requiredBy: '2026-04-15', submitted: '2026-04-08', reviewer: 'John Smith', status: 'approved', daysOut: 0 },
  { id: 2, item: 'Concrete Mix Design', section: 'E10', requiredBy: '2026-04-10', submitted: '2026-04-12', reviewer: 'Sarah Johnson', status: 'revise', daysOut: 2 },
  { id: 3, item: 'Masonry Bond Pattern', section: 'F10', requiredBy: '2026-04-20', submitted: null, reviewer: 'Mike Davis', status: 'pending', daysOut: 14 },
  { id: 4, item: 'Roof Membrane Spec', section: 'H30', requiredBy: '2026-04-18', submitted: '2026-04-10', reviewer: 'Lisa Wong', status: 'underreview', daysOut: 0 },
  { id: 5, item: 'DPM Installation Method', section: 'J40', requiredBy: '2026-04-22', submitted: '2026-04-05', reviewer: 'John Smith', status: 'approved', daysOut: 0 },
];

const complianceKpis = [
  { metric: 'Spec Items with Confirmed Compliance', value: 87, total: 100, unit: '%' },
  { metric: 'RFI (Request for Info) Compliance', value: 45, total: 52, unit: 'resolved' },
  { metric: 'Submittal Sign-off Status', value: 92, total: 100, unit: '%' },
  { metric: 'Non-Compliant Items Overdue', value: 3, total: 100, unit: 'items' },
];

export default function Specifications() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('specs');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [uploading, setUploading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [_showDetailModal, _setShowDetailModal] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [_includeNbs, _setIncludeNbs] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ title: '', project: '', section: '', discipline: '', description: '' });
  const [editItem, setEditItem] = useState<Record<string, any> | null>(null);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [complianceFilterStatus, setComplianceFilterStatus] = useState<string>('all');
  const [expandedRevision, setExpandedRevision] = useState<string | null>(null);
  const [historyDateRange, setHistoryDateRange] = useState({ from: '2026-01-01', to: '2026-04-27' });
  const [selectedRevisionSpec, setSelectedRevisionSpec] = useState<string>('all');

  const mockComplianceItems: ComplianceItem[] = [
    { id: '1', section_number: 'A10', title: 'Contract Requirements', requirement: 'Standard form of contract to be used', status: 'Compliant', evidence: 'Contract signed 2026-04-15', verified_by: 'Sarah Johnson', date: '2026-04-20' },
    { id: '2', section_number: 'E10', title: 'Concrete Strength', requirement: 'Minimum C35 concrete for all foundations', status: 'Compliant', evidence: 'Mix design approved, test cubes passing', verified_by: 'John Smith', date: '2026-04-18' },
    { id: '3', section_number: 'F10', title: 'Masonry Materials', requirement: 'Class B facing bricks per BS 3921', status: 'Non-Compliant', evidence: 'Supplier has changed to Class C bricks', verified_by: 'Mike Davis', date: '2026-04-25' },
    { id: '4', section_number: 'H30', title: 'Roof Coverings', requirement: 'Tile roof with 50-year warranty', status: 'Pending', evidence: 'Warranty documentation pending from supplier', verified_by: 'Lisa Wong', date: '2026-04-16' },
  ];

  const mockSubstitutionRequests: SubstitutionRequest[] = [
    { id: '1', request_number: 'SUB-2026-001', original_spec: 'G10 - Structural Steel Grade S355', proposed_substitute: 'Grade S275 with reinforced sections', requestor: 'Design Team', date: '2026-04-20', status: 'Pending', technical_justification: 'Cost saving of 8% with equivalent load capacity through section redesign', manufacturer: 'ArcelorMittal' },
    { id: '2', request_number: 'SUB-2026-002', original_spec: 'J40 - DPM - 1200gsm polyethylene', proposed_substitute: 'Modified bitumen membrane 2.5mm thick', requestor: 'Site Manager', date: '2026-04-18', status: 'Approved', technical_justification: 'Better performance in high-moisture areas, easier installation', manufacturer: 'Sika' },
  ];

  const mockRevisions: SpecRevision[] = [
    { id: '1', spec_ref: 'SPEC-E10', spec_title: 'In-situ Concrete Foundations', rev_number: '1.2', date: '2026-04-15', author: 'John Smith', description: 'Updated concrete strength requirements post geotechnical survey', changed_sections: ['E10.1', 'E10.3', 'E10.5'] },
    { id: '2', spec_ref: 'SPEC-F10', spec_title: 'Masonry Materials', rev_number: '1.1', date: '2026-03-22', author: 'Sarah Johnson', description: 'Clarified brick bonding patterns and DPC installation', changed_sections: ['F10.2', 'F10.4'] },
    { id: '3', spec_ref: 'SPEC-H30', spec_title: 'Roof Coverings', rev_number: '1.0', date: '2026-02-10', author: 'Mike Davis', description: 'Initial specification issue for construction phase', changed_sections: ['H30.1', 'H30.2', 'H30.3', 'H30.4'] },
  ];

  const { useList, useCreate, useUpdate, useDelete } = useSpecifications;
  const { data: rawSpecs = [] } = useList();
  const specs = rawSpecs as unknown as Specification[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} item(s)?`)) return;
    try {
      await Promise.all(ids.map(id => deleteMutation.mutateAsync(String(id))));
      clearSelection();
      toast.success(`Deleted ${ids.length} item(s)`);
    } catch {
      toast.error('Bulk delete failed');
    }
  }

  const handleCreate = async () => {
    if (!form.title || !form.project) return;
    try {
      await createMutation.mutateAsync({
        reference: `SPEC-${String(Date.now()).slice(-6)}`,
        title: form.title,
        project: form.project,
        section: form.section,
        version: '1.0',
        status: 'draft',
        description: form.description,
      });
      toast.success('Specification created');
      setShowCreateModal(false);
      setForm({ title: '', project: '', section: '', discipline: '', description: '' });
    } catch {
      toast.error('Failed to create specification');
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !editItem.id) return;
    try {
      await updateMutation.mutateAsync({
        id: editItem.id,
        data: {
          title: editItem.title,
          project: editItem.project,
          section: editItem.section,
          discipline: editItem.discipline,
          description: editItem.description,
        },
      });
      toast.success('Specification updated');
      setEditItem(null);
    } catch {
      toast.error('Failed to update specification');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this specification?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Specification deleted');
    } catch {
      toast.error('Failed to delete specification');
    }
  };

  const handleUpload = async (specId: string, file: File) => {
    setUploading(specId);
    try {
      const result = await uploadFile(file, 'SPECS');
      const spec = specs.find((s: Specification) => String(s.id) === String(specId));
      if (spec) {
        await updateMutation.mutateAsync({
          id: String(specId),
          data: {
            ...spec,
            documents: [...(spec.documents || []), { name: file.name, url: String(result.file_url || result.name || '') }],
          },
        });
      }
      toast.success('Document uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const filtered = specs.filter((s: Specification) => {
    const matchesSearch = (s.ref || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.project || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/10' },
    review: { label: 'In Review', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    approved: { label: 'Approved', color: 'text-green-400', bg: 'bg-green-500/10' },
    issued: { label: 'Issued', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  };

  return (
    <>
      <ModuleBreadcrumbs currentModule="specifications" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Specifications Management
            </h2>
            <p className="text-gray-400 text-sm mt-1">Technical specifications, clauses, submittals and compliance tracking</p>
          </div>
          <button type="button" onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
            <Plus size={18} /> Add Specification
          </button>
        </div>

        <div className="card p-6">
          <div className="flex border-b border-gray-700 mb-6 gap-2 cb-table-scroll touch-pan-x">
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'specs' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-gray-300'}`}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab('nbs')}
              className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'nbs' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-gray-300'}`}
            >
              NBS Clauses
            </button>
            <button
              onClick={() => setActiveTab('submittals')}
              className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'submittals' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-gray-300'}`}
            >
              Submittals
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'compliance' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-gray-300'}`}
            >
              Compliance
            </button>
            <button
              onClick={() => setActiveTab('substitutions')}
              className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'substitutions' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-gray-300'}`}
            >
              Substitutions
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'history' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-gray-300'}`}
            >
              History
            </button>
          </div>

          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search specifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 input input-bordered text-white placeholder-gray-500"
                    />
                  </div>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 input input-bordered text-white"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="issued">Issued</option>
                </select>
              </div>

              <div className="space-y-3">
                {filtered.map((spec: Specification) => {
                  const status = statusConfig[spec.status as keyof typeof statusConfig] || statusConfig.draft;
                  const isSelected = selectedIds.has(String(spec.id));
                  return (
                    <div key={spec.id} className={`border border-gray-700 rounded-lg p-4 hover:border-orange-500/50 transition-colors ${isSelected ? 'border-blue-500/50 bg-blue-900/10' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            type="button"
                            onClick={() => toggle(String(spec.id))}
                            className="text-gray-400 hover:text-white mt-1"
                          >
                            {isSelected ? <CheckSquare size={16} className="text-blue-400" /> : <Square size={16} className="text-gray-500" />}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-mono text-sm text-orange-400">{spec.ref || `SPEC-${spec.id}`}</span>
                              <span className={`px-2 py-0.5 rounded text-xs ${status.bg} ${status.color}`}>{status.label}</span>
                              <span className="px-2 py-0.5 rounded text-xs bg-gray-500/10 text-gray-400">v{spec.version || '1.0'}</span>
                            </div>
                            <h3 className="text-white font-medium">{spec.title || 'Specification'}</h3>
                            <p className="text-gray-400 text-sm mt-1">{spec.project || 'No project'} - {spec.section || 'Section TBD'}</p>
                            {spec.description && <p className="text-gray-500 text-xs mt-2 line-clamp-2">{spec.description}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button type="button" className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="View"><Eye size={16} /></button>
                          <button type="button" className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Download"><Download size={16} /></button>
                          <input
                            type="file"
                            id={`upload-spec-${spec.id}`}
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                await handleUpload(String(spec.id), file);
                                e.target.value = '';
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById(`upload-spec-${spec.id}`)?.click()}
                            disabled={uploading === String(spec.id)}
                            className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white disabled:opacity-50"
                            title="Upload spec document"
                          >
                            {uploading === String(spec.id) ? <Clock size={16} className="animate-spin" /> : <Upload size={16} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditItem({ ...spec, title: spec.title || '', project: spec.project || '', section: spec.section || '', discipline: spec.discipline || '', description: spec.description || '' })}
                            className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(String(spec.id))}
                            className="p-2 hover:bg-red-900/30 rounded"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                      {spec.documents && spec.documents.length > 0 && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {(spec.documents as any[] || []).map((doc: any, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300 flex items-center gap-1">
                              <FileText size={12} /> {doc.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'nbs' && (
            <div className="space-y-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search NBS clauses..."
                  className="w-full pl-10 pr-4 py-2 input input-bordered text-white placeholder-gray-500"
                />
              </div>

              <div className="space-y-2">
                {nbsSections.map((section) => (
                  <div key={section.code}>
                    <button
                      onClick={() => setExpandedSection(expandedSection === section.code ? null : section.code)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:border-orange-500/50 hover:bg-gray-800/30 transition-all text-left"
                    >
                      {expandedSection === section.code ? (
                        <ChevronDown size={18} className="text-orange-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-white font-medium">{section.code} - {section.title}</p>
                      </div>
                    </button>

                    {expandedSection === section.code && (
                      <div className="mt-2 ml-6 space-y-2 border-l border-gray-700 pl-4">
                        {nbsClauses.filter(c => c.code.startsWith(section.code.padEnd(2))).map((clause) => (
                          <div key={clause.code} className="border border-gray-700 rounded p-3 bg-gray-800/20">
                            <div className="flex items-start gap-3">
                              <input type="checkbox" defaultChecked className="mt-1 rounded border-gray-600" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-mono text-orange-400 text-sm">{clause.code}</p>
                                  <p className="text-white font-medium text-sm">{clause.title}</p>
                                  <span className={`px-2 py-0.5 rounded text-xs ${clause.mandatory ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {clause.mandatory ? 'Mandatory' : 'Optional'}
                                  </span>
                                </div>
                                <p className="text-gray-400 text-xs mt-1">{clause.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'submittals' && (
            <div className="space-y-4">
              <div className="cb-table-scroll touch-pan-x">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Item</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Section</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Required By</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Submitted</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Reviewer</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-medium">Days Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submittalData.map((item) => (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-700/50 hover:bg-gray-800/30 ${item.daysOut > 0 ? 'bg-red-900/10' : ''}`}
                      >
                        <td className="py-3 px-4 text-white font-medium">{item.item}</td>
                        <td className="py-3 px-4 font-mono text-orange-400 text-xs">{item.section}</td>
                        <td className="py-3 px-4 text-gray-300">{item.requiredBy}</td>
                        <td className="py-3 px-4 text-gray-300">{item.submitted || '-'}</td>
                        <td className="py-3 px-4 text-gray-300">{item.reviewer}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                            item.status === 'underreview' ? 'bg-blue-500/20 text-blue-400' :
                            item.status === 'revise' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {item.status === 'approved' ? 'Approved' :
                             item.status === 'underreview' ? 'Under Review' :
                             item.status === 'revise' ? 'Revise & Resubmit' :
                             'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.daysOut > 0 ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">{item.daysOut}d</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold">Specification Compliance Rate</h3>
                  <p className="text-gray-400 text-xs mt-1">Overall: <span className="text-green-400 font-bold">75%</span> compliant</p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium"
                >
                  <Download size={16} /> Export Matrix
                </button>
              </div>

              <select
                value={complianceFilterStatus}
                onChange={(e) => setComplianceFilterStatus(e.target.value)}
                className="px-3 py-2 input input-bordered text-white mb-4"
              >
                <option value="all">All Status</option>
                <option value="Compliant">Compliant</option>
                <option value="Non-Compliant">Non-Compliant</option>
                <option value="Pending">Pending</option>
                <option value="N/A">N/A</option>
              </select>

              <div className="cb-table-scroll touch-pan-x">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Section #</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Title</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Requirement</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Evidence</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Verified By</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockComplianceItems.filter((item) => complianceFilterStatus === 'all' || item.status === complianceFilterStatus).map((item) => {
                      const statusColor = item.status === 'Compliant' ? 'text-green-400 bg-green-500/10' : item.status === 'Non-Compliant' ? 'text-red-400 bg-red-500/10' : item.status === 'Pending' ? 'text-amber-400 bg-amber-500/10' : 'text-gray-400 bg-gray-500/10';
                      return (
                        <tr key={item.id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                          <td className="py-3 px-4 font-mono text-orange-400 text-xs">{item.section_number}</td>
                          <td className="py-3 px-4 text-white font-medium">{item.title}</td>
                          <td className="py-3 px-4 text-gray-300 text-xs">{item.requirement}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>{item.status}</span>
                          </td>
                          <td className="py-3 px-4 text-gray-300 text-xs">{item.evidence}</td>
                          <td className="py-3 px-4 text-gray-300">{item.verified_by}</td>
                          <td className="py-3 px-4 text-gray-300">{item.date}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setShowComplianceModal(true)}
                              className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-emerald-700/30 bg-emerald-900/20 rounded-lg p-4">
                  <h4 className="text-emerald-300 font-bold mb-2 flex items-center gap-2">
                    <CheckCircle size={18} /> RFI Linkage
                  </h4>
                  <p className="text-gray-300 text-sm">52 RFIs logged with spec deviations. 45 resolved (86.5%)</p>
                </div>
                <div className="border border-blue-700/30 bg-blue-900/20 rounded-lg p-4">
                  <h4 className="text-blue-300 font-bold mb-2 flex items-center gap-2">
                    <FileCheck size={18} /> Overall Sign-Off
                  </h4>
                  <p className="text-gray-300 text-sm">92% of specifications have final sign-off from PM & QA</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'substitutions' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowSubstitutionModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold mb-4"
              >
                <Plus size={18} /> Submit Substitution
              </button>

              <div className="cb-table-scroll touch-pan-x">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Request #</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Original Spec</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Proposed Substitute</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Requestor</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockSubstitutionRequests.map((request) => {
                      const statusColor = request.status === 'Approved' ? 'text-green-400 bg-green-500/10' : request.status === 'Rejected' ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10';
                      return (
                        <tr key={request.id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                          <td className="py-3 px-4 font-mono text-orange-400 text-xs">{request.request_number}</td>
                          <td className="py-3 px-4 text-gray-300 text-xs">{request.original_spec}</td>
                          <td className="py-3 px-4 text-white font-medium text-xs">{request.proposed_substitute}</td>
                          <td className="py-3 px-4 text-gray-300">{request.requestor}</td>
                          <td className="py-3 px-4 text-gray-300">{request.date}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>{request.status}</span>
                          </td>
                          <td className="py-3 px-4 text-center space-x-2">
                            {request.status === 'Pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => toast.success('Substitution approved')}
                                  className="text-green-400 hover:text-green-300 text-xs font-medium"
                                  title="Approve"
                                >
                                  <ThumbsUp size={14} className="inline" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toast.error('Substitution rejected')}
                                  className="text-red-400 hover:text-red-300 text-xs font-medium"
                                  title="Reject"
                                >
                                  <ThumbsDown size={14} className="inline" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-2">Spec Document</label>
                  <select
                    value={selectedRevisionSpec}
                    onChange={(e) => setSelectedRevisionSpec(e.target.value)}
                    className="w-full px-3 py-2 input input-bordered text-white"
                  >
                    <option value="all">All Documents</option>
                    <option value="SPEC-E10">SPEC-E10 - In-situ Concrete Foundations</option>
                    <option value="SPEC-F10">SPEC-F10 - Masonry Materials</option>
                    <option value="SPEC-H30">SPEC-H30 - Roof Coverings</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-2">Date Range</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={historyDateRange.from}
                      onChange={(e) => setHistoryDateRange(r => ({ ...r, from: e.target.value }))}
                      className="flex-1 px-3 py-2 input input-bordered text-white text-sm"
                    />
                    <input
                      type="date"
                      value={historyDateRange.to}
                      onChange={(e) => setHistoryDateRange(r => ({ ...r, to: e.target.value }))}
                      className="flex-1 px-3 py-2 input input-bordered text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {mockRevisions.map((revision) => {
                  const specMatches = selectedRevisionSpec === 'all' || revision.spec_ref === selectedRevisionSpec;
                  const dateInRange = new Date(revision.date) >= new Date(historyDateRange.from) && new Date(revision.date) <= new Date(historyDateRange.to);
                  if (!specMatches || !dateInRange) return null;

                  return (
                    <div key={revision.id} className="border border-gray-700 rounded-lg p-4 hover:border-orange-500/50">
                      <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedRevision(expandedRevision === revision.id ? null : revision.id)}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-sm text-orange-400">{revision.spec_ref}</span>
                            <span className="text-white font-medium">{revision.spec_title}</span>
                            <span className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400">Rev {revision.rev_number}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400 text-xs">Date</p>
                              <p className="text-white">{revision.date}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs">Author</p>
                              <p className="text-white">{revision.author}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs">Changed Sections</p>
                              <p className="text-white">{revision.changed_sections.join(', ')}</p>
                            </div>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-white ml-4">
                          {expandedRevision === revision.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </button>
                      </div>
                      {expandedRevision === revision.id && (
                        <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                          <div>
                            <p className="text-gray-400 text-xs mb-2">Description of Changes</p>
                            <p className="text-white text-sm">{revision.description}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-2">Changed Sections Detail</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="border border-gray-700 rounded p-3 bg-gray-800/30">
                                <p className="text-gray-400 text-xs mb-2 font-mono">Old Text (Rev {parseFloat(revision.rev_number) - 0.1})</p>
                                <p className="text-gray-300 text-sm line-through">Previous specification text for section {revision.changed_sections[0]}...</p>
                              </div>
                              <div className="border border-orange-700/30 rounded p-3 bg-orange-900/10">
                                <p className="text-orange-400 text-xs mb-2 font-mono">New Text (Rev {revision.rev_number})</p>
                                <p className="text-white text-sm">Updated specification text with new requirements and clarifications...</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <BulkActionsBar
          selectedIds={Array.from(selectedIds)}
          actions={[
            { id: 'delete', label: 'Delete Selected', icon: Trash2, variant: 'danger' as const, onClick: handleBulkDelete, confirm: 'This action cannot be undone.' },
          ]}
          onClearSelection={clearSelection}
        />

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
              <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Add Specification</h3>
                <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Title</label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Specification title..." className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Project</label>
                  <select value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                    <option value="">Select project...</option>
                    <option>Canary Wharf Office Complex</option>
                    <option>Manchester City Apartments</option>
                    <option>Birmingham Road Bridge</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">NBS Section</label>
                    <select value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                      <option value="">Select section...</option>
                      {nbsSections.map(s => (
                        <option key={s.code} value={s.code}>{s.code} - {s.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Discipline</label>
                    <select value={form.discipline} onChange={e => setForm(f => ({ ...f, discipline: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                      <option value="">Select discipline...</option>
                      <option>Structural</option>
                      <option>Civil</option>
                      <option>Mechanical</option>
                      <option>Electrical</option>
                      <option>General</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Description</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Specification details..." className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
              </div>
              <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                <button type="button" onClick={handleCreate} disabled={createMutation.isPending || !form.title || !form.project} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                  {createMutation.isPending ? 'Creating...' : 'Create Specification'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showComplianceModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
              <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-xl font-display text-white">Update Compliance Status</h3>
                <button type="button" onClick={() => setShowComplianceModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="comp-status" className="block text-gray-400 text-xs mb-1">Compliance Status *</label>
                  <select id="comp-status" className="w-full px-3 py-2 input input-bordered text-white">
                    <option value="Compliant">Compliant</option>
                    <option value="Non-Compliant">Non-Compliant</option>
                    <option value="Pending">Pending</option>
                    <option value="N/A">N/A</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="comp-evidence" className="block text-gray-400 text-xs mb-1">Evidence/Notes</label>
                  <textarea id="comp-evidence" placeholder="Add evidence notes supporting this status..." rows={3} className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-2">Reference Documents</label>
                  <input type="file" className="w-full px-3 py-2 input input-bordered text-white text-sm" accept=".pdf,.doc,.docx" />
                </div>
              </div>
              <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowComplianceModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                <button type="button" onClick={() => { toast.success('Compliance status updated'); setShowComplianceModal(false); }} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold">
                  Save Status
                </button>
              </div>
            </div>
          </div>
        )}

        {showSubstitutionModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
              <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-xl font-display text-white">Submit Substitution Request</h3>
                <button type="button" onClick={() => setShowSubstitutionModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="sub-spec" className="block text-gray-400 text-xs mb-1">Original Spec Section *</label>
                  <select id="sub-spec" className="w-full px-3 py-2 input input-bordered text-white">
                    <option value="">Select spec...</option>
                    <option value="E10">E10 - In-situ Concrete Foundations</option>
                    <option value="F10">F10 - Masonry Materials</option>
                    <option value="G10">G10 - Structural Steel</option>
                    <option value="H30">H30 - Roof Coverings</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="sub-product" className="block text-gray-400 text-xs mb-1">Proposed Product/Material *</label>
                  <input id="sub-product" type="text" placeholder="e.g. Grade S275 with reinforced sections" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="sub-mfg" className="block text-gray-400 text-xs mb-1">Manufacturer</label>
                  <input id="sub-mfg" type="text" placeholder="e.g. ArcelorMittal" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-2">Technical Data Sheet</label>
                  <input type="file" className="w-full px-3 py-2 input input-bordered text-white text-sm" accept=".pdf,.doc,.docx" />
                </div>
                <div>
                  <label htmlFor="sub-justification" className="block text-gray-400 text-xs mb-1">Technical Justification *</label>
                  <textarea id="sub-justification" placeholder="Explain why this substitution maintains or improves performance..." rows={4} className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
              </div>
              <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowSubstitutionModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                <button type="button" onClick={() => { toast.success('Substitution submitted for review'); setShowSubstitutionModal(false); }} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold">
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        )}

        {editItem && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
              <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Edit Specification</h3>
                <button type="button" onClick={() => setEditItem(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-gray-400 text-xs mb-1">Title</label>
                  <input id="edit-title" type="text" value={editItem.title} onChange={e => setEditItem((f: any) => ({ ...f, title: e.target.value }))} placeholder="Specification title..." className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="edit-project" className="block text-gray-400 text-xs mb-1">Project</label>
                  <select id="edit-project" value={editItem.project} onChange={e => setEditItem((f: any) => ({ ...f, project: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                    <option value="">Select project...</option>
                    <option>Canary Wharf Office Complex</option>
                    <option>Manchester City Apartments</option>
                    <option>Birmingham Road Bridge</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-section" className="block text-gray-400 text-xs mb-1">NBS Section</label>
                    <select id="edit-section" value={editItem.section} onChange={e => setEditItem((f: any) => ({ ...f, section: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                      <option value="">Select section...</option>
                      {nbsSections.map(s => (
                        <option key={s.code} value={s.code}>{s.code} - {s.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit-discipline" className="block text-gray-400 text-xs mb-1">Discipline</label>
                    <select id="edit-discipline" value={editItem.discipline} onChange={e => setEditItem((f: any) => ({ ...f, discipline: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                      <option value="">Select discipline...</option>
                      <option>Structural</option>
                      <option>Civil</option>
                      <option>Mechanical</option>
                      <option>Electrical</option>
                      <option>General</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="edit-description" className="block text-gray-400 text-xs mb-1">Description</label>
                  <textarea id="edit-description" rows={3} value={editItem.description} onChange={e => setEditItem((f: any) => ({ ...f, description: e.target.value }))} placeholder="Specification details..." className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
              </div>
              <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
                <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                <button type="button" onClick={handleUpdate} disabled={updateMutation.isPending || !editItem.title || !editItem.project} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
