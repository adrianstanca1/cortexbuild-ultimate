// Module: Safety — CortexBuild Ultimate
// "HSE Intelligence Hub" Redesign
import { useState, useMemo } from 'react';
import {
  Shield, AlertTriangle, CheckCircle2, AlertCircle, FileText,
  Plus, X, Loader2, Search, Edit2, Trash2, RefreshCw,
  TrendingUp, Activity, MapPin, Calendar, ChevronRight,
  BarChart3, PieChart, Layers, Clock, User
} from 'lucide-react';
import { useSafety, useProjects } from '../../hooks/useData';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Pie, PieChart as RechartsPie, Cell, AreaChart, Area
} from 'recharts';
import type { Module } from '../../types';

type AnyRow = Record<string, unknown>;

const severityConfig: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: 'var(--emerald-400)', bg: 'rgba(16,185,129,0.1)' },
  medium: { label: 'Medium', color: 'var(--amber-400)', bg: 'rgba(245,158,11,0.1)' },
  high: { label: 'High', color: 'var(--orange-400)', bg: 'rgba(251,146,60,0.1)' },
  critical: { label: 'Critical', color: 'var(--red-400)', bg: 'rgba(248,113,113,0.1)' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'var(--red-400)' },
  investigating: { label: 'Investigating', color: 'var(--amber-400)' },
  closed: { label: 'Closed', color: 'var(--emerald-400)' },
  resolved: { label: 'Resolved', color: 'var(--emerald-400)' },
};

const typeConfig: Record<string, { label: string; icon: React.FC<{ className?: string }> }> = {
  near_miss: { label: 'Near Miss', icon: AlertTriangle },
  first_aid: { label: 'First Aid', icon: AlertCircle },
  riddor: { label: 'RIDDOR', icon: FileText },
  incident: { label: 'Incident', icon: AlertTriangle },
  hazard: { label: 'Hazard', icon: AlertTriangle },
};

