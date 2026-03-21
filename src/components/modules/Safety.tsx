// Module: Safety — CortexBuild Ultimate
import { useState } from 'react';
import {
  Plus, AlertCircle, CheckCircle2, Clock, Shield, Zap, BarChart3, X,
  TrendingDown
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { safetyIncidents, safetyTrendData } from '../../data/mockData';
import type { SafetyIncident } from '../../types';
import clsx from 'clsx';

export function Safety() {
  const [filter, setFilter] = useState<SafetyIncident['type'] | 'all'>('all');
  const [showLogIncident, setShowLogIncident] = useState(false);

  const typeIcons: Record<SafetyIncident['type'], React.FC<{ className?: string }>> = {
    incident: AlertCircle,
    'near-miss': Clock,
    hazard: Zap,
    inspection: CheckCircle2,
    'toolbox-talk': BarChart3,
    'mewp-check': Shield
  };

  const severityConfig: Record<SafetyIncident['severity'], { label: string; color: string; bg: string }> = {
    fatal: { label: 'Fatal', color: 'text-red-400', bg: 'bg-red-500/20' },
    serious: { label: 'Serious', color: 'text-orange-400', bg: 'bg-orange-500/20' },
    moderate: { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    minor: { label: 'Minor', color: 'text-blue-400', bg: 'bg-blue-500/20' }
  };

  const statusConfig: Record<SafetyIncident['status'], { label: string; color: string; bg: string }> = {
    open: { label: 'Open', color: 'text-red-400', bg: 'bg-red-500/20' },
    investigating: { label: 'Investigating', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    resolved: { label: 'Resolved', color: 'text-blue-400', bg: 'bg-blue-500/20' },
    closed: { label: 'Closed', color: 'text-green-400', bg: 'bg-green-500/20' }
  };

  const filteredIncidents = filter === 'all' ? safetyIncidents : safetyIncidents.filter(i => i.type === filter);
  const incidentCount = safetyIncidents.filter(i => i.type === 'incident').length;
  const nearMissCount = safetyIncidents.filter(i => i.type === 'near-miss').length;
  const toolboxTalkCount = safetyIncidents.filter(i => i.type === 'toolbox-talk').length;
  const mewpCheckCount = safetyIncidents.filter(i => i.type === 'mewp-check').length;

  const incidentTypeChart = [
    { name: 'Incidents', value: incidentCount },
    { name: 'Near Misses', value: nearMissCount },
    { name: 'Toolbox Talks', value: toolboxTalkCount },
    { name: 'MEWP Checks', value: mewpCheckCount }
  ];

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Safety & HSE</h1>
        <button
          onClick={() => setShowLogIncident(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-red-500 hover:to-red-600"
        >
          <Plus className="h-4 w-4" />
          Log Incident
        </button>
      </div>

      {/* Top Banner */}
      <div className="mb-8 rounded-2xl border border-emerald-800/30 bg-gradient-to-r from-emerald-900/30 to-emerald-800/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="h-8 w-8 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-white">18 Incident-Free Days</p>
              <p className="text-sm text-emerald-300">RIDDOR incidents: 0 this year</p>
            </div>
          </div>
          <TrendingDown className="h-8 w-8 text-green-400 flex-shrink-0" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-5 gap-4">
        {[
          { label: 'Safety Score', value: '94%', icon: Shield, color: 'text-emerald-400' },
          { label: 'Total Incidents YTD', value: incidentCount.toString(), icon: AlertCircle, color: 'text-red-400' },
          { label: 'Near Misses YTD', value: nearMissCount.toString(), icon: Clock, color: 'text-yellow-400' },
          { label: 'Toolbox Talks', value: toolboxTalkCount.toString(), icon: BarChart3, color: 'text-blue-400' },
          { label: 'MEWP Checks', value: mewpCheckCount.toString(), icon: Zap, color: 'text-purple-400' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400">{kpi.label}</p>
                <Icon className={clsx('h-4 w-4', kpi.color)} />
              </div>
              <p className={clsx('text-2xl font-bold', kpi.color)}>{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {[
          { id: 'all', label: 'All' },
          { id: 'incident', label: 'Incidents' },
          { id: 'near-miss', label: 'Near Misses' },
          { id: 'toolbox-talk', label: 'Toolbox Talks' },
          { id: 'mewp-check', label: 'MEWP Checks' },
          { id: 'hazard', label: 'Hazards' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as SafetyIncident['type'] | 'all')}
            className={clsx(
              'rounded-full px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap',
              filter === tab.id
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts Row */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        {/* Safety Trend */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Safety Trend (6 months)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={safetyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} />
              <Legend />
              <Line type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="nearMisses" stroke="#fbbf24" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Incident Type Chart */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Incident Type Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={incidentTypeChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} />
              <Bar dataKey="value" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Incident List */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Recent Safety Events</h3>
        <div className="space-y-3">
          {filteredIncidents.map(incident => {
            const Icon = typeIcons[incident.type];
            const sev = severityConfig[incident.severity];
            const stat = statusConfig[incident.status];
            return (
              <div
                key={incident.id}
                className="rounded-lg border border-gray-800 bg-gray-800/50 p-4 hover:border-gray-700 transition-colors"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-white">{incident.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{incident.description}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-gray-500">Project:</span>
                        <span className="text-gray-400">{incident.project}</span>
                        <span className="text-gray-500 ml-2">Reported by:</span>
                        <span className="text-gray-400">{incident.reportedBy}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={clsx('rounded-full px-2.5 py-1 text-xs font-bold', sev.bg, sev.color)}>
                      {sev.label}
                    </span>
                    <span className={clsx('rounded-full px-2.5 py-1 text-xs font-bold', stat.bg, stat.color)}>
                      {stat.label}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{incident.date}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Log Incident Modal */}
      {showLogIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Log Safety Incident</h2>
              <button
                onClick={() => setShowLogIncident(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400">Type</label>
                <select className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:border-red-500">
                  <option>Incident</option>
                  <option>Near Miss</option>
                  <option>Hazard</option>
                  <option>Toolbox Talk</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400">Title</label>
                <input type="text" placeholder="Incident title..." className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:border-red-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400">Description</label>
                <textarea placeholder="What happened..." className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:border-red-500 h-24 resize-none"></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400">Severity</label>
                <select className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:border-red-500">
                  <option>Minor</option>
                  <option>Moderate</option>
                  <option>Serious</option>
                  <option>Fatal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400">Project</label>
                <select className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:border-red-500">
                  <option>Select project...</option>
                  <option>Canary Wharf Office Complex</option>
                  <option>Manchester City Apartments</option>
                  <option>Birmingham Road Bridge</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => setShowLogIncident(false)}
                  className="flex-1 rounded-lg bg-gray-800 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-700 py-2 text-sm font-medium text-white transition hover:from-red-500 hover:to-red-600">
                  Log Incident
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
