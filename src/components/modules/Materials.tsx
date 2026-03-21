// Module: Materials
import React, { useState } from 'react';
import { Plus, Truck, AlertCircle } from 'lucide-react';
import { materials } from '../../data/mockData';
import { Material } from '../../types';

export function Materials() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');

  const filteredMaterials = materials.filter(m => {
    const statusMatch = filterStatus === 'all' || m.status === filterStatus;
    const projectMatch = filterProject === 'all' || m.project === filterProject;
    return statusMatch && projectMatch;
  });

  const statusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500/20 text-green-400';
      case 'on_site': return 'bg-green-500/20 text-green-400';
      case 'ordered': return 'bg-blue-500/20 text-blue-400';
      case 'used': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const totalValue = materials.reduce((sum, m) => sum + m.totalCost, 0);
  const orderedCount = materials.filter(m => m.status === 'ordered').length;
  const deliveredCount = materials.filter(m => m.status === 'delivered').length;

  const projects = [...new Set(materials.map(m => m.project))];

  const stats = [
    { label: 'Materials Tracked', value: materials.length },
    { label: 'Total Value', value: '£' + (totalValue / 1000).toFixed(0) + 'K' },
    { label: 'Ordered', value: orderedCount },
    { label: 'Delivered', value: deliveredCount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Materials Management</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Raise Purchase Order
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

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
          >
            <option value="all">All</option>
            <option value="ordered">Ordered</option>
            <option value="delivered">Delivered</option>
            <option value="on_site">On Site</option>
            <option value="used">Used</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Project</label>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
          >
            <option value="all">All</option>
            {projects.map(proj => (
              <option key={proj} value={proj}>{proj.split(' ').slice(0, 2).join(' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-400">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="px-6 py-3 text-left font-semibold text-white">Material Name</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Category</th>
                <th className="px-6 py-3 text-right font-semibold text-white">Qty</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Unit</th>
                <th className="px-6 py-3 text-right font-semibold text-white">Unit Cost</th>
                <th className="px-6 py-3 text-right font-semibold text-white">Total Cost</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Supplier</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Project</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Delivery</th>
                <th className="px-6 py-3 text-left font-semibold text-white">PO #</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map(mat => (
                <tr key={mat.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="px-6 py-4 font-medium text-white">{mat.name}</td>
                  <td className="px-6 py-4 text-gray-300">{mat.category}</td>
                  <td className="px-6 py-4 text-right text-white">{mat.quantity}</td>
                  <td className="px-6 py-4 text-white">{mat.unit}</td>
                  <td className="px-6 py-4 text-right text-white">£{mat.unitCost.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-semibold text-white">£{mat.totalCost.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-300">{mat.supplier}</td>
                  <td className="px-6 py-4 text-gray-300">{mat.project.split(' ').slice(0, 2).join(' ')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(mat.status)}`}>
                      {mat.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">{new Date(mat.deliveryDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-mono text-white">{mat.poNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
