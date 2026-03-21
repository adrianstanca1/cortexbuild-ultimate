// Module: Marketplace
import { useState } from 'react';
import { CheckCircle2, Zap, Plug, LayoutTemplate, TrendingUp, Shield, FileText, Calendar, BarChart3, Repeat } from 'lucide-react';

type SubTab = 'agents' | 'integrations' | 'templates';

const TABS: { key: SubTab; label: string; icon: React.ElementType }[] = [
  { key: 'agents',       label: 'AI Agents',    icon: Zap },
  { key: 'integrations', label: 'Integrations', icon: Plug },
  { key: 'templates',    label: 'Templates',    icon: LayoutTemplate },
];

const AGENTS = [
  { id: 'safety-analyzer', name: 'Safety Incident Analyser', desc: 'Automatically categorize and analyse safety incidents', status: 'active', category: 'Safety' },
  { id: 'rfi-responder', name: 'RFI AI Responder', desc: 'Draft responses to requests for information', status: 'active', category: 'Admin' },
  { id: 'rams-generator', name: 'RAMS Generator', desc: 'Auto-generate risk assessments and method statements', status: 'available', category: 'Safety' },
  { id: 'daily-reporter', name: 'Daily Report Summariser', desc: 'Summarize site activities and progress', status: 'active', category: 'Reporting' },
  { id: 'cost-predictor', name: 'Cost Predictor', desc: 'Forecast project costs and budget variances', status: 'available', category: 'Finance' },
  { id: 'tender-scorer', name: 'Tender Scorer', desc: 'Score and rank tender opportunities', status: 'available', category: 'Commercial' },
  { id: 'cis-calculator', name: 'CIS Calculator', desc: 'Automated CIS deduction calculations', status: 'coming-soon', category: 'Finance' },
  { id: 'co-drafter', name: 'Change Order Drafter', desc: 'Draft change orders with cost analysis', status: 'available', category: 'Commercial' },
  { id: 'photo-analyzer', name: 'Progress Photo Analyser', desc: 'Extract progress data from site photos', status: 'coming-soon', category: 'Reporting' },
  { id: 'weather-assessor', name: 'Weather Risk Assessor', desc: 'Weather-related programme impact analysis', status: 'available', category: 'Planning' },
];

const INTEGRATIONS = [
  { id: 'xero', name: 'Xero', desc: 'Sync invoices, payments and financial data with Xero accounting', icon: '💰', status: 'connected', category: 'Accounting' },
  { id: 'sage', name: 'Sage 50', desc: 'Two-way sync for payroll and purchase ledger', icon: '📊', status: 'available', category: 'Accounting' },
  { id: 'ms-project', name: 'Microsoft Project', desc: 'Import & export programme data and Gantt charts', icon: '📅', status: 'available', category: 'Planning' },
  { id: 'google-drive', name: 'Google Drive', desc: 'Automatically file documents into structured Drive folders', icon: '📂', status: 'connected', category: 'Storage' },
  { id: 'procore', name: 'Procore', desc: 'Bidirectional sync for drawings, RFIs and submittals', icon: '🏗️', status: 'available', category: 'Construction' },
  { id: 'docusign', name: 'DocuSign', desc: 'Send contracts and RAMS for e-signature directly', icon: '✍️', status: 'available', category: 'Compliance' },
  { id: 'metoffice', name: 'Met Office API', desc: 'Live weather data linked to site locations', icon: '🌦️', status: 'connected', category: 'Field' },
  { id: 'stripe', name: 'Stripe Payments', desc: 'Accept client payments and track cash allocation', icon: '💳', status: 'coming-soon', category: 'Finance' },
  { id: 'hmrc', name: 'HMRC MTD', desc: 'Submit CIS returns and VAT via Making Tax Digital', icon: '🏛️', status: 'available', category: 'Tax & Compliance' },
  { id: 'outlook', name: 'Microsoft 365', desc: 'Email, Teams messaging and calendar synchronisation', icon: '📧', status: 'available', category: 'Productivity' },
];

const TEMPLATES = [
  { id: 'rams-scaffold', name: 'RAMS — Scaffold Erection', desc: 'Full risk assessment and method statement for scaffold erection work', category: 'Safety', icon: Shield, uses: 147 },
  { id: 'rams-excavation', name: 'RAMS — Excavation Works', desc: 'Comprehensive method statement covering excavation and groundworks', category: 'Safety', icon: Shield, uses: 89 },
  { id: 'daily-report', name: 'Daily Site Report', desc: 'Standard daily site diary template with weather, workers, activities and delays', category: 'Reporting', icon: FileText, uses: 312 },
  { id: 'weekly-summary', name: 'Weekly Programme Summary', desc: 'Progress against programme with lookahead schedule and resource plan', category: 'Reporting', icon: BarChart3, uses: 204 },
  { id: 'change-order', name: 'Change Order — Variation', desc: 'Formal variation instruction template with cost breakdown and approval workflow', category: 'Commercial', icon: FileText, uses: 96 },
  { id: 'tender-submission', name: 'Tender Submission Pack', desc: 'Complete tender response with pricing schedule, programme and methodology', category: 'Commercial', icon: TrendingUp, uses: 55 },
  { id: 'meeting-minutes', name: 'Site Meeting Minutes', desc: 'Structured minutes template with action log and attendance register', category: 'Admin', icon: Calendar, uses: 178 },
  { id: 'cis-return', name: 'CIS Monthly Return', desc: 'CIS300 style summary with individual subcontractor deduction statements', category: 'Finance', icon: Repeat, uses: 73 },
];

