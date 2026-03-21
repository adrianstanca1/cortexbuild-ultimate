// Module: Procurement — CortexBuild Ultimate
import { useState } from 'react';
import {
  Plus, Edit2, Trash2, X, Truck, CheckCircle2, AlertCircle,
  Clock, Package, Search,
} from 'lucide-react';
import { useProcurement, useProjects } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STATUSES = ['pending_approval','ordered','pending_delivery','on_site','delivered'];
const CATEGORIES = ['Structural Steel','Concrete','Waterproofing','Cladding','Fixings','Insulation','Tools','Groundworks','Civils','Other'];

const STATUS_COLOUR: Record<string,string> = {
  pending_approval: 'bg-yellow-500/20 text-yellow-300',
  ordered:          'bg-blue-500/20 text-blue-300',
  pending_delivery: 'bg-orange-500/20 text-orange-300',
  on_site:          'bg-green-500/20 text-green-300',
  delivered:        'bg-emerald-500/20 text-emerald-300',
};

const STATUS_ICON: Record<string, typeof Truck> = {
  pending_approval: Clock,
  ordered:          Package,
  pending_delivery: Truck,
  on_site:          Truck,
  delivered:        CheckCircle2,
};

function fmt(n: number) { return `£${Number(n).toLocaleString()}`; }
function nextPO(pos: AnyRow[]) {
  const nums = pos.map(p => parseInt(String(p.po_number??'').replace(/\D/g,''))).filter(n => !isNaN(n));
  const next  = nums.length > 0 ? Math.max(...nums) + 1 : 89;
  return `PO-CW-${String(next).padStart(4,'0')}`;
}