const COLORS = ['var(--red-400)', 'var(--orange-400)', 'var(--amber-400)', 'var(--emerald-400)'];
const MONTHS = ['Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

const defaultForm = {
  title: '', type: 'near_miss', severity: 'medium', status: 'open',
  project: '', location: '', date: new Date().toISOString().split('T')[0],
  description: '', immediate_actions: '', injured_party: '',
  reported_by_name: '', riddor_reportable: false,
};
type FormData = typeof defaultForm;

const buildTrendData = (incidents: AnyRow[]) => {
  const data = MONTHS.map(m => ({ month: m, incidents: 0, nearMisses: 0, toolboxTalks: 0 }));
  incidents.forEach(inc => {
    const d = new Date(String(inc.date ?? ''));
    const idx = d.getMonth() - 8;
    if (idx >= 0 && idx < 7) {
      const t = String(inc.type ?? '');
      if (['incident','first_aid','riddor'].includes(t)) data[idx].incidents++;
      else if (['near-miss','near_miss'].includes(t)) data[idx].nearMisses++;
      else if (['toolbox-talk','toolbox_talk'].includes(t)) data[idx].toolboxTalks++;
    }
  });
  return data;
};

const buildRiskHeatmap = (incidents: AnyRow[], projects: AnyRow[]) => {
  const risk: Record<string, any> = {};
  projects.forEach(p => { risk[String(p.name ?? 'Unknown')] = { name: String(p.name ?? 'Unknown'), critical: 0, high: 0, medium: 0, low: 0, score: 0 }; });
  incidents.forEach(inc => {
    const proj = String(inc.project ?? 'Unknown');
    const sev = String(inc.severity ?? 'low');
    if (!risk[proj]) risk[proj] = { name: proj, critical: 0, high: 0, medium: 0, low: 0, score: 0 };
    risk[proj][sev] = (risk[proj][sev] ?? 0) + 1;
    risk[proj].score += {critical:4,high:3,medium:2,low:1}[sev] ?? 1;
  });
  return Object.values(risk).sort((a,b) => b.score - a.score).slice(0, 5);
};

const buildRootCauseData = (incidents: AnyRow[]) => {
  const causes: Record<string, number> = {};
  incidents.forEach(inc => { causes[String(inc.root_cause ?? 'unknown')] = (causes[String(inc.root_cause ?? 'unknown')] ?? 0) + 1; });
  return Object.entries(causes).map(([name, value]) => ({ name, value }));
};

const buildForecastData = (trendData: any[]) => {
  const last = trendData[trendData.length - 1];
  const avgGrowth = trendData.length > 1 ? (last.incidents - trendData[0].incidents) / trendData.length : 0;
  return ['Apr','May','Jun'].map((m, i) => ({
    month: m,
    projected: Math.round(last.incidents + avgGrowth * (i + 1)),
    target: Math.max(0, last.incidents - 2)
  }));
};

export function Safety({ setModule }: { setModule?: (m: Module) => void }) {
  const { useList, useCreate, useUpdate, useDelete } = useSafety;
  const { data: rawProjects = [] } = useProjects.useList();
  const { data: raw = [], isLoading, refetch } = useList();
  const incidents = raw as AnyRow[];
  const createM = useCreate(); const updateM = useUpdate(); const deleteM = useDelete();

  const [categoryTab, setCategoryTab] = useState('all');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const TYPE_MAP: Record<string, string[]> = {
    all: [], incidents: ['incident','first_aid','riddor'], near_misses: ['near-miss','near_miss'],
    hazards: ['hazard','dangerous_occurrence','environmental'], mewp: ['mewp-check','mewp_check'],
    toolbox: ['toolbox-talk','toolbox_talk'], riddor: ['riddor'],
  };

  const filtered = incidents
    .filter(i => categoryTab === 'all' || TYPE_MAP[categoryTab]?.includes(String(i.type ?? '')))
    .filter(i => filter === 'all' || i.status === filter || i.severity === filter)
    .filter(i => !search || String(i.title).toLowerCase().includes(search.toLowerCase()));

  const counts = {
    open: incidents.filter(i => ['open','investigating'].includes(String(i.status ?? ''))).length,
    critical: incidents.filter(i => ['critical','serious'].includes(String(i.severity ?? ''))).length,
    riddor: incidents.filter(i => i.riddor_reportable || String(i.type) === 'riddor').length,
    closed: incidents.filter(i => ['closed','resolved'].includes(String(i.status ?? ''))).length,
    total: incidents.length,
  };

  const trendData = useMemo(() => buildTrendData(incidents), [incidents]);
  const riskHeatmap = useMemo(() => buildRiskHeatmap(incidents, rawProjects as AnyRow[]), [incidents, rawProjects]);
  const rootCauseData = useMemo(() => buildRootCauseData(incidents), [incidents]);
  const forecastData = useMemo(() => buildForecastData(trendData), [trendData]);
  const safetyScore = incidents.length ? Math.max(0, 100 - counts.open * 8 - counts.critical * 15) : 100;
  const safetyColor = safetyScore >= 80 ? 'var(--emerald-400)' : safetyScore >= 60 ? 'var(--amber-400)' : 'var(--red-400)';
  const selected = incidents.find(i => String(i.id) === selectedId);

  const openCreate = () => { setForm(defaultForm); setEditId(null); setShowModal(true); };
  const openEdit = (i: AnyRow) => {
    setForm({ ...defaultForm, title: String(i.title??''), type: String(i.type??'near_miss'), severity: String(i.severity??'medium'),
      status: String(i.status??'open'), project: String(i.project??''), location: String(i.location??''),
      date: String(i.date??new Date().toISOString().split('T')[0]), description: String(i.description??''),
      reported_by_name: String(i.reported_by_name??i.reportedBy??''), riddor_reportable: Boolean(i.riddor_reportable) });
    setEditId(String(i.id)); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (editId) await updateM.mutateAsync({ id: editId, data: form }); else await createM.mutateAsync(form); setShowModal(false); };
  const handleDelete = async (id: string) => { if (!confirm('Delete?')) return; await deleteM.mutateAsync(id); setSelectedId(null); };

  const inp = "w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500";
  const lbl = "block text-xs font-semibold text-slate-400 mb-1.5 uppercase";

  return (
    <div className="module-page" style={{ minHeight: '100%', background: 'var(--slate-950)', padding: '24px' }}>
      {/* Header */}
      <div className="card animate-fade-up" style={{ padding: '24px 28px', marginBottom: '20px', background: 'linear-gradient(135deg, rgba(13,17,23,0.95), rgba(8,11,18,0.9))', border: '1px solid var(--slate-700)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05, backgroundImage: 'linear-gradient(rgba(248,113,113,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(248,113,113,0.3) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-50)', letterSpacing: '-0.03em' }}>HSE Intelligence Hub</span>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: safetyColor, boxShadow: '0 0 8px currentColor', animation: 'pulse 2s ease-in-out infinite' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-500)', letterSpacing: '0.08em' }}>
              REAL-TIME RISK INTELLIGENCE · RIDDOR COMPLIANCE
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--amber-400)', marginBottom: '4px' }}>SAFETY SCORE</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: safetyColor }}>{safetyScore}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'var(--amber-500)', border: 'none', borderRadius: '8px', color: 'var(--slate-950)', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              <Plus style={{ width: '16px', height: '16px' }} /> Report Incident
            </button>
            <button onClick={() => refetch()} className="hover-btn" style={{ padding: '10px 14px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '8px', color: 'var(--slate-400)', cursor: 'pointer', transition: 'all 0.2s' }}>
              <RefreshCw style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Incidents', value: counts.total, color: 'var(--slate-400)', icon: Activity },
          { label: 'Open', value: counts.open, color: 'var(--red-400)', icon: AlertCircle },
          { label: 'Critical', value: counts.critical, color: 'var(--orange-400)', icon: AlertTriangle },
          { label: 'RIDDOR', value: counts.riddor, color: 'var(--amber-400)', icon: FileText },
          { label: 'Closed', value: counts.closed, color: 'var(--emerald-400)', icon: CheckCircle2 },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="card animate-fade-up" style={{ padding: '18px 20px', background: 'var(--slate-900)', border: '1px solid var(--slate-800)', animationDelay: `${i * 0.05}s` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: '20px', height: '20px', color: kpi.color }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: kpi.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{kpi.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--slate-50)' }}>{kpi.value}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Trend Chart */}
        <div className="card" style={{ padding: '20px', background: 'var(--slate-900)', border: '1px solid var(--slate-800)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <TrendingUp style={{ width: '18px', height: '18px', color: 'var(--amber-400)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-50)' }}>Incident Trends</span>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gradInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--red-400)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--red-400)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradNear" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--amber-400)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--amber-400)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-800)" />
                <XAxis dataKey="month" stroke="var(--slate-600)" fontSize={11} />
                <YAxis stroke="var(--slate-600)" fontSize={11} />
                <RechartsTooltip contentStyle={{ background: 'var(--slate-900)', border: '1px solid var(--slate-700)', fontFamily: 'var(--font-body)' }} />
                <Legend wrapperStyle={{ fontFamily: 'var(--font-body)', fontSize: '11px' }} />
                <Area type="monotone" dataKey="incidents" stroke="var(--red-400)" fill="url(#gradInc)" strokeWidth={2} name="Incidents" />
                <Area type="monotone" dataKey="nearMisses" stroke="var(--amber-400)" fill="url(#gradNear)" strokeWidth={2} name="Near Misses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Heatmap */}
        <div className="card" style={{ padding: '20px', background: 'var(--slate-900)', border: '1px solid var(--slate-800)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Layers style={{ width: '18px', height: '18px', color: 'var(--red-400)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-50)' }}>Risk by Project</span>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskHeatmap} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-800)" />
                <XAxis type="number" stroke="var(--slate-600)" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="var(--slate-400)" fontSize={11} width={100} />
                <RechartsTooltip contentStyle={{ background: 'var(--slate-900)', border: '1px solid var(--slate-700)', fontFamily: 'var(--font-body)' }} />
                <Legend wrapperStyle={{ fontFamily: 'var(--font-body)', fontSize: '11px' }} />
                <Bar dataKey="critical" stackId="stack" fill="var(--red-400)" name="Critical" />
                <Bar dataKey="high" stackId="stack" fill="var(--orange-400)" name="High" />
                <Bar dataKey="medium" stackId="stack" fill="var(--amber-400)" name="Medium" />
                <Bar dataKey="low" stackId="stack" fill="var(--emerald-400)" name="Low" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Root Cause Pie */}
        <div className="card" style={{ padding: '20px', background: 'var(--slate-900)', border: '1px solid var(--slate-800)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <PieChart style={{ width: '18px', height: '18px', color: 'var(--amber-400)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-50)' }}>Root Cause Analysis</span>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie data={rootCauseData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {rootCauseData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ background: 'var(--slate-900)', border: '1px solid var(--slate-700)', fontFamily: 'var(--font-body)' }} />
                <Legend wrapperStyle={{ fontFamily: 'var(--font-body)', fontSize: '11px' }} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Forecast */}
        <div className="card" style={{ padding: '20px', background: 'var(--slate-900)', border: '1px solid var(--slate-800)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <BarChart3 style={{ width: '18px', height: '18px', color: 'var(--emerald-400)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-50)' }}>Risk Forecast</span>
          </div>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-800)" />
                <XAxis dataKey="month" stroke="var(--slate-600)" fontSize={11} />
                <YAxis stroke="var(--slate-600)" fontSize={11} />
                <RechartsTooltip contentStyle={{ background: 'var(--slate-900)', border: '1px solid var(--slate-700)', fontFamily: 'var(--font-body)' }} />
                <Legend wrapperStyle={{ fontFamily: 'var(--font-body)', fontSize: '11px' }} />
                <Line type="monotone" dataKey="projected" stroke="var(--red-400)" strokeWidth={2} name="Projected" />
                <Line type="monotone" dataKey="target" stroke="var(--emerald-400)" strokeWidth={2} strokeDasharray="4 4" name="Target" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--slate-800)', paddingBottom: '12px' }}>
        {['all', 'incidents', 'near_misses', 'hazards', 'toolbox', 'riddor'].map(tab => (
          <button
            key={tab}
            onClick={() => setCategoryTab(tab)}
            className="hover-tab"
            style={{
              padding: '8px 16px',
              background: categoryTab === tab ? 'var(--amber-500)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: categoryTab === tab ? 'var(--slate-950)' : 'var(--slate-400)',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'capitalize',
            }}
          >
            {tab.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--slate-500)' }} />
          <input
            type="text"
            placeholder="Search incidents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '8px', color: 'var(--slate-100)', fontFamily: 'var(--font-body)', fontSize: '13px' }}
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ padding: '12px 16px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '8px', color: 'var(--slate-100)', fontFamily: 'var(--font-body)', fontSize: '13px', cursor: 'pointer' }}
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="closed">Closed</option>
          <option value="critical">Critical Severity</option>
        </select>
      </div>

      {/* Incident List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {filtered.map((incident, i) => {
          const typeCfg = typeConfig[String(incident.type ?? 'incident')] || typeConfig.incident;
          const TypeIcon = typeCfg.icon;
          const sev = severityConfig[String(incident.severity ?? 'medium')];
          const stat = statusConfig[String(incident.status ?? 'open')];
          return (
            <div key={String(incident.id ?? i)} className="card hover-card" style={{ padding: '16px 20px', background: 'var(--slate-900)', border: `1px solid ${sev.bg.replace('0.1', '0.3')}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: sev.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ display: 'inline-flex', color: sev.color }}><TypeIcon className="lucide-icon" /></span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color: 'var(--slate-50)' }}>{String(incident.title ?? 'Untitled')}</span>
                    <span style={{ padding: '4px 10px', background: stat.color + '15', border: `1px solid ${stat.color}`, borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: stat.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</span>
                    {Boolean(incident.riddor_reportable) && <span style={{ padding: '4px 10px', background: 'var(--amber-500)', borderRadius: '20px', fontSize: '10px', fontWeight: 700, color: 'var(--slate-950)', textTransform: 'uppercase' }}>RIDDOR</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--slate-400)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin style={{ width: '12px', height: '12px' }} />{String(incident.location ?? 'Unknown')}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar style={{ width: '12px', height: '12px' }} />{String(incident.date ?? '')}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User style={{ width: '12px', height: '12px' }} />{String(incident.project ?? 'Unknown')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEdit(incident)} className="hover-btn" style={{ padding: '8px 12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '8px', color: 'var(--slate-400)', cursor: 'pointer' }}>
                    <Edit2 style={{ width: '14px', height: '14px' }} />
                  </button>
                  <button onClick={() => handleDelete(String(incident.id))} className="hover-danger" style={{ padding: '8px 12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '8px', color: 'var(--red-400)', cursor: 'pointer' }}>
                    <Trash2 style={{ width: '14px', height: '14px' }} />
                  </button>
                  <ChevronRight style={{ width: '20px', height: '20px', color: 'var(--slate-500)' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card animate-fade-up" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', padding: '28px', background: 'var(--slate-900)', border: '1px solid var(--slate-700)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--slate-50)' }}>{editId ? 'Edit Incident' : 'Report New Incident'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)', padding: '8px' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label className={lbl}>Title</label>
                <input className={inp} type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              <div>
                <label className={lbl}>Type</label>
                <select className={inp} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="near_miss">Near Miss</option>
                  <option value="incident">Incident</option>
                  <option value="first_aid">First Aid</option>
                  <option value="riddor">RIDDOR</option>
                  <option value="hazard">Hazard</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Severity</label>
                <select className={inp} value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select className={inp} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="closed">Closed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Project</label>
                <input className={inp} type="text" value={form.project} onChange={e => setForm({...form, project: e.target.value})} />
              </div>
              <div>
                <label className={lbl}>Location</label>
                <input className={inp} type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
              </div>
              <div>
                <label className={lbl}>Date</label>
                <input className={inp} type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className={lbl}>Description</label>
                <textarea className={inp} rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className={lbl}>Immediate Action Taken</label>
                <textarea className={inp} rows={2} value={form.immediate_actions} onChange={e => setForm({...form, immediate_actions: e.target.value})} />
              </div>
              <div>
                <label className={lbl}>Injured Party</label>
                <input className={inp} type="text" value={form.injured_party} onChange={e => setForm({...form, injured_party: e.target.value})} />
              </div>
              <div>
                <label className={lbl}>Reported By</label>
                <input className={inp} type="text" value={form.reported_by_name} onChange={e => setForm({...form, reported_by_name: e.target.value})} />
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" id={`riddor-${editId ?? 'new'}`} checked={form.riddor_reportable} onChange={e => setForm({...form, riddor_reportable: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                <label htmlFor={`riddor-${editId ?? 'new'}`} style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--slate-300)', cursor: 'pointer' }}>RIDDOR Reportable</label>
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', background: 'var(--amber-500)', border: 'none', borderRadius: '8px', color: 'var(--slate-950)', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  {editId ? 'Update Incident' : 'Submit Report'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '12px 24px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '8px', color: 'var(--slate-400)', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
