import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Star,
  Clock,
  Settings,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Download,
  BarChart2,
  TrendingUp,
} from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { reportTemplatesApi, type ReportTemplate } from '../../services/api';
import { toast } from 'sonner';
import clsx from 'clsx';

type AnyRow = Record<string, unknown>;
type SubTab = 'templates' | 'builder' | 'scheduled' | 'archive' | 'analytics';

interface ReportTemplateExt extends ReportTemplate, AnyRow {
  usage?: number;
  lastUsed?: string;
}

const REPORT_TYPES: Record<string, { label: string; icon: string; description: string }> = {
  'financial-summary': { label: 'Financial Summary', icon: '💰', description: 'Revenue, costs, and profit overview' },
  'project-costs': { label: 'Project Costs', icon: '🏗️', description: 'Detailed project cost breakdown' },
  'safety': { label: 'Safety Report', icon: '⚠️', description: 'Safety incidents and compliance' },
  'progress': { label: 'Progress Report', icon: '📊', description: 'Project progress and milestones' },
  'hr': { label: 'HR Report', icon: '👥', description: 'Team hours and productivity' },
};

const TABS: { key: SubTab; label: string; icon: React.ElementType }[] = [
  { key: 'templates', label: 'Templates', icon: FileText },
  { key: 'builder', label: 'Builder', icon: Settings },
  { key: 'scheduled', label: 'Scheduled', icon: Clock },
  { key: 'archive', label: 'Archive', icon: FileText },
  { key: 'analytics', label: 'Analytics', icon: BarChart2 },
];

