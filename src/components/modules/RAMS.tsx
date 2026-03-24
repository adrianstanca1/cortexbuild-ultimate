/**
 * RAMS Module — Risk Assessment & Method Statement Management
 * CortexBuild Ultimate
 *
 * Full RAMS document lifecycle: creation, approval workflow, templates, review log
 * Sub-tabs: Documents | Create | Approval Workflow | Templates | Review Log
 */

import { useState } from 'react';
import {
  Shield, Plus, Search, AlertTriangle, CheckCircle2, FileText, Users,
  ClipboardCheck, Eye, X, ChevronRight, Download, Archive, Trash2, Edit2,
  Clock, TrendingUp, ChevronDown, ChevronUp, MoreVertical, Filter,
  Calendar, MapPin, User, CheckCircle, AlertCircle, RefreshCw, FileDown,
} from 'lucide-react';
import clsx from 'clsx';

type AnyRow = Record<string, unknown>;

// ─── Types ────────────────────────────────────────────────────────────────

interface RAMSDocument {
  id: string;
  title: string;
  project: string;
  trade: string;
  author: string;
  version: string;
  status: 'Draft' | 'Under Review' | 'Approved' | 'Expired' | 'Rejected';
  createdDate: string;
  expiryDate: string;
  approvalDate: string | null;
  hazards: Hazard[];
  controlMeasures: ControlMeasure[];
  ppeRequired: string[];
  emergencyProcedures: string;
  personsResponsible: string[];
  competencyRequirements: string[];
}

interface Hazard {
  id: string;
  description: string;
  whoAffected: string;
  likelihood: number;
  severity: number;
  riskScore: number;
  ragStatus: string;
}

interface ControlMeasure {
  id: string;
  type: 'eliminate' | 'substitute' | 'engineer' | 'admin' | 'ppe';
  description: string;
  residualRisk: string;
}

interface MethodStep {
  id: string;
  stepNumber: number;
  description: string;
}

