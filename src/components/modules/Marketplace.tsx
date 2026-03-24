import { useState } from 'react';
import {
  CheckCircle2,
  Zap,
  Plug,
  LayoutTemplate,
  TrendingUp,
  Shield,
  FileText,
  Calendar,
  BarChart3,
  Download,
  BookOpen,
  MessageCircle,
  AlertCircle,
  Star,
  ExternalLink,
  Code2,
  Users,
  Phone,
  Mail,
  MapPin,
  Filter,
  X,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  PoundSterling,
} from 'lucide-react';

type SubTab = 'apps' | 'integrations' | 'templates' | 'training' | 'suppliers' | 'support';
type AnyRow = Record<string, unknown>;

const TABS: { key: SubTab; label: string; icon: React.ElementType }[] = [
  { key: 'apps', label: 'Apps', icon: Zap },
  { key: 'integrations', label: 'Integrations', icon: Plug },
  { key: 'templates', label: 'Templates', icon: LayoutTemplate },
  { key: 'training', label: 'Training', icon: BookOpen },
  { key: 'suppliers', label: 'Suppliers', icon: Users },
  { key: 'support', label: 'Support', icon: MessageCircle },
];

const APP_CATEGORIES = ['All', 'Safety', 'Finance', 'Productivity', 'AI', 'Integration'];

interface AppData extends AnyRow {
  id: string;
  name: string;
  desc: string;
  category: string;
  rating: number;
  installs: number;
  price: string;
  installed: boolean;
  screenshot: string;
  changelog: string[];
}