export function Procurement() {
  const [subTab, setSubTab] = useState<'all'|'pending'|'ordered'|'delivery'|'delivered'>('all');
  const [filterStatus, setFilterStatus]   = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch]               = useState('');
  const [showModal, setShowModal]         = useState(false);
  const [editId, setEditId]               = useState<string|null>(null);

  // Form state
  const [fPO, setFPO]           = useState('');
  const [fSupplier, setFSupplier] = useState('');
  const [fDesc, setFDesc]       = useState('');
  const [fValue, setFValue]     = useState('');
  const [fProject, setFProject] = useState('');
  const [fCategory, setFCategory] = useState('Other');
  const [fStatus, setFStatus]   = useState('pending_approval');
  const [fOrder, setFOrder]     = useState('');
  const [fDelivery, setFDelivery] = useState('');
  const [fNotes, setFNotes]     = useState('');

  const { useList, useCreate, useUpdate, useDelete } = useProcurement;
  const { useList: useProjList } = useProjects;
  const { data: rawPOs=[], isLoading } = useList();
  const { data: rawProj=[] }           = useProjList();
  const pos      = rawPOs  as AnyRow[];
  const projects = rawProj as AnyRow[];

  const createMut = useCreate();
  const updateMut = useUpdate();
  const deleteMut = useDelete();

  const SUBTAB_STATUSES: Record<string, string[]> = {
    pending:  ['pending_approval'],
    ordered:  ['ordered'],
    delivery: ['pending_delivery','on_site'],
    delivered:['delivered'],
  };
  const filtered = pos.filter(p => {
    if (subTab !== 'all') {
      const allowed = SUBTAB_STATUSES[subTab] ?? [];
      if (!allowed.includes(String(p.status??''))) return false;
    }
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterCategory !== 'all' && p.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return String(p.supplier??'').toLowerCase().includes(q) ||
             String(p.description??'').toLowerCase().includes(q) ||
             String(p.po_number??'').toLowerCase().includes(q);
    }
    return true;
  });

  const totalValue       = pos.reduce((s,p) => s+Number(p.value??0), 0);
  const pendingDelivery  = pos.filter(p => p.status==='pending_delivery').length;
  const awaitingApproval = pos.filter(p => p.status==='pending_approval').length;
  const delivered        = pos.filter(p => p.status==='delivered').length;

  function openCreate() {
    setEditId(null);
    setFPO(nextPO(pos)); setFSupplier(''); setFDesc(''); setFValue('');
    setFProject(''); setFCategory('Other'); setFStatus('pending_approval');
    setFOrder(''); setFDelivery(''); setFNotes('');
    setShowModal(true);
  }
  function openEdit(po: AnyRow) {
    setEditId(String(po.id));
    setFPO(String(po.po_number??''));
    setFSupplier(String(po.supplier??''));
    setFDesc(String(po.description??''));
    setFValue(String(po.value??''));
    setFProject(String(po.project??''));
    setFCategory(String(po.category??'Other'));
    setFStatus(String(po.status??'pending_approval'));
    setFOrder(String(po.order_date??po.orderDate??''));
    setFDelivery(String(po.delivery_date??po.deliveryDate??''));
    setFNotes(String(po.notes??''));
    setShowModal(true);
  }
  function handleSave() {
    if (!fSupplier||!fDesc) { toast.error('Supplier and description required'); return; }
    const payload = {
      po_number:fPO, supplier:fSupplier, description:fDesc, value:parseFloat(fValue)||0,
      project:fProject, category:fCategory, status:fStatus, order_date:fOrder,
      delivery_date:fDelivery, notes:fNotes,
    };
    editId ? updateMut.mutate({id:editId,data:payload}) : createMut.mutate(payload);
    setShowModal(false);
  }
  function advanceStatus(po: AnyRow) {
    const order: string[] = ['pending_approval','ordered','pending_delivery','on_site','delivered'];
    const cur = order.indexOf(String(po.status??'ordered'));
    if (cur < order.length - 1) {
      updateMut.mutate({id:String(po.id), data:{status:order[cur+1]}});
      toast.success(`Advanced to "${order[cur+1]}"`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Procurement</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors">
          <Plus className="w-4 h-4"/>Raise PO
        </button>
      </div>

      {awaitingApproval > 0 && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0"/>
          <p className="text-yellow-300 text-sm font-medium">{awaitingApproval} purchase order{awaitingApproval>1?'s':''} awaiting approval.</p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'POs Raised',         value:String(pos.length),       col:'text-blue-400'  },
          {label:'Total Value',        value:`£${(totalValue/1000).toFixed(0)}K`, col:'text-white'},
          {label:'Pending Delivery',   value:String(pendingDelivery),  col:'text-orange-400'},
          {label:'Delivered',          value:String(delivered),        col:'text-green-400' },
        ].map(({label,value,col})=>(
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${col}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 border-b border-gray-700">
        {([
          { key:'all'       as const, label:'All Orders',        count:pos.length,          cls:'' },
          { key:'pending'   as const, label:'Pending Approval',   count:awaitingApproval,    cls:'bg-yellow-900/40 text-yellow-400' },
          { key:'ordered'   as const, label:'On Order',           count:pos.filter(p=>p.status==='ordered').length, cls:'bg-blue-900/40 text-blue-400' },
          { key:'delivery'  as const, label:'In Transit / On Site', count:pos.filter(p=>p.status==='pending_delivery'||p.status==='on_site').length, cls:'bg-orange-900/40 text-orange-400' },
          { key:'delivered' as const, label:'Delivered',          count:delivered,           cls:'bg-green-900/40 text-green-400' },
        ]).map(t=>(
          <button key={t.key} onClick={()=>setSubTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab===t.key?'border-blue-500 text-blue-400':'border-transparent text-gray-400 hover:text-gray-200'}`}>
            {t.label}
            {t.count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.cls||'bg-gray-800 text-gray-400'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search supplier, description, PO #…"
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"/>
        </div>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
          <option value="all">All Statuses</option>
          {STATUSES.map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>
        <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
          <option value="all">All Categories</option>
          {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading purchase orders…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/60 border-b border-gray-700">
                <tr>{['PO #','Supplier','Description','Category','Project','Value','Status','Delivery',''].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map(po=>{
                  const StatusIcon = STATUS_ICON[String(po.status??'')] ?? Package;
                  const isDelivered = po.status === 'delivered';
                  return (
                    <tr key={String(po.id)} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-blue-400 font-bold">{String(po.po_number??'—')}</td>
                      <td className="px-4 py-3 text-white font-medium">{String(po.supplier??'—')}</td>
                      <td className="px-4 py-3 text-gray-300 max-w-[200px] truncate">{String(po.description??'—')}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{String(po.category??'—')}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[140px] truncate">{String(po.project??'—')}</td>
                      <td className="px-4 py-3 text-white font-bold">{fmt(Number(po.value??0))}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium w-fit ${STATUS_COLOUR[String(po.status??'')]??'bg-gray-800 text-gray-600'}`}>
                          <StatusIcon className="w-3 h-3"/>
                          {String(po.status??'').replace('_',' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{String(po.delivery_date??po.deliveryDate??'—')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {!isDelivered && (
                            <button onClick={()=>advanceStatus(po)}
                              className="text-xs px-2 py-1 bg-blue-900/40 hover:bg-blue-800 text-blue-400 rounded font-medium transition-colors">
                              Advance
                            </button>
                          )}
                          <button onClick={()=>openEdit(po)} className="p-1 text-gray-400 hover:text-white rounded"><Edit2 className="w-3.5 h-3.5"/></button>
                          <button onClick={()=>{if(confirm('Delete PO?'))deleteMut.mutate(String(po.id));}} className="p-1 text-gray-400 hover:text-red-400 rounded"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-500">No purchase orders match the current filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-bold text-white">{editId?'Edit Purchase Order':'Raise Purchase Order'}</h2>
              <button onClick={()=>setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">PO Number</label>
                  <input value={fPO} onChange={e=>setFPO(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                  <select value={fStatus} onChange={e=>setFStatus(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                    {STATUSES.map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Supplier *</label>
                <input value={fSupplier} onChange={e=>setFSupplier(e.target.value)} placeholder="Supplier name" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Description *</label>
                <textarea value={fDesc} onChange={e=>setFDesc(e.target.value)} rows={2} placeholder="Materials / works description…" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-orange-500"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Value (£)</label>
                  <input type="number" value={fValue} onChange={e=>setFValue(e.target.value)} placeholder="0.00" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
                  <select value={fCategory} onChange={e=>setFCategory(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                    {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Project</label>
                <select value={fProject} onChange={e=>setFProject(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                  <option value="">— Select project —</option>
                  {projects.map(p=><option key={String(p.id)} value={String(p.name)}>{String(p.name)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Order Date</label>
                  <input type="date" value={fOrder} onChange={e=>setFOrder(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Expected Delivery</label>
                  <input type="date" value={fDelivery} onChange={e=>setFDelivery(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
                <textarea value={fNotes} onChange={e=>setFNotes(e.target.value)} rows={2} placeholder="Additional notes…" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-orange-500"/>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-800 sticky bottom-0 bg-gray-900">
              <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-semibold transition-colors">
                {editId?'Save Changes':'Raise PO'}
              </button>
              <button onClick={()=>setShowModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-2 text-sm font-semibold transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
