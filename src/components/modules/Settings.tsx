// Module: Settings — CortexBuild Ultimate (Full Subpages)
import React, { useState, useEffect } from 'react';
import {
  Save, Bell, Shield, CreditCard, Users, Building2, Plug, Check,
  AlertTriangle, Trash2,
  Plus, RefreshCw, Lock, Eye, EyeOff, X, CheckCircle2,
  CheckSquare, Square, Loader2,
} from 'lucide-react';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { settingsApi, usersApi, companyApi } from '../../services/api';
import { toast } from 'sonner';

type Tab = 'company'|'users'|'billing'|'notifications'|'integrations'|'security';

const PLAN_FEATURES: Record<string, string[]> = {
  Starter:       ['Up to 3 projects','5 users','Basic reports','Email support'],
  Professional:  ['Up to 20 projects','25 users','Advanced analytics','CIS module','Priority support','API access'],
  Enterprise:    ['Unlimited projects','Unlimited users','Custom integrations','Dedicated CSM','SLA guarantee','White-label option'],
};

// ─── Notification toggle item ───────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className={`relative w-10 h-5 rounded-full transition-colors ${on?'bg-blue-600':'bg-gray-700'}`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-gray-800 rounded-full shadow transition-transform ${on?'translate-x-5':'translate-x-0.5'}`}/>
    </button>
  );
}

