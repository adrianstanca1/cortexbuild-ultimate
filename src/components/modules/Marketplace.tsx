import { useState } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Zap,
  Plug,
  LayoutTemplate,
  Download,
  BookOpen,
  MessageCircle,
  Star,
  CheckSquare,
  Square,
  Trash2,
} from 'lucide-react';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';

type SubTab = 'apps' | 'integrations' | 'templates' | 'training' | 'support';
type AnyRow = Record<string, unknown>;

const TABS: { key: SubTab; label: string; icon: React.ElementType }[] = [
  { key: 'apps', label: 'Apps', icon: Zap },
  { key: 'integrations', label: 'Integrations', icon: Plug },
  { key: 'templates', label: 'Templates', icon: LayoutTemplate },
  { key: 'training', label: 'Training', icon: BookOpen },
  { key: 'support', label: 'Support', icon: MessageCircle },
];

const APPS = [
  {
    id: 'safety-analyzer',
    name: 'Safety Incident Analyser',
    desc: 'Automatically categorize and analyse safety incidents',
    category: 'Safety',
    rating: 4.8,
    installs: 342,
    price: 'Free',
    installed: true,
  },
  {
    id: 'rfi-responder',
    name: 'RFI AI Responder',
    desc: 'Draft responses to requests for information',
    category: 'Admin',
    rating: 4.6,
    installs: 128,
    price: '£50/mo',
    installed: true,
  },
  {
    id: 'rams-generator',
    name: 'RAMS Generator',
    desc: 'Auto-generate risk assessments and method statements',
    category: 'Safety',
    rating: 4.7,
    installs: 256,
    price: '£100/mo',
    installed: false,
  },
  {
    id: 'daily-reporter',
    name: 'Daily Report Summariser',
    desc: 'Summarize site activities and progress',
    category: 'Reporting',
    rating: 4.5,
    installs: 189,
    price: 'Free',
    installed: true,
  },
];

const INTEGRATIONS = [
  {
    id: 'xero',
    name: 'Xero',
    desc: 'Sync invoices, payments and financial data',
    category: 'Accounting',
    status: 'connected',
    lastSync: '2 hours ago',
  },
  {
    id: 'ms-project',
    name: 'Microsoft Project',
    desc: 'Import & export programme data and Gantt charts',
    category: 'Planning',
    status: 'available',
    lastSync: null,
  },
  {
    id: 'procore',
    name: 'Procore',
    desc: 'Bidirectional sync for drawings, RFIs and submittals',
    category: 'Construction',
    status: 'available',
    lastSync: null,
  },
  {
    id: 'docusign',
    name: 'DocuSign',
    desc: 'Send contracts and RAMS for e-signature directly',
    category: 'Compliance',
    status: 'available',
    lastSync: null,
  },
];

const TEMPLATES = [
  {
    id: 'rams-scaffold',
    name: 'RAMS — Scaffold Erection',
    desc: 'Full risk assessment and method statement',
    category: 'Safety',
    downloads: 147,
  },
  {
    id: 'daily-report',
    name: 'Daily Site Report',
    desc: 'Standard daily site diary template',
    category: 'Reporting',
    downloads: 312,
  },
  {
    id: 'weekly-summary',
    name: 'Weekly Programme Summary',
    desc: 'Progress against programme with lookahead',
    category: 'Reporting',
    downloads: 204,
  },
  {
    id: 'change-order',
    name: 'Change Order — Variation',
    desc: 'Formal variation instruction template',
    category: 'Commercial',
    downloads: 96,
  },
];

const TRAINING_RESOURCES = [
  { id: '1', title: 'Getting Started with CortexBuild', type: 'Video', duration: '15 min', completed: true },
  { id: '2', title: 'Project Setup & Management', type: 'Course', duration: '45 min', completed: false },
  { id: '3', title: 'Advanced Reporting Features', type: 'Webinar', duration: '60 min', completed: false },
];

