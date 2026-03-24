import { useState, useEffect } from 'react';
import {
  FileText, Plus, Search, Filter, Download, Clock, AlertCircle,
  CheckCircle, XCircle, ArrowUpRight, ArrowDownRight, AlertTriangle,
  ChevronDown, ChevronRight, Calendar, Building2, User, PoundSterling,
  FileCheck, RefreshCw, Eye, Edit, Trash2, X
} from 'lucide-react';
import { variationsApi } from '../../services/api';

interface Variation {
  id: string;
  ref: string;
  title: string;
  project: string;
  subcontractor: string;
  status: 'draft' | 'pending' | 'submitted' | 'approved' | 'rejected' | 'executed';
  type: 'addition' | 'deletion' | 'omission' | 'remeasurement' | 'provisional';
  value: number;
  originalValue: number;
  impact: 'increase' | 'decrease' | 'neutral';
  submittedDate: string;
  respondedDate?: string;
  description: string;
  reason: string;
  affectedItems: string[];
  approvalChain: { name: string; role: string; status: 'pending' | 'approved' | 'rejected'; date?: string }[];
  documents: { name: string; type: string; url: string }[];
}

const mockVariations: Variation[] = [
  {
    id: 'VAR-001',
    ref: 'VAR-2024-001',
    title: 'Additional RC8 RC12 Rafter Installation',
    project: 'Kingspan Stadium Refurbishment',
    subcontractor: 'SteelTech Fabrications Ltd',
    status: 'approved',
    type: 'addition',
    value: 24500,
    originalValue: 180000,
    impact: 'increase',
    submittedDate: '2024-03-15',
    respondedDate: '2024-03-18',
    description: 'Additional rafter sections RC8 and RC12 require bespoke fabrication due to site access constraints. Original design assumed standard kit but site conditions necessitate custom pieces.',
    reason: 'Site condition / Design coordination',
    affectedItems: ['Structural steel', 'Roof cladding', 'Access equipment'],
    approvalChain: [
      { name: 'John McAllister', role: 'Project Manager', status: 'approved', date: '2024-03-16' },
      { name: 'Sarah Collins', role: 'Commercial Manager', status: 'approved', date: '2024-03-17' },
      { name: 'David Boyd', role: 'Contracts Director', status: 'approved', date: '2024-03-18' },
    ],
    documents: [
      { name: 'VAR-001_Sketch.pdf', type: 'pdf', url: '#' },
      { name: 'VAR-001_Quotation.pdf', type: 'pdf', url: '#' },
    ],
  },
  {
    id: 'VAR-002',
    ref: 'VAR-2024-002',
    title: 'M&E Rerouting - Level 3',
    project: 'Belfast High School Extension',
    subcontractor: 'M&E Solutions NI',
    status: 'pending',
    type: 'addition',
    value: 8750,
    originalValue: 95000,
    impact: 'increase',
    submittedDate: '2024-03-20',
    description: 'Structural beam conflict with planned M&E route at Level 3 requires rerouting approximately 15m of main cable tray and associated containment.',
    reason: 'Structural conflict / Coordination',
    affectedItems: ['Electrical', 'Data', 'Fire alarm'],
    approvalChain: [
      { name: 'Emma Walsh', role: 'Project Manager', status: 'approved', date: '2024-03-21' },
      { name: 'Michael O\'Brien', role: 'Commercial Manager', status: 'pending' },
    ],
    documents: [
      { name: 'VAR-002_M&E_Drawing.pdf', type: 'pdf', url: '#' },
    ],
  },
  {
    id: 'VAR-003',
    ref: 'VAR-2024-003',
    title: 'Groundworks Omission - Soft Spot',
    project: 'Retail Park Car Park',
    subcontractor: 'ABC Groundworks',
    status: 'rejected',
    type: 'omission',
    value: -4200,
    originalValue: 45000,
    impact: 'decrease',
    submittedDate: '2024-03-10',
    respondedDate: '2024-03-12',
    description: 'Area previously classified as soft spot no longer requires full excavation and import. Natural occurring rock formation provides adequate bearing.',
    reason: 'Ground condition improvement',
    affectedItems: ['Excavation', 'Dispose', 'Import'],
    approvalChain: [
      { name: 'Robert Brown', role: 'Project Manager', status: 'rejected', date: '2024-03-11' },
    ],
    documents: [],
  },
  {
    id: 'VAR-004',
    ref: 'VAR-2024-004',
    title: 'Fire Door Upgrade to FD60s',
    project: 'Holiday Inn Express Refurbishment',
    subcontractor: 'FireStop Systems Ltd',
    status: 'submitted',
    type: 'addition',
    value: 12600,
    originalValue: 0,
    impact: 'increase',
    submittedDate: '2024-03-22',
    description: 'Building Control has required upgrade of all compartment doors to FD60 specification. Original scope was FD30.',
    reason: 'Regulatory requirement / BC change',
    affectedItems: ['Doors', 'Frames', 'Ironmongery', 'Intumescent seals'],
    approvalChain: [
      { name: 'Lisa McMurray', role: 'Project Manager', status: 'pending' },
    ],
    documents: [
      { name: 'VAR-004_BC_Notice.pdf', type: 'pdf', url: '#' },
      { name: 'VAR-004_Spec.pdf', type: 'pdf', url: '#' },
    ],
  },
  {
    id: 'VAR-005',
    ref: 'VAR-2024-005',
    title: 'Provisional Sums - Prelims Adjustment',
    project: 'Office Fit-Out Belfast',
    subcontractor: 'Prime Fit Contracts',
    status: 'draft',
    type: 'provisional',
    value: 0,
    originalValue: 35000,
    impact: 'neutral',
    submittedDate: '2024-03-25',
    description: 'Draft valuation for adjustment of provisional sums relating to prelims. Final value TBC upon completion of works.',
    reason: 'Provisional sum adjustment',
    affectedItems: ['Preliminaries', 'Insurance', 'Bond'],
    approvalChain: [],
    documents: [],
  },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: FileText },
  pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Clock },
  submitted: { label: 'Submitted', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: AlertCircle },
  approved: { label: 'Approved', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
  executed: { label: 'Executed', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: FileCheck },
};

