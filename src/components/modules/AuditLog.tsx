import React, { useState } from 'react';
import { backupApi } from '@/services/api';
import { toast } from 'sonner';
import {
  TrendingUp,
  X,
  AlertTriangle,
  Download,
  Activity,
  Users,
  Shield,
  CheckSquare,
  Square,
  FileText,
} from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { useAuditLog } from '../../hooks/useData';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';

type AnyRow = Record<string, unknown>;
type AuditEntry = AnyRow & { id: number; user_id: string; action: string; table_name: string; record_id: number; changes: string; created_at: string; user?: { name: string; avatar?: string }; ip_address?: string };
type AuditStats = AnyRow & { total_entries: number; today_entries: number; week_entries: number; month_entries: number; active_users: number; security_alerts: number };

type SubTab = 'activity' | 'users' | 'changes' | 'security' | 'export';

const TABS: { key: SubTab; label: string; icon: React.ElementType }[] = [
  { key: 'activity', label: 'Activity Log', icon: Activity },
  { key: 'users', label: 'User Actions', icon: Users },
  { key: 'changes', label: 'Data Changes', icon: TrendingUp },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'export', label: 'Export', icon: Download },
];

export function AuditLog() {
  const { useList, useStats } = useAuditLog();
  const { data: rawEntries = [], isLoading } = useList();
  const { data: rawStats } = useStats();

  const entries = (rawEntries as AnyRow[]) as AuditEntry[];
  const stats: AuditStats = (rawStats ?? {}) as AuditStats;

  // Client-side filtering
  const filteredEntries = entries.filter(e => {
    if (filterAction !== 'all' && e.action !== filterAction) return false;
    if (filterTable !== 'all' && e.table_name !== filterTable) return false;
    if (filterUser !== 'all' && e.user_id !== filterUser) return false;
    if (searchQuery && !e.table_name.includes(searchQuery) && !(e.user?.name ?? '').includes(searchQuery)) return false;
    return true;
  });

  const [subTab, setSubTab] = useState<SubTab>('activity');
  const [filterAction, setFilterAction] = useState('all');
  const [filterTable, setFilterTable] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exporting, setExporting] = useState(false);

  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'create':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'update':
        return 'bg-blue-500/20 text-blue-400';
      case 'delete':
        return 'bg-red-500/20 text-red-400';
      case 'view':
        return 'bg-cyan-500/20 text-cyan-400';
      case 'export':
        return 'bg-purple-500/20 text-purple-400';
      case 'approve':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getSecurityLevel = (level: string): string => {
    switch (level) {
      case 'high':
        return 'bg-red-500/20 text-red-400';
      case 'medium':
        return 'bg-amber-500/20 text-amber-400';
      case 'low':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const uniqueUsers = Array.from(
    new Map(entries.map(e => [e.user_id, e.user])).entries()
  );

  const activityToday = entries.filter(e => {
    const entryDate = new Date(String(e.created_at)).toDateString();
    return entryDate === new Date().toDateString();
  });

  return (
    <>
      <ModuleBreadcrumbs currentModule="audit-log" onNavigate={() => {}} />
      <div className="space-y-6">
      {/* Header with KPIs */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Audit & Compliance Log</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="input input-bordered p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Events Today</p>
                <p className="text-xl font-bold text-white">{Number(activityToday.length)}</p>
              </div>
              <Activity className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <div className="input input-bordered p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Active Users</p>
                <p className="text-xl font-bold text-white">{Number(stats.active_users)}</p>
              </div>
              <Users className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
          <div className="input input-bordered p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Security Alerts</p>
                <p className="text-xl font-bold text-white">{Number(stats.security_alerts)}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
          </div>
          <div className="input input-bordered p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">This Week</p>
                <p className="text-xl font-bold text-white">{Number(stats.week_entries)}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
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
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Activity Log Tab */}
      {subTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by user or module..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 btn text-white text-sm placeholder-gray-500"
            />
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="bg-gray-800 border border-gray-700 btn text-white text-sm"
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="view">View</option>
              <option value="export">Export</option>
            </select>
            <select
              value={filterTable}
              onChange={e => setFilterTable(e.target.value)}
              className="bg-gray-800 border border-gray-700 btn text-white text-sm"
            >
              <option value="all">All Modules</option>
              <option value="projects">Projects</option>
              <option value="invoices">Invoices</option>
              <option value="safety">Safety</option>
              <option value="rfis">RFIs</option>
              <option value="documents">Documents</option>
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading audit log...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No audit entries found"
              description="Activity will appear here once users start interacting with the system."
            />
          ) : (
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300 w-10"></th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Time</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">User</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Action</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Module</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Description</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredEntries.slice(0, 100).map(entry => {
                      const isSelected = selectedIds.has(String(entry.id));
                      return (
                      <tr key={Number(entry.id)} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <button type="button" onClick={e => { e.stopPropagation(); toggle(String(entry.id)); }}>
                            {isSelected ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {String(new Date(String(entry.created_at)).toLocaleString())}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
                              {String(entry.user?.name ?? '?')[0]}
                            </div>
                            <span className="text-gray-300 text-sm">{String(entry.user?.name ?? 'Unknown')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(String(entry.action))}`}>
                            {String(entry.action).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-sm capitalize">
                          {String(entry.table_name)}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm max-w-xs">
                          {String(entry.record_id)}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {String(entry.ip_address ?? '—')}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <BulkActionsBar
            selectedIds={Array.from(selectedIds)}
            actions={[]}
            onClearSelection={clearSelection}
          />
        </div>
      )}

      {/* User Actions Tab */}
      {subTab === 'users' && (
        <div className="space-y-4">
          <select
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
            className="bg-gray-800 border border-gray-700 btn text-white text-sm max-w-sm"
          >
            <option value="all">All Users</option>
            {uniqueUsers.map(([userId, user]) => (
              <option key={String(userId)} value={String(userId)}>
                {String(user?.name ?? 'Unknown')}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-1 gap-4">
            {uniqueUsers.map(([userId, user]) => {
              const userEntries = entries.filter(e => e.user_id === userId);
              return (
                <div key={String(userId)} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium text-white">
                        {String(user?.name ?? '?')[0]}
                      </div>
                      <div>
                        <p className="font-medium text-white">{String(user?.name ?? 'Unknown')}</p>
                        <p className="text-xs text-gray-400">{Number(userEntries.length)} actions this month</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">
                      Last: {String(new Date(String(userEntries[0]?.created_at)).toLocaleDateString())}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-800">
                    <div className="text-center">
                      <p className="text-lg font-bold text-cyan-400">
                        {Number(userEntries.filter(e => e.action === 'view').length)}
                      </p>
                      <p className="text-xs text-gray-400">Views</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-400">
                        {Number(userEntries.filter(e => e.action === 'create').length)}
                      </p>
                      <p className="text-xs text-gray-400">Created</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-400">
                        {Number(userEntries.filter(e => e.action === 'update').length)}
                      </p>
                      <p className="text-xs text-gray-400">Updated</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-400">
                        {Number(userEntries.filter(e => e.action === 'delete').length)}
                      </p>
                      <p className="text-xs text-gray-400">Deleted</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Data Changes Tab */}
      {subTab === 'changes' && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <div className="flex gap-3">
              <select
                value={filterTable}
                onChange={e => setFilterTable(e.target.value)}
                className="bg-gray-800 border border-gray-700 btn text-white text-sm flex-1"
              >
                <option value="all">All Modules</option>
                <option value="projects">Projects</option>
                <option value="invoices">Invoices</option>
                <option value="safety">Safety</option>
              </select>
              <button className="px-4 py-2 btn btn-primary rounded-lg text-sm font-medium">
                <Download className="h-4 w-4 inline mr-2" />
                Export CSV
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
            {entries
              .filter(e => e.action === 'update')
              .slice(0, 50)
              .map(entry => (
                <div key={Number(entry.id)} className="p-4 hover:bg-gray-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white">
                      {String(entry.user?.name ?? 'Unknown')} updated {String(entry.table_name)}
                    </p>
                    <span className="text-xs text-gray-400">
                      {String(new Date(String(entry.created_at)).toLocaleString())}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    <p>Record ID: {Number(entry.record_id)}</p>
                    <p className="text-gray-500 mt-1">{String(entry.changes)}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {subTab === 'security' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Failed Logins', value: 0, level: 'high', icon: X },
              { label: 'Password Resets', value: 0, level: 'medium', icon: Shield },
              { label: 'Permission Changes', value: 0, level: 'low', icon: AlertTriangle },
            ].map((item, idx) => (
              <div key={idx} className={`border rounded-lg p-4 ${getSecurityLevel(item.level)}`}>
                <p className="text-xs uppercase mb-1">
                  {item.label}
                </p>
                <p className="text-2xl font-bold">{Number(item.value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Tab */}
      {subTab === 'export' && (
        <div className="space-y-6">
          <div className="card p-6 max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Export Audit Trail</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Date From</label>
                <input
                  id="audit-date-from"
                  type="date"
                  value={filterDateFrom}
                  onChange={e => setFilterDateFrom(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 btn text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Date To</label>
                <input
                  id="audit-date-to"
                  type="date"
                  value={filterDateTo}
                  onChange={e => setFilterDateTo(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 btn text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Format</label>
                <select
                  id="audit-export-format"
                  value={exportFormat}
                  onChange={e => setExportFormat(e.target.value as 'csv' | 'json')}
                  className="w-full bg-gray-800 border border-gray-700 btn text-white text-sm"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setExporting(true);
                  try {
                    const data = await backupApi.exportTable('audit_log', exportFormat);
                    if (exportFormat === 'csv') {
                      const blob = new Blob([data as string], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `audit-log-${Date.now()}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } else {
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `audit-log-${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                    toast.success('Audit log exported');
                  } catch {
                    toast.error('Export failed');
                  } finally {
                    setExporting(false);
                  }
                }}
                disabled={exporting}
                className="w-full px-4 py-2 btn btn-primary disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setExporting(true);
                  try {
                    const data = await backupApi.exportAll();
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `cortexbuild-full-backup-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success('Full backup exported');
                  } catch {
                    toast.error('Backup failed');
                  } finally {
                    setExporting(false);
                  }
                }}
                disabled={exporting}
                className="w-full px-4 py-2 bg-green-600/20 hover:bg-green-600/30 disabled:opacity-50 text-green-400 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Full Platform Backup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
export default AuditLog;