export function Marketplace() {
  const [subTab, setSubTab] = useState<SubTab>('apps');
  const [installedApps, setInstalledApps] = useState(['safety-analyzer', 'rfi-responder', 'daily-reporter']);
  const [searchQuery, setSearchQuery] = useState('');
  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Remove ${ids.length} app(s)?`)) return;
    try {
      setInstalledApps(prev => prev.filter(id => !ids.includes(id)));
      toast.success(`Removed ${ids.length} app(s)`);
      clearSelection();
    } catch {
      toast.error('Bulk action failed');
    }
  }

  const statusColor = (status: string): string => {
    switch (status) {
      case 'connected':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'available':
        return 'bg-blue-500/20 text-blue-400';
      case 'coming-soon':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const statusLabel = (status: string): string => {
    switch (status) {
      case 'connected':
        return '✓ Connected';
      case 'available':
        return 'Available';
      case 'coming-soon':
        return 'Coming Soon';
      default:
        return status;
    }
  };

  const toggleApp = (id: string) => {
    setInstalledApps(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">CortexBuild Marketplace</h1>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Records Indexed</p>
          <p className="text-2xl font-bold text-white">15.2M</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Last Indexed</p>
          <p className="text-2xl font-bold text-white">2 hours ago</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Active Apps</p>
          <p className="text-2xl font-bold text-white">{Number(installedApps.length)}</p>
        </div>
      </div>

      {/* Sub-nav */}
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

      {/* APPS TAB */}
      {subTab === 'apps' && (
        <div className="space-y-5">
          <input
            type="text"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {APPS.map(app => {
              const isInstalled = installedApps.includes(app.id);
              const isSelected = selectedIds.has(app.id);
              return (
                <div
                  key={app.id}
                  className={`border rounded-xl p-6 transition ${
                    isInstalled ? 'bg-gray-900 border-blue-600' : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <button type="button" onClick={() => toggle(app.id)}>
                        {isSelected ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
                      </button>
                      <div>
                        <h4 className="font-bold text-white">{String(app.name)}</h4>
                        <p className="text-xs text-blue-400">{String(app.category)}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColor(isInstalled ? 'connected' : 'available')}`}>
                      {Boolean(isInstalled) && 'Installed'}
                      {Boolean(!isInstalled) && 'Available'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{String(app.desc)}</p>
                  <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      {Number(app.rating)}
                    </span>
                    <span>{Number(app.installs)} installs</span>
                    <span>{String(app.price)}</span>
                  </div>
                  <button
                    onClick={() => toggleApp(String(app.id))}
                    className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition ${
                      isInstalled
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {Boolean(isInstalled) && 'Uninstall'}
                    {Boolean(!isInstalled) && 'Install'}
                  </button>
                </div>
              );
            })}
          </div>

          <BulkActionsBar
            selectedIds={Array.from(selectedIds)}
            actions={[
              { id: 'delete', label: 'Uninstall Selected', icon: Trash2, variant: 'danger', onClick: handleBulkDelete, confirm: 'This will uninstall the selected apps.' },
            ]}
            onClearSelection={clearSelection}
          />
        </div>
      )}

      {/* INTEGRATIONS TAB */}
      {subTab === 'integrations' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-medium">
              {Number(INTEGRATIONS.filter(i => i.status === 'connected').length)} connected
            </span>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-medium">
              {Number(INTEGRATIONS.filter(i => i.status === 'available').length)} available
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INTEGRATIONS.map(intg => (
              <div
                key={String(intg.id)}
                className={`bg-gray-900 border rounded-xl p-5 flex gap-4 items-start ${intg.status === 'connected' ? 'border-emerald-700' : 'border-gray-800 hover:border-gray-700'} transition`}
              >
                <div className="text-3xl flex-shrink-0">🔗</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-white">{String(intg.name)}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(intg.status)}`}>
                      {statusLabel(intg.status)}
                    </span>
                  </div>
                  <p className="text-xs text-blue-400 mb-1.5">{String(intg.category)}</p>
                  <p className="text-sm text-gray-400">{String(intg.desc)}</p>
                  {intg.lastSync && <p className="text-xs text-gray-500 mt-2">Last sync: {String(intg.lastSync)}</p>}
                </div>
                <button
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    intg.status === 'connected'
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {intg.status === 'connected' ? 'Manage' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TEMPLATES TAB */}
      {subTab === 'templates' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Pre-built templates to speed up document creation.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATES.map(tpl => (
              <div key={String(tpl.id)} className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition rounded-xl p-5 flex gap-4">
                <div className="p-2.5 bg-blue-900/40 rounded-lg flex-shrink-0">
                  <LayoutTemplate className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white mb-0.5">{String(tpl.name)}</h4>
                  <p className="text-xs text-blue-400 mb-1.5">{String(tpl.category)}</p>
                  <p className="text-sm text-gray-400 mb-3">{String(tpl.desc)}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{Number(tpl.downloads)} downloads</span>
                    <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition">
                      <Download className="h-3 w-3 inline mr-1" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRAINING TAB */}
      {subTab === 'training' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TRAINING_RESOURCES.map(resource => (
              <div key={String(resource.id)} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-blue-400 uppercase font-medium">{String(resource.type)}</p>
                  {Boolean(resource.completed) && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                </div>
                <h4 className="font-bold text-white mb-2">{String(resource.title)}</h4>
                <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full ${resource.completed ? 'bg-green-500 w-full' : 'bg-blue-500 w-1/3'}`}
                  />
                </div>
                <p className="text-xs text-gray-400">{String(resource.duration)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUPPORT TAB */}
      {subTab === 'support' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <p className="font-medium text-green-400">All Systems Operational</p>
              </div>
              <p className="text-sm text-gray-400">Last updated: 2 hours ago</p>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="h-5 w-5 text-blue-400" />
                <p className="font-medium text-white">Live Chat Support</p>
              </div>
              <button className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium w-full">
                Start Chat
              </button>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Submit Support Ticket</h3>
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Subject"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
              <textarea
                placeholder="Description"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white h-32"
              />
              <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
                <option>Priority: Medium</option>
                <option>Priority: High</option>
                <option>Priority: Low</option>
              </select>
              <button type="button" className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                Submit Ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