const APPS: AppData[] = [
  {
    id: 'safety-analyzer',
    name: 'Safety Incident Analyser',
    desc: 'Automatically categorize and analyse safety incidents with AI-powered risk assessment',
    category: 'Safety',
    rating: 4.8,
    installs: 342,
    price: 'Free',
    installed: true,
    screenshot: '🔍',
    changelog: ['v2.1: Enhanced pattern detection', 'v2.0: Multi-project support', 'v1.0: Initial release'],
  },
  {
    id: 'rfi-responder',
    name: 'RFI AI Responder',
    desc: 'Draft intelligent responses to requests for information with document context',
    category: 'AI',
    rating: 4.6,
    installs: 128,
    price: '£50/mo',
    installed: true,
    screenshot: '💬',
    changelog: ['v1.5: Context learning', 'v1.0: Basic drafting'],
  },
  {
    id: 'rams-generator',
    name: 'RAMS Generator',
    desc: 'Auto-generate risk assessments and method statements from templates',
    category: 'Safety',
    rating: 4.7,
    installs: 256,
    price: '£100/mo',
    installed: false,
    screenshot: '📋',
    changelog: ['v3.2: Custom fields', 'v3.1: HSE templates', 'v3.0: Full rewrite'],
  },
  {
    id: 'daily-reporter',
    name: 'Daily Report Summariser',
    desc: 'Automatically summarize site activities and highlight key events',
    category: 'Productivity',
    rating: 4.5,
    installs: 189,
    price: 'Free',
    installed: true,
    screenshot: '📊',
    changelog: ['v1.8: Photo integration', 'v1.0: Launch'],
  },
  {
    id: 'budget-tracker',
    name: 'Budget Variance Tracker',
    desc: 'Real-time budget monitoring with variance alerts',
    category: 'Finance',
    rating: 4.9,
    installs: 487,
    price: '£75/mo',
    installed: false,
    screenshot: '💰',
    changelog: ['v2.5: Forecast engine', 'v2.0: API integration'],
  },
  {
    id: 'payroll-sync',
    name: 'Payroll Sync',
    desc: 'Sync timesheets and labour costs directly to payroll systems',
    category: 'Finance',
    rating: 4.4,
    installs: 214,
    price: '£120/mo',
    installed: false,
    screenshot: '💳',
    changelog: ['v1.6: Pension integration', 'v1.0: Release'],
  },
  {
    id: 'schedule-optimizer',
    name: 'Schedule Optimizer',
    desc: 'AI-powered critical path analysis and resource leveling',
    category: 'Productivity',
    rating: 4.7,
    installs: 156,
    price: '£60/mo',
    installed: false,
    screenshot: '⏰',
    changelog: ['v2.3: Weather integration', 'v2.0: Multi-project'],
  },
  {
    id: 'document-manager',
    name: 'Document Manager Pro',
    desc: 'Centralized document control with version tracking and compliance',
    category: 'Productivity',
    rating: 4.6,
    installs: 298,
    price: '£40/mo',
    installed: false,
    screenshot: '📁',
    changelog: ['v3.1: OCR support', 'v3.0: Digital signatures'],
  },
  {
    id: 'quality-audits',
    name: 'Quality Audit Suite',
    desc: 'Standardized inspection checklists and defect tracking',
    category: 'Safety',
    rating: 4.8,
    installs: 412,
    price: '£85/mo',
    installed: false,
    screenshot: '✓',
    changelog: ['v4.2: Photo evidence', 'v4.0: Mobile app'],
  },
  {
    id: 'compliance-monitor',
    name: 'Compliance Monitor',
    desc: 'Track regulatory requirements and audit readiness',
    category: 'Safety',
    rating: 4.5,
    installs: 173,
    price: '£110/mo',
    installed: false,
    screenshot: '📜',
    changelog: ['v2.1: GDPR templates', 'v2.0: Auto alerts'],
  },
  {
    id: 'crm-connector',
    name: 'CRM Connector',
    desc: 'Integrate with Salesforce, Pipedrive, and HubSpot',
    category: 'Integration',
    rating: 4.6,
    installs: 89,
    price: '£55/mo',
    installed: false,
    screenshot: '🔗',
    changelog: ['v1.4: Two-way sync', 'v1.0: Read-only'],
  },
  {
    id: 'email-parser',
    name: 'Email Parser',
    desc: 'Extract data from emails directly into CortexBuild',
    category: 'Integration',
    rating: 4.3,
    installs: 56,
    price: '£30/mo',
    installed: false,
    screenshot: '📧',
    changelog: ['v1.2: Attachment support', 'v1.0: Launch'],
  },
  {
    id: 'iot-sensors',
    name: 'IoT Sensor Integration',
    desc: 'Connect site sensors for environmental and safety monitoring',
    category: 'AI',
    rating: 4.7,
    installs: 134,
    price: '£150/mo',
    installed: false,
    screenshot: '📡',
    changelog: ['v2.1: More device types', 'v2.0: Real-time dashboards'],
  },
  {
    id: 'chatbot-support',
    name: 'Chatbot Support',
    desc: 'AI-powered support bot with knowledge base integration',
    category: 'AI',
    rating: 4.4,
    installs: 203,
    price: '£65/mo',
    installed: false,
    screenshot: '🤖',
    changelog: ['v1.5: Custom training', 'v1.0: Launch'],
  },
  {
    id: 'supplier-portal',
    name: 'Supplier Portal',
    desc: 'Self-service portal for subcontractors and suppliers',
    category: 'Productivity',
    rating: 4.5,
    installs: 167,
    price: '£45/mo',
    installed: false,
    screenshot: '🏢',
    changelog: ['v2.1: Mobile optimized', 'v2.0: Payment tracking'],
  },
  {
    id: 'analytics-suite',
    name: 'Analytics Suite',
    desc: 'Advanced reporting with custom dashboards and KPI tracking',
    category: 'Finance',
    rating: 4.8,
    installs: 521,
    price: '£95/mo',
    installed: false,
    screenshot: '📈',
    changelog: ['v3.5: Predictive models', 'v3.0: Redesigned'],
  },
];

