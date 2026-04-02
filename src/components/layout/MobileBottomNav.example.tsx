/**
 * MobileBottomNav Usage Example
 * 
 * This file demonstrates how to integrate the MobileBottomNav component
 * into your CortexBuild Ultimate application.
 * 
 * Note: This is an example file showing integration patterns.
 * Import paths should be adjusted based on your project structure.
 */

import { useState } from 'react';
// Adjust import paths based on your project structure
// import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
// import { type Module } from '@/types';
import type { QueryClient } from '@tanstack/react-query';

// Mock types for example
type Module = 'dashboard' | 'projects' | 'tasks' | 'safety' | 'settings';

// Mock hook for example
function useQueryClient(): QueryClient {
  return {} as QueryClient;
}

// Example: App.tsx or main layout component
export function AppWithMobileNav() {
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

  // Handle module change
  const handleModuleChange = (module: Module) => {
    setActiveModule(module);
    // Navigate to the new module
    // router.push(`/${module}`);
  };

  // Handle menu toggle
  const handleMenuToggle = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Refetch data, invalidate queries, etc.
    console.log('Data refreshed!');
  };

  return (
    <div className="app">
      {/* Your main content */}
      <main>
        <h1>Active Module: {activeModule}</h1>
        {/* Module content here */}
      </main>

      {/* Mobile Bottom Navigation - Uncomment when using */}
      {/* 
      <MobileBottomNav
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
        onMenuToggle={handleMenuToggle}
        notificationCount={notificationCount}
        userInitials="AS"
        onRefresh={handleRefresh}
      />
      */}

      {/* Optional: Mobile Sidebar/Drawer */}
      {isSidebarOpen && (
        <div className="mobile-sidebar">
          {/* Sidebar content */}
        </div>
      )}
    </div>
  );
}

// Example: Integration with React Router
export function AppWithRouter() {
  const [activeModule, setActiveModule] = useState<Module>('dashboard');

  const handleModuleChange = (module: Module) => {
    setActiveModule(module);
    // With React Router:
    // navigate(`/${module}`);
  };

  return (
    <>
      {/* Your routes */}
      {/* <Routes>...</Routes> */}

      {/* Mobile Bottom Navigation - Uncomment when using */}
      {/*
      <MobileBottomNav
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
        notificationCount={5}
        userInitials="JD"
      />
      */}
    </>
  );
}

// Example: With TanStack Query for data refresh
export function AppWithQuery() {
  const queryClient = useQueryClient();
  const [activeModule, setActiveModule] = useState<Module>('dashboard');

  const handleRefresh = async () => {
    // Invalidate all queries or specific ones
    await queryClient.invalidateQueries();
    // Or specific queries:
    // await queryClient.invalidateQueries(['projects']);
    // await queryClient.invalidateQueries(['tasks']);
  };

  return (
    <>
      {/* Mobile Bottom Navigation - Uncomment when using */}
      {/*
      <MobileBottomNav
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onRefresh={handleRefresh}
      />
      */}
    </>
  );
}

// Example: Customizing navigation items
// To customize the navigation items, modify the NAV_ITEMS constant
// in the MobileBottomNav.tsx file:
/*
const NAV_ITEMS: NavItem[] = [
  { module: 'dashboard', icon: LayoutDashboard, label: 'Home', accent: '#f59e0b' },
  { module: 'projects', icon: FolderOpen, label: 'Projects', accent: '#f59e0b' },
  { module: 'tasks', icon: CheckSquare, label: 'Tasks', accent: '#3b82f6' },
  { module: 'safety', icon: AlertTriangle, label: 'Safety', accent: '#ef4444' },
  { module: 'settings', icon: MoreHorizontal, label: 'More', accent: '#64748b' },
];
*/

// Example: Adding badge counts to navigation items
// Add a badge property to show notification counts:
/*
{ module: 'messages', icon: MessageSquare, label: 'Messages', accent: '#3b82f6', badge: 12 },
*/

// Features included:
// ✓ Fixed bottom navigation bar (5 items)
// ✓ Mobile header with hamburger menu, title, notifications, avatar
// ✓ Floating action button (FAB) with quick actions menu
// ✓ Swipe gestures to navigate between modules
// ✓ Pull-to-refresh support
// ✓ Long press for context menu
// ✓ Active state indicators with accent colors
// ✓ Smooth animations and transitions
// ✓ Dark theme compatible
// ✓ iOS safe area insets support
// ✓ Touch-optimized with large tap targets
// ✓ Accessible with ARIA labels
// ✓ Responsive (hides on desktop > 768px)
// ✓ Haptic feedback (on supported devices)
