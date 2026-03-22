import { useState, useEffect } from 'react';
import React from 'react';
import {
  Shield,
  Clock,
  RefreshCw,
  Filter,
  TrendingUp,
  Database,
  Edit,
  Trash2,
  Plus,
  User,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';
import { auditApi } from '../../services/api';
import { toast } from 'sonner';
import clsx from 'clsx';

interface AuditEntry {
  id: number;
  table_name: string;
  record_id: string;
  action: 'create' | 'update' | 'delete';
  changes: Record<string, unknown>;
  user_id: string;
  ip_address?: string;
  created_at: string;
}

interface AuditStats {
  byAction: Array<{ action: string; count: string | number }>;
  byTable: Array<{ table_name: string; count: string | number }>;
  last24Hours: number;
}

function exportToJSON(data: AuditEntry[], filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().slice(0,10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast.success(`Exported ${data.length} records`);
}

export function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterTable, setFilterTable] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [filterAction, filterTable]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [entriesData, statsData] = await Promise.all([
        auditApi.getAll({ limit: 200 }),
        auditApi.getStats(),
      ]);
      let filtered = entriesData as unknown as AuditEntry[];
      if (filterAction !== 'all') {
        filtered = filtered.filter(e => e.action === filterAction);
      }
      if (filterTable !== 'all') {
        filtered = filtered.filter(e => e.table_name === filterTable);
      }
      setEntries(filtered);
      setStats(statsData as unknown as AuditStats);
    } catch (err) {
      toast.error('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  const actionColors: Record<string, { bg: string; text: string; icon: typeof Plus }> = {
    create: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: Plus },
    update: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Edit },
    delete: { bg: 'bg-red-500/20', text: 'text-red-400', icon: Trash2 },
  };

  const uniqueTables = [...new Set(entries.map(e => e.table_name))];

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white font-display flex items-center gap-3">
            <Shield className="h-7 w-7 text-blue-400" />
            Audit Log
          </h1>
          <p className="text-sm text-gray-500">Track all data changes across the platform</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-4 py-2"
          >
            <option value="all">All Actions</option>
            <option value="create">Created</option>
            <option value="update">Updated</option>
            <option value="delete">Deleted</option>
          </select>
          <button onClick={() => exportToJSON(entries, 'audit_log')} className="btn btn-secondary">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button onClick={loadData} className="btn btn-secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.last24Hours}</p>
                <p className="text-xs text-gray-500">Last 24 hours</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Plus className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {stats.byAction.find(a => a.action === 'create')?.count || 0}
                </p>
                <p className="text-xs text-gray-500">Creates</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Edit className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {stats.byAction.find(a => a.action === 'update')?.count || 0}
                </p>
                <p className="text-xs text-gray-500">Updates</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Database className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {stats.byTable.reduce((sum, t) => sum + parseInt(String(t.count), 10), 0)}
                </p>
                <p className="text-xs text-gray-500">Total tables</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="card">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Activity Feed</h3>
              <select
                value={filterTable}
                onChange={(e) => setFilterTable(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-3 py-1"
              >
                <option value="all">All Tables</option>
                {uniqueTables.map(table => (
                  <option key={table} value={table}>{table.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="divide-y divide-gray-800">
              {loading ? (
                <div className="p-8 flex justify-center">
                  <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                </div>
              ) : entries.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No audit entries found</div>
              ) : (
                entries.map(entry => {
                  const colors = actionColors[entry.action] || actionColors.update;
                  const Icon = colors.icon;
                  const isExpanded = expandedId === entry.id;
                  return (
                    <div key={entry.id} className="p-4 hover:bg-gray-800/30 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={clsx('p-2 rounded-lg shrink-0', colors.bg)}>
                          <Icon className={clsx('h-4 w-4', colors.text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={clsx('px-2 py-0.5 rounded text-xs font-medium uppercase', colors.bg, colors.text)}>
                              {entry.action}
                            </span>
                            <span className="text-sm text-gray-400">{entry.table_name}</span>
                            <span className="text-xs text-gray-600">#{entry.record_id}</span>
                          </div>
                          {entry.changes && (
                            <div className="text-xs text-gray-500 mt-1">
                              {Object.keys(entry.changes).length} field(s) changed
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {entry.user_id && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {entry.user_id}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(entry.created_at)}
                            </span>
                            {entry.ip_address && (
                              <span>{entry.ip_address}</span>
                            )}
                          </div>
                        </div>
                        {entry.changes && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                          </button>
                        )}
                      </div>
                      {isExpanded && entry.changes && (
                        <div className="mt-3 ml-12 p-3 bg-gray-800/50 rounded-lg text-xs">
                          <pre className="text-gray-400 overflow-x-auto">
                            {JSON.stringify(entry.changes, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-4">
            <h4 className="text-sm font-bold text-white mb-3">By Table</h4>
            <div className="space-y-2">
              {stats?.byTable.slice(0, 8).map(table => (
                <div key={table.table_name} className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{table.table_name.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-medium text-white">{table.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h4 className="text-sm font-bold text-white mb-3">By Action</h4>
            <div className="space-y-2">
              {stats?.byAction.map(action => {
                const colors = actionColors[action.action];
                return (
                  <div key={action.action} className="flex justify-between items-center">
                    <span className={clsx('flex items-center gap-2 text-sm', colors?.text)}>
                      {React.createElement(colors?.icon || Edit, { className: 'h-4 w-4' })}
                      {action.action}
                    </span>
                    <span className="text-sm font-medium text-white">{action.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