const INTEGRATIONS: AnyRow[] = [
  { id: 'xero', name: 'Xero', desc: 'Sync invoices, payments and financial data', status: 'Connected', lastSync: '2 hours ago' },
  { id: 'sage', name: 'Sage 50', desc: 'Accounting software integration for UK construction', status: 'Connected', lastSync: '30 mins ago' },
  { id: 'quickbooks', name: 'QuickBooks Online', desc: 'Cloud accounting and expense tracking', status: 'Available', lastSync: null },
  { id: 'ms-project', name: 'Microsoft Project', desc: 'Import & export programme data and Gantt charts', status: 'Available', lastSync: null },
  { id: 'procore', name: 'Procore', desc: 'Bidirectional sync for drawings, RFIs and submittals', status: 'Coming Soon', lastSync: null },
  { id: 'docusign', name: 'DocuSign', desc: 'Send contracts and RAMS for e-signature directly', status: 'Available', lastSync: null },
  { id: 'companies-house', name: 'Companies House', desc: 'Retrieve company data and filing records', status: 'Available', lastSync: null },
  { id: 'hmrc', name: 'HMRC APIs', desc: 'CIS verification and tax compliance', status: 'Connected', lastSync: '1 hour ago' },
  { id: 'os-maps', name: 'Ordnance Survey', desc: 'Map integration and spatial data', status: 'Available', lastSync: null },
  { id: 'autodesk', name: 'Autodesk BIM 360', desc: 'Construction collaboration platform integration', status: 'Available', lastSync: null },
  { id: 'bluebeam', name: 'Bluebeam Revu', desc: 'PDF markup and construction workflows', status: 'Coming Soon', lastSync: null },
  { id: 'slack', name: 'Slack', desc: 'Notifications and instant team collaboration', status: 'Connected', lastSync: '5 mins ago' },
  { id: 'teams', name: 'Microsoft Teams', desc: 'Push alerts and project updates to Teams channels', status: 'Connected', lastSync: '10 mins ago' },
];

const TEMPLATES: AnyRow[] = [
  { id: 'rams-scaffold', name: 'RAMS — Scaffold Erection', category: 'Safety', downloads: 147, image: '📋' },
  { id: 'daily-report', name: 'Daily Site Report', category: 'Reporting', downloads: 312, image: '📅' },
  { id: 'weekly-summary', name: 'Weekly Programme Summary', category: 'Reporting', downloads: 204, image: '📊' },
  { id: 'change-order', name: 'Change Order — Variation', category: 'Commercial', downloads: 96, image: '✏️' },
  { id: 'safety-induction', name: 'Site Induction Checklist', category: 'Safety', downloads: 289, image: '✅' },
  { id: 'rfi-response', name: 'RFI Response Template', category: 'Reporting', downloads: 167, image: '💬' },
  { id: 'contract-terms', name: 'Sub-contract Terms & Conditions', category: 'Legal', downloads: 143, image: '📄' },
  { id: 'incident-form', name: 'Incident Report Form', category: 'Safety', downloads: 198, image: '⚠️' },
  { id: 'handover', name: 'Defect Handover Schedule', category: 'Legal', downloads: 112, image: '📑' },
  { id: 'payment-cert', name: 'Payment Certificate Template', category: 'Commercial', downloads: 246, image: '💳' },
  { id: 'cis-return', name: 'CIS Return Form', category: 'Legal', downloads: 89, image: '🏛️' },
  { id: 'method-statement', name: 'Generic Method Statement', category: 'Safety', downloads: 334, image: '📖' },
  { id: 'risk-assess', name: 'Risk Assessment Template', category: 'Safety', downloads: 267, image: '⚡' },
  { id: 'toolbox-talk', name: 'Toolbox Talk Record', category: 'Safety', downloads: 201, image: '🎙️' },
  { id: 'timesheets', name: 'Weekly Timesheet', category: 'HR', downloads: 178, image: '⏱️' },
  { id: 'insurance-cert', name: 'Insurance Certificate', category: 'Legal', downloads: 145, image: '🛡️' },
  { id: 'meeting-minutes', name: 'Project Meeting Minutes', category: 'Reporting', downloads: 223, image: '📝' },
  { id: 'variation-order', name: 'Variation Order Form', category: 'Commercial', downloads: 134, image: '💼' },
  { id: 'snagging-list', name: 'Snagging List Template', category: 'Reporting', downloads: 156, image: '🔎' },
  { id: 'plant-register', name: 'Plant & Equipment Register', category: 'HR', downloads: 98, image: '🏗️' },
];

