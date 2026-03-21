// Module: RiskRegister
import React, { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';

export function RiskRegister() {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const risks = [
    { id: 1, description: 'Adverse weather delays programme', category: 'Programme', likelihood: 4, consequence: 3, score: 12, rating: 'High', owner: 'James Harrington', mitigation: 'Monitor forecasts weekly, adjust schedule', status: 'active' },
    { id: 2, description: 'Steel supplier delivery delays', category: 'Programme', likelihood: 2, consequence: 4, score: 8, rating: 'Medium', owner: 'Claire Watson', mitigation: 'Dual sourcing strategy', status: 'active' },
    { id: 3, description: 'Cost inflation on materials', category: 'Financial', likelihood: 5, consequence: 4, score: 20, rating: 'Critical', owner: 'Adrian Stanca', mitigation: 'Fixed price contracts, locking in rates', status: 'active' },
    { id: 4, description: 'Safety incident on site', category: 'Safety', likelihood: 2, consequence: 5, score: 10, rating: 'High', owner: 'Lisa Okafor', mitigation: 'Enhanced toolbox talks, RAMS compliance', status: 'active' },
    { id: 5, description: 'Subcontractor insolvency', category: 'Financial', likelihood: 1, consequence: 4, score: 4, rating: 'Low', owner: 'Claire Watson', mitigation: 'Credit checks, payment bonds', status: 'active' },
    { id: 6, description: 'Design changes mid-project', category: 'Technical', likelihood: 3, consequence: 3, score: 9, rating: 'Medium', owner: 'James Harrington', mitigation: 'Change order process, stakeholder approval', status: 'active' },
  ];

  const categories = ['all', 'Financial', 'Programme', 'Safety', 'Technical', 'Environmental', 'Commercial'];
  const filteredRisks = filterCategory === 'all' ? risks : risks.filter(r => r.category === filterCategory);

  const riskColor = (rating: string) => {
    switch (rating) {
      case 'Critical': return 'bg-red-600';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const riskColorBg = (rating: string) => {
    switch (rating) {
      case 'Critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'High': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Low': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Risk Register</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Risk
        </button>
      </div>

      {/* Risk Matrix */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Risk Matrix (Likelihood × Consequence)</h3>
        <div className="grid grid-cols-6 gap-1">
          {/* Header */}
          <div></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={`header-${i}`} className="text-center text-xs text-gray-400 pb-2">
              {i}
            </div>
          ))}
          {/* Rows */}
          {[5, 4, 3, 2, 1].map(row => (
            <React.Fragment key={`row-${row}`}>
              <div className="text-xs text-gray-400 text-right pr-2">{row}</div>
              {[1, 2, 3, 4, 5].map(col => {
                const score = row * col;
                let color = 'bg-gray-700';
                if (score >= 15) color = 'bg-red-600';
                else if (score >= 10) color = 'bg-orange-500';
                else if (score >= 6) color = 'bg-yellow-500';
                else color = 'bg-green-500';
                return (
                  <div
                    key={`${row}-${col}`}
                    className={`${color} rounded text-xs text-white font-bold flex items-center justify-center h-10`}
                  >
                    {score}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">Category</label>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Risk Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-400">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="px-6 py-3 text-left font-semibold text-white">Risk ID</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Description</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Category</th>
                <th className="px-6 py-3 text-center font-semibold text-white">L</th>
                <th className="px-6 py-3 text-center font-semibold text-white">C</th>
                <th className="px-6 py-3 text-center font-semibold text-white">Score</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Rating</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Owner</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Mitigation</th>
              </tr>
            </thead>
            <tbody>
              {filteredRisks.map(risk => (
                <tr key={risk.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="px-6 py-4 font-mono text-white">R-{risk.id.toString().padStart(3, '0')}</td>
                  <td className="px-6 py-4 text-white">{risk.description}</td>
                  <td className="px-6 py-4 text-gray-300">{risk.category}</td>
                  <td className="px-6 py-4 text-center text-white font-bold">{risk.likelihood}</td>
                  <td className="px-6 py-4 text-center text-white font-bold">{risk.consequence}</td>
                  <td className="px-6 py-4 text-center font-bold text-white">{risk.score}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskColorBg(risk.rating)}`}>
                      {risk.rating}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{risk.owner}</td>
                  <td className="px-6 py-4 text-gray-300 text-xs">{risk.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
