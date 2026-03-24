import { useState } from 'react';
import {
  FileText, Plus, Search, Filter, Download, Clock, BookOpen,
  CheckCircle, AlertTriangle, FileCheck, Eye, Edit, X, Building2
} from 'lucide-react';

interface Specification {
  id: string;
  ref: string;
  title: string;
  project: string;
  section: string;
  discipline: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'issued';
  issuedDate?: string;
  description: string;
  approvedBy?: string;
}

const mockSpecs: Specification[] = [
  {
    id: 'SPEC-001',
    ref: 'KINGS PAN-SPEC-01',
    title: 'Structural Steelwork Specification',
    project: 'Kingspan Stadium Refurbishment',
    section: '05 20 00',
    discipline: 'Structural',
    version: 'Rev B',
    status: 'issued',
    issuedDate: '2024-01-15',
    description: 'Complete specification for structural steelwork including materials, fabrication, protective treatment and erection requirements.',
    approvedBy: 'Harvey Engineering',
  },
  {
    id: 'SPEC-002',
    ref: 'KINGS SPEC-02',
    title: 'Architectural Metalwork Specification',
    project: 'Kingspan Stadium Refurbishment',
    section: '05 50 00',
    discipline: 'Architectural',
    version: 'Rev A',
    status: 'approved',
    description: 'Specification for handrails, balustrades, ladders and architectural metalwork items.',
    approvedBy: 'KMS Architects',
  },
  {
    id: 'SPEC-003',
    ref: 'BHS-SPEC-MEP-01',
    title: 'M&E Performance Specification',
    project: 'Belfast High School Extension',
    section: 'MEP',
    discipline: 'M&E',
    version: 'Rev C',
    status: 'review',
    description: 'Performance-based specification for all mechanical and electrical installations.',
  },
];

export default function Specifications() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = mockSpecs.filter(s => {
    const matchesSearch = s.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/10' },
    review: { label: 'In Review', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    approved: { label: 'Approved', color: 'text-green-400', bg: 'bg-green-500/10' },
    issued: { label: 'Issued', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Specifications
          </h2>
          <p className="text-gray-400 text-sm mt-1">Technical specifications management and versioning</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
          <Plus size={18} /> Add Specification
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search specifications..."
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
            <option value="draft">Draft</option>
            <option value="review">In Review</option>
            <option value="approved">Approved</option>
            <option value="issued">Issued</option>
          </select>
        </div>

        <div className="space-y-3">
          {filtered.map((spec) => {
            const status = statusConfig[spec.status];
            return (
              <div key={spec.id} className="border border-gray-700 rounded-lg p-4 hover:border-orange-500/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-orange-400">{spec.ref}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${status.bg} ${status.color}`}>{status.label}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-500/10 text-gray-400">{spec.version}</span>
                    </div>
                    <h3 className="text-white font-medium">{spec.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{spec.project}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><Eye size={16} /></button>
                    <button className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><Download size={16} /></button>
                  </div>
                </div>
                <div className="mt-3 flex gap-4 text-sm text-gray-400">
                  <span>Section: {spec.section}</span>
                  <span>Discipline: {spec.discipline}</span>
                  {spec.issuedDate && <span>Issued: {spec.issuedDate}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