const SUPPLIERS: AnyRow[] = [
  { id: 's1', name: 'Crane Hire Solutions', trade: 'Equipment Hire', rating: 4.8, phone: '0121 555 1234', email: 'info@craneplus.co.uk', location: 'Birmingham' },
  { id: 's2', name: 'Scaffolding Pro Ltd', trade: 'Scaffolding', rating: 4.6, phone: '0151 446 0000', email: 'sales@scaffpro.com', location: 'Liverpool' },
  { id: 's3', name: 'Concrete Supplies UK', trade: 'Materials', rating: 4.9, phone: '0161 832 2000', email: 'enquiry@concsup.co.uk', location: 'Manchester' },
  { id: 's4', name: 'Safety Systems Ltd', trade: 'Safety Equipment', rating: 4.7, phone: '020 7123 4567', email: 'support@safetysys.com', location: 'London' },
  { id: 's5', name: 'Electrical Supplies Direct', trade: 'Electrical Materials', rating: 4.5, phone: '0113 200 8000', email: 'sales@elecsupp.co.uk', location: 'Leeds' },
  { id: 's6', name: 'Plumbing Wholesaler', trade: 'Plumbing Materials', rating: 4.4, phone: '0118 958 8000', email: 'orders@plumbwhole.com', location: 'Reading' },
  { id: 's7', name: 'Paint & Coatings Hub', trade: 'Painting Materials', rating: 4.8, phone: '0203 875 5000', email: 'bulk@paintcoat.co.uk', location: 'London' },
  { id: 's8', name: 'Labour Recruitment Plus', trade: 'Labour Supply', rating: 4.3, phone: '0121 700 2000', email: 'placements@labrec.com', location: 'Birmingham' },
  { id: 's9', name: 'Waste Management Services', trade: 'Waste Management', rating: 4.6, phone: '01925 700 900', email: 'contracts@wasteuk.com', location: 'Warrington' },
  { id: 's10', name: 'PPE & Clothing Supplier', trade: 'PPE', rating: 4.7, phone: '0844 736 7000', email: 'sales@ppe-store.co.uk', location: 'Manchester' },
  { id: 's11', name: 'Tool Rental Express', trade: 'Tool Hire', rating: 4.5, phone: '02890 232 747', email: 'hire@toolrental.co.uk', location: 'Belfast' },
  { id: 's12', name: 'Training & Competency', trade: 'Training Services', rating: 4.8, phone: '01634 290 290', email: 'bookings@traincomp.co.uk', location: 'Medway' },
];

const TRAINING_RESOURCES: AnyRow[] = [
  { id: '1', title: 'Getting Started with CortexBuild', type: 'Video', duration: '15 min', completed: true },
  { id: '2', title: 'Project Setup & Management', type: 'Course', duration: '45 min', completed: false },
  { id: '3', title: 'Advanced Reporting Features', type: 'Webinar', duration: '60 min', completed: false },
  { id: '4', title: 'Safety Module Deep Dive', type: 'Video', duration: '25 min', completed: true },
  { id: '5', title: 'Mobile App Walkthrough', type: 'Video', duration: '12 min', completed: false },
  { id: '6', title: 'CIS Compliance Training', type: 'Course', duration: '90 min', completed: false },
];

