import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Download,
  MessageSquare,
  Eye,
  BarChart3,
  LineChart as LineChartIcon,
  Plus,
  Send,
  TrendingUp,
  X,
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { submittalsApi } from '../../services/api';
import { toast } from 'sonner';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';

interface Submittal {
  id: string;
  number: string;
  title: string;
  type: 'Shop Drawing' | 'Product Data' | 'Sample' | 'Certificate' | 'Test Report';
  submittedBy: string;
  submittedDate: Date;
  dueDate: Date;
  status: 'pending' | 'under-review' | 'approved' | 'approved-with-comments' | 'rejected' | 'resubmit-required';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reviewer: string;
  description: string;
  files: string[];
  comments: number;
  revisionNumber: number;
  trade: string;
  specSection?: string;
  discipline?: string;
  reviewDays?: number;
  requiredBy?: Date;
}

interface Transmittal {
  id: string;
  number: string;
  date: Date;
  to: string;
  subject: string;
  submittalIds: string[];
  status: 'draft' | 'sent' | 'received' | 'archived';
}

// API response shape maps to Submittal interface
function mapApiToSubmittal(item: Record<string, unknown>): Submittal {
  return {
    id: String(item.id || ''),
    number: String(item.submittal_number || item.number || ''),
    title: String(item.title || ''),
    type: (item.type as Submittal['type']) || 'Product Data',
    submittedBy: String(item.submitted_by || item.submittedBy || ''),
    submittedDate: new Date(typeof item.submitted_date === 'string' ? item.submitted_date : typeof item.submittedDate === 'string' ? item.submittedDate : Date.now()),
    dueDate: new Date(typeof item.due_date === 'string' ? item.due_date : typeof item.dueDate === 'string' ? item.dueDate : Date.now()),
    status: (item.status as Submittal['status']) || 'pending',
    priority: (item.priority as Submittal['priority']) || 'medium',
    reviewer: String(item.reviewer || ''),
    description: String(item.description || ''),
    files: Array.isArray(item.files) ? (item.files as string[]).map(String) : [],
    comments: Number(item.comments || item.comment_count || 0),
    revisionNumber: Number(item.revision_number ?? item.revisionNumber ?? 1),
    trade: String(item.trade || ''),
  };
}

// Mock data fallback for when API is unavailable
const MOCK_SUBMITTALS: Submittal[] = [
  {
    id: '1',
    number: 'SUB-001',
    title: 'Structural Steel Shop Drawings',
    type: 'Shop Drawing',
    submittedBy: 'Steel Fabricators Ltd',
    submittedDate: new Date('2026-03-28'),
    dueDate: new Date('2026-04-05'),
    status: 'under-review',
    priority: 'high',
    reviewer: 'James Wilson',
    description: 'Shop drawings for main structural steel frame, Level 1-3',
    files: ['steel-drawings-v2.pdf', 'connection-details.dwg'],
    comments: 3,
    revisionNumber: 2,
    trade: 'Structural',
    specSection: '05120',
    discipline: 'Structural Steel',
    reviewDays: 5,
    requiredBy: new Date('2026-04-05'),
  },
  {
    id: '2',
    number: 'SUB-002',
    title: 'HVAC Equipment Product Data',
    type: 'Product Data',
    submittedBy: 'Climate Systems Inc',
    submittedDate: new Date('2026-03-25'),
    dueDate: new Date('2026-04-02'),
    status: 'approved-with-comments',
    priority: 'medium',
    reviewer: 'Sarah Mitchell',
    description: 'Product data sheets for rooftop HVAC units and indoor air handlers',
    files: ['hvac-product-data.pdf', 'performance-specs.xlsx'],
    comments: 5,
    revisionNumber: 1,
    trade: 'HVAC',
    specSection: '23050',
    discipline: 'HVAC',
    reviewDays: 3,
    requiredBy: new Date('2026-04-02'),
  },
  {
    id: '3',
    number: 'SUB-003',
    title: 'Curtain Wall System Sample',
    type: 'Sample',
    submittedBy: 'Glazing Solutions Ltd',
    submittedDate: new Date('2026-03-30'),
    dueDate: new Date('2026-04-10'),
    status: 'pending',
    priority: 'critical',
    reviewer: 'Michael Chen',
    description: 'Physical sample of curtain wall glazing system for facade',
    files: ['sample-specs.pdf', 'installation-guide.pdf'],
    comments: 0,
    revisionNumber: 1,
    trade: 'Exterior',
    specSection: '08800',
    discipline: 'Glazing',
    reviewDays: 7,
    requiredBy: new Date('2026-04-10'),
  },
  {
    id: '4',
    number: 'SUB-004',
    title: 'Fire Safety Test Report',
    type: 'Test Report',
    submittedBy: 'Fire Protection Co',
    submittedDate: new Date('2026-03-20'),
    dueDate: new Date('2026-03-28'),
    status: 'approved',
    priority: 'high',
    reviewer: 'Lisa Thompson',
    description: 'Fire resistance testing report for structural steel assemblies',
    files: ['fire-test-report.pdf', 'certification.pdf'],
    comments: 2,
    revisionNumber: 1,
    trade: 'Fire Safety',
    specSection: '07840',
    discipline: 'Fire Protection',
    reviewDays: 3,
    requiredBy: new Date('2026-03-28'),
  },
  {
    id: '5',
    number: 'SUB-005',
    title: 'Concrete Mix Design',
    type: 'Certificate',
    submittedBy: 'Premier Concrete Ltd',
    submittedDate: new Date('2026-03-15'),
    dueDate: new Date('2026-03-25'),
    status: 'rejected',
    priority: 'high',
    reviewer: 'David Park',
    description: 'Mix design certification for high-strength concrete foundation',
    files: ['mix-design.pdf'],
    comments: 7,
    revisionNumber: 3,
    trade: 'Concrete',
    specSection: '03300',
    discipline: 'Concrete',
    reviewDays: 4,
    requiredBy: new Date('2026-03-25'),
  },
];

