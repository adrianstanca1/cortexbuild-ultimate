// Module: Dashboard — CortexBuild Ultimate
// World-class construction BI dashboard with KPI bar, sub-tabs, and live feeds
import { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, BarChart2, Activity, PieChart, DollarSign,
  Users, Building2, CheckCircle, AlertTriangle, Clock, Plus, Search,
  Edit2, Trash2, ChevronDown, ChevronUp, Filter, Download, FileText,
  Award, Zap, RefreshCw, Eye, Settings, Calendar, Target, ArrowUp, ArrowDown, Minus,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart as RechartsPie,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

type AnyRow = Record<string, unknown>;

interface KPIData {
  label: string;
  value: string;
  trend: number;
  positive: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface Project {
  id: number;
  name: string;
  client: string;
  value: number;
  progress: number;
  budgetRAG: 'red' | 'amber' | 'green';
  programmeRAG: 'red' | 'amber' | 'green';
  qualityRAG: 'red' | 'amber' | 'green';
  daysToCompletion: number;
  pmInitials: string;
}

interface Alert {
  id: string;
  level: 'amber' | 'red';
  title: string;
  description: string;
}

interface ActivityFeed {
  id: string;
  user: string;
  action: string;
  module: string;
  time: string;
}

const fmtCurrency = (n: number) => {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}K`;
  return `£${n.toFixed(0)}`;
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'finance' | 'safety' | 'activity'>('overview');
  const [filter, setFilter] = useState('');

  // Mock KPI data
  const kpiCards: KPIData[] = [
    { label: 'Active Projects', value: '12', trend: 8, positive: true, icon: Building2, color: 'emerald' },
    { label: 'Total Revenue (£)', value: fmtCurrency(2450000), trend: 12, positive: true, icon: DollarSign, color: 'emerald' },
    { label: 'Outstanding (£)', value: fmtCurrency(385000), trend: -5, positive: true, icon: AlertTriangle, color: 'amber' },
    { label: 'Open RFIs', value: '24', trend: -15, positive: true, icon: FileText, color: 'emerald' },
    { label: 'H&S Score (%)', value: '92', trend: 3, positive: true, icon: CheckCircle, color: 'emerald' },
    { label: 'Workforce Today', value: '147', trend: 2, positive: true, icon: Users, color: 'emerald' },
  ];

  // Mock project data
  const projects: Project[] = [
    { id: 1, name: 'Riverside Tower', client: 'AC Properties', value: 4200000, progress: 68, budgetRAG: 'green', programmeRAG: 'green', qualityRAG: 'green', daysToCompletion: 45, pmInitials: 'SC' },
    { id: 2, name: 'Tech Hub Phase 2', client: 'TechCorp', value: 2850000, progress: 54, budgetRAG: 'amber', programmeRAG: 'amber', qualityRAG: 'green', daysToCompletion: 78, pmInitials: 'JM' },
    { id: 3, name: 'Retail Centre Fit-out', client: 'Developers Ltd', value: 1950000, progress: 42, budgetRAG: 'green', programmeRAG: 'red', qualityRAG: 'amber', daysToCompletion: 92, pmInitials: 'PW' },
  ];

  // Mock alerts
  const alerts: Alert[] = [
    { id: '1', level: 'red', title: 'Schedule Variance Alert', description: 'Tech Hub Phase 2 is 12 days behind baseline' },
    { id: '2', level: 'amber', title: 'Budget Watch', description: 'Retail Centre materials costs tracking 8% over budget' },
  ];

  // Mock activity feed
  const activityFeed: ActivityFeed[] = [
    { id: '1', user: 'Sarah Chen', action: 'Logged safety incident', module: 'Safety', time: '14 mins ago' },
    { id: '2', user: 'James Miller', action: 'Raised change order CO-285', module: 'Projects', time: '32 mins ago' },
    { id: '3', user: 'Patricia Watson', action: 'Approved invoice INV-5847', module: 'Finance', time: '1 hour ago' },
    { id: '4', user: 'Michael Brown', action: 'Created RFI-1203', module: 'Quality', time: '2 hours ago' },
  ];

  // Mock chart data
  const revenueData = [
    { month: 'Jan', revenue: 185000, cost: 142000 },
    { month: 'Feb', revenue: 220000, cost: 165000 },
    { month: 'Mar', revenue: 198000, cost: 148000 },
    { month: 'Apr', revenue: 289000, cost: 218000 },
    { month: 'May', revenue: 267000, cost: 200000 },
    { month: 'Jun', revenue: 310000, cost: 232000 },
  ];

  const projectStatusData = [
    { name: 'On Track', value: 7, fill: '#10b981' },
    { name: 'At Risk', value: 3, fill: '#f59e0b' },
    { name: 'Critical', value: 2, fill: '#ef4444' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'projects', label: 'Projects' },
    { id: 'finance', label: 'Finance' },
    { id: 'safety', label: 'Safety' },
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white font-display">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Construction Intelligence Command Center</p>
        </div>
        <button className="btn btn-secondary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* KPI Bar — 6 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="card p-4 hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-wider">{String(kpi.label)}</span>
                <div className={`p-2 rounded-lg bg-${kpi.color}-500/10`}>
                  <Icon className={`h-4 w-4 text-${kpi.color}-400`} />
                </div>
              </div>
              <div className="mb-3">
                <p className="text-xl font-bold text-white font-display">{String(kpi.value)}</p>
              </div>
              <div className="flex items-center gap-1">
                {Boolean(kpi.positive) && kpi.trend > 0 ? (
                  <ArrowUp className="h-3 w-3 text-emerald-400" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-400" />
                )}
                <span className={kpi.positive && kpi.trend > 0 ? 'text-emerald-400 text-xs' : 'text-red-400 text-xs'}>
                  {String(Math.abs(kpi.trend))}% vs last month
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        {tabs.map((tab) => (
          <button
            key={String(tab.id)}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {String(tab.label)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Revenue vs Cost + Project Status Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card p-5">
              <h3 className="text-lg font-bold text-white mb-4">Revenue vs Cost (12 Months)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="cost" stroke="#ef4444" fill="url(#colorCost)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-lg font-bold text-white mb-4">Project Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={projectStatusData as any} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value">
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={String(entry.fill)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {projectStatusData.map((item) => (
                  <div key={String(item.name)} className="flex justify-between">
                    <span className="text-gray-300">{String(item.name)}</span>
                    <span className="font-bold text-white">{Number(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3-column grid: Top Projects + Alerts + Deadlines */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-5">
              <h3 className="text-lg font-bold text-white mb-4">Top Projects by Value</h3>
              <div className="space-y-3">
                {projects.slice(0, 3).map((proj) => (
                  <div key={proj.id} className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-white text-sm">{String(proj.name)}</p>
                        <p className="text-xs text-gray-400">{String(proj.client)}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-emerald-400">{fmtCurrency(proj.value)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-lg font-bold text-white mb-4">Recent Alerts</h3>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg ${alert.level === 'red' ? 'bg-red-500/10 border border-red-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
                    <p className={`text-sm font-medium ${alert.level === 'red' ? 'text-red-400' : 'text-amber-400'}`}>{String(alert.title)}</p>
                    <p className="text-xs text-gray-300 mt-1">{String(alert.description)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-lg font-bold text-white mb-4">Upcoming Deadlines</h3>
              <div className="space-y-3">
                {projects.slice(0, 3).map((proj) => (
                  <div key={proj.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">{String(proj.name)}</p>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">{Number(proj.daysToCompletion)} days</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="flex gap-3">
            <button className="btn btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </button>
            <button className="btn btn-primary flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Raise Invoice
            </button>
            <button className="btn btn-primary flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Log Incident
            </button>
            <button className="btn btn-primary flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Create RFI
            </button>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Project Health Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map((proj) => (
                <div key={proj.id} className="card p-4 bg-gray-800/50">
                  <p className="font-bold text-white mb-2">{String(proj.name)}</p>
                  <p className="text-xs text-gray-400 mb-3">{String(proj.client)}</p>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300">Progress</span>
                      <span className="text-white">{Number(proj.progress)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${proj.progress}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div className={`p-2 rounded text-center font-bold ${proj.budgetRAG === 'green' ? 'bg-emerald-500/20 text-emerald-400' : proj.budgetRAG === 'amber' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>Budget</div>
                    <div className={`p-2 rounded text-center font-bold ${proj.programmeRAG === 'green' ? 'bg-emerald-500/20 text-emerald-400' : proj.programmeRAG === 'amber' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>Prog.</div>
                    <div className={`p-2 rounded text-center font-bold ${proj.qualityRAG === 'green' ? 'bg-emerald-500/20 text-emerald-400' : proj.qualityRAG === 'amber' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>Quality</div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{Number(proj.daysToCompletion)} days left</span>
                    <span className="font-bold">{String(proj.pmInitials)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Project Values</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projects.map((p) => ({ name: p.name, value: p.value }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: fmtCurrency(1269000), color: 'emerald' },
              { label: 'Total Costs', value: fmtCurrency(945000), color: 'red' },
              { label: 'Gross Profit', value: fmtCurrency(324000), color: 'blue' },
              { label: 'Net Profit', value: fmtCurrency(234000), color: 'green' },
            ].map((item) => (
              <div key={String(item.label)} className="card p-4">
                <p className="text-xs text-gray-400 uppercase mb-2">{String(item.label)}</p>
                <p className={`text-2xl font-bold text-${item.color}-400`}>{String(item.value)}</p>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Cash Position (12 Months)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Aged Debt Analysis</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: '0-30 days', value: 145000 },
                { label: '31-60 days', value: 89000 },
                { label: '61-90 days', value: 56000 },
                { label: '90+ days', value: 95000 },
              ].map((item) => (
                <div key={String(item.label)} className="p-4 bg-gray-800/50 rounded-lg text-center">
                  <p className="text-xs text-gray-400 mb-2">{String(item.label)}</p>
                  <p className="text-lg font-bold text-white">{fmtCurrency(item.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'safety' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Near Misses', value: '8', trend: -2 },
              { label: 'LTI', value: '0', trend: 0 },
              { label: 'RIDDOR', value: '1', trend: 0 },
              { label: 'Days Since Accident', value: '187', trend: 15 },
            ].map((item) => (
              <div key={String(item.label)} className="card p-4">
                <p className="text-xs text-gray-400 uppercase mb-2">{String(item.label)}</p>
                <p className="text-2xl font-bold text-white">{String(item.value)}</p>
                {Number(item.trend) !== 0 && (
                  <p className={`text-xs mt-2 ${item.trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {Number(item.trend) > 0 ? '+' : ''}{Number(item.trend)}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Incidents by Type</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { type: 'Slips/Trips', count: 3 },
                  { type: 'Hand Injuries', count: 2 },
                  { type: 'Near Miss', count: 8 },
                  { type: 'Environmental', count: 1 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="type" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                  <Bar dataKey="count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card p-5">
          <h3 className="text-lg font-bold text-white mb-4">Live Activity Feed</h3>
          <div className="space-y-3">
            {activityFeed.map((item) => (
              <div key={item.id} className="p-4 border-l-2 border-orange-500 bg-gray-800/30 rounded">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">{String(item.user)}</p>
                    <p className="text-sm text-gray-300 mt-1">{String(item.action)}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">{String(item.module)}</span>
                    <p className="text-xs text-gray-500 mt-2">{String(item.time)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
