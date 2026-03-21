import { useState } from 'react';
import { Package, Plus, Search, Truck, AlertTriangle, CheckCircle, Clock, Edit2, Trash2, X, ChevronDown, ChevronUp, PoundSterling } from 'lucide-react';
import { useMaterials } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STATUS_OPTIONS = ['On Order','In Transit','Delivered','On Site','Used','Returned'];
const UNITS = ['m','m²','m³','kg','tonne','nr','bag','roll','sheet','lm','set'];
const CATEGORIES = ['Concrete & Cement','Steel & Metalwork','Timber','Brickwork & Masonry','Roofing','Insulation','Electrical','Plumbing','Finishes','Plant Hire','PPE & Safety','Other'];

const statusColour: Record<string,string> = {
  'On Order':'bg-yellow-500/20 text-yellow-300','In Transit':'bg-blue-500/20 text-blue-300',
  'Delivered':'bg-green-500/20 text-green-300','On Site':'bg-purple-500/20 text-purple-300',
  'Used':'bg-gray-800 text-gray-400','Returned':'bg-gray-800 text-gray-400',
};

const emptyForm = { name:'',category:'',quantity:'',unit:'nr',unit_cost:'',supplier:'',po_number:'',order_date:'',delivery_date:'',project_id:'',status:'On Order',notes:'' };

