import { useState } from 'react';
import { AlertTriangle, Plus, Search, ShieldCheck, AlertOctagon, Edit2, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useRiskRegister } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STATUS_OPTIONS = ['Open','Mitigated','Closed','Accepted','Transferred'];
const CATEGORIES = ['Health & Safety','Financial','Programme','Design','Environmental','Legal','Reputation','Force Majeure','Other'];
const LIKELIHOOD = ['Rare','Unlikely','Possible','Likely','Almost Certain'];
const IMPACT = ['Negligible','Minor','Moderate','Major','Catastrophic'];
const RATINGS: Record<string,number> = { 'Rare':1,'Unlikely':2,'Possible':3,'Likely':4,'Almost Certain':5,'Negligible':1,'Minor':2,'Moderate':3,'Major':4,'Catastrophic':5 };

const statusColour: Record<string,string> = {
  'Open':'bg-red-100 text-red-700','Mitigated':'bg-yellow-100 text-yellow-800',
  'Closed':'bg-green-100 text-green-800','Accepted':'bg-blue-100 text-blue-800','Transferred':'bg-purple-100 text-purple-700',
};

function riskScore(likelihood: string, impact: string): number {
  return (RATINGS[likelihood]??1)*(RATINGS[impact]??1);
}

function riskLevel(score: number): { label:string; colour:string; bg:string } {
  if (score >= 15) return { label:'Critical', colour:'text-red-700', bg:'bg-red-100' };
  if (score >= 9) return { label:'High', colour:'text-orange-700', bg:'bg-orange-100' };
  if (score >= 4) return { label:'Medium', colour:'text-yellow-700', bg:'bg-yellow-100' };
  return { label:'Low', colour:'text-green-700', bg:'bg-green-100' };
}

const emptyForm = { title:'',category:'Health & Safety',description:'',likelihood:'Possible',impact:'Moderate',status:'Open',owner:'',mitigation:'',contingency:'',project_id:'',review_date:'',notes:'' };

