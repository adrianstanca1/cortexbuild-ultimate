import React, { useState, useEffect, useCallback } from 'react';
import { auditApi } from '@/services/api';
import { toast } from 'sonner';
import {
  Filter,
  TrendingUp,
  CheckCircle,
  X,
  Clock,
  MapPin,
  Loader2,
  ChevronDown,
  ChevronUp,
  Menu,
  Edit,
  Delete,
} from 'lucide-react';

interface AuditEntry {
  id: number;
  user_id: string;
  action: string;
  table_name: string;
  record_id: number;
  changes: string;
  created_at: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface AuditStats {
  total_entries: number;
  today_entries: number;
  week_entries: number;
  month_entries: number;
}

interface AuditLogProps {
  initialFilterAction?: string;
  initialFilterTable?: string;
}

export function AuditLog({
  initialFilterAction = 'all',
  initialFilterTable = 'all',
}: AuditLogProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    total_entries: 0,
    today_entries: 0,
    week_entries: 0,
    month_entries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>(
    initialFilterAction
  );
  const [filterTable, setFilterTable] = useState<string>(
    initialFilterTable
  );
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
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
  }, [filterAction, filterTable]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExpand = (id: number) => {
    setExpandedId(id === expandedId ? null : id);
  };

  const getStatusColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'text-emerald-400';
      case 'update':
        return 'text-blue-400';
      case 'delete':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Audit Log</h2>
        <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-400"
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <select
              value={filterTable}
              onChange={(e) => setFilterTable(e.target.value)}
              className="border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-400"
            >
              <option value="all">All Tables</option>
              <option value="projects">Projects</option>
              <option value="tasks">Tasks</option>
              <option value="users">Users</option>
              <option value="materials">Materials</option>
              <option value="expenses">Expenses</option>
              <option value="invoices">Invoices</option>
              <option value="change_orders">Change Orders</option>
              <option value="reports">Reports</option>
              <option value="settings">Settings</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 mx-auto mb-4 text-emerald-400" />
          <p className="text-gray-500">Loading audit log...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No audit entries found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Record ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Changes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 flex items-center gap-3">
                      {entry.user?.avatar ? (
                        <img
                          src={entry.user.avatar}
                          alt={`${entry.user.name}'s avatar`}
                          className="h-8 w-8 rounded-full border border-gray-200"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {entry.user?.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium">{entry.user?.name ?? 'Unknown User'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          entry.action
                        )} bg-${entry.action === 'create'
                          ? 'emerald'
                          : entry.action === 'update'
                            ? 'blue'
                            : 'red'}-500/20`}
                      >
                        {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 capitalize">{entry.table_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{entry.record_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">{entry.changes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4">
            <div className="text-sm text-gray-500">
              Showing {entries.length} entries
            </div>
            <div className="flex items-center gap-4 mt-3 sm:mt-0">
              <button
                onClick={() => {
                  setFilterAction('all');
                  setFilterTable('all');
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
