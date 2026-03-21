// Module: Dashboard — CortexBuild Ultimate
import { useState } from 'react';
import {
  TrendingUp, TrendingDown, FolderOpen, HardHat, FileText, ShieldCheck,
  MessageSquare, AlertCircle, Activity, CheckCircle2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useProjects, useInvoices, useTeam, useSafety, useRFIs, useDailyReports } from '../../hooks/useData';
import type { Module } from '../../types';
import clsx from 'clsx';

type AnyRow = Record<string, unknown>;

interface DashboardProps {
  setModule: (m: Module) => void;
}

// Static monthly chart — production would pull from a financial_periods table
const CHART_DATA = [
  { month:'Sep', revenue:485000, profit:143000 },
  { month:'Oct', revenue:612000, profit:167000 },
  { month:'Nov', revenue:534000, profit:156000 },
  { month:'Dec', revenue:298000, profit:73000  },
  { month:'Jan', revenue:721000, profit:209000 },
  { month:'Feb', revenue:856000, profit:255000 },
  { month:'Mar', revenue:943000, profit:295000 },
];

export function Dashboard({ setModule }: DashboardProps) {
  const [activeProject, setActiveProject] = useState<string | null>(null);

  const { data: rawProjects  = [] } = useProjects.useList();
  const { data: rawInvoices  = [] } = useInvoices.useList();
  const { data: rawTeam      = [] } = useTeam.useList();
  const { data: rawSafety    = [] } = useSafety.useList();
  const { data: rawRFIs      = [] } = useRFIs.useList();
  const { data: rawReports   = [] } = useDailyReports.useList();

  const projects  = rawProjects  as AnyRow[];
  const invoices  = rawInvoices  as AnyRow[];
  const team      = rawTeam      as AnyRow[];
  const safety    = rawSafety    as AnyRow[];
  const rfis      = rawRFIs      as AnyRow[];
  const reports   = rawReports   as AnyRow[];

  const activeProjects   = projects.filter(p => p.status === 'active').slice(0, 3);
  const totalRevenue     = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount ?? 0), 0);
  const outstanding      = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + Number(i.amount ?? 0), 0);
  const workerCount      = team.filter(m => m.status === 'active' || !m.status).length;
  const openIncidents    = safety.filter(s => s.status === 'open' || s.status === 'investigating').length;
  const openRFIs         = rfis.filter(r => r.status === 'open' || r.status === 'pending').length;
  const safetyDays       = safety.filter(s => s.type === 'incident' || s.type === 'riddor').length;

  function fmtM(n: number) {
    if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000)     return `£${(n / 1_000).toFixed(0)}K`;
    return `£${n.toLocaleString()}`;
  }

  const statCards = [
    { label:'Revenue Collected', value:fmtM(totalRevenue),       change:'+12.4%', isPositive:true,  icon:TrendingUp,    iconBg:'bg-blue-500/20',    iconColor:'text-blue-400'   },
    { label:'Active Projects',   value:String(activeProjects.length), change:'This month',      isPositive:true,  icon:FolderOpen,    iconBg:'bg-purple-500/20',  iconColor:'text-purple-400' },
    { label:'Workers On Site',   value:String(workerCount),      change:'Team total',      isPositive:true,  icon:HardHat,       iconBg:'bg-green-500/20',   iconColor:'text-green-400'  },
    { label:'Outstanding',       value:fmtM(outstanding),        change:'Invoices due',    isPositive:false, icon:FileText,      iconBg:'bg-yellow-500/20',  iconColor:'text-yellow-400' },
    { label:'Open Incidents',    value:String(openIncidents),    change:'Needs action',    isPositive:openIncidents===0, icon:ShieldCheck, iconBg:'bg-emerald-500/20', iconColor:'text-emerald-400' },
    { label:'Open RFIs',         value:String(openRFIs),         change:'Awaiting response', isPositive:false, icon:MessageSquare, iconBg:'bg-orange-500/20', iconColor:'text-orange-400' },
  ];

  // Derive recent activity feed from live data
  type ActivityEntry = { label: string; time: string; color: string; sortKey: string };
  const activityFeed: ActivityEntry[] = [];

  // Recent invoices
  invoices.slice(0, 3).forEach(inv => {
    const num = String(inv.number ?? '');
    const client = String(inv.client ?? '');
    const status = String(inv.status ?? '');
    const date = String(inv.issueDate ?? inv.issue_date ?? '');
    activityFeed.push({
      label: `Invoice ${num} ${status === 'paid' ? 'paid by' : status === 'sent' ? 'sent to' : `(${status}) —`} ${client}`,
      time: date,
      color: status === 'paid' ? 'bg-green-500/30' : status === 'overdue' ? 'bg-red-500/30' : 'bg-blue-500/30',
      sortKey: date,
    });
  });

  // Recent safety incidents (open/investigating)
  safety.filter(s => s.status === 'open' || s.status === 'investigating').slice(0, 2).forEach(inc => {
    activityFeed.push({
      label: `Safety: ${String(inc.title ?? '')} — ${String(inc.project ?? '')}`,
      time: String(inc.date ?? ''),
      color: String(inc.severity ?? '') === 'critical' ? 'bg-red-500/30' : 'bg-yellow-500/30',
      sortKey: String(inc.date ?? ''),
    });
  });

  // Recent daily reports
  reports.slice(0, 2).forEach(r => {
    activityFeed.push({
      label: `Daily report submitted — ${String(r.project ?? '')}`,
      time: String(r.date ?? ''),
      color: 'bg-emerald-500/30',
      sortKey: String(r.date ?? ''),
    });
  });

  // Recent RFIs (open/pending)
  rfis.filter(r => r.status === 'open' || r.status === 'pending').slice(0, 2).forEach(rfi => {
    activityFeed.push({
      label: `${String(rfi.number ?? '')} — ${String(rfi.subject ?? '')}`,
      time: String(rfi.submittedDate ?? rfi.submitted_date ?? ''),
      color: 'bg-purple-500/30',
      sortKey: String(rfi.submittedDate ?? rfi.submitted_date ?? ''),
    });
  });

  // Sort by date descending and take top 6
  const recentActivities = activityFeed
    .sort((a, b) => (b.sortKey > a.sortKey ? 1 : b.sortKey < a.sortKey ? -1 : 0))
    .slice(0, 6)
    .map(a => {
      // Convert ISO date to relative label
      const diff = Math.floor((Date.now() - new Date(a.time).getTime()) / 86400000);
      const timeLabel = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : `${diff} days ago`;
      return { label: a.label, time: timeLabel, color: a.color };
    });

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      {/* Hero Banner */}
      <div className="mb-6 rounded-2xl border border-blue-800/30 bg-gradient-to-r from-blue-900/40 to-purple-900/20 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Good morning, Adrian 👋</h1>
            <p className="mt-1 text-sm text-gray-400">Saturday, 21 March 2026 • 14°C Partly Cloudy, London</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-blue-300">Your sites are running smoothly</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={clsx('rounded-2xl border border-gray-800 bg-gray-900 p-5','transition-all duration-300 hover:border-gray-700 hover:bg-gray-900/80')}>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-400">{card.label}</span>
                <div className={clsx(card.iconBg, 'flex h-10 w-10 items-center justify-center rounded-xl')}>
                  <Icon className={clsx('h-5 w-5', card.iconColor)} />
                </div>
              </div>
              <p className="mb-2 text-2xl font-bold text-white">{card.value}</p>
              <div className="flex items-center gap-1">
                {card.isPositive ? <TrendingUp className="h-4 w-4 text-green-400"/> : <TrendingDown className="h-4 w-4 text-red-400"/>}
                <span className={card.isPositive ? 'text-green-400 text-xs font-medium' : 'text-red-400 text-xs font-medium'}>{card.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Revenue vs Profit</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={CHART_DATA}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
              <XAxis dataKey="month" stroke="#9ca3af"/>
              <YAxis stroke="#9ca3af"/>
              <Tooltip contentStyle={{backgroundColor:'#111827',border:'1px solid #374151'}}/>
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGrad)"/>
              <Area type="monotone" dataKey="profit"  stroke="#10b981" fill="url(#profitGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Project Status Overview</h3>
          <div className="space-y-3">
            {activeProjects.map(proj => (
              <div key={String(proj.id)} className="rounded-lg border border-gray-800 bg-gray-800/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-white">{String(proj.name??'').split(' ').slice(0,2).join(' ')}</p>
                  <span className="text-xs font-bold text-blue-400">{String(proj.progress??0)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-700">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{width:`${Number(proj.progress??0)}%`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Cards & Activity */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-white">Active Projects</h3>
          {activeProjects.map(proj => (
            <div key={String(proj.id)} onClick={()=>setActiveProject(String(proj.id))}
              className={clsx('cursor-pointer rounded-2xl border border-gray-800 bg-gray-900 p-5','transition-all duration-300 hover:border-blue-700/50 hover:bg-gray-900/80',
                activeProject===String(proj.id)&&'border-blue-600 ring-1 ring-blue-500/50')}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{String(proj.name??'')}</p>
                  <p className="text-xs text-gray-400">{String(proj.client??'')}</p>
                </div>
                <p className="text-sm font-bold text-blue-400">{String(proj.progress??0)}%</p>
              </div>
              <div className="mb-3 h-2 w-full rounded-full bg-gray-700">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600" style={{width:`${Number(proj.progress??0)}%`}}/>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><p className="text-gray-400">Budget</p><p className="font-semibold text-white">£{(Number(proj.budget??0)/1000000).toFixed(1)}M</p></div>
                <div><p className="text-gray-400">Spent</p><p className="font-semibold text-white">£{(Number(proj.spent??0)/1000000).toFixed(1)}M</p></div>
                <div><p className="text-gray-400">Workers</p><p className="font-semibold text-white">{String(proj.workers??0)}</p></div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivities.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className={clsx(activity.color, 'mt-1 h-2 w-2 rounded-full flex-shrink-0')}/>
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
          { label:'New Invoice',   icon:FileText,      module:'invoicing'     as Module },
          { label:'Log Incident',  icon:AlertCircle,   module:'safety'        as Module },
          { label:'New RFI',       icon:MessageSquare, module:'rfis'          as Module },
          { label:'Daily Report',  icon:Activity,      module:'daily-reports' as Module },
        ].map((action, idx) => {
          const Icon = action.icon;
          return (
            <button key={idx} onClick={()=>setModule(action.module)}
              className={clsx('group relative rounded-xl border border-gray-800 bg-gray-900 p-4',
                'transition-all duration-300 hover:border-blue-600/50 hover:bg-gray-900/80','overflow-hidden')}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:via-blue-600/10 group-hover:to-purple-600/10 transition-all duration-300"/>
              <div className="relative flex flex-col items-center gap-2">
                <Icon className="h-5 w-5 text-blue-400"/>
                <span className="text-xs font-medium text-white">{action.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Safety Banner */}
      <div className="rounded-2xl border border-emerald-800/30 bg-gradient-to-r from-emerald-900/30 to-emerald-800/10 p-4">
        <div className="flex items-center gap-3">
          {openIncidents === 0 ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0"/>
          ) : (
            <AlertCircle className="h-6 w-6 text-yellow-400 flex-shrink-0"/>
          )}
          <div>
            {openIncidents === 0 ? (
              <>
                <p className="text-sm font-semibold text-white">{safetyDays > 0 ? `${safetyDays} safety records on file` : 'No open safety incidents'}</p>
                <p className="text-xs text-emerald-300">Excellent safety record. Keep up the great work!</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-white">{openIncidents} open safety incident{openIncidents>1?'s':''} require attention</p>
                <p className="text-xs text-yellow-300">Review and close out incidents promptly.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
