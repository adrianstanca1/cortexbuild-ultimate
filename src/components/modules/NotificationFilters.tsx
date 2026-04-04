/**
 * NotificationFilters Component
 * Provides filtering and search capabilities for notifications
 */

import React from 'react';
import {
  Filter,
  Search,
  X,
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  FileText,
  Calendar,
  MessageSquare,
  Users,
  Shield,
  Clock,
  TrendingUp,
  FolderArchive,
  Eye,
} from 'lucide-react';
import type { NotificationFilter, NotificationCategory, NotificationType, NotificationSeverity } from '@/types/notification';

interface NotificationFiltersProps {
  filter: NotificationFilter | undefined;
  onFilterChange: (filter: NotificationFilter) => void;
  onClear: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  unreadCount: number;
  total: number;
}

// Category icons
const CATEGORY_ICONS: Record<NotificationCategory, React.ElementType> = {
  all: Bell,
  unread: Eye,
  mentions: MessageSquare,
  assignments: CheckCircle,
  system: Info,
  safety: Shield,
  projects: FileText,
  documents: FileText,
  meetings: Calendar,
  approvals: CheckCircle,
  deadlines: Clock,
};

// Type icons
const TYPE_ICONS: Record<NotificationType, React.ElementType> = {
  project_update: FileText,
  task_assignment: CheckCircle,
  rfi_response: MessageSquare,
  safety_incident: Shield,
  document_upload: FileText,
  meeting_reminder: Calendar,
  team_mention: Users,
  system_alert: Info,
  approval_request: CheckCircle,
  deadline_warning: Clock,
  budget_alert: TrendingUp,
  change_order: FileText,
  inspection_scheduled: Calendar,
  material_delivery: AlertTriangle,
  timesheet_approval: Clock,
  subcontractor_update: Users,
};

// Severity icons
const SEVERITY_ICONS: Record<NotificationSeverity, React.ElementType> = {
  critical: AlertTriangle,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const CATEGORIES: { value: NotificationCategory; label: string; getDescription: (unreadCount: number) => string }[] = [
  { value: 'all', label: 'All', getDescription: () => 'All notifications' },
  { value: 'unread', label: 'Unread', getDescription: (count) => `${count} unread` },
  { value: 'mentions', label: 'Mentions', getDescription: () => 'You were mentioned' },
  { value: 'assignments', label: 'Assignments', getDescription: () => 'Tasks assigned to you' },
  { value: 'safety', label: 'Safety', getDescription: () => 'Safety incidents & alerts' },
  { value: 'projects', label: 'Projects', getDescription: () => 'Project updates' },
  { value: 'meetings', label: 'Meetings', getDescription: () => 'Meeting reminders' },
  { value: 'approvals', label: 'Approvals', getDescription: () => 'Pending approvals' },
  { value: 'deadlines', label: 'Deadlines', getDescription: () => 'Upcoming deadlines' },
];

const SEVERITIES: { value: NotificationSeverity; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: 'text-red-500' },
  { value: 'error', label: 'Error', color: 'text-red-500' },
  { value: 'warning', label: 'Warning', color: 'text-amber-500' },
  { value: 'info', label: 'Info', color: 'text-blue-500' },
  { value: 'success', label: 'Success', color: 'text-emerald-500' },
];

const TYPES: { value: NotificationType; label: string }[] = [
  { value: 'project_update', label: 'Project Update' },
  { value: 'task_assignment', label: 'Task Assignment' },
  { value: 'rfi_response', label: 'RFI Response' },
  { value: 'safety_incident', label: 'Safety Incident' },
  { value: 'document_upload', label: 'Document Upload' },
  { value: 'meeting_reminder', label: 'Meeting Reminder' },
  { value: 'team_mention', label: 'Team Mention' },
  { value: 'system_alert', label: 'System Alert' },
  { value: 'approval_request', label: 'Approval Request' },
  { value: 'deadline_warning', label: 'Deadline Warning' },
  { value: 'budget_alert', label: 'Budget Alert' },
  { value: 'change_order', label: 'Change Order' },
  { value: 'inspection_scheduled', label: 'Inspection Scheduled' },
  { value: 'material_delivery', label: 'Material Delivery' },
  { value: 'timesheet_approval', label: 'Timesheet Approval' },
  { value: 'subcontractor_update', label: 'Subcontractor Update' },
];

const STATUSES: { value: 'unread' | 'read' | 'archived' | 'snoozed'; label: string }[] = [
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
  { value: 'archived', label: 'Archived' },
  { value: 'snoozed', label: 'Snoozed' },
];

