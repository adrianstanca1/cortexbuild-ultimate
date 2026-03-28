'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BellIcon,
  QuestionMarkCircleIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification } from '@/lib/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

export default function Header() {
  const [selectedProject, setSelectedProject] = useState('all');
  const { data, isLoading } = useNotifications({ pageSize: 10 });
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await markAsRead.mutateAsync(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteNotification.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="all">All Projects</option>
            <option value="metro">Metro Station</option>
            <option value="office">Office Tower</option>
            <option value="hospital">Hospital Wing</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            <QuestionMarkCircleIcon className="w-5 h-5" />
          </button>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[320px] max-w-[400px] bg-white rounded-xl shadow-lg border border-slate-200 p-2"
                align="end"
                sideOffset={8}
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto mt-2">
                  {isLoading ? (
                    <div className="px-3 py-4 text-center text-sm text-slate-500">
                      Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-3 py-8 text-center text-sm text-slate-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <DropdownMenu.Item
                        key={notification.id}
                        className="outline-none"
                        disabled={notification.read}
                      >
                        <div
                          className={`relative p-3 rounded-lg mb-1 cursor-pointer ${
                            notification.read
                              ? 'bg-white'
                              : 'bg-blue-50 hover:bg-blue-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {notification.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <button
                                  onClick={(e) => handleMarkAsRead(notification.id, e)}
                                  className="p-1 text-slate-400 hover:text-blue-600"
                                  title="Mark as read"
                                >
                                  <span className="w-2 h-2 bg-blue-500 rounded-full block" />
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDelete(notification.id, e)}
                                className="p-1 text-slate-400 hover:text-red-600"
                                title="Delete"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        </div>
                      </DropdownMenu.Item>
                    ))
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100">
                  <Link
                    href="/dashboard/notifications"
                    className="block px-3 py-2 text-sm text-center text-blue-600 hover:text-blue-700"
                  >
                    View all notifications
                  </Link>
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center space-x-3 pl-4 border-l border-slate-200 hover:bg-slate-50 rounded-lg p-2 -mr-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                  U
                </div>
                <div className="text-sm text-left">
                  <div className="font-medium text-slate-900">User</div>
                  <div className="text-slate-500 text-xs">user@company.com</div>
                </div>
                <ChevronDownIcon className="w-4 h-4 text-slate-400" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[200px] bg-white rounded-xl shadow-lg border border-slate-200 p-2"
                align="end"
                sideOffset={8}
              >
                <DropdownMenu.Item asChild>
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer outline-none"
                  >
                    <UserIcon className="w-4 h-4" />
                    Profile
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item asChild>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer outline-none"
                  >
                    <Cog6ToothIcon className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-2 border-t border-slate-100" />

                <DropdownMenu.Item asChild>
                  <Link
                    href="/api/auth/signout"
                    className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer outline-none"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    Sign out
                  </Link>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  );
}
