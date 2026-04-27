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
  TrendingUp,
  Calendar,
  Search,
  RefreshCw,
  Send,
  ChevronDown,
  X,
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { submittalsApi } from '../../services/api';
import { toast } from 'sonner';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import clsx from 'clsx';

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
}

interface ReviewComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

interface ReviewQueueItem extends Submittal {
  reviewComments: ReviewComment[];
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
    specSection: String(item.spec_section || item.specSection || ''),
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
    specSection: '05120 - Structural Steel',
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
    specSection: '23 - HVAC',
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
    specSection: '08 - Openings',
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
    specSection: '07 - Thermal & Moisture',
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
    specSection: '03 - Concrete',
  },
  {
    id: '6',
    number: 'SUB-006',
    title: 'Electrical Panel Schedule',
    type: 'Shop Drawing',
    submittedBy: 'ElectroTech Solutions',
    submittedDate: new Date('2026-04-15'),
    dueDate: new Date('2026-04-22'),
    status: 'approved',
    priority: 'medium',
    reviewer: 'Emma Rodriguez',
    description: 'Main electrical panel schedule and distribution details',
    files: ['panel-schedule.pdf'],
    comments: 1,
    revisionNumber: 1,
    trade: 'Electrical',
    specSection: '26 - Electrical',
  },
];