export function Marketplace() {
  const [subTab, setSubTab] = useState<SubTab>('apps');
  const [installedApps, setInstalledApps] = useState(['safety-analyzer', 'rfi-responder', 'daily-reporter']);
  const [searchQuery, setSearchQuery] = useState('');
  const [appCategory, setAppCategory] = useState('All');
  const [selectedApp, setSelectedApp] = useState<AnyRow | null>(null);
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('All');

  const statusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'connected':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'available':
        return 'bg-blue-500/20 text-blue-400';
      case 'coming soon':
        return 'bg-amber-500/20 text-amber-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const toggleApp = (id: string) => {
    setInstalledApps(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const filteredApps = APPS.filter(app => {
    const matchesCategory = appCategory === 'All' || app.category === appCategory;
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredSuppliers = selectedSupplierFilter === 'All'
    ? SUPPLIERS
    : SUPPLIERS.filter(s => s.trade === selectedSupplierFilter);

  const supplierTrades = Array.from(new Set(SUPPLIERS.map(s => s.trade)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">CortexBuild Marketplace</h1>
          <p className="text-sm text-gray-400 mt-1">Discover apps, integrations, templates & resources</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Active Apps</p>
          <p className="text-2xl font-bold text-orange-500">{Number(installedApps.length)}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Integrations</p>
          <p className="text-2xl font-bold text-blue-400">{INTEGRATIONS.filter(i => i.status === 'Connected').length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Templates Available</p>
          <p className="text-2xl font-bold text-emerald-400">{TEMPLATES.length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Trusted Suppliers</p>
          <p className="text-2xl font-bold text-purple-400">{SUPPLIERS.length}</p>
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
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* APPS TAB */}
      {subTab === 'apps' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search apps..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
              />
            </div>
            <select
              value={appCategory}
              onChange={e => setAppCategory(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm"
            >
              {APP_CATEGORIES.map(cat => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {filteredApps.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
              <p className="text-gray-400">No apps match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApps.map((app) => {
                const isInstalled = installedApps.includes(String(app.id));
                return (
                  <div
                    key={String(app.id)}
                    className={`border rounded-xl p-5 transition ${
                      isInstalled ? 'bg-gray-900 border-orange-600' : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <button
                          onClick={() => setSelectedApp(app as unknown as AnyRow)}
                          className="text-left hover:text-orange-400 transition"
                        >
                          <h4 className="font-bold text-white">{app.name}</h4>
                        </button>
                        <p className="text-xs text-orange-400 mt-1">{app.category}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${statusColor(isInstalled ? 'connected' : 'available')}`}>
                        {isInstalled ? 'Installed' : 'Available'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{app.desc}</p>
                    <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400" fill="currentColor" />
                        {app.rating}
                      </span>
                      <span>{app.installs} users</span>
                      <span className="font-semibold text-white">{app.price}</span>
                    </div>
                    <button
                      onClick={() => toggleApp(String(app.id))}
                      className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition ${
                        isInstalled
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                    >
                      {isInstalled ? 'Uninstall' : 'Install'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* App Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white">{String(selectedApp.name)}</h2>
                <p className="text-orange-400 text-sm mt-1">{String(selectedApp.category)}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-white p-2">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-gray-900 rounded-lg p-8 text-center text-6xl">
                {String(selectedApp.screenshot)}
              </div>
              <div>
                <h3 className="text-white font-bold mb-2">Description</h3>
                <p className="text-gray-400">{String(selectedApp.desc)}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <Star className="h-5 w-5 text-yellow-400 mx-auto mb-2" fill="currentColor" />
                  <p className="text-white font-bold">{Number(selectedApp.rating)}</p>
                  <p className="text-xs text-gray-400">Rating</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <Users className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                  <p className="text-white font-bold">{Number(selectedApp.installs)}</p>
                  <p className="text-xs text-gray-400">Users</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <PoundSterling className="h-5 w-5 text-green-400 mx-auto mb-2" />
                  <p className="text-white font-bold">{String(selectedApp.price)}</p>
                  <p className="text-xs text-gray-400">Price</p>
                </div>
              </div>
              {(selectedApp as unknown as AppData).changelog && (
                <div>
                  <h3 className="text-white font-bold mb-2">Changelog</h3>
                  <ul className="space-y-1 text-sm text-gray-400">
                    {((selectedApp as unknown as AppData).changelog as string[]).map((entry: string, i: number) => (
                      <li key={i} className="flex gap-2">
                        <ChevronRight size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
                        {entry}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                onClick={() => {
                  toggleApp(String(selectedApp.id));
                  setSelectedApp(null);
                }}
                className={`w-full px-6 py-3 rounded-lg font-bold transition ${
                  installedApps.includes(String(selectedApp.id))
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                {installedApps.includes(String(selectedApp.id)) ? 'Uninstall' : 'Install'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTEGRATIONS TAB */}
      {subTab === 'integrations' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-medium">
              {Number(INTEGRATIONS.filter(i => i.status === 'Connected').length)} connected
            </span>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-medium">
              {Number(INTEGRATIONS.filter(i => i.status === 'Available').length)} available
            </span>
            <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full font-medium">
              {Number(INTEGRATIONS.filter(i => i.status === 'Coming Soon').length)} coming soon
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INTEGRATIONS.map(intg => {
              const isConnected = String(intg.status) === 'Connected';
              return (
                <div
                  key={String(intg.id)}
                  className={`bg-gray-900 border rounded-xl p-5 flex gap-4 items-start transition ${
                    isConnected ? 'border-emerald-700' : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="text-3xl flex-shrink-0">🔗</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-white">{String(intg.name)}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(String(intg.status))}`}>
                        {String(intg.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{String((intg as unknown as AnyRow).desc)}</p>
                    {(intg as unknown as AnyRow).lastSync ? <p className="text-xs text-gray-500">Last sync: {String((intg as unknown as AnyRow).lastSync)}</p> : null}
                  </div>
                  <button
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                      isConnected
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    {isConnected ? 'Manage' : String(intg.status) === 'Coming Soon' ? 'Notify' : 'Connect'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TEMPLATES TAB */}
      {subTab === 'templates' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">20+ document templates to accelerate project workflows</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map(tpl => (
              <div key={String(tpl.id)} className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{String(tpl.image)}</div>
                  <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded whitespace-nowrap">{String(tpl.category)}</span>
                </div>
                <h4 className="font-bold text-white mb-2">{String(tpl.name)}</h4>
                <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                  <span className="text-xs text-gray-500">{Number(tpl.downloads)} downloads</span>
                  <button className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-medium transition flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRAINING TAB */}
      {subTab === 'training' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TRAINING_RESOURCES.map(resource => (
              <div key={String(resource.id)} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-orange-400 uppercase font-bold">{String(resource.type)}</p>
                  {Boolean(resource.completed) && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                </div>
                <h4 className="font-bold text-white mb-3">{String(resource.title)}</h4>
                <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full ${Boolean(resource.completed) ? 'bg-emerald-500 w-full' : 'bg-orange-500 w-1/3'}`}
                  />
                </div>
                <p className="text-xs text-gray-400">{String(resource.duration)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUPPLIERS TAB */}
      {subTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedSupplierFilter('All')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                selectedSupplierFilter === 'All'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              All ({SUPPLIERS.length})
            </button>
            {(supplierTrades as string[]).map((trade) => (
              <button
                key={trade}
                onClick={() => setSelectedSupplierFilter(trade)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  selectedSupplierFilter === trade
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {trade}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSuppliers.map((supplier: AnyRow) => (
              <div key={String(supplier.id)} className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-white">{String(supplier.name)}</h4>
                    <p className="text-xs text-orange-400 mt-1">{String(supplier.trade)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                    <span className="text-sm font-bold text-white">{Number(supplier.rating)}</span>
                  </div>
                </div>
                <div className="space-y-2 mb-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-500 flex-shrink-0" />
                    <a href={`tel:${supplier.phone}`} className="hover:text-orange-400">{String(supplier.phone)}</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-500 flex-shrink-0" />
                    <a href={`mailto:${supplier.email}`} className="hover:text-orange-400 truncate">{String(supplier.email)}</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-500 flex-shrink-0" />
                    <span>{String(supplier.location)}</span>
                  </div>
                </div>
                <button className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition">
                  Request Quote
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUPPORT TAB */}
      {subTab === 'support' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <p className="font-medium text-emerald-400">All Systems OK</p>
              </div>
              <p className="text-xs text-gray-400">Last updated: 5 mins ago</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="h-5 w-5 text-blue-400" />
                <p className="font-medium text-blue-400">Avg Response: 2h</p>
              </div>
              <p className="text-xs text-gray-400">Support team</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="h-5 w-5 text-orange-400" />
                <p className="font-medium text-orange-400">Live Chat Available</p>
              </div>
              <button className="text-xs text-orange-400 hover:text-orange-300 font-bold mt-1">Start Chat Now</button>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Submit Support Ticket</h3>
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Subject"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm"
              />
              <textarea
                placeholder="Describe your issue..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm h-32 resize-none"
              />
              <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm">
                <option>Priority: Medium</option>
                <option>Priority: High</option>
                <option>Priority: Low</option>
              </select>
              <button type="button" className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition">
                Submit Ticket
              </button>
            </form>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Knowledge Base</h3>
            <div className="space-y-3">
              {[
                'Getting started with CortexBuild',
                'Setting up integrations',
                'User permissions & roles',
                'Data export & reporting',
                'Mobile app features',
              ].map((article, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 cursor-pointer transition">
                  <span className="text-gray-300 text-sm">{article}</span>
                  <ExternalLink size={16} className="text-gray-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
