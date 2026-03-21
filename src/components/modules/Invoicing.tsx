// Module: Invoicing — CortexBuild Ultimate (Real Data)
import { useState } from 'react';
import { Plus, X, Loader2, FileText, Download, Send, Edit2, Trash2, RefreshCw, Search } from 'lucide-react';
import { useInvoices, useProjects } from '../../hooks/useData';
import clsx from 'clsx';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: 'Draft',    color: 'text-gray-400',   bg: 'bg-gray-700' },
  sent:     { label: 'Sent',     color: 'text-blue-400',   bg: 'bg-blue-500/20' },
  paid:     { label: 'Paid',     color: 'text-green-400',  bg: 'bg-green-500/20' },
  overdue:  { label: 'Overdue',  color: 'text-red-400',    bg: 'bg-red-500/20' },
  disputed: { label: 'Disputed', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
};

const defaultForm = {
  number: '', client: '', project: '', description: '',
  amount: '', vat: '', cis_deduction: '0',
  status: 'draft', issue_date: new Date().toISOString().split('T')[0],
  due_date: '', payment_terms: 'Net 30', bank_account: '', notes: '',
};
type FormData = typeof defaultForm;

type AnyRow = Record<string, unknown>;

export function Invoicing() {
  const { useList, useCreate, useUpdate, useDelete } = useInvoices;
  const { useList: useProjectList } = useProjects;
  const { data: rawInvoices = [], isLoading, refetch } = useList();
  const { data: rawProjects = [] } = useProjectList();
  const invoices = rawInvoices as AnyRow[];
  const projects = rawProjects as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState<'invoices'|'byproject'|'aged'>('invoices');
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = invoices
    .filter(inv => filter === 'all' || inv.status === filter)
    .filter(inv =>
      !search || String(inv.number).toLowerCase().includes(search.toLowerCase()) ||
      String(inv.client).toLowerCase().includes(search.toLowerCase())
    );

  const totals = {
    draft:   invoices.filter(i => i.status === 'draft').reduce((s, i) => s + Number(i.amount), 0),
    sent:    invoices.filter(i => i.status === 'sent').reduce((s, i) => s + Number(i.amount), 0),
    paid:    invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.amount), 0),
  };

  // By project breakdown
  const projectMap = new Map<string, { raised:number; paid:number; overdue:number; count:number }>();
  invoices.forEach(i => {
    const proj = String(i.project||i.client||'Unassigned');
    const e = projectMap.get(proj) ?? { raised:0, paid:0, overdue:0, count:0 };
    e.raised += Number(i.amount??0);
    if (i.status==='paid') e.paid += Number(i.amount??0);
    if (i.status==='overdue') e.overdue += Number(i.amount??0);
    e.count++;
    projectMap.set(proj, e);
  });
  const byProject = Array.from(projectMap.entries()).map(([name,v])=>({name,...v})).sort((a,b)=>b.raised-a.raised);

  // Aged debt
  const agedDebt = invoices.filter(i=>i.status==='overdue'||i.status==='sent').map(i => ({
    ...i,
    daysAge: i.due_date ? Math.max(0, Math.round((Date.now()-new Date(String(i.due_date)).getTime())/86400000)) : 0,
  } as AnyRow & { daysAge: number })).sort((a,b)=>b.daysAge-a.daysAge);

  const selectedInv = invoices.find(i => i.id === selectedId);

  const openCreate = () => {
    const nextNum = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`;
    setForm({ ...defaultForm, number: nextNum });
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (inv: Record<string, unknown>) => {
    setForm({
      number: String(inv.number ?? ''), client: String(inv.client ?? ''),
      project: String(inv.project ?? ''), description: String(inv.description ?? ''),
      amount: String(inv.amount ?? ''), vat: String(inv.vat ?? ''),
      cis_deduction: String(inv.cis_deduction ?? inv.cisDeduction ?? '0'),
      status: String(inv.status ?? 'draft'),
      issue_date: String(inv.issue_date ?? inv.issueDate ?? ''),
      due_date: String(inv.due_date ?? inv.dueDate ?? ''),
      payment_terms: String(inv.payment_terms ?? 'Net 30'),
      bank_account: String(inv.bank_account ?? ''),
      notes: String(inv.notes ?? ''),
    });
    setEditId(String(inv.id));
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      amount: Number(form.amount),
      vat: Number(form.vat),
      cis_deduction: Number(form.cis_deduction),
    };
    if (editId) {
      await updateMutation.mutateAsync({ id: editId, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setShowModal(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateMutation.mutateAsync({ id, data: { status: newStatus } });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    await deleteMutation.mutateAsync(id);
    setSelectedId(null);
  };

  const fmt = (n: number) => `£${Number(n).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Invoicing</h1>
          <p className="text-sm text-gray-400 mt-1">{invoices.length} invoices · {fmt(totals.paid)} collected</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:from-emerald-500 transition-all">
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      {/* Sub-tab nav */}
      <div className="flex gap-1 border-b border-gray-700 mb-6">
        {([
          { key:'invoices'  as const, label:'Invoices' },
          { key:'byproject' as const, label:'By Project' },
          { key:'aged'      as const, label:'Aged Debt', badge:agedDebt.filter(i=>i.status==='overdue').length },
        ]).map(t=>(
          <button key={t.key} onClick={()=>setSubTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab===t.key?'border-emerald-500 text-emerald-400':'border-transparent text-gray-400 hover:text-gray-200'}`}>
            {t.label}
            {'badge' in t && t.badge!=null && t.badge > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-900/60 text-red-400">{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── BY PROJECT tab ─── */}
      {subTab==='byproject' && (
        <div className="rounded-2xl border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>{['Project / Client','Invoices','Total Raised','Paid','Outstanding','Overdue'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {byProject.map(row=>(
                <tr key={row.name} className="hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                  <td className="px-4 py-3 text-gray-400">{row.count}</td>
                  <td className="px-4 py-3 text-white">{fmt(row.raised)}</td>
                  <td className="px-4 py-3 text-emerald-400">{fmt(row.paid)}</td>
                  <td className="px-4 py-3 text-blue-400">{fmt(row.raised-row.paid-row.overdue)}</td>
                  <td className="px-4 py-3 text-red-400">{row.overdue>0?fmt(row.overdue):'—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-800/50 border-t border-gray-700">
              <tr>
                <td className="px-4 py-3 font-semibold text-white">Total</td>
                <td className="px-4 py-3 text-gray-400">{invoices.length}</td>
                <td className="px-4 py-3 font-semibold text-white">{fmt(totals.sent+totals.paid+totals.overdue+totals.draft)}</td>
                <td className="px-4 py-3 font-semibold text-emerald-400">{fmt(totals.paid)}</td>
                <td className="px-4 py-3 font-semibold text-blue-400">{fmt(totals.sent)}</td>
                <td className="px-4 py-3 font-semibold text-red-400">{fmt(totals.overdue)}</td>
              </tr>
            </tfoot>
          </table>
          {byProject.length===0&&<div className="text-center py-12 text-gray-500"><FileText className="w-8 h-8 mx-auto mb-2 opacity-30"/><p>No invoices yet</p></div>}
        </div>
      )}

      {/* ── AGED DEBT tab ─── */}
      {subTab==='aged' && (
        <div className="rounded-2xl border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center gap-3">
            <span className="text-sm font-semibold text-white">Outstanding & Overdue Invoices</span>
            <span className="text-xs text-gray-400">Sorted by age</span>
          </div>
          {agedDebt.length===0 ? (
            <div className="text-center py-12 text-gray-500"><FileText className="w-8 h-8 mx-auto mb-2 opacity-30"/><p>No outstanding invoices</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-800/60 border-b border-gray-700">
                <tr>{['Invoice','Client / Project','Amount','Due Date','Age','Status'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {agedDebt.map(inv=>(
                  <tr key={String(inv.id??'')} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-mono text-gray-300">{String(inv.number??'—')}</td>
                    <td className="px-4 py-3 text-white">{String(inv.client??inv.project??'—')}</td>
                    <td className="px-4 py-3 font-semibold text-white">{fmt(Number(inv.amount??0))}</td>
                    <td className="px-4 py-3 text-gray-400">{String(inv.due_date??'—')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(inv.daysAge as number)>30?'bg-red-900/60 text-red-400':(inv.daysAge as number)>14?'bg-amber-900/60 text-amber-400':'bg-gray-700 text-gray-300'}`}>
                        {(inv.daysAge as number)===0?'Current':`${inv.daysAge}d`}
                      </span>
                    </td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${inv.status==='overdue'?'bg-red-900/60 text-red-400':'bg-blue-900/40 text-blue-400'}`}>{String(inv.status??'')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* KPI Cards */}
      {subTab==='invoices' && <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { key: 'sent',    label: 'Outstanding',  val: totals.sent,    cls: 'text-blue-400',   border: 'border-blue-800/50' },
          { key: 'paid',    label: 'Collected',    val: totals.paid,    cls: 'text-green-400',  border: 'border-green-800/50' },
          { key: 'overdue', label: 'Overdue',      val: totals.overdue, cls: 'text-red-400',    border: 'border-red-800/50' },
          { key: 'draft',   label: 'Draft',        val: totals.draft,   cls: 'text-gray-400',   border: 'border-gray-700' },
        ].map(({ key, label, val, cls, border }) => (
          <button key={key} onClick={() => setFilter(filter === key ? 'all' : key)}
            className={clsx('rounded-2xl border bg-gray-900 p-4 text-left hover:opacity-90 transition-all', border,
              filter === key && 'ring-2 ring-orange-500/30')}>
            <p className="text-xs text-gray-400">{label}</p>
            <p className={clsx('text-xl font-bold mt-1', cls)}>{fmt(val)}</p>
          </button>
        ))}
      </div>}

      {subTab==='invoices' && (<>
      {/* Search + Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
        </div>
        {Object.keys(statusConfig).map(s => (
          <button key={s} onClick={() => setFilter(filter === s ? 'all' : s)}
            className={clsx('rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
              filter === s ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700')}>
            {statusConfig[s].label}
          </button>
        ))}
      </div>

      {isLoading && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>}

      {/* Invoice Table */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {['Invoice #', 'Client', 'Project', 'Amount', 'VAT', 'CIS', 'Status', 'Due', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((inv: Record<string, unknown>) => {
                const cfg = statusConfig[String(inv.status)] ?? statusConfig.draft;
                return (
                  <tr key={String(inv.id)} className="hover:bg-gray-800/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedId(String(inv.id))}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-mono text-white font-medium whitespace-nowrap">{String(inv.number)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{String(inv.client)}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-[140px] truncate">{String(inv.project ?? '—')}</td>
                    <td className="px-4 py-3 text-white font-semibold whitespace-nowrap">{fmt(Number(inv.amount))}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmt(Number(inv.vat))}</td>
                    <td className="px-4 py-3 text-orange-400 whitespace-nowrap">-{fmt(Number(inv.cis_deduction ?? inv.cisDeduction ?? 0))}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap', cfg.bg, cfg.color)}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{String(inv.due_date ?? inv.dueDate ?? '—')}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(inv)} className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-blue-400 hover:bg-gray-700">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {String(inv.status) === 'draft' && (
                          <button onClick={() => handleStatusChange(String(inv.id), 'sent')}
                            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-green-400 hover:bg-gray-700" title="Mark as Sent">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {String(inv.status) === 'sent' && (
                          <button onClick={() => handleStatusChange(String(inv.id), 'paid')}
                            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-emerald-400 hover:bg-gray-700" title="Mark as Paid">
                            <span className="text-xs font-bold">✓</span>
                          </button>
                        )}
                        <button onClick={() => handleDelete(String(inv.id))} className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-gray-700">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No invoices found. <button onClick={openCreate} className="text-emerald-400 hover:text-emerald-300">Create one →</button>
          </div>
        )}
      </div>
      </>)}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 p-6 my-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{editId ? 'Edit Invoice' : 'New Invoice'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Invoice Number</label>
                <input required value={form.number} onChange={e => setForm(p => ({ ...p, number: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Client</label>
                <input required value={form.client} onChange={e => setForm(p => ({ ...p, client: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Project</label>
                <select value={form.project} onChange={e => setForm(p => ({ ...p, project: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                  <option value="">— Select project —</option>
                  {(projects as Array<Record<string, unknown>>).map(p => (
                    <option key={String(p.id)} value={String(p.name)}>{String(p.name)}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                <input required value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              {[
                { k: 'amount', label: 'Net Amount (£)' },
                { k: 'vat', label: 'VAT (£)' },
                { k: 'cis_deduction', label: 'CIS Deduction (£)' },
                { k: 'payment_terms', label: 'Payment Terms' },
              ].map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-medium text-gray-400 mb-1">{f.label}</label>
                  <input type={f.k !== 'payment_terms' ? 'number' : 'text'}
                    value={form[f.k as keyof FormData]}
                    onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                  {Object.keys(statusConfig).map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Issue Date</label>
                <input type="date" value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl bg-gray-800 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-700">Cancel</button>
                <button type="button" className="p-2.5 rounded-xl bg-gray-800 text-gray-400 hover:text-white" title="Download PDF">
                  <Download className="w-4 h-4" />
                </button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editId ? 'Save Changes' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selectedInv && !showModal && (
        <div className="fixed inset-0 z-40 flex" onClick={() => setSelectedId(null)}>
          <div className="flex-1" />
          <div className="w-full max-w-sm bg-gray-900 border-l border-gray-700 p-6 overflow-y-auto shadow-2xl"
               onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white font-mono">{String((selectedInv as Record<string,unknown>).number)}</h3>
              <button onClick={() => setSelectedId(null)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['Client', (selectedInv as Record<string,unknown>).client],
                ['Description', (selectedInv as Record<string,unknown>).description],
                ['Amount', fmt(Number((selectedInv as Record<string,unknown>).amount))],
                ['VAT', fmt(Number((selectedInv as Record<string,unknown>).vat))],
                ['CIS Deduction', `-${fmt(Number((selectedInv as Record<string,unknown>).cis_deduction ?? (selectedInv as Record<string,unknown>).cisDeduction ?? 0))}`],
                ['Status', statusConfig[String((selectedInv as Record<string,unknown>).status)]?.label],
                ['Due Date', (selectedInv as Record<string,unknown>).due_date ?? (selectedInv as Record<string,unknown>).dueDate],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">{String(k)}</span>
                  <span className="text-white font-medium text-right ml-4">{String(v ?? '—')}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => openEdit(selectedInv as Record<string, unknown>)}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 flex items-center justify-center gap-1">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => handleDelete(String((selectedInv as Record<string,unknown>).id))}
                className="rounded-xl bg-red-900/30 px-3 text-red-400 hover:bg-red-900/50 py-2.5">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
