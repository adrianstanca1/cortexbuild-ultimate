# CortexBuild Ultimate - New Features Guide

**Version:** 3.0.0  
**Last Updated:** 2026-04-01  
**Production URL:** https://www.cortexbuildpro.com

---

## 🆕 New Features Overview

This guide covers all new features added in version 3.0.0.

---

## 1. NotificationCenter 🔔

**Location:** Header → Bell icon

### Features
- Real-time notification center
- Filter by type (All, Unread, Read)
- Filter by notification type (Info, Success, Warning, Error, Alert)
- Mark as read/unread
- Delete notifications
- Action buttons for quick navigation

### Usage
1. Click the bell icon in the header
2. View all notifications in the modal
3. Click on a notification to take action
4. Use filters to find specific notifications
5. Click "Mark all read" to clear all unread indicators

### Keyboard Shortcuts
- `Esc` - Close notification center

---

## 2. Notification Preferences ⚙️

**Location:** Header → Settings gear icon

### Features
- Multi-channel notification settings
- Per-type notification preferences
- Toggle channels: Push, Email, SMS, In-App

### Available Notification Types
- **Safety Alerts** - Critical safety notifications
- **Project Updates** - Project status changes
- **Budget Alerts** - Budget variance notifications
- **Task Assignments** - New task assignments
- **Document Changes** - Document updates
- **Meeting Reminders** - Upcoming meeting notifications

### Usage
1. Click the settings gear icon in the header
2. Toggle notification channels for each type
3. Click "Save Preferences" to apply changes

---

## 3. TeamChat 💬

**Location:** Teams module → "Team Chat" button

### Features
- Real-time team messaging
- Message history
- Typing indicators
- System notifications
- Timestamp display

### Usage
1. Navigate to Teams module from sidebar
2. Click "Team Chat" button in header
3. Type message in input field
4. Press Enter or click Send to send message
5. Click X or outside modal to close

### Message Types
- **Text Messages** - Regular team messages
- **System Messages** - Automated notifications
- **File Messages** - File sharing (coming soon)

---

## 4. ActivityFeed 📋

**Location:** Dashboard → Live Intel row (center column)

### Features
- Real-time activity stream
- User activity tracking
- Module-specific activities
- Timestamp display
- Automatic refresh via WebSocket

### Activity Types
- **Comments** - User comments on items
- **Updates** - Record modifications
- **Alerts** - System alerts
- **Completions** - Task/item completions
- **Creations** - New item creations

### Usage
- Automatically displays on Dashboard
- Shows 5 most recent activities
- Scroll for more (coming soon)

---

## 5. Advanced Analytics 📊

**Location:** Sidebar → Overview → Advanced Analytics

### Features
- KPI dashboard with metrics
- Revenue vs Cost charts
- Project status distribution (pie chart)
- Productivity trends
- Performance indicators
- Time range selection (7d, 30d, 90d)

### Metrics Displayed
- **Total Revenue** - Total revenue with trend
- **Active Projects** - Current active project count
- **Team Members** - Total team size
- **Safety Incidents** - Incident count with trend

### Charts
1. **Revenue vs Costs** - Area chart comparing revenue and costs over time
2. **Project Status Distribution** - Pie chart showing project status breakdown
3. **Productivity Trends** - Line chart showing productivity and task completion
4. **KPI Gauges** - Progress bars for key performance indicators

### Usage
1. Navigate to Advanced Analytics from sidebar
2. Select time range from dropdown
3. Review metrics and charts
4. Hover over charts for detailed tooltips

---

## 6. Project Calendar 📅

**Location:** Sidebar → Overview → Project Calendar

### Features
- Month/Week/Day views
- Event management
- Color-coded event types
- Event details display
- Upcoming events sidebar

### Event Types
- **Meetings** - Blue
- **Deadlines** - Red
- **Inspections** - Yellow
- **Deliveries** - Green
- **Other** - Gray

### Usage
1. Navigate to Project Calendar from sidebar
2. Switch between Month/Week/Day views
3. Click arrows to navigate months
4. Click "Add Event" to create new event (coming soon)
5. View upcoming events in sidebar

### Event Details
- Title
- Type
- Date/Time
- Location
- Attendees
- Color coding

---

## 🔧 Technical Implementation

### WebSocket Integration

All real-time features use WebSocket:
```typescript
// Connection established automatically
// Events received via eventBus
eventBus.on('ws:message', ({ type }) => {
  if (type === 'notification') {
    // Handle notification
  }
});
```

### React Query Caching

Optimized caching settings:
```typescript
useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
  staleTime: 60_000,      // 60 seconds
  gcTime: 5 * 60_000,     // 5 minutes
  retry: 2,               // 2 retries
  refetchOnWindowFocus: false,
});
```

### Component Imports

```typescript
// NotificationCenter
import { NotificationCenter } from './components/ui/NotificationCenter';

// NotificationPreferences
import { NotificationPreferences } from './components/ui/NotificationPreferences';

// TeamChat
import { TeamChat } from './components/ui/TeamChat';

// ActivityFeed
import { ActivityFeed } from './components/ui/ActivityFeed';
```

---

## 📱 Mobile Support

All new features are mobile-responsive:
- NotificationCenter - Full-screen modal on mobile
- TeamChat - Optimized for mobile keyboards
- ActivityFeed - Horizontal scroll on small screens
- Advanced Analytics - Stacked layout on mobile
- Project Calendar - Month view default on mobile

---

## 🔐 Permissions

| Feature | Required Role |
|---------|--------------|
| NotificationCenter | All users |
| NotificationPreferences | All users |
| TeamChat | Team members |
| ActivityFeed | All users |
| Advanced Analytics | Project Manager+ |
| Project Calendar | All users |

---

## 🐛 Known Issues

None at this time.

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Contact support team
3. Report bugs via GitHub issues

---

*Last updated: 2026-04-01*
