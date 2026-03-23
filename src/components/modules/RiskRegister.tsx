import { useState } from 'react';
import { AlertTriangle, Plus, Search, ShieldCheck, AlertOctagon, Edit2, Trash2, X, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { useRiskRegister } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STATUS_OPTIONS = ['Open','Mitigated','Closed','Accepted','Transferred'];
const CATEGORIES = ['Health & Safety','Financial','Programme','Design','Environmental','Legal','Reputation','Force Majeure','Other'];
const LIKELIHOOD = ['Rare','Unlikely','Possible','Likely','Almost Certain'];
const IMPACT = ['Negligible','Minor','Moderate','Major','Catastrophic'];
const RESPONSE_TYPES = ['Avoid','Reduce','Transfer','Accept'];
const RATINGS: Record<string,number> = { 'Rare':1,'Unlikely':2,'Possible':3,'Likely':4,'Almost Certain':5,'Negligible':1,'Minor':2,'Moderate':3,'Major':4,'Catastrophic':5 };

const statusColour: Record<string,string> = {
  'Open':'bg-red-100 text-red-700','Mitigated':'bg-yellow-100 text-yellow-800',
  'Closed':'bg-green-100 text-green-800','Accepted':'bg-blue-100 text-blue-800','Transferred':'bg-purple-100 text-purple-700',
};

function riskScore(likelihood: string, impact: string): number {
  return (RATINGS[likelihood]??1)*(RATINGS[impact]??1);
}

function riskLevel(score: number): { label:string; colour:string; bg:string; textColour: string } {
  if (score >= 15) return { label:'Critical', colour:'text-red-700', bg:'bg-red-100', textColour:'text-red-300' };
  if (score >= 9) return { label:'High', colour:'text-orange-700', bg:'bg-orange-100', textColour:'text-orange-300' };
  if (score >= 4) return { label:'Medium', colour:'text-yellow-700', bg:'bg-yellow-100', textColour:'text-yellow-300' };
  return { label:'Low', colour:'text-green-700', bg:'bg-green-100', textColour:'text-green-300' };
}

const emptyForm = { title:'',category:'Health & Safety',description:'',likelihood:'Possible',impact:'Moderate',status:'Open',owner:'',response_type:'Reduce',mitigation:'',contingency:'',residual_likelihood:'Unlikely',residual_impact:'Minor',project_id:'',review_date:'',notes:'' };

export function RiskRegister() {
  const { useList, useCreate, useUpdate, useDelete } = useRiskRegister;
  const { data: raw = [], isLoading } = useList();
  const risks = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState<'register'|'matrix'|'raid'|'trend'>('register');
  const [raidTab, setRaidTab] = useState<'risks'|'issues'|'assumptions'|'dependencies'>('risks');
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
  const highCount = risks.filter(r=>{
    const score = riskScore(String(r.likelihood??''), String(r.impact??''));
    return score >= 9 && score < 15 && r.status === 'Open';
  }).length;
  const mediumCount = risks.filter(r=>{
    const score = riskScore(String(r.likelihood??''), String(r.impact??''));
    return score >= 4 && score < 9 && r.status === 'Open';
  }).length;
  const lowCount = risks.filter(r=>{
    const score = riskScore(String(r.likelihood??''), String(r.impact??''));
    return score < 4 && r.status === 'Open';
  }).length;
  const mitigatedCount = risks.filter(r=>r.status==='Mitigated').length;
  const closedCount = risks.filter(r=>r.status==='Closed').length;

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(r: AnyRow) {
    setEditing(r);
    setForm({ title:String(r.title??''),category:String(r.category??'Health & Safety'),description:String(r.description??''),likelihood:String(r.likelihood??'Possible'),impact:String(r.impact??'Moderate'),status:String(r.status??'Open'),owner:String(r.owner??''),response_type:String(r.response_type??'Reduce'),mitigation:String(r.mitigation??''),contingency:String(r.contingency??''),residual_likelihood:String(r.residual_likelihood??'Unlikely'),residual_impact:String(r.residual_impact??'Minor'),project_id:String(r.project_id??''),review_date:String(r.review_date??''),notes:String(r.notes??'') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const score = riskScore(form.likelihood, form.impact);
    const residualScore = riskScore(form.residual_likelihood, form.residual_impact);
    const payload = { ...form, risk_score: score, residual_score: residualScore };
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
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Risk Register</h1>
          <p className="text-sm text-gray-400 mt-1">Project risk identification, scoring & mitigation</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>Add Risk</span>
        </button>
      </div>

      {criticalCount > 0 && (
        <div className="flex items-center gap-3 bg-red-900/30 border border-red-700 rounded-xl px-4 py-3">
          <AlertOctagon size={18} className="text-red-500"/>
          <p className="text-sm text-red-200"><span className="font-semibold">{criticalCount} critical risk{criticalCount>1?'s':''}</span> open — urgent mitigation required.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label:'Open Risks', value:openCount, dot:'bg-red-500' },
          { label:'Critical', value:criticalCount, dot:'bg-red-600' },
          { label:'High', value:highCount, dot:'bg-orange-500' },
          { label:'Medium', value:mediumCount, dot:'bg-yellow-500' },
          { label:'Mitigated', value:mitigatedCount, dot:'bg-green-500' },
        ].map(kpi=>(
          <div key={kpi.label} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${kpi.dot}`}/>
              <div><p className="text-xs text-gray-400">{kpi.label}</p><p className="text-xl font-bold text-white">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-gray-700 overflow-x-auto">
        {([
          { key:'register', label:'Risk Register', count:risks.length },
          { key:'matrix',   label:'Risk Matrix',   count:null },
          { key:'raid',     label:'RAID Log',      count:null },
          { key:'trend',    label:'Risk Trend',    count:null },
        ] as const).map(t=>(
          <button key={t.key} onClick={()=>setSubTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${subTab===t.key?'border-orange-500 text-orange-500':'border-transparent text-gray-400 hover:text-gray-300'}`}>
            {t.label}
            {t.count!==null && <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.count>0?'bg-gray-700 text-gray-400':'bg-gray-700 text-gray-400'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── RISK MATRIX tab ─────────────────────────────────── */}
      {subTab==='matrix' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 overflow-x-auto">
          <h3 className="font-semibold text-white mb-4">5×5 Risk Matrix</h3>
          <div className="text-xs text-gray-400 mb-2 ml-16">← Impact →</div>
          <div className="flex gap-2">
            <div className="flex flex-col justify-around text-xs text-gray-400 text-right w-14 flex-shrink-0 mb-1">
              {[...LIKELIHOOD].reverse().map(l=><div key={l} className="h-12 flex items-center justify-end pr-2">{l}</div>)}
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex gap-1 mb-1">
                {IMPACT.map(imp=><div key={imp} className="flex-1 text-center text-xs text-gray-400 truncate">{imp}</div>)}
              </div>
              {[...LIKELIHOOD].reverse().map(lik=>(
                <div key={lik} className="flex gap-1">
                  {IMPACT.map(imp=>{
                    const score = (RATINGS[lik]??1)*(RATINGS[imp]??1);
                    const level = riskLevel(score);
                    const cellRisks = risks.filter(r=>r.likelihood===lik&&r.impact===imp&&r.status==='Open');
                    const bgMap: Record<number, string> = {1:'bg-green-900/40', 2:'bg-green-900/40', 3:'bg-green-900/40', 4:'bg-yellow-900/40', 5:'bg-yellow-900/40', 6:'bg-yellow-900/40', 7:'bg-orange-900/40', 8:'bg-orange-900/40', 9:'bg-orange-900/40', 10:'bg-orange-900/40', 12:'bg-orange-900/40', 15:'bg-red-900/40', 16:'bg-red-900/40', 20:'bg-red-900/40', 25:'bg-red-900/40'};
                    return (
                      <div key={imp} className={`flex-1 h-12 rounded ${bgMap[score]??'bg-gray-800'} border border-gray-700 flex flex-col items-center justify-center cursor-default relative group`} title={`${lik}×${imp}: Score ${score} (${level.label})`}>
                        <span className={`text-xs font-bold ${level.textColour}`}>{score}</span>
                        {cellRisks.length>0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-300 text-gray-900 text-xs rounded-full flex items-center justify-center font-bold">{cellRisks.length}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-xs">
            {[{label:'Low (1–3)',colour:'bg-green-900/40 border border-green-700'},{label:'Medium (4–8)',colour:'bg-yellow-900/40 border border-yellow-700'},{label:'High (9–14)',colour:'bg-orange-900/40 border border-orange-700'},{label:'Critical (15–25)',colour:'bg-red-900/40 border border-red-700'}].map(l=>(
              <div key={l.label} className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded ${l.colour}`}/><span className="text-gray-400">{l.label}</span></div>
            ))}
          </div>
        </div>
      )}

      {/* ── RAID LOG tab ────────────────────────────────────── */}
      {subTab==='raid' && (
        <>
          <div className="flex gap-1 border-b border-gray-700">
            {[
              { key:'risks', label:'Risks' },
              { key:'issues', label:'Issues' },
              { key:'assumptions', label:'Assumptions' },
              { key:'dependencies', label:'Dependencies' },
            ].map(t=>(
              <button key={t.key} onClick={()=>setRaidTab(t.key as any)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${raidTab===t.key?'border-orange-500 text-orange-500':'border-transparent text-gray-400 hover:text-gray-300'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {raidTab === 'risks' && (
              <>
                {openCount === 0 ? (
                  <div className="text-center py-16 text-gray-500 bg-gray-800 rounded-xl border border-gray-700"><ShieldCheck size={40} className="mx-auto mb-3 opacity-30 text-green-500"/><p className="font-medium">No open risks</p></div>
                ) : (
                  risks.filter(r=>r.status==='Open').sort((a,b)=>riskScore(String(b.likelihood??''),String(b.impact??''))-riskScore(String(a.likelihood??''),String(a.impact?? ''))).map(r=>{
                    const score = riskScore(String(r.likelihood??''),String(r.impact??''));
                    const residualScore = riskScore(String(r.residual_likelihood??'Unlikely'), String(r.residual_impact??'Minor'));
                    const level = riskLevel(score);
                    return (
                      <div key={String(r.id??'')} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <p className="font-semibold text-white">{String(r.title??'Untitled')}</p>
                            <p className="text-sm text-gray-400 mt-0.5">{String(r.category??'')} {Boolean(r.owner)?`· Owner: ${r.owner}`:''}</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <div className={`px-2 py-1 rounded ${level.bg}`}>
                              <p className={`text-xs font-bold ${level.colour}`}>{score}</p>
                            </div>
                          </div>
                        </div>
                        {Boolean(r.response_type) && <p className="text-xs text-gray-400 mb-1">Response: <span className="text-gray-300 font-semibold">{String(r.response_type)}</span></p>}
                        {Boolean(r.mitigation) && <p className="text-xs text-gray-300 mb-2">Mitigation: {String(r.mitigation)}</p>}
                        <div className="flex gap-2 pt-2">
                          <button onClick={()=>mitigate(r)} className="text-xs px-3 py-1 bg-yellow-900/40 border border-yellow-700 text-yellow-300 rounded hover:bg-yellow-900/60 font-medium">Mark Mitigated</button>
                          <button onClick={()=>openEdit(r)} className="text-xs px-3 py-1 bg-orange-900/40 border border-orange-700 text-orange-300 rounded hover:bg-orange-900/60 font-medium">Edit</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {raidTab === 'issues' && (
              <div className="text-center py-12 text-gray-500 bg-gray-800 rounded-xl border border-gray-700">
                <AlertTriangle size={40} className="mx-auto mb-3 opacity-30"/>
                <p className="text-sm">Issues tracking coming soon</p>
              </div>
            )}

            {raidTab === 'assumptions' && (
              <div className="text-center py-12 text-gray-500 bg-gray-800 rounded-xl border border-gray-700">
                <AlertTriangle size={40} className="mx-auto mb-3 opacity-30"/>
                <p className="text-sm">Assumptions tracking coming soon</p>
              </div>
            )}

            {raidTab === 'dependencies' && (
              <div className="text-center py-12 text-gray-500 bg-gray-800 rounded-xl border border-gray-700">
                <AlertTriangle size={40} className="mx-auto mb-3 opacity-30"/>
                <p className="text-sm">Dependencies tracking coming soon</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── RISK TREND tab ────────────────────────────────────── */}
      {subTab==='trend' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-orange-500"/>
            <h3 className="font-semibold text-white">Risk Trend (6-month summary)</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { level: 'Critical', count: criticalCount, colour: 'bg-red-900/40 border-red-700' },
              { level: 'High', count: highCount, colour: 'bg-orange-900/40 border-orange-700' },
              { level: 'Medium', count: mediumCount, colour: 'bg-yellow-900/40 border-yellow-700' },
              { level: 'Low', count: lowCount, colour: 'bg-green-900/40 border-green-700' },
            ].map(item => (
              <div key={item.level} className={`${item.colour} border rounded-lg p-4 text-center`}>
                <p className="text-2xl font-bold text-white">{item.count}</p>
                <p className="text-xs text-gray-400 mt-1">{item.level}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">Detailed trend charts coming soon</p>
        </div>
      )}

      {/* ── REGISTER tab ────────────────────────────────────── */}
      {subTab==='register' && (
        <>
          <div className="flex flex-wrap gap-3 items-center bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search risks…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-600 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500"/>
            </div>
            <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="text-sm border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
              {['All',...CATEGORIES].map(c=><option key={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
              {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
            </select>
            <span className="text-sm text-gray-400 ml-auto">{filtered.length} risks</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
          ) : (
            <div className="space-y-3">
              {filtered.length === 0 && <div className="text-center py-16 text-gray-500 bg-gray-800 rounded-xl border border-gray-700"><AlertTriangle size={40} className="mx-auto mb-3 opacity-30"/><p>No risks found</p></div>}
              {filtered.map(r => {
                const id = String(r.id??'');
                const isExp = expanded === id;
                const score = riskScore(String(r.likelihood??''), String(r.impact??''));
                const residualScore = riskScore(String(r.residual_likelihood??'Unlikely'), String(r.residual_impact??'Minor'));
                const level = riskLevel(score);
                const residualLevel = riskLevel(residualScore);
                return (
                  <div key={id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors">
                    <div className="p-4 cursor-pointer hover:bg-gray-750" onClick={()=>setExpanded(isExp?null:id)}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{String(r.title??'Untitled')}</p>
                          <p className="text-sm text-gray-400">{String(r.category??'')} {Boolean(r.owner)?`· Owner: ${r.owner}`:''}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <div className={`px-2 py-1 rounded text-center ${level.bg}`}>
                            <p className={`text-xs font-bold ${level.colour}`}>{score}</p>
                            <p className={`text-xs ${level.colour}`}>{level.label}</p>
                          </div>
                          {residualScore < score && (
                            <div className={`px-2 py-1 rounded text-center border border-gray-600`}>
                              <p className="text-xs font-bold text-gray-300">{residualScore}</p>
                              <p className="text-xs text-gray-400">Residual</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {Boolean(r.status) && <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">{String(r.status)}</span>}
                          {isExp?<ChevronUp size={16} className="text-gray-500"/>:<ChevronDown size={16} className="text-gray-500"/>}
                        </div>
                      </div>
                    </div>
                    {isExp && (
                      <div className="px-6 pb-4 bg-gray-900/50 space-y-3 text-sm border-t border-gray-700">
                        {Boolean(r.description) && <div><p className="text-xs font-semibold text-gray-400 mb-1">DESCRIPTION</p><p className="text-gray-300">{String(r.description)}</p></div>}
                        <div className="grid grid-cols-2 gap-3">
                          <div><p className="text-xs text-gray-500 mb-1">Likelihood × Impact</p><p className="text-gray-300">{String(r.likelihood??'—')} × {String(r.impact??'—')}</p></div>
                          <div><p className="text-xs text-gray-500 mb-1">Response Type</p><p className="text-gray-300">{String(r.response_type??'—')}</p></div>
                        </div>
                        {Boolean(r.mitigation) && <div><p className="text-xs font-semibold text-yellow-400 mb-1">MITIGATION PLAN</p><p className="text-gray-300">{String(r.mitigation)}</p></div>}
                        {Boolean(r.contingency) && <div><p className="text-xs font-semibold text-blue-400 mb-1">CONTINGENCY</p><p className="text-gray-300">{String(r.contingency)}</p></div>}
                        {Boolean(r.review_date) && <div><p className="text-xs text-gray-500 mb-1">Review Date</p><p className="text-gray-300">{String(r.review_date)}</p></div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <h2 className="text-lg font-semibold text-white">{editing?'Edit Risk':'Add Risk'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formScore > 0 && (
                <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${formLevel.bg} border ${formLevel.colour}`}>
                  <span className={`text-lg font-black ${formLevel.textColour}`}>{formScore}</span>
                  <div><p className={`text-sm font-semibold ${formLevel.textColour}`}>{formLevel.label} Risk</p><p className="text-xs text-gray-400">Likelihood × Impact = Score</p></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Risk Title *</label>
                  <input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Owner</label>
                  <input value={form.owner} onChange={e=>setForm(f=>({...f,owner:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Likelihood</label>
                  <select value={form.likelihood} onChange={e=>setForm(f=>({...f,likelihood:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {LIKELIHOOD.map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Impact</label>
                  <select value={form.impact} onChange={e=>setForm(f=>({...f,impact:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {IMPACT.map(i=><option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Response Type</label>
                  <select value={form.response_type} onChange={e=>setForm(f=>({...f,response_type:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {RESPONSE_TYPES.map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Review Date</label>
                  <input type="date" value={form.review_date} onChange={e=>setForm(f=>({...f,review_date:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2 border-t border-gray-700 pt-4">
                  <p className="text-xs font-semibold text-gray-400 mb-3">Residual Risk (After Mitigation)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Residual Likelihood</label>
                      <select value={form.residual_likelihood} onChange={e=>setForm(f=>({...f,residual_likelihood:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                        {LIKELIHOOD.map(l=><option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Residual Impact</label>
                      <select value={form.residual_impact} onChange={e=>setForm(f=>({...f,residual_impact:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                        {IMPACT.map(i=><option key={i}>{i}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Mitigation Plan</label>
                  <textarea rows={2} value={form.mitigation} onChange={e=>setForm(f=>({...f,mitigation:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Contingency Plan</label>
                  <textarea rows={2} value={form.contingency} onChange={e=>setForm(f=>({...f,contingency:e.target.value}))} className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-sm text-gray-300 hover:bg-gray-700">Cancel</button>
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
