// Module: RFIs
import React, { useState } from 'react';
import { Plus, AlertCircle, CheckCircle2, Clock, Eye } from 'lucide-react';
import { rfis } from '../../data/mockData';
import { RFI } from '../../types';

export function RFIs() {
  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);

  const filteredRFIs = filterStatus === 'all' ? rfis : rfis.filter(r => r.status === filterStatus);

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'bg-green-500/20 text-green-400';
      case 'open': return 'bg-red-500/20 text-red-400';
      case 'pending': return 'bg-orange-500/20 text-orange-400';
      case 'closed': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const stats = [
    { label: 'Open', value: rfis.filter(r => r.status === 'open').length, icon: AlertCircle, color: 'red' },
    { label: 'Answered', value: rfis.filter(r => r.status === 'answered').length, icon: CheckCircle2, color: 'green' },
    { label: 'Pending', value: rfis.filter(r => r.status === 'pending').length, icon: Clock, color: 'orange' },
    { label: 'Closed', value: rfis.filter(r => r.status === 'closed').length, icon: CheckCircle2, color: 'blue' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">RFIs (Requests for Information)</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New RFI
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <Icon className={`w-5 h-5 mb-2 text-${stat.color}-400`} />
              <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Summary Metrics */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-6">
        <div>
          <p className="text-gray-400 text-sm">Avg Response Time</p>
          <p className="text-2xl font-bold text-white">4.2 days</p>
        </div>
        <div className="border-l border-gray-800 pl-6">
          <p className="text-gray-400 text-sm">Total RFIs This Month</p>
          <p className="text-2xl font-bold text-white">{rfis.length}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-800 overflow-x-auto pb-4">
        {['all', 'open', 'answered', 'pending', 'closed'].map(status => (
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

      {/* RFI Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-400">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="px-6 py-3 text-left font-semibold text-white">RFI #</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Project</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Subject</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Priority</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Submitted</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Due</th>
                <th className="px-6 py-3 text-center font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRFIs.map(rfi => (
                <tr key={rfi.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition">
                  <td className="px-6 py-4 font-mono text-white">{rfi.number}</td>
                  <td className="px-6 py-4 text-white">{rfi.project.split(' ').slice(0, 2).join(' ')}</td>
                  <td className="px-6 py-4 text-gray-300 max-w-xs truncate">{rfi.subject}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColor(rfi.priority)}`}>
                      {rfi.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(rfi.status)}`}>
                      {rfi.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">{new Date(rfi.submittedDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-white">{new Date(rfi.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => { setSelectedRFI(rfi); setShowModal(true); }}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedRFI && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedRFI.subject}</h2>
                <p className="text-gray-400 mt-1">{selectedRFI.project}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>

            <div className="space-y-6">
              {/* Metadata */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">RFI #</p>
                  <p className="text-white font-semibold">{selectedRFI.number}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Priority</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColor(selectedRFI.priority)}`}>
                    {selectedRFI.priority}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(selectedRFI.status)}`}>
                    {selectedRFI.status}
                  </span>
                </div>
              </div>

              {/* Question */}
              <div className="border-t border-gray-800 pt-4">
                <h3 className="font-bold text-white mb-3">Question</h3>
                <p className="text-gray-300">{selectedRFI.question}</p>
              </div>

              {/* Response */}
              {selectedRFI.response && (
                <div className="border-t border-gray-800 pt-4">
                  <h3 className="font-bold text-white mb-3">Response</h3>
                  <p className="text-gray-300">{selectedRFI.response}</p>
                </div>
              )}

              {/* AI Suggestion */}
              {selectedRFI.aiSuggestion && (
                <div className="border-t border-gray-800 pt-4 bg-blue-500/10 rounded-lg p-4">
                  <h3 className="font-bold text-white mb-2">AI Suggestion</h3>
                  <p className="text-blue-300 text-sm">{selectedRFI.aiSuggestion}</p>
                </div>
              )}

              {/* Dates */}
              <div className="border-t border-gray-800 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Submitted</p>
                  <p className="text-white">{new Date(selectedRFI.submittedDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Due</p>
                  <p className="text-white">{new Date(selectedRFI.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <button onClick={() => setShowModal(false)} className="w-full mt-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
