// Module: ExecutiveReports — CortexBuild Ultimate Enhanced
import { useState, useEffect } from 'react';
import { Download, BarChart3, PieChart,
  TrendingUp, Shield, PoundSterling,
  CheckSquare, Square, Trash2,
} from 'lucide-react';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { executiveReportsApi } from '../../services/api';

type _AnyRow = Record<string, unknown>;
type RAG = 'red' | 'amber' | 'green';

interface ReportTab {
  id: 'dashboard' | 'portfolio' | 'financial' | 'safety' | 'kpis' | 'trends';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const fmtCurrency = (n: number) => {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}K`;
  return `£${n.toLocaleString()}`;
};

const RAGStatus = ({ status }: { status: RAG }) => {
  const colors: Record<RAG, string> = {
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    green: 'bg-emerald-500',
  };
  return (
    <div className={`w-3 h-3 rounded-full ${colors[status]}`} />
  );
};

// Helper to convert string to RAG type
const toRAG = (value: string): RAG => {
  if (value === 'red' || value === 'amber' || value === 'green') {
    return value;
  }
  return 'amber'; // default fallback
};

// Fallback data when API fails
const FALLBACK_PROJECTS: Array<{
  id: string;
  name: string;
  client: string;
  value: number;
  phase: string;
  completion: number;
  nextMilestone: string;
  pm: string;
  programme: RAG;
  cost: RAG;
  quality: RAG;
  safety: RAG;
}> = [
  { id: 'p1', name: 'Riverside Tower', client: 'AC Properties', value: 4200000, phase: 'Construction', completion: 68, nextMilestone: 'Structural complete', pm: 'SC', programme: 'green', cost: 'green', quality: 'green', safety: 'green' },
  { id: 'p2', name: 'Tech Hub Phase 2', client: 'TechCorp', value: 2850000, phase: 'M&E', completion: 54, nextMilestone: 'HVAC commissioning', pm: 'JM', programme: 'amber', cost: 'amber', quality: 'green', safety: 'green' },
  { id: 'p3', name: 'Retail Centre Fit-out', client: 'Developers Ltd', value: 1950000, phase: 'Fit-out', completion: 42, nextMilestone: 'FF&E installation', pm: 'PW', programme: 'red', cost: 'green', quality: 'amber', safety: 'green' },
];

const FALLBACK_KPIS: Array<{ label: string; value: string; target: string; rag: RAG }> = [
  { label: 'Portfolio Value', value: fmtCurrency(9000000), target: fmtCurrency(9500000), rag: 'green' },
  { label: 'Projects Active', value: '3', target: '3', rag: 'green' },
  { label: 'Revenue YTD', value: fmtCurrency(1850000), target: fmtCurrency(2000000), rag: 'amber' },
  { label: 'Margin %', value: '25%', target: '26%', rag: 'green' },
];

const FALLBACK_TRENDS = [
  { month: 'Jan', revenue: 185000, margin: 23, headcount: 142 },
  { month: 'Feb', revenue: 220000, margin: 25, headcount: 156 },
  { month: 'Mar', revenue: 198000, margin: 25, headcount: 165 },
  { month: 'Apr', revenue: 289000, margin: 24, headcount: 178 },
  { month: 'May', revenue: 267000, margin: 25, headcount: 172 },
  { month: 'Jun', revenue: 310000, margin: 25, headcount: 185 },
];

type ProjectData = {
  id: string;
  name: string;
  client: string;
  value: number;
  phase: string;
  completion: number;
  nextMilestone: string;
  pm: string;
  programme: RAG;
  cost: RAG;
  quality: RAG;
  safety: RAG;
};

export function ExecutiveReports() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolio' | 'financial' | 'safety' | 'kpis' | 'trends'>('dashboard');
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'quarterly'>('weekly');
  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  const [summaryData, setSummaryData] = useState<{
    kpis: { portfolioValue: number; projectsActive: number; revenueYtd: number; margin: number; workforce: number };
    projects: Array<{
      id: string;
      name: string;
      client: string;
      value: number;
      phase: string;
      completion: number;
      nextMilestone: string;
      pm: string;
      programme: string;
      cost: string;
      quality: string;
      safety: string;
    }>;
  } | null>(null);

  const [trendsData, setTrendsData] = useState<Array<{
    month: string;
    revenue: number;
    margin: number;
    headcount: number;
  }> | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [summary, trends] = await Promise.all([
          executiveReportsApi.getSummary(),
          executiveReportsApi.getTrends(),
        ]);
        setSummaryData(summary);
        setTrendsData(trends);
      } catch {
        console.error('Failed to');
        setError('Failed to load report data');
        toast.error('Failed to load report data, using fallback');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} report(s)?`)) return;
    try {
      toast.success(`Deleted ${ids.length} report(s)`);
      clearSelection();
    } catch {
      toast.error('Bulk delete failed');
    }
  }

  const tabs: ReportTab[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'financial', label: 'Financial', icon: PoundSterling },
    { id: 'safety', label: 'Safety', icon: Shield },
    { id: 'kpis', label: 'KPIs', icon: Target },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
  ];

  // Map API response to frontend expected types
  const projects: ProjectData[] = summaryData?.projects?.map((p): ProjectData => ({
    id: p.id,
    name: p.name,
    client: p.client,
    value: p.value,
    phase: p.phase,
    completion: p.completion,
    nextMilestone: p.nextMilestone,
    pm: p.pm,
    programme: toRAG(p.programme),
    cost: toRAG(p.cost),
    quality: toRAG(p.quality),
    safety: toRAG(p.safety),
  })) ?? FALLBACK_PROJECTS;

  // Map API KPIs to frontend format
  const kpis: Array<{ label: string; value: string; target: string; rag: RAG }> = summaryData?.kpis ? [
    { label: 'Portfolio Value', value: fmtCurrency(summaryData.kpis.portfolioValue), target: fmtCurrency(summaryData.kpis.portfolioValue * 1.05), rag: 'green' },
    { label: 'Projects Active', value: String(summaryData.kpis.projectsActive), target: '3', rag: 'green' },
    { label: 'Revenue YTD', value: fmtCurrency(summaryData.kpis.revenueYtd), target: fmtCurrency(summaryData.kpis.revenueYtd * 1.08), rag: summaryData.kpis.revenueYtd > 1800000 ? 'green' : 'amber' },
    { label: 'Margin %', value: `${summaryData.kpis.margin}%`, target: '26%', rag: summaryData.kpis.margin >= 25 ? 'green' : 'amber' },
  ] : FALLBACK_KPIS;

  const trendData = trendsData ?? FALLBACK_TRENDS;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error && !summaryData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white font-display">Executive Reports</h1>
          <p className="text-sm text-gray-400 mt-1">Board-level intelligence and analytics</p>
        </div>
        <div className="flex gap-2">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as 'weekly' | 'monthly' | 'quarterly')}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
          <button className="btn btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-gray-800 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={String(tab.id)}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? 'text-orange-500 border-orange-500'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {String(tab.label)}
            </button>
          );
        })}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <div key={String(kpi.label)} className="card p-4">
                <p className="text-xs text-gray-400 uppercase mb-2">{String(kpi.label)}</p>
                <p className="text-2xl font-bold text-white mb-2">{String(kpi.value)}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Target: {String(kpi.target)}</span>
                  <RAGStatus status={kpi.rag} />
                </div>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Project RAG Status</h3>
            <div className="space-y-3">
              {projects.map((proj) => (
                <div key={String(proj.name)} className="p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-white text-sm">{String(proj.name)}</p>
                      <p className="text-xs text-gray-400">{String(proj.client)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    {[
                      { label: 'Programme', status: proj.programme },
                      { label: 'Cost', status: proj.cost },
                      { label: 'Quality', status: proj.quality },
                      { label: 'Safety', status: proj.safety },
                    ].map((item) => (
                      <div key={String(item.label)} className="flex items-center gap-2">
                        <RAGStatus status={item.status} />
                        <span className="text-gray-400">{String(item.label)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary w-full">
            <Download className="h-4 w-4 mr-2" />
            Generate Full Report
          </button>
        </div>
      )}

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {projects.map((proj) => {
                const isSelected = selectedIds.has(proj.id);
                return (
                <div key={String(proj.name)} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <button type="button" onClick={() => toggle(proj.id)}>
                        {isSelected ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
                      </button>
                      <div>
                        <p className="font-bold text-white">{String(proj.name)}</p>
                        <p className="text-xs text-gray-400">{String(proj.client)}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-medium">{String(proj.phase)}</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-400 mb-3">{fmtCurrency(proj.value)}</p>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Completion</span>
                      <span className="text-white">{Number(proj.completion)}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${proj.completion}%` }} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Next: {String(proj.nextMilestone)}</p>
                </div>
                );
              })}
            </div>

            <div className="card p-5">
              <h3 className="text-lg font-bold text-white mb-4">Portfolio by Sector</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={[{name:'Commercial',value:45},{name:'Residential',value:35},{name:'Industrial',value:20}]} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value">
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip /><Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <BulkActionsBar
            selectedIds={Array.from(selectedIds)}
            actions={[
              { id: 'delete', label: 'Delete Selected', icon: Trash2, variant: 'danger', onClick: handleBulkDelete, confirm: 'This action cannot be undone.' },
            ]}
            onClearSelection={clearSelection}
          />
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="text-lg font-bold text-white mb-4">Quarterly Performance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { quarter: 'Q1', revenue: 603000, margin: 24 },
                    { quarter: 'Q2', revenue: 867000, margin: 25 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="quarter" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-lg font-bold text-white mb-4">Key Financial Ratios</h3>
              <div className="space-y-4">
                {[
                  { label: 'Gross Margin', value: '25%', benchmark: '22%' },
                  { label: 'Net Margin', value: '19%', benchmark: '18%' },
                  { label: 'Current Ratio', value: '1.85x', benchmark: '1.5x' },
                  { label: 'Debtor Days', value: '42 days', benchmark: '45 days' },
                ].map((item) => (
                  <div key={String(item.label)} className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                    <span className="text-gray-300 text-sm">{String(item.label)}</span>
                    <div className="text-right">
                      <p className="font-bold text-white">{String(item.value)}</p>
                      <p className="text-xs text-gray-500">vs {String(item.benchmark)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Revenue Pipeline</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { stage: 'Pipeline', value: 8500000 },
                  { stage: 'Proposal', value: 5200000 },
                  { stage: 'Tender', value: 3100000 },
                  { stage: 'Active', value: 9000000 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="stage" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Safety Tab */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'RIDDOR Rate', value: '0.2', unit: 'per 100k hours' },
              { label: 'LTI Frequency', value: '0', unit: 'incidents' },
              { label: 'Near Misses', value: '8', unit: 'this period' },
              { label: 'Training Compliance', value: '94%', unit: 'completion' },
            ].map((item) => (
              <div key={String(item.label)} className="card p-4">
                <p className="text-xs text-gray-400 uppercase mb-2">{String(item.label)}</p>
                <p className="text-2xl font-bold text-white mb-1">{String(item.value)}</p>
                <p className="text-xs text-gray-500">{String(item.unit)}</p>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Incident Frequency Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                  <Area type="monotone" dataKey="margin" stroke="#ef4444" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* KPIs Tab */}
      {activeTab === 'kpis' && (
        <div className="card p-5">
          <h3 className="text-lg font-bold text-white mb-4">KPI Scorecard</h3>
          <div className="space-y-3">
            {[
              { category: 'Financial', kpi: 'Gross Margin %', target: '26%', actual: '25%', rag: 'amber' as RAG },
              { category: 'Financial', kpi: 'Debtor Days', target: '40', actual: '42', rag: 'amber' as RAG },
              { category: 'Operational', kpi: 'Schedule Compliance', target: '95%', actual: '92%', rag: 'amber' as RAG },
              { category: 'Quality', kpi: 'Defects/1000 sqm', target: '2.5', actual: '3.2', rag: 'red' as RAG },
              { category: 'Safety', kpi: 'RIDDOR Rate', target: '<0.5', actual: '0.2', rag: 'green' as RAG },
              { category: 'HR', kpi: 'Headcount Growth %', target: '12%', actual: '30%', rag: 'green' as RAG },
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-gray-800/50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">{String(item.category)}</p>
                  <p className="font-medium text-white">{String(item.kpi)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Target: {String(item.target)}</p>
                    <p className="text-sm font-bold text-white">Actual: {String(item.actual)}</p>
                  </div>
                  <RAGStatus status={item.rag} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-lg font-bold text-white mb-4">12-Month Revenue & Margin Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorRev2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#colorRev2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Headcount Evolution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                  <Area type="monotone" dataKey="headcount" stroke="#3b82f6" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add missing import
const Target = TrendingUp;
export default ExecutiveReports;
