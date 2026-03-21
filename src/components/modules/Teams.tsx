import { useState } from 'react';
import { Users, Plus, Search, Phone, Mail, Briefcase, Edit2, Trash2, X, ChevronDown, ChevronUp, Shield, Clock, Award, AlertTriangle, PoundSterling, MapPin, CheckSquare } from 'lucide-react';
import { useTeam } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const ROLES = ['Site Manager','Project Manager','Foreman','Carpenter','Bricklayer','Electrician','Plumber','Steel Fixer','Labourer','Health & Safety Officer','QS','Engineer'];
const TRADE_TYPES = ['Management','Structural','Electrical','Mechanical','Civil','Finishing','Safety'];
const STATUS_OPTIONS = ['Active','On Leave','Signed Off','Inactive'];
const CIS_STATUS_OPTIONS = ['Gross','Standard 20%','Higher 30%','Not Registered'];

const statusColour: Record<string,string> = {
  'Active':'bg-green-500/20 text-green-400','On Leave':'bg-yellow-500/20 text-yellow-400',
  'Signed Off':'bg-blue-500/20 text-blue-400','Inactive':'bg-gray-700 text-gray-400',
};
const cisColour: Record<string,string> = {
  'Gross':'bg-green-500/20 text-green-400','Standard 20%':'bg-yellow-500/20 text-yellow-400',
  'Higher 30%':'bg-red-500/20 text-red-400','Not Registered':'bg-gray-700 text-gray-400',
};

const emptyForm = { name:'',role:'',tradeType:'',email:'',phone:'',dailyRate:'',cscsCard:'',cscsExpiry:'',status:'Active',cisStatus:'Standard 20%',utrNumber:'',niNumber:'',ramsCompleted:false,notes:'' };

