// Module: Documents
import React, { useState } from 'react';
import { Plus, Download, Eye, Share2, FileText } from 'lucide-react';
import { documents } from '../../data/mockData';
import { Document } from '../../types';

export function Documents() {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = ['all', 'DRAWINGS', 'RAMS', 'CONTRACTS', 'REPORTS', 'PERMITS', 'PLANS', 'PHOTOS'];
  const filteredDocs = filterCategory === 'all' ? documents : documents.filter(d => d.category === filterCategory);

  const statusColor = (status: string) => {
    switch (status) {
      case 'current': return 'bg-green-500/20 text-green-400';
      case 'superseded': return 'bg-gray-500/20 text-gray-400';
      case 'draft': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const stats = [
    { label: 'Total Docs', value: documents.length },
    { label: 'Current', value: documents.filter(d => d.status === 'current').length },
    { label: 'Superseded', value: documents.filter(d => d.status === 'superseded').length },
    { label: 'Draft', value: documents.filter(d => d.status === 'draft').length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Documents & Drawings</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-800 overflow-x-auto pb-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition ${
              filterCategory === cat
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Documents Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-400">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="px-6 py-3 text-left font-semibold text-white">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Project</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Category</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Version</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Size</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Uploaded</th>
                <th className="px-6 py-3 text-left font-semibold text-white">By</th>
                <th className="px-6 py-3 text-center font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    {doc.name}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{doc.project.split(' ').slice(0, 2).join(' ')}</td>
                  <td className="px-6 py-4 text-gray-300">{doc.category}</td>
                  <td className="px-6 py-4 font-mono text-white">{doc.version}</td>
                  <td className="px-6 py-4 text-gray-300">{doc.size}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{new Date(doc.uploadedDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-gray-300">{doc.uploadedBy.split(' ')[0]}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="text-blue-400 hover:text-blue-300" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-300" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-300" title="Share">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
