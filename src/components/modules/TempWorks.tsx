import { useState } from 'react';
import {
  Plus, Search, Clock, CheckCircle, AlertTriangle, Construction,
  Shield, Eye, Edit, X
} from 'lucide-react';

interface TempWork {
  id: string;
  ref: string;
  title: string;
  project: string;
  type: string;
  status: 'design' | 'approval' | 'installed' | 'in_use' | 'removed';
  designer: string;
  installer: string;
  installedDate?: string;
  removedDate?: string;
  description: string;
}

const mockTempWorks: TempWork[] = [
  {
    id: 'TW-001',
    ref: 'TW-2024-001',
    title: 'Tower Crane Bases - Temporary Support',
    project: 'Kingspan Stadium Refurbishment',
    type: 'Structural Support',
    status: 'in_use',
    designer: 'Harvey Engineering',
    installer: 'ABC Scaffolding',
    installedDate: '2024-02-15',
    description: 'Temporary steel support frames for tower crane attachment points during roof structure works.',
  },
  {
    id: 'TW-002',
    ref: 'TW-2024-002',
    title: 'Propping System - Level 3 Slab',
    project: 'Belfast High School Extension',
    type: 'Propping',
    status: 'approval',
    designer: 'Brown & Associates',
    installer: 'TBD',
    description: 'Temporary propping required to support Level 3 slab until permanent works complete.',
  },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  design: { label: 'In Design', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  approval: { label: 'Pending Approval', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  installed: { label: 'Installed', color: 'text-green-400', bg: 'bg-green-500/10' },
  in_use: { label: 'In Use', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  removed: { label: 'Removed', color: 'text-gray-400', bg: 'bg-gray-500/10' },
};

export default function TempWorks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = mockTempWorks.filter(t => {
    const matchesSearch = t.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Temporary Works
          </h2>
          <p className="text-gray-400 text-sm mt-1">Manage temporary works design, approval and installation</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> New Temporary Work
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Construction className="text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-xs">In Design</p>
              <p className="text-2xl font-bold text-white">{mockTempWorks.filter(t => t.status === 'design').length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="text-amber-400" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-xs">Pending Approval</p>
              <p className="text-2xl font-bold text-amber-400">{mockTempWorks.filter(t => t.status === 'approval').length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Shield className="text-emerald-400" size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-xs">In Use</p>
              <p className="text-2xl font-bold text-emerald-400">{mockTempWorks.filter(t => t.status === 'in_use').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search temporary works..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            <option value="all">All Status</option>
            <option value="design">In Design</option>
            <option value="approval">Pending Approval</option>
            <option value="installed">Installed</option>
            <option value="in_use">In Use</option>
            <option value="removed">Removed</option>
          </select>
        </div>

        <div className="space-y-3">
          {filtered.map((tw) => {
            const status = statusConfig[tw.status];
            return (
              <div key={tw.id} className="border border-gray-700 rounded-lg p-4 hover:border-orange-500/50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-orange-400">{tw.ref}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${status.bg} ${status.color}`}>{status.label}</span>
                    </div>
                    <h3 className="text-white font-medium">{tw.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{tw.project}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><Eye size={16} /></button>
                    <button className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><Edit size={16} /></button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Type</p>
                    <p className="text-white">{tw.type}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Designer</p>
                    <p className="text-white">{tw.designer}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Installer</p>
                    <p className="text-white">{tw.installer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
