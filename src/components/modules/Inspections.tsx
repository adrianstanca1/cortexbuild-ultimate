// Module: Inspections
import React, { useState } from 'react';
import { Plus, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { inspections } from '../../data/mockData';
import { Inspection } from '../../types';

export function Inspections() {
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [showModal, setShowModal] = useState(false);

  const statusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-500/20 text-green-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      case 'conditional': return 'bg-yellow-500/20 text-yellow-400';
      case 'scheduled': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const stats = [
    { label: 'Passed', value: inspections.filter(i => i.status === 'passed').length, icon: CheckCircle2, color: 'green' },
    { label: 'Failed', value: inspections.filter(i => i.status === 'failed').length, icon: AlertCircle, color: 'red' },
    { label: 'Scheduled', value: inspections.filter(i => i.status === 'scheduled').length, icon: AlertCircle, color: 'blue' },
    { label: 'Conditional', value: inspections.filter(i => i.status === 'conditional').length, icon: AlertCircle, color: 'yellow' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Inspections</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Schedule Inspection
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

      {/* Inspections List */}
      <div className="space-y-4">
        {inspections.map(inspection => (
          <div
            key={inspection.id}
            onClick={() => { setSelectedInspection(inspection); setShowModal(true); }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-blue-600 cursor-pointer transition"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-white">{inspection.type}</h4>
                <p className="text-xs text-gray-400 mt-1">{inspection.project}</p>
              </div>
              <div className="flex gap-2 ml-4 items-center">
                {inspection.score && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{inspection.score}%</p>
                    <p className="text-xs text-gray-400">Score</p>
                  </div>
                )}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(inspection.status)}`}>
                  {inspection.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm text-gray-400 mb-3">
              <div>
                <p className="text-xs text-gray-500">Inspector</p>
                <p className="text-white font-medium">{inspection.inspector}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-white font-medium">{new Date(inspection.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Items</p>
                <p className="text-white font-medium">{inspection.items.length} checks</p>
              </div>
            </div>

            {inspection.status === 'scheduled' ? (
              <button className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 text-sm font-medium">
                Schedule Details
              </button>
            ) : (
              <button className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 text-sm font-medium">
                View Results
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {showModal && selectedInspection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedInspection.type}</h2>
                <p className="text-gray-400 mt-1">{selectedInspection.project}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>

            <div className="space-y-6">
              {/* Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Inspector</p>
                  <p className="text-white font-semibold">{selectedInspection.inspector}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Date</p>
                  <p className="text-white font-semibold">{new Date(selectedInspection.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(selectedInspection.status)}`}>
                    {selectedInspection.status}
                  </span>
                </div>
              </div>

              {/* Score */}
              {selectedInspection.score && (
                <div className="border-t border-gray-800 pt-4">
                  <p className="text-gray-400 text-sm mb-2">Overall Score</p>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-white">{selectedInspection.score}%</div>
                    <div className="flex-1 bg-gray-800 rounded-full h-3">
                      <div className="bg-green-500 h-3 rounded-full" style={{ width: `${selectedInspection.score}%` }}></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Checklist */}
              <div className="border-t border-gray-800 pt-4">
                <h3 className="font-bold text-white mb-4">Inspection Checklist</h3>
                <div className="space-y-2">
                  {selectedInspection.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                      {item.result === 'pass' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                      ) : item.result === 'fail' ? (
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-gray-400 flex-shrink-0"></div>
                      )}
                      <div className="flex-1">
                        <p className="text-white text-sm">{item.check}</p>
                        {item.notes && <p className="text-xs text-gray-400 mt-1">{item.notes}</p>}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.result === 'pass' ? 'bg-green-500/20 text-green-400' :
                        item.result === 'fail' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {item.result}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Inspection */}
              {selectedInspection.nextInspection && (
                <div className="border-t border-gray-800 pt-4">
                  <p className="text-gray-400 text-sm mb-1">Next Scheduled Inspection</p>
                  <p className="text-white font-semibold">{new Date(selectedInspection.nextInspection).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <button onClick={() => setShowModal(false)} className="w-full mt-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