export function Materials() {
  const { useList, useCreate, useUpdate, useDelete } = useMaterials;
  const { data: raw = [], isLoading } = useList();
  const materials = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  function setTab(key: string, filter: string) { setSubTab(key); setStatusFilter(filter); }
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const filtered = materials.filter(m => {
    const name = String(m.name??'').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    let matchStatus = statusFilter === 'All' || m.status === statusFilter;
    if (subTab === 'onsite') matchStatus = ['Delivered','On Site'].includes(String(m.status??''));
    if (subTab === 'overdue') {
      if (!m.delivery_date || m.status==='Delivered' || m.status==='On Site') return false;
      return matchSearch && new Date(String(m.delivery_date)) < new Date();
    }
    const matchCat = categoryFilter === 'All' || m.category === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const totalValue = materials.reduce((s,m)=>s+Number(m.quantity??0)*Number(m.unit_cost??0),0);
  const onOrderCount = materials.filter(m=>m.status==='On Order').length;
  const deliveredCount = materials.filter(m=>['Delivered','On Site'].includes(String(m.status??''))).length;
  const overdueDeliveries = materials.filter(m => {
    if (!m.delivery_date || m.status==='Delivered' || m.status==='On Site') return false;
    return new Date(String(m.delivery_date)) < new Date();
  }).length;

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(m: AnyRow) {
    setEditing(m);
    setForm({ name:String(m.name??''),category:String(m.category??''),quantity:String(m.quantity??''),unit:String(m.unit??'nr'),unit_cost:String(m.unit_cost??''),supplier:String(m.supplier??''),po_number:String(m.po_number??''),order_date:String(m.order_date??''),delivery_date:String(m.delivery_date??''),project_id:String(m.project_id??''),status:String(m.status??'On Order'),notes:String(m.notes??'') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, quantity:Number(form.quantity)||0, unit_cost:Number(form.unit_cost)||0 };
    if (editing) { await updateMutation.mutateAsync({ id:String(editing.id), data:payload }); toast.success('Material updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Material added'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this material?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Material deleted');
  }

  async function markDelivered(m: AnyRow) {
    await updateMutation.mutateAsync({ id:String(m.id), data:{ status:'Delivered' } });
    toast.success('Material marked as delivered');
  }

  const uniqueCategories = ['All',...Array.from(new Set(materials.map(m=>String(m.category??'')).filter(Boolean)))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Materials</h1>
          <p className="text-sm text-gray-500 mt-1">Procurement tracking & material schedules</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>Add Material</span>
        </button>
      </div>

      {overdueDeliveries > 0 && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-red-400"/>
          <p className="text-sm text-red-300"><span className="font-semibold">{overdueDeliveries} overdue deliver{overdueDeliveries>1?'ies':'y'}</span> — chase suppliers.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Value', value:`£${Math.round(totalValue).toLocaleString()}`, icon:PoundSterling, colour:'text-blue-400', bg:'bg-blue-500/20' },
          { label:'On Order', value:onOrderCount, icon:Clock, colour:'text-yellow-400', bg:'bg-yellow-500/20' },
          { label:'Delivered / On Site', value:deliveredCount, icon:CheckCircle, colour:'text-green-400', bg:'bg-green-500/20' },
          { label:'Overdue Deliveries', value:overdueDeliveries, icon:AlertTriangle, colour:overdueDeliveries>0?'text-red-400':'text-gray-400', bg:overdueDeliveries>0?'bg-red-500/20':'bg-gray-800' },
        ].map(kpi=>(
          <div key={kpi.label} className="bg-gray-900 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour}/></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-white">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-gray-700">
        {([
          { key:'all',       label:'All Materials',      filter:'All',        count:materials.length },
          { key:'onorder',   label:'On Order',           filter:'On Order',   count:onOrderCount },
          { key:'transit',   label:'In Transit',         filter:'In Transit', count:materials.filter(m=>m.status==='In Transit').length },
          { key:'onsite',    label:'Delivered / On Site',filter:'Delivered',  count:deliveredCount },
          { key:'overdue',   label:'Overdue Deliveries', filter:'All',        count:overdueDeliveries },
        ]).map(t=>(
          <button key={t.key} onClick={()=>{ setSubTab(t.key); if(t.key==='overdue'||t.key==='onsite'){ setStatusFilter('All'); }else{ setStatusFilter(t.filter); } }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab===t.key?'border-orange-600 text-orange-400':'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key==='overdue'&&t.count>0?'bg-red-500/20 text-red-300':'bg-gray-800 text-gray-300'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-gray-900 rounded-xl border border-gray-700 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search material…" className="w-full pl-9 pr-4 py-2 text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="text-sm bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {uniqueCategories.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>{['Material','Category','Qty','Unit Cost','Total','Supplier','PO #','Delivery','Status',''].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.map(m=>{
                const total = Number(m.quantity??0)*Number(m.unit_cost??0);
                const isOverdue = m.delivery_date && !['Delivered','On Site','Used'].includes(String(m.status??'')) && new Date(String(m.delivery_date))<new Date();
                return (
                  <tr key={String(m.id)} className="hover:bg-gray-800">
                    <td className="px-4 py-3 font-medium text-white">{String(m.name??'—')}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{String(m.category??'—')}</td>
                    <td className="px-4 py-3 text-gray-300">{Number(m.quantity??0)} {String(m.unit??'')}</td>
                    <td className="px-4 py-3 text-gray-300">£{Number(m.unit_cost??0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-white">£{Math.round(total).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-300">{String(m.supplier??'—')}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{String(m.po_number??'—')}</td>
                    <td className={`px-4 py-3 text-sm ${isOverdue?'text-red-400 font-medium':'text-gray-300'}`}>{String(m.delivery_date??'—')}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(m.status??'')] ?? 'bg-gray-800 text-gray-300'}`}>{String(m.status??'')}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {m.status==='In Transit' && <button onClick={()=>markDelivered(m)} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded" title="Mark Delivered"><CheckCircle size={14}/></button>}
                        <button onClick={()=>openEdit(m)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 rounded"><Edit2 size={14}/></button>
                        <button onClick={()=>handleDelete(String(m.id))} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><Package size={40} className="mx-auto mb-3 opacity-30"/><p>No materials found</p></div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-white">{editing?'Edit Material':'Add Material'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Material Name *</label>
                  <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select…</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Quantity</label>
                  <input type="number" step="0.01" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Unit</label>
                  <select value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {UNITS.map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Unit Cost (£)</label>
                  <input type="number" step="0.01" value={form.unit_cost} onChange={e=>setForm(f=>({...f,unit_cost:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Supplier</label>
                  <input value={form.supplier} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">PO Number</label>
                  <input value={form.po_number} onChange={e=>setForm(f=>({...f,po_number:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Order Date</label>
                  <input type="date" value={form.order_date} onChange={e=>setForm(f=>({...f,order_date:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Delivery Date</label>
                  <input type="date" value={form.delivery_date} onChange={e=>setForm(f=>({...f,delivery_date:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing?'Update Material':'Add Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
