import { useState } from 'react';
import { Receipt, Plus, Search, PoundSterling, Calculator, CheckCircle, Clock, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { useCIS } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const CIS_RATES = [{ label:'Standard 20%', value:20 },{ label:'Higher Rate 30%', value:30 },{ label:'Gross (0% - Verified)', value:0 }];
const STATUS_OPTIONS = ['Draft','Submitted','Verified','Overdue'];
const TAX_PERIOD_OPTIONS = ['2024-25 P1','2024-25 P2','2024-25 P3','2024-25 P4','2024-25 P5','2024-25 P6','2024-25 P7','2024-25 P8','2024-25 P9','2024-25 P10','2024-25 P11','2024-25 P12','2025-26 P1','2025-26 P2','2025-26 P3','2025-26 P4','2025-26 P5'];

const statusColour: Record<string,string> = {
  'Draft':'bg-gray-100 text-gray-700','Submitted':'bg-blue-100 text-blue-800',
  'Verified':'bg-green-100 text-green-800','Overdue':'bg-red-100 text-red-700',
};

const emptyForm = { subcontractor_name:'',utr_number:'',tax_period:'',gross_payment:'',cis_rate:'20',labour_only:'',materials:'',status:'Draft',payment_date:'',notes:'' };

export function CIS() {
  const { useList, useCreate, useUpdate, useDelete } = useCIS;
  const { data: raw = [], isLoading } = useList();
  const returns = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState('all');
  function setTab(key: string, filter: string) { setSubTab(key); setStatusFilter(filter); }
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const filtered = returns.filter(r => {
    const name = String(r.subcontractor_name??'').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalGross = returns.reduce((s,r)=>s+Number(r.gross_payment??0),0);
  const totalDeduction = returns.reduce((s,r)=>{
    const gross = Number(r.gross_payment??0);
    const materials = Number(r.materials??0);
    const rate = Number(r.cis_rate??20)/100;
    return s + (gross - materials) * rate;
  },0);
  const submittedCount = returns.filter(r=>r.status==='Submitted').length;
  const overdueCount = returns.filter(r=>r.status==='Overdue').length;

  function calcDeduction(r: AnyRow) {
    const gross = Number(r.gross_payment??0);
    const materials = Number(r.materials??0);
    const rate = Number(r.cis_rate??20)/100;
    return (gross - materials) * rate;
  }
  function calcNet(r: AnyRow) {
    return Number(r.gross_payment??0) - calcDeduction(r);
  }

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(r: AnyRow) {
    setEditing(r);
    setForm({ subcontractor_name:String(r.subcontractor_name??''),utr_number:String(r.utr_number??''),tax_period:String(r.tax_period??''),gross_payment:String(r.gross_payment??''),cis_rate:String(r.cis_rate??'20'),labour_only:String(r.labour_only??''),materials:String(r.materials??''),status:String(r.status??'Draft'),payment_date:String(r.payment_date??''),notes:String(r.notes??'') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, gross_payment:Number(form.gross_payment)||0, cis_rate:Number(form.cis_rate)||20, labour_only:Number(form.labour_only)||0, materials:Number(form.materials)||0 };
    if (editing) { await updateMutation.mutateAsync({ id:String(editing.id), data:payload }); toast.success('CIS return updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('CIS return created'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this CIS return?')) return;
    await deleteMutation.mutateAsync(id); toast.success('CIS return deleted');
  }

  async function markSubmitted(r: AnyRow) {
    await updateMutation.mutateAsync({ id:String(r.id), data:{ status:'Submitted' } });
    toast.success('Marked as submitted to HMRC');
  }

  // Live calculation from form
  const formGross = Number(form.gross_payment)||0;
  const formMaterials = Number(form.materials)||0;
  const formRate = Number(form.cis_rate)||20;
  const formDeduction = (formGross - formMaterials) * (formRate/100);
  const formNet = formGross - formDeduction;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CIS Returns</h1>
          <p className="text-sm text-gray-500 mt-1">Construction Industry Scheme — monthly deduction records</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>New Return</span>
        </button>
      </div>

      {overdueCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0"/>
          <p className="text-sm text-red-700"><span className="font-semibold">{overdueCount} overdue return{overdueCount>1?'s':''}</span> — submit to HMRC to avoid penalties.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Gross Payments', value:`£${totalGross.toLocaleString()}`, icon:PoundSterling, colour:'text-blue-600', bg:'bg-blue-50' },
          { label:'Total CIS Deducted', value:`£${Math.round(totalDeduction).toLocaleString()}`, icon:Calculator, colour:'text-orange-600', bg:'bg-orange-50' },
          { label:'Submitted', value:submittedCount, icon:CheckCircle, colour:'text-green-600', bg:'bg-green-50' },
          { label:'Overdue', value:overdueCount, icon:Clock, colour:overdueCount>0?'text-red-600':'text-gray-600', bg:overdueCount>0?'bg-red-50':'bg-gray-50' },
        ].map(kpi=>(
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour}/></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-gray-900">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {([
          { key:'all', label:'All Returns', filter:'All', count:returns.length, cls:'' },
          { key:'draft', label:'Draft', filter:'Draft', count:returns.filter(r=>r.status==='Draft').length, cls:'' },
          { key:'submitted', label:'Submitted', filter:'Submitted', count:submittedCount, cls:'' },
          { key:'overdue', label:'Overdue', filter:'Overdue', count:overdueCount, cls:'bg-red-100 text-red-700' },
        ]).map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key, t.filter)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab===t.key?'border-orange-600 text-orange-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.cls||'bg-gray-100 text-gray-600'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search subcontractor…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Subcontractor','UTR','Tax Period','Gross','Materials','CIS Rate','Deduction','Net Pay','Status',''].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r=>{
                const deduction = calcDeduction(r);
                const net = calcNet(r);
                return (
                  <tr key={String(r.id)} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{String(r.subcontractor_name??'—')}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{String(r.utr_number??'—')}</td>
                    <td className="px-4 py-3 text-gray-600">{String(r.tax_period??'—')}</td>
                    <td className="px-4 py-3 text-gray-700">£{Number(r.gross_payment??0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">£{Number(r.materials??0).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{Number(r.cis_rate??20)}%</span></td>
                    <td className="px-4 py-3 font-semibold text-red-600">-£{Math.round(deduction).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">£{Math.round(net).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(r.status??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(r.status??'')}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {r.status === 'Draft' && <button onClick={()=>markSubmitted(r)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Submit"><CheckCircle size={14}/></button>}
                        <button onClick={()=>openEdit(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                        <button onClick={()=>handleDelete(String(r.id))} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><Receipt size={40} className="mx-auto mb-3 opacity-30"/><p>No CIS returns found</p></div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">{editing?'Edit CIS Return':'New CIS Return'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {(formGross > 0) && (
                <div className="grid grid-cols-3 gap-3 bg-blue-50 rounded-xl p-4 text-sm">
                  <div className="text-center"><p className="text-xs text-blue-600 mb-1">Gross Payment</p><p className="font-bold text-blue-900">£{formGross.toLocaleString()}</p></div>
                  <div className="text-center"><p className="text-xs text-red-600 mb-1">CIS Deduction</p><p className="font-bold text-red-700">-£{Math.round(formDeduction).toLocaleString()}</p></div>
                  <div className="text-center"><p className="text-xs text-green-600 mb-1">Net to Pay</p><p className="font-bold text-green-700">£{Math.round(formNet).toLocaleString()}</p></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subcontractor Name *</label>
                  <input required value={form.subcontractor_name} onChange={e=>setForm(f=>({...f,subcontractor_name:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UTR Number</label>
                  <input value={form.utr_number} onChange={e=>setForm(f=>({...f,utr_number:e.target.value}))} placeholder="10-digit UTR" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Period</label>
                  <select value={form.tax_period} onChange={e=>setForm(f=>({...f,tax_period:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select…</option>{TAX_PERIOD_OPTIONS.map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gross Payment (£)</label>
                  <input type="number" value={form.gross_payment} onChange={e=>setForm(f=>({...f,gross_payment:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Materials (£)</label>
                  <input type="number" value={form.materials} onChange={e=>setForm(f=>({...f,materials:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CIS Deduction Rate</label>
                  <select value={form.cis_rate} onChange={e=>setForm(f=>({...f,cis_rate:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {CIS_RATES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <input type="date" value={form.payment_date} onChange={e=>setForm(f=>({...f,payment_date:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing?'Update Return':'Create Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
