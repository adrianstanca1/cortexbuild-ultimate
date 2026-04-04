/**
 * NotificationItem Component
 * Displays a single notification with actions and metadata
 */

import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  FileText,
  Calendar,
  MessageSquare,
  Users,
  Shield,
  Clock,
  Check,
  X,
  Archive,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Reply,
  User,
  PauseCircle,
} from 'lucide-react';
import type { Notification } from '@/types/notification';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onSnooze?: (id: string, until: Date) => void;
  onNavigate?: (url: string) => void;
  onQuickReply?: (notificationId: string, message: string) => void;
  onQuickApprove?: (notificationId: string, approved: boolean) => void;
  isCompact?: boolean;
}

// Icon mapping by notification type
const TYPE_ICONS: Record<Notification['type'], React.ElementType> = {
  project_update: FileText,
  task_assignment: CheckCircle,
  rfi_response: MessageSquare,
  safety_incident: Shield,
  document_upload: FileText,
  meeting_reminder: Calendar,
  team_mention: Users,
  system_alert: Bell,
  approval_request: CheckCircle,
  deadline_warning: Clock,
  budget_alert: AlertTriangle,
  change_order: FileText,
  inspection_scheduled: Calendar,
  material_delivery: Truck,
  timesheet_approval: Clock,
  subcontractor_update: Users,
};

// Truck icon for material delivery
function Truck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  );
}

