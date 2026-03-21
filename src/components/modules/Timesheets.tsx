// Module: Timesheets
import React, { useState } from 'react';
import { Download, CheckCircle2 } from 'lucide-react';
import { timesheets } from '../../data/mockData';
import { Timesheet } from '../../types';

export function Timesheets() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentWeek, setCurrentWeek] = useState('2026-W11');

  const filteredTimesheets = filterStatus === 'all' ? timesheets : timesheets.filter(ts => ts.status === filterStatus);

  const statusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400';
      case 'approved': return 'bg-blue-500/20 text-blue-400';
      case 'submitted': return 'bg-orange-500/20 text-orange-400';
      case 'draft': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const totals = {
    hours: timesheets.reduce((sum, ts) => sum + ts.regularHours + ts.overtimeHours + ts.dayworkHours, 0),
    regular: timesheets.reduce((sum, ts) => sum + ts.regularHours, 0),
    overtime: timesheets.reduce((sum, ts) => sum + ts.overtimeHours, 0),
    daywork: timesheets.reduce((sum, ts) => sum + ts.dayworkHours, 0),
    labourCost: timesheets.reduce((sum, ts) => sum + ts.totalPay, 0),
    cisDeductions: timesheets.reduce((sum, ts) => sum + ts.cisDeduction, 0),
  };

  const stats = [
    { label: 'Total Hours', value: totals.hours.toString(), unit: 'h' },
    { label: 'Regular', value: totals.regular.toString(), unit: 'h' },
    { label: 'Overtime', value: totals.overtime.toString(), unit: 'h' },
    { label: 'Daywork', value: totals.daywork.toString(), unit: 'h' },
    { label: 'Labour Cost', value: '£' + totals.labourCost.toLocaleString(), unit: '' },
    { label: 'CIS Deductions', value: '£' + totals.cisDeductions.toFixed(2), unit: '' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Timesheets</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export to CSV
        </button>
      </div>

      {/* Week Selector */}
      <div className="flex gap-4 items-center bg-gray-900 border border-gray-800 rounded-xl p-4">
        <label className="text-gray-400 font-medium">Week:</label>
        <select
          value={currentWeek}
          onChange={(e) => setCurrentWeek(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        >
          <option>2026-W09</option>
          <option>2026-W10</option>
          <option selected>2026-W11</option>
          <option>2026-W12</option>
        </select>
        <span className="text-gray-400 text-sm">W11 2026 — 17–23 March</span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            {stat.unit && <p className="text-xs text-gray-400">{stat.unit}</p>}
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-800 overflow-x-auto pb-4">
        {['all', 'draft', 'submitted', 'approved', 'paid'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Timesheets Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-400">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="px-6 py-3 text-left font-semibold text-white">Worker</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Project</th>
                <th className="px-6 py-3 text-right font-semibold text-white">Regular</th>
                <th className="px-6 py-3 text-right font-semibold text-white">OT</th>
                <th className="px-6 py-3 text-right font-semibold text-white">Daywork</th>
                <th className="px-6 py-3 text-right font-semibold text-white">Total Pay</th>
                <th className="px-6 py-3 text-right font-semibold text-white">CIS (20%)</th>
                <th className="px-6 py-3 text-right font-semibold text-white">Net Pay</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTimesheets.map(ts => {
                const netPay = ts.totalPay - ts.cisDeduction;
                return (
                  <tr key={ts.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="px-6 py-4 font-medium text-white">{ts.worker}</td>
                    <td className="px-6 py-4 text-gray-300">{ts.project.split(' ').slice(0, 2).join(' ')}</td>
                    <td className="px-6 py-4 text-right text-white">{ts.regularHours}h</td>
                    <td className="px-6 py-4 text-right text-white">{ts.overtimeHours}h</td>
                    <td className="px-6 py-4 text-right text-white">{ts.dayworkHours}h</td>
                    <td className="px-6 py-4 text-right font-semibold text-white">£{ts.totalPay.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-orange-400 font-semibold">£{ts.cisDeduction.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-green-400">£{netPay.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(ts.status)}`}>
                        {ts.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-4">
        <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-semibold">Automated CIS Calculation</p>
          <p className="text-sm text-gray-400">CIS deduction calculated at 20% for verified subcontractors. Net pay after CIS shown for payment.</p>
        </div>
      </div>

      {/* Approve All (for managers) */}
      <button className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold">
        Approve All Submitted Timesheets
      </button>
    </div>
  );
}
