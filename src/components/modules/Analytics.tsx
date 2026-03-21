// Module: Analytics — CortexBuild Ultimate
import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { revenueData, safetyTrendData, projects } from '../../data/mockData';
import clsx from 'clsx';

export function Analytics() {
  const [activeTab, setActiveTab] = useState<'financial' | 'safety' | 'performance'>('financial');

  const revenueByType = [
    { name: 'Commercial', value: 1285440, color: '#3b82f6' },
    { name: 'Residential', value: 797644, color: '#8b5cf6' },
    { name: 'Civil', value: 511620, color: '#10b981' },
    { name: 'Industrial', value: 258496, color: '#f59e0b' }
  ];

  const invoiceAging = [
    { range: '0-30 days', amount: 94500, percentage: 16 },
    { range: '31-60 days', amount: 185000, percentage: 31 },
    { range: '61-90 days', amount: 67200, percentage: 11 },
    { range: '90+ days', amount: 195800, percentage: 33 }
  ];

  const incidentTypes = [
    { name: 'Near Miss', value: 44, color: '#fbbf24' },
    { name: 'Hazard', value: 15, color: '#f97316' },
    { name: 'Incident', value: 11, color: '#ef4444' }
  ];

  const budgetVariance = projects
    .filter(p => p.status === 'active')
    .map(p => {
      const variance = p.budget - p.spent;
      const variancePercent = (variance / p.budget) * 100;
      return {
        id: p.id,
        name: p.name.split(' ').slice(0, 2).join(' '),
        budget: p.budget / 1000000,
        spent: p.spent / 1000000,
        variance: variance / 1000000,
        variancePercent: variancePercent.toFixed(1),
        rag: variancePercent > 10 ? 'green' : variancePercent > 5 ? 'amber' : 'red'
      };
    });

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-4">Analytics & Intelligence</h1>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          {[
            { id: 'financial', label: 'Financial' },
            { id: 'safety', label: 'Safety' },
            { id: 'performance', label: 'Performance' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={clsx(
                'rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Turnover YTD', value: '£2.85M', color: 'text-blue-400' },
              { label: 'Gross Margin', value: '34.2%', color: 'text-green-400' },
              { label: 'EBITDA', value: '£486K', color: 'text-purple-400' },
              { label: 'Avg Project Value', value: '£2.24M', color: 'text-orange-400' }
            ].map((kpi, idx) => (
              <div key={idx} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <p className="text-xs text-gray-400">{kpi.label}</p>
                <p className={clsx('mt-2 text-2xl font-bold', kpi.color)}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Revenue Chart */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Revenue vs Cost vs Profit</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGrad)" />
                <Area type="monotone" dataKey="costs" stroke="#ef4444" fill="url(#costGrad)" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Revenue by Type */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <h3 className="mb-4 text-sm font-semibold text-white">Revenue by Project Type</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={revenueByType} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {revenueByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `£${(value as number / 1000).toFixed(0)}K`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Invoice Aging */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <h3 className="mb-4 text-sm font-semibold text-white">Invoice Aging</h3>
              <div className="space-y-3">
                {invoiceAging.map((item, idx) => (
                  <div key={idx}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-gray-400">{item.range}</span>
                      <span className="font-semibold text-white">£{(item.amount / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safety Tab */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Safety Score', value: '94/100', color: 'text-emerald-400' },
              { label: 'RIDDOR Incidents', value: '0', color: 'text-green-400' },
              { label: 'Total Incidents YTD', value: '11', color: 'text-orange-400' },
              { label: 'Toolbox Talks', value: '82', color: 'text-blue-400' }
            ].map((kpi, idx) => (
              <div key={idx} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <p className="text-xs text-gray-400">{kpi.label}</p>
                <p className={clsx('mt-2 text-2xl font-bold', kpi.color)}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Safety Trend */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Safety Trends (6 months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={safetyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} />
                <Legend />
                <Line type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="nearMisses" stroke="#fbbf24" strokeWidth={2} />
                <Line type="monotone" dataKey="toolboxTalks" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Incident Types */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Incident Types Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={incidentTypes} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {incidentTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Project Progress */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Project Progress Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projects.filter(p => p.status === 'active').map(p => ({
                name: p.name.split(' ').slice(0, 2).join(' '),
                progress: p.progress,
                budget: p.budget / 1000000,
                spent: p.spent / 1000000
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} />
                <Legend />
                <Bar dataKey="progress" fill="#3b82f6" />
                <Bar dataKey="spent" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Budget Variance */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Budget Variance Analysis</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-4 py-3 text-left font-semibold text-gray-400">Project</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-400">Budget</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-400">Spent</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-400">Variance</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-400">RAG</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetVariance.map(proj => (
                    <tr key={proj.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-white font-medium">{proj.name}</td>
                      <td className="px-4 py-3 text-right text-gray-400">£{proj.budget.toFixed(1)}M</td>
                      <td className="px-4 py-3 text-right text-orange-400 font-medium">£{proj.spent.toFixed(1)}M</td>
                      <td className="px-4 py-3 text-right font-semibold text-white">£{proj.variance.toFixed(1)}M ({proj.variancePercent}%)</td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx(
                          'inline-block h-3 w-3 rounded-full',
                          proj.rag === 'green' ? 'bg-green-500' : proj.rag === 'amber' ? 'bg-yellow-500' : 'bg-red-500'
                        )} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