// Icon mapping by severity
const SEVERITY_ICONS: Record<Notification['severity'], React.ElementType> = {
  critical: AlertTriangle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

// Color mapping by severity
const SEVERITY_COLORS: Record<Notification['severity'], string> = {
  critical: 'text-red-500 bg-red-500/10 border-red-500/30',
  error: 'text-red-500 bg-red-500/10 border-red-500/30',
  warning: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  info: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  success: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
};

// Format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onArchive,
  onSnooze,
  onNavigate,
  onQuickReply,
  onQuickApprove,
  isCompact = false,
}: NotificationItemProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

  const isUnread = notification.status === 'unread';
  const TypeIcon = TYPE_ICONS[notification.type] || Bell;
  const SeverityIcon = SEVERITY_ICONS[notification.severity];
  const severityColor = SEVERITY_COLORS[notification.severity];

  const handleMarkAsRead = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
  };

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.relatedItem?.url) {
      onNavigate?.(notification.relatedItem.url);
    }
  };

  const handleQuickReply = () => {
    if (replyMessage.trim() && onQuickReply) {
      onQuickReply(notification.id, replyMessage);
      setReplyMessage('');
      setShowReply(false);
    }
  };

  const handleQuickApprove = (approved: boolean) => {
    onQuickApprove?.(notification.id, approved);
  };

  const handleSnooze = (hours: number) => {
    const until = new Date();
    until.setHours(until.getHours() + hours);
    onSnooze?.(notification.id, until);
    setShowSnoozeOptions(false);
  };

  if (isCompact) {
    return (
      <div
        className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-base-200 ${
          isUnread ? 'bg-base-200 border-primary/30' : 'border-base-300'
        }`}
        onClick={handleMarkAsRead}
      >
        <div className={`p-2 rounded-lg ${severityColor}`}>
          <TypeIcon className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${isUnread ? 'text-primary' : 'text-base-content'}`}>
                {notification.title}
              </p>
              <p className="text-xs text-base-content/70 truncate">{notification.message}</p>
            </div>
            <span className="text-xs text-base-content/50 flex-shrink-0">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </div>
          
          {notification.fromUser && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {notification.fromUser.avatar ? (
                <img
                  src={notification.fromUser.avatar}
                  alt={notification.fromUser.name}
                  className="w-4 h-4 rounded-full"
                />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span className="text-xs text-base-content/60">{notification.fromUser.name}</span>
            </div>
          )}
        </div>

        {isUnread && (
          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        isUnread
          ? 'bg-base-200 border-primary/30 shadow-md'
          : 'bg-base-100 border-base-300'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`p-2.5 rounded-xl ${severityColor} flex-shrink-0`}>
          <SeverityIcon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`font-semibold ${isUnread ? 'text-primary' : 'text-base-content'}`}>
                  {notification.title}
                </h4>
                {isUnread && (
                  <span className="badge badge-primary badge-xs">New</span>
                )}
              </div>
              <p className="text-sm text-base-content/70 mt-1">{notification.message}</p>
              {notification.description && (
                <p className="text-xs text-base-content/50 mt-1.5">{notification.description}</p>
              )}
            </div>

            {/* Timestamp */}
            <span className="text-xs text-base-content/50 flex-shrink-0">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </div>

          {/* From User */}
          {notification.fromUser && (
            <div className="flex items-center gap-2 mt-2">
              {notification.fromUser.avatar ? (
                <img
                  src={notification.fromUser.avatar}
                  alt={notification.fromUser.name}
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-3 h-3 text-primary" />
                </div>
              )}
              <span className="text-xs text-base-content/60">
                {notification.fromUser.name}
                {notification.fromUser.role && (
                  <span className="ml-1 text-base-content/40">
                    • {notification.fromUser.role.replace('_', ' ')}
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Metadata */}
          {notification.metadata && (
            <div className="flex flex-wrap gap-2 mt-2">
              {notification.metadata.projectName && (
                <span className="text-xs px-2 py-1 rounded bg-base-300 text-base-content/70">
                  {notification.metadata.projectName}
                </span>
              )}
              {notification.metadata.priority && (
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    notification.metadata.priority === 'critical'
                      ? 'bg-red-500/20 text-red-500'
                      : notification.metadata.priority === 'high'
                      ? 'bg-amber-500/20 text-amber-500'
                      : 'bg-blue-500/20 text-blue-500'
                  }`}
                >
                  {notification.metadata.priority}
                </span>
              )}
              {notification.metadata.dueDate && (
                <span className="text-xs px-2 py-1 rounded bg-base-300 text-base-content/70">
                  Due: {new Date(notification.metadata.dueDate).toLocaleDateString('en-GB')}
                </span>
              )}
              {notification.metadata.attachmentCount !== undefined && (
                <span className="text-xs px-2 py-1 rounded bg-base-300 text-base-content/70">
                  📎 {notification.metadata.attachmentCount}
                </span>
              )}
              {notification.metadata.commentCount !== undefined && (
                <span className="text-xs px-2 py-1 rounded bg-base-300 text-base-content/70">
                  💬 {notification.metadata.commentCount}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {/* Navigate */}
            {notification.relatedItem?.url && (
              <button
                onClick={handleNavigate}
                className="btn btn-sm btn-primary gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {notification.relatedItem.title || 'View'}
              </button>
            )}

            {/* Quick Approve/Reject */}
            {notification.type === 'approval_request' && onQuickApprove && (
              <>
                <button
                  onClick={() => handleQuickApprove(true)}
                  className="btn btn-sm btn-success gap-1.5"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Approve
                </button>
                <button
                  onClick={() => handleQuickApprove(false)}
                  className="btn btn-sm btn-error gap-1.5"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  Reject
                </button>
              </>
            )}

            {/* Quick Reply */}
            {onQuickReply && !showReply && (
              <button
                onClick={() => setShowReply(true)}
                className="btn btn-sm btn-ghost gap-1.5"
              >
                <Reply className="w-3.5 h-3.5" />
                Reply
              </button>
            )}

            {/* Snooze */}
            {onSnooze && isUnread && !showSnoozeOptions && (
              <button
                onClick={() => setShowSnoozeOptions(true)}
                className="btn btn-sm btn-ghost gap-1.5"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                Snooze
              </button>
            )}

            {/* Mark as Read */}
            {isUnread && (
              <button
                onClick={handleMarkAsRead}
                className="btn btn-sm btn-ghost gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Mark read
              </button>
            )}

            {/* Archive */}
            {onArchive && (
              <button
                onClick={() => onArchive(notification.id)}
                className="btn btn-sm btn-ghost gap-1.5"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Delete */}
            <button
              onClick={() => onDelete(notification.id)}
              className="btn btn-sm btn-ghost btn-circle ml-auto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Reply Input */}
          {showReply && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                className="input input-bordered input-sm flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleQuickReply()}
              />
              <button
                onClick={handleQuickReply}
                className="btn btn-sm btn-primary"
                disabled={!replyMessage.trim()}
              >
                Send
              </button>
              <button
                onClick={() => setShowReply(false)}
                className="btn btn-sm btn-ghost"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Snooze Options */}
          {showSnoozeOptions && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleSnooze(1)}
                className="btn btn-sm btn-ghost"
              >
                1h
              </button>
              <button
                onClick={() => handleSnooze(4)}
                className="btn btn-sm btn-ghost"
              >
                4h
              </button>
              <button
                onClick={() => handleSnooze(24)}
                className="btn btn-sm btn-ghost"
              >
                1d
              </button>
              <button
                onClick={() => handleSnooze(168)}
                className="btn btn-sm btn-ghost"
              >
                1w
              </button>
              <button
                onClick={() => setShowSnoozeOptions(false)}
                className="btn btn-sm btn-ghost"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationItem;
