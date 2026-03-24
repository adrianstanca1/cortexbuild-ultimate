import React, { useState } from 'react';
import {
  Activity, Users, AlertTriangle, Download, Shield, BarChart2, Filter,
  Search, Calendar, Settings, TrendingUp, Lock, Eye, CheckCircle,
} from 'lucide-react';

type SubTab = 'activity' | 'users' | 'events' | 'compliance' | 'export';
type AnyRow = Record<string, unknown>;

interface AuditEntry extends AnyRow {
  id: string;
  timestamp: string;
  user: string;
  userInitials: string;
  action: 'Created' | 'Updated' | 'Deleted' | 'Viewed' | 'Exported' | 'Approved';
  module: string;
  record: string;
  ipAddress: string;
  device: string;
  details?: string;
}

const TABS: { key: SubTab; label: string; icon: React.ElementType }[] = [
  { key: 'activity', label: 'Activity Log', icon: Activity },
  { key: 'users', label: 'User Actions', icon: Users },
  { key: 'events', label: 'System Events', icon: AlertTriangle },
  { key: 'compliance', label: 'Compliance', icon: Shield },
  { key: 'export', label: 'Export', icon: Download },
];

const MOCK_ENTRIES: AuditEntry[] = [
  { id: '1', timestamp: '2026-03-24 14:32:15', user: 'John Smith', userInitials: 'JS', action: 'Updated', module: 'Projects', record: 'PRJ-001', ipAddress: '192.168.1.45', device: 'Chrome / Windows' },
  { id: '2', timestamp: '2026-03-24 14:28:42', user: 'Sarah Johnson', userInitials: 'SJ', action: 'Created', module: 'Invoices', record: 'INV-2026-045', ipAddress: '192.168.1.52', device: 'Safari / MacOS' },
  { id: '3', timestamp: '2026-03-24 14:15:08', user: 'Mike Chen', userInitials: 'MC', action: 'Approved', module: 'CIS Returns', record: 'CIS-FEB-2026', ipAddress: '192.168.1.88', device: 'Firefox / Linux' },
  { id: '4', timestamp: '2026-03-24 13:52:33', user: 'Emma Wilson', userInitials: 'EW', action: 'Exported', module: 'Safety Reports', record: 'SAFETY-Q1-2026', ipAddress: '192.168.1.76', device: 'Chrome / Windows' },
  { id: '5', timestamp: '2026-03-24 13:41:19', user: 'John Smith', userInitials: 'JS', action: 'Viewed', module: 'Financial Summary', record: 'FIN-MAR-2026', ipAddress: '192.168.1.45', device: 'Chrome / Windows' },
  { id: '6', timestamp: '2026-03-24 13:28:56', user: 'Lisa Park', userInitials: 'LP', action: 'Updated', module: 'RFIs', record: 'RFI-089', ipAddress: '192.168.2.12', device: 'Edge / Windows' },
  { id: '7', timestamp: '2026-03-24 13:15:42', user: 'David Brown', userInitials: 'DB', action: 'Created', module: 'Punch List', record: 'PL-RIVERSIDE-01', ipAddress: '192.168.1.34', device: 'Chrome / iOS' },
  { id: '8', timestamp: '2026-03-24 12:58:07', user: 'Sarah Johnson', userInitials: 'SJ', action: 'Deleted', module: 'Documents', record: 'DOC-DRAFT-234', ipAddress: '192.168.1.52', device: 'Safari / MacOS' },
  { id: '9', timestamp: '2026-03-24 12:42:18', user: 'Mike Chen', userInitials: 'MC', action: 'Approved', module: 'Invoices', record: 'INV-2026-044', ipAddress: '192.168.1.88', device: 'Firefox / Linux' },
  { id: '10', timestamp: '2026-03-24 12:21:54', user: 'Emma Wilson', userInitials: 'EW', action: 'Updated', module: 'Safety', record: 'INC-2026-012', ipAddress: '192.168.1.76', device: 'Chrome / Windows' },
];

