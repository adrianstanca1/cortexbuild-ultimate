import React, { useState, useMemo } from 'react';
import { useSiteInspections } from '../../hooks/useData';
import { toSnake } from '../../services/api';
import { toast } from 'sonner';
import {
  Plus, X, Pencil, Trash2, ClipboardCheck, Search,
  AlertTriangle, CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';

type AnyRow = Record<string, unknown>;
type SubTab = 'all' | 'scheduled' | 'passed' | 'failed' | 'conditional';

const STATUS_STYLES: Record<string, string> = {
  scheduled:   'bg-blue-500/20 text-blue-300',
  passed:      'bg-green-500/20 text-green-300',
  failed:      'bg-red-500/20 text-red-300',
  conditional: 'bg-yellow-500/20 text-yellow-300',
};

const STATUS_ICONS: Record<string, React.FC<{ className?: string }>> = {
  scheduled:   Clock,
  passed:      CheckCircle2,
  failed:      XCircle,
  conditional: AlertTriangle,
};

const SEVERITY_STYLES: Record<string, string> = {
  low:       'bg-green-500/20 text-green-300',
  medium:    'bg-yellow-500/20 text-yellow-300',
  high:      'bg-orange-500/20 text-orange-300',
  critical:  'bg-red-500/20 text-red-300',
};

export function SiteInspections() {
  const { useList, useCreate, useUpdate, useDelete } = useSiteInspections;
  const { data: items = [], isLoading } = useList();
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [subTab, setSubTab] = useState<SubTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<Record<string, unknown>>({});
  const { selectedIds, toggle, clearSelection, isAllSelected } = useBulkSelection();

  const filteredItems = useMemo(() => {
    let result = items as AnyRow[];
    if (subTab !== 'all') {
      result = result.filter((i: AnyRow) => String(i.status) === subTab);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((i: AnyRow) =>
        String(i.name || '').toLowerCase().includes(lower) ||
        String(i.category || '').toLowerCase().includes(lower) ||
        String(i.description || '').toLowerCase().includes(lower)
      );
    }
    return result;
  }, [items, subTab, searchTerm]);

  const tabs: { key: SubTab; label: string }[] = [
    { key: 'all',         label: `All (${(items as AnyRow[]).length})` },
    { key: 'scheduled',   label: `Scheduled (${(items as AnyRow[]).filter((i: AnyRow) => String(i.status) === 'scheduled').length})` },
    { key: 'passed',      label: `Passed (${(items as AnyRow[]).filter((i: AnyRow) => String(i.status) === 'passed').length})` },
    { key: 'failed',      label: `Failed (${(items as AnyRow[]).filter((i: AnyRow) => String(i.status) === 'failed').length})` },
    { key: 'conditional', label: `Conditional (${(items as AnyRow[]).filter((i: AnyRow) => String(i.status) === 'conditional').length})` },
  ];

  const handleSave = async () => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: String(editing.id), data: toSnake(form) });
        toast.success('Inspection updated');
      } else {
        await createMutation.mutateAsync(toSnake(form));
        toast.success('Inspection created');
      }
      setShowModal(false);
      setEditing(null);
      setForm({});
    } catch {
      toast.error('Failed to save inspection');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Inspection deleted');
    } catch {
      toast.error('Failed to delete inspection');
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    for (const id of Array.from(selectedIds)) {
      await deleteMutation.mutateAsync(id);
    }
    clearSelection();
    toast.success(`${count} inspection(s) deleted`);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ status: 'scheduled', severity: 'medium' });
    setShowModal(true);
  };

  const openEdit = (item: AnyRow) => {
    setEditing(item);
    setForm(item);
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <ModuleBreadcrumbs currentModule="site-inspections" onNavigate={() => {}} />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-7 h-7 text-orange-500" />
          <h1 className="text-2xl font-bold text-base-content">Site Inspections</h1>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> Schedule Inspection
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4 border-b border-base-300 pb-1">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`px-3 py-1.5 text-sm font-medium rounded-t transition-colors ${
              subTab === t.key
                ? 'bg-orange-500/20 text-orange-400 border-b-2 border-orange-500'
                : 'text-base-content/60 hover:text-base-content'
            }`}
            onClick={() => setSubTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            placeholder="Search inspections..."
            className="input input-sm input-bordered pl-9 w-full"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <BulkActionsBar
          selectedIds={Array.from(selectedIds)}
          actions={[
            { id: 'delete', label: 'Delete Selected', icon: Trash2, variant: 'danger' as const, onClick: handleBulkDelete, confirm: 'Delete all selected inspections?' },
          ]}
          onClearSelection={clearSelection}
        />
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center p-12"><span className="loading loading-spinner loading-lg" /></div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-base-content/50">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No inspections found</p>
          <p className="text-sm">Schedule a new inspection to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-xs"
                    checked={selectedIds.size > 0 && isAllSelected(filteredItems.length)}
                    onChange={() => {
                      if (isAllSelected(filteredItems.length)) {
                        clearSelection();
                      } else {
                        filteredItems.forEach((i: AnyRow) => toggle(String(i.id)));
                      }
                    }}
                  />
                </th>
                <th>Name</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item: AnyRow) => {
                const StatusIcon = STATUS_ICONS[String(item.status)] || Clock;
                const id = String(item.id);
                return (
                  <tr key={id} className={selectedIds.has(id) ? 'bg-orange-500/10' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs"
                        checked={selectedIds.has(id)}
                        onChange={() => toggle(id)}
                      />
                    </td>
                    <td className="font-medium">{String(item.name || '-')}</td>
                    <td><span className="badge badge-ghost badge-sm">{String(item.category || '-')}</span></td>
                    <td>
                      <span className={`badge badge-sm ${SEVERITY_STYLES[String(item.severity)] || ''}`}>
                        {String(item.severity || '-')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${STATUS_STYLES[String(item.status)] || ''}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {String(item.status || 'draft')}
                      </span>
                    </td>
                    <td className="text-sm text-base-content/60">{String(item.due_date || '-')}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-xs btn-ghost" onClick={() => openEdit(item)}>
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button className="btn btn-xs btn-ghost text-error" onClick={() => handleDelete(id)}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{editing ? 'Edit' : 'Schedule'} Inspection</h3>
              <button className="btn btn-xs btn-ghost" onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
            </div>

            <div className="grid gap-3">
              <div className="form-control">
                <label className="label text-sm">Name</label>
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  value={String(form.name || '')}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Inspection name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label text-sm">Category</label>
                  <select
                    className="select select-bordered select-sm"
                    value={String(form.category || 'general')}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="structural">Structural</option>
                    <option value="electrical">Electrical</option>
                    <option value="mechanical">Mechanical</option>
                    <option value="fire_safety">Fire Safety</option>
                    <option value="general">General</option>
                    <option value="environmental">Environmental</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label text-sm">Severity</label>
                  <select
                    className="select select-bordered select-sm"
                    value={String(form.severity || 'medium')}
                    onChange={e => setForm({ ...form, severity: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label text-sm">Status</label>
                  <select
                    className="select select-bordered select-sm"
                    value={String(form.status || 'scheduled')}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="conditional">Conditional</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label text-sm">Due Date</label>
                  <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={String(form.due_date || '')}
                    onChange={e => setForm({ ...form, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label text-sm">Description</label>
                <textarea
                  className="textarea textarea-bordered textarea-sm"
                  value={String(form.description || '')}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Inspection details..."
                  rows={3}
                />
              </div>

              <div className="form-control">
                <label className="label text-sm">Resolution</label>
                <textarea
                  className="textarea textarea-bordered textarea-sm"
                  value={String(form.resolution || '')}
                  onChange={e => setForm({ ...form, resolution: e.target.value })}
                  placeholder="Resolution notes (if completed)..."
                  rows={2}
                />
              </div>
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>
                {editing ? 'Update' : 'Schedule'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
        </dialog>
      )}
    </div>
  );
}

export default SiteInspections;