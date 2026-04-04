import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SeveritySchema,
  NotificationTypeSchema,
  NotificationSchema,
  NotificationsResponseSchema,
  ChatMessageSchema,
  ActivitySchema,
  AnalyticsMetricSchema,
  CalendarEventSchema,
  KPISchema,
  validateNotification,
  validateChatMessage,
  validateActivity,
  validateAnalyticsMetric,
  validateCalendarEvent,
  safeParseNotification,
} from '../lib/validation';

/**
 * Unit tests for runtime validation schemas
 * Tests Zod schema validation for all new feature data types
 */
describe('Validation Schemas', () => {
  describe('SeveritySchema', () => {
    it('accepts valid severity levels', () => {
      expect(SeveritySchema.parse('info')).toBe('info');
      expect(SeveritySchema.parse('success')).toBe('success');
      expect(SeveritySchema.parse('warning')).toBe('warning');
      expect(SeveritySchema.parse('error')).toBe('error');
      expect(SeveritySchema.parse('critical')).toBe('critical');
    });

    it('rejects invalid severity levels', () => {
      expect(() => SeveritySchema.parse('invalid')).toThrow();
      expect(() => SeveritySchema.parse('')).toThrow();
    });
  });

  describe('NotificationTypeSchema', () => {
    it('accepts valid notification types', () => {
      expect(NotificationTypeSchema.parse('notification')).toBe('notification');
      expect(NotificationTypeSchema.parse('alert')).toBe('alert');
      expect(NotificationTypeSchema.parse('dashboard_update')).toBe('dashboard_update');
      expect(NotificationTypeSchema.parse('collaboration')).toBe('collaboration');
      expect(NotificationTypeSchema.parse('system')).toBe('system');
    });

    it('rejects invalid notification types', () => {
      expect(() => NotificationTypeSchema.parse('invalid')).toThrow();
    });
  });

  describe('NotificationSchema', () => {
    it('accepts valid notification object', () => {
      const validNotification = {
        id: '1',
        type: 'alert' as const,
        title: 'Test Alert',
        description: 'This is a test',
        read: false,
        timestamp: '2026-04-01T12:00:00Z',
        severity: 'warning' as const,
      };

      const result = NotificationSchema.parse(validNotification);
      expect(result.id).toBe('1');
      expect(result.title).toBe('Test Alert');
    });

    it('accepts notification with optional fields', () => {
      const validNotification = {
        id: '1',
        type: 'notification' as const,
        title: 'Test',
        description: 'Test desc',
        read: true,
        timestamp: '2026-04-01T12:00:00Z',
        severity: 'info' as const,
        message: 'Optional message',
        link: 'https://example.com',
        data: { key: 'value' },
      };

      const result = NotificationSchema.parse(validNotification);
      expect(result.message).toBe('Optional message');
      expect(result.link).toBe('https://example.com');
    });

    it('rejects notification without required title', () => {
      const invalidNotification = {
        id: '1',
        type: 'notification',
        description: 'Missing title',
        read: false,
        timestamp: '2026-04-01T12:00:00Z',
        severity: 'info',
      };

      expect(() => NotificationSchema.parse(invalidNotification)).toThrow();
    });

    it('rejects notification without required description', () => {
      const invalidNotification = {
        id: '1',
        type: 'notification',
        title: 'Missing description',
        read: false,
        timestamp: '2026-04-01T12:00:00Z',
        severity: 'info',
      };

      expect(() => NotificationSchema.parse(invalidNotification)).toThrow();
    });

    it('rejects notification with invalid timestamp format', () => {
      const invalidNotification = {
        id: '1',
        type: 'notification',
        title: 'Test',
        description: 'Test',
        read: false,
        timestamp: 'invalid-date',
        severity: 'info',
      };

      expect(() => NotificationSchema.parse(invalidNotification)).toThrow();
    });
  });

  describe('NotificationsResponseSchema', () => {
    it('accepts valid notifications response', () => {
      const validResponse = {
        notifications: [
          {
            id: '1',
            type: 'notification' as const,
            title: 'Test',
            description: 'Test',
            read: false,
            timestamp: '2026-04-01T12:00:00Z',
            severity: 'info' as const,
          },
        ],
        unreadCount: 1,
        total: 1,
      };

      const result = NotificationsResponseSchema.parse(validResponse);
      expect(result.notifications).toHaveLength(1);
      expect(result.unreadCount).toBe(1);
      expect(result.total).toBe(1);
    });

    it('rejects response with negative unreadCount', () => {
      const invalidResponse = {
        notifications: [],
        unreadCount: -1,
        total: 0,
      };

      expect(() => NotificationsResponseSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('ChatMessageSchema', () => {
    it('accepts valid chat message', () => {
      const validMessage = {
        id: '1',
        userId: 'user1',
        userName: 'John Doe',
        content: 'Hello!',
        timestamp: '2026-04-01T12:00:00Z',
        type: 'text' as const,
      };

      const result = ChatMessageSchema.parse(validMessage);
      expect(result.content).toBe('Hello!');
      expect(result.userName).toBe('John Doe');
    });

    it('accepts system message type', () => {
      const systemMessage = {
        id: '2',
        userId: 'system',
        userName: 'System',
        content: 'Project updated',
        timestamp: '2026-04-01T12:00:00Z',
        type: 'system' as const,
      };

      const result = ChatMessageSchema.parse(systemMessage);
      expect(result.type).toBe('system');
    });

    it('accepts file message type', () => {
      const fileMessage = {
        id: '3',
        userId: 'user1',
        userName: 'John',
        content: 'document.pdf',
        timestamp: '2026-04-01T12:00:00Z',
        type: 'file' as const,
      };

      const result = ChatMessageSchema.parse(fileMessage);
      expect(result.type).toBe('file');
    });

    it('rejects message without content', () => {
      const invalidMessage = {
        id: '1',
        userId: 'user1',
        userName: 'John',
        timestamp: '2026-04-01T12:00:00Z',
        type: 'text',
      };

      expect(() => ChatMessageSchema.parse(invalidMessage)).toThrow();
    });

    it('rejects message with empty content', () => {
      const invalidMessage = {
        id: '1',
        userId: 'user1',
        userName: 'John',
        content: '',
        timestamp: '2026-04-01T12:00:00Z',
        type: 'text',
      };

      expect(() => ChatMessageSchema.parse(invalidMessage)).toThrow();
    });
  });

  describe('ActivitySchema', () => {
    it('accepts valid activity', () => {
      const validActivity = {
        id: '1',
        type: 'create' as const,
        userId: 'user1',
        userName: 'Sarah Chen',
        action: 'created',
        target: 'project milestone',
        timestamp: '2026-04-01T12:00:00Z',
      };

      const result = ActivitySchema.parse(validActivity);
      expect(result.userName).toBe('Sarah Chen');
      expect(result.action).toBe('created');
    });

    it('accepts all activity types', () => {
      const types = ['comment', 'update', 'alert', 'complete', 'create'];
      
      types.forEach(type => {
        const activity = {
          id: '1',
          type: type as const,
          userId: 'user1',
          userName: 'Test',
          action: 'test',
          target: 'test',
          timestamp: '2026-04-01T12:00:00Z',
        };
        expect(ActivitySchema.parse(activity).type).toBe(type);
      });
    });

    it('rejects activity without required fields', () => {
      const invalidActivity = {
        id: '1',
        type: 'create',
        // Missing required fields
      };

      expect(() => ActivitySchema.parse(invalidActivity)).toThrow();
    });
  });

  describe('AnalyticsMetricSchema', () => {
    it('accepts valid analytics metric', () => {
      const validMetric = {
        name: 'Total Revenue',
        value: 2450000,
        change: 12.5,
        trend: 'up' as const,
      };

      const result = AnalyticsMetricSchema.parse(validMetric);
      expect(result.name).toBe('Total Revenue');
      expect(result.value).toBe(2450000);
      expect(result.trend).toBe('up');
    });

    it('accepts all trend values', () => {
      expect(AnalyticsMetricSchema.parse({ name: 'Test', value: 100, change: 0, trend: 'up' }).trend).toBe('up');
      expect(AnalyticsMetricSchema.parse({ name: 'Test', value: 100, change: 0, trend: 'down' }).trend).toBe('down');
      expect(AnalyticsMetricSchema.parse({ name: 'Test', value: 100, change: 0, trend: 'stable' }).trend).toBe('stable');
    });

    it('rejects invalid trend value', () => {
      const invalidMetric = {
        name: 'Test',
        value: 100,
        change: 0,
        trend: 'invalid',
      };

      expect(() => AnalyticsMetricSchema.parse(invalidMetric)).toThrow();
    });
  });

  describe('CalendarEventSchema', () => {
    it('accepts valid calendar event', () => {
      const validEvent = {
        id: '1',
        title: 'Team Meeting',
        type: 'meeting' as const,
        start: '2026-04-01T14:00:00Z',
        color: '#3B82F6',
      };

      const result = CalendarEventSchema.parse(validEvent);
      expect(result.title).toBe('Team Meeting');
      expect(result.type).toBe('meeting');
    });

    it('accepts event with optional fields', () => {
      const validEvent = {
        id: '1',
        title: 'Site Inspection',
        type: 'inspection' as const,
        start: '2026-04-01T10:00:00Z',
        end: '2026-04-01T12:00:00Z',
        location: 'Site A',
        attendees: ['John', 'Jane'],
        projectId: 'proj-1',
        color: '#F59E0B',
      };

      const result = CalendarEventSchema.parse(validEvent);
      expect(result.location).toBe('Site A');
      expect(result.attendees).toHaveLength(2);
    });

    it('accepts all event types', () => {
      const types = ['meeting', 'deadline', 'inspection', 'delivery', 'other'];
      
      types.forEach(type => {
        const event = {
          id: '1',
          title: 'Test',
          type: type as const,
          start: '2026-04-01T12:00:00Z',
        };
        expect(CalendarEventSchema.parse(event).type).toBe(type);
      });
    });

    it('rejects event without required title', () => {
      const invalidEvent = {
        id: '1',
        type: 'meeting',
        start: '2026-04-01T12:00:00Z',
      };

      expect(() => CalendarEventSchema.parse(invalidEvent)).toThrow();
    });
  });

  describe('KPISchema', () => {
    it('accepts valid KPI with string value', () => {
      const validKPI = {
        label: 'Daily Labour Cost',
        value: '£1,234',
      };

      const result = KPISchema.parse(validKPI);
      expect(result.label).toBe('Daily Labour Cost');
      expect(result.value).toBe('£1,234');
    });

    it('accepts valid KPI with number value', () => {
      const validKPI = {
        label: 'Active Workers',
        value: 24,
        target: 20,
      };

      const result = KPISchema.parse(validKPI);
      expect(result.value).toBe(24);
      expect(result.target).toBe(20);
    });

    it('accepts KPI with optional change and trend', () => {
      const validKPI = {
        label: 'Revenue',
        value: 1000000,
        change: 5.5,
        trend: 'up' as const,
      };

      const result = KPISchema.parse(validKPI);
      expect(result.change).toBe(5.5);
      expect(result.trend).toBe('up');
    });

    it('rejects invalid trend value', () => {
      const invalidKPI = {
        label: 'Test',
        value: 100,
        change: 0,
        trend: 'invalid',
      };

      expect(() => KPISchema.parse(invalidKPI)).toThrow();
    });
  });

  describe('Validation Helper Functions', () => {
    describe('validateNotification', () => {
      it('returns parsed notification for valid data', () => {
        const validData = {
          id: '1',
          type: 'notification' as const,
          title: 'Test',
          description: 'Test',
          read: false,
          timestamp: '2026-04-01T12:00:00Z',
          severity: 'info' as const,
        };

        const result = validateNotification(validData);
        expect(result.title).toBe('Test');
      });

      it('throws for invalid data', () => {
        const invalidData = { id: '1' };
        expect(() => validateNotification(invalidData)).toThrow();
      });
    });

    describe('validateChatMessage', () => {
      it('returns parsed message for valid data', () => {
        const validData = {
          id: '1',
          userId: 'user1',
          userName: 'John',
          content: 'Hello',
          timestamp: '2026-04-01T12:00:00Z',
          type: 'text' as const,
        };

        const result = validateChatMessage(validData);
        expect(result.content).toBe('Hello');
      });

      it('throws for invalid data', () => {
        expect(() => validateChatMessage({})).toThrow();
      });
    });

    describe('validateActivity', () => {
      it('returns parsed activity for valid data', () => {
        const validData = {
          id: '1',
          type: 'create' as const,
          userId: 'user1',
          userName: 'Sarah',
          action: 'created',
          target: 'milestone',
          timestamp: '2026-04-01T12:00:00Z',
        };

        const result = validateActivity(validData);
        expect(result.userName).toBe('Sarah');
      });
    });

    describe('validateAnalyticsMetric', () => {
      it('returns parsed metric for valid data', () => {
        const validData = {
          name: 'Revenue',
          value: 1000000,
          change: 5.5,
          trend: 'up' as const,
        };

        const result = validateAnalyticsMetric(validData);
        expect(result.name).toBe('Revenue');
      });
    });

    describe('validateCalendarEvent', () => {
      it('returns parsed event for valid data', () => {
        const validData = {
          id: '1',
          title: 'Meeting',
          type: 'meeting' as const,
          start: '2026-04-01T12:00:00Z',
        };

        const result = validateCalendarEvent(validData);
        expect(result.title).toBe('Meeting');
      });
    });
  });

  describe('Safe Parse Functions', () => {
    describe('safeParseNotification', () => {
      it('returns success for valid data', () => {
        const validData = {
          id: '1',
          type: 'notification' as const,
          title: 'Test',
          description: 'Test',
          read: false,
          timestamp: '2026-04-01T12:00:00Z',
          severity: 'info' as const,
        };

        const result = safeParseNotification(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.title).toBe('Test');
        }
      });

      it('returns error for invalid data', () => {
        const invalidData = { id: '1' };
        const result = safeParseNotification(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles notification with special characters in title', () => {
      const validNotification = {
        id: '1',
        type: 'notification' as const,
        title: 'Test: <script>alert("xss")</script>',
        description: 'Test with special chars: & < > " \'',
        read: false,
        timestamp: '2026-04-01T12:00:00Z',
        severity: 'info' as const,
      };

      const result = NotificationSchema.parse(validNotification);
      expect(result.title).toContain('<script>');
    });

    it('handles very long content in chat message', () => {
      const longMessage = 'A'.repeat(10000);
      const validMessage = {
        id: '1',
        userId: 'user1',
        userName: 'John',
        content: longMessage,
        timestamp: '2026-04-01T12:00:00Z',
        type: 'text' as const,
      };

      const result = ChatMessageSchema.parse(validMessage);
      expect(result.content).toHaveLength(10000);
    });

    it('handles notification with complex data object', () => {
      const validNotification = {
        id: '1',
        type: 'notification' as const,
        title: 'Test',
        description: 'Test',
        read: false,
        timestamp: '2026-04-01T12:00:00Z',
        severity: 'info' as const,
        data: {
          nested: { key: 'value' },
          array: [1, 2, 3],
        },
      };

      const result = NotificationSchema.parse(validNotification);
      expect(result.data).toBeDefined();
    });
  });
});
