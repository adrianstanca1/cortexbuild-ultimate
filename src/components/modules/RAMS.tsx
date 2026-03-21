// Module: RAMS
import React, { useState } from 'react';
import { Plus, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { ramsDocuments } from '../../data/mockData';
import { RAMSDocument } from '../../types';

export function RAMS() {
  const [selectedRAMS, setSelectedRAMS] = useState<RAMSDocument | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);

  const filteredRAMS = filterStatus === 'all' ? ramsDocuments : ramsDocuments.filter(r => r.status === filterStatus);

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'review': return 'bg-orange-500/20 text-orange-400';
      case 'draft': return 'bg-gray-500/20 text-gray-400';
      case 'expired': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const stats = [
    { label: 'Active RAMS', value: '6', color: 'green' },
    { label: 'Pending Review', value: '2', color: 'orange' },
    { label: 'Expired', value: '1', color: 'red' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">RAMS Documents</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New RAMS
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Signatures Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
        <CheckCircle2 className="w-6 h-6 text-blue-400" />
        <div className="flex-1">
          <p className="font-semibold text-white">Digital Signatures</p>
          <p className="text-sm text-gray-400">8 of 10 workers have signed RAMS</p>
        </div>
        <div className="w-32 bg-gray-800 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '80%' }}></div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-800 overflow-x-auto pb-4">
        {['all', 'approved', 'review', 'draft', 'expired'].map(status => (
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

      {/* RAMS List */}
      <div className="space-y-3">
        {filteredRAMS.map(rams => (
          <div
            key={rams.id}
            onClick={() => { setSelectedRAMS(rams); setShowModal(true); }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-blue-600 cursor-pointer transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  {rams.title}
                </h4>
                <p className="text-sm text-gray-400 mt-1">{rams.project}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(rams.status)}`}>
                {rams.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm text-gray-400 mb-3">
              <div>
                <p className="text-xs text-gray-500">Activity</p>
                <p className="text-white font-medium">{rams.activity}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Version</p>
                <p className="text-white font-medium">{rams.version}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Review Date</p>
                <p className="text-white font-medium">{new Date(rams.reviewDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>Signatures: {rams.signatures}/{rams.required}</span>
                <div className="w-24 bg-gray-800 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(rams.signatures / rams.required) * 100}%` }}></div>
                </div>
              </div>
              <button className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                <Eye className="w-4 h-4" />
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {showModal && selectedRAMS && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-3xl w-full my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedRAMS.title}</h2>
                <p className="text-gray-400 mt-1">{selectedRAMS.project}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>

            <div className="space-y-6">
              {/* Hazards Table */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Hazards & Controls</h3>
                <div className="bg-gray-800/50 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-800">
                        <th className="px-4 py-2 text-left text-gray-300">Hazard</th>
                        <th className="px-4 py-2 text-left text-gray-300">Risk Level</th>
                        <th className="px-4 py-2 text-left text-gray-300">Control Measure</th>
                        <th className="px-4 py-2 text-left text-gray-300">Residual Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRAMS.hazards.map((h, idx) => (
                        <tr key={idx} className="border-t border-gray-700">
                          <td className="px-4 py-2 text-white">{h.hazard}</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
                              {h.risk}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-300">{h.control}</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                              {h.residualRisk}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Method Statement */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Method Statement</h3>
                <ol className="space-y-2">
                  {selectedRAMS.methodStatement.map((step, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</span>
                      <span className="text-gray-300 pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* PPE */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">PPE Requirements</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedRAMS.ppe.map((item, idx) => (
                    <div key={idx} className="bg-gray-800 rounded-lg px-3 py-2 text-gray-300 text-sm">
                      • {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Signature Status */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Signature Status</h3>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                    <div className="bg-green-500 h-3 rounded-full" style={{ width: `${(selectedRAMS.signatures / selectedRAMS.required) * 100}%` }}></div>
                  </div>
                  <p className="text-sm text-gray-300">{selectedRAMS.signatures} of {selectedRAMS.required} signatures collected</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white">Close</button>
              <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium">Edit RAMS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
