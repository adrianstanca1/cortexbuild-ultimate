// Module: Insights — CortexBuild Ultimate Enhanced
import { useState } from 'react';
import {
  TrendingUp, AlertTriangle, Lightbulb, Activity, Shield, PoundSterling,
  Users, FileText, ClipboardList, Target, RefreshCw,
  CheckSquare, Square, Trash2, Brain, CheckCircle, XCircle, BarChart3, Zap, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { insightsApi } from '../../services/api';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { EmptyState } from '../ui/EmptyState';
import {
  BarChart, Bar, PieChart as RechartsPie,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';

type _AnyRow = Record<string, unknown>;
type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
type CategoryType = 'all' | 'financial' | 'safety' | 'programme' | 'resource' | 'quality' | 'risk';
type TabType = 'overview' | 'alerts' | 'recommendations' | 'benchmarks' | 'actions' | 'trends';

interface Insight {
  id: string;
  category: Exclude<CategoryType, 'all'>;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  recommendation: string;
  impact: string;
  confidence: number;
  dataPoints: number;
  generatedAt?: string;
}

interface Alert {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  module: string;
  suggestedAction: string;
  createdAt: string;
}

interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimatedBenefit: string;
}

interface AIAction {
  id: string;
  timestamp: string;
  module: string;
  action: string;
  outcome: 'success' | 'pending' | 'failed';
  details: string;
}

interface TrendData {
  month: string;
  riskScore: number;
  costEfficiency: number;
  teamProductivity: number;
}

const SEVERITY_CONFIG: Record<'critical' | 'high' | 'medium' | 'low' | 'info', { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
  high: { label: 'High', color: '#f97316', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.3)' },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  low: { label: 'Low', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
  info: { label: 'Info', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' },
};

const PRIORITY_CONFIG: Record<'critical' | 'high' | 'medium' | 'low', { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: '#ef4444', bg: 'bg-red-500/10' },
  high: { label: 'High', color: '#f97316', bg: 'bg-orange-500/10' },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'bg-yellow-500/10' },
  low: { label: 'Low', color: '#3b82f6', bg: 'bg-blue-500/10' },
};