export function ReportTemplates() {
  const [templates, setTemplates] = useState<ReportTemplateExt[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<SubTab>('templates');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplateExt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTemplates();
  }, [selectedType]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await reportTemplatesApi.getAll(selectedType === 'all' ? undefined : selectedType);
      setTemplates((data as unknown as AnyRow[]).map(t => ({
        ...t,
        usage: Math.floor(Math.random() * 100),
        lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      })) as ReportTemplateExt[]);
    } catch (err) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this template? This action cannot be undone.')) return;
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

  const filteredTemplates =
    selectedType === 'all'
      ? templates
      : templates.filter(t => String(t.type) === selectedType);

  const searchedTemplates = filteredTemplates.filter(t =>
    String(t.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Report Templates</h1>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Total Templates</p>
          <p className="text-2xl font-bold text-white">{Number(templates.length)}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Scheduled Reports</p>
          <p className="text-2xl font-bold text-white">12</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Generated This Month</p>
          <p className="text-2xl font-bold text-white">47</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Avg Generation Time</p>
          <p className="text-2xl font-bold text-white">2.3s</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-gray-700 flex gap-1 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                subTab === t.key
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TEMPLATES TAB */}
      {subTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
            />
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
            >
              <option value="all">All Types</option>
              {Object.entries(REPORT_TYPES).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.icon} {val.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Template
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Object.entries(REPORT_TYPES).map(([key, val]) => {
              const count = templates.filter(t => String(t.type) === key).length;
              const isActive = selectedType === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedType(key === selectedType ? 'all' : key)}
                  className={clsx(
                    'bg-gray-900 border rounded-xl p-4 text-left transition-all',
                    isActive && 'ring-2 ring-blue-500'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{String(val.icon)}</span>
                    {Boolean(count > 0) && (
                      <span className="px-2 py-0.5 bg-gray-700 rounded-full text-xs text-gray-400">
                        {Number(count)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-white mb-1">{String(val.label)}</h3>
                  <p className="text-xs text-gray-500">{String(val.description)}</p>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="p-8 flex justify-center">
              <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
            </div>
          ) : searchedTemplates.length === 0 ? (
            <EmptyState title="No templates found" variant="documents" />
          ) : (
            <div className="bg-gray-900 border border-gray-700 rounded-lg divide-y divide-gray-800">
              {searchedTemplates.map(template => (
                <div key={Number(template.id)} className="p-4 hover:bg-gray-800/50">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-gray-800 rounded-lg flex-shrink-0">
                      <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white">{String(template.name ?? 'Untitled')}</h4>
                        {Boolean(template.isDefault) && (
                          <Star className="h-4 w-4 text-amber-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{String(template.description ?? 'No description')}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Settings className="h-3 w-3" />
                          {REPORT_TYPES[String(template.type)]?.label || String(template.type)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {String(new Date(String(template.createdAt ?? '')).toLocaleDateString())}
                        </span>
                        <span>Used {Number(template.usage ?? 0)} times</span>
                        {template.lastUsed && <span>Last: {String(template.lastUsed)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDuplicate(Number(template.id))}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => setEditingTemplate(template)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(Number(template.id))}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-400" />
                      </button>
                      <button
                        onClick={() =>
                          setExpandedId(Number(template.id) === expandedId ? null : Number(template.id))
                        }
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {Number(template.id) === expandedId ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  {Number(template.id) === expandedId && (
                    <div className="mt-4 ml-12 p-4 bg-gray-800/50 rounded-lg">
                      <h5 className="text-xs text-gray-500 uppercase mb-2">Configuration</h5>
                      <pre className="text-xs text-gray-400 overflow-x-auto">
                        {JSON.stringify(template.config, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BUILDER TAB */}
      {subTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <h3 className="font-bold text-white mb-3">Add Sections</h3>
            <div className="space-y-2">
              {['Summary', 'KPI Metrics', 'Table', 'Chart', 'Image', 'Page Break'].map(section => (
                <button
                  key={section}
                  className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm text-left flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {section}
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 bg-gray-900 border border-gray-700 rounded-lg p-6 min-h-96">
            <div className="text-center text-gray-400">
              <p>Report preview will appear here</p>
              <p className="text-sm mt-2">Add sections from the left panel to build your template</p>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <h3 className="font-bold text-white mb-3">Settings</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  placeholder="Section title"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Data Source</label>
                <select className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm">
                  <option>Select data source</option>
                  <option>Projects</option>
                  <option>Invoices</option>
                </select>
              </div>
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium mt-4">
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULED TAB */}
      {subTab === 'scheduled' && (
        <div className="space-y-4">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Schedule New Report
          </button>
          <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Report Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Frequency</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Recipients</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Next Run</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {[
                    { name: 'Monthly Financial Report', frequency: 'Monthly', recipients: 3, nextRun: '2026-04-01', status: 'Active' },
                    { name: 'Weekly Progress Summary', frequency: 'Weekly', recipients: 5, nextRun: '2026-03-31', status: 'Active' },
                  ].map((report, idx) => (
                    <tr key={idx} className="hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-gray-300">{String(report.name)}</td>
                      <td className="px-4 py-3 text-gray-400">{String(report.frequency)}</td>
                      <td className="px-4 py-3 text-gray-400">{Number(report.recipients)} users</td>
                      <td className="px-4 py-3 text-gray-400">{String(report.nextRun)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                          {String(report.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ARCHIVE TAB */}
      {subTab === 'archive' && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Report Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Generated</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Format</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Size</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {[
                  { name: 'Monthly Financial Report - Feb 2026', generated: '2026-02-28', format: 'PDF', size: '2.3 MB' },
                  { name: 'Weekly Progress Summary - Week 12', generated: '2026-03-21', format: 'Excel', size: '1.1 MB' },
                ].map((report, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-300 font-medium">{String(report.name)}</td>
                    <td className="px-4 py-3 text-gray-400">{String(report.generated)}</td>
                    <td className="px-4 py-3 text-gray-400">{String(report.format)}</td>
                    <td className="px-4 py-3 text-gray-400">{String(report.size)}</td>
                    <td className="px-4 py-3">
                      <button className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {subTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h3 className="font-bold text-white mb-3">Most Used Templates</h3>
              <div className="space-y-3">
                {[
                  { name: 'Monthly Financial Report', uses: 127 },
                  { name: 'Weekly Progress Summary', uses: 94 },
                  { name: 'Daily Site Report', uses: 156 },
                ].map((tpl, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-1">
                      <p className="text-sm text-gray-300">{String(tpl.name)}</p>
                      <p className="text-sm font-medium text-blue-400">{Number(tpl.uses)}</p>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (Number(tpl.uses) / 156) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Generation Trend
              </h3>
              <p className="text-3xl font-bold text-white mb-1">47</p>
              <p className="text-sm text-green-400">↑ 12% from last month</p>
            </div>
          </div>
        </div>
      )}

      {(showCreateModal || editingTemplate) && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTemplate(null);
          }}
          onSave={() => {
            setShowCreateModal(false);
            setEditingTemplate(null);
            loadTemplates();
          }}
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
  template?: ReportTemplateExt | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(String(template?.name ?? ''));
  const [type, setType] = useState(String(template?.type ?? 'custom'));
  const [description, setDescription] = useState(String(template?.description ?? ''));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      if (template) {
        await reportTemplatesApi.update(String(template.id), { name, type, description });
      } else {
        await reportTemplatesApi.create({ name, type, description, config: {} });
      }
      toast.success(template ? 'Template updated' : 'Template created');
      onSave();
    } catch (err) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
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
                <option key={key} value={key}>
                  {val.icon} {val.label}
                </option>
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
        </div>
        <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
          >
            {Boolean(saving) && <RefreshCw className="h-4 w-4 animate-spin" />}
            {template ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