const getActionColor = (action: string): string => {
  switch (action) {
    case 'Created':
      return 'bg-emerald-500/20 text-emerald-400';
    case 'Updated':
      return 'bg-blue-500/20 text-blue-400';
    case 'Deleted':
      return 'bg-red-500/20 text-red-400';
    case 'Viewed':
      return 'bg-cyan-500/20 text-cyan-400';
    case 'Exported':
      return 'bg-purple-500/20 text-purple-400';
    case 'Approved':
      return 'bg-emerald-500/20 text-emerald-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

export function AuditLog() {
  const [subTab, setSubTab] = useState<SubTab>('activity');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [dateRange, setDateRange] = useState('7days');

  const filteredEntries = MOCK_ENTRIES.filter(entry => {
    const matchesSearch = entry.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.record.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'All' || entry.action === actionFilter;
    const matchesModule = moduleFilter === 'All' || entry.module === moduleFilter;
    return matchesSearch && matchesAction && matchesModule;
  });

  const userSummary = Array.from(
    new Map(MOCK_ENTRIES.map(e => [e.user, { name: e.user, initials: e.userInitials, count: 0 }])).entries()
  ).map(([_, user]) => ({
    ...user,
    count: MOCK_ENTRIES.filter(e => e.user === user.name).length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">Audit & Compliance Log</h1>
          <p className="text-sm text-gray-400 mt-1">Complete system activity trail for compliance & security</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase font-bold mb-1">Events Today</p>
          <p className="text-2xl font-bold text-orange-500">{MOCK_ENTRIES.length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase font-bold mb-1">Active Users</p>
          <p className="text-2xl font-bold text-blue-500">{userSummary.length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase font-bold mb-1">Data Changes</p>
          <p className="text-2xl font-bold text-emerald-500">{MOCK_ENTRIES.filter(e => ['Created', 'Updated', 'Deleted'].includes(e.action)).length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase font-bold mb-1">Deletions</p>
          <p className="text-2xl font-bold text-red-500">{MOCK_ENTRIES.filter(e => e.action === 'Deleted').length}</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-gray-700 flex gap-1 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                subTab === t.key
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ACTIVITY TAB */}
      {subTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by user, module, or record..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500"
              />
            </div>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
            >
              <option>All Actions</option>
              <option>Created</option>
              <option>Updated</option>
              <option>Deleted</option>
              <option>Viewed</option>
              <option>Exported</option>
              <option>Approved</option>
            </select>
            <select
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
            >
              <option>All Modules</option>
              <option>Projects</option>
              <option>Invoices</option>
              <option>CIS Returns</option>
              <option>Safety</option>
              <option>Documents</option>
            </select>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Timestamp</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Module</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Record</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">IP Address</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-800/50 transition">
                      <td className="px-4 py-3 text-gray-300 text-xs">{String(entry.timestamp)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-orange-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {String(entry.userInitials)}
                          </div>
                          <span className="text-gray-300 text-sm">{String(entry.user)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(String(entry.action))}`}>
                          {String(entry.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm capitalize">{String(entry.module)}</td>
                      <td className="px-4 py-3 text-gray-300 text-sm font-mono">{String(entry.record)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{String(entry.ipAddress)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{String(entry.device)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* USER ACTIONS TAB */}
      {subTab === 'users' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Top Active Users</h3>
              {userSummary.sort((a, b) => b.count - a.count).slice(0, 5).map((user) => (
                <div key={user.name} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                        {user.initials}
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.count} actions</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-orange-500">{user.count}</span>
                  </div>
                  <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500" style={{ width: `${(user.count / 10) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Action Breakdown</h3>
              {['Created', 'Updated', 'Viewed', 'Deleted', 'Approved'].map((action) => {
                const count = MOCK_ENTRIES.filter(e => e.action === action).length;
                return (
                  <div key={action} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white">{action}</p>
                      <span className="text-lg font-bold text-white">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${(count / 10) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM EVENTS TAB */}
      {subTab === 'events' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'API Calls', value: 1247, icon: '🔌', color: 'bg-blue-900/30 border-blue-700' },
              { label: 'Failed Logins', value: 2, icon: '⚠️', color: 'bg-red-900/30 border-red-700' },
              { label: 'Config Changes', value: 8, icon: '⚙️', color: 'bg-orange-900/30 border-orange-700' },
              { label: 'Integration Syncs', value: 34, icon: '🔄', color: 'bg-emerald-900/30 border-emerald-700' },
            ].map((item) => (
              <div key={item.label} className={`border rounded-xl p-4 ${item.color}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">{item.label}</p>
                    <p className="text-2xl font-bold text-white">{item.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Event Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Details</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {[
                  { time: '14:32', type: 'API Call', details: 'GET /projects/PRJ-001', status: '200 OK' },
                  { time: '14:28', type: 'Export', details: 'Monthly CIS Return CSV', status: 'Success' },
                  { time: '13:52', type: 'Integration', details: 'Xero sync completed', status: '156 records' },
                  { time: '13:41', type: 'Config Change', details: 'Updated user permissions', status: 'Applied' },
                ].map((event, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-400 text-xs">{event.time}</td>
                    <td className="px-4 py-3 text-white text-sm font-medium">{event.type}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{event.details}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded text-xs font-bold bg-emerald-900/40 text-emerald-300">{event.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPLIANCE TAB */}
      {subTab === 'compliance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Lock size={20} className="text-blue-400" />
                GDPR Data Access
              </h3>
              <div className="space-y-2">
                {['Right-to-Access Requests', 'Data Export Requests', 'Deletion Requests', 'Consent Records'].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                    <span className="text-gray-300">{item}</span>
                    <span className="text-lg font-bold text-white">3</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Eye size={20} className="text-emerald-400" />
                Document Access Tracking
              </h3>
              <div className="space-y-2">
                {['Financial Records Accessed', 'CIS Data Viewed', 'Safety Reports Downloaded', 'Contract Reviews'].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                    <span className="text-gray-300">{item}</span>
                    <span className="text-lg font-bold text-white">{Math.floor(Math.random() * 20)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Shield size={20} className="text-orange-400" />
                Financial Access Log
              </h3>
              <p className="text-sm text-gray-400 mb-4">Last 30 days of financial record access</p>
              <div className="space-y-2">
                {['Invoice Viewing: 45', 'Payment Processing: 12', 'Budget Review: 28', 'CIS Deduction Access: 34'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h3 className="text-lg font-bold text-white mb-4">Compliance Status</h3>
              <div className="space-y-3">
                {['GDPR Compliant', 'Data Retention Policy Met', 'Access Control Enforced', 'Audit Trail Complete'].map((item) => (
                  <div key={item} className="flex items-center gap-3 p-3 bg-emerald-900/30 border border-emerald-700 rounded-lg">
                    <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-emerald-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT TAB */}
      {subTab === 'export' && (
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Export Audit Log</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
                <select className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>Last year</option>
                  <option>All time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
                <select className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm">
                  <option>CSV</option>
                  <option>PDF</option>
                  <option>Excel</option>
                  <option>JSON</option>
                </select>
              </div>
            </div>
            <button className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition flex items-center justify-center gap-2">
              <Download size={18} />
              Export Now
            </button>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Scheduled Reports</h3>
            <div className="space-y-3">
              {['Weekly Audit Summary (Every Monday 09:00)', 'Monthly Compliance Report (1st of month)', 'Quarterly Security Review (Quarterly)'].map((report) => (
                <div key={report} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                  <span className="text-gray-300">{report}</span>
                  <button className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-medium">
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Data Retention Policy</h3>
            <div className="space-y-3">
              {[
                { label: '90 Days', desc: 'Automatic deletion of logs older than 90 days' },
                { label: '1 Year', desc: 'Extended retention for compliance purposes' },
                { label: '7 Years', desc: 'Long-term archive for financial audits' },
              ].map((policy) => (
                <div key={policy.label} className="flex items-start justify-between p-3 bg-gray-900 rounded-lg">
                  <div>
                    <p className="font-medium text-white">{policy.label} Retention</p>
                    <p className="text-xs text-gray-400 mt-1">{policy.desc}</p>
                  </div>
                  <input type="radio" name="retention" className="accent-orange-500 mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
