// Module: Marketplace
import React, { useState } from 'react';
import { Plus, CheckCircle2, AlertCircle } from 'lucide-react';

export function Marketplace() {
  const [enabledAgents, setEnabledAgents] = useState(['safety-analyzer', 'rfi-responder']);

  const agents = [
    { id: 'safety-analyzer', name: 'Safety Incident Analyser', desc: 'Automatically categorize and analyse safety incidents', status: 'active' },
    { id: 'rfi-responder', name: 'RFI AI Responder', desc: 'Draft responses to requests for information', status: 'active' },
    { id: 'rams-generator', name: 'RAMS Generator', desc: 'Auto-generate risk assessments and method statements', status: 'available' },
    { id: 'daily-reporter', name: 'Daily Report Summariser', desc: 'Summarize site activities and progress', status: 'active' },
    { id: 'cost-predictor', name: 'Cost Predictor', desc: 'Forecast project costs and budget variances', status: 'available' },
    { id: 'tender-scorer', name: 'Tender Scorer', desc: 'Score and rank tender opportunities', status: 'available' },
    { id: 'cis-calculator', name: 'CIS Calculator', desc: 'Automated CIS deduction calculations', status: 'coming-soon' },
    { id: 'co-drafter', name: 'Change Order Drafter', desc: 'Draft change orders with cost analysis', status: 'available' },
    { id: 'photo-analyzer', name: 'Progress Photo Analyser', desc: 'Extract progress data from site photos', status: 'coming-soon' },
    { id: 'weather-assessor', name: 'Weather Risk Assessor', desc: 'Weather-related programme impact analysis', status: 'available' },
  ];

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'available': return 'bg-blue-500/20 text-blue-400';
      case 'coming-soon': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'active': return '✓ Active';
      case 'available': return 'Available';
      case 'coming-soon': return 'Coming Soon';
      default: return status;
    }
  };

  const toggleAgent = (id: string) => {
    setEnabledAgents(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const activeAgents = agents.filter(a => enabledAgents.includes(a.id));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">AI Marketplace</h1>

      {/* Active Agents Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Active AI Agents</h3>
        <p className="text-blue-100 mb-4">{enabledAgents.length} agents enabled and running on your projects</p>
        <div className="flex flex-wrap gap-2">
          {activeAgents.map(agent => (
            <span key={agent.id} className="bg-blue-900 px-3 py-1 rounded-full text-sm font-medium">
              {agent.name}
            </span>
          ))}
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => {
          const isEnabled = enabledAgents.includes(agent.id);
          return (
            <div key={agent.id} className={`border rounded-xl p-6 transition ${
              isEnabled
                ? 'bg-gray-900 border-blue-600'
                : 'bg-gray-900 border-gray-800 hover:border-gray-700'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-white flex-1">{agent.name}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${statusColor(agent.status)}`}>
                  {statusLabel(agent.status)}
                </span>
              </div>

              <p className="text-sm text-gray-400 mb-4">{agent.desc}</p>

              <button
                onClick={() => agent.status !== 'coming-soon' && toggleAgent(agent.id)}
                disabled={agent.status === 'coming-soon'}
                className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition ${
                  agent.status === 'coming-soon'
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : isEnabled
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {agent.status === 'coming-soon'
                  ? 'Coming Soon'
                  : isEnabled
                  ? 'Disable Agent'
                  : 'Enable Agent'}
              </button>

              {isEnabled && (
                <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Running actively
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Usage Stats */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Agent Usage This Month</h3>
        <div className="space-y-3">
          {[
            { agent: 'Safety Analyser', uses: 23, savings: '£1,150' },
            { agent: 'Daily Report Summariser', uses: 19, savings: '£950' },
            { agent: 'RFI Responder', uses: 12, savings: '£600' },
            { agent: 'Cost Predictor', uses: 8, savings: '£400' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-gray-800/50 rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="text-white font-semibold">{stat.agent}</p>
                <p className="text-xs text-gray-400">{stat.uses} uses this month</p>
              </div>
              <p className="text-green-400 font-semibold">{stat.savings} time saved</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
