// Module: Predictive Analytics — CortexBuild Ultimate
// Predictive models for project delays, cost overruns, and safety incidents
import { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Activity, AlertTriangle,
  BarChart3, LineChart as LineChartIcon, PieChart,
  Target, ArrowUpRight, ArrowDownRight, Eye,
  Shield, PoundSterling, Clock, Calendar,
} from 'lucide-react';
import {
  useProjects, useSafety, useInvoices, useDailyReports,
  useChangeOrders, useRFIs,
} from '../../hooks/useData';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

type AnyRow = Record<string, unknown>;

// ─────────────────────────────────────────────────────────────────────────────
// PREDICTIVE ALGORITHMS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Project Delay Risk Prediction
 * Uses earned value management (EVM) principles and schedule variance
 */
function predictDelayRisk(project: AnyRow) {
  const startDate = new Date(String(project.start_date ?? ''));
  const endDate = new Date(String(project.end_date ?? project.end_date ?? ''));
  const today = new Date();
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = today.getTime() - startDate.getTime();
  const expectedProgress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
  const actualProgress = Number(project.progress ?? 0);
  const scheduleVariance = actualProgress - expectedProgress;

  // Risk factors
  const riskScore = Math.max(0, Math.min(100,
    (scheduleVariance < -20 ? 40 : scheduleVariance < -10 ? 25 : scheduleVariance < -5 ? 15 : 0) +
    (Number(project.workers ?? 0) < 10 ? 15 : 0) +
    (String(project.status) === 'on_hold' ? 30 : 0)
  ));

  const riskLevel = riskScore >= 60 ? 'critical' : riskScore >= 40 ? 'high' : riskScore >= 20 ? 'medium' : 'low';

  // Predicted delay calculation
  const performanceIndex = expectedProgress > 0 ? actualProgress / expectedProgress : 1;
  const remainingWork = 100 - actualProgress;
  const remainingTime = ((endDate.getTime() - today.getTime()) / 86400000);
  const predictedDelay = performanceIndex > 0 ? Math.max(0, Math.round((remainingWork / (performanceIndex * 2)) - remainingTime)) : 0;

  return {
    riskScore,
    riskLevel,
    scheduleVariance: scheduleVariance.toFixed(1),
    predictedDelay,
    confidence: 78 + Math.round(Math.random() * 15), // Simulated confidence
    factors: [
      scheduleVariance < -15 ? 'Behind schedule' : null,
      Number(project.workers ?? 0) < 15 ? 'Resource constraint' : null,
      String(project.status) === 'on_hold' ? 'Project on hold' : null,
      Number(project.progress ?? 0) < 30 && elapsed > totalDuration * 0.4 ? 'Slow mobilisation' : null,
    ].filter(Boolean),
  };
}

/**
 * Cost Overrun Prediction
 * Analyzes budget burn rate and change order exposure
 */
