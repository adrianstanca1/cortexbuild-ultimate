import { useState } from 'react';
import { UserCheck, Plus, Search, Phone, Mail, MapPin, Star, Edit2, Trash2, X, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { useContacts } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const CONTACT_TYPES = ['Client','Consultant','Subcontractor','Supplier','Statutory Body','Insurer','Solicitor','Other'];
const STATUS_OPTIONS = ['Active','Inactive','Prospect','Do Not Contact'];

const typeColour: Record<string,string> = {
  'Client':'bg-blue-100 text-blue-800','Consultant':'bg-purple-100 text-purple-700',
  'Subcontractor':'bg-orange-100 text-orange-700','Supplier':'bg-green-100 text-green-700',
  'Statutory Body':'bg-gray-100 text-gray-700','Insurer':'bg-teal-100 text-teal-700',
  'Solicitor':'bg-red-100 text-red-700','Other':'bg-gray-100 text-gray-600',
};

const statusColour: Record<string,string> = {
  'Active':'bg-green-100 text-green-800','Inactive':'bg-gray-100 text-gray-600',
  'Prospect':'bg-yellow-100 text-yellow-800','Do Not Contact':'bg-red-100 text-red-700',
};

const emptyForm = { name:'',company:'',type:'Client',email:'',phone:'',address:'',status:'Active',rating:'3',notes:'',website:'' };

export function CRM() {
  const { useList, useCreate, useUpdate, useDelete } = useContacts;
  const { data: raw = [], isLoading } = useList();
  const contacts = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

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
          <h1 className="text-2xl font-bold text-gray-900">CRM</h1>
          <p className="text-sm text-gray-500 mt-1">Clients, consultants & supply chain contacts</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>Add Contact</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Clients', value:clientCount, icon:Building2, colour:'text-blue-600', bg:'bg-blue-50' },
          { label:'Consultants', value:consultantCount, icon:UserCheck, colour:'text-purple-600', bg:'bg-purple-50' },
          { label:'Active', value:activeCount, icon:UserCheck, colour:'text-green-600', bg:'bg-green-50' },
          { label:'Prospects', value:prospectCount, icon:Star, colour:'text-yellow-600', bg:'bg-yellow-50' },
        ].map(kpi=>(
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
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or company…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...CONTACT_TYPES].map(t=><option key={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} contacts</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
              <UserCheck size={40} className="mx-auto mb-3 opacity-30"/><p>No contacts found</p>
            </div>
          )}
          {filtered.map(c=>{
            const id = String(c.id??'');
            const isExp = expanded === id;
            const rating = Number(c.rating??0);
            return (
              <div key={id} className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-4 cursor-pointer" onClick={()=>setExpanded(isExp?null:id)}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {String(c.name??'?').split(' ').map((n:string)=>n[0]).slice(0,2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{String(c.name??'Unknown')}</p>
                      {!!c.company && <p className="text-sm text-gray-500 truncate flex items-center gap-1"><Building2 size={11}/>{String(c.company)}</p>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={e=>{e.stopPropagation();openEdit(c);}} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={13}/></button>
                      <button onClick={e=>{e.stopPropagation();handleDelete(id);}} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={13}/></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColour[String(c.type??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(c.type??'')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColour[String(c.status??'')] ?? 'bg-gray-100 text-gray-600'}`}>{String(c.status??'')}</span>
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
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2 text-sm">
                    {!!c.address && <p className="flex items-start gap-2 text-gray-600"><MapPin size={13} className="mt-0.5 flex-shrink-0"/>{String(c.address)}</p>}
                    {!!c.website && <a href={String(c.website)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs block truncate">{String(c.website)}</a>}
                    {!!c.notes && <p className="text-gray-500 text-xs bg-gray-50 rounded-lg p-2 leading-relaxed">{String(c.notes)}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">{editing?'Edit Contact':'Add Contact'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {CONTACT_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1–5)</label>
                  <select value={form.rating} onChange={e=>setForm(f=>({...f,rating:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {[1,2,3,4,5].map(n=><option key={n} value={n}>{n} ★</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input type="url" value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} placeholder="https://…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
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
