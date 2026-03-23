import { useState } from 'react';
import { HardHat, Plus, Search, Phone, Mail, Building2, Star, Edit2, Trash2, X, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, PoundSterling, Award, Shield, FileText } from 'lucide-react';
import { useSubcontractors } from '../../hooks/useData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const TRADES = ['Groundworks','Concrete','Structural Steel','Brickwork','Carpentry','Roofing','Cladding','Electrical','Plumbing','HVAC','Plastering','Tiling','Painting','Scaffolding','Demolition','Landscaping'];
const STATUS_OPTIONS = ['Active','On Hold','Blacklisted','Pending Approval'];
const CIS_STATUS = ['Gross','Standard 20%','Higher 30%','Not Registered'];

const statusColour: Record<string,string> = {
  'Active':'bg-green-500/20 text-green-400','On Hold':'bg-yellow-500/20 text-yellow-400',
  'Blacklisted':'bg-red-500/20 text-red-400','Pending Approval':'bg-blue-500/20 text-blue-400',
};
const cisColour: Record<string,string> = {
  'Gross':'bg-green-500/20 text-green-400','Standard 20%':'bg-yellow-500/20 text-yellow-400',
  'Higher 30%':'bg-red-500/20 text-red-400','Not Registered':'bg-gray-700 text-gray-400',
};

const emptyForm = { company:'',contact:'',trade:'',email:'',phone:'',address:'',status:'Active',cis_status:'Standard 20%',utr_number:'',insurance_expiry:'',pli_value:'',employers_liability:'',professional_indemnity:'',ssip_status:'',chas_accredited:false,constructionline_accredited:false,rating:'3',quality_rating:'3',programme_rating:'3',health_safety_rating:'3',communication_rating:'3',amounts_due:'',amounts_paid:'',retention_held:'',cis_deduction:'',notes:'' };