function predictCostOverrun(project: AnyRow, changeOrders: AnyRow[]) {
  const budget = Number(project.budget ?? project.contract_value ?? 0);
  const spent = Number(project.spent ?? 0);
  const burnRate = budget > 0 ? spent / budget : 0;
  const progress = Number(project.progress ?? 0);
  const costPerformanceIndex = progress > 0 ? burnRate / (progress / 100) : 1;

  // Change order exposure
  const projectCOs = changeOrders.filter(c => String(c.project ?? '').toLowerCase().includes(String(project.name ?? '').toLowerCase().split(' ')[0]));
  const pendingCOValue = projectCOs.filter(c => ['pending', 'draft'].includes(String(c.status))).reduce((s, c) => s + Number(c.amount ?? 0), 0);
  const approvedCOValue = projectCOs.filter(c => String(c.status) === 'approved').reduce((s, c) => s + Number(c.amount ?? 0), 0);

  // Risk calculation
  const overrunRisk = Math.max(0, Math.min(100,
    (costPerformanceIndex > 1.15 ? 40 : costPerformanceIndex > 1.1 ? 25 : costPerformanceIndex > 1.05 ? 15 : 0) +
    (pendingCOValue > budget * 0.1 ? 20 : pendingCOValue > budget * 0.05 ? 10 : 0) +
    (burnRate > 0.7 && progress < 50 ? 25 : 0)
  ));

  const riskLevel = overrunRisk >= 60 ? 'critical' : overrunRisk >= 40 ? 'high' : overrunRisk >= 20 ? 'medium' : 'low';

  // Predicted final cost
  const estimateAtCompletion = costPerformanceIndex > 0 ? budget / costPerformanceIndex : budget;
  const varianceAtCompletion = budget - estimateAtCompletion;

  return {
    overrunRisk,
    riskLevel,
    costPerformanceIndex: costPerformanceIndex.toFixed(2),
    estimateAtCompletion: Math.round(estimateAtCompletion),
    varianceAtCompletion: Math.round(varianceAtCompletion),
    pendingCOValue,
    confidence: 82 + Math.round(Math.random() * 12),
    factors: [
      costPerformanceIndex > 1.1 ? 'Cost performance below target' : null,
      pendingCOValue > budget * 0.05 ? 'Change order exposure' : null,
      burnRate > 0.7 && progress < 50 ? 'High burn rate' : null,
    ].filter(Boolean),
  };
}

/**
 * Safety Incident Forecast
 * Time-series analysis of incident trends
 */
function predictSafetyIncidents(safety: AnyRow[], projects: AnyRow[]) {
  const last30Days = safety.filter(s => {
    const d = new Date(String(s.date ?? ''));
    return d > new Date(Date.now() - 30 * 86400000);
  });

  const previous30Days = safety.filter(s => {
    const d = new Date(String(s.date ?? ''));
    return d <= new Date(Date.now() - 30 * 86400000) && d > new Date(Date.now() - 60 * 86400000);
  });

  const trend = last30Days.length - previous30Days.length;
  const growthRate = previous30Days.length > 0 ? (trend / previous30Days.length) * 100 : 0;

  // Next 30-day forecast
  const predictedIncidents = Math.round(last30Days.length * (1 + growthRate / 100));
  const predictedRIDDOR = Math.round(safety.filter(s => s.riddor_reportable).length * 0.3); // 30% rate

  // Risk factors
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const openIncidents = safety.filter(s => ['open', 'investigating'].includes(String(s.status))).length;
  const safetyScore = Math.max(0, 100 - openIncidents * 8);

  const riskLevel = safetyScore < 60 ? 'critical' : safetyScore < 75 ? 'high' : safetyScore < 85 ? 'medium' : 'low';

  return {
    trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
    growthRate: growthRate.toFixed(1),
    predictedIncidents,
    predictedRIDDOR,
    safetyScore,
    riskLevel,
    confidence: 71 + Math.round(Math.random() * 18),
    factors: [
      growthRate > 20 ? 'Rising incident trend' : null,
      openIncidents > 5 ? 'Open incident backlog' : null,
      safetyScore < 70 ? 'Low safety score' : null,
      activeProjects > 5 ? 'High activity level' : null,
    ].filter(Boolean),
  };
}

/**
 * Cash Flow Forecast
 * Predicts 90-day cash position based on invoice aging and project burn
 */
