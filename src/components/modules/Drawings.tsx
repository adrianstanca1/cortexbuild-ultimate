// Module: Drawings
import React, { useState } from 'react';
import { Plus, Eye, Download, Eye as EyeIcon } from 'lucide-react';
import { documents } from '../../data/mockData';

export function Drawings() {
  const [filterDiscipline, setFilterDiscipline] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const drawings = documents.filter(d => d.category === 'DRAWINGS');
  const disciplines = ['all', 'Structural', 'Architectural', 'MEP', 'Civil'];

  const filteredDrawings = drawings.filter(d => {
    const disciplineMatch = filterDiscipline === 'all';
    const statusMatch = filterStatus === 'all' || d.status === filterStatus;
    return disciplineMatch && statusMatch;
  });

  const statusColor = (status: string) => {
    switch (status) {
      case 'current': return 'bg-green-500/20 text-green-400';
      case 'superseded': return 'bg-gray-500/20 text-gray-400';
      case 'in_review': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Drawings & CAD</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Upload Drawing
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Discipline</label>
          <select
            value={filterDiscipline}
            onChange={(e) => setFilterDiscipline(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
          >
            {disciplines.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
          >
            <option value="all">All</option>
            <option value="current">Current</option>
            <option value="superseded">Superseded</option>
            <option value="in_review">In Review</option>
          </select>
        </div>
      </div>

      {/* Drawings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDrawings.map(drawing => (
          <div key={drawing.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-600 transition">
            {/* Drawing Viewer Placeholder */}
            <div className="bg-gray-800 h-48 flex items-center justify-center relative overflow-hidden">
              <div className="text-center">
                <EyeIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">CAD Preview</p>
              </div>
              <div className="absolute top-4 right-4 bg-gray-900 border border-gray-700 rounded px-2 py-1">
                <p className="text-xs text-gray-400">Rev: {drawing.version}</p>
              </div>
            </div>

            {/* Drawing Info */}
            <div className="p-4">
              <h4 className="font-semibold text-white mb-2">{drawing.name}</h4>
              <p className="text-sm text-gray-400 mb-3">{drawing.project}</p>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3 pb-3 border-b border-gray-800">
                <div>
                  <p className="text-gray-500">Revision</p>
                  <p className="text-white">{drawing.version}</p>
                </div>
                <div>
                  <p className="text-gray-500">Size</p>
                  <p className="text-white">{drawing.size}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(drawing.status)}`}>
                    {drawing.status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Uploaded</p>
                  <p className="text-white">{new Date(drawing.uploadedDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 text-xs font-medium flex items-center justify-center gap-1">
                  <EyeIcon className="w-3 h-3" />
                  View
                </button>
                <button className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-xs font-medium flex items-center justify-center gap-1">
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