export const SubmittalManagement: React.FC = () => {
  const [mainTab, setMainTab] = useState<'log' | 'review' | 'schedule' | 'analytics'>('log');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedSubmittal, setSelectedSubmittal] = useState<Submittal | null>(null);
  const [submittals, setSubmittals] = useState<Submittal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('');
  const [specSectionFilter, setSpecSectionFilter] = useState<string>('');
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedForReview, setSelectedForReview] = useState<Submittal | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'revise' | null>(null);

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
      } catch {
        toast.error('Failed to load submittals — using offline data');
        setSubmittals(MOCK_SUBMITTALS);
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
    // Status filter
    let statusMatch = true;
    if (activeTab === 'all') statusMatch = true;
    if (activeTab === 'pending') statusMatch = ['pending', 'under-review'].includes(submittal.status);
    if (activeTab === 'approved') statusMatch = ['approved', 'approved-with-comments'].includes(submittal.status);
    if (activeTab === 'rejected') statusMatch = ['rejected', 'resubmit-required'].includes(submittal.status);

    // Search filter
    const searchMatch = !searchQuery ||
      String(submittal.number).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(submittal.title).toLowerCase().includes(searchQuery.toLowerCase());

    // Discipline filter
    const disciplineMatch = !disciplineFilter || submittal.trade === disciplineFilter;

    // Spec section filter
    const specMatch = !specSectionFilter || submittal.specSection === specSectionFilter;

    return statusMatch && searchMatch && disciplineMatch && specMatch;
  });

  const reviewQueue = submittals.filter(s => ['pending', 'under-review'].includes(s.status));

  const disciplines = Array.from(new Set(submittals.map(s => s.trade)));
  const specSections = Array.from(new Set(submittals.map(s => s.specSection).filter(Boolean)));

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

  // Analytics data
  const statusBreakdown = [
    { name: 'Pending', value: submittals.filter(s => s.status === 'pending').length, color: '#FBBF24' },
    { name: 'Under Review', value: submittals.filter(s => s.status === 'under-review').length, color: '#3B82F6' },
    { name: 'Approved', value: submittals.filter(s => s.status === 'approved').length, color: '#10B981' },
    { name: 'Rejected', value: submittals.filter(s => s.status === 'rejected').length, color: '#EF4444' },
  ];

  const disciplineBreakdown = disciplines.map(d => ({
    name: d,
    value: submittals.filter(s => s.trade === d).length,
  }));

  const monthlyTrend = [
    { month: 'Feb', submitted: 8, approved: 5 },
    { month: 'Mar', submitted: 12, approved: 9 },
    { month: 'Apr', submitted: 6, approved: 4 },
  ];

  const avgReviewDays = Math.round(
    submittals.filter(s => s.status === 'approved').reduce((acc, s) => {
      const days = Math.ceil((s.dueDate.getTime() - s.submittedDate.getTime()) / (1000 * 3600 * 24));
      return acc + days;
    }, 0) / Math.max(submittals.filter(s => s.status === 'approved').length, 1)
  );

  const onTimeRate = Math.round(
    (submittals.filter(s => s.submittedDate <= s.dueDate).length / submittals.length) * 100
  );

  const approvedThisMonth = submittals.filter(s => {
    const now = new Date();
    return s.status === 'approved' && s.submittedDate.getMonth() === now.getMonth();
  }).length;

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <ModuleBreadcrumbs currentModule="submittal-management" />
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Upload className="h-8 w-8 text-blue-500" />
                Submittal Management
              </h1>
              <p className="text-gray-400 mt-1">Document review, approval workflows & compliance tracking</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Upload className="h-4 w-4" />
              New Submittal
            </button>
          </div>

          {/* Main Tabs */}
          <div className="flex gap-1 border-b border-gray-800 mt-6">
            {[
              { key: 'log', label: 'Log', icon: FileText },
              { key: 'review', label: 'Review Queue', icon: Eye },
              { key: 'schedule', label: 'Schedule', icon: Calendar },
              { key: 'analytics', label: 'Analytics', icon: BarChart3 },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setMainTab(tab.key as any)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                    mainTab === tab.key
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase mb-1">Total Submittals</p>
            <p className="text-2xl font-bold text-white">{statusCounts.total}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase mb-1">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-500">{statusCounts.pending}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase mb-1">Approved</p>
            <p className="text-2xl font-bold text-green-500">{statusCounts.approved}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-500">{statusCounts.rejected}</p>
          </div>
        </div>

        {/* LOG TAB */}
        {mainTab === 'log' && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-gray-800 space-y-4">
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[250px] relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search submittal #, title..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 pl-9 text-white text-sm"
                  />
                </div>
                <select
                  value={disciplineFilter}
                  onChange={e => setDisciplineFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                >
                  <option value="">All Disciplines</option>
                  {disciplines.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={specSectionFilter}
                  onChange={e => setSpecSectionFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                >
                  <option value="">All Spec Sections</option>
                  {specSections.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Sub-tabs */}
              <div className="flex gap-1 border-t border-gray-700 pt-4">
                {[
                  { key: 'all', label: `All (${statusCounts.total})` },
                  { key: 'pending', label: `Pending (${statusCounts.pending})` },
                  { key: 'approved', label: `Approved (${statusCounts.approved})` },
                  { key: 'rejected', label: `Rejected (${statusCounts.rejected})` }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={clsx(
                      'px-3 py-2 text-xs font-medium rounded transition-colors',
                      activeTab === key
                        ? 'bg-blue-600/30 text-blue-400'
                        : 'text-gray-400 hover:text-gray-200'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="cb-table-scroll touch-pan-x">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300 text-xs">Submittal #</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300 text-xs">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300 text-xs">Spec Section</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300 text-xs">Discipline</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300 text-xs">Submitted</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300 text-xs">Required</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-300 text-xs">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-300 text-xs">Reviewer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredSubmittals.map((submittal) => {
                    const daysUntilDue = getDaysUntilDue(submittal.dueDate);
                    const isOverdue = daysUntilDue < 0;
                    const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;

                    return (
                      <tr
                        key={submittal.id}
                        className="hover:bg-gray-800/50 cursor-pointer"
                        onClick={() => setSelectedSubmittal(submittal)}
                      >
                        <td className="py-3 px-4 text-gray-300 font-medium">{submittal.number}</td>
                        <td className="py-3 px-4">
                          <div className="text-gray-300">{submittal.title}</div>
                          <div className="text-xs text-gray-500">Rev {submittal.revisionNumber}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-xs">{submittal.specSection}</td>
                        <td className="py-3 px-4 text-gray-400">{submittal.trade}</td>
                        <td className="py-3 px-4 text-gray-400 text-xs">{submittal.submittedDate.toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <div className={clsx('text-xs font-medium', isOverdue ? 'text-red-400' : isDueSoon ? 'text-amber-400' : 'text-gray-400')}>
                            {submittal.dueDate.toLocaleDateString()}
                          </div>
                          <div className={clsx('text-xs', isOverdue ? 'text-red-400' : isDueSoon ? 'text-amber-400' : 'text-gray-500')}>
                            {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : isDueSoon ? `${daysUntilDue} days` : `${daysUntilDue} days`}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {getStatusIcon(submittal.status)}
                            <span className={clsx('px-2 py-1 rounded text-xs font-medium', getStatusColor(submittal.status))}>
                              {submittal.status.replace('-', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-400 text-xs">{submittal.reviewer}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REVIEW TAB */}
        {mainTab === 'review' && (
          <div className="space-y-4">
            {reviewQueue.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500/50 mx-auto mb-3" />
                <p className="text-gray-400">No submittals awaiting review</p>
              </div>
            ) : (
              reviewQueue.map(submittal => (
                <div key={submittal.id} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <p className="text-xs text-gray-400 uppercase mb-1">Submittal</p>
                      <p className="text-lg font-bold text-white">{submittal.number}</p>
                      <p className="text-sm text-gray-400 mt-1">{submittal.title}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase mb-1">Submitted By</p>
                      <p className="text-white">{submittal.submittedBy}</p>
                      <p className="text-xs text-gray-500 mt-1">{submittal.submittedDate.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase mb-1">Priority</p>
                      <span className={clsx('px-3 py-1 rounded text-sm font-medium inline-block', getPriorityColor(submittal.priority))}>
                        {submittal.priority}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-400 uppercase mb-2">Description</p>
                    <p className="text-gray-300 text-sm">{submittal.description}</p>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => { setSelectedForReview(submittal); setReviewAction('approve'); setShowReviewModal(true); }} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
                      Approve
                    </button>
                    <button onClick={() => { setSelectedForReview(submittal); setReviewAction('revise'); setShowReviewModal(true); }} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium">
                      Request Revisions
                    </button>
                    <button onClick={() => { setSelectedForReview(submittal); setReviewAction('reject'); setShowReviewModal(true); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SCHEDULE TAB */}
        {mainTab === 'schedule' && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <p className="text-sm text-gray-400">Submittal schedule with timeline overview</p>
            </div>
            <div className="cb-table-scroll touch-pan-x">
              <table className="w-full text-xs">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-300">Submittal</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-300">Submit By</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-300">Review Days</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-300">Required By</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {submittals.map(submittal => {
                    const reviewDays = Math.ceil((submittal.dueDate.getTime() - submittal.submittedDate.getTime()) / (1000 * 3600 * 24));
                    const isOnTrack = new Date() <= new Date(submittal.dueDate.getTime() - 2 * 24 * 60 * 60 * 1000);
                    const isAtRisk = !isOnTrack && new Date() <= submittal.dueDate;
                    const isOverdue = new Date() > submittal.dueDate;

                    return (
                      <tr key={submittal.id} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium text-gray-300">{submittal.number}</td>
                        <td className="px-3 py-3 text-center text-gray-400">{submittal.submittedDate.toLocaleDateString()}</td>
                        <td className="px-3 py-3 text-center text-gray-400">{reviewDays} days</td>
                        <td className="px-3 py-3 text-center text-gray-400">{submittal.dueDate.toLocaleDateString()}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={clsx('px-2 py-1 rounded text-xs font-medium', isOnTrack ? 'bg-green-500/20 text-green-400' : isAtRisk ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400')}>
                            {isOnTrack ? 'On Track' : isAtRisk ? 'At Risk' : 'Overdue'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {mainTab === 'analytics' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 uppercase mb-2">On-Time Rate</p>
                <p className="text-3xl font-bold text-green-400">{onTimeRate}%</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 uppercase mb-2">Avg Review Days</p>
                <p className="text-3xl font-bold text-blue-400">{avgReviewDays}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 uppercase mb-2">Total Submitted</p>
                <p className="text-3xl font-bold text-white">{statusCounts.total}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 uppercase mb-2">Approved This Month</p>
                <p className="text-3xl font-bold text-amber-400">{approvedThisMonth}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h3 className="text-white font-bold mb-4">By Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={statusBreakdown} cx="50%" cy="50%" labelLine={false} label={{ fill: '#9CA3AF', fontSize: 12 }} outerRadius={80} fill="#8884d8" dataKey="value">
                      {statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.5rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h3 className="text-white font-bold mb-4">By Discipline</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={disciplineBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: 12 }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.5rem' }} />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 lg:col-span-2">
                <h3 className="text-white font-bold mb-4">Monthly Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '0.5rem' }} />
                    <Legend />
                    <Line type="monotone" dataKey="submitted" stroke="#3B82F6" />
                    <Line type="monotone" dataKey="approved" stroke="#10B981" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submittal Detail Modal */}
      {selectedSubmittal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setSelectedSubmittal(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-800 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedSubmittal.number}</h2>
                <p className="text-gray-400">{selectedSubmittal.title}</p>
              </div>
              <button onClick={() => setSelectedSubmittal(null)} className="text-gray-400 hover:text-gray-200">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 uppercase mb-1">Type</label>
                    <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded text-sm font-medium inline-block">{selectedSubmittal.type}</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase mb-1">Submitted By</label>
                    <p className="text-gray-300">{selectedSubmittal.submittedBy}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase mb-1">Reviewer</label>
                    <p className="text-gray-300">{selectedSubmittal.reviewer}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase mb-1">Discipline</label>
                    <p className="text-gray-300">{selectedSubmittal.trade}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 uppercase mb-1">Priority</label>
                    <span className={clsx('px-3 py-1 rounded text-sm font-medium inline-block', getPriorityColor(selectedSubmittal.priority))}>
                      {selectedSubmittal.priority}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase mb-1">Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedSubmittal.status)}
                      <span className={clsx('px-3 py-1 rounded text-sm font-medium', getStatusColor(selectedSubmittal.status))}>
                        {selectedSubmittal.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase mb-1">Submitted</label>
                    <p className="text-gray-300">{selectedSubmittal.submittedDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase mb-1">Due Date</label>
                    <p className="text-gray-300">{selectedSubmittal.dueDate.toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase mb-2">Description</label>
                <p className="text-gray-300">{selectedSubmittal.description}</p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase mb-3">Attached Files</label>
                <div className="space-y-2">
                  {selectedSubmittal.files.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-400" />
                      <span className="flex-1 text-sm text-gray-300">{file}</span>
                      <button className="text-blue-400 hover:text-blue-300">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button onClick={() => setSelectedSubmittal(null)} className="px-4 py-2 btn btn-ghost rounded-lg">
                Close
              </button>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">
                Reject
              </button>
              <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium">
                Request Revisions
              </button>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedForReview && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setShowReviewModal(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">
                {reviewAction === 'approve' && 'Approve Submittal'}
                {reviewAction === 'reject' && 'Reject Submittal'}
                {reviewAction === 'revise' && 'Request Revisions'}
              </h3>
              <p className="text-sm text-gray-400 mt-1">{selectedForReview.number}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Comments</label>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm h-24"
                  placeholder="Add review comments..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button onClick={() => setShowReviewModal(false)} className="px-4 py-2 btn btn-ghost rounded-lg">
                Cancel
              </button>
              <button className={clsx('px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-white', reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : reviewAction === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700')}>
                <Send className="h-4 w-4" />
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default SubmittalManagement;
