// Module: Tenders
import React, { useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { tenders } from '../../data/mockData';
import { TenderRequest } from '../../types';

export function Tenders() {
  const statusColor = (status: string) => {
    switch (status) {
      case 'drafting': return 'bg-gray-500/20 text-gray-400';
      case 'submitted': return 'bg-blue-500/20 text-blue-400';
      case 'shortlisted': return 'bg-orange-500/20 text-orange-400';
      case 'won': return 'bg-green-500/20 text-green-400';
      case 'lost': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const aiScoreColor = (score: number | undefined) => {
    if (!score) return 'bg-gray-800';
    if (score >= 70) return 'bg-green-500/20 text-green-400';
    if (score >= 50) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  const pipelineStats = {
    total: tenders.length,
    drafting: tenders.filter(t => t.status === 'drafting').length,
    submitted: tenders.filter(t => t.status === 'submitted').length,
    shortlisted: tenders.filter(t => t.status === 'shortlisted').length,
    won: tenders.filter(t => t.status === 'won').length,
    lost: tenders.filter(t => t.status === 'lost').length,
  };

  const totalValue = tenders.reduce((sum, t) => sum + t.value, 0);
  const probabilityWeightedValue = tenders.reduce((sum, t) => sum + (t.value * t.probability / 100), 0);
  const decided = tenders.filter(t => t.status === 'won' || t.status === 'lost').length;
  const winRate = decided > 0 ? ((tenders.filter(t => t.status === 'won').length / decided) * 100).toFixed(0) : '0';

  const stats = [
    { label: 'Total Pipeline', value: '£' + (totalValue / 1000000).toFixed(2) + 'M' },
    { label: 'Weighted Value', value: '£' + (probabilityWeightedValue / 1000000).toFixed(2) + 'M' },
    { label: 'Win Rate', value: winRate + '%' },
    { label: 'Opportunities', value: pipelineStats.total },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Tender Pipeline</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Tender
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Status Breakdown */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {[
          { label: 'Drafting', value: pipelineStats.drafting, color: 'gray' },
          { label: 'Submitted', value: pipelineStats.submitted, color: 'blue' },
          { label: 'Shortlisted', value: pipelineStats.shortlisted, color: 'orange' },
          { label: 'Won', value: pipelineStats.won, color: 'green' },
          { label: 'Lost', value: pipelineStats.lost, color: 'red' },
        ].map((item, idx) => (
          <div key={idx} className={`bg-${item.color}-500/10 border border-${item.color}-500/20 rounded-lg p-3 text-center`}>
            <p className={`text-2xl font-bold text-${item.color}-400`}>{item.value}</p>
            <p className={`text-xs text-${item.color}-300 mt-1`}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Tender Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-400">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="px-6 py-3 text-left font-semibold text-white">Title</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Client</th>
                <th className="px-6 py-3 text-right font-semibold text-white">Value</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Deadline</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Status</th>
                <th className="px-6 py-3 text-center font-semibold text-white">Win %</th>
                <th className="px-6 py-3 text-center font-semibold text-white">AI Score</th>
              </tr>
            </thead>
            <tbody>
              {tenders.map(tender => (
                <tr key={tender.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="px-6 py-4 font-medium text-white">{tender.title}</td>
                  <td className="px-6 py-4 text-gray-300">{tender.client}</td>
                  <td className="px-6 py-4 text-right font-semibold text-white">£{(tender.value / 1000000).toFixed(1)}M</td>
                  <td className="px-6 py-4 text-white">{new Date(tender.deadline).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(tender.status)}`}>
                      {tender.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-white font-semibold">{tender.probability}%</td>
                  <td className="px-6 py-4 text-center">
                    {tender.aiScore && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${aiScoreColor(tender.aiScore)}`}>
                        {tender.aiScore}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Score Explanation */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { score: '≥70', label: 'Strong', color: 'green' },
          { score: '50-69', label: 'Medium', color: 'yellow' },
          { score: '<50', label: 'Weak', color: 'red' },
        ].map((item, idx) => (
          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className={`text-2xl font-bold text-${item.color}-400`}>{item.score}</p>
            <p className={`text-sm text-${item.color}-300`}>{item.label} Opportunity</p>
          </div>
        ))}
      </div>
    </div>
  );
}
