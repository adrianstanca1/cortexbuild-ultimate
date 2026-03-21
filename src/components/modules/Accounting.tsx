// Module: Accounting
import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { revenueData } from '../../data/mockData';
import { TrendingUp } from 'lucide-react';

export function Accounting() {
  const [activeTab, setActiveTab] = useState('pl');

  const budgetData = [
    { project: 'Canary Wharf', budget: 4200000, spent: 2856000, remaining: 1344000 },
    { project: 'Manchester', budget: 2800000, spent: 952000, remaining: 1848000 },
    { project: 'Birmingham', budget: 1600000, spent: 1424000, remaining: 176000 },
  ];

  const costCodes = [
    { code: 'Labour', budgeted: 2400000, actual: 1680000, variance: 720000 },
    { code: 'Materials', budgeted: 2800000, actual: 1960000, variance: 840000 },
    { code: 'Plant', budgeted: 800000, actual: 560000, variance: 240000 },
    { code: 'Subcontractors', budgeted: 1200000, actual: 780000, variance: 420000 },
    { code: 'Overheads', budgeted: 600000, actual: 480000, variance: 120000 },
  ];

  const cashFlowData = [
    { month: 'Sep', cashIn: 485000, cashOut: 342000, balance: 143000 },
    { month: 'Oct', cashIn: 612000, cashOut: 445000, balance: 310000 },
    { month: 'Nov', cashIn: 534000, cashOut: 378000, balance: 622000 },
    { month: 'Dec', cashIn: 298000, cashOut: 225000, balance: 695000 },
    { month: 'Jan', cashIn: 721000, cashOut: 512000, balance: 904000 },
    { month: 'Feb', cashIn: 856000, cashOut: 601000, balance: 1159000 },
    { month: 'Mar', cashIn: 943000, cashOut: 648000, balance: 1454000 },
  ];

  const kpis = [
    { label: 'Gross Margin %', value: '31.2%', change: 2.1 },
    { label: 'Turnover YTD', value: '£4.45M', change: 8.5 },
    { label: 'Profit YTD', value: '£1.29M', change: 12.3 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Accounting & Finance</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">{kpi.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-bold text-white">{kpi.value}</h3>
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <TrendingUp className="w-4 h-4" />
                +{kpi.change}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-800">
        {[
          { id: 'pl', label: 'P&L' },
          { id: 'cash', label: 'Cash Flow' },
          { id: 'budget', label: 'Budget Tracking' },
          { id: 'costs', label: 'Cost Codes' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* P&L Tab */}
      {activeTab === 'pl' && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Revenue vs Costs vs Profit</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" />
                <Bar dataKey="costs" fill="#ef4444" />
                <Bar dataKey="profit" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Revenue', value: '£4.45M', color: 'blue' },
              { label: 'Total Costs', value: '£3.16M', color: 'red' },
              { label: 'Gross Profit', value: '£1.29M', color: 'green' },
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">{item.label}</p>
                <p className="text-xl font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cash Flow Tab */}
      {activeTab === 'cash' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Cash Position</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} />
              <Legend />
              <Line type="monotone" dataKey="cashIn" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="cashOut" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} name="Running Balance" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Budget Tracking Tab */}
      {activeTab === 'budget' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-400">
              <thead>
                <tr className="bg-gray-800/50 border-b border-gray-800">
                  <th className="px-6 py-3 text-left font-semibold text-white">Project</th>
                  <th className="px-6 py-3 text-right font-semibold text-white">Budget</th>
                  <th className="px-6 py-3 text-right font-semibold text-white">Spent</th>
                  <th className="px-6 py-3 text-right font-semibold text-white">Remaining</th>
                  <th className="px-6 py-3 text-right font-semibold text-white">% Used</th>
                  <th className="px-6 py-3 text-left font-semibold text-white">Status</th>
                </tr>
              </thead>
              <tbody>
                {budgetData.map((row, idx) => {
                  const percentUsed = (row.spent / row.budget) * 100;
                  const status = percentUsed > 80 ? 'red' : percentUsed > 60 ? 'yellow' : 'green';
                  return (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="px-6 py-4 font-medium text-white">{row.project}</td>
                      <td className="px-6 py-4 text-right font-semibold text-white">£{(row.budget / 1000000).toFixed(1)}M</td>
                      <td className="px-6 py-4 text-right text-white">£{(row.spent / 1000000).toFixed(1)}M</td>
                      <td className="px-6 py-4 text-right font-semibold text-green-400">£{(row.remaining / 1000000).toFixed(1)}M</td>
                      <td className="px-6 py-4 text-right font-semibold text-white">{percentUsed.toFixed(1)}%</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          status === 'green' ? 'bg-green-500/20 text-green-400' :
                          status === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cost Codes Tab */}
      {activeTab === 'costs' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-400">
              <thead>
                <tr className="bg-gray-800/50 border-b border-gray-800">
                  <th className="px-6 py-3 text-left font-semibold text-white">Cost Code</th>
                  <th className="px-6 py-3 text-right font-semibold text-white">Budgeted</th>
                  <th className="px-6 py-3 text-right font-semibold text-white">Actual</th>
                  <th className="px-6 py-3 text-right font-semibold text-white">Variance</th>
                  <th className="px-6 py-3 text-right font-semibold text-white">% Spent</th>
                </tr>
              </thead>
              <tbody>
                {costCodes.map((row, idx) => {
                  const percentSpent = (row.actual / row.budgeted) * 100;
                  return (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="px-6 py-4 font-medium text-white">{row.code}</td>
                      <td className="px-6 py-4 text-right font-semibold text-white">£{(row.budgeted / 1000000).toFixed(1)}M</td>
                      <td className="px-6 py-4 text-right text-white">£{(row.actual / 1000000).toFixed(1)}M</td>
                      <td className="px-6 py-4 text-right font-semibold text-green-400">£{(row.variance / 1000000).toFixed(1)}M</td>
                      <td className="px-6 py-4 text-right font-semibold text-white">{percentSpent.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
