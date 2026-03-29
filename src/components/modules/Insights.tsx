// Module: Insights — CortexBuild Ultimate Enhanced
import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, Lightbulb, Activity, Shield, PoundSterling,
  Users, FileText, ClipboardList, Target, RefreshCw,
  CheckSquare, Square, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { insightsApi, type Insight as ApiInsight } from '../../services/api';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { EmptyState } from '../ui/EmptyState';
import { BarChart, Bar, PieChart as RechartsPie,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

type _AnyRow = Record<string, unknown>;
type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
type CategoryType = 'all' | 'financial' | 'safety' | 'programme' | 'resource' | 'quality' | 'risk';

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
}

const SEVERITY_CONFIG: Record<'critical' | 'high' | 'medium' | 'low' | 'info', { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
  high: { label: 'High', color: '#f97316', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.3)' },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  low: { label: 'Low', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
  info: { label: 'Info', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' },
};



export function Insights() {
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>('all');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [allInsights, setAllInsights] = useState<ApiInsight[]>([]);
  const [_loading, setLoading] = useState(true);

  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  useEffect(() => {
    insightsApi.getAll()
      .then(setAllInsights)
      .catch(() => toast.error('Failed to load insights'))
      .finally(() => setLoading(false));
  }, []);

  // Dismiss an insight (local state only — backend generates fresh)
  const _dismissInsight = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} insight(s)?`)) return;
    try {
      toast.success(`Deleted ${ids.length} insight(s)`);
      setDismissed(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.add(id));
        return next;
      });
      clearSelection();
    } catch {
      toast.error('Bulk delete failed');
    }
  }

  const filteredInsights = allInsights.filter((insight) => {
    if (dismissed.has(insight.id)) return false;
    if (severityFilter !== 'all' && insight.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && insight.category !== categoryFilter) return false;
    return true;
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

  return (
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

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Critical Insights', value: criticalCount, icon: AlertTriangle, color: 'text-red-400' },
          { label: 'High Priority', value: highCount, icon: TrendingUp, color: 'text-orange-400' },
          { label: 'Total Insights', value: filteredInsights.length, icon: Lightbulb, color: 'text-amber-400' },
          { label: 'Avg Confidence', value: `${avgConfidence}%`, icon: Target, color: 'text-emerald-400' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={String(kpi.label)} className="card p-4">
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
        <div className="card p-5">
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

        <div className="card p-5">
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

      {/* Filters */}
      <div className="card p-4 bg-gray-800/50">
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
    </div>
  );
}