interface ApprovalRecord {
  id: string;
  ramsId: string;
  action: 'submitted' | 'approved' | 'rejected' | 'commented';
  actor: string;
  timestamp: string;
  comments?: string;
  rating?: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────

const mockRAMS: RAMSDocument[] = [
  {
    id: 'r1',
    title: 'Scaffold Erection - Main Block',
    project: 'Riverside Tower',
    trade: 'Scaffold Erection',
    author: 'John Smith',
    version: '2.1',
    status: 'Approved',
    createdDate: '2026-01-15',
    expiryDate: '2027-01-15',
    approvalDate: '2026-02-10',
    hazards: [
      { id: 'h1', description: 'Fall from height', whoAffected: 'All workers', likelihood: 4, severity: 5, riskScore: 20, ragStatus: 'Red' },
      { id: 'h2', description: 'Dropped objects', whoAffected: 'Workers below', likelihood: 3, severity: 4, riskScore: 12, ragStatus: 'Amber' },
    ],
    controlMeasures: [
      { id: 'c1', type: 'ppe', description: 'Full body harness and safety line', residualRisk: 'Medium' },
      { id: 'c2', type: 'engineer', description: 'Guardrails on all platforms', residualRisk: 'Low' },
    ],
    ppeRequired: ['Hard hat', 'Safety harness', 'Work boots', 'High-visibility vest'],
    emergencyProcedures: 'Call emergency services, cease all work, initiate rescue plan',
    personsResponsible: ['John Smith', 'Sarah Johnson'],
    competencyRequirements: ['CSCS Gold', 'Working at Height', 'Scaffold Inspection'],
  },
  {
    id: 'r2',
    title: 'Concrete Pour - Foundation Slab',
    project: 'Riverside Tower',
    trade: 'Concrete Pour',
    author: 'Sarah Johnson',
    version: '1.0',
    status: 'Under Review',
    createdDate: '2026-02-20',
    expiryDate: '2027-02-20',
    approvalDate: null,
    hazards: [
      { id: 'h3', description: 'Chemical burns from wet concrete', whoAffected: 'All operatives', likelihood: 2, severity: 4, riskScore: 8, ragStatus: 'Amber' },
      { id: 'h4', description: 'Entanglement in concrete pump', whoAffected: 'Pump operatives', likelihood: 2, severity: 5, riskScore: 10, ragStatus: 'Amber' },
    ],
    controlMeasures: [
      { id: 'c3', type: 'ppe', description: 'Protective gloves, eye protection, chemical suit', residualRisk: 'Low' },
      { id: 'c4', type: 'admin', description: 'Weekly toolbox talks on concrete safety', residualRisk: 'Medium' },
    ],
    ppeRequired: ['Hard hat', 'Chemical suit', 'Gloves', 'Eye protection', 'Respirator'],
    emergencyProcedures: 'Flush affected area with water, seek medical attention immediately',
    personsResponsible: ['Sarah Johnson', 'Tom Bradley'],
    competencyRequirements: ['CSCS Gold', 'Confined Space Entry Training'],
  },
  {
    id: 'r3',
    title: 'Steel Frame Erection - Block A',
    project: 'Tech Hub Phase 2',
    trade: 'Steel Frame Erection',
    author: 'Tom Bradley',
    version: '3.0',
    status: 'Approved',
    createdDate: '2025-12-01',
    expiryDate: '2026-12-01',
    approvalDate: '2026-01-05',
    hazards: [
      { id: 'h5', description: 'Fall from height during member installation', whoAffected: 'All site personnel', likelihood: 4, severity: 5, riskScore: 20, ragStatus: 'Red' },
    ],
    controlMeasures: [
      { id: 'c5', type: 'engineer', description: 'Mobile elevated work platform with safety gate', residualRisk: 'Low' },
    ],
    ppeRequired: ['Hard hat', 'Full harness', 'Safety footwear', 'HiVis vest'],
    emergencyProcedures: 'Activate rescue plan, call emergency services',
    personsResponsible: ['Tom Bradley'],
    competencyRequirements: ['CSCS Gold', 'MEWP', 'Working at Height'],
  },
  {
    id: 'r4',
    title: 'Confined Space Entry - Basement Tank',
    project: 'Birmingham Road Bridge',
    trade: 'Confined Space Entry',
    author: 'Mike Davis',
    version: '1.5',
    status: 'Approved',
    createdDate: '2026-01-10',
    expiryDate: '2027-01-10',
    approvalDate: '2026-02-01',
    hazards: [
      { id: 'h6', description: 'Atmospheric hazard - oxygen deficiency', whoAffected: 'Entry workers', likelihood: 3, severity: 5, riskScore: 15, ragStatus: 'Red' },
    ],
    controlMeasures: [
      { id: 'c6', type: 'admin', description: 'Atmospheric testing every 15 minutes', residualRisk: 'Low' },
    ],
    ppeRequired: ['Supplied air respirator', 'Full harness', 'Hard hat'],
    emergencyProcedures: 'Immediate evacuation, fresh air resuscitation, ambulance',
    personsResponsible: ['Mike Davis', 'Claire Watson'],
    competencyRequirements: ['CSCS Gold', 'Confined Space Entry', 'First Aid at Work'],
  },
  {
    id: 'r5',
    title: 'Working at Height - Facade Installation',
    project: 'Edinburgh Data Centre',
    trade: 'Working at Height',
    author: 'Claire Watson',
    version: '2.0',
    status: 'Approved',
    createdDate: '2025-11-20',
    expiryDate: '2026-11-20',
    approvalDate: '2026-01-08',
    hazards: [
      { id: 'h7', description: 'Slip, trip, fall while installing facade panels', whoAffected: 'All facade workers', likelihood: 3, severity: 5, riskScore: 15, ragStatus: 'Red' },
    ],
    controlMeasures: [
      { id: 'c7', type: 'ppe', description: '100% tie-off with double lanyard system', residualRisk: 'Low' },
    ],
    ppeRequired: ['Hard hat', 'Safety harness', 'Work gloves', 'Non-slip footwear', 'HiVis'],
    emergencyProcedures: 'Suspended rescue plan pre-established',
    personsResponsible: ['Claire Watson'],
    competencyRequirements: ['CSCS Gold', 'Working at Height', 'Rescue Awareness'],
  },
  {
    id: 'r6',
    title: 'Electrical Installation - Power Distribution',
    project: 'Canary Wharf Office Complex',
    trade: 'Electrical Installation',
    author: 'Adrian Stanca',
    version: '1.2',
    status: 'Draft',
    createdDate: '2026-02-28',
    expiryDate: '2027-02-28',
    approvalDate: null,
    hazards: [
      { id: 'h8', description: 'Electric shock from live conductors', whoAffected: 'Electricians', likelihood: 2, severity: 5, riskScore: 10, ragStatus: 'Amber' },
    ],
    controlMeasures: [
      { id: 'c8', type: 'admin', description: 'Permit to work system for all live work', residualRisk: 'Low' },
    ],
    ppeRequired: ['Insulated gloves', 'Insulated tools', 'Hard hat', 'Safety glasses'],
    emergencyProcedures: 'Isolate circuit, call emergency services, CPR if required',
    personsResponsible: ['Adrian Stanca'],
    competencyRequirements: ['CSCS Gold', '16th Edition', 'Electrical Installation'],
  },
  {
    id: 'r7',
    title: 'Demolition Works - Old East Wing',
    project: 'Sheffield Hospital Refurb',
    trade: 'Demolition Works',
    author: 'James Harrington',
    version: '1.0',
    status: 'Expired',
    createdDate: '2025-06-15',
    expiryDate: '2026-06-15',
    approvalDate: '2025-07-10',
    hazards: [
      { id: 'h9', description: 'Asbestos exposure during removal', whoAffected: 'All demolition crew', likelihood: 2, severity: 5, riskScore: 10, ragStatus: 'Amber' },
    ],
    controlMeasures: [
      { id: 'c9', type: 'admin', description: 'Licensed asbestos removal contractor engagement', residualRisk: 'Low' },
    ],
    ppeRequired: ['Disposable suit', 'Respirator', 'Gloves', 'Booties'],
    emergencyProcedures: 'Seal area, medical evaluation for exposed workers',
    personsResponsible: ['James Harrington'],
    competencyRequirements: ['CSCS Gold', 'Asbestos Awareness', 'Demolition Supervisor'],
  },
  {
    id: 'r8',
    title: 'Excavation & Groundworks - Piling Prep',
    project: 'Manchester City Apartments',
    trade: 'Excavation & Groundworks',
    author: 'Sarah Mitchell',
    version: '2.5',
    status: 'Approved',
    createdDate: '2025-10-05',
    expiryDate: '2026-10-05',
    approvalDate: '2025-11-12',
    hazards: [
      { id: 'h10', description: 'Trench collapse - ground instability', whoAffected: 'Groundwork operatives', likelihood: 3, severity: 5, riskScore: 15, ragStatus: 'Red' },
    ],
    controlMeasures: [
      { id: 'c10', type: 'engineer', description: 'Shoring and propping system with civil engineer design', residualRisk: 'Low' },
    ],
    ppeRequired: ['Hard hat', 'Safety harness', 'Work boots', 'HiVis vest'],
    emergencyProcedures: 'Rescue equipment on standby, immediate excavation halt',
    personsResponsible: ['Sarah Mitchell'],
    competencyRequirements: ['CSCS Gold', 'Excavation Supervisor', 'First Aid'],
  },
  {
    id: 'r9',
    title: 'Lift Operations - Material Hoists',
    project: 'Newcastle Residential Block',
    trade: 'Lift Operations',
    author: 'Tom Bradley',
    version: '1.8',
    status: 'Approved',
    createdDate: '2025-09-30',
    expiryDate: '2026-09-30',
    approvalDate: '2025-10-25',
    hazards: [
      { id: 'h11', description: 'Dropped loads from malfunctioning hoist', whoAffected: 'Site personnel below', likelihood: 2, severity: 5, riskScore: 10, ragStatus: 'Amber' },
    ],
    controlMeasures: [
      { id: 'c11', type: 'admin', description: 'Daily hoist inspection and certification', residualRisk: 'Low' },
    ],
    ppeRequired: ['Hard hat', 'Safety footwear', 'HiVis vest'],
    emergencyProcedures: 'Stop hoist immediately, isolate area, assess injuries',
    personsResponsible: ['Tom Bradley'],
    competencyRequirements: ['CSCS Gold', 'IPAF/PASMA certification', 'Plant operation'],
  },
  {
    id: 'r10',
    title: 'Hot Works - Welding Operations',
    project: 'Peterborough Distribution Hub',
    trade: 'Hot Works',
    author: 'Mike Davis',
    version: '3.2',
    status: 'Approved',
    createdDate: '2025-08-10',
    expiryDate: '2026-08-10',
    approvalDate: '2025-09-05',
    hazards: [
      { id: 'h12', description: 'Fire risk from hot work operations', whoAffected: 'All nearby personnel', likelihood: 2, severity: 5, riskScore: 10, ragStatus: 'Amber' },
    ],
    controlMeasures: [
      { id: 'c12', type: 'admin', description: 'Hot work permit system with fire watch', residualRisk: 'Low' },
    ],
    ppeRequired: ['Welding helmet', 'Leather apron', 'Gloves', 'Steel toe boots'],
    emergencyProcedures: 'Fire extinguisher on standby, immediate isolation',
    personsResponsible: ['Mike Davis'],
    competencyRequirements: ['CSCS Gold', 'Welding certification', 'Hot Work Supervisor'],
  },
  {
    id: 'r11',
    title: 'Temporary Works - Formwork System',
    project: 'Leeds Warehouse Extension',
    trade: 'Temporary Works',
    author: 'Claire Watson',
    version: '1.4',
    status: 'Approved',
    createdDate: '2025-07-20',
    expiryDate: '2026-07-20',
    approvalDate: '2025-08-15',
    hazards: [
      { id: 'h13', description: 'Collapse of unsupported formwork', whoAffected: 'Operatives and personnel below', likelihood: 2, severity: 5, riskScore: 10, ragStatus: 'Amber' },
    ],
    controlMeasures: [
      { id: 'c13', type: 'engineer', description: 'Structural engineer designed temporary support plan', residualRisk: 'Low' },
    ],
    ppeRequired: ['Hard hat', 'Safety harness', 'Safety glasses', 'Work gloves'],
    emergencyProcedures: 'Cease operations, evacuate area, structural assessment before resuming',
    personsResponsible: ['Claire Watson'],
    competencyRequirements: ['CSCS Gold', 'Temporary Works Supervisor', 'Formwork knowledge'],
  },
  {
    id: 'r12',
    title: 'Roof Works - Slate Installation',
    project: 'Bristol Retail Park Fit-Out',
    trade: 'Roof Works',
    author: 'Adrian Stanca',
    version: '2.0',
    status: 'Under Review',
    createdDate: '2026-02-10',
    expiryDate: '2027-02-10',
    approvalDate: null,
    hazards: [
      { id: 'h14', description: 'Fall from pitched roof during slate fixing', whoAffected: 'Roofers', likelihood: 4, severity: 5, riskScore: 20, ragStatus: 'Red' },
    ],
    controlMeasures: [
      { id: 'c14', type: 'engineer', description: 'Roof edge protection and safety netting', residualRisk: 'Low' },
    ],
    ppeRequired: ['Hard hat', 'Full harness', 'Non-slip footwear', 'HiVis vest', 'Gloves'],
    emergencyProcedures: 'Suspended rescue procedures in place',
    personsResponsible: ['Adrian Stanca'],
    competencyRequirements: ['CSCS Gold', 'Working at Height', 'Roofing knowledge'],
  },
];

const mockApprovals: ApprovalRecord[] = [
  { id: 'a1', ramsId: 'r1', action: 'submitted', actor: 'John Smith', timestamp: '2026-02-08' },
  { id: 'a2', ramsId: 'r1', action: 'approved', actor: 'James Harrington', timestamp: '2026-02-10' },
  { id: 'a3', ramsId: 'r2', action: 'submitted', actor: 'Sarah Johnson', timestamp: '2026-02-22' },
  { id: 'a4', ramsId: 'r2', action: 'commented', actor: 'Tom Bradley', timestamp: '2026-02-25', comments: 'Need clarification on emergency procedure' },
];

// ─── Helper Functions ──────────────────────────────────────────────────────

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB');

const getRagColour = (status: string) => ({
  'Red': 'bg-red-900/30 text-red-300 border border-red-700/50',
  'Amber': 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/50',
  'Green': 'bg-green-900/30 text-green-300 border border-green-700/50',
}[status] || 'bg-gray-700/30 text-gray-300');

const getStatusColour = (status: string) => ({
  'Draft': 'bg-gray-700 text-gray-200',
  'Under Review': 'bg-yellow-900 text-yellow-100',
  'Approved': 'bg-green-900 text-green-100',
  'Expired': 'bg-red-900 text-red-100',
  'Rejected': 'bg-red-900/50 text-red-100',
}[status] || 'bg-gray-700 text-gray-200');

// ─── Component ────────────────────────────────────────────────────────────

export function RAMS() {
  const [activeTab, setActiveTab] = useState<'documents' | 'create' | 'approval' | 'templates' | 'review'>('documents');
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterTrade, setFilterTrade] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createStep, setCreateStep] = useState(1);
  const [approvalKanban, setApprovalKanban] = useState<Record<string, RAMSDocument[]>>(() => {
    const grouped: Record<string, RAMSDocument[]> = {
      'Draft': [],
      'Submitted': [],
      'Under Review': [],
      'Approved': [],
      'Rejected': [],
    };
    mockRAMS.forEach((doc) => {
      if (doc.status === 'Draft') grouped['Draft'].push(doc);
      else if (doc.status === 'Under Review') grouped['Under Review'].push(doc);
      else if (doc.status === 'Approved') grouped['Approved'].push(doc);
      else if (doc.status === 'Rejected') grouped['Rejected'].push(doc);
    });
    return grouped;
  });

  const filtered = mockRAMS.filter((doc) => {
    const matchSearch = search === '' || doc.title.toLowerCase().includes(search.toLowerCase()) || doc.trade.toLowerCase().includes(search.toLowerCase());
    const matchProject = filterProject === '' || doc.project === filterProject;
    const matchStatus = filterStatus === '' || doc.status === filterStatus;
    const matchTrade = filterTrade === '' || doc.trade === filterTrade;
    return matchSearch && matchProject && matchStatus && matchTrade;
  });

  const projects = Array.from(new Set(mockRAMS.map((d) => d.project)));
  const statuses = Array.from(new Set(mockRAMS.map((d) => d.status)));
  const trades = Array.from(new Set(mockRAMS.map((d) => d.trade)));

  const totalActive = mockRAMS.filter((d) => d.status === 'Approved' && new Date(d.expiryDate) > new Date()).length;
  const dueRenewal = mockRAMS.filter((d) => {
    const daysToExpiry = (new Date(d.expiryDate).getTime() - Date.now()) / 86400000;
    return daysToExpiry > 0 && daysToExpiry <= 30;
  }).length;
  const expired = mockRAMS.filter((d) => new Date(d.expiryDate) < new Date()).length;
  const approvalRate = mockRAMS.filter((d) => d.status === 'Approved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Risk Assessment & Method Statements</h1>
          <p className="text-gray-400">Complete RAMS lifecycle management and approval workflow</p>
        </div>
        <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
          <Plus className="h-5 w-5" />
          New RAMS
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-800">
        {[
          { id: 'documents', label: 'Documents', icon: FileText },
          { id: 'create', label: 'Create', icon: Plus },
          { id: 'approval', label: 'Approval Workflow', icon: ClipboardCheck },
          { id: 'templates', label: 'Templates', icon: Shield },
          { id: 'review', label: 'Review Log', icon: Clock },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={clsx(
              'px-4 py-3 font-medium text-sm border-b-2 flex items-center gap-2 transition-all',
              activeTab === id
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-2">Total Active</p>
              <p className="text-3xl font-bold text-white">{totalActive}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-2">Due for Renewal</p>
              <p className="text-3xl font-bold text-yellow-400">{dueRenewal}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-2">Expired</p>
              <p className="text-3xl font-bold text-red-400">{expired}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-2">Approval Rate</p>
              <p className="text-3xl font-bold text-emerald-400">{approvalRate} docs</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search RAMS documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Status</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={filterTrade}
              onChange={(e) => setFilterTrade(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">All Trades</option>
              {trades.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Documents Table */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900/50">
                  <th className="text-left p-4 text-gray-400 font-medium">Title</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Project</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Trade</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Author</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Version</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Created</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Expires</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <React.Fragment key={doc.id}>
                    <tr className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer" onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}>
                      <td className="p-4">
                        <div className="flex items-start gap-2">
                          <ChevronRight className={clsx('h-4 w-4 text-gray-500 mt-1 transition-transform', expandedId === doc.id && 'rotate-90')} />
                          <span className="font-medium text-white">{doc.title}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400">{doc.project}</td>
                      <td className="p-4 text-gray-400">{doc.trade}</td>
                      <td className="p-4 text-gray-400">{doc.author}</td>
                      <td className="p-4 text-gray-400">{doc.version}</td>
                      <td className="p-4">
                        <span className={clsx('px-3 py-1 rounded-full text-xs font-medium', getStatusColour(doc.status))}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">{fmtDate(doc.createdDate)}</td>
                      <td className="p-4 text-gray-400">{fmtDate(doc.expiryDate)}</td>
                      <td className="p-4 text-center">
                        <button className="text-gray-400 hover:text-orange-400">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                    {expandedId === doc.id && (
                      <tr className="bg-gray-900/50 border-b border-gray-700">
                        <td colSpan={9} className="p-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-bold text-white mb-3">Hazards</h4>
                              <div className="space-y-2">
                                {doc.hazards.map((h) => (
                                  <div key={h.id} className={clsx('p-3 rounded-lg', getRagColour(h.ragStatus))}>
                                    <p className="font-medium">{h.description}</p>
                                    <p className="text-xs mt-1 opacity-75">Likelihood: {h.likelihood}/5 | Severity: {h.severity}/5 | Risk: {h.riskScore}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-white mb-3">Control Measures</h4>
                              <div className="space-y-2">
                                {doc.controlMeasures.map((c) => (
                                  <div key={c.id} className="p-3 bg-gray-800 border border-gray-700 rounded-lg">
                                    <p className="font-medium text-white">{c.description}</p>
                                    <p className="text-xs text-gray-400 mt-1">Type: {c.type} | Residual: {c.residualRisk}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6 mt-6">
                            <div>
                              <h4 className="font-bold text-white mb-2">PPE Required</h4>
                              <ul className="space-y-1">
                                {doc.ppeRequired.map((ppe) => (
                                  <li key={ppe} className="text-gray-400 text-sm">• {ppe}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-bold text-white mb-2">Persons Responsible</h4>
                              <ul className="space-y-1">
                                {doc.personsResponsible.map((p) => (
                                  <li key={p} className="text-gray-400 text-sm">• {p}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="mt-6 flex gap-2">
                            <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                              <FileDown className="h-4 w-4" />
                              Download PDF
                            </button>
                            <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium">New Version</button>
                            <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Archive</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Tab */}
      {activeTab === 'create' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-4xl">
          <div className="mb-6">
            <div className="flex gap-4 mb-6">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex-1">
                  <div className={clsx('h-2 rounded-full', createStep >= step ? 'bg-orange-500' : 'bg-gray-700')}></div>
                  <p className="text-xs text-gray-400 mt-2 text-center">Step {step}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-400 text-sm">
              {createStep === 1 && 'Project & Activity Details'}
              {createStep === 2 && 'Hazard Identification & Control Measures'}
              {createStep === 3 && 'Method Statement & Equipment'}
              {createStep === 4 && 'Sign-off & Approval'}
            </p>
          </div>

          {createStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Project</label>
                  <select className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                    <option>Select project...</option>
                    {projects.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Activity Type</label>
                  <select className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                    <option>Select activity...</option>
                    {trades.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Location</label>
                  <input type="text" placeholder="e.g., Main Block, Floor 5" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Supervisor</label>
                  <input type="text" placeholder="Select supervisor..." className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Description</label>
                <textarea rows={3} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"></textarea>
              </div>
            </div>
          )}

          {createStep === 2 && (
            <div className="space-y-4">
              <p className="text-gray-300 mb-4">Add hazards and control measures below</p>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <p className="text-white font-medium mb-3">Hazards</p>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Hazard description" className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
                    <input type="number" placeholder="Likelihood (1-5)" className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
                    <input type="number" placeholder="Severity (1-5)" className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
                    <button className="text-orange-400 hover:text-orange-300">+</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {createStep === 3 && (
            <div className="space-y-4">
              <p className="text-gray-300 mb-4">Define method steps and equipment</p>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <p className="text-white font-medium mb-3">Method Steps</p>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input type="number" placeholder="Step #" className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
                    <input type="text" placeholder="Description" className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
                    <button className="text-orange-400 hover:text-orange-300">+</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {createStep === 4 && (
            <div className="space-y-4">
              <p className="text-gray-300 mb-4">Final approval sign-off</p>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <p className="text-white font-medium mb-3">Required Signatures</p>
                <div className="space-y-2 text-gray-400 text-sm">
                  <p>✓ Site Supervisor</p>
                  <p>✓ Project Manager</p>
                  <p>✓ Health & Safety Officer</p>
                </div>
              </div>
              <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-medium">Submit for Approval</button>
            </div>
          )}

          <div className="mt-6 flex gap-3 justify-between">
            <button onClick={() => setCreateStep(Math.max(1, createStep - 1))} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium" disabled={createStep === 1}>
              Back
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium">Save Draft</button>
            {createStep < 4 && (
              <button onClick={() => setCreateStep(createStep + 1)} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium">
                Next
              </button>
            )}
          </div>
        </div>
      )}

      {/* Approval Workflow Tab */}
      {activeTab === 'approval' && (
        <div className="grid grid-cols-5 gap-4">
          {['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'].map((status) => (
            <div key={status} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="font-bold text-white mb-4">{status}</h3>
              <div className="space-y-3">
                {approvalKanban[status]?.map((doc) => (
                  <div key={doc.id} className="bg-gray-900 border border-gray-700 rounded-lg p-3 hover:border-orange-500/50">
                    <p className="font-medium text-white text-sm">{doc.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{doc.project}</p>
                    <div className="flex gap-2 mt-2">
                      <button className="text-xs bg-orange-600/20 text-orange-300 px-2 py-1 rounded hover:bg-orange-600/30">View</button>
                      {status === 'Under Review' && <button className="text-xs bg-green-600/20 text-green-300 px-2 py-1 rounded hover:bg-green-600/30">Approve</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trades.map((trade) => (
            <div key={trade} className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-orange-500/50">
              <Shield className="h-8 w-8 text-orange-500 mb-3" />
              <h3 className="font-bold text-white mb-1">{trade}</h3>
              <p className="text-xs text-gray-400 mb-3">Activity-based template</p>
              <div className="space-y-1 text-xs text-gray-400 mb-4">
                <p>Hazards: 5-8</p>
                <p>Last updated: 2026-02-15</p>
                <p>Used: 3 times</p>
              </div>
              <button className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Use Template</button>
            </div>
          ))}
        </div>
      )}

      {/* Review Log Tab */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-2">Pending Reviews</p>
              <p className="text-3xl font-bold text-yellow-400">{approvalKanban['Under Review']?.length || 0}</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <p className="text-gray-400 text-sm mb-2">Approval Rate (YTD)</p>
              <p className="text-3xl font-bold text-emerald-400">94%</p>
            </div>
          </div>

          {/* Review Timeline */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {mockApprovals.map((record) => (
                <div key={record.id} className="border-b border-gray-700 p-4 hover:bg-gray-700/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-white font-medium">{record.action === 'approved' ? '✓' : record.action === 'submitted' ? '◆' : '◎'} {record.action.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-sm text-gray-400">RAMS ID: {record.ramsId}</p>
                      <p className="text-xs text-gray-500">By {record.actor} on {fmtDate(record.timestamp)}</p>
                      {record.comments && <p className="text-sm text-gray-300 mt-2">"{record.comments}"</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
