import { useState } from 'react';
import { UserCheck, Plus, Search, Phone, Mail, MapPin, Star, Edit2, Trash2, X, ChevronDown, ChevronUp, Building2, TrendingUp, Users, Briefcase, DollarSign, Calendar, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { useContacts } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const CONTACT_TYPES = ['Client','Consultant','Subcontractor','Supplier','Statutory Body','Insurer','Solicitor','Other'];
const STATUS_OPTIONS = ['Active','Inactive','Prospect','Do Not Contact'];
const DEAL_STAGES = ['Lead','Qualified','Proposal','Negotiation','Won','Lost'];
const DEAL_PRIORITIES = ['Low','Medium','High','Critical'];

const typeColour: Record<string,string> = {
  'Client':'bg-blue-500/20 text-blue-300','Consultant':'bg-purple-500/20 text-purple-300',
  'Subcontractor':'bg-orange-500/20 text-orange-300','Supplier':'bg-green-500/20 text-green-300',
  'Statutory Body':'bg-gray-700 text-gray-300','Insurer':'bg-teal-500/20 text-teal-300',
  'Solicitor':'bg-red-500/20 text-red-300','Other':'bg-gray-700 text-gray-400',
};

const statusColour: Record<string,string> = {
  'Active':'bg-green-500/20 text-green-300','Inactive':'bg-gray-700 text-gray-400',
  'Prospect':'bg-yellow-500/20 text-yellow-300','Do Not Contact':'bg-red-500/20 text-red-300',
};

const emptyForm = { name:'',company:'',type:'Client',email:'',phone:'',address:'',status:'Active',rating:'3',notes:'',website:'' };

interface Deal {
  id: string;
  title: string;
  contactId: string;
  contactName: string;
  company: string;
  value: number;
  stage: string;
  priority: string;
  expectedClose: string;
  notes: string;
  createdAt: string;
}

const mockDeals: Deal[] = [
  { id: '1', title: 'Office Fit-Out Contract', contactId: '1', contactName: 'Sarah Mitchell', company: 'Apex Construction Ltd', value: 250000, stage: 'Proposal', priority: 'High', expectedClose: '2026-04-15', notes: 'Waiting for final approval', createdAt: '2026-03-01' },
  { id: '2', title: 'Warehouse Extension', contactId: '2', contactName: 'James Wilson', company: 'Logistics Pro Inc', value: 180000, stage: 'Negotiation', priority: 'Medium', expectedClose: '2026-04-30', notes: 'Discussing payment terms', createdAt: '2026-02-15' },
  { id: '3', title: 'Retail Space Reno', contactId: '3', contactName: 'Emily Brown', company: 'ShopFit Partners', value: 95000, stage: 'Qualified', priority: 'High', expectedClose: '2026-05-20', notes: 'Site visit completed', createdAt: '2026-03-10' },
  { id: '4', title: 'School Refurbishment', contactId: '4', contactName: 'David Clark', company: 'Education Estates', value: 320000, stage: 'Lead', priority: 'Medium', expectedClose: '2026-06-01', notes: 'Initial enquiry received', createdAt: '2026-03-18' },
  { id: '5', title: 'Hotel Lobby Upgrade', contactId: '5', contactName: 'Anna Taylor', company: 'Grand Hotels Group', value: 450000, stage: 'Won', priority: 'Critical', expectedClose: '2026-03-15', notes: 'Contract signed', createdAt: '2026-02-01' },
];

export function CRM() {
  const { useList, useCreate, useUpdate, useDelete } = useContacts;
  const { data: raw = [], isLoading } = useList();
  const contacts = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState<'contacts'|'pipeline'|'companies'|'deals'>('contacts');
  const [deals] = useState<Deal[]>(mockDeals);
  const [dealSearch, setDealSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = contacts.filter(c => {
    const name = String(c.name??'').toLowerCase();
    const company = String(c.company??'').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || company.includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || c.type === typeFilter;
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const clientCount = contacts.filter(c=>c.type==='Client').length;
  const consultantCount = contacts.filter(c=>c.type==='Consultant').length;
  const activeCount = contacts.filter(c=>c.status==='Active').length;
  const prospectCount = contacts.filter(c=>c.status==='Prospect').length;

  // Pipeline data
  const pipeline = CONTACT_TYPES.map(type => ({
    type,
    contacts: contacts.filter(c=>c.type===type),
    count: contacts.filter(c=>c.type===type).length,
  })).filter(g=>g.count>0);

  // Companies grouping
  const companiesMap = new Map<string, AnyRow[]>();
  contacts.forEach(c => {
    const co = String(c.company||'(No Company)');
    if (!companiesMap.has(co)) companiesMap.set(co, []);
    companiesMap.get(co)!.push(c);
  });
  const companies = Array.from(companiesMap.entries())
    .map(([name, members]) => ({ name, members, count: members.length }))
    .sort((a,b) => b.count - a.count);

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(c: AnyRow) {
    setEditing(c);
    setForm({ name:String(c.name??''),company:String(c.company??''),type:String(c.type??'Client'),email:String(c.email??''),phone:String(c.phone??''),address:String(c.address??''),status:String(c.status??'Active'),rating:String(c.rating??'3'),notes:String(c.notes??''),website:String(c.website??'') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, rating:Number(form.rating)||3 };
    if (editing) { await updateMutation.mutateAsync({ id:String(editing.id), data:payload }); toast.success('Contact updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Contact added'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contact?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Contact deleted');
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">CRM</h1>
          <p className="text-sm text-gray-500 mt-1">Clients, consultants & supply chain contacts</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>Add Contact</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Clients', value:clientCount, icon:Building2, colour:'text-blue-400', bg:'bg-blue-500/20' },
          { label:'Consultants', value:consultantCount, icon:UserCheck, colour:'text-purple-400', bg:'bg-purple-500/20' },
          { label:'Active', value:activeCount, icon:UserCheck, colour:'text-green-400', bg:'bg-green-500/20' },
          { label:'Prospects', value:prospectCount, icon:Star, colour:'text-yellow-400', bg:'bg-yellow-500/20' },
        ].map(kpi=>(
          <div key={kpi.label} className="bg-gray-900 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour}/></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-white">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-tab nav */}
      <div className="flex gap-1 border-b border-gray-700">
        {([
          { key:'contacts', label:'All Contacts', icon:UserCheck, count:contacts.length },
          { key:'pipeline', label:'By Type',      icon:TrendingUp, count:null },
          { key:'companies',label:'Companies',    icon:Users,      count:companiesMap.size },
          { key:'deals', label:'Deals', icon:Briefcase, count:deals.length },
        ] as const).map(t=>(
          <button key={t.key} onClick={()=>setSubTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab===t.key?'border-orange-600 text-orange-600':'border-transparent text-gray-500 hover:text-gray-300'}`}>
            <t.icon size={14}/>{t.label}
            {t.count!==null && <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-300">{t.count}</span>}
          </button>
        ))}
      </div>

      {subTab==='contacts' && <div className="flex flex-wrap gap-3 items-center bg-gray-900 rounded-xl border border-gray-700 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or company…" className="w-full pl-9 pr-4 py-2 text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="text-sm bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...CONTACT_TYPES].map(t=><option key={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} contacts</span>
      </div>}

      {/* ── BY TYPE tab ───────────────────────────────────────── */}
      {subTab==='pipeline' && (
        <div className="space-y-4">
          {pipeline.map(group=>(
            <div key={group.type} className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColour[group.type]??'bg-gray-800 text-gray-300'}`}>{group.type}</span>
                  <span className="text-sm font-semibold text-gray-300">{group.count} contact{group.count!==1?'s':''}</span>
                </div>
              </div>
              <div className="divide-y divide-gray-700">
                {group.contacts.map(c=>(
                  <div key={String(c.id??'')} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {String(c.name??'?').split(' ').map((n:string)=>n[0]).slice(0,2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{String(c.name??'')}</p>
                      {!!c.company && <p className="text-xs text-gray-500 truncate">{String(c.company)}</p>}
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
                      {!!c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-blue-600 hover:underline"><Mail size={11}/>{String(c.email)}</a>}
                      {!!c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline"><Phone size={11}/>{String(c.phone)}</a>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColour[String(c.status??'')] ?? 'bg-gray-800 text-gray-300'}`}>{String(c.status??'')}</span>
                    <button onClick={()=>openEdit(c)} className="p-1 text-gray-400 hover:text-blue-600 rounded flex-shrink-0"><Edit2 size={13}/></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {pipeline.length===0 && <div className="text-center py-16 text-gray-400 bg-gray-900 rounded-xl border border-gray-700"><TrendingUp size={40} className="mx-auto mb-3 opacity-30"/><p>No contacts yet</p></div>}
        </div>
      )}

      {/* ── COMPANIES tab ─────────────────────────────────────── */}
      {subTab==='companies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {companies.length===0 && (
            <div className="col-span-3 text-center py-16 text-gray-400 bg-gray-900 rounded-xl border border-gray-700"><Building2 size={40} className="mx-auto mb-3 opacity-30"/><p>No companies found</p></div>
          )}
          {companies.map(co=>(
            <div key={co.name} className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {co.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{co.name}</p>
                  <p className="text-xs text-gray-500">{co.count} contact{co.count!==1?'s':''}</p>
                </div>
              </div>
              <div className="divide-y divide-gray-700">
                {co.members.map(c=>(
                  <div key={String(c.id??'')} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {String(c.name??'?')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{String(c.name??'')}</p>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${typeColour[String(c.type??'')] ?? 'bg-gray-800 text-gray-300'}`}>{String(c.type??'')}</span>
                    <button onClick={()=>openEdit(c)} className="p-1 text-gray-400 hover:text-blue-600 rounded flex-shrink-0"><Edit2 size={12}/></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ALL CONTACTS tab ──────────────────────────────────── */}
      {subTab==='contacts' && isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : subTab==='contacts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400 bg-gray-900 rounded-xl border border-gray-700">
              <UserCheck size={40} className="mx-auto mb-3 opacity-30"/><p>No contacts found</p>
            </div>
          )}
          {filtered.map(c=>{
            const id = String(c.id??'');
            const isExp = expanded === id;
            const rating = Number(c.rating??0);
            return (
              <div key={id} className="bg-gray-900 rounded-xl border border-gray-700 hover:shadow-md transition-shadow">
                <div className="p-4 cursor-pointer" onClick={()=>setExpanded(isExp?null:id)}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {String(c.name??'?').split(' ').map((n:string)=>n[0]).slice(0,2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{String(c.name??'Unknown')}</p>
                      {!!c.company && <p className="text-sm text-gray-500 truncate flex items-center gap-1"><Building2 size={11}/>{String(c.company)}</p>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={e=>{e.stopPropagation();openEdit(c);}} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-500/20 rounded"><Edit2 size={13}/></button>
                      <button onClick={e=>{e.stopPropagation();handleDelete(id);}} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-500/20 rounded"><Trash2 size={13}/></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColour[String(c.type??'')] ?? 'bg-gray-800 text-gray-300'}`}>{String(c.type??'')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColour[String(c.status??'')] ?? 'bg-gray-800 text-gray-300'}`}>{String(c.status??'')}</span>
                    {rating > 0 && (
                      <div className="flex items-center gap-0.5 ml-auto">
                        {[1,2,3,4,5].map(i=><Star key={i} size={10} className={i<=rating?'text-yellow-400 fill-yellow-400':'text-gray-200 fill-gray-200'}/>)}
                      </div>
                    )}
                  </div>
                  {(!!c.email || !!c.phone) && (
                    <div className="flex flex-wrap gap-3 mt-3 text-xs">
                      {!!c.email && <a href={`mailto:${c.email}`} onClick={e=>e.stopPropagation()} className="flex items-center gap-1 text-blue-600 hover:underline truncate"><Mail size={11}/>{String(c.email)}</a>}
                      {!!c.phone && <a href={`tel:${c.phone}`} onClick={e=>e.stopPropagation()} className="flex items-center gap-1 text-blue-600 hover:underline"><Phone size={11}/>{String(c.phone)}</a>}
                    </div>
                  )}
                </div>
                {isExp && (
                  <div className="px-4 pb-4 border-t border-gray-700 pt-3 space-y-2 text-sm">
                    {!!c.address && <p className="flex items-start gap-2 text-gray-300"><MapPin size={13} className="mt-0.5 flex-shrink-0"/>{String(c.address)}</p>}
                    {!!c.website && <a href={String(c.website)} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs block truncate">{String(c.website)}</a>}
                    {!!c.notes && <p className="text-gray-400 text-xs bg-gray-800 rounded-lg p-2 leading-relaxed">{String(c.notes)}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── DEALS tab ──────────────────────────────────────── */}
      {subTab === 'deals' && (
        <div className="space-y-6">
          {/* Deals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Pipeline', value: `£${(deals.reduce((s, d) => s + d.value, 0) / 1000).toFixed(0)}K`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
              { label: 'Active Deals', value: deals.filter(d => !['Won', 'Lost'].includes(d.stage)).length, icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/20' },
              { label: 'Won This Month', value: `£${(deals.filter(d => d.stage === 'Won').reduce((s, d) => s + d.value, 0) / 1000).toFixed(0)}K`, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
              { label: 'Avg Deal Size', value: `£${Math.round(deals.reduce((s, d) => s + d.value, 0) / deals.length / 1000)}K`, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/20' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-gray-900 rounded-xl border border-gray-700 p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.color}/></div>
                  <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-white">{kpi.value}</p></div>
                </div>
              </div>
            ))}
          </div>

          {/* Deals Filters */}
          <div className="flex flex-wrap gap-3 items-center bg-gray-900 rounded-xl border border-gray-700 p-4">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={dealSearch} onChange={e => setDealSearch(e.target.value)} placeholder="Search deals..." className="w-full pl-9 pr-4 py-2 text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
            </div>
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="text-sm bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option>All</option>
              {DEAL_STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
            <span className="text-sm text-gray-500 ml-auto">{deals.length} deals</span>
          </div>

          {/* Pipeline Board */}
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max pb-4">
              {DEAL_STAGES.map(stage => {
                const stageDeals = deals.filter(d => {
                  const matchesSearch = d.title.toLowerCase().includes(dealSearch.toLowerCase()) || d.company.toLowerCase().includes(dealSearch.toLowerCase());
                  const matchesStage = stageFilter === 'All' || d.stage === stageFilter;
                  return d.stage === stage && matchesSearch && matchesStage;
                });
                const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);
                const stageColor = stage === 'Won' ? 'border-emerald-500/50' : stage === 'Lost' ? 'border-red-500/50' : 'border-gray-700';
                return (
                  <div key={stage} className={`w-72 bg-gray-900 rounded-xl border-t-2 ${stageColor} overflow-hidden`}>
                    <div className="p-3 border-b border-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {stage === 'Won' && <CheckCircle size={14} className="text-emerald-400"/>}
                          {stage === 'Lost' && <X size={14} className="text-red-400"/>}
                          {stage === 'Negotiation' && <Clock size={14} className="text-amber-400"/>}
                          {stage === 'Proposal' && <FileText size={14} className="text-blue-400"/>}
                          {stage === 'Qualified' && <UserCheck size={14} className="text-purple-400"/>}
                          {stage === 'Lead' && <AlertCircle size={14} className="text-gray-400"/>}
                          <span className="font-semibold text-sm text-white">{stage}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400">{stageDeals.length}</span>
                        </div>
                        <span className="text-xs font-mono text-gray-400">£{(stageValue / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                    <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
                      {stageDeals.map(deal => (
                        <div key={deal.id} className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800 transition-colors cursor-pointer border border-gray-700 hover:border-orange-500/30">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              deal.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                              deal.priority === 'High' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-gray-700 text-gray-400'
                            }`}>{deal.priority}</span>
                          </div>
                          <h4 className="font-semibold text-sm text-white mb-1">{deal.title}</h4>
                          <p className="text-xs text-gray-500 mb-2">{deal.company}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-emerald-400">£{(deal.value / 1000).toFixed(0)}K</span>
                            <span className="text-xs text-gray-500">{deal.expectedClose}</span>
                          </div>
                        </div>
                      ))}
                      {stageDeals.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-xs">No deals</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-white">{editing?'Edit Contact':'Add Contact'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
                  <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Company</label>
                  <input value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {CONTACT_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                  <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Rating (1–5)</label>
                  <select value={form.rating} onChange={e=>setForm(f=>({...f,rating:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {[1,2,3,4,5].map(n=><option key={n} value={n}>{n} ★</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Website</label>
                  <input type="url" value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} placeholder="https://…" className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                  <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                  <textarea rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing?'Update Contact':'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
