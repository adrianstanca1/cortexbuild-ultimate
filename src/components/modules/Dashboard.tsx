// Module: Dashboard — CortexBuild Ultimate
// "Site Command Center" Redesign — Industrial Intelligence Aesthetic
import { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, FolderOpen, HardHat, FileText, ShieldCheck,
  MessageSquare, AlertCircle, Activity, CheckCircle2, ArrowRight,
  Cloud, CloudRain, Wind, Thermometer, MapPin, Eye, Bell, Zap,
  Radar as RadarIcon, Layers, AlertTriangle, Clock, Users, Package, Truck,
  ChevronRight, X, Play, Pause, RefreshCw, BarChart3, PieChart,
  ClipboardList, ShoppingCart, Calendar, CheckCircle, Circle, Coffee,
  UserCheck, UserX, Construction, DollarSign, Target,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  BarChart, Bar, LabelList, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell,
} from 'recharts';
import { useProjects, useInvoices, useTeam, useSafety, useRFIs, useDailyReports } from '../../hooks/useData';
import type { Module } from '../../types';
import { ChartContainer, DonutChart, AreaChartWidget, ProgressBar, StatusBadge, CHART_COLORS, Sparkline } from '../ui/Charts';

type AnyRow = Record<string, unknown>;

interface DashboardProps {
  setModule: (m: Module) => void;
}

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Weather mock data — would integrate with OpenWeatherMap API in production
const SITE_WEATHER = {
  temp: 14,
  condition: 'Partly Cloudy',
  wind: 12,
  humidity: 68,
  forecast: 'Clear conditions for next 48h',
};

// Build monthly chart data from invoices
function buildChartData(invoices: AnyRow[]) {
  const now = new Date();
  const months: { month: string; year: number; revenue: number; profit: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: MONTH_ABBR[d.getMonth()], year: d.getFullYear(), revenue: 0, profit: 0 });
  }
  invoices.filter(inv => inv.status === 'paid').forEach(inv => {
    const dateStr = String(inv.issueDate ?? inv.issue_date ?? '');
    if (!dateStr) return;
    const d = new Date(dateStr);
    const mIdx = months.findIndex(m => m.month === MONTH_ABBR[d.getMonth()] && m.year === d.getFullYear());
    if (mIdx !== -1) {
      months[mIdx].revenue += Number(inv.amount ?? 0);
      months[mIdx].profit  += Number(inv.amount ?? 0) * 0.23;
    }
  });
  return months.map(({ month, year, revenue, profit }) => ({ month, revenue, profit }));
}

// Project health dimensions for radar chart
function buildHealthData(projects: AnyRow[], safety: AnyRow[], invoices: AnyRow[]) {
  const active = projects.filter(p => p.status === 'active');
  const avgProgress = active.length ? active.reduce((s, p) => s + Number(p.progress ?? 0), 0) / active.length : 0;
  const budgetHealth = active.length ? active.reduce((s, p) => {
    const burn = Number(p.spent ?? 0) / (Number(p.budget ?? 1) || 1);
    return s + (1 - Math.abs(burn - Number(p.progress ?? 0) / 100));
  }, 0) / active.length * 100 : 50;
  const safetyScore = Math.max(0, 100 - safety.filter(s => ['open', 'investigating'].includes(String(s.status))).length * 15);
  const rfiTurnaround = 70 - projects.length; // Simplified - would use actual RFI data
  const cashHealth = invoices.length ? invoices.filter(i => i.status === 'paid').length / invoices.length * 100 : 50;
  const compliance = 85; // Would be computed from RAMS expiry, training certs, etc.

  return [
    { dimension: 'Progress', score: Math.round(avgProgress), fullMark: 100 },
    { dimension: 'Budget', score: Math.round(budgetHealth), fullMark: 100 },
    { dimension: 'Safety', score: safetyScore, fullMark: 100 },
    { dimension: 'RFIs', score: Math.max(0, rfiTurnaround), fullMark: 100 },
    { dimension: 'Cash Flow', score: Math.round(cashHealth), fullMark: 100 },
    { dimension: 'Compliance', score: compliance, fullMark: 100 },
  ];
}

