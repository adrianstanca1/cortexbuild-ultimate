import { useState } from 'react';
import { Package, Plus, Search, Truck, AlertTriangle, CheckCircle, Clock, Edit2, Trash2, X, ChevronDown, ChevronUp, PoundSterling, PieChart as PieChartIcon, BarChart2 } from 'lucide-react';
import { useMaterials } from '../../hooks/useData';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STATUS_OPTIONS = ['On Order','In Transit','Delivered','On Site','Used','Returned'];
const UNITS = ['m','m²','m³','kg','tonne','nr','bag','roll','sheet','lm','set'];
const CATEGORIES = ['Concrete & Cement','Steel & Metalwork','Timber','Brickwork & Masonry','Roofing','Insulation','Electrical','Plumbing','Finishes','Plant Hire','PPE & Safety','Other'];
const WASTAGE_REASONS = ['Damaged','Over-ordered','Theft','Other'];

const statusColour: Record<string,string> = {
  'On Order':'bg-yellow-500/20 text-yellow-300','In Transit':'bg-blue-500/20 text-blue-300',
  'Delivered':'bg-green-500/20 text-green-300','On Site':'bg-purple-500/20 text-purple-300',
  'Used':'bg-gray-800 text-gray-400','Returned':'bg-gray-800 text-gray-400',
};

const emptyForm = { name:'',category:'',quantity:'',unit:'nr',unit_cost:'',min_stock:'',supplier:'',location:'',po_number:'',order_date:'',delivery_date:'',project_id:'',status:'On Order',notes:'' };