export function Settings() {
  const [tab, setTab] = useState<Tab>('company');

  // ── Loading states ────────────────────────────────────────────────────────
  const [_loadingCompany, _setLoadingCompany] = useState(false);
  const [savingCompany, setSavingCompany]   = useState(false);
  const [_loadingUsers, setLoadingUsers]       = useState(false);
  const [savingNotifs, setSavingNotifs]       = useState(false);

  // ── Company state ──────────────────────────────────────────────────────────
  const [company, setCompany] = useState({
    name:'CortexBuild Ltd', reg:'12345678', vat:'GB123456789', utr:'1234567890',
    address:'14 Irongate House, Cannon Street, London, EC4N 6AP',
    phone:'+44 20 7946 0958', email:'admin@cortexbuild.co.uk', website:'www.cortexbuild.co.uk',
    cis_contractor:true, cis_subcontractor:false, hmrc_office:'London',
    logo_url:'',
  });

  // ── Users state ───────────────────────────────────────────────────────────
  const [users, setUsers] = useState([
    { id:'u1', name:'Adrian Stanca',      email:'adrian.stanca1@gmail.com', role:'super_admin',     status:'active',  lastLogin:'Today'    },
    { id:'u2', name:'James Harrington',   email:'j.harrington@cortex.co.uk',role:'project_manager', status:'active',  lastLogin:'Yesterday'},
    { id:'u3', name:'Sarah Mitchell',     email:'s.mitchell@cortex.co.uk',  role:'project_manager', status:'active',  lastLogin:'2 days ago'},
    { id:'u4', name:'Tom Bradley',        email:'t.bradley@cortex.co.uk',   role:'admin',           status:'active',  lastLogin:'Today'    },
    { id:'u5', name:'Claire Watson',      email:'c.watson@cortex.co.uk',    role:'field_worker',    status:'active',  lastLogin:'3 days ago'},
    { id:'u6', name:'Dave Patel',         email:'d.patel@cortex.co.uk',     role:'field_worker',    status:'inactive',lastLogin:'2 weeks ago'},
  ]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail]         = useState('');
  const [inviteRole, setInviteRole]           = useState('project_manager');
  const [inviting, setInviting]              = useState(false);
  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  // ── Load company settings on mount ────────────────────────────────────────
  useEffect(() => {
    companyApi.get().then(data => {
      if (data) setCompany(prev => ({ ...prev, ...data as Record<string, string | boolean> }));
    }).catch(err => { console.warn('[Settings] company fetch failed:', err); /* use defaults */ });
  }, []);

  // ── Load users on mount ───────────────────────────────────────────────────
  useEffect(() => {
    setLoadingUsers(true);
    usersApi.getAll().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        // Transform API response to match UI structure
        const transformed = data.map(u => ({
          id: String(u.id),
          name: `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''}`.trim() || 'Unknown',
          email: u.email,
          role: u.role,
          status: u.is_active !== false ? 'active' : 'inactive',
          lastLogin: u.last_login_at ? 'Recently' : 'Never',
        }));
        setUsers(transformed as typeof users);
      }
    }).catch(() => { /* use defaults */ })
      .finally(() => setLoadingUsers(false));
  }, []);

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Remove ${ids.length} user(s)?`)) return;
    try {
      await Promise.all(ids.map(id => usersApi.delete(id)));
      setUsers(prev => prev.filter(u => !ids.includes(String(u.id))));
      toast.success(`Removed ${ids.length} user(s)`);
      clearSelection();
    } catch {
      toast.error('Bulk action failed');
    }
  }

  async function handleSaveCompany() {
    setSavingCompany(true);
    try {
      await companyApi.update(company);
      toast.success('Company settings saved');
    } catch {
      toast.error('Failed to save company settings');
    } finally {
      setSavingCompany(false);
    }
  }

  async function handleInviteUser() {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await usersApi.create({ email: inviteEmail, firstName: inviteEmail.split('@')[0], lastName: 'User', role: inviteRole });
      toast.success(`Invite sent to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
      // Reload users
      setLoadingUsers(true);
      usersApi.getAll().then(data => {
        if (Array.isArray(data) && data.length > 0) setUsers(data as typeof users);
      }).finally(() => setLoadingUsers(false));
    } catch {
      toast.error('Failed to send invite');
    } finally {
      setInviting(false);
    }
  }

  // ── Billing state ─────────────────────────────────────────────────────────
  const [currentPlan] = useState('Professional');
  const billingHistory = [
    { id:'b1', date:'2026-03-01', desc:'Professional — Monthly',  amount:149, status:'paid'   },
    { id:'b2', date:'2026-02-01', desc:'Professional — Monthly',  amount:149, status:'paid'   },
    { id:'b3', date:'2026-01-01', desc:'Professional — Monthly',  amount:149, status:'paid'   },
    { id:'b4', date:'2025-12-01', desc:'Professional — Monthly',  amount:149, status:'paid'   },
    { id:'b5', date:'2025-11-01', desc:'Starter → Pro Upgrade',   amount:89,  status:'paid'   },
  ];

  // ── Notification state ────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    safety_incidents: true,  rfis_raised: true,     change_orders: true,
    invoice_overdue: true,   daily_reports: false,  new_documents: false,
    cscs_expiry: true,       inspection_due: true,  project_delays: true,
    team_updates: false,     rams_approval: true,   cis_submissions: true,
    email_digest: true,      sms_alerts: false,     push_browser: true,
  });
  function toggleNotif(k: keyof typeof notifs) { setNotifs(n=>({...n,[k]:!n[k]})); }

  // ── Integration state ─────────────────────────────────────────────────────
  const [integrations, setIntegrations] = useState({
    hmrc_cis:    { name:'HMRC CIS Gateway',    connected:false, status:'Not connected', desc:'Submit CIS returns directly to HMRC. Requires Government Gateway credentials.' },
    xero:        { name:'Xero',                connected:false, status:'Not connected', desc:'Sync invoices and expenses with Xero accounting.' },
    quickbooks:  { name:'QuickBooks',          connected:false, status:'Not connected', desc:'Two-way invoice and expense sync with QuickBooks Online.' },
    companies_house:{ name:'Companies House',  connected:true,  status:'Connected — auto-verify', desc:'Auto-verify subcontractor company numbers via Companies House API.' },
    smartsheet:  { name:'Smartsheet',          connected:false, status:'Not connected', desc:'Sync project programmes and Gantt charts.' },
    procore:     { name:'Procore',             connected:false, status:'Not connected', desc:'Bi-directional sync with Procore project management.' },
  });

  // ── Security state ────────────────────────────────────────────────────────
  const [showPass, setShowPass] = useState(false);
  const [twoFA, setTwoFA]       = useState(false);
  const [sessions] = useState([
    { id:'s1', device:'Chrome — MacBook Pro',  location:'London, UK', last:'Now',        current:true  },
    { id:'s2', device:'Safari — iPhone 15',    location:'London, UK', last:'1 hour ago', current:false },
    { id:'s3', device:'Chrome — Windows 11',   location:'Manchester, UK', last:'2 days ago', current:false },
  ]);

  const TABS: { id: Tab; label: string; icon: typeof Save }[] = [
    { id:'company',       label:'Company',       icon:Building2     },
    { id:'users',         label:'Users',         icon:Users         },
    { id:'billing',       label:'Billing',       icon:CreditCard    },
    { id:'notifications', label:'Notifications', icon:Bell          },
    { id:'integrations',  label:'Integrations',  icon:Plug          },
    { id:'security',      label:'Security',      icon:Shield        },
  ];

  const ROLE_COLOURS: Record<string,string> = {
    super_admin:     'bg-red-900/30 text-red-300',
    admin:           'bg-orange-900/30 text-orange-300',
    project_manager: 'bg-blue-900/30 text-blue-300',
    field_worker:    'bg-green-900/30 text-green-300',
    client:          'bg-purple-900/30 text-purple-300',
  };

  return (
    <>
      <ModuleBreadcrumbs currentModule="settings" onNavigate={() => {}} />
      <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Settings</h1>

      {/* Tab Nav */}
      <div className="flex gap-1 card bg-base-100 border border-base-300 p-1 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button type="button"  key={t.id} onClick={()=>setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab===t.id?'bg-blue-600 text-white':'btn btn-ghost'}`}>
              <Icon className="w-4 h-4"/>{t.label}
            </button>
          );
        })}
      </div>

      {/* ── COMPANY ─────────────────────────────────────────────────────── */}
      {tab==='company' && (
        <div className="space-y-4">
          <div className="card bg-base-100 border border-base-300 p-6">
            <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-400"/>Company Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Company Name</label>
                <input value={company.name} onChange={e=>setCompany(c=>({...c,name:e.target.value}))}
                  className="w-full input input-bordered text-white text-sm focus:outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Companies House No.</label>
                <input value={company.reg} onChange={e=>setCompany(c=>({...c,reg:e.target.value}))}
                  className="w-full input input-bordered text-white text-sm focus:outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">VAT Number</label>
                <input value={company.vat} onChange={e=>setCompany(c=>({...c,vat:e.target.value}))}
                  className="w-full input input-bordered text-white text-sm focus:outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">UTR Number</label>
                <input value={company.utr} onChange={e=>setCompany(c=>({...c,utr:e.target.value}))}
                  className="w-full input input-bordered text-white text-sm focus:outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">HMRC Tax Office</label>
                <input value={company.hmrc_office} onChange={e=>setCompany(c=>({...c,hmrc_office:e.target.value}))}
                  className="w-full input input-bordered text-white text-sm focus:outline-none focus:border-blue-500"/>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Registered Address</label>
                <input value={company.address} onChange={e=>setCompany(c=>({...c,address:e.target.value}))}
                  className="w-full input input-bordered text-white text-sm focus:outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Phone</label>
                <input value={company.phone} onChange={e=>setCompany(c=>({...c,phone:e.target.value}))}
                  className="w-full input input-bordered text-white text-sm focus:outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                <input value={company.email} onChange={e=>setCompany(c=>({...c,email:e.target.value}))}
                  className="w-full input input-bordered text-white text-sm focus:outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Website</label>
                <input value={company.website} onChange={e=>setCompany(c=>({...c,website:e.target.value}))}
                  className="w-full input input-bordered text-white text-sm focus:outline-none focus:border-blue-500"/>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-300 p-6">
            <h3 className="text-base font-bold text-white mb-4">CIS Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center justify-between bg-gray-800 rounded-xl p-4 cursor-pointer">
                <div>
                  <p className="text-white text-sm font-medium">Registered as Contractor</p>
                  <p className="text-gray-400 text-xs mt-0.5">Deduct CIS from subcontractor payments</p>
                </div>
                <Toggle on={company.cis_contractor} onToggle={()=>setCompany(c=>({...c,cis_contractor:!c.cis_contractor}))}/>
              </label>
              <label className="flex items-center justify-between bg-gray-800 rounded-xl p-4 cursor-pointer">
                <div>
                  <p className="text-white text-sm font-medium">Registered as Subcontractor</p>
                  <p className="text-gray-400 text-xs mt-0.5">Receive payments with CIS deductions</p>
                </div>
                <Toggle on={company.cis_subcontractor} onToggle={()=>setCompany(c=>({...c,cis_subcontractor:!c.cis_subcontractor}))}/>
              </label>
            </div>
          </div>

          <button type="button" onClick={handleSaveCompany} disabled={savingCompany}
            className="flex items-center gap-2 px-5 py-2.5 btn btn-primary rounded-lg text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {savingCompany ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
            {savingCompany ? 'Saving…' : 'Save Company Settings'}
          </button>
        </div>
      )}

      {/* ── USERS ───────────────────────────────────────────────────────── */}
      {tab==='users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">{users.filter(u=>u.status==='active').length} active users · {users.length} total</p>
            <button type="button" onClick={()=>setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 btn btn-primary rounded-lg text-white text-sm font-medium transition-colors">
              <Plus className="w-4 h-4"/>Invite User
            </button>
          </div>
          <div className="card bg-base-100 border border-base-300 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/60 border-b border-gray-700">
                <tr>{['User','Email','Role','Status','Last Login',''].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map(u=>{
                  const isSelected = selectedIds.has(u.id);
                  return (
                  <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => toggle(u.id)}>
                        {isSelected ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </div>
                        <span className="text-white font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{u.email}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLOURS[u.role]??'bg-gray-700/50 text-gray-600'}`}>{u.role.replace(/_/g,' ')}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${u.status==='active'?'bg-green-900/30 text-green-300':'bg-gray-700/50 text-gray-500'}`}>{u.status}</span></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{u.lastLogin}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={()=>toast.success(`Removed ${u.name}`)} className="p-1 text-gray-400 hover:text-red-400 rounded transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <BulkActionsBar
            selectedIds={Array.from(selectedIds)}
            actions={[
              { id: 'delete', label: 'Remove Selected', icon: Trash2, variant: 'danger', onClick: handleBulkDelete, confirm: 'This will remove the selected users.' },
            ]}
            onClearSelection={clearSelection}
          />

          {showInviteModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                  <h2 className="text-base font-bold text-white">Invite Team Member</h2>
                  <button type="button" onClick={()=>setShowInviteModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
                    <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="name@company.co.uk"
                      className="w-full input input-bordered text-white text-sm focus:outline-none focus:border-blue-500"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
                    <select value={inviteRole} onChange={e=>setInviteRole(e.target.value)}
                      className="w-full input input-bordered text-white text-sm focus:outline-none focus:border-blue-500">
                      {['admin','project_manager','field_worker','client'].map(r=><option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-gray-800">
                  <button type="button" onClick={handleInviteUser} disabled={inviting || !inviteEmail}
                    className="flex-1 btn btn-primary rounded-lg py-2 text-sm font-semibold transition-colors disabled:opacity-50">
                      {inviting ? 'Sending…' : 'Send Invite'}
                  </button>
                  <button type="button" onClick={()=>setShowInviteModal(false)} className="flex-1 btn btn-ghost rounded-lg py-2 text-sm font-semibold transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BILLING ─────────────────────────────────────────────────────── */}
      {tab==='billing' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {(['Starter','Professional','Enterprise'] as const).map(plan=>(
              <div key={plan} className={`bg-gray-900 border rounded-2xl p-5 relative ${plan===currentPlan?'border-blue-600 ring-1 ring-blue-500/40':'border-gray-800'}`}>
                {plan===currentPlan && <span className="absolute -top-2.5 left-4 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">Current Plan</span>}
                <h3 className="text-lg font-bold text-white mb-1">{plan}</h3>
                <p className="text-2xl font-bold text-blue-400 mb-3">{plan==='Starter'?'£49':plan==='Professional'?'£149':'Custom'}<span className="text-xs text-gray-400 font-normal">/mo</span></p>
                <ul className="space-y-1.5 mb-4">
                  {PLAN_FEATURES[plan].map(f=>(
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0"/>{f}</li>
                  ))}
                </ul>
                {plan!==currentPlan && (
                  <button type="button" onClick={()=>toast.success(`Contact sales to switch to ${plan}`)}
                    className="w-full py-2 rounded-lg text-sm font-medium btn btn-ghost transition-colors">
                    {plan==='Enterprise'?'Contact Sales':'Upgrade'}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="card bg-base-100 border border-base-300 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Payment Method</h3>
              <button type="button" onClick={()=>toast.success('Update card details in your billing portal')} className="text-sm text-blue-400 hover:text-blue-300">Update</button>
            </div>
            <div className="flex items-center gap-4 bg-gray-800 rounded-xl p-4">
              <CreditCard className="w-8 h-8 text-blue-400"/>
              <div>
                <p className="text-white font-medium">Visa ending 4242</p>
                <p className="text-gray-400 text-xs">Expires 09/2027 · Next charge: £149 on 01 Apr 2026</p>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-300 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="text-base font-bold text-white">Billing History</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-800/60"><tr>{['Date','Description','Amount','Status',''].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-800">
                {billingHistory.map(b=>(
                  <tr key={b.id} className="hover:bg-gray-800/40">
                    <td className="px-4 py-3 text-gray-400 text-xs">{b.date}</td>
                    <td className="px-4 py-3 text-white">{b.desc}</td>
                    <td className="px-4 py-3 text-white font-bold">£{b.amount}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-green-900/30 text-green-300 font-medium">{b.status}</span></td>
                    <td className="px-4 py-3"><button type="button" onClick={()=>toast.success('Invoice downloaded')} className="text-xs text-blue-400 hover:text-blue-300">Download</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ───────────────────────────────────────────────── */}
      {tab==='notifications' && (
        <div className="space-y-4">
          <div className="card bg-base-100 border border-base-300 p-6">
            <h3 className="text-base font-bold text-white mb-5">Delivery Channels</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                {k:'email_digest',  label:'Email Digest',    desc:'Daily summary email at 7am'},
                {k:'sms_alerts',    label:'SMS Alerts',      desc:'Critical safety & overdue only'},
                {k:'push_browser',  label:'Browser Push',    desc:'Real-time in-browser notifications'},
              ].map(({k,label,desc})=>(
                <label key={k} className="flex items-center justify-between bg-gray-800 rounded-xl p-4 cursor-pointer">
                  <div>
                    <p className="text-white text-sm font-medium">{label}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                  </div>
                  <Toggle on={notifs[k as keyof typeof notifs]} onToggle={()=>toggleNotif(k as keyof typeof notifs)}/>
                </label>
              ))}
            </div>
          </div>
          {[
            { section:'Safety & Compliance', items:[
              {k:'safety_incidents',label:'New safety incidents'},
              {k:'cscs_expiry',label:'CSCS card expiry alerts (30 days)'},
              {k:'inspection_due',label:'Upcoming inspections (14 days)'},
              {k:'rams_approval',label:'RAMS awaiting approval'},
            ]},
            { section:'Project & Commercial', items:[
              {k:'rfis_raised',label:'RFIs raised or answered'},
              {k:'change_orders',label:'Change orders submitted / approved'},
              {k:'project_delays',label:'Project programme delays'},
              {k:'invoice_overdue',label:'Invoice overdue alerts'},
              {k:'cis_submissions',label:'CIS submission reminders'},
            ]},
            { section:'Operations', items:[
              {k:'daily_reports',label:'Daily reports submitted'},
              {k:'new_documents',label:'New documents uploaded'},
              {k:'team_updates',label:'Team member status changes'},
            ]},
          ].map(({section,items})=>(
            <div key={section} className="card bg-base-100 border border-base-300 p-6">
              <h3 className="text-base font-bold text-white mb-4">{section}</h3>
              <div className="space-y-3">
                {items.map(({k,label})=>(
                  <label key={k} className="flex items-center justify-between cursor-pointer py-1">
                    <span className="text-sm text-gray-300">{label}</span>
                    <Toggle on={notifs[k as keyof typeof notifs]} onToggle={()=>toggleNotif(k as keyof typeof notifs)}/>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button type="button" onClick={async () => { setSavingNotifs(true); try { await settingsApi.updateSetting('notifications', notifs); toast.success('Notification preferences saved'); } catch { toast.error('Failed to save'); } finally { setSavingNotifs(false); } }} disabled={savingNotifs}
            className="flex items-center gap-2 px-5 py-2.5 btn btn-primary rounded-lg text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {savingNotifs ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
            {savingNotifs ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      )}

      {/* ── INTEGRATIONS ────────────────────────────────────────────────── */}
      {tab==='integrations' && (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">Connect CortexBuild to your existing tools and services.</p>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(integrations).map(([k, int])=>(
              <div key={k} className="card bg-base-100 border border-base-300 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{int.name}</h3>
                      {int.connected && <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/30 text-green-300 font-medium">Connected</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{int.status}</p>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 ${int.connected?'bg-green-500':'bg-gray-600'}`}/>
                </div>
                <p className="text-gray-400 text-xs mb-4 leading-relaxed">{int.desc}</p>
                <button
                  onClick={()=>{
                    setIntegrations(prev=>({...prev,[k]:{...prev[k as keyof typeof integrations],connected:!int.connected,status:!int.connected?'Connected':'Not connected'}}));
                    toast.success(`${int.name} ${int.connected?'disconnected':'connected'}`);
                  }}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${int.connected?'bg-red-900/40 hover:bg-red-900/60 text-red-400 border border-red-800/50':'btn btn-primary'}`}>
                  {int.connected?'Disconnect':'Connect'}
                </button>
              </div>
            ))}
          </div>
          <div className="card bg-base-100 border border-base-300 p-5">
            <h3 className="text-base font-bold text-white mb-2">API Access</h3>
            <p className="text-gray-400 text-sm mb-4">Use the CortexBuild API to build custom integrations. Your API key is available on the Professional plan and above.</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 input input-bordered text-green-400 text-xs font-mono">
                cb_live_••••••••••••••••••••••••••••••••
              </code>
              <button type="button" onClick={()=>toast.success('API key copied to clipboard')} className="px-3 py-2 btn btn-ghost text-xs rounded-lg transition-colors">Copy</button>
              <button type="button" onClick={()=>toast.success('New API key generated')} className="px-3 py-2 btn btn-ghost text-xs rounded-lg transition-colors flex items-center gap-1"><RefreshCw className="w-3 h-3"/>Rotate</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SECURITY ────────────────────────────────────────────────────── */}
      {tab==='security' && (
        <div className="space-y-4">
          <div className="card bg-base-100 border border-base-300 p-6">
            <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2"><Lock className="w-4 h-4 text-blue-400"/>Change Password</h3>
            <div className="space-y-4 max-w-md">
              {['Current Password','New Password','Confirm New Password'].map(label=>(
                <div key={label}>
                  <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
                  <div className="relative">
                    <input type={showPass?'text':'password'} placeholder="••••••••••••"
                      className="w-full input input-bordered text-white text-sm focus:outline-none focus:border-blue-500 pr-10"/>
                    <button type="button" onClick={()=>setShowPass(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                      {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={()=>toast.success('Password updated successfully')}
                className="flex items-center gap-2 px-4 py-2 btn btn-primary rounded-lg text-white text-sm font-semibold transition-colors">
                <Save className="w-4 h-4"/>Update Password
              </button>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Two-Factor Authentication</h3>
                <p className="text-gray-400 text-sm mt-0.5">Add an extra layer of security to your account</p>
              </div>
              <Toggle on={twoFA} onToggle={()=>{setTwoFA(p=>!p); toast.success(twoFA?'2FA disabled':'2FA setup initiated — check your authenticator app');}}/>
            </div>
            {twoFA ? (
              <div className="flex items-center gap-3 bg-green-900/20 border border-green-700/40 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0"/>
                <p className="text-green-300 text-sm">Two-factor authentication is enabled. Your account is protected.</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-yellow-900/20 border border-yellow-700/40 rounded-xl px-4 py-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0"/>
                <p className="text-yellow-300 text-sm">2FA is disabled. We strongly recommend enabling it for account security.</p>
              </div>
            )}
          </div>

          <div className="card bg-base-100 border border-base-300 p-6">
            <h3 className="text-base font-bold text-white mb-4">Active Sessions</h3>
            <div className="space-y-3">
              {sessions.map(s=>(
                <div key={s.id} className="flex items-center justify-between bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.current?'bg-green-500':'bg-gray-500'}`}/>
                    <div>
                      <p className="text-white text-sm font-medium">{s.device}</p>
                      <p className="text-gray-400 text-xs">{s.location} · {s.last}</p>
                    </div>
                  </div>
                  {s.current ? (
                    <span className="text-xs text-green-400 font-medium">This session</span>
                  ) : (
                    <button type="button" onClick={()=>toast.success('Session terminated')} className="text-xs text-red-400 hover:text-red-300 transition-colors">Revoke</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-5">
            <h3 className="text-base font-bold text-red-400 mb-2">Danger Zone</h3>
            <p className="text-gray-400 text-sm mb-4">These actions are permanent and cannot be undone.</p>
            <div className="flex gap-3">
              <button type="button" onClick={()=>toast.error('Please contact support to delete your account')}
                className="px-4 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 text-red-400 rounded-lg text-sm font-medium transition-colors">
                Delete Account
              </button>
              <button type="button" onClick={()=>toast.error('Please contact support to export your data')}
                className="px-4 py-2 btn btn-ghost rounded-lg text-sm font-medium transition-colors">
                Export All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
export default React.memo(Settings);
