import { useState } from 'react';
import { HardHat, Plus, Search, Phone, Mail, Building2, Star, Edit2, Trash2, X, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, PoundSterling } from 'lucide-react';
import { useSubcontractors } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const TRADES = ['Groundworks','Concrete','Structural Steel','Brickwork','Carpentry','Roofing','Cladding','Electrical','Plumbing','HVAC','Plastering','Tiling','Painting','Scaffolding','Demolition','Landscaping'];
const STATUS_OPTIONS = ['Active','On Hold','Blacklisted','Pending Approval'];
const CIS_STATUS = ['Gross','Standard 20%','Higher 30%','Not Registered'];

const statusColour: Record<string,string> = {
  'Active':'bg-green-100 text-green-800','On Hold':'bg-yellow-100 text-yellow-800',
  'Blacklisted':'bg-red-100 text-red-700','Pending Approval':'bg-blue-100 text-blue-800',
};

const emptyForm = { company_name:'',contact_name:'',trade:'',email:'',phone:'',address:'',status:'Active',cis_status:'Standard 20%',utr_number:'',insurance_expiry:'',rating:'3',notes:'' };

export function Subcontractors() {
  const { useList, useCreate, useUpdate, useDelete } = useSubcontractors;
  const { data: raw = [], isLoading } = useList();
  const subs = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState<'directory'|'insurance'|'cis'>('directory');
  const [search, setSearch] = useState('');
  const [tradeFilter, setTradeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = subs.filter(s => {
    const name = String(s.company_name??'').toLowerCase();
    const trade = String(s.trade??'').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || trade.includes(search.toLowerCase());
    const matchTrade = tradeFilter === 'All' || s.trade === tradeFilter;
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchSearch && matchTrade && matchStatus;
  });

  const activeCount = subs.filter(s=>s.status==='Active').length;
  const insExpiring = subs.filter(s => {
    if (!s.insurance_expiry) return false;
    const diff = (new Date(String(s.insurance_expiry)).getTime()-Date.now())/86400000;
    return diff >= 0 && diff <= 30;
  }).length;
  const avgRating = subs.length > 0 ? (subs.reduce((s,sub)=>s+Number(sub.rating??0),0)/subs.length).toFixed(1) : '—';
  const pendingCount = subs.filter(s=>s.status==='Pending Approval').length;

  // Insurance alerts: expired or expiring within 60 days, or missing
  const insAlerts = subs.filter(s => {
    if (!s.insurance_expiry) return true; // no record = alert
    const diff = (new Date(String(s.insurance_expiry)).getTime()-Date.now())/86400000;
    return diff < 60;
  });

  // CIS grouping
  const cisGroups = CIS_STATUS.map(status => ({
    status,
    subs: subs.filter(s=>s.cis_status===status),
    count: subs.filter(s=>s.cis_status===status).length,
    totalUTR: subs.filter(s=>s.cis_status===status && !!s.utr_number).length,
  })).filter(g=>g.count>0);

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(s: AnyRow) {
    setEditing(s);
    setForm({ company_name:String(s.company_name??''),contact_name:String(s.contact_name??''),trade:String(s.trade??''),email:String(s.email??''),phone:String(s.phone??''),address:String(s.address??''),status:String(s.status??'Active'),cis_status:String(s.cis_status??'Standard 20%'),utr_number:String(s.utr_number??''),insurance_expiry:String(s.insurance_expiry??''),rating:String(s.rating??'3'),notes:String(s.notes??'') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, rating:Number(form.rating)||3 };
    if (editing) { await updateMutation.mutateAsync({ id:String(editing.id), data:payload }); toast.success('Subcontractor updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Subcontractor added'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this subcontractor?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Subcontractor removed');
  }

  const uniqueTrades = ['All', ...Array.from(new Set(subs.map(s=>String(s.trade??'')).filter(Boolean)))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subcontractors</h1>
          <p className="text-sm text-gray-500 mt-1">Approved supply chain & contractor register</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>Add Subcontractor</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Active Subs', value:activeCount, icon:Building2, colour:'text-green-600', bg:'bg-green-50' },
          { label:'Pending Approval', value:pendingCount, icon:CheckCircle, colour:'text-blue-600', bg:'bg-blue-50' },
          { label:'Insurance Expiring', value:insExpiring, icon:AlertTriangle, colour:insExpiring>0?'text-red-600':'text-gray-600', bg:insExpiring>0?'bg-red-50':'bg-gray-50' },
          { label:'Avg Rating', value:`${avgRating}/5`, icon:Star, colour:'text-yellow-600', bg:'bg-yellow-50' },
        ].map(kpi=>(
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour}/></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-gray-900">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-tab nav */}
      <div className="flex gap-1 border-b border-gray-200">
        {([
          { key:'directory', label:'Directory',        icon:HardHat,       count:subs.length },
          { key:'insurance', label:'Insurance Alerts', icon:AlertTriangle,  count:insAlerts.length },
          { key:'cis',       label:'CIS Status',       icon:PoundSterling,  count:null },
        ] as const).map(t=>(
          <button key={t.key} onClick={()=>setSubTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab===t.key?'border-orange-600 text-orange-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={14}/>{t.label}
            {t.count!==null && <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key==='insurance'&&t.count>0?'bg-red-100 text-red-700':'bg-gray-100 text-gray-600'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── INSURANCE ALERTS tab ─────────────────────────────── */}
      {subTab==='insurance' && (
        <div className="space-y-4">
          {insAlerts.length===0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
              <CheckCircle size={40} className="mx-auto mb-3 opacity-30 text-green-500"/>
              <p className="font-medium">All insurance records up to date</p>
              <p className="text-sm mt-1">No alerts in the next 60 days</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600"/>
                <span className="text-sm font-medium text-red-800">{insAlerts.length} subcontractor{insAlerts.length!==1?'s':''} require insurance attention</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>{['Company','Trade','Expiry','Days Left','Action'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {insAlerts.map(s => {
                    const hasExpiry = !!s.insurance_expiry;
                    const expired = hasExpiry && new Date(String(s.insurance_expiry)).getTime() < Date.now();
                    const daysLeft = hasExpiry ? Math.round((new Date(String(s.insurance_expiry)).getTime()-Date.now())/86400000) : null;
                    return (
                      <tr key={String(s.id??'')} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{String(s.company_name??'?').slice(0,2).toUpperCase()}</div>
                            <div>
                              <p className="font-medium text-gray-900">{String(s.company_name??'')}</p>
                              {!!s.contact_name && <p className="text-xs text-gray-500">{String(s.contact_name)}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{String(s.trade??'—')}</td>
                        <td className="px-4 py-3">{hasExpiry ? <span className={expired?'text-red-600 font-semibold':'text-amber-600'}>{String(s.insurance_expiry)}</span> : <span className="text-red-600 font-medium">Not recorded</span>}</td>
                        <td className="px-4 py-3">
                          {!hasExpiry ? <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">Unknown</span>
                           : expired ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Expired</span>
                           : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{daysLeft}d left</span>}
                        </td>
                        <td className="px-4 py-3"><button onClick={()=>openEdit(s)} className="text-xs px-3 py-1 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 font-medium">Update</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CIS STATUS tab ──────────────────────────────────────── */}
      {subTab==='cis' && (
        <div className="space-y-4">
          {cisGroups.map(group=>(
            <div key={group.status} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <PoundSterling size={16} className="text-gray-500"/>
                  <span className="font-semibold text-gray-900">{group.status}</span>
                  <span className="text-sm text-gray-500">{group.count} contractor{group.count!==1?'s':''}</span>
                </div>
                <span className="text-xs text-gray-500">{group.totalUTR}/{group.count} UTR numbers on file</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>{['Company','Trade','UTR Number','Contact','Status'].map(h=><th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {group.subs.map(s=>(
                    <tr key={String(s.id??'')} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{String(s.company_name??'?').slice(0,2).toUpperCase()}</div>
                          <span className="font-medium text-gray-900">{String(s.company_name??'')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{String(s.trade??'—')}</td>
                      <td className="px-4 py-2.5">{s.utr_number ? <span className="font-mono text-sm text-gray-800">{String(s.utr_number)}</span> : <span className="text-red-500 text-xs">Missing</span>}</td>
                      <td className="px-4 py-2.5 text-gray-600">{String(s.contact_name??'—')}</td>
                      <td className="px-4 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColour[String(s.status??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(s.status??'')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {cisGroups.length===0 && <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200"><PoundSterling size={40} className="mx-auto mb-3 opacity-30"/><p>No CIS data available</p></div>}
        </div>
      )}

      {/* ── DIRECTORY tab ───────────────────────────────────────── */}
      {subTab==='directory' && <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search company or trade…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <select value={tradeFilter} onChange={e=>setTradeFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {uniqueTrades.map(t=><option key={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} contractors</span>
      </div>}

      {subTab==='directory' && (isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><HardHat size={40} className="mx-auto mb-3 opacity-30"/><p>No subcontractors found</p></div>}
          {filtered.map(s => {
            const id = String(s.id??'');
            const isExp = expanded === id;
            const insExpiring = (() => { if (!s.insurance_expiry) return false; const d=(new Date(String(s.insurance_expiry)).getTime()-Date.now())/86400000; return d>=0&&d<=30; })();
            const rating = Number(s.rating??0);
            return (
              <div key={id}>
                <div className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer" onClick={()=>setExpanded(isExp?null:id)}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {String(s.company_name??'?').slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{String(s.company_name??'Unknown')}</p>
                      {insExpiring && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Insurance Expiring</span>}
                    </div>
                    <p className="text-sm text-gray-500">{String(s.trade??'')} {s.contact_name?`· ${s.contact_name}`:''}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-3">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(i=><Star key={i} size={12} className={i<=rating?'text-yellow-400 fill-yellow-400':'text-gray-200'}/>)}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(s.status??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(s.status??'')}</span>
                    {!!s.cis_status && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{String(s.cis_status)}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={e=>{e.stopPropagation();openEdit(s);}} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                    <button onClick={e=>{e.stopPropagation();handleDelete(id);}} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                    {isExp?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
                  </div>
                </div>
                {isExp && (
                  <div className="px-6 pb-4 bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {!!s.email && <div><p className="text-xs text-gray-400 mb-1">Email</p><a href={`mailto:${s.email}`} className="flex items-center gap-1 text-blue-600 hover:underline"><Mail size={12}/>{String(s.email)}</a></div>}
                    {!!s.phone && <div><p className="text-xs text-gray-400 mb-1">Phone</p><a href={`tel:${s.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline"><Phone size={12}/>{String(s.phone)}</a></div>}
                    {!!s.utr_number && <div><p className="text-xs text-gray-400 mb-1">UTR Number</p><p className="font-mono">{String(s.utr_number)}</p></div>}
                    {!!s.insurance_expiry && <div><p className="text-xs text-gray-400 mb-1">Insurance Expiry</p><p className={insExpiring?'text-red-600 font-medium':''}>{String(s.insurance_expiry)}</p></div>}
                    {!!s.address && <div className="col-span-2"><p className="text-xs text-gray-400 mb-1">Address</p><p className="text-gray-700">{String(s.address)}</p></div>}
                    {!!s.notes && <div className="col-span-2 md:col-span-4"><p className="text-xs text-gray-400 mb-1">Notes</p><p className="text-gray-700">{String(s.notes)}</p></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">{editing?'Edit Subcontractor':'Add Subcontractor'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input required value={form.company_name} onChange={e=>setForm(f=>({...f,company_name:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input value={form.contact_name} onChange={e=>setForm(f=>({...f,contact_name:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trade</label>
                  <select value={form.trade} onChange={e=>setForm(f=>({...f,trade:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select…</option>{TRADES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CIS Status</label>
                  <select value={form.cis_status} onChange={e=>setForm(f=>({...f,cis_status:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {CIS_STATUS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UTR Number</label>
                  <input value={form.utr_number} onChange={e=>setForm(f=>({...f,utr_number:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expiry</label>
                  <input type="date" value={form.insurance_expiry} onChange={e=>setForm(f=>({...f,insurance_expiry:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                  <select value={form.rating} onChange={e=>setForm(f=>({...f,rating:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {[1,2,3,4,5].map(n=><option key={n} value={n}>{n} Star{n>1?'s':''}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing?'Update Subcontractor':'Add Subcontractor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
