import { useState } from 'react';
import { Receipt, Plus, Search, PoundSterling, Calculator, CheckCircle, Clock, Edit2, Trash2, X, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { useCIS } from '../../hooks/useData';
import { toast } from 'sonner';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { EmptyState } from '../ui/EmptyState';

type AnyRow = Record<string, unknown>;

const CIS_RATES = [{ label:'Standard 20%', value:20 },{ label:'Higher Rate 30%', value:30 },{ label:'Gross (0% - Verified)', value:0 }];
const STATUS_OPTIONS = ['Draft','Submitted','Verified','Overdue'];
const TAX_PERIOD_OPTIONS = ['2024-25 P1','2024-25 P2','2024-25 P3','2024-25 P4','2024-25 P5','2024-25 P6','2024-25 P7','2024-25 P8','2024-25 P9','2024-25 P10','2024-25 P11','2024-25 P12','2025-26 P1','2025-26 P2','2025-26 P3','2025-26 P4','2025-26 P5'];

const SUBCONTRACTORS_REGISTER = [
  { name:'Ace Scaffolding Ltd', utr:'1234567890', cisStatus:'Standard (20%)', verified:'2026-02-15', hmrcRef:'CIS-001-2026' },
  { name:'Elite Plastering', utr:'9876543210', cisStatus:'Higher (30%)', verified:'2026-01-20', hmrcRef:'CIS-002-2026' },
  { name:'FastFix Electrical', utr:'5555444433', cisStatus:'Gross (0%)', verified:'2026-03-01', hmrcRef:'CIS-003-2026' },
  { name:'Ground Force Excavations', utr:'7777888899', cisStatus:'Unverified', verified:'—', hmrcRef:'—' },
  { name:'HeavyLift Plant Hire', utr:'2222111100', cisStatus:'Standard (20%)', verified:'2026-02-28', hmrcRef:'CIS-005-2026' },
];

const SUBMISSION_HISTORY = [
  { period:'Jan 2026', status:'Submitted', submitDate:'2026-02-10', totalDeductions:14280, penalties:0 },
  { period:'Dec 2025', status:'Accepted', submitDate:'2026-01-12', totalDeductions:12450, penalties:0 },
  { period:'Nov 2025', status:'Accepted', submitDate:'2025-12-11', totalDeductions:9870, penalties:0 },
  { period:'Oct 2025', status:'Accepted', submitDate:'2025-11-14', totalDeductions:11200, penalties:0 },
];

const STATUS_COLOUR_DARK: Record<string,string> = {
  'Draft':'bg-gray-700 text-gray-300','Submitted':'bg-blue-900 text-blue-300',
  'Verified':'bg-green-900 text-green-300','Overdue':'bg-red-900 text-red-300',
};

const SUBMISSION_STATUS_COLOUR: Record<string,string> = {
  'Draft':'bg-gray-700 text-gray-300','Submitted':'bg-blue-900 text-blue-300',
  'Accepted':'bg-green-900 text-green-300','Overdue':'bg-red-900 text-red-300',
};

const emptyForm = { subcontractor_name:'',utr_number:'',tax_period:'',gross_payment:'',cis_rate:'20',labour_only:'',materials:'',status:'Draft',payment_date:'',notes:'' };

export function CIS() {
  const { useList, useCreate, useUpdate, useDelete } = useCIS;
  const { data: raw = [], isLoading } = useList();
  const returns = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [mainTab, setMainTab] = useState<'returns'|'register'|'calculator'|'submissions'>('returns');
  const [subTab, setSubTab] = useState('all');
  function setTab(key: string, filter: string) { setSubTab(key); setStatusFilter(filter); }
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  // Calculator state
  const [calcGross, setCalcGross] = useState('');
  const [calcMaterials, setCalcMaterials] = useState('');
  const [calcRate, setCalcRate] = useState('20');

  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} CIS return(s)?`)) return;
    try {
      await Promise.all(ids.map(id => deleteMutation.mutateAsync(id)));
      toast.success(`Deleted ${ids.length} CIS return(s)`);
      clearSelection();
    } catch {
      toast.error('Bulk delete failed');
    }
  }

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
  const verifiedCount = returns.filter(r=>r.status==='Verified').length;
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

  // Calculator calculations
  const calcGrossNum = Number(calcGross)||0;
  const calcMatNum = Number(calcMaterials)||0;
  const calcRateNum = Number(calcRate)||20;
  const calcNetPaymentSubject = calcGrossNum - calcMatNum;
  const calcDeductionAmount = calcNetPaymentSubject * (calcRateNum/100);
  const calcNetPayment = calcGrossNum - calcDeductionAmount;

  return (
    <div className="space-y-6 bg-gray-900 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">CIS Management</h1>
          <p className="text-sm text-gray-400 mt-1">Construction Industry Scheme — tax deduction tracking</p>
        </div>
        {mainTab==='returns' && (
          <button type="button" onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={16}/><span>New Return</span>
          </button>
        )}
      </div>

      {overdueCount > 0 && (
        <div className="flex items-center gap-3 bg-red-900/30 border border-red-700 rounded-xl px-4 py-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0"/>
          <p className="text-sm text-red-300"><span className="font-semibold">{overdueCount} overdue return{overdueCount>1?'s':''}</span> — submit to HMRC to avoid penalties.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Gross Payments', value:`£${totalGross.toLocaleString()}`, icon:PoundSterling, colour:'text-blue-400', bg:'bg-blue-900/30' },
          { label:'Total CIS Deducted', value:`£${Math.round(totalDeduction).toLocaleString()}`, icon:Calculator, colour:'text-orange-400', bg:'bg-orange-900/30' },
          { label:'Submitted', value:submittedCount, icon:CheckCircle, colour:'text-green-400', bg:'bg-green-900/30' },
          { label:'Overdue', value:overdueCount, icon:Clock, colour:overdueCount>0?'text-red-400':'text-gray-400', bg:overdueCount>0?'bg-red-900/30':'bg-gray-800' },
        ].map(kpi=>(
          <div key={kpi.label} className={`border border-gray-700 rounded-xl p-4 ${kpi.bg}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg"><kpi.icon size={20} className={kpi.colour}/></div>
              <div><p className="text-xs text-gray-400">{kpi.label}</p><p className="text-xl font-bold text-white">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {[
          {id:'returns', label:'Monthly Returns'},
          {id:'register', label:'Subcontractor Register'},
          {id:'calculator', label:'Deduction Calculator'},
          {id:'submissions', label:'Submission History'},
        ].map(t=>(
          <button type="button"  key={t.id} onClick={()=>setMainTab(t.id as 'returns'|'register'|'calculator'|'submissions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mainTab===t.id?'bg-orange-600 text-white':'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* RETURNS TAB */}
      {mainTab==='returns' && (
        <div className="space-y-6">
          <div className="flex gap-1 border-b border-gray-700 pb-2">
            {([
              { key:'all', label:'All Returns', filter:'All', count:returns.length },
              { key:'draft', label:'Draft', filter:'Draft', count:returns.filter(r=>r.status==='Draft').length },
              { key:'submitted', label:'Submitted', filter:'Submitted', count:submittedCount },
              { key:'verified', label:'Verified', filter:'Verified', count:verifiedCount },
              { key:'overdue', label:'Overdue', filter:'Overdue', count:overdueCount },
            ]).map(t=>(
              <button type="button"  key={t.key} onClick={()=>setTab(t.key, t.filter)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab===t.key?'border-orange-600 text-orange-600':'border-transparent text-gray-500 hover:text-gray-300'}`}>
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key==='overdue'?'bg-red-900/40 text-red-400':'bg-gray-700 text-gray-300'}`}>{t.count}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-center bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search subcontractor…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-700 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"/>
            </div>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm border border-gray-700 rounded-lg px-3 py-2 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
              {['All',...STATUS_OPTIONS].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>{['Subcontractor','UTR','Tax Period','Gross','Materials','CIS Rate','Deduction','Net Pay','Status',''].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filtered.map(r=>{
                    const deduction = calcDeduction(r);
                    const net = calcNet(r);
                    const isSelected = selectedIds.has(String(r.id));
                    return (
                      <tr key={String(r.id)} className="hover:bg-gray-900/40 transition-colors">
                        <td className="px-4 py-3">
                          <button type="button" onClick={e => { e.stopPropagation(); toggle(String(r.id)); }}>
                            {isSelected ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-medium text-white">{String(r.subcontractor_name??'—')}</td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{String(r.utr_number??'—')}</td>
                        <td className="px-4 py-3 text-gray-400">{String(r.tax_period??'—')}</td>
                        <td className="px-4 py-3 text-white">£{Number(r.gross_payment??0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-400">£{Number(r.materials??0).toLocaleString()}</td>
                        <td className="px-4 py-3"><span className="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full font-medium">{Number(r.cis_rate??20)}%</span></td>
                        <td className="px-4 py-3 font-semibold text-red-400">-£{Math.round(deduction).toLocaleString()}</td>
                        <td className="px-4 py-3 font-semibold text-green-400">£{Math.round(net).toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOUR_DARK[String(r.status??'')] ?? 'bg-gray-700 text-gray-300'}`}>{String(r.status??'')}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {r.status === 'Draft' && <button type="button" onClick={()=>markSubmitted(r)} className="p-1.5 text-green-400 hover:bg-green-900/30 rounded" title="Submit"><CheckCircle size={14}/></button>}
                            <button type="button" onClick={()=>openEdit(r)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded"><Edit2 size={14}/></button>
                            <button type="button" onClick={()=>handleDelete(String(r.id))} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded"><Trash2 size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <EmptyState
                  icon={Receipt}
                  title="No CIS returns found"
                  description="Submit your first Construction Industry Scheme return to get started."
                />
              )}
              <BulkActionsBar
                selectedIds={Array.from(selectedIds)}
                actions={[
                  { id: 'delete', label: 'Delete Selected', icon: Trash2, variant: 'danger', onClick: handleBulkDelete, confirm: 'This action cannot be undone.' },
                ]}
                onClearSelection={clearSelection}
              />
            </div>
          )}
        </div>
      )}

      {/* REGISTER TAB */}
      {mainTab==='register' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>{['Subcontractor','CIS Status','UTR (Masked)','HMRC Ref','Last Verified',''].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {SUBCONTRACTORS_REGISTER.map((sc, idx)=>{
                const statusColour = sc.cisStatus.includes('Gross')?'bg-green-900/40 text-green-300':sc.cisStatus.includes('Standard')?'bg-blue-900/40 text-blue-300':sc.cisStatus.includes('Higher')?'bg-orange-900/40 text-orange-300':'bg-gray-700 text-gray-300';
                const maskUtr = '****' + sc.utr.slice(-4);
                return (
                  <tr key={idx} className="hover:bg-gray-900/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{sc.name}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour}`}>{sc.cisStatus}</span></td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{maskUtr}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{sc.hmrcRef}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{sc.verified}</td>
                    <td className="px-4 py-3"><button className="p-1.5 text-gray-400 hover:text-blue-400 rounded"><Edit2 size={14}/></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CALCULATOR TAB */}
      {mainTab==='calculator' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-900/40 to-orange-900/20 border border-orange-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">CIS Deduction Calculator</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Gross Payment (£)</label>
                <input type="number" value={calcGross} onChange={e=>setCalcGross(e.target.value)} placeholder="0" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Materials Cost (£)</label>
                <input type="number" value={calcMaterials} onChange={e=>setCalcMaterials(e.target.value)} placeholder="0" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">CIS Rate</label>
                <select value={calcRate} onChange={e=>setCalcRate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="0">Gross (0%)</option>
                  <option value="20">Standard (20%)</option>
                  <option value="30">Higher (30%)</option>
                </select>
              </div>
            </div>

            {calcGrossNum > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <p className="text-xs text-gray-400 mb-2">Payment Subject to Deduction</p>
                  <p className="text-2xl font-bold text-blue-400">£{calcNetPaymentSubject.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-2">{calcGrossNum.toLocaleString()} - {calcMatNum.toLocaleString()}</p>
                </div>
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-2">CIS Deduction ({calcRateNum}%)</p>
                  <p className="text-2xl font-bold text-red-400">£{calcDeductionAmount.toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
                </div>
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-2">Net Payment to Subcontractor</p>
                  <p className="text-2xl font-bold text-green-400">£{calcNetPayment.toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h4 className="text-lg font-bold text-white mb-4">Monthly Return Generator</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>{['Subcontractor','Gross Payment','Materials','Net Subject','Rate','Deduction','Net Payment'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {returns.slice(0,5).map((r,idx)=>{
                    const ded = calcDeduction(r);
                    const net = calcNet(r);
                    const netSubj = Number(r.gross_payment??0) - Number(r.materials??0);
                    return (
                      <tr key={idx} className="hover:bg-gray-900/40">
                        <td className="px-4 py-3 text-white font-medium">{String(r.subcontractor_name??'—')}</td>
                        <td className="px-4 py-3 text-gray-300">£{Number(r.gross_payment??0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-400">£{Number(r.materials??0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-blue-400 font-semibold">£{netSubj.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-400">{Number(r.cis_rate??20)}%</td>
                        <td className="px-4 py-3 text-red-400 font-semibold">-£{Math.round(ded).toLocaleString()}</td>
                        <td className="px-4 py-3 text-green-400 font-bold">£{Math.round(net).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-white">Total This Return:</span>
                <span className="text-orange-400">£{Math.round(returns.slice(0,5).reduce((s,r)=>s+calcDeduction(r),0)).toLocaleString()}</span>
              </div>
              <button className="mt-4 w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg py-3 font-semibold transition-colors">
                Generate HMRC Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSIONS TAB */}
      {mainTab==='submissions' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>{['Period','Status','Submission Date','Total Deductions','Penalties',''].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {SUBMISSION_HISTORY.map((sub, idx)=>(
                <tr key={idx} className="hover:bg-gray-900/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{sub.period}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${SUBMISSION_STATUS_COLOUR[sub.status] ?? 'bg-gray-700 text-gray-300'}`}>{sub.status}</span></td>
                  <td className="px-4 py-3 text-gray-400">{sub.submitDate}</td>
                  <td className="px-4 py-3 text-white font-semibold">£{sub.totalDeductions.toLocaleString()}</td>
                  <td className="px-4 py-3">{sub.penalties===0?<span className="text-green-400 font-medium">None</span>:<span className="text-red-400 font-bold">£{sub.penalties.toLocaleString()}</span>}</td>
                  <td className="px-4 py-3"><button className="p-1.5 text-gray-400 hover:text-blue-400 rounded"><Edit2 size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <h2 className="text-lg font-semibold text-white">{editing?'Edit CIS Return':'New CIS Return'}</h2>
              <button type="button" onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {(formGross > 0) && (
                <div className="grid grid-cols-3 gap-3 bg-blue-900/30 border border-blue-700 rounded-xl p-4 text-sm">
                  <div className="text-center"><p className="text-xs text-blue-300 mb-1">Gross Payment</p><p className="font-bold text-blue-200">£{formGross.toLocaleString()}</p></div>
                  <div className="text-center"><p className="text-xs text-red-300 mb-1">CIS Deduction</p><p className="font-bold text-red-200">-£{Math.round(formDeduction).toLocaleString()}</p></div>
                  <div className="text-center"><p className="text-xs text-green-300 mb-1">Net to Pay</p><p className="font-bold text-green-200">£{Math.round(formNet).toLocaleString()}</p></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Subcontractor Name *</label>
                  <input required value={form.subcontractor_name} onChange={e=>setForm(f=>({...f,subcontractor_name:e.target.value}))} className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">UTR Number</label>
                  <input value={form.utr_number} onChange={e=>setForm(f=>({...f,utr_number:e.target.value}))} placeholder="10-digit UTR" className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tax Period</label>
                  <select value={form.tax_period} onChange={e=>setForm(f=>({...f,tax_period:e.target.value}))} className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select…</option>{TAX_PERIOD_OPTIONS.map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Gross Payment (£)</label>
                  <input type="number" value={form.gross_payment} onChange={e=>setForm(f=>({...f,gross_payment:e.target.value}))} className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Materials (£)</label>
                  <input type="number" value={form.materials} onChange={e=>setForm(f=>({...f,materials:e.target.value}))} className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">CIS Deduction Rate</label>
                  <select value={form.cis_rate} onChange={e=>setForm(f=>({...f,cis_rate:e.target.value}))} className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {CIS_RATES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Payment Date</label>
                  <input type="date" value={form.payment_date} onChange={e=>setForm(f=>({...f,payment_date:e.target.value}))} className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-900 text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors">
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
