/**
 * CortexBuild Ultimate - Notification Types
 * Comprehensive notification system types for real-time updates
 */

import { User, UserRole, Priority } from './index';

// Notification Types
export type NotificationType =
  | 'project_update'
  | 'task_assignment'
  | 'rfi_response'
  | 'safety_incident'
  | 'document_upload'
  | 'meeting_reminder'
  | 'team_mention'
  | 'system_alert'
  | 'approval_request'
  | 'deadline_warning'
  | 'budget_alert'
  | 'change_order'
  | 'inspection_scheduled'
  | 'material_delivery'
  | 'timesheet_approval'
  | 'subcontractor_update';

// Notification Categories for filtering
export type NotificationCategory =
  | 'all'
  | 'unread'
  | 'mentions'
  | 'assignments'
  | 'system'
  | 'safety'
  | 'projects'
  | 'documents'
  | 'meetings'
  | 'approvals'
  | 'deadlines';

// Notification Severity
export type NotificationSeverity =
  | 'critical'
  | 'error'
  | 'warning'
  | 'info'
  | 'success';

// Notification Status
export type NotificationStatus = 'unread' | 'read' | 'archived' | 'snoozed';

// Related Item Types
export type RelatedItemType =
  | 'project'
  | 'task'
  | 'rfi'
  | 'safety_incident'
  | 'document'
  | 'meeting'
  | 'approval'
  | 'change_order'
  | 'budget'
  | 'timesheet'
  | 'subcontractor'
  | 'inspection'
  | 'material';

// Related Item Reference
export interface RelatedItem {
  type: RelatedItemType;
  id: string;
  title: string;
  url: string;
}

// Notification Action Types
export type NotificationActionType =
  | 'navigate'
  | 'approve'
  | 'reject'
  | 'reply'
  | 'snooze'
  | 'dismiss';

// Notification Action
export interface NotificationAction {
  type: NotificationActionType;
  label: string;
  url?: string;
  payload?: Record<string, unknown>;
}

// Main Notification Interface
export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  severity: NotificationSeverity;
  status: NotificationStatus;
  title: string;
  message: string;
  description?: string;
  relatedItem?: RelatedItem;
  actions?: NotificationAction[];
  fromUser?: Pick<User, 'id' | 'name' | 'avatar' | 'role'>;
  createdAt: string;
  readAt?: string;
  archivedAt?: string;
  snoozedUntil?: string;
  metadata?: NotificationMetadata;
}

// Notification Metadata
export interface NotificationMetadata {
  projectId?: string;
  projectName?: string;
  taskId?: string;
  rfiId?: string;
  safetyIncidentId?: string;
  documentId?: string;
  meetingId?: string;
  approvalId?: string;
  changeOrderId?: string;
  budgetId?: string;
  timesheetId?: string;
  subcontractorId?: string;
  inspectionId?: string;
  materialId?: string;
  priority?: Priority;
  dueDate?: string;
  originalValue?: number;
  newValue?: number;
  currency?: string;
  mentionedUsers?: string[];
  attachmentCount?: number;
  commentCount?: number;
}

// Notification Settings
export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundAlerts: boolean;
  browserNotifications: boolean;
  quietHours: QuietHours;
  digestFrequency: 'never' | 'hourly' | 'daily' | 'weekly';
  categoryPreferences: CategoryPreferences;
}

// Quiet Hours Configuration
export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timezone: string;
}

// Category Preferences
export interface CategoryPreferences {
  project_update: boolean;
  task_assignment: boolean;
  rfi_response: boolean;
  safety_incident: boolean;
  document_upload: boolean;
  meeting_reminder: boolean;
  team_mention: boolean;
  system_alert: boolean;
  approval_request: boolean;
  deadline_warning: boolean;
  budget_alert: boolean;
  change_order: boolean;
  inspection_scheduled: boolean;
  material_delivery: boolean;
  timesheet_approval: boolean;
  subcontractor_update: boolean;
}

// Default category preferences
export const DEFAULT_CATEGORY_PREFERENCES: CategoryPreferences = {
  project_update: true,
  task_assignment: true,
  rfi_response: true,
  safety_incident: true,
  document_upload: true,
  meeting_reminder: true,
  team_mention: true,
  system_alert: true,
  approval_request: true,
  deadline_warning: true,
  budget_alert: true,
  change_order: true,
  inspection_scheduled: true,
  material_delivery: true,
  timesheet_approval: true,
  subcontractor_update: true,
};

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  soundAlerts: true,
  browserNotifications: false,
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
    timezone: 'Europe/London',
  },
  digestFrequency: 'daily',
  categoryPreferences: DEFAULT_CATEGORY_PREFERENCES,
};

// Notification Group (for date grouping)
export interface NotificationGroup {
  label: string;
  date: string;
  notifications: Notification[];
  unreadCount: number;
}

// Notification Stats
export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  archived: number;
  snoozed: number;
  byType: Record<NotificationType, number>;
  bySeverity: Record<NotificationSeverity, number>;
  byCategory: Record<NotificationCategory, number>;
}

// API Response Types
export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface NotificationStatsResponse {
  stats: NotificationStats;
}

// WebSocket Message Types
export interface WebSocketNotificationMessage {
  type: 'notification';
  event: NotificationType;
  payload: Omit<Notification, 'id' | 'createdAt' | 'status'>;
  timestamp: string;
}

export interface WebSocketConnectionStatus {
  isConnected: boolean;
  lastMessage?: string;
  error?: string;
  reconnecting: boolean;
  reconnectAttempt: number;
}

// Search and Filter Options
export interface NotificationFilter {
  category?: NotificationCategory;
  type?: NotificationType;
  severity?: NotificationSeverity;
  status?: NotificationStatus;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

export interface NotificationQuery {
  page: number;
  pageSize: number;
  filter?: NotificationFilter;
  sortBy?: 'createdAt' | 'severity' | 'type';
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
}

// Quick Reply Interface
export interface QuickReply {
  notificationId: string;
  message: string;
  attachments?: File[];
}

// Export Options
export type ExportFormat = 'json' | 'csv' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  dateFrom?: string;
  dateTo?: string;
  includeRead: boolean;
  includeArchived: boolean;
  types?: NotificationType[];
}
