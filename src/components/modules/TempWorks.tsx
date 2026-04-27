// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import {
  Plus, Search, AlertTriangle, Construction,
  Shield, Eye, Edit, X, Trash2, Upload, CheckCircle, AlertCircle,
  ChevronDown, ChevronRight, Clock, QrCode, BarChart3, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useTempWorks } from '../../hooks/useData';
import { toast } from 'sonner';
import { uploadFile } from '../../services/api';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';

interface TempWork {
  id: string;
  reference?: string | null;
  title?: string | null;
  project_id?: string | null;
  project?: string | null;
  description?: string | null;
  type?: string | null;
  status?: string | null;
  location?: string | null;
  design_by?: string | null;
  approved_by?: string | null;
  design_date?: string | null;
  approval_date?: string | null;
  erected_by?: string | null;
  erected_date?: string | null;
  inspected_by?: string | null;
  inspected_date?: string | null;
  load_capacity?: string | null;
  notes?: string | null;
}

interface Inspection {
  id: string;
  tw_ref: string;
  tw_title: string;
  date: string;
  inspector: string;
  result: 'Pass' | 'Fail' | 'Advisory';
  notes: string;
  next_due: string;
}

interface Permit {
  id: string;
  permit_number: string;
  tw_reference: string;
  work_type: string;
  issued_to: string;
  issue_date: string;
  expiry: string;
  status: 'Valid' | 'Expired' | 'Revoked';
}

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
  const [activeTab, setActiveTab] = useState<'overview' | 'inspections' | 'permits' | 'analytics'>('overview');
  const [uploading, setUploading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, any> | null>(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showPermitModal, setShowPermitModal] = useState(false);
  const [expandedInspection, setExpandedInspection] = useState<string | null>(null);
  const [inspectionForm, setInspectionForm] = useState({
    tw_ref: '',
    date: '',
    inspector: '',
    result: 'Pass' as 'Pass' | 'Fail' | 'Advisory',
    notes: '',
  });
  const [permitForm, setPermitForm] = useState({
    tw_reference: '',
    work_type: '',
    issued_to: '',
    conditions: '',
    duration: '12',
  });
  const [form, setForm] = useState({
    title: '',
    project: '',
    type: 'Structural Support',
    description: '',
    location: '',
    design_by: '',
    design_date: '',
    approved_by: '',
    approval_date: '',
    erected_by: '',
    erected_date: '',
    inspected_by: '',
    inspected_date: '',
    load_capacity: '',
    notes: '',
    status: 'design',
  });

  const mockInspections: Inspection[] = [
    { id: '1', tw_ref: 'TW-001', tw_title: 'Tower Crane Bases', date: '2026-04-20', inspector: 'John Smith', result: 'Pass', notes: 'All load cells functioning', next_due: '2026-05-20' },
    { id: '2', tw_ref: 'TW-002', tw_title: 'Scaffold System A', date: '2026-04-15', inspector: 'Sarah Jones', result: 'Fail', notes: 'Missing edge protection', next_due: '2026-05-15' },
    { id: '3', tw_ref: 'TW-003', tw_title: 'Shoring Props', date: '2026-04-10', inspector: 'Mike Davis', result: 'Advisory', notes: 'Check welds on extension', next_due: '2026-04-24' },
  ];

  const mockPermits: Permit[] = [
    { id: '1', permit_number: 'PERM-2026-001', tw_reference: 'TW-001', work_type: 'Heavy Lifting', issued_to: 'ABC Crane Hire', issue_date: '2026-04-01', expiry: '2026-07-01', status: 'Valid' },
    { id: '2', permit_number: 'PERM-2026-002', tw_reference: 'TW-002', work_type: 'Scaffolding Erection', issued_to: 'XYZ Scaffolding', issue_date: '2026-03-15', expiry: '2026-05-15', status: 'Valid' },
    { id: '3', permit_number: 'PERM-2026-003', tw_reference: 'TW-003', work_type: 'Propping Work', issued_to: 'BuildProp Ltd', issue_date: '2026-02-01', expiry: '2026-03-31', status: 'Expired' },
  ];

  const { useList, useCreate, useUpdate, useDelete } = useTempWorks;
  const { data: rawTempWorks = [] } = useList();
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const filtered = (rawTempWorks as unknown as TempWork[]).filter((t: TempWork) => {
    const matchesSearch = (t.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async () => {
    if (!form.title) return;
    try {
      await createMutation.mutateAsync({
        reference: `TW-${String(Date.now()).slice(-6)}`,
        title: form.title,
        project: form.project || '',
        type: form.type,
        description: form.description || '',
        location: form.location || '',
        design_by: form.design_by || '',
        design_date: form.design_date || null,
        approved_by: form.approved_by || '',
        approval_date: form.approval_date || null,
        erected_by: form.erected_by || '',
        erected_date: form.erected_date || null,
        inspected_by: form.inspected_by || '',
        inspected_date: form.inspected_date || null,
        load_capacity: form.load_capacity || '',
        notes: form.notes || '',
        status: form.status,
      });
      toast.success('Temporary work created');
      setShowCreateModal(false);
      setForm({ title: '', project: '', type: 'Structural Support', description: '', location: '', design_by: '', design_date: '', approved_by: '', approval_date: '', erected_by: '', erected_date: '', inspected_by: '', inspected_date: '', load_capacity: '', notes: '', status: 'design' });
    } catch {
      toast.error('Failed to create temporary work');
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !editItem.id) return;
    try {
      await updateMutation.mutateAsync({
        id: editItem.id,
        data: {
          title: form.title,
          project: form.project || '',
          type: form.type,
          description: form.description || '',
          location: form.location || '',
          design_by: form.design_by || '',
          design_date: form.design_date || null,
          approved_by: form.approved_by || '',
          approval_date: form.approval_date || null,
          erected_by: form.erected_by || '',
          erected_date: form.erected_date || null,
          inspected_by: form.inspected_by || '',
          inspected_date: form.inspected_date || null,
          load_capacity: form.load_capacity || '',
          notes: form.notes || '',
          status: form.status,
        },
      });
      toast.success('Temporary work updated');
      setEditItem(null);
      setForm({ title: '', project: '', type: 'Structural Support', description: '', location: '', design_by: '', design_date: '', approved_by: '', approval_date: '', erected_by: '', erected_date: '', inspected_by: '', inspected_date: '', load_capacity: '', notes: '', status: 'design' });
    } catch {
      toast.error('Failed to update temporary work');
    }
  };

  const openEditModal = (item: TempWork) => {
    setEditItem(item);
    setForm({
      title: item.title || '',
      project: item.project || '',
      type: item.type || 'Structural Support',
      description: item.description || '',
      location: item.location || '',
      design_by: item.design_by || '',
      design_date: item.design_date || '',
      approved_by: item.approved_by || '',
      approval_date: item.approval_date || '',
      erected_by: item.erected_by || '',
      erected_date: item.erected_date || '',
      inspected_by: item.inspected_by || '',
      inspected_date: item.inspected_date || '',
      load_capacity: item.load_capacity || '',
      notes: item.notes || '',
      status: item.status || 'design',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this temporary work?')) return;
    try {
      await deleteMutation.mutateAsync(String(id));
      toast.success('Temporary work deleted');
    } catch {
      toast.error('Failed to delete temporary work');
    }
  };

  async function handleUploadDoc(id: string, file: File) {
    setUploading(id);
    try {
      await uploadFile(file, 'REPORTS');
      toast.success(`Uploaded: ${file.name}`);
    } catch {
      console.error('Upload failed');
      toast.error('Upload failed');
    } finally {
      setUploading(null);
    }
  }

  return (
    <>
      <ModuleBreadcrumbs currentModule="temp-works" />
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-white">
            Temporary Works
          </h2>
          <p className="text-gray-400 text-sm mt-1">Manage temporary works design, approval and installation</p>
        </div>
        <button type="button" onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold">
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
              <p className="text-2xl font-display text-white">{rawTempWorks.filter((t: TempWork) => t.status === 'design').length}</p>
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
              <p className="text-2xl font-display text-amber-400">{rawTempWorks.filter((t: TempWork) => t.status === 'approval').length}</p>
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
              <p className="text-2xl font-display text-emerald-400">{rawTempWorks.filter((t: TempWork) => t.status === 'in_use').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex border-b border-gray-700 mb-4 gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('inspections')}
            className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'inspections' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            Inspections
          </button>
          <button
            onClick={() => setActiveTab('permits')}
            className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'permits' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            Permits
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'analytics' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            Analytics
          </button>
        </div>

        {activeTab === 'overview' && (
        <div>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search temporary works..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 input input-bordered text-white placeholder-gray-500"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 input input-bordered text-white"
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
            const status = statusConfig[tw.status] || { label: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-500/10' };
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
                    <button type="button" className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white"><Eye size={16} /></button>
                    <button
                      type="button"
                      onClick={() => openEditModal(tw)}
                      className="p-2 hover:bg-blue-900/30 rounded"
                      title="Edit"
                    >
                      <Edit size={16} className="text-blue-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(String(tw.id))}
                      className="p-2 hover:bg-red-900/30 rounded"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                    <input
                      type="file"
                      id={`upload-temp-${tw.id}`}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadDoc(String(tw.id), file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById(`upload-temp-${tw.id}`)?.click()}
                      disabled={uploading === String(tw.id)}
                      className="p-2 hover:bg-blue-900/30 rounded disabled:opacity-50"
                      title="Upload Document"
                    >
                      <Upload size={16} className="text-blue-400" />
                    </button>
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
        )}

        {activeTab === 'inspections' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowInspectionModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold mb-4"
          >
            <Plus size={18} /> Record Inspection
          </button>

          <div className="space-y-3">
            {mockInspections.map((inspection) => {
              const isOverdue = new Date(inspection.next_due) < new Date() && inspection.result !== 'Fail';
              const resultColor = inspection.result === 'Pass' ? 'text-green-400 bg-green-500/10' : inspection.result === 'Fail' ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10';
              return (
                <div key={inspection.id} className={`border rounded-lg p-4 ${isOverdue ? 'border-red-500/50 bg-red-900/10' : 'border-gray-700'}`}>
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedInspection(expandedInspection === inspection.id ? null : inspection.id)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-orange-400">{inspection.tw_ref}</span>
                        <span className="text-white font-medium">{inspection.tw_title}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${resultColor}`}>{inspection.result}</span>
                        {isOverdue && <AlertTriangle size={16} className="text-red-400" />}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs">Last Inspection</p>
                          <p className="text-white">{inspection.date}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Inspector</p>
                          <p className="text-white">{inspection.inspector}</p>
                        </div>
                        <div>
                          <p className={`text-xs ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>Next Due</p>
                          <p className={isOverdue ? 'text-red-400 font-medium' : 'text-white'}>{inspection.next_due}</p>
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-white ml-4">
                      {expandedInspection === inspection.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                  </div>
                  {expandedInspection === inspection.id && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <p className="text-gray-400 text-xs mb-2">Notes</p>
                      <p className="text-white text-sm mb-4">{inspection.notes}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Checklist Items</p>
                          <div className="space-y-1">
                            <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" defaultChecked className="rounded" /> Load cell function</label>
                            <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" defaultChecked className="rounded" /> Wire rope condition</label>
                            <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" className="rounded" /> Safety devices</label>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-2">Signature</p>
                          <div className="w-full h-20 border border-gray-700 rounded bg-gray-800/30 flex items-center justify-center">
                            <span className="text-gray-500 text-sm">[Digital signature placeholder]</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}

        {activeTab === 'permits' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowPermitModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold mb-4"
          >
            <Plus size={18} /> Issue Permit
          </button>

          <div className="cb-table-scroll touch-pan-x">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Permit #</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">TW Reference</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Work Type</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Issued To</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Issue Date</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Expiry</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">QR Code</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockPermits.map((permit) => {
                  const statusColor = permit.status === 'Valid' ? 'text-green-400 bg-green-500/10' : permit.status === 'Expired' ? 'text-red-400 bg-red-500/10' : 'text-gray-400 bg-gray-500/10';
                  return (
                    <tr key={permit.id} className={`border-b border-gray-700/50 hover:bg-gray-800/30 ${permit.status === 'Expired' ? 'bg-red-900/10' : ''}`}>
                      <td className="py-3 px-4 font-mono text-orange-400 text-xs">{permit.permit_number}</td>
                      <td className="py-3 px-4 text-white font-medium">{permit.tw_reference}</td>
                      <td className="py-3 px-4 text-gray-300">{permit.work_type}</td>
                      <td className="py-3 px-4 text-gray-300">{permit.issued_to}</td>
                      <td className="py-3 px-4 text-gray-300">{permit.issue_date}</td>
                      <td className="py-3 px-4 text-gray-300">{permit.expiry}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}>{permit.status}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="w-10 h-10 mx-auto border border-gray-600 rounded bg-gray-700 flex items-center justify-center">
                          <QrCode size={18} className="text-gray-400" />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {permit.status === 'Valid' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Revoke this permit?')) {
                                toast.success('Permit revoked');
                              }
                            }}
                            className="text-red-400 hover:text-red-300 text-xs font-medium"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/20">
              <p className="text-gray-400 text-xs mb-2">Active TW</p>
              <p className="text-3xl font-bold text-white">12</p>
              <p className="text-gray-500 text-xs mt-1">Currently in use</p>
            </div>
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/20">
              <p className="text-gray-400 text-xs mb-2">Overdue Inspections</p>
              <p className="text-3xl font-bold text-red-400">2</p>
              <p className="text-gray-500 text-xs mt-1">Require attention</p>
            </div>
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/20">
              <p className="text-gray-400 text-xs mb-2">Expiring Permits (30d)</p>
              <p className="text-3xl font-bold text-amber-400">1</p>
              <p className="text-gray-500 text-xs mt-1">2026-05-15</p>
            </div>
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/20">
              <p className="text-gray-400 text-xs mb-2">Compliance %</p>
              <p className="text-3xl font-bold text-green-400">92%</p>
              <p className="text-gray-500 text-xs mt-1">All inspections</p>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">TW by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { type: 'Scaffold', count: 5 },
                { type: 'Props', count: 4 },
                { type: 'Shoring', count: 2 },
                { type: 'Falsework', count: 1 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="type" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Bar dataKey="count" fill="#f97316" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">Inspections per Month (12 months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[
                { month: 'May', inspections: 8 },
                { month: 'Jun', inspections: 12 },
                { month: 'Jul', inspections: 15 },
                { month: 'Aug', inspections: 14 },
                { month: 'Sep', inspections: 18 },
                { month: 'Oct', inspections: 16 },
                { month: 'Nov', inspections: 14 },
                { month: 'Dec', inspections: 10 },
                { month: 'Jan', inspections: 12 },
                { month: 'Feb', inspections: 11 },
                { month: 'Mar', inspections: 13 },
                { month: 'Apr', inspections: 9 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Line type="monotone" dataKey="inspections" stroke="#f97316" strokeWidth={2} name="Inspections" dot={{ fill: '#f97316' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">TW Nearing Removal (Traffic Light Status)</h3>
            <div className="space-y-3">
              {[
                { ref: 'TW-001', title: 'Tower Crane Bases', removal_date: '2026-05-10', days_left: 13, status: 'amber' },
                { ref: 'TW-004', title: 'Formwork Shores', removal_date: '2026-05-05', days_left: 8, status: 'red' },
                { ref: 'TW-002', title: 'Scaffold System A', removal_date: '2026-06-01', days_left: 35, status: 'green' },
              ].map((item, idx) => {
                const bgColor = item.status === 'red' ? 'bg-red-500/10 border-red-500/50' : item.status === 'amber' ? 'bg-amber-500/10 border-amber-500/50' : 'bg-green-500/10 border-green-500/50';
                const textColor = item.status === 'red' ? 'text-red-400' : item.status === 'amber' ? 'text-amber-400' : 'text-green-400';
                return (
                  <div key={idx} className={`border rounded-lg p-4 ${bgColor}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-orange-400">{item.ref}</span>
                          <span className="text-white font-medium">{item.title}</span>
                        </div>
                        <p className={`text-sm ${textColor} font-medium`}>Removal: {item.removal_date} ({item.days_left}d)</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full ${item.status === 'red' ? 'bg-red-500' : item.status === 'amber' ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-display text-white">New Temporary Work</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="twTitle" className="block text-gray-400 text-xs mb-1">Title *</label>
                <input id="twTitle" type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Tower Crane Bases" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
              <div>
                <label htmlFor="twProject" className="block text-gray-400 text-xs mb-1">Project</label>
                <input id="twProject" type="text" value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} placeholder="Project name" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="twType" className="block text-gray-400 text-xs mb-1">Type</label>
                  <select id="twType" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                    <option value="Structural Support">Structural Support</option>
                    <option value="Propping">Propping</option>
                    <option value="Scaffolding">Scaffolding</option>
                    <option value="Excavation">Excavation</option>
                    <option value="Formwork">Formwork</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="twStatus" className="block text-gray-400 text-xs mb-1">Status</label>
                  <select id="twStatus" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                    <option value="design">In Design</option>
                    <option value="approval">Pending Approval</option>
                    <option value="installed">Installed</option>
                    <option value="in_use">In Use</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="twDesigner" className="block text-gray-400 text-xs mb-1">Designer</label>
                  <input id="twDesigner" type="text" value={form.designer} onChange={e => setForm(f => ({ ...f, designer: e.target.value }))} placeholder="Designer name" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="twInstaller" className="block text-gray-400 text-xs mb-1">Installer</label>
                  <input id="twInstaller" type="text" value={form.installer} onChange={e => setForm(f => ({ ...f, installer: e.target.value }))} placeholder="Installer name" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
              </div>
              <div>
                <label htmlFor="twDesc" className="block text-gray-400 text-xs mb-1">Description</label>
                <textarea id="twDesc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description..." rows={3} className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleCreate} disabled={createMutation.isPending || !form.title} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInspectionModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-display text-white">Record Inspection</h3>
              <button type="button" onClick={() => setShowInspectionModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="insp-tw" className="block text-gray-400 text-xs mb-1">Temporary Work *</label>
                <select id="insp-tw" value={inspectionForm.tw_ref} onChange={e => setInspectionForm(f => ({ ...f, tw_ref: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                  <option value="">Select TW...</option>
                  <option value="TW-001">TW-001 - Tower Crane Bases</option>
                  <option value="TW-002">TW-002 - Scaffold System A</option>
                  <option value="TW-003">TW-003 - Shoring Props</option>
                </select>
              </div>
              <div>
                <label htmlFor="insp-date" className="block text-gray-400 text-xs mb-1">Inspection Date *</label>
                <input id="insp-date" type="date" value={inspectionForm.date} onChange={e => setInspectionForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white" />
              </div>
              <div>
                <label htmlFor="insp-inspector" className="block text-gray-400 text-xs mb-1">Inspector *</label>
                <input id="insp-inspector" type="text" value={inspectionForm.inspector} onChange={e => setInspectionForm(f => ({ ...f, inspector: e.target.value }))} placeholder="Inspector name" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
              <div>
                <label htmlFor="insp-result" className="block text-gray-400 text-xs mb-1">Result *</label>
                <select id="insp-result" value={inspectionForm.result} onChange={e => setInspectionForm(f => ({ ...f, result: e.target.value as any }))} className="w-full px-3 py-2 input input-bordered text-white">
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                  <option value="Advisory">Advisory</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-2">Checklist Items</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" defaultChecked className="rounded" /> Load cell function</label>
                  <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" defaultChecked className="rounded" /> Wire rope condition</label>
                  <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" className="rounded" /> Safety devices</label>
                </div>
              </div>
              <div>
                <label htmlFor="insp-notes" className="block text-gray-400 text-xs mb-1">Notes</label>
                <textarea id="insp-notes" value={inspectionForm.notes} onChange={e => setInspectionForm(f => ({ ...f, notes: e.target.value }))} placeholder="Inspection notes..." rows={3} className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-2">Signature</label>
                <div className="w-full h-20 border border-gray-700 rounded bg-gray-800 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">[Digital signature field]</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setShowInspectionModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={() => { toast.success('Inspection recorded'); setShowInspectionModal(false); }} disabled={!inspectionForm.tw_ref || !inspectionForm.date || !inspectionForm.inspector} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50">
                Record Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {showPermitModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-display text-white">Issue Permit</h3>
              <button type="button" onClick={() => setShowPermitModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="perm-tw" className="block text-gray-400 text-xs mb-1">Temporary Work *</label>
                <select id="perm-tw" value={permitForm.tw_reference} onChange={e => setPermitForm(f => ({ ...f, tw_reference: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                  <option value="">Select TW...</option>
                  <option value="TW-001">TW-001 - Tower Crane Bases</option>
                  <option value="TW-002">TW-002 - Scaffold System A</option>
                  <option value="TW-003">TW-003 - Shoring Props</option>
                </select>
              </div>
              <div>
                <label htmlFor="perm-type" className="block text-gray-400 text-xs mb-1">Work Type *</label>
                <select id="perm-type" value={permitForm.work_type} onChange={e => setPermitForm(f => ({ ...f, work_type: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                  <option value="">Select work type...</option>
                  <option value="Heavy Lifting">Heavy Lifting</option>
                  <option value="Scaffolding Erection">Scaffolding Erection</option>
                  <option value="Propping Work">Propping Work</option>
                  <option value="Excavation Support">Excavation Support</option>
                </select>
              </div>
              <div>
                <label htmlFor="perm-issued" className="block text-gray-400 text-xs mb-1">Issued To *</label>
                <input id="perm-issued" type="text" value={permitForm.issued_to} onChange={e => setPermitForm(f => ({ ...f, issued_to: e.target.value }))} placeholder="Company/contractor name" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
              <div>
                <label htmlFor="perm-conditions" className="block text-gray-400 text-xs mb-1">Conditions</label>
                <textarea id="perm-conditions" value={permitForm.conditions} onChange={e => setPermitForm(f => ({ ...f, conditions: e.target.value }))} placeholder="e.g. Max 5t load, daily inspections required..." rows={3} className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
              <div>
                <label htmlFor="perm-duration" className="block text-gray-400 text-xs mb-1">Duration (months) *</label>
                <input id="perm-duration" type="number" min="1" value={permitForm.duration} onChange={e => setPermitForm(f => ({ ...f, duration: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setShowPermitModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={() => { toast.success('Permit issued'); setShowPermitModal(false); }} disabled={!permitForm.tw_reference || !permitForm.work_type || !permitForm.issued_to} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50">
                Issue Permit
              </button>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-display text-white">Edit Temporary Work</h3>
              <button type="button" onClick={() => setEditItem(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="twTitle" className="block text-gray-400 text-xs mb-1">Title *</label>
                  <input id="twTitle" type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Tower Crane Bases" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="twProject" className="block text-gray-400 text-xs mb-1">Project</label>
                  <input id="twProject" type="text" value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} placeholder="Project name" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="twType" className="block text-gray-400 text-xs mb-1">Type</label>
                  <select id="twType" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                    <option value="Structural Support">Structural Support</option>
                    <option value="Propping">Propping</option>
                    <option value="Scaffolding">Scaffolding</option>
                    <option value="Excavation">Excavation</option>
                    <option value="Formwork">Formwork</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="twStatus" className="block text-gray-400 text-xs mb-1">Status</label>
                  <select id="twStatus" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white">
                    <option value="design">In Design</option>
                    <option value="approval">Pending Approval</option>
                    <option value="installed">Installed</option>
                    <option value="in_use">In Use</option>
                    <option value="removed">Removed</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="twLoc" className="block text-gray-400 text-xs mb-1">Location</label>
                <input id="twLoc" type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Sector A, Level 2" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
              <div>
                <label htmlFor="twDesc" className="block text-gray-400 text-xs mb-1">Description</label>
                <textarea id="twDesc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description..." rows={2} className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="twDesignBy" className="block text-gray-400 text-xs mb-1">Designed By</label>
                  <input id="twDesignBy" type="text" value={form.design_by} onChange={e => setForm(f => ({ ...f, design_by: e.target.value }))} placeholder="Engineer name" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="twDesignDate" className="block text-gray-400 text-xs mb-1">Design Date</label>
                  <input id="twDesignDate" type="date" value={form.design_date} onChange={e => setForm(f => ({ ...f, design_date: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="twAppBy" className="block text-gray-400 text-xs mb-1">Approved By</label>
                  <input id="twAppBy" type="text" value={form.approved_by} onChange={e => setForm(f => ({ ...f, approved_by: e.target.value }))} placeholder="Approver name" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="twAppDate" className="block text-gray-400 text-xs mb-1">Approval Date</label>
                  <input id="twAppDate" type="date" value={form.approval_date} onChange={e => setForm(f => ({ ...f, approval_date: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="twErectBy" className="block text-gray-400 text-xs mb-1">Erected By</label>
                  <input id="twErectBy" type="text" value={form.erected_by} onChange={e => setForm(f => ({ ...f, erected_by: e.target.value }))} placeholder="Installer name" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="twErectDate" className="block text-gray-400 text-xs mb-1">Erected Date</label>
                  <input id="twErectDate" type="date" value={form.erected_date} onChange={e => setForm(f => ({ ...f, erected_date: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="twInspBy" className="block text-gray-400 text-xs mb-1">Inspected By</label>
                  <input id="twInspBy" type="text" value={form.inspected_by} onChange={e => setForm(f => ({ ...f, inspected_by: e.target.value }))} placeholder="Inspector name" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="twInspDate" className="block text-gray-400 text-xs mb-1">Inspected Date</label>
                  <input id="twInspDate" type="date" value={form.inspected_date} onChange={e => setForm(f => ({ ...f, inspected_date: e.target.value }))} className="w-full px-3 py-2 input input-bordered text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="twLoad" className="block text-gray-400 text-xs mb-1">Load Capacity</label>
                  <input id="twLoad" type="text" value={form.load_capacity} onChange={e => setForm(f => ({ ...f, load_capacity: e.target.value }))} placeholder="e.g. 5kN/m2" className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
                <div>
                  <label htmlFor="twNotes" className="block text-gray-400 text-xs mb-1">Notes</label>
                  <input id="twNotes" type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional info..." className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleUpdate} disabled={updateMutation.isPending || !form.title} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