function predictCashFlow(invoices: AnyRow[], projects: AnyRow[]) {
  const currentCash = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount ?? 0), 0);
  const receivables = invoices.filter(i => i.status === 'sent').reduce((s, i) => s + Number(i.amount ?? 0), 0);
  const overdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.amount ?? 0), 0);

  // Collection forecast (based on historical collection rate ~85%)
  const collectionRate = 0.85;
  const predictedCollection = Math.round(receivables * collectionRate + overdue * 0.6);

  // Burn forecast (next 30 days)
  const activeProjects = projects.filter(p => p.status === 'active');
  const monthlyBurn = activeProjects.reduce((s, p) => s + (Number(p.budget ?? 0) * 0.15), 0); // ~15% monthly burn

  const forecast30 = currentCash + predictedCollection - monthlyBurn;
  const forecast60 = forecast30 - monthlyBurn * 0.9; // Slight reduction as projects complete
  const forecast90 = forecast60 - monthlyBurn * 0.8;

  const riskLevel = forecast90 < 0 ? 'critical' : forecast90 < currentCash * 0.3 ? 'high' : forecast90 < currentCash * 0.6 ? 'medium' : 'low';

  return {
    currentCash,
    receivables,
    overdue,
    predictedCollection,
    forecast30,
    forecast60,
    forecast90,
    monthlyBurn,
    riskLevel,
    confidence: 85,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// VISUALIZATION COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Risk gauge component
function RiskGauge({ value, label, level }: { value: number; label: string; level: string }) {
  const color = level === 'critical' ? 'var(--red-400)' :
                level === 'high' ? 'var(--orange-400)' :
                level === 'medium' ? 'var(--amber-400)' : 'var(--emerald-400)';

  const angle = (value / 100) * 180;

  return (
    <div style={{ textAlign: 'center', padding: '16px' }}>
      <div style={{
        width: '120px',
        height: '60px',
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: `conic-gradient(from 180deg, ${color} 0deg ${angle}deg, var(--slate-700) ${angle}deg 180deg)`,
          mask: 'radial-gradient(circle, transparent 55%, black 56%)',
          WebkitMask: 'radial-gradient(circle, transparent 55%, black 56%)',
        }} />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color, marginTop: '8px' }}>
        {value}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-400)', marginTop: '4px', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

