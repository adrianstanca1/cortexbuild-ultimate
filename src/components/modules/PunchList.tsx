// Module: PunchList
import React, { useState } from 'react';
import { Plus, Download, AlertCircle } from 'lucide-react';
import { punchListItems } from '../../data/mockData';
import { PunchListItem } from '../../types';

export function PunchList() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const filteredItems = punchListItems.filter(item => {
    const statusMatch = filterStatus === 'all' || item.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || item.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400';
      case 'open': return 'bg-red-500/20 text-red-400';
      case 'rejected': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const stats = [
    { label: 'Open', value: punchListItems.filter(p => p.status === 'open').length },
    { label: 'In Progress', value: punchListItems.filter(p => p.status === 'in_progress').length },
    { label: 'Completed', value: punchListItems.filter(p => p.status === 'completed').length },
    { label: 'Rejected', value: punchListItems.filter(p => p.status === 'rejected').length },
    { label: 'Total', value: punchListItems.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Punch List (Defects & Snags)</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Defect/Snag
          </button>
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 font-medium flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
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
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Priority</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-blue-600 transition">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-white">{item.description}</h4>
                <p className="text-xs text-gray-400 mt-1">{item.location}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColor(item.priority)}`}>
                  {item.priority}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(item.status)}`}>
                  {item.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm text-gray-400 mb-3">
              <div>
                <p className="text-xs text-gray-500">Trade</p>
                <p className="text-white font-medium">{item.trade}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Assigned To</p>
                <p className="text-white font-medium">{item.assignedTo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Due Date</p>
                <p className="text-white font-medium">{new Date(item.dueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Photos</p>
                <p className="text-white font-medium">{item.photos} attached</p>
              </div>
            </div>

            <button className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 text-sm font-medium">
              View & Update
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