export function NotificationFilters({
  filter,
  onFilterChange,
  onClear,
  onSearch,
  searchQuery,
  unreadCount: unreadCountProp,
  total,
}: NotificationFiltersProps) {
  const [, setShowCategories] = React.useState(false);
  const unreadCount = unreadCountProp;

  const handleCategorySelect = (category: NotificationCategory) => {
    onFilterChange({
      ...filter,
      category,
      status: category === 'unread' ? 'unread' : undefined,
    });
    setShowCategories(false);
  };

  const handleSeveritySelect = (severity: NotificationSeverity) => {
    onFilterChange({
      ...filter,
      severity: filter?.severity === severity ? undefined : severity,
    });
  };

  const handleTypeSelect = (type: NotificationType) => {
    onFilterChange({
      ...filter,
      type: filter?.type === type ? undefined : type,
    });
  };

  const handleStatusSelect = (status: 'unread' | 'read' | 'archived' | 'snoozed') => {
    onFilterChange({
      ...filter,
      status: filter?.status === status ? undefined : status,
    });
  };

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filter?.category && filter.category !== 'all') count++;
    if (filter?.severity) count++;
    if (filter?.type) count++;
    if (filter?.status) count++;
    if (filter?.projectId) count++;
    if (filter?.dateFrom || filter?.dateTo) count++;
    return count;
  }, [filter]);

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search notifications..."
          className="input input-bordered w-full pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => onSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {/* Category Dropdown */}
        <div className="dropdown">
          <label
            tabIndex={0}
            className={`btn btn-sm gap-2 flex-shrink-0 ${
              filter?.category && filter.category !== 'all' ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            <Filter className="w-4 h-4" />
            {filter?.category && filter.category !== 'all'
              ? filter.category.charAt(0).toUpperCase() + filter.category.slice(1)
              : 'Categories'}
          </label>
          <div
            tabIndex={0}
            className="dropdown-content z-[1000] menu p-2 shadow-lg bg-base-100 rounded-box w-56 mt-1"
          >
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.value];
              return (
                <li key={cat.value}>
                  <a
                    className={filter?.category === cat.value ? 'active' : ''}
                    onClick={() => handleCategorySelect(cat.value)}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                    {cat.value === 'unread' && unreadCount > 0 && (
                      <span className="badge badge-primary badge-xs ml-auto">
                        {unreadCount}
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </div>
        </div>

        {/* Severity Filter */}
        <div className="dropdown">
          <label
            tabIndex={0}
            className={`btn btn-sm gap-2 flex-shrink-0 ${
              filter?.severity ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Severity
          </label>
          <div
            tabIndex={0}
            className="dropdown-content z-[1000] menu p-2 shadow-lg bg-base-100 rounded-box w-48 mt-1"
          >
            {SEVERITIES.map((sev) => {
              const Icon = SEVERITY_ICONS[sev.value];
              return (
                <li key={sev.value}>
                  <a
                    className={`${filter?.severity === sev.value ? 'active' : ''} ${sev.color}`}
                    onClick={() => handleSeveritySelect(sev.value)}
                  >
                    <Icon className="w-4 h-4" />
                    {sev.label}
                  </a>
                </li>
              );
            })}
          </div>
        </div>

        {/* Type Filter */}
        <div className="dropdown">
          <label
            tabIndex={0}
            className={`btn btn-sm gap-2 flex-shrink-0 ${
              filter?.type ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            <Bell className="w-4 h-4" />
            Type
          </label>
          <div
            tabIndex={0}
            className="dropdown-content z-[1000] menu p-2 shadow-lg bg-base-100 rounded-box w-56 mt-1 max-h-64 overflow-y-auto"
          >
            {TYPES.map((type) => {
              const Icon = TYPE_ICONS[type.value];
              return (
                <li key={type.value}>
                  <a
                    className={filter?.type === type.value ? 'active' : ''}
                    onClick={() => handleTypeSelect(type.value)}
                  >
                    <Icon className="w-4 h-4" />
                    {type.label}
                  </a>
                </li>
              );
            })}
          </div>
        </div>

        {/* Status Filter */}
        <div className="dropdown">
          <label
            tabIndex={0}
            className={`btn btn-sm gap-2 flex-shrink-0 ${
              filter?.status ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            Status
          </label>
          <div
            tabIndex={0}
            className="dropdown-content z-[1000] menu p-2 shadow-lg bg-base-100 rounded-box w-40 mt-1"
          >
            {STATUSES.map((status) => (
              <li key={status.value}>
                <a
                  className={filter?.status === status.value ? 'active' : ''}
                  onClick={() => handleStatusSelect(status.value)}
                >
                  {status.label}
                </a>
              </li>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={onClear}
            className="btn btn-sm btn-ghost gap-1 flex-shrink-0"
          >
            <X className="w-4 h-4" />
            {activeFilterCount}
          </button>
        )}

        {/* Stats */}
        <div className="ml-auto text-xs text-base-content/50 flex-shrink-0">
          {unreadCount} unread / {total} total
        </div>
      </div>

      {/* Active Filters Display */}
      {(filter?.severity || filter?.type || filter?.status || filter?.projectId) && (
        <div className="flex flex-wrap gap-2">
          {filter?.severity && (
            <div className="badge gap-1">
              <AlertTriangle className="w-3 h-3" />
              {filter.severity}
              <button
                onClick={() => handleSeveritySelect(filter.severity!)}
                className="ml-1 hover:text-error"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {filter?.type && (
            <div className="badge gap-1">
              <Bell className="w-3 h-3" />
              {TYPES.find((t) => t.value === filter.type)?.label || filter.type}
              <button
                onClick={() => handleTypeSelect(filter.type!)}
                className="ml-1 hover:text-error"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {filter?.status && (
            <div className="badge gap-1">
              <FolderArchive className="w-3 h-3" />
              {filter.status}
              <button
                onClick={() => handleStatusSelect(filter.status!)}
                className="ml-1 hover:text-error"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {filter?.projectId && (
            <div className="badge gap-1">
              <FileText className="w-3 h-3" />
              Project
              <button
                onClick={() => onFilterChange({ ...filter, projectId: undefined })}
                className="ml-1 hover:text-error"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationFilters;
