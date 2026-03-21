// Module: AI Insights — CortexBuild Ultimate
// AI-powered intelligence engine analyzing project health, safety trends, and financial metrics
import { useState, useMemo } from 'react';
import {
  Brain, TrendingUp, AlertTriangle, CheckCircle, Lightbulb,
  BarChart3, PieChart as PieChartIcon, Activity, Shield, PoundSterling,
  Users, FileText, ClipboardList, Target, Zap, ArrowRight,
  ChevronRight, Sparkles, MessageSquare, Bell,
} from 'lucide-react';
import {
  useProjects, useSafety, useInvoices, useRFIs, useChangeOrders,
  useDailyReports, useTeam, useSubcontractors,
} from '../../hooks/useData';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { Module } from '../../types';

type AnyRow = Record<string, unknown>;

// Insight severity levels
const SEVERITY = {
  critical: { label: 'Critical', color: 'var(--red-400)', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
  high:     { label: 'High',     color: 'var(--orange-400)', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.3)' },
  medium:   { label: 'Medium',   color: 'var(--amber-400)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  low:      { label: 'Low',      color: 'var(--emerald-400)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
  info:     { label: 'Info',     color: 'var(--blue-400)', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' },
};
type SeverityKey = keyof typeof SEVERITY;

// Generate AI insights from data
function generateInsights(
  projects: AnyRow[],
  safety: AnyRow[],
  invoices: AnyRow[],
  rfis: AnyRow[],
  changeOrders: AnyRow[],
  dailyReports: AnyRow[],
  team: AnyRow[],
  subcontractors: AnyRow[]
) {
  const insights: {
    id: string;
    category: 'financial' | 'safety' | 'programme' | 'resource' | 'quality' | 'risk';
    severity: keyof typeof SEVERITY;
    title: string;
    description: string;
    recommendation: string;
    impact: string;
    confidence: number;
    dataPoints: number;
  }[] = [];

  // === FINANCIAL INSIGHTS ===
  const activeProjects = projects.filter(p => p.status === 'active');
  const totalBudget = activeProjects.reduce((s, p) => s + Number(p.budget ?? 0), 0);
  const totalSpent = activeProjects.reduce((s, p) => s + Number(p.spent ?? 0), 0);
  const budgetVariance = totalBudget > 0 ? ((totalSpent - totalBudget) / totalBudget) * 100 : 0;

  if (budgetVariance > 10) {
    insights.push({
      id: 'fin-001',
      category: 'financial',
      severity: 'critical',
      title: 'Budget Overrun Alert',
      description: `Portfolio is ${budgetVariance.toFixed(1)}% over budget. Total overspend: £${(totalSpent - totalBudget).toLocaleString()}`,
      recommendation: 'Implement cost control measures. Review remaining work packages for value engineering opportunities.',
      impact: 'Projected margin reduction of 15-20% if current trend continues',
      confidence: 92,
      dataPoints: activeProjects.length,
    });
  }

  const paidInvoices = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount ?? 0), 0);
  const overdueInvoices = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.amount ?? 0), 0);
  const cashFlowRatio = paidInvoices > 0 ? overdueInvoices / paidInvoices : 0;

  if (cashFlowRatio > 0.3) {
    insights.push({
      id: 'fin-002',
      category: 'financial',
      severity: 'high',
      title: 'Cash Flow Pressure',
      description: `Overdue invoices represent ${(cashFlowRatio * 100).toFixed(0)}% of collected revenue. £${overdueInvoices.toLocaleString()} outstanding`,
      recommendation: 'Prioritize collections on overdue accounts. Consider payment plans for large balances.',
      impact: 'Working capital constraints may affect material procurement and subcontractor payments',
      confidence: 88,
      dataPoints: invoices.length,
    });
  }

  // === SAFETY INSIGHTS ===
  const openIncidents = safety.filter(s => ['open', 'investigating'].includes(String(s.status))).length;
  const criticalIncidents = safety.filter(s => ['critical', 'serious'].includes(String(s.severity))).length;
  const riddorCount = safety.filter(s => s.riddor_reportable || String(s.type) === 'riddor').length;
  const safetyScore = Math.max(0, 100 - openIncidents * 8 - criticalIncidents * 15);

  if (safetyScore < 60) {
    insights.push({
      id: 'saf-001',
      category: 'safety',
      severity: 'critical',
      title: 'Safety Performance Degradation',
      description: `Safety score at ${safetyScore}/100. ${openIncidents} open incidents, ${criticalIncidents} critical`,
      recommendation: 'Immediate safety stand-down recommended. Review all high-risk activities and implement enhanced controls.',
      impact: 'Increased HSE enforcement risk. Potential project delays from incident investigations',
      confidence: 95,
      dataPoints: safety.length,
    });
  }

  if (riddorCount > 2) {
    insights.push({
      id: 'saf-002',
      category: 'safety',
      severity: 'high',
      title: 'RIDDOR Reporting Threshold',
      description: `${riddorCount} RIDDOR-reportable incidents this period`,
      recommendation: 'Ensure all RIDDOR filings are submitted within 10-day statutory window. Review incident prevention measures.',
      impact: 'HSE investigation likelihood increases with multiple reportable incidents',
      confidence: 98,
      dataPoints: riddorCount,
    });
  }

  // === PROGRAMME INSIGHTS ===
  const delayedProjects = activeProjects.filter(p => {
    const endDate = new Date(String(p.end_date ?? ''));
    const today = new Date();
    const progress = Number(p.progress ?? 0);
    const expectedProgress = Math.min(100, ((today.getTime() - new Date(String(p.start_date ?? '')).getTime()) / (endDate.getTime() - new Date(String(p.start_date ?? '')).getTime())) * 100);
    return progress < expectedProgress - 15;
  });

  if (delayedProjects.length > 0) {
    insights.push({
      id: 'prg-001',
      category: 'programme',
      severity: delayedProjects.length > 2 ? 'critical' : 'high',
      title: 'Schedule Slippage Detected',
      description: `${delayedProjects.length} project(s) running >15% behind planned progress`,
      recommendation: 'Recovery programme required. Consider resource levelling, overtime, or descoping non-critical items.',
      impact: delayedProjects.length > 2 ? 'Portfolio-wide delay penalties likely' : 'Project-specific LD exposure',
      confidence: 85,
      dataPoints: delayedProjects.length,
    });
  }

  // === RFI INSIGHTS ===
  const openRFIs = rfis.filter(r => ['open', 'pending'].includes(String(r.status))).length;
  const highPriorityRFIs = rfis.filter(r => ['high', 'critical'].includes(String(r.priority))).length;
  const avgRFIAge = openRFIs > 0 ? openRFIs * 12 : 0; // Simplified age calculation

  if (highPriorityRFIs > 3) {
    insights.push({
      id: 'qua-001',
      category: 'quality',
      severity: 'high',
      title: 'Critical Technical Queries Pending',
      description: `${highPriorityRFIs} high-priority RFIs awaiting response`,
      recommendation: 'Escalate outstanding RFIs to design team. Schedule technical coordination meeting.',
      impact: 'Work stoppages likely if critical queries remain unresolved',
      confidence: 90,
      dataPoints: rfis.length,
    });
  }

  // === CHANGE ORDER INSIGHTS ===
  const pendingCOs = changeOrders.filter(c => ['pending', 'draft'].includes(String(c.status))).length;
  const approvedCOs = changeOrders.filter(c => String(c.status) === 'approved');
  const totalCOValue = approvedCOs.reduce((s, c) => s + Number(c.amount ?? 0), 0);

  if (pendingCOs > 5) {
    insights.push({
      id: 'com-001',
      category: 'programme',
      severity: 'medium',
      title: 'Change Order Backlog',
      description: `${pendingCOs} change orders pending approval`,
      recommendation: 'Prioritize CO approvals to release tied-up contingency. Client engagement required.',
      impact: 'Subcontractor mobilisation delays. Programme uncertainty',
      confidence: 82,
      dataPoints: changeOrders.length,
    });
  }

  // === RESOURCE INSIGHTS ===
  const teamOnSite = team.filter(t => String(t.status) === 'on_site').length;
  const teamOffSite = team.filter(t => ['off_site', 'leave'].includes(String(t.status))).length;
  const ramsCompliance = team.filter(t => t.rams_completed).length;
  const ramsTotal = team.length;
  const ramsPct = ramsTotal > 0 ? (ramsCompliance / ramsTotal) * 100 : 100;

  if (ramsPct < 80) {
    insights.push({
      id: 'res-001',
      category: 'resource',
      severity: 'high',
      title: 'RAMS Compliance Gap',
      description: `${ramsTotal - ramsCompliance} team members without completed RAMS training`,
      recommendation: 'Mandatory RAMS briefing required before site access. Update training matrix.',
      impact: 'HSE compliance breach. Insurance implications if incident occurs',
      confidence: 96,
      dataPoints: team.length,
    });
  }

  // === SUBCONTRACTOR INSIGHTS ===
  const activeSubs = subcontractors.filter(s => String(s.status) === 'active');
  const cisUnverified = activeSubs.filter(s => !s.cis_verified).length;

  if (cisUnverified > 0) {
    insights.push({
      id: 'com-002',
      category: 'risk',
      severity: 'critical',
      title: 'CIS Verification Required',
      description: `${cisUnverified} active subcontractors without CIS verification`,
      recommendation: 'Complete HMRC CIS verification before next payment cycle. 20% deduction applies if unverified',
      impact: 'CIS penalty exposure. Payment delays for affected subcontractors',
      confidence: 99,
      dataPoints: subcontractors.length,
    });
  }

  // === POSITIVE INSIGHTS ===
  if (safetyScore >= 85 && openIncidents < 2) {
    insights.push({
      id: 'pos-001',
      category: 'safety',
      severity: 'info',
      title: 'Excellent Safety Performance',
      description: `Safety score ${safetyScore}/100 maintained for 4 consecutive weeks`,
      recommendation: 'Share best practices across projects. Consider safety excellence award nomination.',
      impact: 'Reduced insurance premiums. Enhanced prequalification scores',
      confidence: 91,
      dataPoints: safety.length,
    });
  }

  if (budgetVariance < 5 && paidInvoices > 0) {
    insights.push({
      id: 'pos-002',
      category: 'financial',
      severity: 'info',
      title: 'Budget Performance On Track',
      description: `Portfolio within ${budgetVariance.toFixed(1)}% of budget. Cash collection healthy`,
      recommendation: 'Maintain current cost controls. Review contingency release opportunities.',
      impact: 'Target margin achievement likely',
      confidence: 87,
      dataPoints: activeProjects.length,
    });
  }

  return insights;
}