const MOCK_TRANSMITTALS: Transmittal[] = [
  { id: '1', number: 'TM-001', date: new Date('2026-04-26'), to: 'Main Contractor', subject: 'Submittal Package - Week 17', submittalIds: ['1', '2'], status: 'sent' },
  { id: '2', number: 'TM-002', date: new Date('2026-04-22'), to: 'Design Architect', subject: 'Review Cycle 2 - Structural & HVAC', submittalIds: ['1'], status: 'received' },
  { id: '3', number: 'TM-003', date: new Date('2026-04-19'), to: 'Main Contractor', subject: 'Fire Safety Approval', submittalIds: ['4'], status: 'archived' },
];

export const SubmittalManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'log' | 'review' | 'schedule' | 'analytics' | 'transmittals'>('log');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedSubmittal, setSelectedSubmittal] = useState<Submittal | null>(null);
  const [showTransmittalModal, setShowTransmittalModal] = useState(false);
  const [_showFilters, _setShowFilters] = useState(false);
  const [submittals, setSubmittals] = useState<Submittal[]>([]);
  const [transmittals, setTransmittals] = useState<Transmittal[]>([]);
  const [_loading, setLoading] = useState(true);
  const [selectedForTransmittal, setSelectedForTransmittal] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState('');
  const [filterSpecSection, setFilterSpecSection] = useState('');

  useEffect(() => {
    async function loadSubmittals() {
      try {
        setLoading(true);
        const data = await submittalsApi.getAll();
        const items: Record<string, unknown>[] = Array.isArray(data)
          ? data
          : Array.isArray((data as Record<string, unknown>).submittals)
            ? (data as Record<string, unknown>).submittals as Record<string, unknown>[]
            : [];
        setSubmittals(items.map((item) => mapApiToSubmittal(item)));
        setTransmittals(MOCK_TRANSMITTALS);
      } catch {
        toast.error('Failed to load submittals — using offline data');
        setSubmittals(MOCK_SUBMITTALS);
        setTransmittals(MOCK_TRANSMITTALS);
      } finally {
        setLoading(false);
      }
    }
    loadSubmittals();
  }, []);

  // Expose reload for create/update operations
  const _reloadSubmittals = async () => {
    try {
      const data = await submittalsApi.getAll();
      const items: Record<string, unknown>[] = Array.isArray(data)
        ? data
        : Array.isArray((data as Record<string, unknown>).submittals)
          ? (data as Record<string, unknown>).submittals as Record<string, unknown>[]
          : [];
      setSubmittals(items.map((item) => mapApiToSubmittal(item)));
    } catch {
      toast.error('Failed to refresh submittals');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'under-review': return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'approved-with-comments': return <CheckCircle className="h-4 w-4 text-yellow-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'resubmit-required': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under-review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'approved-with-comments': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'resubmit-required': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSubmittals = submittals.filter(submittal => {
    if (filterTab === 'all') return true;
    if (filterTab === 'pending') return ['pending', 'under-review'].includes(submittal.status);
    if (filterTab === 'approved') return ['approved', 'approved-with-comments'].includes(submittal.status);
    if (filterTab === 'rejected') return ['rejected', 'resubmit-required'].includes(submittal.status);
    return true;
  });

  const logFilteredSubmittals = submittals.filter(submittal => {
    if (filterStatus && submittal.status !== filterStatus) return false;
    if (filterDiscipline && submittal.discipline !== filterDiscipline) return false;
    if (filterSpecSection && submittal.specSection !== filterSpecSection) return false;
    return true;
  });

  const getDaysUntilDue = (dueDate: Date): number => {
    const today = new Date();
    const timeDiff = dueDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const statusCounts = {
    pending: submittals.filter(s => ['pending', 'under-review'].includes(s.status)).length,
    approved: submittals.filter(s => ['approved', 'approved-with-comments'].includes(s.status)).length,
    rejected: submittals.filter(s => ['rejected', 'resubmit-required'].includes(s.status)).length,
    total: submittals.length
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <ModuleBreadcrumbs currentModule="submittal-management" />
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="h-8 w-8 text-blue-600" />
            Submittal Management
          </h1>
          <p className="text-gray-600 mt-1">Document review, approval workflows & compliance tracking</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Upload className="h-4 w-4" />
            New Submittal
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Submittals</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="card">
        <div className="card-header">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'log', label: 'Log' },
              { key: 'review', label: 'Review' },
              { key: 'schedule', label: 'Schedule' },
              { key: 'analytics', label: 'Analytics' },
              { key: 'transmittals', label: 'Transmittals' }
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab(key as 'log' | 'review' | 'schedule' | 'analytics' | 'transmittals')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="card-content">
          {/* LOG TAB */}
          {activeTab === 'log' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="select select-bordered select-sm">
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="under-review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select value={filterDiscipline} onChange={(e) => setFilterDiscipline(e.target.value)} className="select select-bordered select-sm">
                  <option value="">All Disciplines</option>
                  <option value="Structural Steel">Structural Steel</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Glazing">Glazing</option>
                  <option value="Fire Protection">Fire Protection</option>
                  <option value="Concrete">Concrete</option>
                </select>
                <select value={filterSpecSection} onChange={(e) => setFilterSpecSection(e.target.value)} className="select select-bordered select-sm">
                  <option value="">All Spec Sections</option>
                  <option value="05120">05120</option>
                  <option value="23050">23050</option>
                  <option value="08800">08800</option>
                  <option value="07840">07840</option>
                  <option value="03300">03300</option>
                </select>
              </div>
              <div className="cb-table-scroll touch-pan-x">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold">#</th>
                      <th className="text-left py-3 px-4 font-semibold">Title</th>
                      <th className="text-left py-3 px-4 font-semibold">Spec Section</th>
                      <th className="text-left py-3 px-4 font-semibold">Discipline</th>
                      <th className="text-left py-3 px-4 font-semibold">Submitted</th>
                      <th className="text-left py-3 px-4 font-semibold">Due</th>
                      <th className="text-center py-3 px-4 font-semibold">Status</th>
                      <th className="text-center py-3 px-4 font-semibold">Reviewer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logFilteredSubmittals.map((submittal) => (
                      <tr key={submittal.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedSubmittal(submittal)}>
                        <td className="py-3 px-4 font-medium">{submittal.number}</td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{submittal.title}</div>
                          <div className="text-xs text-gray-500">{submittal.type}</div>
                        </td>
                        <td className="py-3 px-4">{submittal.specSection}</td>
                        <td className="py-3 px-4">{submittal.discipline}</td>
                        <td className="py-3 px-4 text-xs">{submittal.submittedDate.toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-xs">{submittal.dueDate.toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(submittal.status)}`}>
                            {submittal.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-xs">{submittal.reviewer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REVIEW TAB */}
          {activeTab === 'review' && (
            <div className="space-y-4 p-4">
              {submittals
                .filter(s => ['pending', 'under-review'].includes(s.status))
                .map((submittal) => (
                  <div key={submittal.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900">{submittal.number}: {submittal.title}</h4>
                        <p className="text-sm text-gray-600">Submitted by {submittal.submittedBy}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(submittal.priority)}`}>
                        {submittal.priority}
                      </span>
                    </div>
                    <textarea placeholder="Add comments..." className="textarea textarea-bordered textarea-sm w-full" rows={2} />
                    <div className="flex gap-2 justify-end">
                      <button className="btn btn-sm btn-error gap-1">
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                      <button className="btn btn-sm btn-warning gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Revisions
                      </button>
                      <button className="btn btn-sm btn-success gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* SCHEDULE TAB */}
          {activeTab === 'schedule' && (
            <div className="cb-table-scroll touch-pan-x">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold">Submittal</th>
                    <th className="text-center py-3 px-4 font-semibold">Submit By</th>
                    <th className="text-center py-3 px-4 font-semibold">Review Days</th>
                    <th className="text-center py-3 px-4 font-semibold">Required By</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submittals.map((submittal) => {
                    const daysUntilDue = getDaysUntilDue(submittal.requiredBy || submittal.dueDate);
                    const isOverdue = daysUntilDue < 0;
                    const isAtRisk = daysUntilDue < 2 && daysUntilDue >= 0;
                    const onTrack = daysUntilDue >= 2;

                    return (
                      <tr key={submittal.id} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium">{submittal.number}: {submittal.title}</td>
                        <td className="py-3 px-4 text-center text-xs">{submittal.submittedDate.toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-center text-xs font-medium">{submittal.reviewDays} days</td>
                        <td className="py-3 px-4 text-center text-xs">{(submittal.requiredBy || submittal.dueDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-center">
                          {isOverdue && <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">Overdue</span>}
                          {isAtRisk && <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">At Risk</span>}
                          {onTrack && <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">On Track</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 p-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="text-sm text-gray-700">On-Time Rate</div>
                  <div className="text-3xl font-bold text-blue-600">92%</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <div className="text-sm text-gray-700">Avg Review Days</div>
                  <div className="text-3xl font-bold text-green-600">4.2</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
                  <div className="text-sm text-gray-700">This Month</div>
                  <div className="text-3xl font-bold text-yellow-600">{submittals.length}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="text-sm text-gray-700">Avg Comments</div>
                  <div className="text-3xl font-bold text-purple-600">3.4</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">By Discipline</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Structural', count: 8 },
                    { name: 'HVAC', count: 6 },
                    { name: 'Glazing', count: 4 },
                    { name: 'Fire Protection', count: 3 },
                    { name: 'Concrete', count: 5 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Monthly Trend</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { month: 'Jan', submittals: 8 },
                    { month: 'Feb', submittals: 12 },
                    { month: 'Mar', submittals: 15 },
                    { month: 'Apr', submittals: 10 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="submittals" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TRANSMITTALS TAB */}
          {activeTab === 'transmittals' && (
            <div className="space-y-4 p-4">
              <button onClick={() => setShowTransmittalModal(true)} className="btn btn-primary btn-sm gap-2">
                <Plus className="h-4 w-4" />
                New Transmittal
              </button>

              <div className="cb-table-scroll touch-pan-x">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold">Transmittal #</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 font-semibold">To</th>
                      <th className="text-left py-3 px-4 font-semibold">Subject</th>
                      <th className="text-center py-3 px-4 font-semibold"># Submittals</th>
                      <th className="text-center py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transmittals.map((tm) => (
                      <tr key={tm.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{tm.number}</td>
                        <td className="py-3 px-4 text-xs">{tm.date.toLocaleDateString()}</td>
                        <td className="py-3 px-4">{tm.to}</td>
                        <td className="py-3 px-4">{tm.subject}</td>
                        <td className="py-3 px-4 text-center font-medium">{tm.submittalIds.length}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            tm.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            tm.status === 'received' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {tm.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {showTransmittalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">New Transmittal</h3>
                      <button onClick={() => setShowTransmittalModal(false)} className="text-gray-400">
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                        <input type="text" placeholder="Recipient" className="input input-bordered w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <input type="text" placeholder="Subject line" className="input input-bordered w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Submittals</label>
                        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                          {submittals.map((s) => (
                            <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" className="checkbox checkbox-sm" onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedForTransmittal(new Set([...selectedForTransmittal, s.id]));
                                } else {
                                  const newSet = new Set(selectedForTransmittal);
                                  newSet.delete(s.id);
                                  setSelectedForTransmittal(newSet);
                                }
                              }} />
                              <span className="text-sm">{s.number}: {s.title}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button onClick={() => setShowTransmittalModal(false)} className="btn btn-ghost">
                        Cancel
                      </button>
                      <button className="btn btn-primary gap-2">
                        <Send className="h-4 w-4" />
                        Create & Send
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Submittal Detail Modal */}
      {selectedSubmittal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedSubmittal.number}</h2>
                  <p className="text-gray-600">{selectedSubmittal.title}</p>
                </div>
                <button
                  onClick={() => setSelectedSubmittal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm font-medium">
                      {selectedSubmittal.type}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Submitted By</label>
                    <p className="text-sm text-gray-900">{selectedSubmittal.submittedBy}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer</label>
                    <p className="text-sm text-gray-900">{selectedSubmittal.reviewer}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trade</label>
                    <p className="text-sm text-gray-900">{selectedSubmittal.trade}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getPriorityColor(selectedSubmittal.priority)}`}>
                      {selectedSubmittal.priority}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedSubmittal.status)}
                      <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(selectedSubmittal.status)}`}>
                        {selectedSubmittal.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <p className="text-sm text-gray-900">{selectedSubmittal.dueDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Revision</label>
                    <p className="text-sm text-gray-900">Rev {selectedSubmittal.revisionNumber}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-sm text-gray-900">{selectedSubmittal.description}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Attached Files</label>
                <div className="space-y-2">
                  {selectedSubmittal.files.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <span className="flex-1 text-sm text-gray-900">{file}</span>
                      <button className="text-blue-600 hover:text-blue-800">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedSubmittal(null)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Reject
                </button>
                <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                  Approve with Comments
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmittalManagement;
