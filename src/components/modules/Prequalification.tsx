/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import {
  Plus,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Star,
  Award,
  FileText,
  Search,
  X,
  Download,
  Bell,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { EmptyState } from '../ui/EmptyState';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { usePrequalification } from '../../hooks/useData';
import { uploadFile } from '../../services/api';

interface Subcontractor {
  id: string;
  company: string;
  trade: string;
  submissionDate: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  score: number;
  overallScore?: number;
  approvalDate?: string;
  expiryDate?: string;
  contact?: string;
  tier?: 'gold' | 'silver' | 'bronze';
  location?: string;
  insurance?: string;
}

const MOCK_SUBCONTRACTORS: Subcontractor[] = [
  {
    id: '1',
    company: 'Able Groundworks Ltd',
    trade: 'Groundworks',
    submissionDate: '2026-03-15',
    status: 'approved',
    score: 92,
    overallScore: 92,
    approvalDate: '2026-03-20',
    expiryDate: '2027-03-20',
    tier: 'gold',
    contact: 'John Wilson',
    location: 'Manchester',
    insurance: '£10M',
  },
  {
    id: '2',
    company: 'Premier Electrical Services',
    trade: 'Electrical Installation',
    submissionDate: '2026-03-10',
    status: 'approved',
    score: 85,
    overallScore: 85,
    approvalDate: '2026-03-18',
    expiryDate: '2027-03-18',
    tier: 'silver',
    contact: 'Sarah Ahmed',
    location: 'London',
    insurance: '£6M',
  },
  {
    id: '3',
    company: 'SafeBuild Scaffolding',
    trade: 'Scaffolding',
    submissionDate: '2026-03-20',
    status: 'approved',
    score: 88,
    overallScore: 88,
    approvalDate: '2026-03-25',
    expiryDate: '2026-12-25',
    tier: 'silver',
    contact: 'David Clarke',
    location: 'Birmingham',
    insurance: '£5M',
  },
  {
    id: '4',
    company: 'TechBuild Mechanical',
    trade: 'Mechanical Installation',
    submissionDate: '2026-02-28',
    status: 'under_review',
    score: 0,
    contact: 'Emma Harris',
    location: 'Leeds',
    insurance: '£8M',
  },
  {
    id: '5',
    company: 'Elite Concrete Solutions',
    trade: 'Concrete Works',
    submissionDate: '2026-02-01',
    status: 'approved',
    score: 78,
    overallScore: 78,
    approvalDate: '2026-02-15',
    expiryDate: '2026-11-15',
    tier: 'bronze',
    contact: 'Michael Smith',
    location: 'Bristol',
    insurance: '£4M',
  },
  {
    id: '6',
    company: 'Precision Plumbing Ltd',
    trade: 'Plumbing',
    submissionDate: '2026-03-05',
    status: 'pending',
    score: 0,
    contact: 'Rachel Green',
    location: 'Manchester',
    insurance: '£3M',
  },
  {
    id: '7',
    company: 'BuildRight Carpentry',
    trade: 'Carpentry',
    submissionDate: '2026-01-20',
    status: 'approved',
    score: 81,
    overallScore: 81,
    approvalDate: '2026-02-01',
    expiryDate: '2026-08-01',
    tier: 'silver',
    contact: 'Thomas Brown',
    location: 'Edinburgh',
    insurance: '£2M',
  },
  {
    id: '8',
    company: 'Advanced Roofing Systems',
    trade: 'Roofing',
    submissionDate: '2026-03-01',
    status: 'approved',
    score: 89,
    overallScore: 89,
    approvalDate: '2026-03-10',
    expiryDate: '2027-03-10',
    tier: 'silver',
    contact: 'Kevin Davies',
    location: 'Cardiff',
    insurance: '£7M',
  },
  {
    id: '9',
    company: 'Quality Finishes Ltd',
    trade: 'Interior Finishing',
    submissionDate: '2026-02-15',
    status: 'rejected',
    score: 45,
    contact: 'Laura White',
    location: 'Southampton',
    insurance: '£1M',
  },
  {
    id: '10',
    company: 'ProSecure Safety Equipment',
    trade: 'Safety & PPE Supply',
    submissionDate: '2026-03-22',
    status: 'under_review',
    score: 0,
    contact: 'Robert Turner',
    location: 'Glasgow',
    insurance: '£2.5M',
  },
];

const SCORING_CRITERIA = [
  { name: 'Financial Stability', weight: 20 },
  { name: 'Insurance & Compliance', weight: 15 },
  { name: 'Health & Safety Record', weight: 25 },
  { name: 'References', weight: 15 },
  { name: 'Technical Capability', weight: 15 },
  { name: 'Quality Management', weight: 10 },
];

const TRADES = [
  'Groundworks',
  'Structural Steel',
  'Concrete Works',
  'Mechanical Installation',
  'Electrical Installation',
  'Plumbing',
  'Carpentry',
  'Roofing',
  'Scaffolding',
  'Interior Finishing',
  'Safety & PPE Supply',
];

export default function Prequalification() {
  const [activeTab, setActiveTab] = useState<
    'applications' | 'assessment' | 'approved' | 'expiring' | 'reports'
  >('applications');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedSubcontractor, setSelectedSubcontractor] =
    useState<Subcontractor | null>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const [subcontractors, setSubcontractors] =
    useState<Subcontractor[]>(USE_MOCK ? MOCK_SUBCONTRACTORS : []);
  const [scoringData, setScoringData] = useState<Record<string, number>>({});
  const [appForm, setAppForm] = useState({
    company: '',
    trade: 'Groundworks',
    contact: '',
    location: '',
    insurance: '',
  });

  const { useList, useCreate } = usePrequalification;
  const { data: apiPrequal = [] } = useList() as { data: any[] };

  // Merge API data with mock when mock is enabled and API is empty
  const effectiveSubcontractors = useMemo(() => {
    if (USE_MOCK && (!apiPrequal || apiPrequal.length === 0)) {
      return subcontractors;
    }
    if (apiPrequal && apiPrequal.length > 0) {
      return apiPrequal as Subcontractor[];
    }
    return subcontractors;
  }, [apiPrequal, subcontractors]);

  // Filter and search
  const filteredApplications = useMemo(() =>
    effectiveSubcontractors.filter((s) => {
      const matchesSearch =
        s.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contact?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    }),
    [effectiveSubcontractors, searchTerm]
  );

  const approvedList = useMemo(() =>
    effectiveSubcontractors
      .filter((s) => s.status === 'approved')
      .filter((s) => !selectedTrade || s.trade === selectedTrade)
      .filter(
        (s) =>
          s.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.contact?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [effectiveSubcontractors, searchTerm, selectedTrade]
  );

  const expiringList = useMemo(() =>
    effectiveSubcontractors
      .filter((s) => s.status === 'approved' && s.expiryDate)
      .filter((s) => {
        const expiryDate = new Date(s.expiryDate!);
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
      })
      .sort((a, b) => {
        const aExpiry = new Date(a.expiryDate!).getTime();
        const bExpiry = new Date(b.expiryDate!).getTime();
        return aExpiry - bExpiry;
      }),
    [effectiveSubcontractors]
  );

  const stats = useMemo(() => {
    const approved = effectiveSubcontractors.filter((s) => s.status === 'approved').length;
    const avgScore =
      effectiveSubcontractors
        .filter((s) => s.status === 'approved' && s.score > 0)
        .reduce((sum, s) => sum + s.score, 0) /
        (effectiveSubcontractors.filter((s) => s.status === 'approved' && s.score > 0)
          .length || 1) || 0;
    const byTrade = TRADES.map((trade) => ({
      name: trade,
      value: effectiveSubcontractors.filter(
        (s) => s.status === 'approved' && s.trade === trade
      ).length,
    })).filter((t) => t.value > 0);

    const statusCounts = {
      pending: effectiveSubcontractors.filter((s) => s.status === 'pending').length,
      under_review: effectiveSubcontractors.filter((s) => s.status === 'under_review')
        .length,
      approved: approved,
      rejected: effectiveSubcontractors.filter((s) => s.status === 'rejected').length,
    };

    return { approved, avgScore, byTrade, statusCounts };
  }, [effectiveSubcontractors]);

  const pieData = [
    { name: 'Pending', value: stats.statusCounts.pending },
    { name: 'Under Review', value: stats.statusCounts.under_review },
    { name: 'Approved', value: stats.statusCounts.approved },
    { name: 'Rejected', value: stats.statusCounts.rejected },
  ].filter((d) => d.value > 0);

  const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444'];

  const handleAddApplication = () => {
    if (!appForm.company) return;
    const newSubcontractor: Subcontractor = {
      id: Math.random().toString(36).substr(2, 9),
      company: appForm.company,
      trade: appForm.trade,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      score: 0,
      contact: appForm.contact,
      location: appForm.location,
      insurance: appForm.insurance,
    };
    setSubcontractors([...subcontractors, newSubcontractor]);
    setShowApplicationModal(false);
    setAppForm({
      company: '',
      trade: 'Groundworks',
      contact: '',
      location: '',
      insurance: '',
    });
  };

  const handleStartAssessment = (sub: Subcontractor) => {
    setSelectedSubcontractor(sub);
    const initialScoring: Record<string, number> = {};
    SCORING_CRITERIA.forEach((c, i) => {
      initialScoring[i.toString()] = sub.score || 3;
    });
    setScoringData(initialScoring);
    setShowAssessmentModal(true);
  };

  const calculateWeightedScore = (): number => {
    let totalScore = 0;
    let totalWeight = 0;
    SCORING_CRITERIA.forEach((criteria, index) => {
      const score = scoringData[index.toString()] || 3;
      totalScore += score * criteria.weight;
      totalWeight += criteria.weight;
    });
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  };

  const handleSaveAssessment = () => {
    if (!selectedSubcontractor) return;
    const newScore = calculateWeightedScore();
    const status: any =
      newScore >= 80 ? 'approved' : newScore >= 60 ? 'under_review' : 'rejected';
    const updatedSubs = subcontractors.map((s) =>
      s.id === selectedSubcontractor.id
        ? {
            ...s,
            score: newScore,
            status,
            overallScore: newScore,
            approvalDate:
              status === 'approved'
                ? new Date().toISOString().split('T')[0]
                : undefined,
            expiryDate:
              status === 'approved'
                ? new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0]
                : undefined,
          }
        : s
    );
    setSubcontractors(updatedSubs);
    setShowAssessmentModal(false);
    setSelectedSubcontractor(null);
  };

  const getDaysUntilExpiry = (expiryDate: string): number => {
    return Math.ceil(
      (new Date(expiryDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  const getExpiryColor = (days: number): string => {
    if (days <= 30) return 'text-red-400 bg-red-500/10';
    if (days <= 60) return 'text-amber-400 bg-amber-500/10';
    return 'text-green-400 bg-green-500/10';
  };

  const handleExportReport = () => {
    const csv = [
      ['Company', 'Trade', 'Status', 'Score', 'Approval Date', 'Expiry Date'],
      ...approvedList.map((s) => [
        s.company,
        s.trade,
        s.status,
        s.score,
        s.approvalDate || '',
        s.expiryDate || '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prequalification-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <>
      <ModuleBreadcrumbs currentModule="prequalification" onNavigate={() => {}} />
      <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">
              Subcontractor Prequalification
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Manage and assess subcontractor applications
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowApplicationModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition"
          >
            <Plus size={18} /> New Application
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="text-green-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold">Approved</p>
                <p className="text-2xl font-bold text-green-400">
                  {stats.approved}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold">Under Review</p>
                <p className="text-2xl font-bold text-blue-400">
                  {stats.statusCounts.under_review}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="text-amber-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold">Expiring Soon</p>
                <p className="text-2xl font-bold text-amber-400">
                  {expiringList.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Building2 className="text-purple-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold">Total</p>
                <p className="text-2xl font-bold text-purple-400">
                  {effectiveSubcontractors.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700 overflow-x-auto">
          {[
            { id: 'applications', label: 'Applications' },
            { id: 'assessment', label: 'Assessment' },
            { id: 'approved', label: 'Approved List' },
            { id: 'expiring', label: 'Expiring Soon' },
            { id: 'reports', label: 'Reports' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as typeof activeTab)
              }
              className={`px-4 py-2 text-sm font-medium rounded transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'applications' && (
            <div className="space-y-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                          Company
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                          Trade
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                          Submission Date
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                          Score
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredApplications.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center">
                            <EmptyState
                              icon={Building2}
                              title="No applications found"
                              description="No subcontractor applications match your search."
                              variant="documents"
                            />
                          </td>
                        </tr>
                      ) : (
                        filteredApplications.map((sub) => (
                          <tr
                            key={sub.id}
                            className="hover:bg-gray-700/50 transition"
                          >
                            <td className="px-4 py-3">
                              <p className="text-white font-medium">
                                {sub.company}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-gray-400 text-sm">
                                {sub.trade}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-gray-400 text-sm">
                                {new Date(sub.submissionDate).toLocaleDateString(
                                  'en-GB'
                                )}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  sub.status === 'approved'
                                    ? 'bg-green-500/10 text-green-400'
                                    : sub.status === 'under_review'
                                      ? 'bg-blue-500/10 text-blue-400'
                                      : sub.status === 'pending'
                                        ? 'bg-amber-500/10 text-amber-400'
                                        : 'bg-red-500/10 text-red-400'
                                }`}
                              >
                                {sub.status === 'under_review'
                                  ? 'Under Review'
                                  : sub.status.charAt(0).toUpperCase() +
                                    sub.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {sub.score > 0 ? (
                                <p className="text-white font-semibold">
                                  {sub.score}%
                                </p>
                              ) : (
                                <p className="text-gray-500">-</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleStartAssessment(sub)}
                                className="text-amber-400 hover:text-amber-300 text-sm font-medium transition"
                              >
                                Assess
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assessment' && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              {selectedSubcontractor ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {selectedSubcontractor.company}
                    </h3>
                    <p className="text-gray-400">
                      Trade: {selectedSubcontractor.trade}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-white">
                      Scoring Matrix
                    </h4>
                    {SCORING_CRITERIA.map((criteria, index) => (
                      <div
                        key={index}
                        className="bg-gray-700 rounded p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-white font-medium">
                            {criteria.name}
                          </label>
                          <span className="text-gray-400 text-sm">
                            Weight: {criteria.weight}%
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={
                              scoringData[index.toString()] || 3
                            }
                            onChange={(e) =>
                              setScoringData({
                                ...scoringData,
                                [index.toString()]: parseInt(
                                  e.target.value
                                ),
                              })
                            }
                            className="flex-1"
                          />
                          <span className="text-amber-400 font-bold w-8 text-right">
                            {scoringData[index.toString()] || 3}/5
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <p className="text-gray-300 text-sm mb-1">
                      Weighted Total Score
                    </p>
                    <p className="text-3xl font-bold text-amber-400">
                      {calculateWeightedScore()}%
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedSubcontractor(null)}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveAssessment}
                      className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition"
                    >
                      Save Assessment
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">
                    Select an application from the Applications tab to assess
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'approved' && (
            <div className="space-y-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search approved subcontractors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                  <select
                    value={selectedTrade}
                    onChange={(e) => setSelectedTrade(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">All Trades</option>
                    {TRADES.map((trade) => (
                      <option key={trade} value={trade}>
                        {trade}
                      </option>
                    ))}
                  </select>
                </div>

                {approvedList.length === 0 ? (
                  <div className="py-12 text-center">
                    <EmptyState
                      icon={CheckCircle}
                      title="No approved subcontractors"
                      description="No subcontractors match your filters"
                      variant="documents"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {approvedList.map((sub) => (
                      <div
                        key={sub.id}
                        className="bg-gray-700 rounded-lg p-4 space-y-3 border border-gray-600"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-white font-bold">
                              {sub.company}
                            </h4>
                            <p className="text-gray-400 text-sm">
                              {sub.trade}
                            </p>
                          </div>
                          {sub.tier && (
                            <div
                              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                                sub.tier === 'gold'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : sub.tier === 'silver'
                                    ? 'bg-gray-400/20 text-gray-300'
                                    : 'bg-orange-500/20 text-orange-400'
                              }`}
                            >
                              {sub.tier === 'gold' && (
                                <Award className="w-3 h-3" />
                              )}
                              {sub.tier === 'silver' && (
                                <Star className="w-3 h-3" />
                              )}
                              {sub.tier.charAt(0).toUpperCase() +
                                sub.tier.slice(1)}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs">Score</p>
                            <p className="text-amber-400 font-bold">
                              {sub.score}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Contact</p>
                            <p className="text-white">{sub.contact}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Location</p>
                            <p className="text-white">{sub.location}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Insurance</p>
                            <p className="text-white">{sub.insurance}</p>
                          </div>
                        </div>

                        {sub.expiryDate && (
                          <div className="pt-2 border-t border-gray-600">
                            <p className="text-gray-500 text-xs">
                              Expires:{' '}
                              {new Date(
                                sub.expiryDate
                              ).toLocaleDateString('en-GB')}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'expiring' && (
            <div className="space-y-3">
              {expiringList.length === 0 ? (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
                  <EmptyState
                    icon={Clock}
                    title="No expiring prequalifications"
                    description="No subcontractors are expiring within the next 90 days"
                    variant="documents"
                  />
                </div>
              ) : (
                expiringList.map((sub) => {
                  const daysLeft = getDaysUntilExpiry(sub.expiryDate!);
                  return (
                    <div
                      key={sub.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <h4 className="text-white font-bold">{sub.company}</h4>
                        <p className="text-gray-400 text-sm">{sub.trade}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          Expires:{' '}
                          {new Date(sub.expiryDate!).toLocaleDateString(
                            'en-GB'
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div
                          className={`px-3 py-2 rounded-lg text-center font-bold ${getExpiryColor(daysLeft)}`}
                        >
                          <p>{daysLeft} days</p>
                        </div>
                        <button
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                          title="Send reminder email"
                        >
                          <Bell className="w-4 h-4" />
                          Remind
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-xs font-semibold mb-1">
                      Approved
                    </p>
                    <p className="text-3xl font-bold text-green-400">
                      {stats.approved}
                    </p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-xs font-semibold mb-1">
                      Avg Score
                    </p>
                    <p className="text-3xl font-bold text-amber-400">
                      {Math.round(stats.avgScore)}%
                    </p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-xs font-semibold mb-1">
                      Total
                    </p>
                    <p className="text-3xl font-bold text-blue-400">
                      {subcontractors.length}
                    </p>
                  </div>
                </div>

                {/* By Trade */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-white font-bold mb-4">
                    Approved by Trade
                  </h3>
                  <div className="space-y-2">
                    {stats.byTrade.length === 0 ? (
                      <p className="text-gray-500">No approved subcontractors</p>
                    ) : (
                      stats.byTrade.map((trade) => (
                        <div
                          key={trade.name}
                          className="flex items-center justify-between"
                        >
                          <p className="text-gray-300">{trade.name}</p>
                          <p className="text-white font-semibold">
                            {trade.value}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h3 className="text-white font-bold mb-4">Status Distribution</h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) =>
                          `${name}: ${value}`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-12">
                    No data available
                  </p>
                )}
              </div>

              {/* Export */}
              <div className="lg:col-span-3">
                <button
                  onClick={handleExportReport}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition"
                >
                  <Download className="w-4 h-4" />
                  Export Report as CSV
                </button>
              </div>
            </div>
          )}
        </div>

        {/* New Application Modal */}
        {showApplicationModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg max-h-96 overflow-y-auto">
              <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
                <h3 className="text-xl font-bold text-white">
                  New Application
                </h3>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1 font-semibold">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={appForm.company}
                    onChange={(e) =>
                      setAppForm({ ...appForm, company: e.target.value })
                    }
                    placeholder="Company name"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs mb-1 font-semibold">
                    Trade *
                  </label>
                  <select
                    value={appForm.trade}
                    onChange={(e) =>
                      setAppForm({ ...appForm, trade: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-amber-500"
                  >
                    {TRADES.map((trade) => (
                      <option key={trade} value={trade}>
                        {trade}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-xs mb-1 font-semibold">
                    Contact
                  </label>
                  <input
                    type="text"
                    value={appForm.contact}
                    onChange={(e) =>
                      setAppForm({ ...appForm, contact: e.target.value })
                    }
                    placeholder="Contact name"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs mb-1 font-semibold">
                    Location
                  </label>
                  <input
                    type="text"
                    value={appForm.location}
                    onChange={(e) =>
                      setAppForm({ ...appForm, location: e.target.value })
                    }
                    placeholder="Location"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs mb-1 font-semibold">
                    Insurance Cover
                  </label>
                  <input
                    type="text"
                    value={appForm.insurance}
                    onChange={(e) =>
                      setAppForm({ ...appForm, insurance: e.target.value })
                    }
                    placeholder="e.g., £10M"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-gray-800">
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddApplication}
                  disabled={!appForm.company}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold disabled:opacity-50 transition"
                >
                  Add Application
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Modal */}
        {showAssessmentModal && selectedSubcontractor && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
                <h3 className="text-xl font-bold text-white">
                  Assessment - {selectedSubcontractor.company}
                </h3>
                <button
                  onClick={() => setShowAssessmentModal(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-gray-700 rounded p-4 space-y-2">
                  <p className="text-gray-400 text-xs font-semibold">
                    Trade
                  </p>
                  <p className="text-white">{selectedSubcontractor.trade}</p>
                </div>

                {SCORING_CRITERIA.map((criteria, index) => (
                  <div
                    key={index}
                    className="bg-gray-700 rounded p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-white font-semibold">
                        {criteria.name}
                      </label>
                      <span className="text-gray-400 text-sm">
                        Weight: {criteria.weight}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={scoringData[index.toString()] || 3}
                        onChange={(e) =>
                          setScoringData({
                            ...scoringData,
                            [index.toString()]: parseInt(
                              e.target.value
                            ),
                          })
                        }
                        className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-amber-400 font-bold w-8 text-right">
                        {scoringData[index.toString()] || 3}/5
                      </span>
                    </div>
                  </div>
                ))}

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <p className="text-gray-300 text-sm mb-1">
                    Weighted Total Score
                  </p>
                  <p className="text-3xl font-bold text-amber-400">
                    {calculateWeightedScore()}%
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-gray-800">
                <button
                  onClick={() => setShowAssessmentModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssessment}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition"
                >
                  Save Assessment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
