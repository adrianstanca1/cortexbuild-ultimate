import { useState } from 'react';
import { Users, Plus, Search, Phone, Mail, Briefcase, Edit2, Trash2, X, ChevronDown, ChevronUp, Shield, Clock, Award } from 'lucide-react';
import { useTeam } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const ROLES = ['Site Manager','Project Manager','Foreman','Carpenter','Bricklayer','Electrician','Plumber','Steel Fixer','Labourer','Health & Safety Officer','QS','Engineer'];
const TRADE_TYPES = ['Management','Structural','Electrical','Mechanical','Civil','Finishing','Safety'];
const STATUS_OPTIONS = ['Active','On Leave','Signed Off','Inactive'];

const statusColour: Record<string,string> = {
  'Active':'bg-green-100 text-green-800','On Leave':'bg-yellow-100 text-yellow-800',
  'Signed Off':'bg-blue-100 text-blue-800','Inactive':'bg-gray-100 text-gray-700',
};

const emptyForm = { name:'',role:'',trade_type:'',email:'',phone:'',daily_rate:'',cscs_card:'',cscs_expiry:'',status:'Active',notes:'' };

export function Teams() {
  const { useList, useCreate, useUpdate, useDelete } = useTeam;
  const { data: raw = [], isLoading } = useList();
  const members = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = members.filter(m => {
    const name = String(m.name ?? '').toLowerCase();
    const role = String(m.role ?? '').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || role.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = members.filter(m => m.status === 'Active').length;
  const onLeaveCount = members.filter(m => m.status === 'On Leave').length;
  const totalDailyCost = members.filter(m => m.status === 'Active').reduce((s, m) => s + Number(m.daily_rate ?? 0), 0);
  const cscsExpiring = members.filter(m => {
    if (!m.cscs_expiry) return false;
    const diff = (new Date(String(m.cscs_expiry)).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 30;
  }).length;

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(m: AnyRow) {
    setEditing(m);
    setForm({ name:String(m.name??''),role:String(m.role??''),trade_type:String(m.trade_type??''),email:String(m.email??''),phone:String(m.phone??''),daily_rate:String(m.daily_rate??''),cscs_card:String(m.cscs_card??''),cscs_expiry:String(m.cscs_expiry??''),status:String(m.status??'Active'),notes:String(m.notes??'') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, daily_rate: Number(form.daily_rate)||0 };
    if (editing) { await updateMutation.mutateAsync({ id: String(editing.id), data: payload }); toast.success('Member updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Member added'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this team member?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Member removed');
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-sm text-gray-500 mt-1">Site workforce & personnel records</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>Add Member</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Active Workers', value:activeCount, icon:Users, colour:'text-green-600', bg:'bg-green-50' },
          { label:'On Leave', value:onLeaveCount, icon:Clock, colour:'text-yellow-600', bg:'bg-yellow-50' },
          { label:'Daily Labour Cost', value:`£${totalDailyCost.toLocaleString()}`, icon:Briefcase, colour:'text-blue-600', bg:'bg-blue-50' },
          { label:'CSCS Expiring (30d)', value:cscsExpiring, icon:Shield, colour:cscsExpiring>0?'text-red-600':'text-gray-600', bg:cscsExpiring>0?'bg-red-50':'bg-gray-50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour}/></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-gray-900">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or role…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} members</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400"><Users size={40} className="mx-auto mb-3 opacity-30"/><p>No team members found</p></div>
          )}
          {filtered.map(m => {
            const id = String(m.id??'');
            const isExp = expanded === id;
            const expiring = (() => { if (!m.cscs_expiry) return false; const d=(new Date(String(m.cscs_expiry)).getTime()-Date.now())/86400000; return d>=0&&d<=30; })();
            return (
              <div key={id}>
                <div className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer" onClick={()=>setExpanded(isExp?null:id)}>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {String(m.name??'?').split(' ').map((n:string)=>n[0]).slice(0,2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{String(m.name??'Unknown')}</p>
                      {expiring && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">CSCS Expiring</span>}
                    </div>
                    <p className="text-sm text-gray-500">{String(m.role??'')} {m.trade_type?`· ${m.trade_type}`:''}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-3">
                    {!!m.daily_rate && <span className="text-sm font-medium text-gray-700">£{Number(m.daily_rate).toLocaleString()}/day</span>}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(m.status??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(m.status??'')}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={e=>{e.stopPropagation();openEdit(m);}} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                    <button onClick={e=>{e.stopPropagation();handleDelete(id);}} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                    {isExp?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
                  </div>
                </div>
                {isExp && (
                  <div className="px-6 pb-4 bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {!!m.email && <div><p className="text-xs text-gray-400 mb-1">Email</p><a href={`mailto:${m.email}`} className="flex items-center gap-1 text-blue-600 hover:underline"><Mail size={12}/>{String(m.email)}</a></div>}
                    {!!m.phone && <div><p className="text-xs text-gray-400 mb-1">Phone</p><a href={`tel:${m.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline"><Phone size={12}/>{String(m.phone)}</a></div>}
                    {!!m.cscs_card && <div><p className="text-xs text-gray-400 mb-1">CSCS Card</p><p className="flex items-center gap-1"><Award size={12} className="text-yellow-500"/>{String(m.cscs_card)}</p></div>}
                    {!!m.cscs_expiry && <div><p className="text-xs text-gray-400 mb-1">CSCS Expiry</p><p className={expiring?'text-red-600 font-medium':''}>{String(m.cscs_expiry)}</p></div>}
                    {!!m.notes && <div className="col-span-2 md:col-span-4"><p className="text-xs text-gray-400 mb-1">Notes</p><p className="text-gray-700">{String(m.notes)}</p></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">{editing?'Edit Team Member':'Add Team Member'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select…</option>{ROLES.map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trade Type</label>
                  <select value={form.trade_type} onChange={e=>setForm(f=>({...f,trade_type:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select…</option>{TRADE_TYPES.map(t=><option key={t}>{t}</option>)}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (£)</label>
                  <input type="number" value={form.daily_rate} onChange={e=>setForm(f=>({...f,daily_rate:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CSCS Card No.</label>
                  <input value={form.cscs_card} onChange={e=>setForm(f=>({...f,cscs_card:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CSCS Expiry</label>
                  <input type="date" value={form.cscs_expiry} onChange={e=>setForm(f=>({...f,cscs_expiry:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing?'Update Member':'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
