import { useState } from 'react';
import {
  FileText, Plus, Search, Filter, Download, Clock, AlertCircle,
  CheckCircle, XCircle, DollarSign, Building2, User, Calendar,
  FileCheck, Eye, Edit, X, Percent, CreditCard, Receipt
} from 'lucide-react';

interface Valuation {
  id: string;
  ref: string;
  project: string;
  contractor: string;
  applicationNo: number;
  periodStart: string;
  periodEnd: string;
  status: 'draft' | 'submitted' | 'valued' | 'certified' | 'paid' | 'rejected';
  grossValue: number;
  retention: number;
  retentionPercent: number;
  previousValue: number;
  thisApplication: number;
  certifiedValue: number;
  certifiedDate?: string;
  paidDate?: string;
  lineItems: { description: string; originalValue: number; variation: number; remeasurement: number; workDone: number; percentage: number }[];
  documents: { name: string; type: string }[];
  notes: string;
}

const mockValuations: Valuation[] = [
  {
    id: 'VAL-001',
    ref: 'VAL-2024-01',
    project: 'Kingspan Stadium Refurbishment',
    contractor: 'SteelTech Fabrications Ltd',
    applicationNo: 3,
    periodStart: '2024-03-01',
    periodEnd: '2024-03-31',
    status: 'certified',
    grossValue: 2450000,
    retention: 122500,
    retentionPercent: 5,
    previousValue: 892000,
    thisApplication: 156000,
    certifiedValue: 148200,
    certifiedDate: '2024-04-05',
    lineItems: [
      { description: 'Steel fabrication - Area A', originalValue: 450000, variation: 24500, remeasurement: 0, workDone: 156000, percentage: 34 },
      { description: 'Steel fabrication - Area B', originalValue: 380000, variation: 0, remeasurement: -12000, workDone: 0, percentage: 0 },
      { description: 'Installation works', originalValue: 280000, variation: 0, remeasurement: 0, workDone: 95000, percentage: 34 },
    ],
    documents: [
      { name: 'VAL-01_Application.pdf', type: 'pdf' },
      { name: 'VAL-01_Schedule.xlsx', type: 'xlsx' },
    ],
    notes: 'Application includes VAR-001 approved variation for additional rafters.',
  },
  {
    id: 'VAL-002',
    ref: 'VAL-2024-02',
    project: 'Belfast High School Extension',
    contractor: 'M&E Solutions NI',
    applicationNo: 5,
    periodStart: '2024-03-01',
    periodEnd: '2024-03-31',
    status: 'submitted',
    grossValue: 890000,
    retention: 44500,
    retentionPercent: 5,
    previousValue: 534000,
    thisApplication: 89000,
    certifiedValue: 0,
    lineItems: [
      { description: 'Electrical installation', originalValue: 320000, variation: 0, remeasurement: 0, workDone: 45000, percentage: 58 },
      { description: 'Mechanical installation', originalValue: 290000, variation: 8750, remeasurement: 0, workDone: 32000, percentage: 51 },
      { description: 'Data/AV systems', originalValue: 180000, variation: 0, remeasurement: 0, workDone: 12000, percentage: 35 },
    ],
    documents: [
      { name: 'VAL-02_Application.pdf', type: 'pdf' },
    ],
    notes: 'Includes M&E rerouting variation VAR-002.',
  },
  {
    id: 'VAL-003',
    ref: 'VAL-2024-03',
    project: 'Office Fit-Out Belfast',
    contractor: 'Prime Fit Contracts',
    applicationNo: 2,
    periodStart: '2024-03-01',
    periodEnd: '2024-03-31',
    status: 'paid',
    grossValue: 560000,
    retention: 28000,
    retentionPercent: 5,
    previousValue: 280000,
    thisApplication: 125000,
    certifiedValue: 118750,
    certifiedDate: '2024-04-02',
    paidDate: '2024-04-15',
    lineItems: [
      { description: 'Strip-out works', originalValue: 80000, variation: 0, remeasurement: 0, workDone: 80000, percentage: 100 },
      { description: 'Partitioning', originalValue: 120000, variation: 0, remeasurement: 0, workDone: 75000, percentage: 62.5 },
      { description: 'Ceiling works', originalValue: 95000, variation: 0, remeasurement: 0, workDone: 50000, percentage: 52.6 },
    ],
    documents: [
      { name: 'VAL-03_Application.pdf', type: 'pdf' },
      { name: 'VAL-03_Certificate.pdf', type: 'pdf' },
    ],
    notes: 'Payment received 15/04/2024.',
  },
  {
    id: 'VAL-004',
    ref: 'VAL-2024-04',
    project: 'Retail Park Car Park',
    contractor: 'ABC Groundworks',
    applicationNo: 1,
    periodStart: '2024-03-15',
    periodEnd: '2024-03-31',
    status: 'draft',
    grossValue: 450000,
    retention: 22500,
    retentionPercent: 5,
    previousValue: 0,
    thisApplication: 95000,
    certifiedValue: 0,
    lineItems: [
      { description: 'Site clearance', originalValue: 35000, variation: 0, remeasurement: 0, workDone: 35000, percentage: 100 },
      { description: 'Earthworks', originalValue: 120000, variation: -4200, remeasurement: 0, workDone: 60000, percentage: 50 },
    ],
    documents: [],
    notes: 'Draft valuation for initial works. Includes VAR-003 omission.',
  },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/10' },
  submitted: { label: 'Submitted', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  valued: { label: 'Valued', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  certified: { label: 'Certified', color: 'text-green-400', bg: 'bg-green-500/10' },
  paid: { label: 'Paid', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/10' },
};

export default function Valuations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredValuations = mockValuations.filter(v => {
    const matchesSearch = v.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.contractor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalSubmitted = mockValuations.filter(v => v.status === 'submitted' || v.status === 'valued').reduce((sum, v) => sum + v.thisApplication, 0);
  const totalCertified = mockValuations.filter(v => v.status === 'certified' || v.status === 'paid').reduce((sum, v) => sum + v.certifiedValue, 0);
  const totalPaid = mockValuations.filter(v => v.status === 'paid').reduce((sum, v) => sum + v.certifiedValue, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Valuations & Certificates
          </h2>
          <p className="text-gray-400 text-sm mt-1">Manage payment applications, interim certificates and valuations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
        >
          <Plus size={18} />
          New Valuation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Submitted</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">£{totalSubmitted.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="text-blue-400" size={20} />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Certified</p>
              <p className="text-2xl font-bold text-green-400 mt-1">£{totalCertified.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <FileCheck className="text-green-400" size={20} />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Paid</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">£{totalPaid.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CreditCard className="text-emerald-400" size={20} />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Applications</p>
              <p className="text-2xl font-bold text-white mt-1">{mockValuations.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Receipt className="text-orange-400" size={20} />
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
                placeholder="Search valuations..."
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
            <option value="submitted">Submitted</option>
            <option value="valued">Valued</option>
            <option value="certified">Certified</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-xs uppercase tracking-wider border-b border-gray-700">
                <th className="pb-3">Ref</th>
                <th className="pb-3">Project</th>
                <th className="pb-3">Contractor</th>
                <th className="pb-3">Period</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">This App.</th>
                <th className="pb-3 text-right">Certified</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {filteredValuations.map((val) => {
                const status = statusConfig[val.status];
                return (
                  <tr key={val.id} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                    <td className="py-3 font-mono text-orange-400">{val.ref}</td>
                    <td className="py-3">{val.project}</td>
                    <td className="py-3 text-gray-300">{val.contractor}</td>
                    <td className="py-3 text-gray-400 text-sm">{val.periodStart} - {val.periodEnd}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${status.bg} ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="py-3 text-right font-medium">£{val.thisApplication.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      {val.certifiedValue > 0 ? (
                        <span className="text-green-400">£{val.certifiedValue.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
                          <Eye size={16} />
                        </button>
                        <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
