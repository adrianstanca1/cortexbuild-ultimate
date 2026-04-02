/**
 * NotificationCenter Usage Examples
 * 
 * This file demonstrates how to use the NotificationCenter component
 * in different scenarios throughout CortexBuild Ultimate.
 */

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { NotificationCenter } from '@/components/modules';

// ============================================================================
// Example 1: Basic Usage in Header/Navbar
// ============================================================================

export function HeaderWithNotifications() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="navbar bg-base-100 border-b border-base-300">
      <div className="flex-1">
        <a className="btn btn-ghost normal-case text-xl">CortexBuild</a>
      </div>
      <div className="flex-none gap-2">
        {/* Notification Bell with Badge */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="btn btn-ghost btn-circle relative"
        >
          <Bell className="w-5 h-5" />
          {/* You would connect this to useNotificationCenter to get real count */}
          <span className="absolute top-2 right-2 badge badge-primary badge-xs">
            5
          </span>
        </button>
        
        {/* NotificationCenter Panel */}
        <NotificationCenter
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          position="top-right"
          variant="panel"
        />
      </div>
    </header>
  );
}

// ============================================================================
// Example 2: Full-Screen Modal Mode
// ============================================================================

export function NotificationsModalExample() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="p-4">
      <button
        onClick={() => setShowNotifications(true)}
        className="btn btn-primary gap-2"
      >
        <Bell className="w-5 h-5" />
        Open Notifications
      </button>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        position="top-right"
        variant="modal"
      />
    </div>
  );
}

// ============================================================================
// Example 3: Dropdown Style (Compact)
// ============================================================================

export function NotificationsDropdownExample() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="dropdown dropdown-end">
      <label
        tabIndex={0}
        onClick={() => setShowNotifications(!showNotifications)}
        className="btn btn-ghost btn-circle avatar"
      >
        <Bell className="w-5 h-5" />
      </label>
      
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        position="top-right"
        variant="dropdown"
        compact
      />
    </div>
  );
}

// ============================================================================
// Example 4: Integration with React Query (Recommended)
// ============================================================================

import { useQuery, useMutation } from '@tanstack/react-query';
import { useNotificationCenter } from '@/hooks/useNotificationCenter';

export function NotificationsWithReactQuery() {
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Use the comprehensive hook
  const {
    notifications,
    unreadCount,
    total,
    wsStatus,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotificationCenter({
    autoConnect: true,
    pollingInterval: 30000,
  });

  return (
    <>
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="btn btn-ghost btn-circle relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 badge badge-primary badge-xs">
            {unreadCount}
          </span>
        )}
        {/* Connection indicator */}
        <span
          className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${
            wsStatus.isConnected ? 'bg-success' : 'bg-error'
          }`}
        />
      </button>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        position="top-right"
        variant="panel"
      />
    </>
  );
}

// ============================================================================
// Example 5: Custom Notification Button with Badge
// ============================================================================

export function CustomNotificationButton() {
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotificationCenter();

  return (
    <>
      <style>{`
        @keyframes notification-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        .notification-pulse {
          animation: notification-pulse 2s infinite;
        }
      `}</style>

      <button
        onClick={() => setShowNotifications(true)}
        className="btn btn-ghost btn-circle relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1 right-1 badge badge-error badge-xs notification-pulse">
              {unreadCount}
            </span>
            <span className="absolute top-1 right-1 w-3 h-3 badge badge-error notification-pulse" />
          </>
        )}
      </button>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        position="top-right"
        variant="panel"
      />
    </>
  );
}

// ============================================================================
// Example 6: Multiple Position Options
// ============================================================================

export function NotificationPositionsDemo() {
  const [showTopRight, setShowTopRight] = useState(false);
  const [showTopLeft, setShowTopLeft] = useState(false);
  const [showBottomRight, setShowBottomRight] = useState(false);
  const [showBottomLeft, setShowBottomLeft] = useState(false);

  return (
    <div className="grid grid-cols-2 gap-4 p-8">
      <button
        onClick={() => setShowTopRight(true)}
        className="btn btn-primary"
      >
        Top Right
      </button>
      <button
        onClick={() => setShowTopLeft(true)}
        className="btn btn-secondary"
      >
        Top Left
      </button>
      <button
        onClick={() => setShowBottomRight(true)}
        className="btn btn-accent"
      >
        Bottom Right
      </button>
      <button
        onClick={() => setShowBottomLeft(true)}
        className="btn btn-info"
      >
        Bottom Left
      </button>

      <NotificationCenter
        isOpen={showTopRight}
        onClose={() => setShowTopRight(false)}
        position="top-right"
        variant="panel"
      />
      <NotificationCenter
        isOpen={showTopLeft}
        onClose={() => setShowTopLeft(false)}
        position="top-left"
        variant="panel"
      />
      <NotificationCenter
        isOpen={showBottomRight}
        onClose={() => setShowBottomRight(false)}
        position="bottom-right"
        variant="panel"
      />
      <NotificationCenter
        isOpen={showBottomLeft}
        onClose={() => setShowBottomLeft(false)}
        position="bottom-left"
        variant="panel"
      />
    </div>
  );
}

// ============================================================================
// Example 7: Keyboard Shortcut Integration
// ============================================================================

export function NotificationsWithKeyboardShortcut() {
  const [showNotifications, setShowNotifications] = useState(false);

  // Listen for keyboard shortcut (e.g., "n" key)
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowNotifications((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="btn btn-ghost btn-circle relative"
        title="Notifications (Press 'n')"
      >
        <Bell className="w-5 h-5" />
      </button>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        position="top-right"
        variant="panel"
      />
    </>
  );
}

// ============================================================================
// Example 8: With Custom Notification Sound
// ============================================================================

export function NotificationsWithCustomSound() {
  const [showNotifications, setShowNotifications] = useState(false);
  const { settings, updateSettings } = useNotificationCenter();

  const playCustomSound = () => {
    // Custom notification sound
    const audio = new Audio('/sounds/custom-notification.mp3');
    audio.volume = 0.7;
    audio.play().catch(console.error);
  };

  return (
    <>
      <button
        onClick={() => {
          playCustomSound();
          setShowNotifications(true);
        }}
        className="btn btn-ghost btn-circle relative"
      >
        <Bell className="w-5 h-5" />
      </button>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        position="top-right"
        variant="panel"
      />
    </>
  );
}

// ============================================================================
// Usage in Main App Layout
// ============================================================================

export function AppLayout() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="min-h-screen bg-base-200">
      {/* Top Navigation */}
      <nav className="navbar bg-base-100 shadow-lg sticky top-0 z-50">
        <div className="flex-1">
          <a className="btn btn-ghost normal-case text-xl">CortexBuild Ultimate</a>
        </div>
        <div className="flex-none gap-2">
          {/* Search */}
          <div className="form-control hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              className="input input-bordered w-24 md:w-auto"
            />
          </div>

          {/* Notifications */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn btn-ghost btn-circle relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 badge badge-primary badge-xs">
              3
            </span>
          </button>

          {/* User Menu */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img src="/avatars/user.jpg" alt="User" />
              </div>
            </label>
            <ul
              tabIndex={0}
              className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
            >
              <li><a>Profile</a></li>
              <li><a>Settings</a></li>
              <li><a>Logout</a></li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        {/* Your app content here */}
      </main>

      {/* NotificationCenter */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        position="top-right"
        variant="panel"
      />
    </div>
  );
}

export default AppLayout;