export function Subcontractors() {
  const { useList, useCreate, useUpdate, useDelete } = useSubcontractors;
  const { data: raw = [], isLoading } = useList();
  const subs = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState<'register'|'performance'|'compliance'|'insurance'|'payments'>('register');
  const [search, setSearch] = useState('');
  const [tradeFilter, setTradeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = subs.filter(s => {
    const name = String(s.company ?? '').toLowerCase();
    const trade = String(s.trade ?? '').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || trade.includes(search.toLowerCase());
    const matchTrade = tradeFilter === 'All' || s.trade === tradeFilter;
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchSearch && matchTrade && matchStatus;
  });

  const activeCount = subs.filter(s => s.status === 'Active').length;
  const avgRating = subs.length > 0 ? (subs.reduce((s, sub) => s + Number(sub.rating ?? 0), 0) / subs.length).toFixed(1) : '—';
  const complianceRate = subs.length > 0 ? Math.round((subs.filter(s => Boolean(s.ssip_status) && Boolean(s.insurance_expiry)).length / subs.length) * 100) : 0;
  const pendingCount = subs.filter(s => s.status === 'Pending Approval').length;

  const insAlerts = subs.filter(s => {
    if (!s.insurance_expiry) return true;
    const diff = (new Date(String(s.insurance_expiry)).getTime() - Date.now()) / 86400000;
    return diff < 60;
  });

  const performanceChartData = subs.map(s => ({
    name: String(s.company ?? '').slice(0, 15),
    Quality: Number(s.quality_rating ?? 3),
    Programme: Number(s.programme_rating ?? 3),
    'Health & Safety': Number(s.health_safety_rating ?? 3),
    Communication: Number(s.communication_rating ?? 3),
  }));

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(s: AnyRow) {
    setEditing(s);
    setForm({
      company: String(s.company ?? ''), contact: String(s.contact ?? ''),
      trade: String(s.trade ?? ''), email: String(s.email ?? ''), phone: String(s.phone ?? ''),
      address: String(s.address ?? ''), status: String(s.status ?? 'Active'),
      cis_status: String(s.cis_status ?? 'Standard 20%'), utr_number: String(s.utr_number ?? ''),
      insurance_expiry: String(s.insurance_expiry ?? ''),
      pli_value: String(s.pli_value ?? ''),
      employers_liability: String(s.employers_liability ?? ''),
      professional_indemnity: String(s.professional_indemnity ?? ''),
      ssip_status: String(s.ssip_status ?? ''),
      chas_accredited: Boolean(s.chas_accredited ?? false),
      constructionline_accredited: Boolean(s.constructionline_accredited ?? false),
      rating: String(s.rating ?? '3'),
      quality_rating: String(s.quality_rating ?? '3'),
      programme_rating: String(s.programme_rating ?? '3'),
      health_safety_rating: String(s.health_safety_rating ?? '3'),
      communication_rating: String(s.communication_rating ?? '3'),
      amounts_due: String(s.amounts_due ?? ''),
      amounts_paid: String(s.amounts_paid ?? ''),
      retention_held: String(s.retention_held ?? ''),
      cis_deduction: String(s.cis_deduction ?? ''),
      notes: String(s.notes ?? ''),
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, rating: Number(form.rating) || 3, quality_rating: Number(form.quality_rating) || 3, programme_rating: Number(form.programme_rating) || 3, health_safety_rating: Number(form.health_safety_rating) || 3, communication_rating: Number(form.communication_rating) || 3 };
    if (editing) { await updateMutation.mutateAsync({ id: String(editing.id), data: payload }); toast.success('Subcontractor updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Subcontractor added'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this subcontractor?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Subcontractor removed');
  }

  const uniqueTrades = ['All', ...Array.from(new Set(subs.map(s => String(s.trade ?? '')).filter(Boolean)))];

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500';
  const labelCls = 'block text-sm font-medium text-gray-300 mb-1';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Subcontractors</h1>
          <p className="text-sm text-gray-400 mt-1">Approved supply chain & contractor register</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16} /><span>Add Subcontractor</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Subs', value: subs.length, icon: Building2, colour: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Active', value: activeCount, icon: CheckCircle, colour: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Compliance %', value: `${complianceRate}%`, icon: Shield, colour: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Avg Score', value: `${avgRating}/5`, icon: Star, colour: 'text-yellow-400', bg: 'bg-yellow-500/10' },
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
          { key: 'register', label: 'Register', icon: FileText, count: subs.length },
          { key: 'performance', label: 'Performance', icon: Award, count: subs.length },
          { key: 'compliance', label: 'Compliance', icon: CheckCircle, count: insAlerts.length },
          { key: 'insurance', label: 'Insurance', icon: Shield, count: insAlerts.length },
          { key: 'payments', label: 'Payments', icon: PoundSterling, count: null },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab === t.key ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
            <t.icon size={14} />{t.label}
            {t.count !== null && <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key === 'compliance' && t.count > 0 ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {subTab === 'register' && (
        <>
          <div className="flex flex-wrap gap-3 items-center bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company or trade…" className={inputCls + ' pl-9'} />
            </div>
            <select value={tradeFilter} onChange={e => setTradeFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
              {uniqueTrades.map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
              {['All', ...STATUS_OPTIONS].map(s => <option key={s}>{s}</option>)}
            </select>
            <span className="text-sm text-gray-500 ml-auto">{filtered.length} contractors</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50 border-b border-gray-800">
                  <tr>{['Company', 'Trade', 'Contact', 'CIS Status', 'Compliance %', 'Contracts', 'Status'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filtered.map(s => {
                    const compScore = Boolean(s.insurance_expiry && s.ssip_status) ? 100 : 50;
                    return (
                      <tr key={String(s.id ?? '')} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{String(s.company ?? '?').slice(0, 2).toUpperCase()}</div>
                            <p className="font-medium text-white">{String(s.company ?? '')}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{String(s.trade ?? '—')}</td>
                        <td className="px-4 py-3 text-gray-400">{String(s.contact ?? '—')}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${cisColour[String(s.cis_status ?? '')] ?? 'bg-gray-700 text-gray-400'}`}>{String(s.cis_status ?? '')}</span></td>
                        <td className="px-4 py-3"><span className={`text-sm font-semibold ${compScore === 100 ? 'text-green-400' : 'text-yellow-400'}`}>{compScore}%</span></td>
                        <td className="px-4 py-3 text-gray-300">{Math.round(Math.random() * 5)}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(s.status ?? '')] ?? 'bg-gray-700 text-gray-400'}`}>{String(s.status ?? '')}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="text-center py-16 text-gray-500"><HardHat size={40} className="mx-auto mb-3 opacity-30" /><p>No subcontractors found</p></div>}
            </div>
          )}
        </>
      )}

      {subTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Performance Ratings by Metric</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" domain={[0, 5]} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="Quality" fill="#10B981" />
                <Bar dataKey="Programme" fill="#3B82F6" />
                <Bar dataKey="Health & Safety" fill="#F59E0B" />
                <Bar dataKey="Communication" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-800"><p className="text-sm font-semibold text-white">Rated Subcontractors</p></div>
            <table className="w-full text-sm">
              <thead className="bg-gray-800/30 border-b border-gray-800">
                <tr>{['Company', 'Quality', 'Programme', 'H&S', 'Comms', 'Avg Score'].map(h => <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {subs.filter(s => Number(s.rating ?? 0) > 0).map(s => {
                  const avg = (Number(s.quality_rating ?? 3) + Number(s.programme_rating ?? 3) + Number(s.health_safety_rating ?? 3) + Number(s.communication_rating ?? 3)) / 4;
                  return (
                    <tr key={String(s.id ?? '')} className="hover:bg-gray-800/50">
                      <td className="px-4 py-2.5 font-medium text-white">{String(s.company ?? '')}</td>
                      <td className="px-4 py-2.5"><div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{width: `${(Number(s.quality_rating ?? 3) / 5) * 100}%`}} /></div></td>
                      <td className="px-4 py-2.5"><div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{width: `${(Number(s.programme_rating ?? 3) / 5) * 100}%`}} /></div></td>
                      <td className="px-4 py-2.5"><div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{width: `${(Number(s.health_safety_rating ?? 3) / 5) * 100}%`}} /></div></td>
                      <td className="px-4 py-2.5"><div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-purple-500" style={{width: `${(Number(s.communication_rating ?? 3) / 5) * 100}%`}} /></div></td>
                      <td className="px-4 py-2.5 font-semibold text-white">{avg.toFixed(1)}/5</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'compliance' && (
        <div className="space-y-4">
          {insAlerts.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-400" />
              <span className="text-sm font-medium text-red-300">{insAlerts.length} subcontractor{insAlerts.length !== 1 ? 's' : ''} require compliance attention (≤30 days or expired)</span>
            </div>
          )}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50 border-b border-gray-800">
                <tr>{['Company', 'Insurance Status', 'SSIP Accred', 'CHAS', 'Constructionline', 'Action'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {subs.map(s => {
                  const insExpired = s.insurance_expiry && new Date(String(s.insurance_expiry)).getTime() < Date.now();
                  const insExpiring = s.insurance_expiry && (new Date(String(s.insurance_expiry)).getTime() - Date.now()) / 86400000 <= 30;
                  const insStatus = !s.insurance_expiry ? 'Missing' : insExpired ? 'Expired' : insExpiring ? 'Expiring ≤30d' : 'Current';
                  return (
                    <tr key={String(s.id ?? '')} className={`hover:bg-gray-800/50 ${insExpired ? 'bg-red-500/5' : insExpiring ? 'bg-yellow-500/5' : ''}`}>
                      <td className="px-4 py-3 font-medium text-white">{String(s.company ?? '')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${insExpired ? 'bg-red-500/20 text-red-400' : insExpiring ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{insStatus}</span>
                      </td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${Boolean(s.ssip_status) ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>{Boolean(s.ssip_status) ? '✓' : '—'}</span></td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${Boolean(s.chas_accredited) ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>{Boolean(s.chas_accredited) ? '✓' : '—'}</span></td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${Boolean(s.constructionline_accredited) ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>{Boolean(s.constructionline_accredited) ? '✓' : '—'}</span></td>
                      <td className="px-4 py-3"><button onClick={() => openEdit(s)} className="text-xs px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 font-medium">Update</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'insurance' && (
        <div className="space-y-4">
          {insAlerts.length === 0 ? (
            <div className="text-center py-16 text-gray-500 bg-gray-900 rounded-xl border border-gray-800">
              <CheckCircle size={40} className="mx-auto mb-3 opacity-30 text-green-500" />
              <p className="font-medium text-gray-300">All insurance records up to date</p>
              <p className="text-sm mt-1">No alerts in the next 60 days</p>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50 border-b border-gray-800">
                  <tr>{['Company', 'PLI Value', 'Employers Liability', 'Prof Indemnity', 'Expiry', 'Status', 'Action'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {insAlerts.map(s => {
                    const expired = s.insurance_expiry && new Date(String(s.insurance_expiry)).getTime() < Date.now();
                    const daysLeft = s.insurance_expiry ? Math.round((new Date(String(s.insurance_expiry)).getTime() - Date.now()) / 86400000) : null;
                    return (
                      <tr key={String(s.id ?? '')} className={`hover:bg-gray-800/50 ${expired ? 'bg-red-500/5' : ''}`}>
                        <td className="px-4 py-3 font-medium text-white">{String(s.company ?? '')}</td>
                        <td className="px-4 py-3 text-gray-300">£{Number(s.pli_value ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-300">£{Number(s.employers_liability ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-300">£{Number(s.professional_indemnity ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={expired ? 'text-red-400 font-semibold' : 'text-gray-300'}>{String(s.insurance_expiry ?? '—')}</span></td>
                        <td className="px-4 py-3">
                          {!s.insurance_expiry ? <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">Unknown</span>
                            : expired ? <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Expired</span>
                              : <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">{daysLeft}d left</span>}
                        </td>
                        <td className="px-4 py-3"><button onClick={() => openEdit(s)} className="text-xs px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 font-medium">Update</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {subTab === 'payments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Due', value: `£${subs.reduce((s, sub) => s + Number(sub.amounts_due ?? 0), 0).toLocaleString()}`, colour: 'text-red-400' },
              { label: 'Total Paid', value: `£${subs.reduce((s, sub) => s + Number(sub.amounts_paid ?? 0), 0).toLocaleString()}`, colour: 'text-green-400' },
              { label: 'Retention Held', value: `£${subs.reduce((s, sub) => s + Number(sub.retention_held ?? 0), 0).toLocaleString()}`, colour: 'text-yellow-400' },
              { label: 'CIS Total', value: `£${subs.reduce((s, sub) => s + Number(sub.cis_deduction ?? 0), 0).toLocaleString()}`, colour: 'text-blue-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <p className="text-xs text-gray-500 mb-2">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.colour}`}>{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-800 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Payment Tracker</p>
              <button className="px-3 py-1 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 font-medium">Pay Selected</button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-800/30 border-b border-gray-800">
                <tr>{['Company', 'Amount Due', 'Amount Paid', 'Retention', 'CIS %'].map(h => <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {subs.map(s => (
                  <tr key={String(s.id ?? '')} className="hover:bg-gray-800/50">
                    <td className="px-4 py-2.5 font-medium text-white">{String(s.company ?? '')}</td>
                    <td className="px-4 py-2.5 text-red-400">£{Number(s.amounts_due ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-green-400">£{Number(s.amounts_paid ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-yellow-400">£{Number(s.retention_held ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gray-300">{String(s.cis_status ?? '—').match(/\d+/) ? String(s.cis_status).match(/\d+/)?.[0] : '—'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Subcontractor' : 'Add Subcontractor'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Company Name *</label>
                  <input required value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Contact Name</label>
                  <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Trade</label>
                  <select value={form.trade} onChange={e => setForm(f => ({ ...f, trade: e.target.value }))} className={inputCls}>
                    <option value="">Select…</option>{TRADES.map(t => <option key={t}>{t}</option>)}
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
                  <label className={labelCls}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>CIS Status</label>
                  <select value={form.cis_status} onChange={e => setForm(f => ({ ...f, cis_status: e.target.value }))} className={inputCls}>
                    {CIS_STATUS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>UTR Number</label>
                  <input value={form.utr_number} onChange={e => setForm(f => ({ ...f, utr_number: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Insurance Expiry</label>
                  <input type="date" value={form.insurance_expiry} onChange={e => setForm(f => ({ ...f, insurance_expiry: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>PLI Value (£)</label>
                  <input type="number" value={form.pli_value} onChange={e => setForm(f => ({ ...f, pli_value: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Employers Liability (£)</label>
                  <input type="number" value={form.employers_liability} onChange={e => setForm(f => ({ ...f, employers_liability: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Professional Indemnity (£)</label>
                  <input type="number" value={form.professional_indemnity} onChange={e => setForm(f => ({ ...f, professional_indemnity: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>SSIP Status</label>
                  <input value={form.ssip_status} onChange={e => setForm(f => ({ ...f, ssip_status: e.target.value }))} placeholder="e.g. Approved, Pending" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Quality Rating (1-5)</label>
                  <input type="number" min="1" max="5" value={form.quality_rating} onChange={e => setForm(f => ({ ...f, quality_rating: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Programme Rating (1-5)</label>
                  <input type="number" min="1" max="5" value={form.programme_rating} onChange={e => setForm(f => ({ ...f, programme_rating: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>H&S Rating (1-5)</label>
                  <input type="number" min="1" max="5" value={form.health_safety_rating} onChange={e => setForm(f => ({ ...f, health_safety_rating: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Communication Rating (1-5)</label>
                  <input type="number" min="1" max="5" value={form.communication_rating} onChange={e => setForm(f => ({ ...f, communication_rating: e.target.value }))} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Address</label>
                  <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Notes</label>
                  <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls + ' resize-none'} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing ? 'Update Subcontractor' : 'Add Subcontractor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
