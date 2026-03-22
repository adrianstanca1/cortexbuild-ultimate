import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Copy,
  Star,
  StarOff,
  Clock,
  Settings,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Download,
  Search,
} from 'lucide-react';
import { reportTemplatesApi, type ReportTemplate } from '../../services/api';
import { toast } from 'sonner';
import clsx from 'clsx';

const REPORT_TYPES: Record<string, { label: string; icon: string; description: string }> = {
  'financial-summary': { label: 'Financial Summary', icon: '💰', description: 'Revenue, costs, and profit overview' },
  'project-costs': { label: 'Project Costs', icon: '🏗️', description: 'Detailed project cost breakdown' },
  'invoices': { label: 'Invoice Report', icon: '📄', description: 'Invoice status and aging' },
  'team-hours': { label: 'Team Hours', icon: '👥', description: 'Team hours and productivity' },
  'safety': { label: 'Safety Report', icon: '⚠️', description: 'Safety incidents and compliance' },
  'custom': { label: 'Custom Report', icon: '📊', description: 'Build your own report' },
};

export function ReportTemplates() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [selectedType]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await reportTemplatesApi.getAll(selectedType === 'all' ? undefined : selectedType);
      setTemplates(data);
    } catch (err) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await reportTemplatesApi.delete(String(id));
      toast.success('Template deleted');
      loadTemplates();
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await reportTemplatesApi.duplicate(String(id));
      toast.success('Template duplicated');
      loadTemplates();
    } catch (err) {
      toast.error('Failed to duplicate template');
    }
  };

  const handleSetDefault = async (template: ReportTemplate) => {
    try {
      await reportTemplatesApi.update(String(template.id), { isDefault: !template.isDefault });
      toast.success(template.isDefault ? 'Default removed' : 'Set as default');
      loadTemplates();
    } catch (err) {
      toast.error('Failed to update template');
    }
  };

  const filteredTemplates = selectedType === 'all'
    ? templates
    : templates.filter(t => t.type === selectedType);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white font-display flex items-center gap-3">
            <FileText className="h-7 w-7 text-blue-400" />
            Report Templates
          </h1>
          <p className="text-sm text-gray-500">Save and reuse report configurations</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-4 py-2"
          >
            <option value="all">All Types</option>
            {Object.entries(REPORT_TYPES).map(([key, val]) => (
              <option key={key} value={key}>{val.icon} {val.label}</option>
            ))}
          </select>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </button>
          <button onClick={loadTemplates} className="btn btn-secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Object.entries(REPORT_TYPES).map(([key, val]) => {
          const count = templates.filter(t => t.type === key).length;
          const isActive = selectedType === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedType(key === selectedType ? 'all' : key)}
              className={clsx(
                'card p-4 text-left transition-all',
                isActive && 'ring-2 ring-blue-500'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{val.icon}</span>
                {count > 0 && (
                  <span className="px-2 py-0.5 bg-gray-700 rounded-full text-xs text-gray-400">
                    {count}
                  </span>
                )}
              </div>
              <h3 className="font-medium text-white mb-1">{val.label}</h3>
              <p className="text-xs text-gray-500">{val.description}</p>
            </button>
          );
        })}
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">
            {selectedType === 'all' ? 'All Templates' : REPORT_TYPES[selectedType]?.label || 'Templates'}
          </h3>
        </div>
        <div className="divide-y divide-gray-800">
          {loading ? (
            <div className="p-8 flex justify-center">
              <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="h-12 w-12 text-gray-700 mx-auto mb-3" />
              <p>No templates found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 text-blue-400 hover:underline"
              >
                Create your first template
              </button>
            </div>
          ) : (
            filteredTemplates.map(template => (
              <div key={template.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white">{template.name}</h4>
                      {template.isDefault && (
                        <Star className="h-4 w-4 text-amber-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{template.description || 'No description'}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Settings className="h-3 w-3" />
                        {REPORT_TYPES[template.type]?.label || template.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                      {template.config?.chartType && (
                        <span>Chart: {template.config.chartType}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSetDefault(template)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                      title={template.isDefault ? 'Remove default' : 'Set as default'}
                    >
                      {template.isDefault ? (
                        <StarOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Star className="h-4 w-4 text-gray-400 hover:text-amber-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDuplicate(template.id)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-400" />
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      {expandedId === template.id ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {expandedId === template.id && (
                  <div className="mt-4 ml-12 p-4 bg-gray-800/50 rounded-lg">
                    <h5 className="text-xs text-gray-500 uppercase mb-2">Configuration</h5>
                    <pre className="text-xs text-gray-400 overflow-x-auto">
                      {JSON.stringify(template.config, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {(showCreateModal || editingTemplate) && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => { setShowCreateModal(false); setEditingTemplate(null); }}
          onSave={() => { setShowCreateModal(false); setEditingTemplate(null); loadTemplates(); }}
        />
      )}
    </div>
  );
}

function TemplateModal({
  template,
  onClose,
  onSave,
}: {
  template?: ReportTemplate | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(template?.name || '');
  const [type, setType] = useState(template?.type || 'custom');
  const [description, setDescription] = useState(template?.description || '');
  const [columns, setColumns] = useState<string[]>(template?.config?.columns || []);
  const [chartType, setChartType] = useState<'table' | 'bar' | 'line' | 'pie'>(template?.config?.chartType || 'table');
  const [dateRange, setDateRange] = useState(template?.config?.dateRange || 'this_month');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const config = { columns, chartType, dateRange };
      if (template) {
        await reportTemplatesApi.update(String(template.id), { name, type, description, config });
      } else {
        await reportTemplatesApi.create({ name, type, description, config });
      }
      toast.success(template ? 'Template updated' : 'Template created');
      onSave();
    } catch (err) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const availableColumns = [
    { id: 'revenue', label: 'Revenue' },
    { id: 'costs', label: 'Costs' },
    { id: 'profit', label: 'Profit' },
    { id: 'outstanding', label: 'Outstanding' },
    { id: 'name', label: 'Name' },
    { id: 'client', label: 'Client' },
    { id: 'status', label: 'Status' },
    { id: 'date', label: 'Date' },
  ];

  const toggleColumn = (colId: string) => {
    setColumns(prev =>
      prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">
            {template ? 'Edit Template' : 'Create Template'}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              placeholder="Monthly Financial Report"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              {Object.entries(REPORT_TYPES).map(([key, val]) => (
                <option key={key} value={key}>{val.icon} {val.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white h-20"
              placeholder="Brief description of this template..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Chart Type</label>
            <div className="flex gap-2">
              {(['table', 'bar', 'line', 'pie'] as const).map(ct => (
                <button
                  key={ct}
                  onClick={() => setChartType(ct)}
                  className={clsx(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                    chartType === ct ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  )}
                >
                  {ct.charAt(0).toUpperCase() + ct.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Columns</label>
            <div className="flex flex-wrap gap-2">
              {availableColumns.map(col => (
                <button
                  key={col.id}
                  onClick={() => toggleColumn(col.id)}
                  className={clsx(
                    'px-3 py-1 rounded-full text-sm transition-colors',
                    columns.includes(col.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  )}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="this_year">This Year</option>
              <option value="all_time">All Time</option>
            </select>
          </div>
        </div>
        <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
            {template ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