export function Teams() {
  const { useList, useCreate, useUpdate, useDelete } = useTeam;
  const { data: raw = [], isLoading } = useList();
  const members = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState<'members'|'onsite'|'cscs'|'labour'>('members');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = members.filter(m => {
    const name = String(m.name ?? m.workerName ?? '').toLowerCase();
    const role = String(m.role ?? '').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || role.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = members.filter(m => m.status === 'Active').length;
  const onLeaveCount = members.filter(m => m.status === 'On Leave').length;
  const totalDailyCost = members.filter(m => m.status === 'Active').reduce((s, m) => s + Number(m.dailyRate ?? m.daily_rate ?? 0), 0);
  const cscsExpiring = members.filter(m => {
    const expiry = m.cscsExpiry ?? m.cscs_expiry;
    if (!expiry) return false;
    const diff = (new Date(String(expiry)).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 30;
  }).length;

  const onSiteMembers = members.filter(m => m.status === 'Active');
  const cscsAlerts = members.filter(m => {
    const expiry = m.cscsExpiry ?? m.cscs_expiry;
    const card = m.cscsCard ?? m.cscs_card;
    if (!card) return true;
    if (!expiry) return true;
    const diff = (new Date(String(expiry)).getTime() - Date.now()) / 86400000;
    return diff < 60;
  });
  const labourByTrade = TRADE_TYPES.map(trade => {
    const group = members.filter(m => (m.tradeType ?? m.trade_type) === trade && m.status === 'Active');
    const daily = group.reduce((s, m) => s + Number(m.dailyRate ?? m.daily_rate ?? 0), 0);
    return { trade, count: group.length, daily, weekly: daily * 5, monthly: daily * 21 };
  }).filter(g => g.count > 0);

  function getName(m: AnyRow) { return String(m.name ?? m.workerName ?? ''); }

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(m: AnyRow) {
    setEditing(m);
    setForm({
      name: getName(m),
      role: String(m.role ?? ''),
      tradeType: String(m.tradeType ?? m.trade_type ?? ''),
      email: String(m.email ?? ''),
      phone: String(m.phone ?? ''),
      dailyRate: String(m.dailyRate ?? m.daily_rate ?? ''),
      cscsCard: String(m.cscsCard ?? m.cscs_card ?? ''),
      cscsExpiry: String(m.cscsExpiry ?? m.cscs_expiry ?? ''),
      status: String(m.status ?? 'Active'),
      cisStatus: String(m.cisStatus ?? m.cis_status ?? 'Standard 20%'),
      utrNumber: String(m.utrNumber ?? m.utr_number ?? ''),
      niNumber: String(m.niNumber ?? m.ni_number ?? ''),
      ramsCompleted: Boolean(m.ramsCompleted ?? m.rams_completed ?? false),
      notes: String(m.notes ?? ''),
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      role: form.role,
      trade_type: form.tradeType,
      email: form.email,
      phone: form.phone,
      daily_rate: Number(form.dailyRate) || 0,
      cscs_card: form.cscsCard,
      cscs_expiry: form.cscsExpiry,
      status: form.status,
      cis_status: form.cisStatus,
      utr_number: form.utrNumber,
      ni_number: form.niNumber,
      rams_completed: form.ramsCompleted,
      notes: form.notes,
    };
    if (editing) { await updateMutation.mutateAsync({ id: String(editing.id), data: payload }); toast.success('Member updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Member added'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this team member?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Member removed');
  }

  async function toggleRAMS(m: AnyRow) {
    const current = Boolean(m.ramsCompleted ?? m.rams_completed ?? false);
    await updateMutation.mutateAsync({ id: String(m.id), data: { rams_completed: !current } });
    toast.success(!current ? 'RAMS marked complete' : 'RAMS marked incomplete');
  }

  function MemberRow({ m }: { m: AnyRow }) {
    const id = String(m.id ?? '');
    const isExp = expanded === id;
    const expiry = m.cscsExpiry ?? m.cscs_expiry;
    const card = m.cscsCard ?? m.cscs_card;
    const expiring = (() => {
      if (!expiry) return false;
      const d = (new Date(String(expiry)).getTime() - Date.now()) / 86400000;
      return d < 60;
    })();
    const expired = (() => {
      if (!expiry) return false;
      return new Date(String(expiry)).getTime() < Date.now();
    })();
    const cisStatus = String(m.cisStatus ?? m.cis_status ?? '');
    const ramsOk = Boolean(m.ramsCompleted ?? m.rams_completed ?? false);
    return (
      <div>
        <div className="flex items-center gap-4 p-4 hover:bg-gray-800/50 cursor-pointer" onClick={() => setExpanded(isExp ? null : id)}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {getName(m).split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-white truncate">{getName(m) || 'Unknown'}</p>
              {expired && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">CSCS Expired</span>}
              {!expired && expiring && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">CSCS Expiring</span>}
              {!card && <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">No CSCS</span>}
              {ramsOk && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">RAMS ✓</span>}
            </div>
            <p className="text-sm text-gray-400">{String(m.role ?? '')} {(m.tradeType ?? m.trade_type) ? `· ${m.tradeType ?? m.trade_type}` : ''}</p>
          </div>
          <div className="hidden md:flex items-center gap-2 flex-wrap">
            {!!(m.dailyRate ?? m.daily_rate) && <span className="text-sm font-medium text-gray-300">£{Number(m.dailyRate ?? m.daily_rate).toLocaleString()}/day</span>}
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(m.status ?? '')] ?? 'bg-gray-700 text-gray-400'}`}>{String(m.status ?? '')}</span>
            {cisStatus && <span className={`text-xs px-2 py-1 rounded-full font-medium ${cisColour[cisStatus] ?? 'bg-gray-700 text-gray-400'}`}>{cisStatus}</span>}
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button onClick={e => { e.stopPropagation(); toggleRAMS(m); }} className={`p-1.5 rounded ${ramsOk ? 'text-green-400 hover:bg-green-500/20' : 'text-gray-500 hover:bg-gray-700'}`} title="Toggle RAMS"><CheckSquare size={14} /></button>
            <button onClick={e => { e.stopPropagation(); openEdit(m); }} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/20 rounded"><Edit2 size={14} /></button>
            <button onClick={e => { e.stopPropagation(); handleDelete(id); }} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/20 rounded"><Trash2 size={14} /></button>
            {isExp ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
          </div>
        </div>
        {isExp && (
          <div className="px-6 pb-4 bg-gray-900/50 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-gray-800">
            {!!m.email && <div className="pt-4"><p className="text-xs text-gray-500 mb-1">Email</p><a href={`mailto:${m.email}`} className="flex items-center gap-1 text-blue-400 hover:underline"><Mail size={12} />{String(m.email)}</a></div>}
            {!!m.phone && <div className="pt-4"><p className="text-xs text-gray-500 mb-1">Phone</p><a href={`tel:${m.phone}`} className="flex items-center gap-1 text-blue-400 hover:underline"><Phone size={12} />{String(m.phone)}</a></div>}
            {!!card && <div className="pt-4"><p className="text-xs text-gray-500 mb-1">CSCS Card</p><p className="flex items-center gap-1 text-gray-300"><Award size={12} className="text-yellow-500" />{String(card)}</p></div>}
            {!!expiry && <div className="pt-4"><p className="text-xs text-gray-500 mb-1">CSCS Expiry</p><p className={expiring ? 'text-red-400 font-medium' : 'text-gray-300'}>{String(expiry)}</p></div>}
            {!!(m.utrNumber ?? m.utr_number) && <div className="pt-4"><p className="text-xs text-gray-500 mb-1">UTR Number</p><p className="font-mono text-gray-300">{String(m.utrNumber ?? m.utr_number)}</p></div>}
            {!!(m.niNumber ?? m.ni_number) && <div className="pt-4"><p className="text-xs text-gray-500 mb-1">NI Number</p><p className="font-mono text-gray-300">{String(m.niNumber ?? m.ni_number)}</p></div>}
            {!!m.notes && <div className="col-span-2 md:col-span-4 pt-4"><p className="text-xs text-gray-500 mb-1">Notes</p><p className="text-gray-400">{String(m.notes)}</p></div>}
          </div>
        )}
      </div>
    );
  }

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent';
  const labelCls = 'block text-sm font-medium text-gray-300 mb-1';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Management</h1>
          <p className="text-sm text-gray-400 mt-1">Site workforce & personnel records</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16} /><span>Add Member</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Workers', value: activeCount, icon: Users, colour: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'On Leave', value: onLeaveCount, icon: Clock, colour: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Daily Labour Cost', value: `£${totalDailyCost.toLocaleString()}`, icon: Briefcase, colour: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'CSCS Alerts (60d)', value: cscsExpiring, icon: Shield, colour: cscsExpiring > 0 ? 'text-red-400' : 'text-gray-400', bg: cscsExpiring > 0 ? 'bg-red-500/10' : 'bg-gray-800' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour} /></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-white">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-gray-800">
        {([
          { key: 'members', label: 'All Members', icon: Users, count: members.length },
          { key: 'onsite', label: 'On Site Today', icon: MapPin, count: onSiteMembers.length },
          { key: 'cscs', label: 'CSCS Alerts', icon: AlertTriangle, count: cscsAlerts.length },
          { key: 'labour', label: 'Labour Cost', icon: PoundSterling, count: null },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab === t.key ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
            <t.icon size={14} />{t.label}
            {t.count !== null && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key === 'cscs' && t.count > 0 ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400'}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {subTab === 'members' && (
        <>
          <div className="flex flex-wrap gap-3 items-center bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or role…" className={inputCls + ' pl-9'} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
              {['All', ...STATUS_OPTIONS].map(s => <option key={s}>{s}</option>)}
            </select>
            <span className="text-sm text-gray-500 ml-auto">{filtered.length} members</span>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
              {filtered.length === 0 && (
                <div className="text-center py-16 text-gray-500"><Users size={40} className="mx-auto mb-3 opacity-30" /><p>No team members found</p></div>
              )}
              {filtered.map(m => <MemberRow key={String(m.id ?? '')} m={m} />)}
            </div>
          )}
        </>
      )}

      {subTab === 'onsite' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <MapPin size={20} className="text-green-400" />
            <div>
              <p className="font-semibold text-green-300">{onSiteMembers.length} workers currently on site</p>
              <p className="text-sm text-green-500">All members with Active status</p>
            </div>
          </div>
          {onSiteMembers.length === 0 ? (
            <div className="text-center py-16 text-gray-500 bg-gray-900 rounded-xl border border-gray-800">
              <MapPin size={40} className="mx-auto mb-3 opacity-30" /><p>No active workers on site</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {onSiteMembers.map(m => (
                <div key={String(m.id ?? '')} className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {getName(m).split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{getName(m) || 'Unknown'}</p>
                    <p className="text-sm text-gray-400 truncate">{String(m.role ?? '')} {(m.tradeType ?? m.trade_type) ? `· ${m.tradeType ?? m.trade_type}` : ''}</p>
                    {!!(m.dailyRate ?? m.daily_rate) && <p className="text-xs text-blue-400 font-medium mt-0.5">£{Number(m.dailyRate ?? m.daily_rate).toLocaleString()}/day</p>}
                  </div>
                  <button onClick={() => openEdit(m)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/20 rounded flex-shrink-0"><Edit2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'cscs' && (
        <div className="space-y-4">
          {cscsAlerts.length === 0 ? (
            <div className="text-center py-16 text-gray-500 bg-gray-900 rounded-xl border border-gray-800">
              <Shield size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-300">All CSCS cards up to date</p>
              <p className="text-sm mt-1">No alerts in the next 60 days</p>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/30 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-400" />
                <span className="text-sm font-medium text-red-300">{cscsAlerts.length} member{cscsAlerts.length !== 1 ? 's' : ''} require CSCS attention</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50 border-b border-gray-800">
                  <tr>{['Member', 'Role', 'CSCS Card', 'Expiry Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {cscsAlerts.map(m => {
                    const expiry = m.cscsExpiry ?? m.cscs_expiry;
                    const card = m.cscsCard ?? m.cscs_card;
                    const hasExpiry = !!expiry;
                    const expired = hasExpiry && new Date(String(expiry)).getTime() < Date.now();
                    const daysLeft = hasExpiry ? Math.round((new Date(String(expiry)).getTime() - Date.now()) / 86400000) : null;
                    return (
                      <tr key={String(m.id ?? '')} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {getName(m).split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                            </div>
                            <span className="font-medium text-white">{getName(m) || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{String(m.role ?? '—')}</td>
                        <td className="px-4 py-3">
                          {card ? (
                            <span className="flex items-center gap-1 text-gray-300"><Award size={12} className="text-yellow-500" />{String(card)}</span>
                          ) : (
                            <span className="text-red-400 font-medium">No card registered</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {hasExpiry ? <span className={expired ? 'text-red-400 font-semibold' : 'text-amber-400 font-medium'}>{String(expiry)}</span> : <span className="text-gray-500">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {!card ? (
                            <span className="text-xs px-2 py-1 bg-gray-700 text-gray-400 rounded-full">No Card</span>
                          ) : expired ? (
                            <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full">Expired</span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">{daysLeft}d left</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => openEdit(m)} className="text-xs px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 font-medium">Update</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {subTab === 'labour' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Daily Labour', value: `£${totalDailyCost.toLocaleString()}`, sub: `${activeCount} active workers` },
              { label: 'Weekly Projection', value: `£${(totalDailyCost * 5).toLocaleString()}`, sub: '5 working days' },
              { label: 'Monthly Projection', value: `£${(totalDailyCost * 21).toLocaleString()}`, sub: '21 working days' },
            ].map(c => (
              <div key={c.label} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <p className="text-sm text-gray-500 mb-1">{c.label}</p>
                <p className="text-2xl font-bold text-white">{c.value}</p>
                <p className="text-xs text-gray-600 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="font-semibold text-white">Labour Cost by Trade</h3>
              <p className="text-xs text-gray-500 mt-0.5">Active workers only</p>
            </div>
            {labourByTrade.length === 0 ? (
              <div className="text-center py-12 text-gray-500"><PoundSterling size={32} className="mx-auto mb-2 opacity-30" /><p>No active workers with trade types assigned</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50 border-b border-gray-800">
                  <tr>{['Trade', 'Headcount', 'Daily', 'Weekly', 'Monthly', '% of Total'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {labourByTrade.map(row => {
                    const pct = totalDailyCost > 0 ? Math.round((row.daily / totalDailyCost) * 100) : 0;
                    return (
                      <tr key={row.trade} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium text-white">{row.trade}</td>
                        <td className="px-4 py-3 text-gray-300">{row.count}</td>
                        <td className="px-4 py-3 text-gray-300">£{row.daily.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-300">£{row.weekly.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-300">£{row.monthly.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-700 rounded-full h-2 max-w-24">
                              <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Team Member' : 'Add Team Member'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Full Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={inputCls}>
                    <option value="">Select…</option>{ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Trade Type</label>
                  <select value={form.tradeType} onChange={e => setForm(f => ({ ...f, tradeType: e.target.value }))} className={inputCls}>
                    <option value="">Select…</option>{TRADE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Daily Rate (£)</label>
                  <input type="number" value={form.dailyRate} onChange={e => setForm(f => ({ ...f, dailyRate: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>CIS Status</label>
                  <select value={form.cisStatus} onChange={e => setForm(f => ({ ...f, cisStatus: e.target.value }))} className={inputCls}>
                    {CIS_STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>UTR Number</label>
                  <input value={form.utrNumber} onChange={e => setForm(f => ({ ...f, utrNumber: e.target.value }))} className={inputCls} placeholder="10-digit UTR" />
                </div>
                <div>
                  <label className={labelCls}>NI Number</label>
                  <input value={form.niNumber} onChange={e => setForm(f => ({ ...f, niNumber: e.target.value }))} className={inputCls} placeholder="e.g. AB123456C" />
                </div>
                <div>
                  <label className={labelCls}>CSCS Card No.</label>
                  <input value={form.cscsCard} onChange={e => setForm(f => ({ ...f, cscsCard: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>CSCS Expiry</label>
                  <input type="date" value={form.cscsExpiry} onChange={e => setForm(f => ({ ...f, cscsExpiry: e.target.value }))} className={inputCls} />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <input type="checkbox" id="ramsCompleted" checked={form.ramsCompleted} onChange={e => setForm(f => ({ ...f, ramsCompleted: e.target.checked }))} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500" />
                  <label htmlFor="ramsCompleted" className="text-sm text-gray-300 cursor-pointer">RAMS completed & signed</label>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Notes</label>
                  <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls + ' resize-none'} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
