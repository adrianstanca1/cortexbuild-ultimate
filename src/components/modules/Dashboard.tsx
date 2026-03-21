// Module: Dashboard — CortexBuild Ultimate
import { useState } from 'react';
import {
  TrendingUp, TrendingDown, FolderOpen, HardHat, FileText, ShieldCheck,
  MessageSquare, AlertCircle, Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { revenueData, projects } from '../../data/mockData';
import type { Module } from '../../types';
import clsx from 'clsx';

interface DashboardProps {
  setModule: (m: Module) => void;
}

export function Dashboard({ setModule }: DashboardProps) {
  const [activeProject, setActiveProject] = useState<string | null>(null);

  const statCards = [
    {
      label: 'Total Revenue YTD',
      value: '£2,853,200',
      change: '+12.4%',
      isPositive: true,
      icon: TrendingUp,
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400'
    },
    {
      label: 'Active Projects',
      value: '4',
      change: '+1 this month',
      isPositive: true,
      icon: FolderOpen,
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400'
    },
    {
      label: 'Workers On Site',
      value: '88',
      change: 'Same as last week',
      isPositive: true,
      icon: HardHat,
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400'
    },
    {
      label: 'Outstanding Invoices',
      value: '£392,000',
      change: '-8.2%',
      isPositive: false,
      icon: FileText,
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400'
    },
    {
      label: 'Safety Score',
      value: '94%',
      change: '+2pts',
      isPositive: true,
      icon: ShieldCheck,
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400'
    },
    {
      label: 'Open RFIs',
      value: '8',
      change: '+3 this week',
      isPositive: false,
      icon: MessageSquare,
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400'
    }
  ];

  const activeProjects = projects.filter(p => p.status === 'active').slice(0, 3);
  const recentActivities = [
    { label: 'Invoice INV-2026-0142 sent', time: '2 hours ago', color: 'bg-blue-500/30' },
    { label: 'Safety incident logged — Near miss', time: '4 hours ago', color: 'bg-yellow-500/30' },
    { label: 'Canary Wharf Floor 8 concrete pour completed', time: '1 day ago', color: 'bg-green-500/30' },
    { label: 'RFI-MC-018 assigned to client', time: '2 days ago', color: 'bg-purple-500/30' },
    { label: 'Weekly safety report compiled', time: '3 days ago', color: 'bg-emerald-500/30' }
  ];

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      {/* Hero Banner */}
      <div className="mb-6 rounded-2xl border border-blue-800/30 bg-gradient-to-r from-blue-900/40 to-purple-900/20 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Good morning, Adrian 👋
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Saturday, 21 March 2026 • 14°C Partly Cloudy, London
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-blue-300">Your sites are running smoothly</p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={clsx(
                'rounded-2xl border border-gray-800 bg-gray-900 p-5',
                'transition-all duration-300 hover:border-gray-700 hover:bg-gray-900/80'
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-400">{card.label}</span>
                <div className={clsx(card.iconBg, 'flex h-10 w-10 items-center justify-center rounded-xl')}>
                  <Icon className={clsx('h-5 w-5', card.iconColor)} />
                </div>
              </div>
              <div className="mb-2">
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
              <div className="flex items-center gap-1">
                {card.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span className={card.isPositive ? 'text-green-400 text-xs font-medium' : 'text-red-400 text-xs font-medium'}>
                  {card.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Revenue vs Profit</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGradient)" />
              <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#profitGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Project Status Overview */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Project Status Overview</h3>
          <div className="space-y-3">
            {activeProjects.map(proj => (
              <div key={proj.id} className="rounded-lg border border-gray-800 bg-gray-800/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-white">{proj.name.split(' ').slice(0, 2).join(' ')}</p>
                  <span className="text-xs font-bold text-blue-400">{proj.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Cards & Activity Feed */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {/* Active Projects Detail */}
        <div className="col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-white">Active Projects</h3>
          {activeProjects.map(proj => (
            <div
              key={proj.id}
              onClick={() => setActiveProject(proj.id)}
              className={clsx(
                'cursor-pointer rounded-2xl border border-gray-800 bg-gray-900 p-5',
                'transition-all duration-300 hover:border-blue-700/50 hover:bg-gray-900/80',
                activeProject === proj.id && 'border-blue-600 ring-1 ring-blue-500/50'
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{proj.name}</p>
                  <p className="text-xs text-gray-400">{proj.client}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-400">{proj.progress}%</p>
                </div>
              </div>
              <div className="mb-3 h-2 w-full rounded-full bg-gray-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                  style={{ width: `${proj.progress}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-gray-400">Budget</p>
                  <p className="font-semibold text-white">£{(proj.budget / 1000000).toFixed(1)}M</p>
                </div>
                <div>
                  <p className="text-gray-400">Spent</p>
                  <p className="font-semibold text-white">£{(proj.spent / 1000000).toFixed(1)}M</p>
                </div>
                <div>
                  <p className="text-gray-400">Workers</p>
                  <p className="font-semibold text-white">{proj.workers}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivities.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className={clsx(activity.color, 'mt-1 h-2 w-2 rounded-full flex-shrink-0')} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white">{activity.label}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        {[
          { label: 'New Invoice', icon: FileText, module: 'invoicing' as Module },
          { label: 'Log Incident', icon: AlertCircle, module: 'safety' as Module },
          { label: 'New RFI', icon: MessageSquare, module: 'rfis' as Module },
          { label: 'Daily Report', icon: Activity, module: 'daily-reports' as Module }
        ].map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={() => setModule(action.module)}
              className={clsx(
                'group relative rounded-xl border border-gray-800 bg-gray-900 p-4',
                'transition-all duration-300 hover:border-blue-600/50 hover:bg-gray-900/80',
                'overflow-hidden'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:via-blue-600/10 group-hover:to-purple-600/10 transition-all duration-300" />
              <div className="relative flex flex-col items-center gap-2">
                <Icon className="h-5 w-5 text-blue-400" />
                <span className="text-xs font-medium text-white">{action.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Safety Banner */}
      <div className="rounded-2xl border border-emerald-800/30 bg-gradient-to-r from-emerald-900/30 to-emerald-800/10 p-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">18 Incident-Free Days</p>
            <p className="text-xs text-emerald-300">Excellent safety record. Keep up the great work!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
