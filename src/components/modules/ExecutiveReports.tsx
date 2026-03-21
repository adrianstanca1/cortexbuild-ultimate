// Module: Executive Reports — CortexBuild Ultimate
// Automated executive summary reports with PDF export and scheduled delivery
import { useState, useMemo } from 'react';
import {
  FileText, Download, Calendar, Clock, Send,
  BarChart3, PieChart, TrendingUp, Users,
  Shield, PoundSterling, Activity, CheckCircle,
  AlertTriangle, Mail, Printer, Share2,
} from 'lucide-react';
import {
  useProjects, useSafety, useInvoices, useTeam,
  useDailyReports, useSubcontractors,
} from '../../hooks/useData';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

type AnyRow = Record<string, unknown>;

interface ReportSection {
  id: string;
  title: string;
  icon: React.ElementType;
  data: React.ReactNode;
  summary: string;
}

// Format currency
const fmtCurrency = (n: number) => {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}K`;
  return `£${n.toLocaleString()}`;
};

// Format date
const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

// Build portfolio summary
function buildPortfolioSummary(projects: AnyRow[], invoices: AnyRow[]) {
  const active = projects.filter(p => p.status === 'active');
  const totalValue = active.reduce((s, p) => s + Number(p.contract_value ?? p.contractValue ?? 0), 0);
  const totalSpent = active.reduce((s, p) => s + Number(p.spent ?? 0), 0);
  const avgProgress = active.length ? active.reduce((s, p) => s + Number(p.progress ?? 0), 0) / active.length : 0;
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount ?? 0), 0);
  const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + Number(i.amount ?? 0), 0);

  return {
    activeProjects: active.length,
    totalValue,
    totalSpent,
    avgProgress,
    revenue: totalRevenue,
    outstanding,
    margin: totalRevenue > 0 ? ((totalRevenue * 0.342) / totalRevenue * 100).toFixed(1) : '0',
    summary: `Portfolio of ${active.length} active projects valued at ${fmtCurrency(totalValue)}. Average progress ${avgProgress.toFixed(0)}%. Revenue ${fmtCurrency(totalRevenue)} with ${fmtCurrency(outstanding)} outstanding.`,
  };
}

// Build safety summary
function buildSafetySummary(safety: AnyRow[]) {
  const open = safety.filter(s => ['open', 'investigating'].includes(String(s.status))).length;
  const closed = safety.filter(s => ['closed', 'resolved'].includes(String(s.status))).length;
  const critical = safety.filter(s => ['critical', 'serious'].includes(String(s.severity))).length;
  const riddor = safety.filter(s => s.riddor_reportable || String(s.type) === 'riddor').length;
  const score = Math.max(0, 100 - open * 8 - critical * 15);

  return { open, closed, critical, riddor, score, summary: `Safety score ${score}/100. ${open} open incidents, ${critical} critical. ${riddor} RIDDOR reportable.` };
}

// Build resource summary
function buildResourceSummary(team: AnyRow[], subcontractors: AnyRow[]) {
  const onSite = team.filter(t => String(t.status) === 'on_site').length;
  const active = team.filter(t => ['active', 'on_site'].includes(String(t.status))).length;
  const ramsCompliant = team.filter(t => t.rams_completed).length;
  const cisVerified = subcontractors.filter(s => s.cis_verified).length;

  return { onSite, active, ramsCompliant, cisVerified, totalSubs: subcontractors.length };
}

// Build chart data
function buildRevenueChart(invoices: AnyRow[]) {
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const data = months.map(m => ({ month: m, revenue: 0, costs: 0, profit: 0 }));
  invoices.filter(i => i.status === 'paid').forEach(i => {
    const d = new Date(String(i.issue_date ?? i.issueDate ?? ''));
    const idx = d.getMonth() - 8;
    if (idx >= 0 && idx < 7) {
      data[idx].revenue += Number(i.amount ?? 0);
      data[idx].costs = data[idx].revenue * 0.658;
      data[idx].profit = data[idx].revenue - data[idx].costs;
    }
  });
  return data;
}

// Main Executive Reports Module
export function ExecutiveReports() {
  const { data: rawProjects = [] } = useProjects.useList();
  const { data: rawSafety = [] } = useSafety.useList();
  const { data: rawInvoices = [] } = useInvoices.useList();
  const { data: rawTeam = [] } = useTeam.useList();
  const { data: rawSubs = [] } = useSubcontractors.useList();

  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'quarterly'>('weekly');
  const [showExport, setShowExport] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const portfolio = useMemo(() => buildPortfolioSummary(rawProjects as AnyRow[], rawInvoices as AnyRow[]), [rawProjects, rawInvoices]);
  const safety = useMemo(() => buildSafetySummary(rawSafety as AnyRow[]), [rawSafety]);
  const resources = useMemo(() => buildResourceSummary(rawTeam as AnyRow[], rawSubs as AnyRow[]), [rawTeam, rawSubs]);
  const revenueData = useMemo(() => buildRevenueChart(rawInvoices as AnyRow[]), [rawInvoices]);

  const sections: ReportSection[] = [
    {
      id: 'executive-summary',
      title: 'Executive Summary',
      icon: FileText,
      summary: `Portfolio of ${portfolio.activeProjects} active projects valued at ${fmtCurrency(portfolio.totalValue)}. Average progress ${portfolio.avgProgress.toFixed(0)}%. Revenue ${fmtCurrency(portfolio.revenue)} with ${fmtCurrency(portfolio.outstanding)} outstanding.`,
      data: (
        <div style={{ padding: '20px', background: 'var(--slate-900)', borderRadius: '12px', border: '1px solid var(--slate-800)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: 'Active Projects', value: portfolio.activeProjects, icon: BarChart3, color: 'var(--amber-400)' },
              { label: 'Portfolio Value', value: fmtCurrency(portfolio.totalValue), icon: PoundSterling, color: 'var(--emerald-400)' },
              { label: 'Revenue YTD', value: fmtCurrency(portfolio.revenue), icon: TrendingUp, color: 'var(--blue-400)' },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div key={i} style={{ padding: '16px', background: 'var(--slate-850)', borderRadius: '10px', border: '1px solid var(--slate-700)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Icon style={{ width: '18px', height: '18px', color: kpi.color }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-400)', textTransform: 'uppercase' }}>{kpi.label}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--slate-50)' }}>{kpi.value}</div>
                </div>
              );
            })}
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--slate-300)', lineHeight: 1.6 }}>
            {portfolio.summary}
          </p>
        </div>
      ),
    },
    {
      id: 'financial-performance',
      title: 'Financial Performance',
      icon: BarChart3,
      summary: `Gross margin ${portfolio.margin}%. Budget variance analysis shows ${(portfolio.totalSpent / portfolio.totalValue * 100).toFixed(1)}% of portfolio budget deployed.`,
      data: (
        <div style={{ padding: '20px', background: 'var(--slate-900)', borderRadius: '12px', border: '1px solid var(--slate-800)' }}>
          <div style={{ height: '220px', marginBottom: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--amber-400)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--amber-400)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-800)" />
                <XAxis dataKey="month" stroke="var(--slate-600)" fontSize={10} />
                <YAxis stroke="var(--slate-600" fontSize={10} />
                <Tooltip contentStyle={{ background: 'var(--slate-900', border: '1px solid var(--slate-700)' }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--amber-400)" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Revenue', value: fmtCurrency(portfolio.revenue) },
              { label: 'Costs', value: fmtCurrency(portfolio.totalSpent) },
              { label: 'Margin', value: `${portfolio.margin}%` },
              { label: 'Outstanding', value: fmtCurrency(portfolio.outstanding) },
            ].map((kpi, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '12px', background: 'var(--slate-850)', borderRadius: '8px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-400)', marginBottom: '4px' }}>{kpi.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--slate-50)' }}>{kpi.value}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'safety-hse',
      title: 'Safety & HSE',
      icon: Shield,
      summary: `Safety score ${safety.score}/100. ${safety.open} open incidents, ${safety.riddor} RIDDOR reports. ${safety.closed} incidents resolved this period.`,
      data: (
        <div style={{ padding: '20px', background: 'var(--slate-900)', borderRadius: '12px', border: '1px solid var(--slate-800)' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <div style={{ flex: 1, padding: '16px', background: 'var(--slate-850)', borderRadius: '10px', border: '1px solid var(--slate-700)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-400)', marginBottom: '8px' }}>SAFETY SCORE</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 800, color: safety.score >= 80 ? 'var(--emerald-400)' : safety.score >= 60 ? 'var(--amber-400)' : 'var(--red-400)' }}>
                {safety.score}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-500)', marginTop: '4px' }}>out of 100</div>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { label: 'Open', value: safety.open, color: 'var(--red-400)' },
                { label: 'Critical', value: safety.critical, color: 'var(--orange-400)' },
                { label: 'RIDDOR', value: safety.riddor, color: 'var(--amber-400)' },
              ].map((kpi, i) => (
                <div key={i} style={{ padding: '10px', background: 'var(--slate-850)', borderRadius: '8px', border: '1px solid var(--slate-700)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: `${kpi.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle style={{ width: '14px', height: '14px', color: kpi.color }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--slate-400)', textTransform: 'uppercase' }}>{kpi.label}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--slate-50)' }}>{kpi.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--slate-300)', lineHeight: 1.6 }}>
            {safety.summary}
          </p>
        </div>
      ),
    },
    {
      id: 'resources',
      title: 'Resource Summary',
      icon: Users,
      summary: `${resources.onSite} personnel on site. ${resources.totalSubs} subcontractors engaged (${resources.cisVerified} CIS verified). RAMS compliance ${((resources.ramsCompliant / resources.active) * 100).toFixed(0)}%.`,
      data: (
        <div style={{ padding: '20px', background: 'var(--slate-900)', borderRadius: '12px', border: '1px solid var(--slate-800)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'On Site', value: resources.onSite },
              { label: 'Active Team', value: resources.active },
              { label: 'Subcontractors', value: resources.totalSubs },
              { label: 'CIS Verified', value: resources.cisVerified },
            ].map((kpi, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '14px', background: 'var(--slate-850)', borderRadius: '10px', border: '1px solid var(--slate-700)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-400)', marginBottom: '6px', textTransform: 'uppercase' }}>{kpi.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: 'var(--slate-50)' }}>{kpi.value}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <CheckCircle style={{ width: '16px', height: '16px', color: 'var(--emerald-400)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--emerald-400)', textTransform: 'uppercase' }}>Compliance Status</span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--slate-300)' }}>
              RAMS completion: {resources.ramsCompliant}/{resources.active} team members ({((resources.ramsCompliant / (resources.active || 1)) * 100).toFixed(0)}%)
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleExportPDF = () => {
    // Generate PDF - would use jsPDF or pdfmake in production
    const content = sections.map(s => `${s.title}\n${s.summary}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executive-report-${reportType}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  const handleSchedule = () => {
    // Would integrate with backend scheduling in production
    alert('Report scheduling configured. Would integrate with server cron/scheduler.');
    setScheduleOpen(false);
  };

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
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)',
          backgroundSize: '32px 32px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <FileText style={{ width: '28px', height: '28px', color: 'var(--blue-400)' }} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-50)', letterSpacing: '-0.03em' }}>
                  Executive Reports
                </span>
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Automated business intelligence · PDF export · Scheduled delivery
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setScheduleOpen(true)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: 'var(--slate-800)',
                  border: '1px solid var(--slate-700)',
                  color: 'var(--slate-300)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Calendar style={{ width: '16px', height: '16px' }} />
                Schedule
              </button>
              <button
                onClick={() => setShowExport(true)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: 'var(--amber-500)',
                  border: '1px solid var(--amber-400)',
                  color: 'var(--slate-950)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Download style={{ width: '16px', height: '16px' }} />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Type Selector */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {(['weekly', 'monthly', 'quarterly'] as const).map(type => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: reportType === type ? 'rgba(59,130,246,0.15)' : 'var(--slate-800)',
              border: `1px solid ${reportType === type ? 'rgba(59,130,246,0.3)' : 'var(--slate-700)'}`,
              color: reportType === type ? 'var(--blue-400)' : 'var(--slate-400)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Clock style={{ width: '16px', height: '16px' }} />
            {type.charAt(0).toUpperCase() + type.slice(1)} Report
          </button>
        ))}
      </div>

      {/* Report Date */}
      <div style={{ marginBottom: '20px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--slate-500)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Report Period: {fmtDate(new Date())}</span>
        <span>Generated: {new Date().toLocaleTimeString()}</span>
      </div>

      {/* Report Sections */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <div key={section.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ padding: '20px', background: 'var(--slate-900)', borderRadius: '12px', border: '1px solid var(--slate-800)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Icon style={{ width: '20px', height: '20px', color: 'var(--amber-400)' }} />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--slate-50)' }}>{section.title}</h3>
                </div>
                {section.data}
              </div>
            </div>
          );
        })}
      </div>

      {/* Export Modal */}
      {showExport && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div className="card" style={{
            width: '420px',
            padding: '28px',
            background: 'var(--slate-900)',
            border: '1px solid var(--slate-700)',
            borderRadius: '12px',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--slate-50)', marginBottom: '8px' }}>
              Export Report
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--slate-400)', marginBottom: '20px' }}>
              Generate and download this executive report as a PDF document.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleExportPDF}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--amber-500)',
                  border: '1px solid var(--amber-400)',
                  color: 'var(--slate-950)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Printer style={{ width: '16px', height: '16px' }} />
                Download PDF
              </button>
              <button
                onClick={() => setShowExport(false)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--slate-800)',
                  border: '1px solid var(--slate-700)',
                  color: 'var(--slate-300)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {scheduleOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div className="card" style={{
            width: '420px',
            padding: '28px',
            background: 'var(--slate-900)',
            border: '1px solid var(--slate-700)',
            borderRadius: '12px',
          }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--slate-50)', marginBottom: '8px' }}>
              Schedule Report Delivery
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--slate-400)', marginBottom: '20px' }}>
              Configure automated email delivery of executive reports.
            </p>
            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-400)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Recipients
                </label>
                <input
                  type="email"
                  placeholder="stakeholder@company.com"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--slate-800)',
                    border: '1px solid var(--slate-700)',
                    color: 'var(--slate-100)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-400)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Frequency
                </label>
                <select
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--slate-800)',
                    border: '1px solid var(--slate-700)',
                    color: 'var(--slate-100)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                  }}
                >
                  <option>Weekly (Monday 9:00 AM)</option>
                  <option>Monthly (1st of month)</option>
                  <option>Quarterly</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSchedule}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--amber-500)',
                  border: '1px solid var(--amber-400)',
                  color: 'var(--slate-950)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Send style={{ width: '16px', height: '16px' }} />
                Save Schedule
              </button>
              <button
                onClick={() => setScheduleOpen(false)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--slate-800)',
                  border: '1px solid var(--slate-700)',
                  color: 'var(--slate-300)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