export function RiskRegister() {
  const { useList, useCreate, useUpdate, useDelete } = useRiskRegister;
  const { data: raw = [], isLoading } = useList();
  const risks = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState<'register'|'matrix'|'actions'>('register');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = risks.filter(r => {
    const title = String(r.title??'').toLowerCase();
    const matchSearch = title.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchCat = categoryFilter === 'All' || r.category === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const openCount = risks.filter(r=>r.status==='Open').length;
  const criticalCount = risks.filter(r=>{
    const score = riskScore(String(r.likelihood??''), String(r.impact??''));
    return score >= 15 && r.status === 'Open';
  }).length;
  const mitigatedCount = risks.filter(r=>r.status==='Mitigated').length;
  const closedCount = risks.filter(r=>r.status==='Closed').length;

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(r: AnyRow) {
    setEditing(r);
    setForm({ title:String(r.title??''),category:String(r.category??'Health & Safety'),description:String(r.description??''),likelihood:String(r.likelihood??'Possible'),impact:String(r.impact??'Moderate'),status:String(r.status??'Open'),owner:String(r.owner??''),mitigation:String(r.mitigation??''),contingency:String(r.contingency??''),project_id:String(r.project_id??''),review_date:String(r.review_date??''),notes:String(r.notes??'') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const score = riskScore(form.likelihood, form.impact);
    const payload = { ...form, risk_score: score };
    if (editing) { await updateMutation.mutateAsync({ id:String(editing.id), data:payload }); toast.success('Risk updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Risk added to register'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this risk?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Risk deleted');
  }

  async function mitigate(r: AnyRow) {
    await updateMutation.mutateAsync({ id:String(r.id), data:{ status:'Mitigated' } });
    toast.success('Risk marked as mitigated');
  }

  const formScore = riskScore(form.likelihood, form.impact);
  const formLevel = riskLevel(formScore);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Register</h1>
          <p className="text-sm text-gray-500 mt-1">Project risk identification, scoring & mitigation</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>Add Risk</span>
        </button>
      </div>

      {criticalCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertOctagon size={18} className="text-red-600"/>
          <p className="text-sm text-red-700"><span className="font-semibold">{criticalCount} critical risk{criticalCount>1?'s':''}</span> open — urgent mitigation required.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Open Risks', value:openCount, icon:AlertTriangle, colour:'text-red-600', bg:'bg-red-50' },
          { label:'Critical', value:criticalCount, icon:AlertOctagon, colour:criticalCount>0?'text-red-600':'text-gray-600', bg:criticalCount>0?'bg-red-50':'bg-gray-50' },
          { label:'Mitigated', value:mitigatedCount, icon:ShieldCheck, colour:'text-yellow-600', bg:'bg-yellow-50' },
          { label:'Closed', value:closedCount, icon:ShieldCheck, colour:'text-green-600', bg:'bg-green-50' },
        ].map(kpi=>(
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour}/></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-gray-900">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-tab nav */}
      <div className="flex gap-1 border-b border-gray-200">
        {([
          { key:'register', label:'Risk Register', icon:AlertTriangle, count:risks.length },
          { key:'matrix',   label:'Risk Matrix',   icon:ShieldCheck,   count:null },
          { key:'actions',  label:'Open Actions',  icon:AlertOctagon,  count:openCount },
        ] as const).map(t=>(
          <button key={t.key} onClick={()=>setSubTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab===t.key?'border-orange-600 text-orange-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={14}/>{t.label}
            {t.count!==null && <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key==='actions'&&t.count>0?'bg-red-100 text-red-700':'bg-gray-100 text-gray-600'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── RISK MATRIX tab ─────────────────────────────────── */}
      {subTab==='matrix' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-x-auto">
          <h3 className="font-semibold text-gray-900 mb-4">5×5 Risk Matrix</h3>
          <div className="text-xs text-gray-500 mb-2 ml-16">← Impact →</div>
          <div className="flex gap-2">
            <div className="flex flex-col justify-around text-xs text-gray-500 text-right w-14 flex-shrink-0 mb-1">
              {[...LIKELIHOOD].reverse().map(l=><div key={l} className="h-12 flex items-center justify-end pr-2">{l}</div>)}
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex gap-1 mb-1">
                {IMPACT.map(imp=><div key={imp} className="flex-1 text-center text-xs text-gray-500 truncate">{imp}</div>)}
              </div>
              {[...LIKELIHOOD].reverse().map(lik=>(
                <div key={lik} className="flex gap-1">
                  {IMPACT.map(imp=>{
                    const score = (RATINGS[lik]??1)*(RATINGS[imp]??1);
                    const level = riskLevel(score);
                    const cellRisks = risks.filter(r=>r.likelihood===lik&&r.impact===imp&&r.status==='Open');
                    return (
                      <div key={imp} className={`flex-1 h-12 rounded ${level.bg} flex flex-col items-center justify-center cursor-default relative group`} title={`${lik}×${imp}: Score ${score} (${level.label})`}>
                        <span className={`text-xs font-bold ${level.colour}`}>{score}</span>
                        {cellRisks.length>0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-800 text-white text-xs rounded-full flex items-center justify-center font-bold">{cellRisks.length}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4 mt-4 text-xs">
            {[{label:'Low (1–3)',colour:'bg-green-100 text-green-700'},{label:'Medium (4–8)',colour:'bg-yellow-100 text-yellow-700'},{label:'High (9–14)',colour:'bg-orange-100 text-orange-700'},{label:'Critical (15–25)',colour:'bg-red-100 text-red-700'}].map(l=>(
              <div key={l.label} className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded ${l.colour}`}/><span className="text-gray-600">{l.label}</span></div>
            ))}
            <div className="flex items-center gap-1.5 ml-auto"><span className="w-4 h-4 bg-gray-800 text-white text-xs rounded-full flex items-center justify-center">N</span><span className="text-gray-600">open risks in cell</span></div>
          </div>
        </div>
      )}

      {/* ── OPEN ACTIONS tab ────────────────────────────────── */}
      {subTab==='actions' && (
        <div className="space-y-3">
          {risks.filter(r=>r.status==='Open').length===0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
              <ShieldCheck size={40} className="mx-auto mb-3 opacity-30 text-green-500"/>
              <p className="font-medium">No open risks</p>
            </div>
          ) : [...risks.filter(r=>r.status==='Open')].sort((a,b)=>riskScore(String(b.likelihood??''),String(b.impact??''))-riskScore(String(a.likelihood??''),String(a.impact??''))).map(r=>{
            const score = riskScore(String(r.likelihood??''),String(r.impact??''));
            const level = riskLevel(score);
            return (
              <div key={String(r.id??'')} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-14 text-center rounded-lg py-2 flex-shrink-0 ${level.bg}`}>
                    <p className={`text-sm font-bold ${level.colour}`}>{score}</p>
                    <p className={`text-xs ${level.colour}`}>{level.label}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{String(r.title??'Untitled')}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{String(r.category??'')} {r.owner?`· Owner: ${r.owner}`:''} {r.review_date?`· Review: ${r.review_date}`:''}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={()=>mitigate(r)} className="text-xs px-3 py-1 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 font-medium">Mark Mitigated</button>
                        <button onClick={()=>openEdit(r)} className="text-xs px-3 py-1 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 font-medium">Edit</button>
                      </div>
                    </div>
                    {!!r.mitigation && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2"><span className="font-medium text-gray-700">Mitigation: </span>{String(r.mitigation)}</p>}
                    {!!r.description && <p className="text-xs text-gray-500 mt-1">{String(r.description)}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── REGISTER tab ────────────────────────────────────── */}
      {subTab==='register' && <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search risks…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...CATEGORIES].map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} risks</span>
      </div>}

      {subTab==='register' && (isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><AlertTriangle size={40} className="mx-auto mb-3 opacity-30"/><p>No risks found</p></div>}
          {filtered.map(r => {
            const id = String(r.id??'');
            const isExp = expanded === id;
            const score = riskScore(String(r.likelihood??''), String(r.impact??''));
            const level = riskLevel(score);
            return (
              <div key={id}>
                <div className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer" onClick={()=>setExpanded(isExp?null:id)}>
                  <div className={`w-14 text-center rounded-lg py-2 flex-shrink-0 ${level.bg}`}>
                    <p className={`text-xs font-bold ${level.colour}`}>{score}</p>
                    <p className={`text-xs ${level.colour}`}>{level.label}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{String(r.title??'Untitled')}</p>
                    <p className="text-sm text-gray-500">{String(r.category??'')} {r.owner?`· Owner: ${r.owner}`:''}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <span className="text-xs text-gray-500">L:{String(r.likelihood??'—')} × I:{String(r.impact??'—')}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(r.status??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(r.status??'')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {r.status==='Open' && <button onClick={e=>{e.stopPropagation();mitigate(r);}} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded" title="Mitigate"><ShieldCheck size={14}/></button>}
                    <button onClick={e=>{e.stopPropagation();openEdit(r);}} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                    <button onClick={e=>{e.stopPropagation();handleDelete(id);}} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                    {isExp?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
                  </div>
                </div>
                {isExp && (
                  <div className="px-6 pb-4 bg-gray-50 space-y-3 text-sm">
                    {!!r.description && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p><p className="text-gray-700">{String(r.description)}</p></div>}
                    {!!r.mitigation && <div><p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-1">Mitigation Plan</p><p className="text-gray-700">{String(r.mitigation)}</p></div>}
                    {!!r.contingency && <div><p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Contingency</p><p className="text-gray-700">{String(r.contingency)}</p></div>}
                    {!!r.review_date && <div><p className="text-xs text-gray-400 mb-1">Review Date</p><p>{String(r.review_date)}</p></div>}
                    {!!r.notes && <div><p className="text-xs text-gray-400 mb-1">Notes</p><p className="text-gray-600">{String(r.notes)}</p></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">{editing?'Edit Risk':'Add Risk'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formScore > 0 && (
                <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${formLevel.bg}`}>
                  <span className={`text-lg font-black ${formLevel.colour}`}>{formScore}</span>
                  <div><p className={`text-sm font-semibold ${formLevel.colour}`}>{formLevel.label} Risk</p><p className="text-xs text-gray-500">Likelihood × Impact = Score</p></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Risk Title *</label>
                  <input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                  <input value={form.owner} onChange={e=>setForm(f=>({...f,owner:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Likelihood</label>
                  <select value={form.likelihood} onChange={e=>setForm(f=>({...f,likelihood:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {LIKELIHOOD.map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Impact</label>
                  <select value={form.impact} onChange={e=>setForm(f=>({...f,impact:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {IMPACT.map(i=><option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review Date</label>
                  <input type="date" value={form.review_date} onChange={e=>setForm(f=>({...f,review_date:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mitigation Plan</label>
                  <textarea rows={2} value={form.mitigation} onChange={e=>setForm(f=>({...f,mitigation:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contingency</label>
                  <textarea rows={2} value={form.contingency} onChange={e=>setForm(f=>({...f,contingency:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing?'Update Risk':'Add Risk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
