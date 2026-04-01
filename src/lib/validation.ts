/**
 * Runtime Validation Schemas for CortexBuild Ultimate
 * Using Zod for API response validation and type safety
 */

import { z } from 'zod';

// Notification severity levels
export const SeveritySchema = z.enum(['info', 'success', 'warning', 'error', 'critical']);

// Notification type
export const NotificationTypeSchema = z.enum([
  'notification',
  'alert',
  'dashboard_update',
  'collaboration',
  'system',
]);

// Single notification schema
export const NotificationSchema = z.object({
  id: z.union([z.string(), z.number()]),
  type: NotificationTypeSchema,
  title: z.string().min(1, 'Title is required'),
  message: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  read: z.boolean(),
  link: z.string().url().optional(),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/).optional(),
  timestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
  severity: SeveritySchema,
  data: z.record(z.string(), z.unknown()).optional(),
});

// Notifications response schema
export const NotificationsResponseSchema = z.object({
  notifications: z.array(NotificationSchema),
  unreadCount: z.number().int().min(0),
  total: z.number().int().min(0),
});

// Notification preference schema
export const NotificationPreferenceSchema = z.object({
  type: z.string(),
  label: z.string(),
  email: z.boolean(),
  push: z.boolean(),
  sms: z.boolean(),
  inApp: z.boolean(),
});

// Chat message schema
export const ChatMessageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  content: z.string().min(1, 'Message content required'),
  timestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
  type: z.enum(['text', 'system', 'file']),
});

// Activity feed item schema
export const ActivitySchema = z.object({
  id: z.string(),
  type: z.enum(['comment', 'update', 'alert', 'complete', 'create']),
  userId: z.string(),
  userName: z.string(),
  action: z.string(),
  target: z.string(),
  timestamp: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
  icon: z.any().optional(),
});

// Analytics metric schema
export const AnalyticsMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  change: z.number(),
  trend: z.enum(['up', 'down', 'stable']),
});

// Calendar event schema
export const CalendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['meeting', 'deadline', 'inspection', 'delivery', 'other']),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/).optional(),
  location: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  projectId: z.string().optional(),
  color: z.string().optional(),
});

// KPI card schema
export const KPISchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  target: z.number().optional(),
  change: z.number().optional(),
  trend: z.enum(['up', 'down', 'stable']).optional(),
});

// Export validation helpers
export function validateNotification(data: unknown) {
  return NotificationSchema.parse(data);
}

export function validateNotificationsResponse(data: unknown) {
  return NotificationsResponseSchema.parse(data);
}

export function validateChatMessage(data: unknown) {
  return ChatMessageSchema.parse(data);
}

export function validateActivity(data: unknown) {
  return ActivitySchema.parse(data);
}

export function validateAnalyticsMetric(data: unknown) {
  return AnalyticsMetricSchema.parse(data);
}

export function validateCalendarEvent(data: unknown) {
  return CalendarEventSchema.parse(data);
}

// Safe parse functions that return errors instead of throwing
export function safeParseNotification(data: unknown) {
  return NotificationSchema.safeParse(data);
}

export function safeParseNotificationsResponse(data: unknown) {
  return NotificationsResponseSchema.safeParse(data);
}
