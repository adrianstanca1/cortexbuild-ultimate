// Module: Accounting — CortexBuild Ultimate
import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { FileText, AlertCircle, Plus, Edit2, Trash2, X, CheckCircle2, PoundSterling, CheckSquare, Square } from 'lucide-react';
import { useProjects, useInvoices } from '../../hooks/useData';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;
const INVOICE_STATUSES = ['draft','sent','paid','overdue','disputed'];
const CASH_DATA = [
  { month:'Sep', cashIn:485000, cashOut:342000, balance:143000 },
  { month:'Oct', cashIn:612000, cashOut:445000, balance:310000 },
  { month:'Nov', cashIn:534000, cashOut:378000, balance:622000 },
  { month:'Dec', cashIn:298000, cashOut:225000, balance:695000 },
  { month:'Jan', cashIn:721000, cashOut:512000, balance:904000 },
  { month:'Feb', cashIn:856000, cashOut:601000, balance:1159000 },
  { month:'Mar', cashIn:943000, cashOut:648000, balance:1454000 },
];
const BUDGET_CHART_DATA = [
  { project:'Acme Tower', budget:450000, spent:320000, remaining:130000 },
  { project:'Smith Complex', budget:680000, spent:510000, remaining:170000 },
  { project:'Green Park', budget:320000, spent:210000, remaining:110000 },
  { project:'Riverside Phase 2', budget:920000, spent:690000, remaining:230000 },
];

const STATUS_COLOUR: Record<string,string> = {
  draft:'bg-gray-700 text-gray-300', sent:'bg-blue-900 text-blue-300',
  paid:'bg-green-900 text-green-300', overdue:'bg-red-900 text-red-300',
  disputed:'bg-yellow-900 text-yellow-300',
};

const BANK_TRANSACTIONS = [
  { date:'2026-03-20', description:'Client Invoice PAY-001', type:'debit', amount:45000, balance:1454000 },
  { date:'2026-03-19', description:'Material Supplier Invoice', type:'credit', amount:-28500, balance:1409000 },
  { date:'2026-03-18', description:'Subcontractor Payment SC-042', type:'credit', amount:-18000, balance:1437500 },
  { date:'2026-03-17', description:'Plant Hire Monthly', type:'credit', amount:-12300, balance:1455500 },
  { date:'2026-03-16', description:'Client Invoice PAY-003', type:'debit', amount:52000, balance:1467800 },
  { date:'2026-03-15', description:'Staff Payroll', type:'credit', amount:-64200, balance:1415800 },
  { date:'2026-03-14', description:'Insurance Premium', type:'credit', amount:-8400, balance:1480000 },
  { date:'2026-03-13', description:'Office Rent & Utilities', type:'credit', amount:-6500, balance:1488400 },
  { date:'2026-03-12', description:'Client Retainage Release', type:'debit', amount:22000, balance:1494900 },
  { date:'2026-03-11', description:'IT & Software Licenses', type:'credit', amount:-3200, balance:1472900 },
];

function fmt(n:number) {
  if (n>=1_000_000) return `£${(n/1_000_000).toFixed(2)}M`;
  if (n>=1_000)     return `£${(n/1_000).toFixed(0)}K`;
  return `£${n.toLocaleString()}`;
}