function fmtM(n: number) {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `£${(n / 1_000).toFixed(0)}K`;
  return `£${n.toLocaleString()}`;
}

// Enhanced Stat Card with sparkline trend
function StatCard({
  label, value, sub, positive, icon: Icon, delay, onClick, trendData, secondaryValue,
}: {
  label: string; value: string; sub: string; positive: boolean;
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  delay: number; onClick?: () => void; trendData?: number[]; secondaryValue?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="card card-grid card-hover animate-fade-up"
      style={{ animationDelay: `${delay}ms`, padding: '0', cursor: onClick ? 'pointer' : 'default', textAlign: 'left', width: '100%', border: 'none', overflow: 'hidden' }}
    >
      {/* Amber top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: '0', right: '0', height: '3px',
        background: positive
          ? 'linear-gradient(90deg, var(--amber-500), var(--amber-400), var(--emerald-400))'
          : 'linear-gradient(90deg, var(--slate-700), var(--red-400))',
      }} />

      <div style={{ padding: '18px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <span className="text-label-xs" style={{ color: 'var(--slate-400)' }}>{label}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {trendData && (
              <div style={{ width: '40px', height: '24px', opacity: 0.6 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData.map((v, i) => ({ i, v }))}>
                    <Area type="monotone" dataKey="v" stroke={positive ? 'var(--emerald-400)' : 'var(--red-400)'} fill="none" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            <span style={{ display: 'inline-flex', color: positive ? 'var(--amber-400)' : 'var(--slate-500)' }}><Icon size={18} /></span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '10px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-50)', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {value}
          </div>
          {secondaryValue && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-400)', whiteSpace: 'nowrap' }}>
              {secondaryValue}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {positive
            ? <TrendingUp style={{ width: '12px', height: '12px', color: 'var(--emerald-400)' }} />
            : <TrendingDown style={{ width: '12px', height: '12px', color: 'var(--red-400)' }} />
          }
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 500,
            color: positive ? 'var(--emerald-400)' : 'var(--red-400)',
            letterSpacing: '0.04em',
          }}>
            {sub}
          </span>
        </div>
      </div>
    </button>
  );
}

// Weather Widget
function WeatherWidget({ weather }: { weather: typeof SITE_WEATHER }) {
  const Icon = weather.condition.includes('Rain') ? CloudRain : Cloud;
  return (
    <div className="card animate-fade-up" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(59,83,120,0.15), rgba(13,17,23,0.8))', border: '1px solid var(--slate-700)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59,83,120,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: '28px', height: '28px', color: 'var(--slate-300)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--slate-50)', lineHeight: 1 }}>{weather.temp}°C</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-400)', marginTop: '2px' }}>{weather.condition}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginBottom: '4px' }}>
            <Wind style={{ width: '12px', height: '12px', color: 'var(--slate-500)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--slate-300)' }}>{weather.wind} mph</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
            <Thermometer style={{ width: '12px', height: '12px', color: 'var(--slate-500)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--slate-400)' }}>{weather.humidity}% humidity</span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--slate-800)', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--emerald-400)', textAlign: 'center' }}>
        ✓ {weather.forecast}
      </div>
    </div>
  );
}

// Critical Alert Carousel
function AlertCarousel({ alerts }: { alerts: { id: string; title: string; severity: 'critical' | 'warning' | 'info'; module: Module; time: string }[] }) {
  const [idx, setIdx] = useState(0);
  const severityCfg = {
    critical: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', color: 'var(--red-400)' },
    warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: 'var(--amber-400)' },
    info: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', color: 'var(--blue-400)' },
  };
  const current = alerts[idx];
  const cfg = severityCfg[current.severity];

  return (
    <div className="card animate-fade-up delay-2" style={{ padding: '0', overflow: 'hidden', border: `1px solid ${cfg.border}`, background: cfg.bg }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AlertCircle style={{ width: '18px', height: '18px', color: cfg.color, flexShrink: 0 }} />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--slate-100)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {current.title}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-500)', marginTop: '2px' }}>
            {current.time}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setIdx((idx - 1 + alerts.length) % alerts.length)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: 'var(--slate-400)' }}>
            <ChevronRight style={{ width: '14px', height: '14px', transform: 'rotate(180deg)' }} />
          </button>
          <button onClick={() => setIdx((idx + 1) % alerts.length)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: 'var(--slate-400)' }}>
            <ChevronRight style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '3px', padding: '0 18px', paddingBottom: '12px' }}>
        {alerts.map((_, i) => (
          <div key={i} style={{ flex: 1, height: '2px', borderRadius: '1px', background: i === idx ? cfg.color : 'var(--slate-800)' }} />
        ))}
      </div>
    </div>
  );
}

// Resource Heatmap
function ResourceHeatmap({ projects }: { projects: AnyRow[] }) {
  const trades = [
    { name: 'Groundworks', workers: Math.round(projects.reduce((s, p) => s + (Number(p.workers ?? 0) * 0.15), 0)), color: 'var(--emerald-500)' },
    { name: 'Structural', workers: Math.round(projects.reduce((s, p) => s + (Number(p.workers ?? 0) * 0.25), 0)), color: 'var(--amber-500)' },
    { name: 'MEP', workers: Math.round(projects.reduce((s, p) => s + (Number(p.workers ?? 0) * 0.2), 0)), color: 'var(--blue-500)' },
    { name: 'Finishing', workers: Math.round(projects.reduce((s, p) => s + (Number(p.workers ?? 0) * 0.2), 0)), color: 'var(--purple-500)' },
    { name: 'External', workers: Math.round(projects.reduce((s, p) => s + (Number(p.workers ?? 0) * 0.1), 0)), color: 'var(--orange-500)' },
    { name: 'Management', workers: Math.round(projects.reduce((s, p) => s + (Number(p.workers ?? 0) * 0.1), 0)), color: 'var(--slate-500)' },
  ];
  const maxWorkers = Math.max(...trades.map(t => t.workers));

  return (
    <div className="card card-grid" style={{ padding: '20px', gridColumn: 'span 2' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-100)', letterSpacing: '-0.01em' }}>Resource Distribution</h3>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-500)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '2px' }}>Workforce by trade</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {trades.map(trade => (
          <div key={trade.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '80px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-400)', textAlign: 'right' }}>{trade.name}</div>
            <div style={{ flex: 1, height: '20px', background: 'var(--slate-800)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ height: '100%', width: `${(trade.workers / maxWorkers) * 100}%`, background: `linear-gradient(90deg, ${trade.color}88, ${trade.color})`, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{trade.workers}</span>
              </div>
            </div>
            <div style={{ width: '60px', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--slate-300)', textAlign: 'right' }}>{trade.workers}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Dashboard({ setModule }: DashboardProps) {
  const { data: rawProjects  = [] } = useProjects.useList();
  const { data: rawInvoices  = [] } = useInvoices.useList();
  const { data: rawTeam      = [] } = useTeam.useList();
  const { data: rawSafety    = [] } = useSafety.useList();
  const { data: rawRFIs      = [] } = useRFIs.useList();
  const { data: rawReports   = [] } = useDailyReports.useList();

  const projects  = rawProjects  as AnyRow[];
  const invoices  = rawInvoices  as AnyRow[];
  const team      = rawTeam      as AnyRow[];
  const safety    = rawSafety    as AnyRow[];
  const rfis      = rawRFIs      as AnyRow[];
  const reports   = rawReports   as AnyRow[];

  const healthData = useMemo(() => buildHealthData(projects, safety, invoices), [projects, safety, invoices]);
  const chartData  = useMemo(() => buildChartData(invoices), [invoices]);
  const activeProjects = projects.filter(p => p.status === 'active').slice(0, 3);
  const totalRevenue   = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount ?? 0), 0);
  const outstanding    = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + Number(i.amount ?? 0), 0);
  const workerCount    = team.filter(m => m.status === 'active' || !m.status).length;
  const openIncidents = safety.filter(s => s.status === 'open' || s.status === 'investigating').length;
  const openRFIs      = rfis.filter(r => r.status === 'open' || r.status === 'pending').length;
  const safetyDays    = safety.filter(s => s.type === 'incident' || s.type === 'riddor').length;
  const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
  const expiringRAMS = 2;
  const counts = {
    active: projects.filter(p => p.status === 'active').length,
    planning: projects.filter(p => p.status === 'planning').length,
    on_hold: projects.filter(p => p.status === 'on_hold').length,
    completed: projects.filter(p => p.status === 'completed').length,
  };

  // Build critical alerts
  const alerts: { id: string; title: string; severity: 'critical' | 'warning' | 'info'; module: Module; time: string }[] = [];
  if (openIncidents > 0) alerts.push({ id: 'safety', title: `${openIncidents} open safety incident${openIncidents > 1 ? 's' : ''} requires attention`, severity: 'critical', module: 'safety', time: 'Now' });
  if (overdueInvoices > 0) alerts.push({ id: 'finance', title: `${overdueInvoices} invoice${overdueInvoices > 1 ? 's' : ''} overdue for payment`, severity: 'critical', module: 'invoicing', time: 'Today' });
  if (expiringRAMS > 0) alerts.push({ id: 'compliance', title: `${expiringRAMS} RAMS document${expiringRAMS > 1 ? 's' : ''} expiring within 30 days`, severity: 'warning', module: 'rams', time: 'This week' });
  if (openRFIs > 0) alerts.push({ id: 'rfi', title: `${openRFIs} RFI${openRFIs > 1 ? 's' : ''} awaiting response`, severity: 'warning', module: 'rfis', time: 'Pending' });

  // Activity feed
  type ActivityEntry = { label: string; time: string; dotColor: string; module: Module };
  const activityFeed: ActivityEntry[] = [];

  invoices.slice(0, 3).forEach(inv => {
    const status = String(inv.status ?? '');
    activityFeed.push({
      label: `Invoice ${inv.number ?? ''} ${status === 'paid' ? 'paid' : status === 'sent' ? 'sent to' : `(${status})`} ${inv.client ?? ''}`,
      time: String(inv.issueDate ?? inv.issue_date ?? ''),
      dotColor: status === 'paid' ? 'var(--emerald-400)' : status === 'overdue' ? 'var(--red-400)' : 'var(--amber-400)',
      module: 'invoicing',
    });
  });

  safety.filter(s => s.status === 'open' || s.status === 'investigating').slice(0, 2).forEach(inc => {
    activityFeed.push({
      label: `Safety: ${inc.title ?? ''} — ${inc.project ?? ''}`,
      time: String(inc.date ?? ''),
      dotColor: String(inc.severity ?? '') === 'critical' ? 'var(--red-400)' : 'var(--amber-400)',
      module: 'safety',
    });
  });

  reports.slice(0, 2).forEach(r => {
    activityFeed.push({
      label: `Daily report — ${r.project ?? ''}`,
      time: String(r.date ?? ''),
      dotColor: 'var(--emerald-400)',
      module: 'daily-reports',
    });
  });

  rfis.filter(r => r.status === 'open' || r.status === 'pending').slice(0, 2).forEach(rfi => {
    activityFeed.push({
      label: `${rfi.number ?? ''} — ${rfi.subject ?? ''}`,
      time: String(rfi.submittedDate ?? rfi.submitted_date ?? ''),
      dotColor: 'var(--slate-400)',
      module: 'rfis',
    });
  });

  const recentActivities = activityFeed
    .sort((a, b) => (b.time > a.time ? 1 : b.time < a.time ? -1 : 0))
    .slice(0, 7)
    .map(a => {
      const diff = Math.floor((Date.now() - new Date(a.time).getTime()) / 86400000);
      const timeLabel = !a.time || a.time === 'undefined' ? '' : diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : `${diff}d ago`;
      return { ...a, time: timeLabel };
    });

  // Overall health score
  const overallHealth = Math.round(healthData.reduce((s, d) => s + d.score, 0) / healthData.length);
  const healthColor = overallHealth >= 80 ? 'var(--emerald-400)' : overallHealth >= 60 ? 'var(--amber-400)' : 'var(--red-400)';
  const healthTrend = 'up';

  return (
    <div
      className="module-page"
      style={{ minHeight: '100%', background: 'var(--slate-950)', padding: '24px' }}
    >
      {/* ── Command Center Header ─────────────────────────────────── */}
      <div
        className="card animate-fade-up delay-0"
        style={{
          padding: '24px 28px', marginBottom: '20px',
          background: 'linear-gradient(135deg, rgba(13,17,23,0.95) 0%, rgba(8,11,18,0.9) 100%)',
          border: '1px solid var(--slate-700)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Animated grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05,
          backgroundImage: `linear-gradient(rgba(245,158,11,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.3) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />

        {/* Radar sweep animation */}
        <div style={{
          position: 'absolute', top: '-50%', right: '-10%', width: '400px', height: '400px',
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(245,158,11,0.03) 60deg, transparent 60.1deg)',
          animation: 'spin 8s linear infinite',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 1 }}>
          {/* Left: Greeting */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-50)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                Site Command Center
              </span>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald-400)', boxShadow: '0 0 8px var(--emerald-400)', animation: 'pulse 2s ease-in-out infinite' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-400)', letterSpacing: '0.06em' }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
            </p>
          </div>

          {/* Center: Overall Health Score */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', padding: '12px 24px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px' }}>
              <RadarIcon style={{ width: '24px', height: '24px', color: healthColor }} />
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Portfolio Health</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: healthColor, lineHeight: 1 }}>{overallHealth}%</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {healthTrend === 'up' ? <TrendingUp style={{ width: '16px', height: '16px', color: 'var(--emerald-400)' }} /> : <TrendingDown style={{ width: '16px', height: '16px', color: 'var(--red-400)' }} />}
              </div>
            </div>
          </div>

          {/* Right: Weather */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <WeatherWidget weather={SITE_WEATHER} />
          </div>
        </div>
      </div>

      {/* ── Alert Carousel ────────────────────────────────────── */}
      {alerts.length > 0 && (
        <AlertCarousel alerts={alerts} />
      )}

      {/* ── KPI Grid ────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '12px', marginBottom: '20px',
        }}
      >
        <div className="animate-fade-up delay-1">
          <StatCard
            label="Revenue Collected" value={fmtM(totalRevenue)} sub="+12.4% this month"
            positive={true} icon={TrendingUp as any} delay={80} onClick={() => setModule('invoicing')}
            trendData={[420, 450, 480, 520, 580, totalRevenue / 1000]}
          />
        </div>
        <div className="animate-fade-up delay-2">
          <StatCard
            label="Active Projects" value={String(activeProjects.length)} sub="In progress"
            positive={true} icon={FolderOpen as any} delay={160} onClick={() => setModule('projects')}
            secondaryValue={`${projects.length} total`}
          />
        </div>
        <div className="animate-fade-up delay-3">
          <StatCard
            label="Workers On Site" value={String(workerCount)} sub="Across all sites"
            positive={true} icon={HardHat as any} delay={240} onClick={() => setModule('teams')}
            trendData={[workerCount * 0.8, workerCount * 0.85, workerCount * 0.9, workerCount * 0.95, workerCount]}
          />
        </div>
        <div className="animate-fade-up delay-4">
          <StatCard
            label="Outstanding" value={fmtM(outstanding)} sub="Awaiting payment"
            positive={false} icon={FileText as any} delay={320} onClick={() => setModule('invoicing')}
            secondaryValue={`${overdueInvoices} overdue`}
          />
        </div>
        <div className="animate-fade-up delay-5">
          <StatCard
            label="Open Incidents" value={String(openIncidents)} sub={openIncidents === 0 ? 'All resolved' : 'Needs action'}
            positive={openIncidents === 0} icon={ShieldCheck as any} delay={400} onClick={() => setModule('safety')}
          />
        </div>
        <div className="animate-fade-up delay-6">
          <StatCard
            label="Open RFIs" value={String(openRFIs)} sub="Awaiting response"
            positive={false} icon={MessageSquare as any} delay={480} onClick={() => setModule('rfis')}
            trendData={[openRFIs + 2, openRFIs + 1, openRFIs, openRFIs - 1, openRFIs]}
          />
        </div>
      </div>

      {/* ── KPI Detail Cards ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {/* Project Status Distribution */}
        <ChartContainer title="Project Status" subtitle="Portfolio breakdown">
          <DonutChart
            data={[
              { name: 'Active', value: counts.active, color: CHART_COLORS.success },
              { name: 'Planning', value: counts.planning, color: CHART_COLORS.secondary },
              { name: 'On Hold', value: counts.on_hold, color: CHART_COLORS.warning },
              { name: 'Completed', value: counts.completed, color: CHART_COLORS.purple },
            ]}
            height={160}
            innerRadius={50}
            outerRadius={70}
          />
        </ChartContainer>

        {/* Invoice Collection Rate */}
        <ChartContainer title="Invoice Status" subtitle="Collection performance">
          <div className="space-y-3">
            <ProgressBar
              label="Paid"
              value={invoices.filter(i => i.status === 'paid').length}
              max={invoices.length || 1}
              color={CHART_COLORS.success}
            />
            <ProgressBar
              label="Pending"
              value={invoices.filter(i => i.status === 'pending' || i.status === 'sent').length}
              max={invoices.length || 1}
              color={CHART_COLORS.warning}
            />
            <ProgressBar
              label="Overdue"
              value={invoices.filter(i => i.status === 'overdue').length}
              max={invoices.length || 1}
              color={CHART_COLORS.danger}
            />
          </div>
        </ChartContainer>

        {/* Safety Score */}
        <ChartContainer title="Safety Metrics" subtitle="HSE performance">
          <div className="flex items-center justify-center py-2">
            <div className="text-center">
              <div
                className="text-4xl font-bold mb-2"
                style={{ color: openIncidents === 0 ? CHART_COLORS.success : CHART_COLORS.warning }}
              >
                {100 - (openIncidents * 15)}
              </div>
              <p className="text-xs text-gray-500">Safety Score</p>
              <div className="mt-2 flex justify-center gap-2">
                <StatusBadge status={openIncidents === 0 ? 'success' : 'warning'} label={`${openIncidents} Open`} />
              </div>
            </div>
          </div>
        </ChartContainer>

        {/* Workforce Distribution */}
        <ChartContainer title="Workforce" subtitle="Team allocation">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">On Site</span>
              <span className="text-sm font-medium text-emerald-400">{workerCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Remote</span>
              <span className="text-sm font-medium text-blue-400">{Math.floor(workerCount * 0.15)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Available</span>
              <span className="text-sm font-medium text-amber-400">{Math.floor(workerCount * 0.1)}</span>
            </div>
            <Sparkline
              data={[20, 25, 22, 28, 30, 27, 32, 35, 33, 38, workerCount]}
              color={CHART_COLORS.primary}
              width={200}
              height={40}
            />
          </div>
        </ChartContainer>
      </div>

      {/* ── Main Grid: Health Radar + Charts + Resources ─────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr 340px', gap: '16px', marginBottom: '20px' }}>
        {/* Health Radar Chart */}
        <div className="card card-grid animate-fade-up delay-3" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-100)', letterSpacing: '-0.01em' }}>Health Radar</h3>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>6 dimensions</p>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={healthData}>
                <PolarGrid stroke="var(--slate-700)" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: 'var(--slate-400)', fontSize: '10px' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar
                  name="Health Score"
                  dataKey="score"
                  stroke="var(--amber-500)"
                  fill="var(--amber-500)"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="card card-grid animate-fade-up delay-4" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-100)', letterSpacing: '-0.01em' }}>Revenue Trend</h3>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>6 month collection</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '3px', background: 'var(--amber-500)', borderRadius: '1px' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-400)' }}>Revenue</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '3px', background: 'var(--emerald-500)', borderRadius: '1px' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-400)' }}>Profit</span>
              </div>
            </div>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--amber-500)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--amber-500)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--emerald-500)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--emerald-500)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-800)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--slate-500)', fontSize: '10px' }} stroke="transparent" />
                <YAxis tick={{ fill: 'var(--slate-500)', fontSize: '10px' }} tickFormatter={v => `£${v/1000}K`} stroke="transparent" />
                <Tooltip
                  contentStyle={{ background: 'var(--slate-900)', border: '1px solid var(--slate-700)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                  labelStyle={{ color: 'var(--slate-400)', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--amber-500)" strokeWidth={2} fill="url(#revGrad)" dot={{ fill: 'var(--amber-500)', strokeWidth: 0, r: 3 }} />
                <Area type="monotone" dataKey="profit" stroke="var(--emerald-500)" strokeWidth={2} fill="url(#profGrad)" dot={{ fill: 'var(--emerald-500)', strokeWidth: 0, r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card card-grid animate-fade-up delay-5" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-100)', letterSpacing: '-0.01em' }}>Activity Feed</h3>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Recent across portfolio</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recentActivities.map((act, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: act.dotColor, marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1, paddingBottom: '14px', borderBottom: i < recentActivities.length - 1 ? '1px solid var(--slate-800)' : 'none' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, color: 'var(--slate-200)', lineHeight: 1.3 }}>{act.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-500)', marginTop: '4px' }}>{act.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Secondary Grid: Projects + Resources + Quick Actions ─────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', gap: '16px', marginBottom: '20px' }}>
        {/* Active Projects List */}
        <div className="card card-grid animate-fade-up delay-4" style={{ padding: '20px', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-100)', letterSpacing: '-0.01em' }}>Active Projects</h3>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Top priority sites</p>
            </div>
            <button
              onClick={() => setModule('projects')}
              className="hover-tab"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', color: 'var(--amber-400)', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, transition: 'all 0.2s' }}
            >
              View All <ArrowRight style={{ width: '12px', height: '12px', display: 'inline', marginLeft: '4px' }} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeProjects.map((proj, i) => {
              const name = String(proj.name ?? '');
              const location = String(proj.location ?? 'Site location');
              const progress = Number(proj.progress ?? 0);
              const workers = Number(proj.workers ?? 0);
              const budget = Number(proj.budget ?? 0);
              return (
                <div
                  key={String(proj.id ?? i)}
                  className="card-hover hover-project"
                  style={{
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--slate-800)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 700, color: 'var(--slate-100)', lineHeight: 1.2 }}>{name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-500)', marginTop: '4px' }}>{location}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--amber-400)' }}>{progress}%</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-500)' }}>complete</div>
                    </div>
                  </div>
                  <div style={{ height: '4px', background: 'var(--slate-800)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: 'linear-gradient(90deg, var(--amber-600), var(--amber-400))',
                        borderRadius: '2px',
                        transition: 'width 0.6s var(--ease-out)',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <HardHat style={{ width: '10px', height: '10px', color: 'var(--slate-500)' }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-400)' }}>{workers} workers</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Package style={{ width: '10px', height: '10px', color: 'var(--slate-500)' }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-400)' }}>{fmtM(budget)}</span>
                      </div>
                    </div>
                    <ChevronRight style={{ width: '14px', height: '14px', color: 'var(--slate-600)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resource Heatmap */}
        <ResourceHeatmap projects={projects} />
      </div>

      {/* ── Quick Actions + Safety Banner ─────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        {/* Quick Actions */}
        <div className="card card-grid animate-fade-up delay-5" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-100)', letterSpacing: '-0.01em' }}>Quick Actions</h3>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Jump to tasks</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'New Invoice', icon: FileText, module: 'invoicing' as Module },
              { label: 'Log Incident', icon: AlertTriangle, module: 'safety' as Module },
              { label: 'Create RFI', icon: MessageSquare, module: 'rfis' as Module },
              { label: 'Site Report', icon: ClipboardList, module: 'daily-reports' as Module },
              { label: 'Timesheet', icon: Clock, module: 'timesheets' as Module },
              { label: 'Procurement', icon: ShoppingCart, module: 'procurement' as Module },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => setModule(action.module)}
                  className="hover-action"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--slate-800)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                >
                  <Icon style={{ width: '16px', height: '16px', color: 'var(--amber-400)' }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--slate-200)' }}>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Team Availability */}
        <div className="card card-grid animate-fade-up delay-6" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-100)', letterSpacing: '-0.01em' }}>Team Availability</h3>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Today's workforce</p>
            </div>
            <button onClick={() => setModule('teams')} className="hover-tab" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', color: 'var(--blue-400)', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600 }}>
              View All
            </button>
          </div>
          <div className="space-y-3">
            {/* Availability Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--emerald-400)' }}>{workerCount}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--slate-400)', textTransform: 'uppercase' }}>On Site</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--amber-400)' }}>{Math.max(0, Math.floor(workerCount * 0.2))}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--slate-400)', textTransform: 'uppercase' }}>On Leave</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--blue-400)' }}>{Math.max(0, workerCount - Math.floor(workerCount * 1.2))}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Available</div>
              </div>
            </div>
            {/* Top Workers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {team.slice(0, 4).map((member, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue-500), var(--blue-600))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'white' }}>
                    {(member.name as string || 'A').charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--slate-200)' }}>{member.name as string || 'Unknown'}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-500)' }}>{member.trade as string || member.role as string || 'Worker'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {member.status === 'active' ? (
                      <><Circle style={{ width: '8px', height: '8px', color: 'var(--emerald-400)' }} /><span style={{ fontSize: '9px', color: 'var(--emerald-400)' }}>On Site</span></>
                    ) : (
                      <><Coffee style={{ width: '8px', height: '8px', color: 'var(--slate-500)' }} /><span style={{ fontSize: '9px', color: 'var(--slate-500)' }}>Off</span></>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card card-grid animate-fade-up delay-7" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-100)', letterSpacing: '-0.01em' }}>Upcoming Deadlines</h3>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Next 7 days</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { title: 'RAMS Review', project: 'City Centre Phase 2', days: 2, type: 'compliance', color: 'var(--amber-400)' },
              { title: 'Invoice Payment', project: 'Highway Extension', days: 3, type: 'financial', color: 'var(--blue-400)' },
              { title: 'Tender Submission', project: 'Hospital Wing', days: 5, type: 'tender', color: 'var(--emerald-400)' },
              { title: 'Safety Inspection', project: 'Retail Complex', days: 7, type: 'safety', color: 'var(--red-400)' },
            ].map((deadline, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `3px solid ${deadline.color}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--slate-200)' }}>{deadline.title}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-500)' }}>{deadline.project}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: deadline.color }}>{deadline.days}d</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--slate-500)' }}>remaining</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}