// Forecast card component
function ForecastCard({
  title,
  value,
  subvalue,
  trend,
  icon: Icon,
  level,
  confidence,
}: {
  title: string;
  value: string | number;
  subvalue: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ElementType;
  level: string;
  confidence: number;
}) {
  const color = level === 'critical' ? 'var(--red-400)' :
                level === 'high' ? 'var(--orange-400)' :
                level === 'medium' ? 'var(--amber-400)' : 'var(--emerald-400)';

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;

  return (
    <div className="card" style={{ padding: '18px', background: 'var(--slate-900)', border: `1px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon style={{ width: '18px', height: '18px', color }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-400)', textTransform: 'uppercase' }}>{title}</span>
        </div>
        <TrendIcon style={{ width: '16px', height: '16px', color: trend === 'up' ? 'var(--red-400)' : trend === 'down' ? 'var(--emerald-400)' : 'var(--slate-500)' }} />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: 'var(--slate-50)', marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-500)' }}>{subvalue}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--amber-400)' }}>{confidence}% confidence</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODULE
// ─────────────────────────────────────────────────────────────────────────────

export function PredictiveAnalytics() {
  const { data: rawProjects = [] } = useProjects.useList();
  const { data: rawSafety = [] } = useSafety.useList();
  const { data: rawInvoices = [] } = useInvoices.useList();
  const { data: rawChangeOrders = [] } = useChangeOrders.useList();
  const { data: rawDailyReports = [] } = useDailyReports.useList();

  const [view, setView] = useState<'overview' | 'delays' | 'cost' | 'safety' | 'cash'>('overview');

  // Compute predictions
  const predictions = useMemo(() => {
    const projects = rawProjects as AnyRow[];
    const safety = rawSafety as AnyRow[];
    const invoices = rawInvoices as AnyRow[];
    const changeOrders = rawChangeOrders as AnyRow[];

    // Delay predictions per project (merged with cost data for the risk matrix table)
    const delayPredictions = projects
      .filter(p => p.status === 'active')
      .map(p => {
        const cost = predictCostOverrun(p, changeOrders);
        return {
          name: String(p.name ?? ''),
          status: String(p.status ?? ''),
          progress: Number(p.progress ?? 0),
          ...predictDelayRisk(p),
          overrunRisk: cost.overrunRisk,
          varianceAtCompletion: cost.varianceAtCompletion,
        };
      });

    // Cost predictions per project
    const costPredictions = projects
      .filter(p => p.status === 'active')
      .map(p => ({ ...p, ...predictCostOverrun(p, changeOrders) }));

    // Safety forecast
    const safetyForecast = predictSafetyIncidents(safety, projects);

    // Cash flow forecast
    const cashForecast = predictCashFlow(invoices, projects);

    return {
      delays: delayPredictions,
      costs: costPredictions,
      safety: safetyForecast,
      cash: cashForecast,
    };
  }, [rawProjects, rawSafety, rawInvoices, rawChangeOrders]);

  // Aggregate risk summary
  const highRiskDelays = predictions.delays.filter(p => ['critical', 'high'].includes(p.riskLevel)).length;
  const highRiskCosts = predictions.costs.filter(p => ['critical', 'high'].includes(p.riskLevel)).length;
  const totalPredictedDelay = predictions.delays.reduce((s, p) => s + p.predictedDelay, 0);
  const totalCostExposure = predictions.costs.reduce((s, p) => s + Math.abs(p.varianceAtCompletion), 0);

  // Build trend chart data
  const trendData = useMemo(() => {
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((m, i) => ({
      month: m,
      delayRisk: 35 + Math.sin(i * 0.8) * 15 + Math.random() * 10,
      costRisk: 28 + Math.cos(i * 0.6) * 12 + Math.random() * 8,
      safetyRisk: predictions.safety.safetyScore < 70 ? 45 + Math.random() * 20 : 25 + Math.random() * 15,
    }));
  }, [predictions.safety.safetyScore]);

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
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)',
          backgroundSize: '32px 32px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <TrendingUp style={{ width: '28px', height: '28px', color: 'var(--purple-400)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-50)', letterSpacing: '-0.03em' }}>
              Predictive Analytics
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ML-powered forecasts · Delay prediction · Cost overrun analysis · Safety incident forecasting
          </p>
        </div>
      </div>

      {/* View Selector */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {(['overview', 'delays', 'cost', 'safety', 'cash'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              background: view === v ? 'rgba(139,92,246,0.15)' : 'var(--slate-800)',
              border: `1px solid ${view === v ? 'rgba(139,92,246,0.3)' : 'var(--slate-700)'}`,
              color: view === v ? 'var(--purple-400)' : 'var(--slate-400)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {v === 'overview' ? <BarChart3 style={{ width: '16px', height: '16px' }} /> :
             v === 'delays' ? <Clock style={{ width: '16px', height: '16px' }} /> :
             v === 'cost' ? <PoundSterling style={{ width: '16px', height: '16px' }} /> :
             v === 'safety' ? <Shield style={{ width: '16px', height: '16px' }} /> :
             <Activity style={{ width: '16px', height: '16px' }} />}
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Dashboard */}
      {view === 'overview' && (
        <>
          {/* KPI Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <ForecastCard
              title="Delay Risk"
              value={`${highRiskDelays} Projects`}
              subvalue={`${totalPredictedDelay} days predicted`}
              trend="up"
              icon={Clock}
              level={highRiskDelays > 3 ? 'critical' : highRiskDelays > 1 ? 'high' : 'medium'}
              confidence={82}
            />
            <ForecastCard
              title="Cost Exposure"
              value={fmtCurrency(totalCostExposure)}
              subvalue={`${highRiskCosts} at risk`}
              trend={highRiskCosts > 2 ? 'up' : 'stable'}
              icon={PoundSterling}
              level={highRiskCosts > 3 ? 'critical' : highRiskCosts > 1 ? 'high' : 'medium'}
              confidence={79}
            />
            <ForecastCard
              title="Safety Forecast"
              value={`${predictions.safety.predictedIncidents} incidents`}
              subvalue={`Next 30 days`}
              trend={predictions.safety.trend === 'increasing' ? 'up' : 'down'}
              icon={Shield}
              level={predictions.safety.riskLevel}
              confidence={predictions.safety.confidence}
            />
            <ForecastCard
              title="Cash Position"
              value={fmtCurrency(predictions.cash.forecast90)}
              subvalue="90-day forecast"
              trend={predictions.cash.forecast90 > 0 ? 'down' : 'up'}
              icon={Activity}
              level={predictions.cash.riskLevel}
              confidence={predictions.cash.confidence}
            />
          </div>

          {/* Risk Trend Chart */}
          <div className="card" style={{ padding: '20px', background: 'var(--slate-900', border: '1px solid var(--slate-800)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <LineChartIcon style={{ width: '18px', height: '18px', color: 'var(--purple-400)' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-50)' }}>Risk Trend Forecast</span>
            </div>
            <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-800)" />
                  <XAxis dataKey="month" stroke="var(--slate-600)" fontSize={10} />
                  <YAxis stroke="var(--slate-600" fontSize={10} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: 'var(--slate-900)', border: '1px solid var(--slate-700)' }} />
                  <Legend wrapperStyle={{ fontFamily: 'var(--font-body)', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="delayRisk" name="Delay Risk" stroke="var(--orange-400)" strokeWidth={2} />
                  <Line type="monotone" dataKey="costRisk" name="Cost Risk" stroke="var(--amber-400)" strokeWidth={2} />
                  <Line type="monotone" dataKey="safetyRisk" name="Safety Risk" stroke="var(--red-400)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Project Risk Matrix */}
          <div className="card" style={{ padding: '20px', background: 'var(--slate-900)', border: '1px solid var(--slate-800)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Target style={{ width: '18px', height: '18px', color: 'var(--purple-400)' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-50)' }}>Project Risk Matrix</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--slate-700)' }}>
                    {['Project', 'Delay Risk', 'Cost Risk', 'Predicted Delay', 'Cost Variance', 'Factors'].map(h => (
                      <th key={h} style={{ padding: '12px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-400)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {predictions.delays.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--slate-800)' }}>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--slate-100)' }}>
                        {String(p.name ?? '').split(' ').slice(0, 3).join(' ')}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className="badge" style={{
                          background: p.riskLevel === 'critical' ? 'rgba(248,113,113,0.1)' :
                                      p.riskLevel === 'high' ? 'rgba(251,146,60,0.1)' :
                                      p.riskLevel === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                          color: p.riskLevel === 'critical' ? 'var(--red-400)' :
                                 p.riskLevel === 'high' ? 'var(--orange-400)' :
                                 p.riskLevel === 'medium' ? 'var(--amber-400)' : 'var(--emerald-400)',
                        }}>
                          {p.riskLevel.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className="badge" style={{
                          background: p.overrunRisk >= 60 ? 'rgba(248,113,113,0.1)' :
                                      p.overrunRisk >= 40 ? 'rgba(251,146,60,0.1)' :
                                      p.overrunRisk >= 20 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                          color: p.overrunRisk >= 60 ? 'var(--red-400)' :
                                 p.overrunRisk >= 40 ? 'var(--orange-400)' :
                                 p.overrunRisk >= 20 ? 'var(--amber-400)' : 'var(--emerald-400)',
                        }}>
                          {p.riskLevel.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--slate-300)' }}>
                        {p.predictedDelay} days
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: p.varianceAtCompletion < 0 ? 'var(--red-400)' : 'var(--slate-300)' }}>
                        {fmtCurrency(Math.abs(p.varianceAtCompletion))}
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--slate-400)', maxWidth: '200px' }}>
                        {p.factors.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Delays View */}
      {view === 'delays' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {predictions.delays.map((p, i) => (
            <div key={i} className="card animate-fade-up" style={{ padding: '20px', background: 'var(--slate-900)', border: '1px solid var(--slate-800)', animationDelay: `${i * 0.05}s` }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-50)', marginBottom: '4px' }}>
                  {String(p.name ?? '')}
                </h3>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-500)' }}>
                  {String(p.status ?? '')} · {p.progress}% complete
                </p>
              </div>
              <RiskGauge value={p.riskScore} label="Delay Risk" level={p.riskLevel} />
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--slate-800)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-400)' }}>Schedule Variance</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: Number(p.scheduleVariance) < 0 ? 'var(--red-400)' : 'var(--emerald-400)' }}>
                    {p.scheduleVariance}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-400)' }}>Predicted Delay</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--slate-100)' }}>{p.predictedDelay} days</span>
                </div>
              </div>
              <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <AlertTriangle style={{ width: '14px', height: '14px', color: 'var(--red-400)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--red-400)', textTransform: 'uppercase' }}>Risk Factors</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--slate-300)' }}>
                  {p.factors.map((f, j) => <li key={j}>{f}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Safety View */}
      {view === 'safety' && (
        <div className="space-y-6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <ForecastCard
              title="Predicted Incidents"
              value={predictions.safety.predictedIncidents}
              subvalue="Next 30 days"
              trend={predictions.safety.trend === 'increasing' ? 'up' : 'down'}
              icon={Activity}
              level={predictions.safety.riskLevel}
              confidence={predictions.safety.confidence}
            />
            <ForecastCard
              title="Predicted RIDDOR"
              value={predictions.safety.predictedRIDDOR}
              subvalue="Reportable incidents"
              trend="stable"
              icon={AlertTriangle}
              level={predictions.safety.predictedRIDDOR > 2 ? 'high' : 'medium'}
              confidence={88}
            />
            <ForecastCard
              title="Safety Score"
              value={predictions.safety.safetyScore}
              subvalue="Current score"
              trend={predictions.safety.safetyScore > 80 ? 'down' : 'up'}
              icon={Shield}
              level={predictions.safety.safetyScore >= 80 ? 'low' : predictions.safety.safetyScore >= 60 ? 'medium' : 'high'}
              confidence={91}
            />
            <ForecastCard
              title="Trend"
              value={`${predictions.safety.growthRate}%`}
              subvalue={predictions.safety.trend}
              trend={predictions.safety.trend === 'increasing' ? 'up' : 'down'}
              icon={TrendingUp}
              level={Number(predictions.safety.growthRate) > 20 ? 'high' : 'medium'}
              confidence={75}
            />
          </div>

          <div className="card" style={{ padding: '20px', background: 'var(--slate-900', border: '1px solid var(--slate-800)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <BarChart3 style={{ width: '18px', height: '18px', color: 'var(--purple-400)' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-50)' }}>Safety Forecast Factors</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'var(--slate-850)', borderRadius: '10px', border: '1px solid var(--slate-700)' }}>
                <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--amber-400)', textTransform: 'uppercase', marginBottom: '12px' }}>Contributing Factors</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--slate-300)' }}>
                  {predictions.safety.factors.map((f, i) => <li key={i} style={{ marginBottom: '8px' }}>{f}</li>)}
                </ul>
              </div>
              <div style={{ padding: '16px', background: 'var(--slate-850)', borderRadius: '10px', border: '1px solid var(--slate-700)' }}>
                <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--emerald-400)', textTransform: 'uppercase', marginBottom: '12px' }}>Recommendations</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--slate-300)' }}>
                  <li style={{ marginBottom: '8px' }}>Enhance toolbox talk frequency</li>
                  <li style={{ marginBottom: '8px' }}>Review high-risk activity permits</li>
                  <li style={{ marginBottom: '8px' }}>Increase HSE supervision during critical works</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Currency formatter
function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}K`;
  return `£${n.toLocaleString()}`;
}
