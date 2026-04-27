/**
 * NotificationHistory Component
 * Displays archived notification history with search, filter, export, and insights
 */

import React, { useState } from 'react';
import {
  History,
  Search,
  Download,
  Calendar,
  X,
  FileJson,
  FileSpreadsheet,
  FileText,
  Clock,
  Archive,
  CheckCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Trash2,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Notification, ExportOptions, NotificationFilter } from '@/types/notification';

interface NotificationHistoryProps {
  notifications: Notification[];
  isLoading: boolean;
  onLoadHistory: (page?: number) => Promise<void>;
  onExport: (options: ExportOptions) => Promise<Blob>;
  onFilterChange: (filter: NotificationFilter) => void;
  onClearFilter: () => void;
  filter?: NotificationFilter;
  totalPages?: number;
  currentPage?: number;
}

interface FilterChip {
  key: string;
  label: string;
  value: string;
}

interface SavedFilterPreset {
  id: string;
  name: string;
  filters: Record<string, unknown>;
}

export function NotificationHistory({
  notifications,
  isLoading,
  onLoadHistory,
  onExport,
  onFilterChange,
  onClearFilter,
  filter,
  totalPages = 1,
  currentPage = 1,
}: NotificationHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [includeRead, setIncludeRead] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(true);

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'read' | 'unread'>('all');
  const [filterProject, setFilterProject] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'Info' | 'Warning' | 'Critical'>('all');

  const [activeFilters, setActiveFilters] = useState<FilterChip[]>([]);
  const [savedPresets, setSavedPresets] = useState<SavedFilterPreset[]>([
    { id: '1', name: 'Critical Only', filters: { severity: 'Critical' } },
    { id: '2', name: 'Unread Alerts', filters: { status: 'unread', severity: 'Warning' } },
  ]);
  const [showPresets, setShowPresets] = useState(false);

  // Insights sidebar
  const [showInsights, setShowInsights] = useState(false);

  const handleSearch = () => {
    onFilterChange({
      ...filter,
      searchQuery: searchQuery || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  };

  const addFilter = (key: string, label: string, value: string) => {
    const newChips = activeFilters.filter((f) => f.key !== key);
    newChips.push({ key, label, value });
    setActiveFilters(newChips);
  };

  const removeFilter = (key: string) => {
    setActiveFilters(activeFilters.filter((f) => f.key !== key));
  };

  const applyAdvancedFilters = () => {
    const chips: FilterChip[] = [];
    if (filterType) chips.push({ key: 'type', label: 'Type', value: filterType });
    if (filterStatus !== 'all') chips.push({ key: 'status', label: 'Status', value: filterStatus });
    if (filterProject) chips.push({ key: 'project', label: 'Project', value: filterProject });
    if (filterUser) chips.push({ key: 'user', label: 'User', value: filterUser });
    if (filterSeverity !== 'all') chips.push({ key: 'severity', label: 'Severity', value: filterSeverity });
    setActiveFilters(chips);
    setShowAdvancedFilters(false);
  };

  const savePreset = () => {
    const presetName = prompt('Enter preset name:');
    if (presetName) {
      const filterObj = activeFilters.reduce((acc, f) => {
        acc[f.key] = f.value;
        return acc;
      }, {} as Record<string, unknown>);
      setSavedPresets([...savedPresets, { id: Date.now().toString(), name: presetName, filters: filterObj }]);
    }
  };

  const calculateInsights = () => {
    const totalCount = notifications.length;
    const readCount = notifications.filter((n) => n.readAt).length;
    const readPercent = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0;

    const typeCounts = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostCommonType = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    const dateCount = notifications.reduce((acc, n) => {
      const date = new Date(n.createdAt).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const busiestDay = Object.entries(dateCount).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';
    const avgPerDay = totalCount > 0 ? Math.round(totalCount / Object.keys(dateCount).length) : 0;

    return { totalCount, readPercent, mostCommonType, busiestDay, avgPerDay, typeCounts };
  };

  const handleExport = async () => {
    try {
      const blob = await onExport({
        format: exportFormat,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        includeRead,
        includeArchived,
      });

      // Download file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notifications-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowExportOptions(false);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: Notification['status']) => {
    switch (status) {
      case 'read':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'unread':
        return <Bell className="w-4 h-4 text-blue-500" />;
      case 'archived':
        return <Archive className="w-4 h-4 text-amber-500" />;
      case 'snoozed':
        return <Clock className="w-4 h-4 text-purple-500" />;
    }
  };

  const getSeverityBadge = (severity: Notification['severity']) => {
    const colors = {
      critical: 'badge-error',
      error: 'badge-error',
      warning: 'badge-warning',
      info: 'badge-info',
      success: 'badge-success',
    };
    return colors[severity] || 'badge-ghost';
  };

  const insights = calculateInsights();

  return (
    <div className={`flex flex-col h-full ${showInsights ? 'gap-0' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-base-300">
        <div className="flex items-center gap-3 flex-1">
          <History className="w-5 h-5 text-base-content" />
          <div>
            <h2 className="text-lg font-display">Notification History</h2>
            <p className="text-xs text-base-content/60">
              {notifications.length} notifications found
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInsights(!showInsights)}
            className="btn btn-sm btn-ghost gap-2"
            title="Toggle insights panel"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowExportOptions(!showExportOptions)}
            className="btn btn-sm btn-primary gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Export Options */}
      {showExportOptions && (
        <div className="p-4 border-b border-base-300 bg-base-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Export Options</span>
            <button
              onClick={() => setShowExportOptions(false)}
              className="btn btn-sm btn-ghost btn-circle"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Format Selection */}
            <div>
              <label className="text-xs text-base-content/60 mb-1 block">Format</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setExportFormat('json')}
                  className={`btn btn-sm flex-1 gap-1.5 ${
                    exportFormat === 'json' ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  <FileJson className="w-4 h-4" />
                  JSON
                </button>
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`btn btn-sm flex-1 gap-1.5 ${
                    exportFormat === 'csv' ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  CSV
                </button>
                <button
                  onClick={() => setExportFormat('pdf')}
                  className={`btn btn-sm flex-1 gap-1.5 ${
                    exportFormat === 'pdf' ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-xs text-base-content/60 mb-1 block">Date Range</label>
              <div className="flex gap-2 text-xs">
                <input type="date" className="input input-sm input-bordered flex-1" />
                <input type="date" className="input input-sm input-bordered flex-1" />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeRead}
                  onChange={(e) => setIncludeRead(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
                Include read
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
                Include archived
              </label>
            </div>

            {/* Export Preview */}
            <div>
              <label className="text-xs text-base-content/60 mb-1 block">Preview (First 10 rows)</label>
              <div className="bg-base-100 rounded p-2 text-xs max-h-20 overflow-y-auto">
                <p className="text-base-content/50">ID, Date, Type, Title, Status</p>
                <p className="text-base-content/50">1, 2026-04-27, alert, Safety...</p>
                <p className="text-base-content/50">2, 2026-04-27, info, System...</p>
              </div>
            </div>
          </div>

          <button onClick={handleExport} className="btn btn-primary btn-sm w-full">
            <Download className="w-4 h-4" />
            Download Export
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="p-4 border-b border-base-300 space-y-3">
        {/* Search & Advanced Filter Toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search history..."
              className="input input-bordered w-full pl-10"
            />
          </div>
          <button onClick={handleSearch} className="btn btn-primary">
            Search
          </button>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`btn btn-sm ${showAdvancedFilters ? 'btn-primary' : 'btn-ghost'}`}
            title="Advanced filters"
          >
            <AlertCircle className="w-4 h-4" />
          </button>
          {(searchQuery || dateFrom || dateTo || activeFilters.length > 0) && (
            <button onClick={onClearFilter} className="btn btn-ghost">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="bg-base-100 rounded-lg p-3 border border-base-300 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-base-content/60 block mb-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="select select-sm select-bordered w-full"
                >
                  <option value="">All Types</option>
                  <option>email_notification</option>
                  <option>system_alert</option>
                  <option>approval_request</option>
                  <option>document_update</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-base-content/60 block mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'read' | 'unread')}
                  className="select select-sm select-bordered w-full"
                >
                  <option value="all">All Status</option>
                  <option value="read">Read</option>
                  <option value="unread">Unread</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-base-content/60 block mb-1">Project</label>
                <input
                  type="text"
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  placeholder="Project name"
                  className="input input-sm input-bordered w-full"
                />
              </div>
              <div>
                <label className="text-xs text-base-content/60 block mb-1">User</label>
                <input
                  type="text"
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  placeholder="User name"
                  className="input input-sm input-bordered w-full"
                />
              </div>
              <div>
                <label className="text-xs text-base-content/60 block mb-1">Severity</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value as 'all' | 'Info' | 'Warning' | 'Critical')}
                  className="select select-sm select-bordered w-full"
                >
                  <option value="all">All Severity</option>
                  <option value="Info">Info</option>
                  <option value="Warning">Warning</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={applyAdvancedFilters} className="btn btn-sm btn-primary flex-1">
                Apply Filters
              </button>
              <button onClick={savePreset} className="btn btn-sm btn-ghost flex-1">
                Save as Preset
              </button>
            </div>
          </div>
        )}

        {/* Saved Presets */}
        {savedPresets.length > 0 && (
          <div>
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="text-xs text-primary hover:text-primary-focus font-medium"
            >
              {showPresets ? 'Hide' : 'Show'} Saved Presets ({savedPresets.length})
            </button>
            {showPresets && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {savedPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      const chips: FilterChip[] = [];
                      Object.entries(preset.filters).forEach(([key, value]) => {
                        chips.push({ key, label: key, value: String(value) });
                      });
                      setActiveFilters(chips);
                      setShowPresets(false);
                    }}
                    className="badge badge-outline gap-1 hover:badge-primary cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Filter Chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-base-content/60 font-medium">Active Filters:</span>
            {activeFilters.map((chip) => (
              <div key={chip.key} className="badge badge-primary gap-1">
                <span className="text-xs">{chip.label}: {chip.value}</span>
                <button
                  onClick={() => removeFilter(chip.key)}
                  className="text-primary-content hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-base-content/60 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input input-bordered input-sm w-full"
            />
          </div>
          <div>
            <label className="text-xs text-base-content/60 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input input-bordered input-sm w-full"
            />
          </div>
        </div>
      </div>

      {/* Main Content with Insights Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading loading-spinner loading-lg" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-base-content/50">
            <History className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-semibold">No notifications found</p>
            <p className="text-sm">Try adjusting your search or date range</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="p-3 rounded-lg border border-base-300 bg-base-100 hover:bg-base-200 transition-all"
            >
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(notification.status)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm truncate">
                          {notification.title}
                        </h4>
                        <span className={`badge badge-xs ${getSeverityBadge(notification.severity)}`}>
                          {notification.severity}
                        </span>
                        <span className="badge badge-xs badge-ghost">
                          {notification.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-base-content/70 mt-1">
                        {notification.message}
                      </p>
                      {notification.description && (
                        <p className="text-xs text-base-content/50 mt-1">
                          {notification.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-base-content/50">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatNotificationDate(notification.createdAt)}
                    </span>
                    {notification.readAt && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Read: {formatNotificationDate(notification.readAt)}
                      </span>
                    )}
                    {notification.archivedAt && (
                      <span className="flex items-center gap-1">
                        <Archive className="w-3 h-3" />
                        Archived: {formatNotificationDate(notification.archivedAt)}
                      </span>
                    )}
                    {notification.metadata?.projectName && (
                      <span className="px-2 py-0.5 rounded bg-base-300">
                        {notification.metadata.projectName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        </div>

        {/* Insights Sidebar */}
        {showInsights && (
          <div className="w-80 border-l border-base-300 bg-base-100 overflow-y-auto">
            <div className="p-4 border-b border-base-300 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Insights
              </h3>

              {/* Key Stats */}
              <div className="space-y-2">
                <div className="stat bg-base-200 rounded-lg p-3">
                  <div className="stat-title text-xs">Total Notifications</div>
                  <div className="stat-value text-2xl">{insights.totalCount}</div>
                </div>
                <div className="stat bg-base-200 rounded-lg p-3">
                  <div className="stat-title text-xs">Read Rate</div>
                  <div className="stat-value text-2xl text-primary">{insights.readPercent}%</div>
                </div>
                <div className="stat bg-base-200 rounded-lg p-3">
                  <div className="stat-title text-xs">Most Common Type</div>
                  <div className="stat-value text-lg">{insights.mostCommonType.replace(/_/g, ' ')}</div>
                </div>
                <div className="stat bg-base-200 rounded-lg p-3">
                  <div className="stat-title text-xs">Avg per Day</div>
                  <div className="stat-value text-2xl">{insights.avgPerDay}</div>
                </div>
                <div className="stat bg-base-200 rounded-lg p-3">
                  <div className="stat-title text-xs">Busiest Day</div>
                  <div className="stat-value text-sm">{insights.busiestDay}</div>
                </div>
              </div>

              {/* Type Distribution Chart */}
              <div className="bg-base-200 rounded-lg p-3">
                <h4 className="text-xs font-semibold mb-2">Distribution by Type</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={Object.entries(insights.typeCounts).map(([type, count]) => ({
                      type: type.substring(0, 8),
                      count,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="type" style={{ fontSize: '10px' }} />
                    <YAxis style={{ fontSize: '10px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px' }} />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-base-300 flex items-center justify-between">
          <button
            onClick={() => onLoadHistory(currentPage - 1)}
            disabled={currentPage <= 1}
            className="btn btn-sm btn-ghost gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-sm text-base-content/60">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onLoadHistory(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="btn btn-sm btn-ghost gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationHistory;
