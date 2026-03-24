/**
 * CortexBuild Ultimate — AI Intelligence Engine
 * World-class AI insights and intelligence platform
 */
import { useState, useMemo } from 'react';
import {
  Brain, TrendingUp, AlertTriangle, CheckCircle, Lightbulb,
  BarChart3, PieChart, Activity, Shield, PoundSterling,
  Users, FileText, ClipboardList, Zap, RefreshCw,
  ChevronRight, Sparkles, MessageSquare, Bell, Eye,
  AlertCircle, TrendingDown, Clock, Target, Award, Lock, Cloud,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart as RechartsPie,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';

type AnyRow = Record<string, unknown>;
type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
type CategoryType = 'all' | 'financial' | 'safety' | 'programme' | 'resource' | 'quality' | 'risk' | 'procurement' | 'weather';

interface Insight {
  id: string;
  category: Exclude<CategoryType, 'all'>;
  severity: SeverityLevel;
  title: string;
  description: string;
  recommendation: string;
  impact: string;
  confidence: number;
  dataPoints: number;
  timestamp: string;
}

const SEVERITY_CONFIG: Record<SeverityLevel, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
  high: { label: 'High', color: '#f97316', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.3)' },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  low: { label: 'Low', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
  info: { label: 'Info', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' },
};

const CATEGORY_ICONS: Record<Exclude<CategoryType, 'all'>, React.ComponentType<{ className?: string }>> = {
  financial: PoundSterling,
  safety: Shield,
  programme: Clock,
  resource: Users,
  quality: CheckCircle,
  risk: AlertTriangle,
  procurement: TrendingUp,
  weather: Cloud,
};

function generateMockInsights(): Insight[] {
  return [
    {
      id: 'fin-001',
      category: 'financial',
      severity: 'high',
      title: 'Invoice Payment Delays Accelerating',
      description: 'Average payment cycle extended from 35 to 47 days over past quarter. Top 3 clients represent 60% of outstanding invoices.',
      recommendation: 'Implement stricter payment terms (2/10 net 30). Establish payment follow-up protocol with top clients.',
      impact: '£95,000 working capital constraint affecting procurement',
      confidence: 87,
      dataPoints: 24,
      timestamp: '2026-03-22T14:30:00Z',
    },
    {
      id: 'saf-001',
      category: 'safety',
      severity: 'critical',
      title: 'Safety Incidents 23% Above Benchmark',
      description: 'Incident rate on Riverside Tower project 2.3x industry average for similar phasing. Recent near-miss trend concerning.',
      recommendation: 'Review toolbox talk frequency (increase to daily). Conduct safety stand-down. Refresh RAMS documentation.',
      impact: 'HSE investigation risk. Potential site suspension. Insurance implications.',
      confidence: 94,
      dataPoints: 12,
      timestamp: '2026-03-21T09:15:00Z',
    },
    {
      id: 'prg-001',
      category: 'programme',
      severity: 'medium',
      title: 'Tech Hub Phase 2 Schedule Slippage',
      description: 'Project currently 12 days behind baseline. Critical path activities trending 15% slow. MEP procurement delayed.',
      recommendation: 'Implement accelerated M&E programme. Increase crew size on critical path. Review and expedite material deliveries.',
      impact: 'Completion delay 18-21 days. Liquidated damages exposure £45,000.',
      confidence: 85,
      dataPoints: 18,
      timestamp: '2026-03-20T11:45:00Z',
    },
    {
      id: 'res-001',
      category: 'resource',
      severity: 'medium',
      title: 'RAMS Certification Compliance Gap',
      description: '8 team members lack current RAMS certification. Expiry dates within next 30 days. Site access at risk.',
      recommendation: 'Schedule RAMS refresh training immediately. Adjust site allocation pending certification completion.',
      impact: 'Site access restriction risk. Potential HSE compliance breach. Schedule impact.',
      confidence: 96,
      dataPoints: 47,
      timestamp: '2026-03-19T10:20:00Z',
    },
    {
      id: 'fin-002',
      category: 'financial',
      severity: 'info',
      title: 'Retail Centre Project On Track',
      description: 'Budget performance excellent. Current burn rate 98% of baseline. Margin tracking at 26% against target 25%.',
      recommendation: 'Maintain current cost controls. Consider contingency release for value-add extras.',
      impact: 'Positive margin realization. £120,000 upside potential.',
      confidence: 91,
      dataPoints: 14,
      timestamp: '2026-03-18T16:30:00Z',
    },
    {
      id: 'proc-001',
      category: 'procurement',
      severity: 'high',
      title: 'Supply Chain Risk — Steel Shortage',
      description: 'Global steel prices rising. Lead times extending. Structural steelwork supplier reporting 4-week delays.',
      recommendation: 'Lock in price and schedule with alternative supplier. Consider value engineering options.',
      impact: '£180,000 potential cost overrun. 3-week programme impact.',
      confidence: 89,
      dataPoints: 22,
      timestamp: '2026-03-17T13:00:00Z',
    },
    {
      id: 'qual-001',
      category: 'quality',
      severity: 'low',
      title: 'Concrete Curing Records — Minor Gap',
      description: 'Two days of temperature curing records missing from Manchester project foundation phase.',
      recommendation: 'Obtain supplementary test results. Review quality control procedures. Implement daily checklist system.',
      impact: 'Minor documentation issue. No structural impact confirmed.',
      confidence: 78,
      dataPoints: 8,
      timestamp: '2026-03-16T08:45:00Z',
    },
    {
      id: 'risk-001',
      category: 'risk',
      severity: 'medium',
      title: 'Weather Forecast — Adverse Conditions',
      description: 'Met Office predicts heavy rain next 5 days. Ground conditions may impact piling operations.',
      recommendation: 'Activate contingency programme. Increase site drainage capacity. Prepare accelerated schedule if weather clears.',
      impact: '2-3 day potential delay if conditions extend.',
      confidence: 82,
      dataPoints: 15,
      timestamp: '2026-03-15T15:20:00Z',
    },
    {
      id: 'fin-003',
      category: 'financial',
      severity: 'medium',
      title: 'Debtor Days Trending Upward',
      description: 'Average debtor days increased from 38 to 52 days YTD. Northern Living Ltd 68 days overdue.',
      recommendation: 'Initiate formal recovery procedures for overdue accounts. Implement weekly collection calls.',
      impact: 'Cash flow impact £135,000. Working capital pressure.',
      confidence: 88,
      dataPoints: 28,
      timestamp: '2026-03-14T12:10:00Z',
    },
    {
      id: 'proc-002',
      category: 'procurement',
      severity: 'low',
      title: 'Subcontractor Performance — Excellent',
      description: 'Turner Steelwork consistently delivering ahead of schedule. Zero defects recorded.',
      recommendation: 'Recognize performance. Consider long-term framework agreement. Offer priority on future projects.',
      impact: '£850,000 contract value. Opportunity for preferred partnership.',
      confidence: 92,
      dataPoints: 35,
      timestamp: '2026-03-13T10:30:00Z',
    },
    {
      id: 'saf-002',
      category: 'safety',
      severity: 'low',
      title: 'Safety Training Completion Rate — 98%',
      description: 'Team safety training completion rate exceeds target. SMSTS certification 100% current.',
      recommendation: 'Maintain training schedule. Document for HSE compliance verification.',
      impact: 'Strong safety culture. Reduced incident risk.',
      confidence: 95,
      dataPoints: 52,
      timestamp: '2026-03-12T09:00:00Z',
    },
    {
      id: 'prg-002',
      category: 'programme',
      severity: 'low',
      title: 'Bridge Project Ahead of Schedule',
      description: 'Birmingham Road Bridge 89% complete and 5 days ahead of baseline schedule.',
      recommendation: 'Maintain current pace. Plan early completion celebration with stakeholders.',
      impact: 'Positive reputation impact. Potential early release of resources.',
      confidence: 94,
      dataPoints: 41,
      timestamp: '2026-03-11T14:45:00Z',
    },
    {
      id: 'res-002',
      category: 'resource',
      severity: 'low',
      title: 'Team Capacity — Good Balance',
      description: 'Current team utilization 82%. Resource plan well-aligned with project pipeline.',
      recommendation: 'Continue current staffing plan. Monitor tender pipeline for future capacity needs.',
      impact: 'Optimal resource efficiency. Minimal bench time.',
      confidence: 89,
      dataPoints: 19,
      timestamp: '2026-03-10T11:20:00Z',
    },
    {
      id: 'qual-002',
      category: 'quality',
      severity: 'medium',
      title: 'Inspection Score Variance',
      description: 'Quality inspection scores varying between sites (range 78-98%). Data Centre showing 98% vs Bridge 87%.',
      recommendation: 'Implement standardized quality control procedures across all projects.',
      impact: 'Potential rework costs if not addressed. Client satisfaction risk.',
      confidence: 84,
      dataPoints: 26,
      timestamp: '2026-03-09T13:15:00Z',
    },
    {
      id: 'weather-001',
      category: 'weather',
      severity: 'low',
      title: 'Optimal Weather Window Opening',
      description: 'Extended forecast shows 10-day dry period. Excellent conditions for concrete works and roofing.',
      recommendation: 'Accelerate concrete pours and structural completion. Maximize outdoor activities.',
      impact: '1-2 week potential acceleration in critical path.',
      confidence: 86,
      dataPoints: 12,
      timestamp: '2026-03-08T16:00:00Z',
    },
  ];
}

export function Insights() {
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'recommendations' | 'benchmarks' | 'actions' | 'trends'>('overview');
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>('all');
  const [lastRefresh, setLastRefresh] = useState<string>(new Date().toLocaleTimeString());
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());
  const [actionItems, setActionItems] = useState<Array<{
    id: string;
    title: string;
    insightId: string;
    priority: 'high' | 'medium' | 'low';
    owner: string;
    dueDate: string;
    status: 'open' | 'in_progress' | 'done';
    notes: string;
  }>>([
    {
      id: 'act1',
      title: 'Follow up with Northern Living on invoice payment',
      insightId: 'fin-001',
      priority: 'high',
      owner: 'Lisa Anderson',
      dueDate: '2026-03-28',
      status: 'open',
      notes: 'Account 68 days overdue. Requires formal recovery procedures.',
    },
    {
      id: 'act2',
      title: 'Conduct safety stand-down on Riverside Tower',
      insightId: 'saf-001',
      priority: 'high',
      owner: 'Mike Turner',
      dueDate: '2026-03-24',
      status: 'in_progress',
      notes: 'Daily toolbox talks to be implemented immediately.',
    },
    {
      id: 'act3',
      title: 'Review Tech Hub MEP procurement timeline',
      insightId: 'prg-001',
      priority: 'high',
      owner: 'Claire Watson',
      dueDate: '2026-03-26',
      status: 'open',
      notes: 'Expedite material orders to recover schedule.',
    },
  ]);

  const allInsights = useMemo(() => generateMockInsights(), []);

  const filteredInsights = useMemo(() => {
    return allInsights
      .filter(i => !dismissedInsights.has(i.id))
      .filter(i => severityFilter === 'all' || i.severity === severityFilter)
      .filter(i => categoryFilter === 'all' || i.category === categoryFilter);
  }, [allInsights, severityFilter, categoryFilter, dismissedInsights]);

  const criticalCount = filteredInsights.filter(i => i.severity === 'critical').length;
  const highCount = filteredInsights.filter(i => i.severity === 'high').length;
  const actionsPending = actionItems.filter(a => a.status !== 'done').length;
  const avgConfidence = Math.round(
    filteredInsights.reduce((sum, i) => sum + i.confidence, 0) / Math.max(filteredInsights.length, 1)
  );
  const totalDataPoints = filteredInsights.reduce((sum, i) => sum + i.dataPoints, 0);

  const insightsByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    filteredInsights.forEach(i => {
      cats[i.category] = (cats[i.category] || 0) + 1;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [filteredInsights]);

  const confidenceDistribution = useMemo(() => {
    const ranges = [
      { name: '80-89%', count: 0 },
      { name: '90-94%', count: 0 },
      { name: '95-100%', count: 0 },
    ];
    filteredInsights.forEach(i => {
      if (i.confidence < 90) ranges[0].count++;
      else if (i.confidence < 95) ranges[1].count++;
      else ranges[2].count++;
    });
    return ranges;
  }, [filteredInsights]);

  const trendData = useMemo(() => {
    return [
      { month: 'Jan', critical: 2, high: 5, medium: 8, low: 12 },
      { month: 'Feb', critical: 3, high: 7, medium: 10, low: 15 },
      { month: 'Mar', critical: 4, high: 9, medium: 11, low: 14 },
    ];
  }, []);

  const recentActivity = useMemo(() => {
    return filteredInsights.slice(0, 5).map(i => ({
      title: i.title,
      timestamp: i.timestamp,
      severity: i.severity,
    }));
  }, [filteredInsights]);

  const handleRefresh = () => {
    setLastRefresh(new Date().toLocaleTimeString());
  };

  const handleDismiss = (id: string) => {
    setDismissedInsights(new Set(dismissedInsights).add(id));
  };

  const radialData = [{ name: 'Health', value: avgConfidence, fill: '#3b82f6' }];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f97316', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white font-display flex items-center gap-3">
            <Brain className="w-8 h-8 text-orange-500" />
            AI Intelligence Engine
          </h1>
          <p className="text-sm text-gray-400 mt-1">Last refreshed: {lastRefresh}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition">
            <Sparkles className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 overflow-x-auto">
        {(['overview', 'alerts', 'recommendations', 'benchmarks', 'actions', 'trends'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium text-sm transition whitespace-nowrap ${
              activeTab === tab
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Critical Insights</p>
                  <p className="text-2xl font-bold text-white mt-1">{criticalCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">High Priority</p>
                  <p className="text-2xl font-bold text-white mt-1">{highCount}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Actions Pending</p>
                  <p className="text-2xl font-bold text-white mt-1">{actionsPending}</p>
                </div>
                <ClipboardList className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Confidence</p>
                  <p className="text-2xl font-bold text-white mt-1">{avgConfidence}%</p>
                </div>
                <Award className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Data Points</p>
                  <p className="text-2xl font-bold text-white mt-1">{totalDataPoints}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Dismissed</p>
                  <p className="text-2xl font-bold text-white mt-1">{dismissedInsights.size}</p>
                </div>
                <Eye className="w-8 h-8 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Health Score & Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* AI Health Score */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-4">AI Health Score</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart
                  data={radialData}
                  innerRadius="70%"
                  outerRadius="100%"
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar dataKey="value" fill="#3b82f6" />
                </RadialBarChart>
              </ResponsiveContainer>
              <p className="text-center text-gray-400 text-sm mt-2">{avgConfidence}% System Confidence</p>
            </div>

            {/* Insights by Category */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-4">Insights by Category</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={insightsByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Bar dataKey="value" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Confidence Distribution */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-4">Confidence Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPie data={confidenceDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="count">
                  {confidenceDistribution.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">Recent Insight Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-700 last:border-b-0">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: SEVERITY_CONFIG[activity.severity as SeverityLevel].color }} />
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.title}</p>
                    <p className="text-gray-400 text-xs mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2"
            >
              <option value="all">All Categories</option>
              <option value="financial">Financial</option>
              <option value="safety">Safety</option>
              <option value="programme">Programme</option>
              <option value="resource">Resource</option>
              <option value="quality">Quality</option>
              <option value="risk">Risk</option>
              <option value="procurement">Procurement</option>
              <option value="weather">Weather</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredInsights.map(insight => {
              const CategoryIcon = CATEGORY_ICONS[insight.category];
              const config = SEVERITY_CONFIG[insight.severity];
              return (
                <div
                  key={insight.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition"
                  style={{ borderLeftColor: config.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                        style={{ backgroundColor: config.bg }}
                      >
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-semibold">{insight.title}</h4>
                          <span
                            className="text-xs px-2 py-1 rounded font-medium"
                            style={{ backgroundColor: config.bg, color: config.color }}
                          >
                            {config.label}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">{insight.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button className="p-2 hover:bg-gray-700 rounded-lg transition">
                        <Target className="w-4 h-4 text-gray-400" />
                      </button>
                      <button onClick={() => handleDismiss(insight.id)} className="p-2 hover:bg-gray-700 rounded-lg transition">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3 ml-11">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">AI Recommendation</p>
                      <p className="text-gray-300 text-sm">{insight.recommendation}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Business Impact</p>
                      <p className="text-gray-300 text-sm">{insight.impact}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between ml-11 pt-2 border-t border-gray-700">
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>Confidence: {insight.confidence}%</span>
                      <span>Data Points: {insight.dataPoints}</span>
                    </div>
                    <button className="flex items-center gap-1 text-orange-500 hover:text-orange-400 text-sm font-medium transition">
                      Assign Action <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {['Financial', 'Safety', 'Programme'].map((category, idx) => (
            <div key={idx} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-4">{category} Recommendations</h3>
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="p-4 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-white font-medium">Action item #{i}</h4>
                      {i === 1 ? <span className="bg-green-900 text-green-200 text-xs px-2 py-1 rounded">Quick Win</span> : <span className="bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded">Strategic</span>}
                    </div>
                    <p className="text-gray-300 text-sm mb-3">Implementation details and expected outcomes</p>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                      <div>Time: 1-2 weeks</div>
                      <div>ROI: £50K</div>
                      <div>Priority: High</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Benchmarks Tab */}
      {activeTab === 'benchmarks' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { name: 'Safety RIDDOR Rate', yours: 45, benchmark: 60 },
            { name: 'Invoice Debtor Days', yours: 48, benchmark: 38 },
            { name: 'Schedule Adherence', yours: 94, benchmark: 92 },
          ].map((metric, idx) => (
            <div key={idx} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h4 className="text-white font-semibold mb-4">{metric.name}</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Your Performance</span>
                    <span className="text-white">{metric.yours}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(metric.yours, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Industry Benchmark</span>
                    <span className="text-white">{metric.benchmark}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${Math.min(metric.benchmark, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions Tab */}
      {activeTab === 'actions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm">Open</p>
              <p className="text-2xl font-bold text-white">{actionItems.filter(a => a.status === 'open').length}</p>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm">In Progress</p>
              <p className="text-2xl font-bold text-white">{actionItems.filter(a => a.status === 'in_progress').length}</p>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-white">{actionItems.filter(a => a.status === 'done').length}</p>
            </div>
          </div>

          <div className="space-y-3">
            {actionItems.map(action => (
              <div key={action.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-semibold">{action.title}</h4>
                  <select
                    value={action.status}
                    className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <p className="text-gray-400 text-sm mb-3">{action.notes}</p>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Owner: {action.owner}</span>
                  <span>Due: {action.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-white font-semibold mb-4">12-Month Insight Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Legend />
                <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                <Area type="monotone" dataKey="high" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
                <Area type="monotone" dataKey="medium" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Financial', 'Safety', 'Programme', 'Resource'].map((cat, idx) => (
              <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h4 className="text-white font-semibold mb-2">{cat} Trends</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">This month vs last</span>
                  <span className="text-green-400 font-medium flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> +12%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
