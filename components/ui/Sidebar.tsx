'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const modules = [
  { name: 'RFIs', href: '/dashboard/rfis', icon: '📋' },
  { name: 'Change Orders', href: '/dashboard/change-orders', icon: '📝' },
  { name: 'Submittals', href: '/dashboard/submittals', icon: '📤' },
  { name: 'Documents', href: '/dashboard/documents', icon: '📁' },
  { name: 'Equipment', href: '/dashboard/equipment', icon: '🔧' },
  { name: 'Inspections', href: '/dashboard/inspections', icon: '✅' },
  { name: 'Meetings', href: '/dashboard/meetings', icon: '📅' },
  { name: 'Timesheets', href: '/dashboard/timesheets', icon: '⏰' },
  { name: 'Materials', href: '/dashboard/materials', icon: '🏗️' },
  { name: 'Subcontractors', href: '/dashboard/subcontractors', icon: '👷' },
  { name: 'Budgets', href: '/dashboard/budgets', icon: '💰' },
  { name: 'Team', href: '/dashboard/team', icon: '👥' },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <Link href="/dashboard">
          <h1 className="text-xl font-bold px-2">CortexBuild</h1>
          <p className="text-xs text-slate-400 px-2">Construction Platform</p>
        </Link>
      </div>

      <nav className="space-y-1">
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center px-3 py-2 rounded-lg transition-colors',
            isActive('/dashboard') && pathname === '/dashboard'
              ? 'bg-slate-800 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          )}
        >
          <span className="mr-3">🏠</span>
          Dashboard
        </Link>
        <Link
          href="/dashboard/projects"
          className={cn(
            'flex items-center px-3 py-2 rounded-lg transition-colors',
            isActive('/dashboard/projects')
              ? 'bg-slate-800 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          )}
        >
          <span className="mr-3">📌</span>
          Projects
        </Link>
        
        <div className="pt-4 pb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase px-3">Modules</span>
        </div>
        
        {modules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className={cn(
              'flex items-center px-3 py-2 rounded-lg transition-colors',
              isActive(mod.href)
                ? 'bg-slate-800 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            )}
          >
            <span className="mr-3">{mod.icon}</span>
            {mod.name}
          </Link>
        ))}

        <div className="pt-4 pb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase px-3">Tools</span>
        </div>

        <Link
          href="/dashboard/ai-insights"
          className={cn(
            'flex items-center px-3 py-2 rounded-lg transition-colors',
            isActive('/dashboard/ai-insights')
              ? 'bg-slate-800 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          )}
        >
          <span className="mr-3">🤖</span>
          AI Insights
        </Link>
        <Link
          href="/dashboard/daily-reports"
          className={cn(
            'flex items-center px-3 py-2 rounded-lg transition-colors',
            isActive('/dashboard/daily-reports')
              ? 'bg-slate-800 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          )}
        >
          <span className="mr-3">📊</span>
          Daily Reports
        </Link>
        <Link
          href="/dashboard/tasks"
          className={cn(
            'flex items-center px-3 py-2 rounded-lg transition-colors',
            isActive('/dashboard/tasks')
              ? 'bg-slate-800 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          )}
        >
          <span className="mr-3">✅</span>
          Tasks
        </Link>
        <Link
          href="/dashboard/safety"
          className={cn(
            'flex items-center px-3 py-2 rounded-lg transition-colors',
            isActive('/dashboard/safety')
              ? 'bg-slate-800 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          )}
        >
          <span className="mr-3">⚠️</span>
          Safety
        </Link>
        <Link
          href="/dashboard/reports"
          className={cn(
            'flex items-center px-3 py-2 rounded-lg transition-colors',
            isActive('/dashboard/reports')
              ? 'bg-slate-800 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          )}
        >
          <span className="mr-3">📈</span>
          Reports
        </Link>
        <Link
          href="/dashboard/maps"
          className={cn(
            'flex items-center px-3 py-2 rounded-lg transition-colors',
            isActive('/dashboard/maps')
              ? 'bg-slate-800 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          )}
        >
          <span className="mr-3">🗺️</span>
          Maps
        </Link>

        <div className="pt-4 pb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase px-3">System</span>
        </div>

        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center px-3 py-2 rounded-lg transition-colors',
            isActive('/dashboard/settings')
              ? 'bg-slate-800 text-white'
              : 'text-slate-300 hover:bg-slate-800'
          )}
        >
          <span className="mr-3">⚙️</span>
          Settings
        </Link>
      </nav>
    </aside>
  );
}