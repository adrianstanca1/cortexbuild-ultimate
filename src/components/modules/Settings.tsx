import { useState } from 'react';
import {
  Save, Bell, Shield, CreditCard, Users, Building2, Plug, Check,
  AlertTriangle, Trash2, Plus, X, Eye, EyeOff, Lock,
} from 'lucide-react';
import { useTeam } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;
type Tab = 'company' | 'users' | 'notifications' | 'integrations' | 'billing' | 'security';

const INTEGRATIONS_DATA = [
  { id: 'xero', name: 'Xero', icon: '£', desc: 'Sync invoices & expenses', connected: false },
  { id: 'procore', name: 'Procore', icon: '📊', desc: 'Project management sync', connected: true },
  { id: 'docusign', name: 'DocuSign', icon: '✍️', desc: 'Digital signatures', connected: false },
  { id: 'ms_teams', name: 'Microsoft Teams', icon: '💬', desc: 'Team communication', connected: false },
  { id: 'google_drive', name: 'Google Drive', icon: '☁️', desc: 'Document storage', connected: true },
  { id: 'companies_house', name: 'Companies House', icon: '🏢', desc: 'Company search & verify', connected: true },
];

const NOTIFICATION_TYPES = [
  { id: 'rfi_response', label: 'RFI Response' },
  { id: 'invoice_due', label: 'Invoice Due' },
  { id: 'document_approval', label: 'Document Approval' },
  { id: 'safety_alert', label: 'Safety Alert' },
  { id: 'project_deadline', label: 'Project Deadline' },
];