export function Accounting() {
  const [tab, setTab] = useState<'pl'|'invoices'|'cash'|'budget'|'vat'|'bank'>('pl');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]       = useState<string|null>(null);
  const [fNum, setFNum]           = useState('');
  const [fClient, setFClient]     = useState('');
  const [fProject, setFProject]   = useState('');
  const [fAmount, setFAmount]     = useState('');
  const [fStatus, setFStatus]     = useState('draft');
  const [fDue, setFDue]           = useState('');
  const [fDesc, setFDesc]         = useState('');

  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} item(s)?`)) return;
    try {
      await Promise.all(ids.map(id => deleteMut.mutateAsync(id)));
      toast.success(`Deleted ${ids.length} item(s)`);
      clearSelection();
    } catch {
      toast.error('Bulk delete failed');
    }
  }

  const { useList: useInvList, useCreate, useUpdate, useDelete } = useInvoices;
  const { useList: useProjList } = useProjects;
  const { data: rawInv=[], isLoading } = useInvList();
  const { data: rawProj=[] }           = useProjList();
  const invoices = rawInv  as AnyRow[];
  const projects = rawProj as AnyRow[];
  const createMut = useCreate();
  const updateMut = useUpdate();
  const deleteMut = useDelete();

  const totalRaised      = invoices.reduce((s,i)=>s+Number(i.amount??0),0);
  const totalPaid        = invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+Number(i.amount??0),0);
  const totalOverdue     = invoices.filter(i=>i.status==='overdue').reduce((s,i)=>s+Number(i.amount??0),0);
  const totalOutstanding = invoices.filter(i=>i.status==='sent'||i.status==='overdue').reduce((s,i)=>s+Number(i.amount??0),0);
  const overdueCount     = invoices.filter(i=>i.status==='overdue').length;

  function openCreate() {
    setEditId(null);
    setFNum(`INV-2026-${String(invoices.length+145).padStart(4,'0')}`);
    setFClient(''); setFProject(''); setFAmount(''); setFStatus('draft'); setFDue(''); setFDesc('');
    setShowModal(true);
  }
  function openEdit(inv:AnyRow) {
    setEditId(String(inv.id));
    setFNum(String(inv.number??inv.invoice_number??''));
    setFClient(String(inv.client??''));
    setFProject(String(inv.project??''));
    setFAmount(String(inv.amount??''));
    setFStatus(String(inv.status??'draft'));
    setFDue(String(inv.dueDate??inv.due_date??''));
    setFDesc(String(inv.description??''));
    setShowModal(true);
  }
  function handleSave() {
    if (!fClient||!fAmount) { toast.error('Client and amount required'); return; }
    const payload = { number:fNum, client:fClient, project:fProject, amount:parseFloat(fAmount)||0, status:fStatus, due_date:fDue, description:fDesc };
    if (editId) {
      updateMut.mutate({id:editId,data:payload});
    } else {
      createMut.mutate(payload);
    }
    setShowModal(false);
  }

  // P&L Statement data
  const revenueItems = [
    { label:'Contract Revenue', value:4850000 },
    { label:'Retention Released', value:245000 },
    { label:'Other Income', value:32000 },
  ];
  const totalRevenue = revenueItems.reduce((s,i)=>s+i.value,0);

  const costItems = [
    { label:'Direct Labour', value:1840000 },
    { label:'Materials', value:1320000 },
    { label:'Plant & Equipment', value:480000 },
    { label:'Subcontractors', value:560000 },
    { label:'Preliminaries', value:280000 },
  ];
  const totalCosts = costItems.reduce((s,i)=>s+i.value,0);
  const grossProfit = totalRevenue - totalCosts;
  const grossMargin = (grossProfit / totalRevenue) * 100;

  const overheads = [
    { label:'Management', value:240000 },
    { label:'Office', value:180000 },
    { label:'Insurance', value:45000 },
    { label:'IT', value:28000 },
  ];
  const totalOverheads = overheads.reduce((s,i)=>s+i.value,0);
  const netProfit = grossProfit - totalOverheads;
  const netMargin = (netProfit / totalRevenue) * 100;

  // VAT calculation
  const vatSalesOutputTax = totalRevenue * 0.20;
  const vatPurchasesInputTax = totalCosts * 0.20;
  const vatPayable = vatSalesOutputTax - vatPurchasesInputTax;

  // Bank reconciliation
  const openingBalance = 1454000;
  const totalReceiptsIn = BANK_TRANSACTIONS.filter(t=>t.type==='debit').reduce((s,t)=>s+Number(t.amount??0),0);
  const totalPaymentsOut = Math.abs(BANK_TRANSACTIONS.filter(t=>t.type==='credit').reduce((s,t)=>s+Number(t.amount??0),0));
  const closingBalance = openingBalance + totalReceiptsIn - totalPaymentsOut;

  const TABS=[{id:'pl',label:'P&L Statement'},{id:'vat',label:'VAT Return'},{id:'bank',label:'Bank Rec'},{id:'invoices',label:'Invoices'},{id:'cash',label:'Cash Flow'},{id:'budget',label:'Budget'}] as const;

  return (
    <div className="space-y-6 bg-gray-900 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Accounting &amp; Finance</h1>
        <button type="button" onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors">
          <Plus className="w-4 h-4"/>New Invoice
        </button>
      </div>

      {overdueCount>0 && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0"/>
          <p className="text-red-300 text-sm font-medium">{overdueCount} overdue invoice{overdueCount>1?'s':''} — {fmt(totalOverdue)} outstanding.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Total Raised',  value:fmt(totalRaised),      icon:FileText,      col:'text-blue-400'},
          {label:'Collected',     value:fmt(totalPaid),        icon:CheckCircle2,  col:'text-green-400'},
          {label:'Outstanding',   value:fmt(totalOutstanding), icon:PoundSterling, col:'text-yellow-400'},
          {label:'Overdue',       value:fmt(totalOverdue),     icon:AlertCircle,   col:'text-red-400'},
        ].map(({label,value,icon:Icon,col})=>(
          <div key={label} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm">{label}</p>
              <Icon className={`w-5 h-5 ${col}`}/>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap border-b border-gray-700 pb-2">
        {TABS.map(t=>(
          <button type="button"  key={t.id} onClick={()=>setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab===t.id?'bg-blue-600 text-white':'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab==='pl' && (
        <div className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Profit & Loss Statement — 2026 YTD</h3>

            <div className="space-y-6">
              {/* Revenue Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Revenue</h4>
                <div className="space-y-2 pl-4 border-l border-gray-700">
                  {revenueItems.map(item=>(
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-gray-300">{item.label}</span>
                      <span className="text-white font-mono">{fmt(item.value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold border-t border-gray-700 pt-2 mt-2">
                    <span className="text-white">Total Revenue</span>
                    <span className="text-green-400 font-mono">{fmt(totalRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Cost of Sales Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Cost of Sales</h4>
                <div className="space-y-2 pl-4 border-l border-gray-700">
                  {costItems.map(item=>(
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-gray-300 font-mono">{fmt(item.value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold border-t border-gray-700 pt-2 mt-2">
                    <span className="text-gray-300">Total Costs</span>
                    <span className="text-red-400 font-mono">{fmt(totalCosts)}</span>
                  </div>
                </div>
              </div>

              {/* Gross Profit */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                <div className="flex justify-between mb-2">
                  <span className="text-white font-semibold">Gross Profit</span>
                  <span className="text-blue-400 font-bold font-mono text-lg">{fmt(grossProfit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Gross Margin</span>
                  <span className="text-blue-300">{grossMargin.toFixed(1)}%</span>
                </div>
              </div>

              {/* Overheads Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Overheads</h4>
                <div className="space-y-2 pl-4 border-l border-gray-700">
                  {overheads.map(item=>(
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-gray-300 font-mono">{fmt(item.value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold border-t border-gray-700 pt-2 mt-2">
                    <span className="text-gray-300">Total Overheads</span>
                    <span className="text-red-400 font-mono">{fmt(totalOverheads)}</span>
                  </div>
                </div>
              </div>

              {/* Net Profit */}
              <div className="bg-gradient-to-r from-green-900/40 to-green-900/20 rounded-lg p-4 border border-green-700">
                <div className="flex justify-between mb-2">
                  <span className="text-white font-semibold">Net Profit</span>
                  <span className="text-green-400 font-bold font-mono text-lg">{fmt(netProfit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Net Margin</span>
                  <span className="text-green-300">{netMargin.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==='vat' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">VAT Return Calculator</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-semibold text-gray-300 mb-4">Tax Period</h4>
              <p className="text-2xl font-bold text-white">Jan - Mar 2026</p>
              <p className="text-sm text-gray-400 mt-1">Quarter 4 (FY 2025-26)</p>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-semibold text-gray-300 mb-4">Submission Status</h4>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                <span className="text-white font-semibold">Draft</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">Due: 30 April 2026</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-300 text-sm">Sales (Output Tax at 20%)</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">{fmt(vatSalesOutputTax)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs">On sales of</p>
                  <p className="text-white font-semibold">{fmt(totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-300 text-sm">Purchases (Input Tax at 20%)</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">-{fmt(vatPurchasesInputTax)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs">On costs of</p>
                  <p className="text-white font-semibold">{fmt(totalCosts)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-900/40 to-amber-900/20 border border-amber-700 rounded-lg p-4">
              <p className="text-gray-300 text-sm mb-2">Net VAT Payable</p>
              <p className="text-3xl font-bold text-amber-300">{fmt(vatPayable)}</p>
              <p className="text-xs text-gray-400 mt-3">Submit to HMRC by 30 April 2026</p>
            </div>
          </div>
        </div>
      )}

      {tab==='bank' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Bank Reconciliation</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-400 text-xs uppercase mb-1">Opening Balance</p>
              <p className="text-xl font-bold text-white">{fmt(openingBalance)}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-400 text-xs uppercase mb-1">Receipts In</p>
              <p className="text-xl font-bold text-green-400">+{fmt(totalReceiptsIn)}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <p className="text-gray-400 text-xs uppercase mb-1">Payments Out</p>
              <p className="text-xl font-bold text-red-400">-{fmt(totalPaymentsOut)}</p>
            </div>
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
              <p className="text-gray-300 text-xs uppercase mb-1">Closing Balance</p>
              <p className="text-xl font-bold text-blue-300">{fmt(closingBalance)}</p>
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-700 rounded-lg p-3 mb-4">
            <p className="text-green-300 text-sm font-medium">✓ Reconciled</p>
          </div>

          <h4 className="text-sm font-semibold text-gray-300 mb-3">Recent Transactions</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Description</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Debit</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Credit</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {BANK_TRANSACTIONS.map((t,idx)=>(
                  <tr key={idx} className="hover:bg-gray-900/30">
                    <td className="px-4 py-3 text-gray-300">{t.date}</td>
                    <td className="px-4 py-3 text-gray-300">{t.description}</td>
                    <td className="px-4 py-3 text-right text-green-400 font-mono">{t.type==='debit'?fmt(Number(t.amount)):''}</td>
                    <td className="px-4 py-3 text-right text-red-400 font-mono">{t.type==='credit'?fmt(Math.abs(Number(t.amount))):''}</td>
                    <td className="px-4 py-3 text-right text-white font-bold font-mono">{fmt(Number(t.balance))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='invoices' && (
        <>
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            {isLoading ? <div className="p-8 text-center text-gray-400">Loading…</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 border-b border-gray-700">
                    <tr>{['Invoice #','Client','Project','Amount','Status','Due',''].map(h=>(
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {invoices.map(inv=>{
                      const isSelected = selectedIds.has(String(inv.id));
                      return (
                      <tr key={String(inv.id)} className="hover:bg-gray-900/40 transition-colors">
                        <td className="px-4 py-3">
                          <button type="button" onClick={e => { e.stopPropagation(); toggle(String(inv.id)); }}>
                            {isSelected ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-blue-400 font-bold">{String(inv.number??inv.invoice_number??'—')}</td>
                        <td className="px-4 py-3 text-white font-medium">{String(inv.client??'—')}</td>
                        <td className="px-4 py-3 text-gray-400 max-w-[180px] truncate">{String(inv.project??'—')}</td>
                        <td className="px-4 py-3 text-white font-bold">{fmt(Number(inv.amount??0))}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOUR[String(inv.status??'')]??'bg-gray-700 text-gray-300'}`}>
                            {String(inv.status??'')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">{String(inv.dueDate??inv.due_date??'—')}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {inv.status!=='paid' && (
                              <button type="button" onClick={()=>updateMut.mutate({id:String(inv.id),data:{status:'paid'}})}
                                className="text-xs px-2 py-1 bg-green-900/40 hover:bg-green-800 text-green-400 rounded font-medium transition-colors">
                                Mark Paid
                              </button>
                            )}
                            <button type="button" onClick={()=>openEdit(inv)} className="p-1 text-gray-400 hover:text-white rounded"><Edit2 className="w-3.5 h-3.5"/></button>
                            <button type="button" onClick={()=>{if(confirm('Delete?'))deleteMut.mutate(String(inv.id));}} className="p-1 text-gray-400 hover:text-red-400 rounded"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <BulkActionsBar
            selectedIds={Array.from(selectedIds)}
            actions={[
              { id: 'delete', label: 'Delete Selected', icon: Trash2, variant: 'danger', onClick: handleBulkDelete, confirm: 'This action cannot be undone.' },
            ]}
            onClearSelection={clearSelection}
          />
        </>
      )}

      {tab==='cash' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Cash Position — Last 7 Months</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={CASH_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
              <XAxis dataKey="month" stroke="#9ca3af"/>
              <YAxis stroke="#9ca3af" tickFormatter={(v:number)=>`£${(v/1000).toFixed(0)}K`}/>
              <Tooltip contentStyle={{backgroundColor:'#1f2937',border:'1px solid #374151',borderRadius:8}} formatter={(v:number)=>`£${v.toLocaleString()}`}/>
              <Legend/>
              <Line type="monotone" dataKey="cashIn"  name="Cash In"       stroke="#10b981" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="cashOut" name="Cash Out"      stroke="#ef4444" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="balance" name="Running Balance" stroke="#3b82f6" strokeWidth={2.5}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab==='budget' && (
        <div className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Budget vs Actual — By Project</h3>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={BUDGET_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                <XAxis dataKey="project" stroke="#9ca3af"/>
                <YAxis stroke="#9ca3af" tickFormatter={(v:number)=>`£${(v/1000).toFixed(0)}K`}/>
                <Tooltip contentStyle={{backgroundColor:'#1f2937',border:'1px solid #374151',borderRadius:8}} formatter={(v:number)=>`£${v.toLocaleString()}`}/>
                <Legend/>
                <Bar dataKey="budget" name="Budget" fill="#3b82f6" radius={[4,4,0,0]}/>
                <Bar dataKey="spent" name="Spent" fill="#ef4444" radius={[4,4,0,0]}/>
                <Bar dataKey="remaining" name="Remaining" fill="#10b981" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>{['Project','Budget','Spent','Remaining','% Used','Status'].map(h=>(
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {projects.map(proj=>{
                    const budget=Number(proj.budget??0), spent=Number(proj.spent??0);
                    const pct=budget>0?(spent/budget)*100:0;
                    const rag=pct>90?'red':pct>70?'amber':'green';
                    return (
                      <tr key={String(proj.id)} className="hover:bg-gray-900/40 transition-colors">
                        <td className="px-5 py-4 font-medium text-white">{String(proj.name??'—')}</td>
                        <td className="px-5 py-4 text-gray-300">{fmt(Number(proj.contractValue??proj.contract_value??0))}</td>
                        <td className="px-5 py-4 font-semibold text-white">{fmt(budget)}</td>
                        <td className="px-5 py-4 text-gray-300">{fmt(spent)}</td>
                        <td className="px-5 py-4 font-semibold text-green-400">{fmt(budget-spent)}</td>
                        <td className="px-5 py-4 font-bold text-white">{pct.toFixed(1)}%</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${rag==='green'?'bg-green-900/40 text-green-400':rag==='amber'?'bg-yellow-900/40 text-yellow-400':'bg-red-900/40 text-red-400'}`}>
                            {rag==='green'?'On Budget':rag==='amber'?'Watch':'Over Budget'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">{editId?'Edit Invoice':'New Invoice'}</h2>
              <button type="button" onClick={()=>setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Invoice Number</label>
                  <input value={fNum} onChange={e=>setFNum(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                  <select value={fStatus} onChange={e=>setFStatus(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                    {INVOICE_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Client *</label>
                <input value={fClient} onChange={e=>setFClient(e.target.value)} placeholder="Client name" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Project</label>
                <select value={fProject} onChange={e=>setFProject(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                  <option value="">— Select project —</option>
                  {projects.map(p=><option key={String(p.id)} value={String(p.name)}>{String(p.name)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Amount (£) *</label>
                  <input type="number" value={fAmount} onChange={e=>setFAmount(e.target.value)} placeholder="0.00" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Due Date</label>
                  <input type="date" value={fDue} onChange={e=>setFDue(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                <textarea value={fDesc} onChange={e=>setFDesc(e.target.value)} rows={2} placeholder="Works description…" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-blue-500"/>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-700">
              <button type="button" onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-semibold transition-colors">
                {editId?'Save Changes':'Create Invoice'}
              </button>
              <button type="button" onClick={()=>setShowModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 text-sm font-semibold transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Accounting;