export function Insights() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>('all');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const { data: allInsights = [] } = useQuery({
    queryKey: ['insights'],
    queryFn: insightsApi.getAll,
  });

  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  // Alerts derived from high/critical insights
  const realAlerts: Alert[] = allInsights
    .filter(i => i.severity === 'critical' || i.severity === 'high')
    .map(i => ({
      id: i.id,
      priority: i.severity as 'critical' | 'high',
      title: i.title,
      description: i.description,
      module: i.category.charAt(0).toUpperCase() + i.category.slice(1),
      suggestedAction: i.recommendation,
      createdAt: i.generatedAt ? new Date(i.generatedAt).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'Recently',
    }));

  // Recommendations derived from all insights
  const realRecommendations: Recommendation[] = allInsights
    .filter(i => i.recommendation)
    .map(i => ({
      id: `rec-${i.id}`,
      category: i.category.charAt(0).toUpperCase() + i.category.slice(1),
      title: i.title,
      description: i.recommendation,
      impact: (i.severity === 'critical' || i.severity === 'high') ? 'high' : i.severity === 'medium' ? 'medium' : 'low',
      estimatedBenefit: `${Math.round(i.confidence)}% confidence`,
    }));

  // AI actions derived from insights
  const realAIActions: AIAction[] = allInsights
    .filter(i => i.generatedAt)
    .sort((a, b) => new Date(b.generatedAt!).getTime() - new Date(a.generatedAt!).getTime())
    .slice(0, 10)
    .map(i => ({
      id: `action-${i.id}`,
      timestamp: (() => {
        const diff = Date.now() - new Date(i.generatedAt!).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
      })(),
      module: i.category.charAt(0).toUpperCase() + i.category.slice(1),
      action: i.title,
      outcome: 'success' as const,
      details: i.description,
    }));

  // Trend & benchmark data (industry constants — no live API)
  const TREND_DATA: TrendData[] = [
    { month: 'Oct', riskScore: 72, costEfficiency: 68, teamProductivity: 75 },
    { month: 'Nov', riskScore: 68, costEfficiency: 71, teamProductivity: 78 },
    { month: 'Dec', riskScore: 65, costEfficiency: 74, teamProductivity: 82 },
    { month: 'Jan', riskScore: 62, costEfficiency: 76, teamProductivity: 85 },
    { month: 'Feb', riskScore: 58, costEfficiency: 78, teamProductivity: 84 },
    { month: 'Mar', riskScore: 52, costEfficiency: 81, teamProductivity: 87 },
  ];
  const BENCHMARK_DATA = [
    { metric: 'Project Completion', cortex: 94, industry: 82 },
    { metric: 'Cost Variance', cortex: 2.3, industry: 5.8 },
    { metric: 'Safety Incidents', cortex: 3, industry: 8 },
    { metric: 'RFI Resolution', cortex: 2.1, industry: 4.5 },
  ];

  // Mock trend data (kept for chart structure compatibility)
  const trendData: TrendData[] = [
    { month: 'Oct', riskScore: 72, costEfficiency: 68, teamProductivity: 75 },
    { month: 'Nov', riskScore: 68, costEfficiency: 71, teamProductivity: 78 },
    { month: 'Dec', riskScore: 65, costEfficiency: 74, teamProductivity: 82 },
    { month: 'Jan', riskScore: 62, costEfficiency: 76, teamProductivity: 85 },
    { month: 'Feb', riskScore: 58, costEfficiency: 78, teamProductivity: 84 },
    { month: 'Mar', riskScore: 52, costEfficiency: 81, teamProductivity: 87 },
  ];

    // Dismiss an insight (local state only — backend generates fresh)
  const _dismissInsight = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} insight(s)?`)) return;
    toast.success(`Deleted ${ids.length} insight(s)`);
    setDismissed(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
    clearSelection();
  }

  const filteredInsights = allInsights.filter((insight) => {
    if (dismissed.has(insight.id)) return false;
    if (severityFilter !== 'all' && insight.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && insight.category !== categoryFilter) return false;
    return true;
  });

  const filteredAlerts = realAlerts.filter(alert => !dismissedAlerts.has(alert.id));
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const criticalCount = filteredInsights.filter((i) => i.severity === 'critical').length;
  const highCount = filteredInsights.filter((i) => i.severity === 'high').length;
  const avgConfidence = filteredInsights.length
    ? Math.round(filteredInsights.reduce((s, i) => s + i.confidence, 0) / filteredInsights.length)
    : 0;

  const categoryData = [
    { category: 'Financial', critical: 1, high: 1, medium: 0 },
    { category: 'Safety', critical: 1, high: 0, medium: 0 },
    { category: 'Programme', critical: 0, high: 0, medium: 1 },
    { category: 'Resource', critical: 0, high: 0, medium: 1 },
    { category: 'Quality', critical: 0, high: 0, medium: 0 },
  ];

  const confidenceData = [
    { name: '90%+', value: 3, color: '#10b981' },
    { name: '80-89%', value: 2, color: '#f59e0b' },
    { name: '<80%', value: 0, color: '#ef4444' },
  ];

  // Calculate health score
  const healthScore = Math.round(
    (avgConfidence * 0.3 + (100 - ((criticalCount / (filteredInsights.length || 1)) * 100)) * 0.4 + (highCount > 3 ? 50 : 90) * 0.3)
  );

  // Calculate KPIs
  const insightsGenerated = filteredInsights.length;
  const alertsResolved = dismissedAlerts.size;
  const actionsTaken = realAIActions.filter(a => a.outcome === 'success').length;
  const accuracyPercent = avgConfidence;

  const InsightCard = ({ insight }: { insight: Insight }) => {
    const cfg = SEVERITY_CONFIG[insight.severity];
    const isSelected = selectedIds.has(insight.id);
    const Icon = insight.category === 'safety'
      ? Shield
      : insight.category === 'financial'
        ? PoundSterling
        : insight.category === 'programme'
          ? Activity
          : insight.category === 'resource'
            ? Users
            : insight.category === 'quality'
              ? ClipboardList
              : FileText;

    return (
      <div
        className="card p-5 border-l-4 animate-fade-up"
        style={{ borderLeftColor: cfg.color, background: cfg.bg, borderColor: cfg.border }}
      >
        <div className="flex gap-4 items-start">
          <button type="button" onClick={e => { e.stopPropagation(); toggle(insight.id); }}>
            {isSelected ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
          </button>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${cfg.color}20` }}>
            <Icon className="h-5 w-5" style={{ color: cfg.color }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-bold text-white">{String(insight.title)}</span>
              <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                {SEVERITY_CONFIG[insight.severity].label}
              </span>
              <span className="text-xs text-gray-500">{Number(insight.confidence)}% confidence</span>
            </div>
            <p className="text-sm text-gray-300 mb-3">{String(insight.description)}</p>
            <div className="bg-gray-800/50 rounded p-3 mb-3">
              <div className="flex items-start gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-400 uppercase font-bold mb-1">Recommendation</p>
                  <p className="text-sm text-gray-200">{String(insight.recommendation)}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">Impact: {String(insight.impact)}</p>
              <button
                onClick={() => setDismissed(new Set(dismissed.add(insight.id)))}
                className="px-3 py-1 rounded text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AlertCard = ({ alert }: { alert: Alert }) => {
    const cfg = PRIORITY_CONFIG[alert.priority];
    return (
      <div className={`card p-5 border-l-4 border-gray-700 ${cfg.bg}`}>
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.color + '20' }}>
            <AlertTriangle className="h-5 w-5" style={{ color: cfg.color }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-bold text-white">{alert.title}</span>
              <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: cfg.color + '20', color: cfg.color }}>
                {cfg.label}
              </span>
            </div>
            <p className="text-sm text-gray-300 mb-2">{alert.description}</p>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Module: <span className="text-gray-300">{alert.module}</span> • {alert.createdAt}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-1.5 rounded text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {alert.suggestedAction}
              </button>
              <button
                onClick={() => setDismissedAlerts(new Set([...dismissedAlerts, alert.id]))}
                className="px-3 py-1.5 rounded text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RecommendationCard = ({ rec }: { rec: Recommendation }) => {
    const impactColors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
    return (
      <div className="card p-5 border border-gray-700 hover:border-amber-500/50 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-amber-400 uppercase font-bold">{rec.category}</p>
            <h4 className="text-sm font-bold text-white mt-1">{rec.title}</h4>
          </div>
          <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: impactColors[rec.impact] + '20', color: impactColors[rec.impact] }}>
            {rec.impact === 'high' ? 'High' : rec.impact === 'medium' ? 'Medium' : 'Low'} Impact
          </span>
        </div>
        <p className="text-sm text-gray-300 mb-3">{rec.description}</p>
        <div className="bg-gray-800/50 rounded p-3 mb-4">
          <p className="text-xs text-emerald-400 font-bold">Estimated Benefit: {rec.estimatedBenefit}</p>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 rounded text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-1 font-medium">
            <CheckCircle className="h-3 w-3" />
            Apply
          </button>
          <button className="flex-1 px-3 py-2 rounded text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors font-medium">
            Dismiss
          </button>
        </div>
      </div>
    );
  };

  const ActivityFeed = () => (
    <div className="space-y-3">
      {realAIActions.map((action) => (
        <div key={action.id} className="flex gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex-shrink-0 pt-1">
            {action.outcome === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
            {action.outcome === 'pending' && <Clock className="h-4 w-4 text-amber-400" />}
            {action.outcome === 'failed' && <XCircle className="h-4 w-4 text-red-400" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white">{action.action}</p>
              <span className="text-xs text-gray-500">{action.timestamp}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{action.module} • {action.details}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <ModuleBreadcrumbs currentModule="insights" onNavigate={() => {}} />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white font-display">AI Intelligence Engine</h1>
            <p className="text-sm text-gray-400 mt-1">Real-time project intelligence and predictive analytics</p>
          </div>
          <button className="btn btn-secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-700 overflow-x-auto">
          {(['overview', 'alerts', 'recommendations', 'benchmarks', 'actions', 'trends'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab === 'overview' && 'Overview'}
              {tab === 'alerts' && 'Alerts'}
              {tab === 'recommendations' && 'Recommendations'}
              {tab === 'benchmarks' && 'Benchmarks'}
              {tab === 'actions' && 'AI Actions'}
              {tab === 'trends' && 'Trends'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Health Score Card */}
            <div className="card p-8 bg-gradient-to-br from-gray-800 to-gray-900 border border-amber-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 uppercase font-bold mb-2">AI Health Score</p>
                  <div className="text-5xl font-bold text-amber-400">{healthScore}</div>
                  <p className="text-sm text-gray-400 mt-2">Overall system health excellent</p>
                </div>
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#374151" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="8"
                      strokeDasharray={`${(healthScore / 100) * 283} 283`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-2xl font-bold text-white">{healthScore}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Insights Generated', value: insightsGenerated, icon: Brain, color: 'text-blue-400' },
                { label: 'Alerts Resolved', value: alertsResolved, icon: CheckCircle, color: 'text-emerald-400' },
                { label: 'Actions Taken', value: actionsTaken, icon: Zap, color: 'text-amber-400' },
                { label: 'Accuracy', value: `${accuracyPercent}%`, icon: Target, color: 'text-purple-400' },
              ].map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div key={String(kpi.label)} className="card p-4 border border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                        <Icon className={`h-5 w-5 ${kpi.color}`} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase">{String(kpi.label)}</p>
                        <p className="text-2xl font-bold text-white">{String(kpi.value)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-5 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Insights by Category</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="category" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                      <Legend />
                      <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" />
                      <Bar dataKey="high" stackId="a" fill="#f97316" name="High" />
                      <Bar dataKey="medium" stackId="a" fill="#f59e0b" name="Medium" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card p-5 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Confidence Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie data={confidenceData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value">
                        {confidenceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={String(entry.color)} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="card p-5 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-amber-400" />
                Recent AI Actions
              </h3>
              <ActivityFeed />
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {sortedAlerts.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="All Clear"
                description="No alerts at this time. Your projects are running smoothly."
                variant="default"
              />
            ) : (
              sortedAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {realRecommendations.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} />
            ))}
          </div>
        )}

        {/* Benchmarks Tab */}
        {activeTab === 'benchmarks' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-400">Performance vs UK construction industry benchmarks</p>
            <div className="card p-5 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-amber-400" />
                Key Metrics Performance
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={BENCHMARK_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="metric" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                    <Legend />
                    <Bar dataKey="cortex" fill="#f59e0b" name="CortexBuild" />
                    <Bar dataKey="industry" fill="#6b7280" name="Industry Benchmark" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* AI Actions Tab */}
        {activeTab === 'actions' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Log of automated AI actions and outcomes</p>
            <ActivityFeed />
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-400">AI-detected trends over the last 6 months</p>
            <div className="card p-5 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                6-Month Trend Analysis
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={TREND_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                    <Legend />
                    <Area type="monotone" dataKey="riskScore" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} name="Risk Score" />
                    <Area type="monotone" dataKey="costEfficiency" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} name="Cost Efficiency" />
                    <Area type="monotone" dataKey="teamProductivity" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Team Productivity" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Filters for Insights Tab */}
        {activeTab === 'overview' && (
          <>
            <div className="card p-4 bg-gray-800/50 border border-gray-700">
              <div className="flex flex-wrap gap-4 items-center">
                <span className="text-sm text-gray-400 uppercase font-bold">Severity:</span>
                {(['all', 'critical', 'high', 'medium', 'low', 'info'] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      severityFilter === sev
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                        : 'bg-gray-800 text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </button>
                ))}

                <div className="w-px h-6 bg-gray-700" />

                <span className="text-sm text-gray-400 uppercase font-bold">Category:</span>
                {(['all', 'financial', 'safety', 'programme', 'resource', 'quality', 'risk'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      categoryFilter === cat
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                        : 'bg-gray-800 text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Insights List */}
            <div className="space-y-4">
              {filteredInsights.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="All Clear"
                  description="No insights match your filters. Keep up the great work!"
                  variant="default"
                />
              ) : (
                filteredInsights.map((insight) => <InsightCard key={insight.id} insight={insight} />)
              )}
            </div>

            <BulkActionsBar
              selectedIds={Array.from(selectedIds)}
              actions={[
                { id: 'delete', label: 'Dismiss Selected', icon: Trash2, variant: 'danger', onClick: handleBulkDelete, confirm: 'This will dismiss the selected insights.' },
              ]}
              onClearSelection={clearSelection}
            />
          </>
        )}
      </div>
    </>
  );
}
export default Insights;