const ROLE_OPTIONS = ['Admin', 'Manager', 'Viewer', 'Field Worker'];
const PLANS = [
  { name: 'Starter', price: 99, users: 5, projects: 3, features: ['Basic reports', 'Email support', '5 GB storage'] },
  { name: 'Professional', price: 199, users: 25, projects: 20, features: ['Advanced analytics', 'CIS module', 'Priority support', 'API access', '100 GB storage'] },
  { name: 'Enterprise', price: 'Custom', users: 'Unlimited', projects: 'Unlimited', features: ['Custom integrations', 'Dedicated CSM', 'SLA guarantee', 'White-label option'] },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-10 h-5 rounded-full transition-colors ${on ? 'bg-orange-600' : 'bg-gray-700'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-gray-900 rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function Settings() {
  const { useList } = useTeam;
  const { data: raw = [] } = useList();
  const users = raw as AnyRow[];

  const [tab, setTab] = useState<Tab>('company');
  const [company, setCompany] = useState({
    name: 'CortexBuild Ltd',
    logo: '',
    address: '14 Irongate House, London',
    phone: '+44 20 7946 0958',
    website: 'www.cortexbuild.co.uk',
    company_number: '12345678',
    vat_number: 'GB123456789',
    cis_registered: true,
  });

  const [notifs, setNotifs] = useState({
    rfi_response: { email: true, in_app: true, sms: false },
    invoice_due: { email: true, in_app: true, sms: true },
    document_approval: { email: true, in_app: false, sms: false },
    safety_alert: { email: true, in_app: true, sms: true },
    project_deadline: { email: true, in_app: true, sms: false },
  });

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Manager' });
  const [integrations, setIntegrations] = useState<Record<string, boolean>>(
    Object.fromEntries(INTEGRATIONS_DATA.map(i => [i.id, i.connected]))
  );
  const [currentPlan] = useState('Professional');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const handleSaveCompany = async () => {
    toast.success('Company profile updated');
  };

  const handleInviteUser = async () => {
    if (!inviteForm.email) { toast.error('Email required'); return; }
    toast.success(`Invitation sent to ${inviteForm.email}`);
    setShowInviteModal(false);
    setInviteForm({ name: '', email: '', role: 'Manager' });
  };

  const handleToggleNotif = (type: string, channel: string) => {
    setNotifs(n => ({
      ...n,
      [type]: {
        ...n[type as keyof typeof notifs],
        [channel]: !n[type as keyof typeof notifs][channel as keyof (typeof notifs)[keyof typeof notifs]]
      }
    }));
  };

  const activeUsers = users.filter((u) => Boolean(u.is_active)).length;
  const connectedIntegrations = Object.values(integrations).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Settings</h1>

      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.id
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Users', value: activeUsers, colour: 'text-blue-400', bg: 'bg-blue-500/20' },
          { label: 'Integrations', value: `${connectedIntegrations}/${INTEGRATIONS_DATA.length}`, colour: 'text-green-400', bg: 'bg-green-500/20' },
          { label: 'Current Plan', value: currentPlan, colour: 'text-orange-400', bg: 'bg-orange-500/20' },
          { label: 'Storage Used', value: '2.4 GB / 100 GB', colour: 'text-purple-400', bg: 'bg-purple-500/20' },
        ].map((kpi, i) => (
          <div key={i} className="bg-gray-900 rounded-xl border border-gray-700 p-4">
            <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
            <p className={`text-lg font-bold ${kpi.colour}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {tab === 'company' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              Company Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Company Name</label>
                <input
                  value={company.name}
                  onChange={(e) => setCompany((c) => ({ ...c, name: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Companies House No.</label>
                  <input
                    value={company.company_number}
                    onChange={(e) => setCompany((c) => ({ ...c, company_number: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">VAT Number</label>
                  <input
                    value={company.vat_number}
                    onChange={(e) => setCompany((c) => ({ ...c, vat_number: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Address</label>
                <input
                  value={company.address}
                  onChange={(e) => setCompany((c) => ({ ...c, address: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Phone</label>
                  <input
                    value={company.phone}
                    onChange={(e) => setCompany((c) => ({ ...c, phone: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Website</label>
                  <input
                    value={company.website}
                    onChange={(e) => setCompany((c) => ({ ...c, website: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="cis"
                  checked={company.cis_registered}
                  onChange={(e) => setCompany((c) => ({ ...c, cis_registered: e.target.checked }))}
                  className="h-4 w-4 rounded"
                />
                <label htmlFor="cis" className="text-sm text-gray-300">
                  CIS Registered
                </label>
              </div>
              <button
                onClick={handleSaveCompany}
                className="mt-4 w-full px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white">Team Members</h3>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
            >
              <Plus size={16} />
              <span>Invite User</span>
            </button>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/60 border-b border-gray-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Last Login</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No users
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={String(u.id)} className="hover:bg-gray-800/40">
                        <td className="px-4 py-3 font-medium text-white">{String(u.name ?? '—')}</td>
                        <td className="px-4 py-3 text-gray-400 text-sm">{String(u.email ?? '—')}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                            {String(u.role ?? 'Viewer')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-sm">{String(u.last_login ?? '—')}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${Boolean(u.is_active) ? 'bg-green-500/20 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                            {Boolean(u.is_active) ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-base font-bold text-white mb-5">Notification Preferences</h3>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Notification Type</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Email</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase">In-App</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase">SMS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {NOTIFICATION_TYPES.map((nt) => (
                    <tr key={nt.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-3 text-gray-300">{nt.label}</td>
                      <td className="text-center px-4 py-3">
                        <Toggle
                          on={notifs[nt.id as keyof typeof notifs]?.email ?? false}
                          onToggle={() => handleToggleNotif(nt.id, 'email')}
                        />
                      </td>
                      <td className="text-center px-4 py-3">
                        <Toggle
                          on={notifs[nt.id as keyof typeof notifs]?.in_app ?? false}
                          onToggle={() => handleToggleNotif(nt.id, 'in_app')}
                        />
                      </td>
                      <td className="text-center px-4 py-3">
                        <Toggle
                          on={notifs[nt.id as keyof typeof notifs]?.sms ?? false}
                          onToggle={() => handleToggleNotif(nt.id, 'sms')}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
              <Save className="w-4 h-4 inline mr-2" />
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {tab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INTEGRATIONS_DATA.map((int) => (
            <div key={int.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{int.name}</h3>
                  <p className="text-sm text-gray-400">{int.desc}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    integrations[int.id] ? 'bg-green-500/20 text-green-300' : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {integrations[int.id] ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <button
                onClick={() => setIntegrations((i) => ({ ...i, [int.id]: !i[int.id] }))}
                className={`w-full px-3 py-2 text-sm rounded font-medium transition-colors ${
                  integrations[int.id]
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {integrations[int.id] ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'billing' && (
        <div className="space-y-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`border rounded-xl p-6 ${
                currentPlan === plan.name ? 'bg-orange-900/20 border-orange-600' : 'bg-gray-900 border-gray-800'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-2xl font-bold text-orange-400 mt-1">
                    {typeof plan.price === 'string' ? plan.price : `£${plan.price}/mo`}
                  </p>
                </div>
                {currentPlan === plan.name && (
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-full font-medium">Current</span>
                )}
              </div>
              <div className="space-y-1 mb-4">
                <p className="text-sm text-gray-400">
                  <span className="font-semibold text-white">{plan.users}</span> users
                </p>
                <p className="text-sm text-gray-400">
                  <span className="font-semibold text-white">{plan.projects}</span> projects
                </p>
              </div>
              <ul className="space-y-1 mb-4">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check size={14} className="text-green-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {currentPlan !== plan.name && (
                <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
                  Upgrade Plan
                </button>
              )}
            </div>
          ))}

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-6">
            <h3 className="text-base font-bold text-white mb-4">Invoice History</h3>
            <div className="space-y-2">
              {[
                { date: '2026-03-01', desc: 'Professional — Monthly', amount: 199, status: 'Paid' },
                { date: '2026-02-01', desc: 'Professional — Monthly', amount: 199, status: 'Paid' },
                { date: '2026-01-01', desc: 'Professional — Monthly', amount: 199, status: 'Paid' },
              ].map((inv, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 border border-gray-700 rounded-lg hover:bg-gray-800/40">
                  <div>
                    <p className="text-sm font-medium text-white">{inv.desc}</p>
                    <p className="text-xs text-gray-500">{inv.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">£{inv.amount}</p>
                    <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full">{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-base font-bold text-white mb-5">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, current: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, new: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
                <Lock className="w-4 h-4 inline mr-2" />
                Update Password
              </button>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Shield size={16} className="text-blue-400" />
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-400 mb-4">Protect your account with 2FA</p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Enable 2FA
            </button>
          </div>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Invite User</h2>
              <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-gray-800 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteUser}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
