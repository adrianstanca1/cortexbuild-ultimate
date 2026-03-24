/**
 * CortexBuild Ultimate — Executive Reports
 * Board-level intelligence and comprehensive analytics platform
 */
import { useState, useMemo } from 'react';
import {
  FileText, Download, Calendar, Clock, Send, BarChart3, PieChart,
  TrendingUp, Users, Shield, PoundSterling, Activity, CheckCircle,
  AlertTriangle, Mail, Printer, Share2, Award, Eye, Settings,
  Target, Zap, TrendingDown, ArrowUpRight, ArrowDownRight,
  AlertCircle, Lock, Plus, X,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

type AnyRow = Record<string, unknown>;
type ReportPeriod = 'weekly' | 'monthly' | 'quarterly';

const fmtCurrency = (n: number) => {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}K`;
  return `£${n.toLocaleString()}`;
};

const RAGStatus = ({ status }: { status: 'red' | 'amber' | 'green' }) => {
  const colors: Record<'red' | 'amber' | 'green', string> = {
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    green: 'bg-emerald-500',
  };
  return <div className={`w-3 h-3 rounded-full ${colors[status]}`} />;
};

export function ExecutiveReports() {
  const [activeTab, setActiveTab] = useState<'summary' | 'portfolio' | 'financial' | 'safety' | 'people' | 'kpis' | 'trends' | 'distribution'>('summary');
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('monthly');
  const [showDistributionModal, setShowDistributionModal] = useState(false);

  const projects = [
    { name: 'Canary Wharf Office Complex', client: 'Meridian Properties', value: 4200000, phase: 'Structural', completion: 68, sector: 'Commercial', programme: 'green' as const, cost: 'green' as const, quality: 'green' as const, safety: 'amber' as const },
    { name: 'Manchester City Apartments', client: 'Northern Living Ltd', value: 2800000, phase: 'Foundation', completion: 34, sector: 'Residential', programme: 'red' as const, cost: 'amber' as const, quality: 'green' as const, safety: 'green' as const },
    { name: 'Edinburgh Data Centre', client: 'TechCorp Europe Ltd', value: 5400000, phase: 'Structural', completion: 45, sector: 'Industrial', programme: 'green' as const, cost: 'amber' as const, quality: 'green' as const, safety: 'green' as const },
    { name: 'Birmingham Road Bridge', client: 'West Midlands Council', value: 1600000, phase: 'Finishing', completion: 89, sector: 'Civil', programme: 'green' as const, cost: 'green' as const, quality: 'amber' as const, safety: 'green' as const },
    { name: 'Cardiff Leisure Centre', client: 'Welsh Council Services', value: 1950000, phase: 'MEP', completion: 56, sector: 'Leisure', programme: 'amber' as const, cost: 'green' as const, quality: 'green' as const, safety: 'green' as const },
  ];

  const financialData = {
    revenue: 1850000,
    directCosts: 1382500,
    grossMargin: 467500,
    overheads: 280000,
    ebit: 187500,
    marginPercent: 25.3,
    marginTarget: 26,
  };

  const cashFlowData = [
    { month: 'Jan', income: 420000, expenses: 380000, net: 40000 },
    { month: 'Feb', income: 520000, expenses: 450000, net: 70000 },
    { month: 'Mar', income: 480000, expenses: 420000, net: 60000 },
    { month: 'Apr', income: 650000, expenses: 520000, net: 130000 },
    { month: 'May', income: 580000, expenses: 490000, net: 90000 },
    { month: 'Jun', income: 720000, expenses: 580000, net: 140000 },
  ];

  const agedDebtors = [
    { range: '0-30 days', value: 450000, percentage: 35 },
    { range: '31-60 days', value: 380000, percentage: 30 },
    { range: '61-90 days', value: 280000, percentage: 22 },
    { range: '90+ days', value: 140000, percentage: 11 },
  ];

  const revenuePipeline = [
    { stage: 'Prospect', value: 8500000 },
    { stage: 'Tender', value: 6200000 },
    { stage: 'Negotiation', value: 4100000 },
    { stage: 'Won', value: 2800000 },
  ];

  const safetyData = [
    { month: 'Jan', riddor: 0.85, incidents: 2, nearMisses: 8 },
    { month: 'Feb', riddor: 1.12, incidents: 3, nearMisses: 12 },
    { month: 'Mar', riddor: 0.95, incidents: 2, nearMisses: 7 },
    { month: 'Apr', riddor: 1.45, incidents: 4, nearMisses: 15 },
    { month: 'May', riddor: 0.68, incidents: 1, nearMisses: 5 },
    { month: 'Jun', riddor: 0.55, incidents: 1, nearMisses: 3 },
  ];

  const headcountData = [
    { month: 'Jan', headcount: 142, field: 85, office: 57 },
    { month: 'Feb', headcount: 156, field: 95, office: 61 },
    { month: 'Mar', headcount: 165, field: 102, office: 63 },
    { month: 'Apr', headcount: 178, field: 112, office: 66 },
    { month: 'May', headcount: 172, field: 108, office: 64 },
    { month: 'Jun', headcount: 185, field: 118, office: 67 },
  ];

  const kpiScorecard = [
    { category: 'Financial', kpis: [
      { name: 'Revenue', actual: 1850000, target: 2000000, rag: 'amber' as const },
      { name: 'Margin %', actual: 25.3, target: 26, rag: 'amber' as const },
      { name: 'Debtor Days', actual: 52, target: 45, rag: 'red' as const },
    ]},
    { category: 'Operational', kpis: [
      { name: 'Schedule Adherence', actual: 94, target: 95, rag: 'green' as const },
      { name: 'Defect Rate', actual: 2.1, target: 2, rag: 'amber' as const },
      { name: 'RFI Close Time (days)', actual: 8, target: 7, rag: 'amber' as const },
    ]},
    { category: 'Safety', kpis: [
      { name: 'RIDDOR Rate', actual: 0.95, target: 0.8, rag: 'amber' as const },
      { name: 'Training Compliance %', actual: 98, target: 100, rag: 'green' as const },
      { name: 'LTI (days)', actual: 0, target: 0, rag: 'green' as const },
    ]},
    { category: 'People', kpis: [
      { name: 'Headcount', actual: 185, target: 180, rag: 'green' as const },
      { name: 'Turnover %', actual: 8.2, target: 12, rag: 'green' as const },
      { name: 'Cert Compliance %', actual: 96, target: 100, rag: 'amber' as const },
    ]},
  ];

  const trendDataRevenue = [
    { month: 'Jan', revenue: 420000, margin: 23, headcount: 142 },
    { month: 'Feb', revenue: 520000, margin: 24, headcount: 156 },
    { month: 'Mar', revenue: 480000, margin: 25, headcount: 165 },
    { month: 'Apr', revenue: 650000, margin: 24, headcount: 178 },
    { month: 'May', revenue: 580000, margin: 25, headcount: 172 },
    { month: 'Jun', revenue: 720000, margin: 26, headcount: 185 },
  ];

  const distributionList = [
    { id: 1, name: 'Weekly Board Update', frequency: 'Weekly (Mondays)', recipients: 5, nextSend: '2026-03-31' },
    { id: 2, name: 'Monthly Management Review', frequency: 'Monthly (1st)', recipients: 12, nextSend: '2026-04-01' },
    { id: 3, name: 'Quarterly Board Pack', frequency: 'Quarterly (Q end)', recipients: 8, nextSend: '2026-03-31' },
  ];

  const distributionHistory = [
    { id: 1, report: 'Weekly Board Update', sentDate: '2026-03-24', recipients: 5, status: 'delivered' },
    { id: 2, report: 'Monthly Management Review', sentDate: '2026-03-01', recipients: 12, status: 'delivered' },
    { id: 3, report: 'Quarterly Board Pack', sentDate: '2025-12-31', recipients: 8, status: 'delivered' },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f97316'];

  const radarData = [
    { subject: 'Financial', A: 75, B: 80, fullMark: 100 },
    { subject: 'Operational', A: 88, B: 85, fullMark: 100 },
    { subject: 'Safety', A: 92, B: 90, fullMark: 100 },
    { subject: 'People', A: 85, B: 88, fullMark: 100 },
    { subject: 'Quality', A: 82, B: 85, fullMark: 100 },
  ];

  const summaryKpis = [
    { label: 'Portfolio Value', value: '£15.95M', trend: 'up', target: 'On Track' },
    { label: 'YTD Revenue', value: '£3.23M', trend: 'up', target: 'Tracking' },
    { label: 'Gross Margin %', value: '25.3%', trend: 'neutral', target: 'Target 26%' },
    { label: 'Active Projects', value: '5', trend: 'neutral', target: '5 projects' },
    { label: 'Team Headcount', value: '185', trend: 'up', target: 'Plan 180' },
    { label: 'Safety Record', value: '0 RIDDOR', trend: 'neutral', target: 'Target 0' },
    { label: 'Debtor Days', value: '52 days', trend: 'down', target: 'Target 45' },
    { label: 'Schedule Adherence', value: '94%', trend: 'up', target: 'Target 95%' },
  ];

  const sectorData = [
    { name: 'Commercial', value: 4200000 },
    { name: 'Residential', value: 2800000 },
    { name: 'Industrial', value: 5400000 },
    { name: 'Civil', value: 1600000 },
    { name: 'Leisure', value: 1950000 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white font-display flex items-center gap-3">
            <FileText className="w-8 h-8 text-orange-500" />
            Executive Reports
          </h1>
          <p className="text-sm text-gray-400 mt-1">Board-level intelligence and analytics</p>
        </div>
        <div className="flex gap-2">
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value as ReportPeriod)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
          <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition">
            <Zap className="w-4 h-4" />
            Generate Board Pack
          </button>
          <button onClick={() => setShowDistributionModal(true)} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition">
            <Mail className="w-4 h-4" />
            Schedule Distribution
          </button>
          <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 overflow-x-auto">
        {(['summary', 'portfolio', 'financial', 'safety', 'people', 'kpis', 'trends', 'distribution'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium text-sm transition whitespace-nowrap ${
              activeTab === tab
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab === 'kpis' ? 'KPI Scorecard' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Headline KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryKpis.slice(0, 8).map((kpi, idx) => (
              <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">{kpi.label}</p>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold text-white">{kpi.value}</p>
                  {kpi.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  ) : kpi.trend === 'down' ? (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  ) : (
                    <span className="text-gray-500 text-xs">—</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">{kpi.target}</p>
              </div>
            ))}
          </div>

          {/* Executive Summary & Key Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Summary Text */}
            <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-4">Executive Summary</h3>
              <textarea
                className="w-full bg-gray-700 text-white rounded-lg p-3 text-sm resize-none border border-gray-600 focus:border-orange-500 outline-none"
                rows={6}
                placeholder="Enter executive summary..."
                defaultValue="Strong operational performance across all active projects. Financial performance tracking below target margin due to client payment delays and procurement cost pressures. Safety record excellent with zero RIDDOR incidents YTD. Team headcount above plan with strong recruitment momentum. Focus areas: invoice collection, supply chain risk mitigation, and schedule acceleration on Manchester project."
              />
            </div>

            {/* Top Risks & Achievements */}
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Top 3 Risks
                </h3>
                <ul className="space-y-2 text-sm">
                  {[
                    'Debtor payment delays (£135K impact)',
                    'Steel supply chain delays (3-week impact)',
                    'Manchester schedule slippage (£45K LD)',
                  ].map((risk, idx) => (
                    <li key={idx} className="text-gray-300 flex gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Top 3 Achievements
                </h3>
                <ul className="space-y-2 text-sm">
                  {[
                    'Bridge project 89% complete, on schedule',
                    'Safety: 0 RIDDOR incidents, 98% training compliance',
                    'Strong pipeline: £21.8M tender value in play',
                  ].map((achievement, idx) => (
                    <li key={idx} className="text-gray-300 flex gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Project Portfolio Overview */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">Project Portfolio At-a-Glance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Project</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Value</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Progress</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Programme</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Cost</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Quality</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Safety</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project, idx) => (
                    <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700 transition">
                      <td className="py-3 px-2 text-white">{project.name}</td>
                      <td className="py-3 px-2 text-gray-300">{fmtCurrency(project.value)}</td>
                      <td className="py-3 px-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${project.completion}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{project.completion}%</span>
                      </td>
                      <td className="py-3 px-2"><RAGStatus status={project.programme} /></td>
                      <td className="py-3 px-2"><RAGStatus status={project.cost} /></td>
                      <td className="py-3 px-2"><RAGStatus status={project.quality} /></td>
                      <td className="py-3 px-2"><RAGStatus status={project.safety} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sector Split */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-4">Contract Value by Sector</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie data={sectorData} cx="50%" cy="50%" outerRadius={100} dataKey="value">
                  {sectorData.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            {/* Project Completion Gantt */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-4">Project Completion Progress</h3>
              <div className="space-y-3">
                {projects.map((project, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{project.name}</span>
                      <span className="text-gray-400">{project.completion}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full" style={{ width: `${project.completion}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Work Won vs Work Complete */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">Work Won vs Work Complete (12-month)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={[
                { month: 'Jan', won: 1200000, completed: 420000 },
                { month: 'Feb', won: 1800000, completed: 520000 },
                { month: 'Mar', won: 2100000, completed: 480000 },
                { month: 'Apr', won: 2600000, completed: 650000 },
                { month: 'May', won: 3100000, completed: 580000 },
                { month: 'Jun', won: 3800000, completed: 720000 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Legend />
                <Area type="monotone" dataKey="won" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Area type="monotone" dataKey="completed" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          {/* P&L Summary */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">P&L Summary (YTD)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    { label: 'Revenue', value: financialData.revenue, highlight: true },
                    { label: 'Direct Costs', value: -financialData.directCosts },
                    { label: 'Gross Profit', value: financialData.grossMargin, highlight: true },
                    { label: 'Overheads', value: -financialData.overheads },
                    { label: 'EBIT', value: financialData.ebit, highlight: true },
                  ].map((row, idx) => (
                    <tr key={idx} className={`border-b border-gray-700 ${row.highlight ? 'bg-gray-700' : ''}`}>
                      <td className="py-3 px-2 text-gray-300">{row.label}</td>
                      <td className="py-3 px-2 text-right font-semibold text-white">{fmtCurrency(row.value)}</td>
                      <td className="py-3 px-2 text-right text-gray-400">
                        {row.label === 'Gross Profit' && `${financialData.marginPercent.toFixed(1)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cash Flow */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">12-Month Cash Flow Forecast</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Legend />
                <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Area type="monotone" dataKey="expenses" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Aged Debtors & Revenue Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Aged Debtors */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-4">Aged Debtors Breakdown</h3>
              <div className="space-y-3">
                {agedDebtors.map((range, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{range.range}</span>
                      <span className="text-white font-medium">{fmtCurrency(range.value)}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${range.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-700">Total Debtors: {fmtCurrency(agedDebtors.reduce((a, b) => a + b.value, 0))}</p>
            </div>

            {/* Revenue Pipeline Funnel */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-4">Revenue Pipeline Funnel</h3>
              <div className="space-y-2">
                {revenuePipeline.map((stage, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-12 text-sm font-medium text-gray-400">{stage.stage}</div>
                    <div className="flex-1 bg-gray-700 rounded px-3 py-2" style={{ width: `${(stage.value / revenuePipeline[0].value) * 100}%` }}>
                      <div className="text-sm font-semibold text-white">{fmtCurrency(stage.value)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Financial Ratios */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">Key Financial Ratios vs Benchmarks</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Gross Margin %', yours: 25.3, benchmark: 26, unit: '%' },
                { name: 'EBIT %', yours: 5.1, benchmark: 5.5, unit: '%' },
                { name: 'Debtor Days', yours: 52, benchmark: 45, unit: 'days' },
                { name: 'Asset Turnover', yours: 2.8, benchmark: 2.5, unit: 'x' },
              ].map((ratio, idx) => (
                <div key={idx} className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-xs font-semibold mb-2">{ratio.name}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-white">{ratio.yours}{ratio.unit}</span>
                    <span className="text-xs text-gray-500">target {ratio.benchmark}{ratio.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Safety Tab */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          {/* RIDDOR Trend */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">RIDDOR Frequency Rate & Incidents Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={safetyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Legend />
                <Line type="monotone" dataKey="riddor" stroke="#ef4444" strokeWidth={2} name="RIDDOR Rate" />
                <Line type="monotone" dataKey="incidents" stroke="#f97316" strokeWidth={2} name="Incidents" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Safety Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="text-white font-semibold mb-4">Safety Inspection Scores</h4>
              {[
                { project: 'Canary Wharf', score: 94 },
                { project: 'Manchester', score: 87 },
                { project: 'Edinburgh', score: 91 },
              ].map((proj, idx) => (
                <div key={idx} className="mb-3 pb-3 border-b border-gray-700 last:border-b-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-300 text-sm">{proj.project}</span>
                    <span className="text-white font-semibold">{proj.score}/100</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${proj.score}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="text-white font-semibold mb-4">Training Compliance</h4>
              {[
                { dept: 'Field Operations', pct: 98 },
                { dept: 'Supervision', pct: 100 },
                { dept: 'Management', pct: 95 },
              ].map((dept, idx) => (
                <div key={idx} className="mb-3 pb-3 border-b border-gray-700 last:border-b-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-300 text-sm">{dept.dept}</span>
                    <span className="text-white font-semibold">{dept.pct}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${dept.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="text-white font-semibold mb-4">HSE Audit Readiness</h4>
              <div className="space-y-2">
                {[
                  { item: 'RAMS Documentation', status: 'green' },
                  { item: 'Site Procedures', status: 'green' },
                  { item: 'Training Records', status: 'amber' },
                  { item: 'Incident Files', status: 'green' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">{item.item}</span>
                    <RAGStatus status={item.status as 'red' | 'amber' | 'green'} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* People Tab */}
      {activeTab === 'people' && (
        <div className="space-y-6">
          {/* Headcount Trend */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">Headcount Evolution (12-month)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={headcountData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Legend />
                <Area type="monotone" dataKey="field" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Area type="monotone" dataKey="office" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Department & Cert Expiry */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="text-white font-semibold mb-4">Department Breakdown</h4>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPie
                  data={[
                    { name: 'Field Operations', value: 118 },
                    { name: 'Site Management', value: 35 },
                    { name: 'Office Admin', value: 18 },
                    { name: 'Finance', value: 8 },
                    { name: 'H&S', value: 6 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                >
                  {[1, 2, 3, 4, 5].map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="text-white font-semibold mb-4">Certification Expiry Alert</h4>
              <div className="space-y-3">
                {[
                  { cert: 'SMSTS', expiring: 3, days: '< 30 days' },
                  { cert: 'RAMS', expiring: 8, days: '< 60 days' },
                  { cert: 'First Aid', expiring: 2, days: '< 90 days' },
                ].map((cert, idx) => (
                  <div key={idx} className="p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold">{cert.cert}</p>
                        <p className="text-gray-400 text-sm">{cert.expiring} team members</p>
                      </div>
                      <span className="bg-orange-900 text-orange-200 text-xs px-2 py-1 rounded">{cert.days}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recruitment & Training */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="text-white font-semibold mb-4">Recruitment Pipeline</h4>
              {[
                { role: 'Site Manager', stage: 'Interview', candidates: 3 },
                { role: 'Quantity Surveyor', stage: 'Shortlist', candidates: 5 },
                { role: 'Safety Officer', stage: 'Application', candidates: 8 },
              ].map((rec, idx) => (
                <div key={idx} className="mb-4 pb-4 border-b border-gray-700 last:border-b-0">
                  <div className="flex justify-between mb-2">
                    <span className="text-white font-medium">{rec.role}</span>
                    <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">{rec.stage}</span>
                  </div>
                  <p className="text-gray-400 text-sm">{rec.candidates} candidates</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="text-white font-semibold mb-4">Training Hours Completed</h4>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">YTD Target: 450 hours</span>
                  <span className="text-white font-semibold">420 hours</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: '93%' }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">93% of target</p>
              </div>
              <div className="text-sm text-gray-300">
                <p>Recent: SMSTS (12 staff), First Aid (8 staff), NEBOSH (4 staff)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Scorecard Tab */}
      {activeTab === 'kpis' && (
        <div className="space-y-6">
          {kpiScorecard.map((section, sectionIdx) => (
            <div key={sectionIdx} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-4 text-lg">{section.category} KPIs</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {section.kpis.map((kpi, idx) => (
                  <div key={idx} className="p-4 bg-gray-700 rounded-lg">
                    <p className="text-gray-400 text-sm mb-2">{kpi.name}</p>
                    <div className="flex items-baseline gap-2 mb-2">
                      <p className="text-2xl font-bold text-white">{typeof kpi.actual === 'number' ? kpi.actual : kpi.actual}</p>
                      <RAGStatus status={kpi.rag} />
                    </div>
                    <p className="text-xs text-gray-400">Target: {kpi.target}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* 12-month trends */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">12-Month Business Trends</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendDataRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis yAxisId="left" stroke="#9CA3AF" />
                <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Monthly Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={2} name="Margin %" />
                <Line yAxisId="right" type="monotone" dataKey="headcount" stroke="#f59e0b" strokeWidth={2} name="Headcount" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Win Rate & Safety Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="text-white font-semibold mb-4">Tender Win Rate Trend</h4>
              <div className="space-y-3">
                {[
                  { period: 'Q1 2025', submitted: 12, won: 2, rate: '17%' },
                  { period: 'Q2 2025', submitted: 14, won: 3, rate: '21%' },
                  { period: 'Q3 2025', submitted: 15, won: 4, rate: '27%' },
                  { period: 'Q4 2025', submitted: 18, won: 5, rate: '28%' },
                ].map((quarter, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{quarter.period}</p>
                      <p className="text-gray-400 text-sm">{quarter.submitted} submitted, {quarter.won} won</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-400">{quarter.rate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="text-white font-semibold mb-4">Safety Trend Analysis</h4>
              <div className="space-y-3">
                {[
                  { metric: 'RIDDOR Rate', trend: 'down', value: '-35% YoY', status: 'green' },
                  { metric: 'Incident Rate', trend: 'up', value: '+8% YoY', status: 'amber' },
                  { metric: 'Training Compliance', trend: 'up', value: '+5% YoY', status: 'green' },
                  { metric: 'Near Misses Reported', trend: 'up', value: '+22% YoY', status: 'green' },
                ].map((safety, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{safety.metric}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {safety.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-white font-semibold">{safety.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Tab */}
      {activeTab === 'distribution' && (
        <div className="space-y-6">
          {/* Scheduled Reports */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">Scheduled Report Distribution</h3>
            <div className="space-y-3">
              {distributionList.map(report => (
                <div key={report.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{report.name}</h4>
                    <p className="text-gray-400 text-sm">{report.frequency} • {report.recipients} recipients</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Next Send</p>
                    <p className="text-white font-medium">{report.nextSend}</p>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button className="p-2 hover:bg-gray-600 rounded-lg transition">
                      <Send className="w-4 h-4 text-blue-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-600 rounded-lg transition">
                      <Settings className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribution History */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">Delivery History</h3>
            <div className="space-y-2">
              {distributionHistory.map(hist => (
                <div key={hist.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg text-sm">
                  <div>
                    <p className="text-white font-medium">{hist.report}</p>
                    <p className="text-gray-400">{hist.sentDate} • {hist.recipients} recipients</p>
                  </div>
                  <span className="bg-green-900 text-green-200 px-3 py-1 rounded text-xs font-medium">{hist.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Distribution Modal */}
      {showDistributionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Schedule Report Distribution</h2>
              <button onClick={() => setShowDistributionModal(false)} className="p-1 hover:bg-gray-700 rounded">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Select Report</label>
                <select className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600">
                  <option>Weekly Board Update</option>
                  <option>Monthly Management Review</option>
                  <option>Quarterly Board Pack</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Recipients</label>
                <input
                  type="email"
                  placeholder="Add recipients (comma separated)"
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 placeholder-gray-500 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Schedule</label>
                <select className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600">
                  <option>One-time send now</option>
                  <option>Weekly (Mondays)</option>
                  <option>Monthly (1st)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDistributionModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm font-medium"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition text-sm font-medium flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
