// Module: ChangeOrders
import React, { useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { changeOrders } from '../../data/mockData';
import { ChangeOrder } from '../../types';

export function ChangeOrders() {
  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-orange-500/20 text-orange-400';
      case 'draft': return 'bg-gray-500/20 text-gray-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const totalApproved = changeOrders.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.amount, 0);
  const totalPending = changeOrders.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
  const totalDraft = changeOrders.filter(c => c.status === 'draft').reduce((sum, c) => sum + c.amount, 0);
  const totalVariation = totalApproved + totalPending + totalDraft;

  const stats = [
    { label: 'Total COs', value: changeOrders.length },
    { label: 'Approved Value', value: '£' + (totalApproved / 1000).toFixed(1) + 'K' },
    { label: 'Pending', value: '£' + (totalPending / 1000).toFixed(1) + 'K' },
    { label: 'Draft', value: '£' + (totalDraft / 1000).toFixed(1) + 'K' },
    { label: 'Total Variation', value: '£' + (totalVariation / 1000).toFixed(1) + 'K' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Change Orders</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Change Order
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className="text-lg font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Change Orders List */}
      <div className="space-y-4">
        {changeOrders.map(co => (
          <div key={co.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600 transition">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {co.number}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(co.status)}`}>
                    {co.status}
                  </span>
                </h3>
                <p className="text-sm text-gray-400 mt-1">{co.project}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">£{co.amount.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Amount</p>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-white mb-2">{co.title}</h4>
              <p className="text-sm text-gray-300 mb-3">{co.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Reason</p>
                  <p className="text-sm text-white">{co.reason}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Schedule Impact</p>
                  <p className="text-sm text-white">{co.scheduleImpact} days</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-800">
              <div className="text-xs text-gray-400">
                Submitted: {new Date(co.submittedDate).toLocaleDateString()}
                {co.approvedDate && ` • Approved: ${new Date(co.approvedDate).toLocaleDateString()}`}
              </div>
              <button className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 text-sm font-medium">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