export function Marketplace() {
  const [subTab, setSubTab] = useState<SubTab>('agents');
  const [enabledAgents, setEnabledAgents] = useState(['safety-analyzer', 'rfi-responder', 'daily-reporter']);

  const statusColor = (status: string) => {
    switch (status) {
      case 'active':      return 'bg-green-500/20 text-green-400';
      case 'available':   return 'bg-blue-500/20 text-blue-400';
      case 'coming-soon': return 'bg-yellow-500/20 text-yellow-400';
      case 'connected':   return 'bg-emerald-500/20 text-emerald-400';
      default:            return 'bg-gray-500/20 text-gray-400';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'active':      return '✓ Active';
      case 'available':   return 'Available';
      case 'coming-soon': return 'Coming Soon';
      case 'connected':   return '✓ Connected';
      default:            return status;
    }
  };

  const toggleAgent = (id: string) => {
    setEnabledAgents(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const activeAgents = AGENTS.filter(a => enabledAgents.includes(a.id));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">AI Marketplace</h1>

      {/* Active Agents Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-2">Active AI Agents</h3>
        <p className="text-blue-100 mb-4">{enabledAgents.length} agents enabled and running on your projects</p>
        <div className="flex flex-wrap gap-2">
          {activeAgents.map(agent => (
            <span key={agent.id} className="bg-blue-900 px-3 py-1 rounded-full text-sm font-medium">
              {agent.name}
            </span>
          ))}
        </div>
      </div>

      {/* Sub-nav */}
      <div className="border-b border-gray-700 flex gap-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                subTab === t.key
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon size={14}/>{t.label}
            </button>
          );
        })}
      </div>

      {/* AI AGENTS */}
      {subTab === 'agents' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AGENTS.map(agent => {
              const isEnabled = enabledAgents.includes(agent.id);
              return (
                <div key={agent.id} className={`border rounded-xl p-6 transition ${
                  isEnabled ? 'bg-gray-900 border-blue-600' : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                }`}>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-white flex-1">{agent.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${statusColor(agent.status)}`}>
                      {statusLabel(agent.status)}
                    </span>
                  </div>
                  <p className="text-xs text-blue-400 mb-2">{agent.category}</p>
                  <p className="text-sm text-gray-400 mb-4">{agent.desc}</p>
                  <button
                    onClick={() => agent.status !== 'coming-soon' && toggleAgent(agent.id)}
                    disabled={agent.status === 'coming-soon'}
                    className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition ${
                      agent.status === 'coming-soon'
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : isEnabled
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {agent.status === 'coming-soon' ? 'Coming Soon' : isEnabled ? 'Disable Agent' : 'Enable Agent'}
                  </button>
                  {isEnabled && (
                    <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle2 className="w-4 h-4" />Running actively
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Usage Stats */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Agent Usage This Month</h3>
            <div className="space-y-3">
              {[
                { agent: 'Safety Analyser', uses: 23, savings: '£1,150' },
                { agent: 'Daily Report Summariser', uses: 19, savings: '£950' },
                { agent: 'RFI Responder', uses: 12, savings: '£600' },
                { agent: 'Cost Predictor', uses: 8, savings: '£400' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-gray-800/50 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="text-white font-semibold">{stat.agent}</p>
                    <p className="text-xs text-gray-400">{stat.uses} uses this month</p>
                  </div>
                  <p className="text-green-400 font-semibold">{stat.savings} time saved</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INTEGRATIONS */}
      {subTab === 'integrations' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-medium">
              {INTEGRATIONS.filter(i=>i.status==='connected').length} connected
            </span>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-medium">
              {INTEGRATIONS.filter(i=>i.status==='available').length} available
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INTEGRATIONS.map(intg => (
              <div key={intg.id} className={`bg-gray-900 border rounded-xl p-5 flex gap-4 items-start ${intg.status==='connected'?'border-emerald-700':'border-gray-800 hover:border-gray-700'} transition`}>
                <div className="text-3xl flex-shrink-0">{intg.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-white">{intg.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(intg.status)}`}>{statusLabel(intg.status)}</span>
                  </div>
                  <p className="text-xs text-blue-400 mb-1.5">{intg.category}</p>
                  <p className="text-sm text-gray-400">{intg.desc}</p>
                </div>
                <button
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    intg.status==='connected'
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : intg.status==='coming-soon'
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {intg.status==='connected'?'Manage':intg.status==='coming-soon'?'Soon':'Connect'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TEMPLATES */}
      {subTab === 'templates' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Pre-built templates to speed up document creation across your projects.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATES.map(tpl => {
              const Icon = tpl.icon;
              return (
                <div key={tpl.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 transition rounded-xl p-5 flex gap-4 items-start">
                  <div className="p-2.5 bg-blue-900/40 rounded-lg flex-shrink-0">
                    <Icon size={18} className="text-blue-400"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white mb-0.5">{tpl.name}</h4>
                    <p className="text-xs text-blue-400 mb-1.5">{tpl.category}</p>
                    <p className="text-sm text-gray-400 mb-3">{tpl.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{tpl.uses} uses</span>
                      <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition">
                        Use Template
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