export function Materials() {
  const { useList, useCreate, useUpdate, useDelete } = useMaterials;
  const { data: raw = [], isLoading } = useList();
  const materials = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState<'inventory'|'orders'|'deliveries'|'wastage'|'suppliers'>('inventory');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [wastageLog, setWastageLog] = useState<AnyRow[]>([]);
  const [showWastageForm, setShowWastageForm] = useState(false);
  const [wastageForm, setWastageForm] = useState({ material: '', qty_wasted: '', reason: 'Damaged', cost: '' });

  const filtered = materials.filter(m => {
    const name = String(m.name ?? '').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || m.status === statusFilter;
    const matchCat = categoryFilter === 'All' || m.category === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const totalValue = materials.reduce((s, m) => s + Number(m.quantity ?? 0) * Number(m.unit_cost ?? 0), 0);
  const lowStockCount = materials.filter(m => Number(m.quantity ?? 0) < Number(m.min_stock ?? 1)).length;
  const onOrderCount = materials.filter(m => m.status === 'On Order').length;
  const pendingDelivery = materials.filter(m => m.status === 'In Transit').length;
  const overdueDeliveries = materials.filter(m => {
    if (!m.delivery_date || ['Delivered', 'On Site'].includes(String(m.status ?? ''))) return false;
    return new Date(String(m.delivery_date)) < new Date();
  }).length;
  const wasteTotal = wastageLog.reduce((s, w) => s + Number(w.cost ?? 0), 0);

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(m: AnyRow) {
    setEditing(m);
    setForm({ name: String(m.name ?? ''), category: String(m.category ?? ''), quantity: String(m.quantity ?? ''), unit: String(m.unit ?? 'nr'), unit_cost: String(m.unit_cost ?? ''), min_stock: String(m.min_stock ?? ''), supplier: String(m.supplier ?? ''), location: String(m.location ?? ''), po_number: String(m.po_number ?? ''), order_date: String(m.order_date ?? ''), delivery_date: String(m.delivery_date ?? ''), project_id: String(m.project_id ?? ''), status: String(m.status ?? 'On Order'), notes: String(m.notes ?? '') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, quantity: Number(form.quantity) || 0, unit_cost: Number(form.unit_cost) || 0, min_stock: Number(form.min_stock) || 0 };
    if (editing) { await updateMutation.mutateAsync({ id: String(editing.id), data: payload }); toast.success('Material updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Material added'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this material?')) return;
    await deleteMutation.mutateAsync(id);
    toast.success('Material deleted');
  }

  async function markDelivered(m: AnyRow) {
    await updateMutation.mutateAsync({ id: String(m.id), data: { status: 'Delivered' } });
    toast.success('Material marked as delivered');
  }

  function logWastage() {
    if (!wastageForm.material || !wastageForm.qty_wasted || !wastageForm.cost) {
      toast.error('Fill all wastage fields');
      return;
    }
    setWastageLog([...wastageLog, { ...wastageForm, id: Date.now() }]);
    setWastageForm({ material: '', qty_wasted: '', reason: 'Damaged', cost: '' });
    setShowWastageForm(false);
    toast.success('Wastage logged');
  }

  const uniqueCategories = ['All', ...Array.from(new Set(materials.map(m => String(m.category ?? '')).filter(Boolean)))];
  const uniqueSuppliers = Array.from(new Set(materials.map(m => String(m.supplier ?? '')).filter(Boolean)));

  const wastageByReason = WASTAGE_REASONS.map(reason => ({
    name: reason,
    value: wastageLog.filter(w => w.reason === reason).length,
    cost: wastageLog.filter(w => w.reason === reason).reduce((s, w) => s + Number(w.cost ?? 0), 0),
  })).filter(x => x.value > 0);

  const COLOURS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6'];

  const stockChartData = materials.map(m => ({
    name: String(m.name ?? '').slice(0, 12),
    'Current': Number(m.quantity ?? 0),
    'Minimum': Number(m.min_stock ?? 0),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Materials</h1>
          <p className="text-sm text-gray-400 mt-1">Inventory, orders & wastage tracking</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16} /><span>Add Material</span>
        </button>
      </div>

      {overdueDeliveries > 0 && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-red-400" />
          <p className="text-sm text-red-300"><span className="font-semibold">{overdueDeliveries} overdue deliver{overdueDeliveries > 1 ? 'ies' : 'y'}</span> — chase suppliers.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: materials.length, icon: Package, colour: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Low Stock Alerts', value: lowStockCount, icon: AlertTriangle, colour: lowStockCount > 0 ? 'text-red-400' : 'text-gray-400', bg: lowStockCount > 0 ? 'bg-red-500/10' : 'bg-gray-800' },
          { label: 'Orders Pending', value: onOrderCount + pendingDelivery, icon: Clock, colour: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Waste Cost MTD', value: `£${Math.round(wasteTotal).toLocaleString()}`, icon: PoundSterling, colour: 'text-orange-400', bg: 'bg-orange-500/10' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour} /></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-white">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-gray-700">
        {([
          { key: 'inventory', label: 'Inventory', count: materials.length },
          { key: 'orders', label: 'Orders', count: onOrderCount },
          { key: 'deliveries', label: 'Deliveries', count: pendingDelivery },
          { key: 'wastage', label: 'Wastage', count: wastageLog.length },
          { key: 'suppliers', label: 'Suppliers', count: uniqueSuppliers.length },
        ]).map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab === t.key ? 'border-orange-600 text-orange-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key === 'inventory' && lowStockCount > 0 ? 'bg-red-500/20 text-red-300' : 'bg-gray-800 text-gray-300'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-gray-900 rounded-xl border border-gray-700 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search material…" className="w-full pl-9 pr-4 py-2 text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="text-sm bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {uniqueCategories.map(c => <option key={c}>{c}</option>)}
        </select>
        {subTab === 'inventory' && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
            {['All', ...STATUS_OPTIONS].map(s => <option key={s}>{s}</option>)}
          </select>
        )}
      </div>

      {subTab === 'inventory' && (
        <>
          {isLoading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" /></div>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>{['Material', 'Category', 'Qty', 'Min Stock', 'Unit Cost', 'Value', 'Location', 'Status', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filtered.map(m => {
                    const total = Number(m.quantity ?? 0) * Number(m.unit_cost ?? 0);
                    const belowMin = Number(m.quantity ?? 0) < Number(m.min_stock ?? 0);
                    return (
                      <tr key={String(m.id)} className={`hover:bg-gray-800 ${belowMin ? 'bg-red-500/5' : ''}`}>
                        <td className="px-4 py-3 font-medium text-white">{String(m.name ?? '—')}</td>
                        <td className="px-4 py-3 text-gray-500 text-sm">{String(m.category ?? '—')}</td>
                        <td className="px-4 py-3 text-gray-300">{Number(m.quantity ?? 0)} {String(m.unit ?? '')}</td>
                        <td className={`px-4 py-3 ${belowMin ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>{Number(m.min_stock ?? 0)}</td>
                        <td className="px-4 py-3 text-gray-300">£{Number(m.unit_cost ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 font-semibold text-white">£{Math.round(total).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{String(m.location ?? '—')}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(m.status ?? '')] ?? 'bg-gray-800 text-gray-300'}`}>{String(m.status ?? '')}</span></td>
                        <td className="px-4 py-3"><div className="flex items-center gap-1"><button onClick={() => openEdit(m)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 rounded"><Edit2 size={14} /></button><button onClick={() => handleDelete(String(m.id))} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded"><Trash2 size={14} /></button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><Package size={40} className="mx-auto mb-3 opacity-30" /><p>No materials found</p></div>}
            </div>
          )}
        </>
      )}

      {subTab === 'orders' && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700"><p className="text-sm font-semibold text-white">Purchase Orders</p></div>
          <table className="w-full text-sm">
            <thead className="bg-gray-800/30 border-b border-gray-700">
              <tr>{['PO #', 'Supplier', 'Items', 'Total Value', 'Status', 'Delivery Date', 'Action'].map(h => <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {materials.filter(m => m.status === 'On Order' || m.status === 'In Transit').map(m => {
                const total = Number(m.quantity ?? 0) * Number(m.unit_cost ?? 0);
                return (
                  <tr key={String(m.id)} className="hover:bg-gray-800/50">
                    <td className="px-4 py-2.5 font-mono text-xs text-blue-400">{String(m.po_number ?? '—')}</td>
                    <td className="px-4 py-2.5 text-white">{String(m.supplier ?? '—')}</td>
                    <td className="px-4 py-2.5 text-gray-300">{Number(m.quantity ?? 0)} {String(m.unit ?? '')}</td>
                    <td className="px-4 py-2.5 font-semibold text-white">£{Math.round(total).toLocaleString()}</td>
                    <td className="px-4 py-2.5"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(m.status ?? '')] ?? 'bg-gray-800 text-gray-300'}`}>{String(m.status ?? '')}</span></td>
                    <td className="px-4 py-2.5 text-gray-400">{String(m.delivery_date ?? '—')}</td>
                    <td className="px-4 py-2.5">{m.status === 'In Transit' && <button onClick={() => markDelivered(m)} className="text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 font-medium">Deliver</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'deliveries' && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700"><p className="text-sm font-semibold text-white">Delivery Schedule</p></div>
          <table className="w-full text-sm">
            <thead className="bg-gray-800/30 border-b border-gray-700">
              <tr>{['Expected Date', 'Supplier', 'Items', 'Project', 'Received', 'Status'].map(h => <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {materials.filter(m => m.delivery_date).sort((a, b) => new Date(String(a.delivery_date ?? '')).getTime() - new Date(String(b.delivery_date ?? '')).getTime()).map(m => {
                const isOverdue = new Date(String(m.delivery_date ?? '')) < new Date();
                const isDelivered = m.status === 'Delivered' || m.status === 'On Site';
                return (
                  <tr key={String(m.id)} className={`hover:bg-gray-800/50 ${isOverdue && !isDelivered ? 'bg-red-500/5' : ''}`}>
                    <td className={`px-4 py-2.5 ${isOverdue && !isDelivered ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>{String(m.delivery_date ?? '—')}</td>
                    <td className="px-4 py-2.5 text-white">{String(m.supplier ?? '—')}</td>
                    <td className="px-4 py-2.5 text-gray-400">{Number(m.quantity ?? 0)} {String(m.unit ?? '')}</td>
                    <td className="px-4 py-2.5 text-gray-400">{String(m.project_id ?? '—')}</td>
                    <td className="px-4 py-2.5"><span className={`text-xs px-2 py-1 rounded-full ${isDelivered ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>{isDelivered ? '✓' : '—'}</span></td>
                    <td className="px-4 py-2.5"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(m.status ?? '')] ?? 'bg-gray-800 text-gray-300'}`}>{String(m.status ?? '')}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'wastage' && (
        <div className="space-y-4">
          <button onClick={() => setShowWastageForm(!showWastageForm)} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
            <Plus size={14} className="inline mr-2" />Log Wastage
          </button>

          {showWastageForm && (
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input value={wastageForm.material} onChange={e => setWastageForm({...wastageForm, material: e.target.value})} placeholder="Material name" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                <input type="number" value={wastageForm.qty_wasted} onChange={e => setWastageForm({...wastageForm, qty_wasted: e.target.value})} placeholder="Qty wasted" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                <select value={wastageForm.reason} onChange={e => setWastageForm({...wastageForm, reason: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                  {WASTAGE_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
                <input type="number" value={wastageForm.cost} onChange={e => setWastageForm({...wastageForm, cost: e.target.value})} placeholder="Cost (£)" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={logWastage} className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Log</button>
                <button onClick={() => setShowWastageForm(false)} className="px-3 py-1 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-white mb-4">Wastage by Reason</h3>
              {wastageByReason.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={wastageByReason} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {wastageByReason.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLOURS[index % COLOURS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-12">No wastage logged</p>
              )}
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-white mb-4">Wastage Summary</h3>
              <div className="space-y-2">
                {WASTAGE_REASONS.map(reason => {
                  const cost = wastageLog.filter(w => w.reason === reason).reduce((s, w) => s + Number(w.cost ?? 0), 0);
                  const count = wastageLog.filter(w => w.reason === reason).length;
                  return cost > 0 ? (
                    <div key={reason} className="flex justify-between">
                      <span className="text-gray-400">{reason}</span>
                      <span className="text-white font-semibold">£{Math.round(cost).toLocaleString()} ({count} incidents)</span>
                    </div>
                  ) : null;
                })}
                <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between">
                  <span className="text-gray-300 font-semibold">Total Waste Cost</span>
                  <span className="text-orange-400 font-bold">£{Math.round(wasteTotal).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'suppliers' && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>{['Supplier', 'Lead Time', 'Categories', 'Items Supplied', 'Total Orders'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {uniqueSuppliers.map(supplier => {
                const supplierItems = materials.filter(m => m.supplier === supplier);
                const cats = Array.from(new Set(supplierItems.map(m => String(m.category ?? '')).filter(Boolean)));
                const totalOrders = supplierItems.filter(m => m.status === 'On Order' || m.status === 'In Transit').length;
                return (
                  <tr key={supplier} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-white">{String(supplier)}</td>
                    <td className="px-4 py-3 text-gray-400">—</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{cats.slice(0, 2).join(', ')}{cats.length > 2 ? '...' : ''}</td>
                    <td className="px-4 py-3 text-gray-300">{supplierItems.length}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${totalOrders > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>{totalOrders}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Material' : 'Add Material'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Material Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select…</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Unit</label>
                  <select value={form.unit} onChange={e => setForm(f => ({...f, unit: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Quantity</label>
                  <input type="number" step="0.01" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Min Stock Level</label>
                  <input type="number" step="0.01" value={form.min_stock} onChange={e => setForm(f => ({...f, min_stock: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Unit Cost (£)</label>
                  <input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm(f => ({...f, unit_cost: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Supplier</label>
                  <input value={form.supplier} onChange={e => setForm(f => ({...f, supplier: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                  <input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">PO Number</label>
                  <input value={form.po_number} onChange={e => setForm(f => ({...f, po_number: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Delivery Date</label>
                  <input type="date" value={form.delivery_date} onChange={e => setForm(f => ({...f, delivery_date: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing ? 'Update Material' : 'Add Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