const typeConfig: Record<string, { label: string; color: string }> = {
  addition: { label: 'Addition', color: 'text-green-400' },
  deletion: { label: 'Deletion', color: 'text-red-400' },
  omission: { label: 'Omission', color: 'text-gray-400' },
  remeasurement: { label: 'Remeasurement', color: 'text-blue-400' },
  provisional: { label: 'Provisional Sum', color: 'text-amber-400' },
};

export default function Variations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterImpact, setFilterImpact] = useState<string>('all');
  const [selectedVar, setSelectedVar] = useState<Variation | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [variations, setVariations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    variationsApi.getAll().then(data => {
      setVariations(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredVariations = variations.filter((v: any) => {
    const matchesSearch = (v.ref || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.project || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
    const matchesType = filterType === 'all' || v.type === filterType;
    const matchesImpact = filterImpact === 'all' || v.impact === filterImpact;
    return matchesSearch && matchesStatus && matchesType && matchesImpact;
  });

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const totalPending = variations.filter((v: any) => v.status === 'pending' || v.status === 'submitted').reduce((sum: number, v: any) => sum + Number(v.value), 0);
  const totalApproved = variations.filter((v: any) => v.status === 'approved' || v.status === 'executed').reduce((sum: number, v: any) => sum + Number(v.value), 0);
  const totalRejected = variations.filter((v: any) => v.status === 'rejected').reduce((sum: number, v: any) => sum + Math.abs(Number(v.value)), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Variations Management
          </h2>
          <p className="text-gray-400 text-sm mt-1">Track and manage change orders, variations, and scope changes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
        >
          <Plus size={18} />
          New Variation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Pending Value</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                £{totalPending.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="text-amber-400" size={20} />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Approved Value</p>
              <p className="text-2xl font-bold text-green-400 mt-1">
                £{totalApproved.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="text-green-400" size={20} />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Rejected Value</p>
              <p className="text-2xl font-bold text-red-400 mt-1">
                -£{totalRejected.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="text-red-400" size={20} />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Variations</p>
              <p className="text-2xl font-bold text-white mt-1">{loading ? '...' : variations.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <FileText className="text-orange-400" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by ref, title, or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="executed">Executed</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="addition">Addition</option>
            <option value="deletion">Deletion</option>
            <option value="omission">Omission</option>
            <option value="remeasurement">Remeasurement</option>
            <option value="provisional">Provisional Sum</option>
          </select>
          <select
            value={filterImpact}
            onChange={(e) => setFilterImpact(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
          >
            <option value="all">All Impacts</option>
            <option value="increase">Increase</option>
            <option value="decrease">Decrease</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredVariations.map((variation) => {
            const status = statusConfig[variation.status];
            const StatusIcon = status.icon;
            const isExpanded = expandedCards.includes(variation.id);
            const isPositive = variation.value > 0;

            return (
              <div
                key={variation.id}
                className="border border-gray-700 rounded-lg overflow-hidden hover:border-orange-500/50 transition-colors"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer bg-gray-800/50 hover:bg-gray-800"
                  onClick={() => {
                    setSelectedVar(variation);
                    setShowCreateModal(false);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleExpand(variation.id); }}
                      className="text-gray-400 hover:text-white"
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-orange-400">{variation.ref}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${status.bg} ${status.color}`}>
                          <StatusIcon size={12} className="inline mr-1" />
                          {status.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${isPositive ? 'bg-green-500/10 text-green-400' : variation.value < 0 ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-400'}`}>
                          {typeConfig[variation.type].label}
                        </span>
                      </div>
                      <p className="text-white font-medium mt-1">{variation.title}</p>
                      <p className="text-gray-400 text-sm">{variation.project}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={`text-lg font-bold ${isPositive ? 'text-green-400' : variation.value < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {isPositive ? '+' : ''}£{variation.value.toLocaleString()}
                      </p>
                      <p className="text-gray-400 text-xs">Variation Value</p>
                    </div>
                    {isExpanded && (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button className="p-2 hover:bg-gray-700 rounded"><Eye size={16} className="text-gray-400" /></button>
                        <button className="p-2 hover:bg-gray-700 rounded"><Edit size={16} className="text-gray-400" /></button>
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-xs">Subcontractor</p>
                        <p className="text-white text-sm">{variation.subcontractor}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Submitted</p>
                        <p className="text-white text-sm">{variation.submittedDate}</p>
                      </div>
                      {variation.respondedDate && (
                        <div>
                          <p className="text-gray-400 text-xs">Responded</p>
                          <p className="text-white text-sm">{variation.respondedDate}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-400 text-xs">Reason</p>
                        <p className="text-white text-sm">{variation.reason}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-400 text-xs mb-1">Description</p>
                      <p className="text-gray-300 text-sm">{variation.description}</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-400 text-xs mb-2">Affected Items</p>
                      <div className="flex flex-wrap gap-2">
                        {(variation.affectedItems as any[] || []).map((item: any) => (
                          <span key={item} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    {variation.approvalChain.length > 0 && (
                      <div>
                        <p className="text-gray-400 text-xs mb-2">Approval Chain</p>
                        <div className="space-y-2">
                          {(variation.approvalChain as any[] || []).map((approver: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 text-sm">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                approver.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                approver.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {approver.status === 'approved' ? <CheckCircle size={14} /> :
                                 approver.status === 'rejected' ? <XCircle size={14} /> :
                                 <Clock size={14} />}
                              </div>
                              <span className="text-white">{approver.name}</span>
                              <span className="text-gray-400">- {approver.role}</span>
                              {approver.date && <span className="text-gray-500 ml-auto">{approver.date}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Create Variation</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Reference</label>
                  <input type="text" value="VAR-2024-006" readOnly className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Project</label>
                  <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option>Kingspan Stadium Refurbishment</option>
                    <option>Belfast High School Extension</option>
                    <option>Retail Park Car Park</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Title</label>
                <input type="text" placeholder="Variation title..." className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Description</label>
                <textarea rows={3} placeholder="Describe the variation..." className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Type</label>
                  <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option value="addition">Addition</option>
                    <option value="omission">Omission</option>
                    <option value="deletion">Deletion</option>
                    <option value="remeasurement">Remeasurement</option>
                    <option value="provisional">Provisional Sum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Value (£)</label>
                  <input type="number" placeholder="0.00" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Reason</label>
                  <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                    <option>Site condition</option>
                    <option>Design coordination</option>
                    <option>Regulatory requirement</option>
                    <option>Client instruction</option>
                    <option>Ground condition</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Subcontractor</label>
                <input type="text" placeholder="Subcontractor name..." className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">
                Cancel
              </button>
              <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
                Create Variation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