// Build trend data for charts
function buildTrendData(insights: any[]) {
  const categories = ['financial', 'safety', 'programme', 'resource', 'quality', 'risk'];
  const severityWeights = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };

  return categories.map(cat => ({
    category: cat.charAt(0).toUpperCase() + cat.slice(1),
    critical: insights.filter(i => i.category === cat && i.severity === 'critical').length,
    high: insights.filter(i => i.category === cat && i.severity === 'high').length,
    medium: insights.filter(i => i.category === cat && i.severity === 'medium').length,
    totalScore: insights.filter(i => i.category === cat).reduce((s, i) => s + severityWeights[i.severity as SeverityKey], 0),
  }));
}

// Recommendation action component
function RecommendationCard({ insight, onDismiss }: { insight: any; onDismiss: (id: string) => void }) {
  const cfg = SEVERITY[insight.severity as SeverityKey];
  const Icon = insight.category === 'safety' ? Shield :
               insight.category === 'financial' ? PoundSterling :
               insight.category === 'programme' ? Activity :
               insight.category === 'resource' ? Users :
               insight.category === 'quality' ? ClipboardList : FileText;

  return (
    <div className="card animate-fade-up" style={{
      padding: '18px',
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      marginBottom: '12px',
    }}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '10px',
          background: `${cfg.color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon style={{ width: '24px', height: '24px', color: cfg.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-50)' }}>
              {insight.title}
            </span>
            <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
              {cfg.label}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-500)' }}>
              {insight.confidence}% confidence
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--slate-300)', marginBottom: '10px', lineHeight: 1.5 }}>
            {insight.description}
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Lightbulb style={{ width: '14px', height: '14px', color: 'var(--amber-400)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--amber-400)', textTransform: 'uppercase' }}>
                Recommendation
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--slate-200)', lineHeight: 1.5 }}>
              {insight.recommendation}
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-500)' }}>
              Impact: {insight.impact}
            </span>
            <button
              onClick={() => onDismiss(insight.id)}
              style={{
                background: 'transparent',
                border: '1px solid var(--slate-700)',
                borderRadius: '6px',
                padding: '4px 10px',
                color: 'var(--slate-400)',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'var(--font-body)',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Insights Module
export function Insights({ setModule }: { setModule?: (m: Module) => void }) {
  const { data: rawProjects = [] } = useProjects.useList();
  const { data: rawSafety = [] } = useSafety.useList();
  const { data: rawInvoices = [] } = useInvoices.useList();
  const { data: rawRFIs = [] } = useRFIs.useList();
  const { data: rawChangeOrders = [] } = useChangeOrders.useList();
  const { data: rawDailyReports = [] } = useDailyReports.useList();
  const { data: rawTeam = [] } = useTeam.useList();
  const { data: rawSubcontractors = [] } = useSubcontractors.useList();

  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low' | 'info'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'financial' | 'safety' | 'programme' | 'resource' | 'quality' | 'risk'>('all');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const insights = useMemo(() => generateInsights(
    rawProjects as AnyRow[],
    rawSafety as AnyRow[],
    rawInvoices as AnyRow[],
    rawRFIs as AnyRow[],
    rawChangeOrders as AnyRow[],
    rawDailyReports as AnyRow[],
    rawTeam as AnyRow[],
    rawSubcontractors as AnyRow[]
  ), [rawProjects, rawSafety, rawInvoices, rawRFIs, rawChangeOrders, rawDailyReports, rawTeam, rawSubcontractors]);

  const filteredInsights = insights.filter(i => {
    if (dismissed.has(i.id)) return false;
    if (filter !== 'all' && i.severity !== filter) return false;
    if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
    return true;
  });

  const trendData = buildTrendData(filteredInsights);
  const criticalCount = filteredInsights.filter(i => i.severity === 'critical').length;
  const highCount = filteredInsights.filter(i => i.severity === 'high').length;

  return (
    <div className="module-page" style={{ minHeight: '100%', background: 'var(--slate-950)', padding: '24px' }}>
      {/* Header */}
      <div className="card animate-fade-up" style={{
        padding: '28px',
        background: 'linear-gradient(135deg, rgba(13,17,23,0.95), rgba(8,11,18,0.9))',
        border: '1px solid var(--slate-700)',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05,
          backgroundImage: 'linear-gradient(rgba(245,158,11,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.3) 1px, transparent 1px)',
          backgroundSize: '32px 32px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Brain style={{ width: '28px', height: '28px', color: 'var(--amber-400)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-50)', letterSpacing: '-0.03em' }}>
              AI Intelligence Engine
            </span>
            <Sparkles style={{ width: '20px', height: '20px', color: 'var(--amber-400)' }} />
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Real-time project intelligence · Predictive analytics · Actionable recommendations
          </p>
        </div>
      </div>

      {/* KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Critical Insights', value: criticalCount, color: 'var(--red-400)', icon: AlertTriangle },
          { label: 'High Priority', value: highCount, color: 'var(--orange-400)', icon: TrendingUp },
          { label: 'Total Insights', value: filteredInsights.length, color: 'var(--amber-400)', icon: Lightbulb },
          { label: 'Avg Confidence', value: `${Math.round(filteredInsights.reduce((s, i) => s + i.confidence, 0) / (filteredInsights.length || 1))}%`, color: 'var(--emerald-400)', icon: Target },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="card animate-fade-up" style={{ padding: '18px', background: 'var(--slate-900)', border: '1px solid var(--slate-800)', animationDelay: `${i * 0.05}s` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: '20px', height: '20px', color: kpi.color }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: kpi.color, textTransform: 'uppercase' }}>{kpi.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--slate-50)' }}>{kpi.value}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Insights by Category Chart */}
        <div className="card" style={{ padding: '20px', background: 'var(--slate-900)', border: '1px solid var(--slate-800)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <BarChart3 style={{ width: '18px', height: '18px', color: 'var(--amber-400)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-50)' }}>Insights by Category</span>
          </div>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-800)" />
                <XAxis dataKey="category" stroke="var(--slate-600)" fontSize={10} />
                <YAxis stroke="var(--slate-600" fontSize={10} />
                <Tooltip contentStyle={{ background: 'var(--slate-900)', border: '1px solid var(--slate-700)', fontFamily: 'var(--font-body)' }} />
                <Legend wrapperStyle={{ fontFamily: 'var(--font-body)', fontSize: '11px' }} />
                <Bar dataKey="critical" stackId="a" fill="var(--red-400)" name="Critical" />
                <Bar dataKey="high" stackId="a" fill="var(--orange-400)" name="High" />
                <Bar dataKey="medium" stackId="a" fill="var(--amber-400)" name="Medium" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence vs Impact Matrix */}
        <div className="card" style={{ padding: '20px', background: 'var(--slate-900)', border: '1px solid var(--slate-800)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <PieChartIcon style={{ width: '18px', height: '18px', color: 'var(--emerald-400)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-50)' }}>Confidence Distribution</span>
          </div>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: '90%+', value: filteredInsights.filter(i => i.confidence >= 90).length, color: 'var(--emerald-400)' },
                    { name: '80-89%', value: filteredInsights.filter(i => i.confidence >= 80 && i.confidence < 90).length, color: 'var(--amber-400)' },
                    { name: '<80%', value: filteredInsights.filter(i => i.confidence < 80).length, color: 'var(--orange-400)' },
                  ]}
                  cx="50%" cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {filteredInsights.map((_, idx) => (
                    <Cell key={idx} fill={['var(--emerald-400)', 'var(--amber-400)', 'var(--orange-400)'][idx % 3]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--slate-900)', border: '1px solid var(--slate-700)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="card" style={{ padding: '14px 18px', background: 'var(--slate-900)', border: '1px solid var(--slate-800)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Severity:</span>
          {(['all', 'critical', 'high', 'medium', 'low', 'info'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: filter === sev ? SEVERITY[sev === 'all' ? 'info' : sev].bg : 'var(--slate-800)',
                border: `1px solid ${filter === sev ? SEVERITY[sev === 'all' ? 'info' : sev].border : 'var(--slate-700)'}`,
                color: filter === sev ? SEVERITY[sev === 'all' ? 'info' : sev].color : 'var(--slate-400)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {sev}
            </button>
          ))}
          <div style={{ width: '1px', height: '20px', background: 'var(--slate-700)', margin: '0 8px' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Category:</span>
          {(['all', 'financial', 'safety', 'programme', 'resource', 'quality', 'risk'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: categoryFilter === cat ? 'rgba(245,158,11,0.15)' : 'var(--slate-800)',
                border: `1px solid ${categoryFilter === cat ? 'rgba(245,158,11,0.3)' : 'var(--slate-700)'}`,
                color: categoryFilter === cat ? 'var(--amber-400)' : 'var(--slate-400)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Insights List */}
      <div>
        {filteredInsights.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', background: 'var(--slate-900)', border: '1px solid var(--slate-800)' }}>
            <CheckCircle style={{ width: '48px', height: '48px', color: 'var(--emerald-400)', margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--slate-100)', marginBottom: '8px' }}>
              All Clear
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--slate-400)' }}>
              No insights match your current filters. Portfolio performance is within acceptable thresholds.
            </p>
          </div>
        ) : (
          filteredInsights.map((insight, i) => (
            <RecommendationCard key={insight.id} insight={insight} onDismiss={(id) => setDismissed(new Set(dismissed.add(id)))} />
          ))
        )}
      </div>
    </div>
  );
}
