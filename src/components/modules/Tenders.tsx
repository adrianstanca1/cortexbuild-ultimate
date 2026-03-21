import { useState } from 'react';
import { FileText, Plus, Search, TrendingUp, Clock, CheckCircle, Edit2, Trash2, X, ChevronRight, Building2, Calendar, PoundSterling } from 'lucide-react';
import { useTenders } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STAGES = ['Identified','Pre-Qualification','ITT Issued','Pricing','Submitted','Interview','Won','Lost','Withdrawn'];
const TYPES = ['Design & Build','Traditional','Two Stage','Framework','Negotiated','Minor Works'];

const stageColour: Record<string,string> = {
  'Identified':'bg-gray-700 text-gray-300',
  'Pre-Qualification':'bg-blue-900/50 text-blue-300',
  'ITT Issued':'bg-purple-900/50 text-purple-300',
  'Pricing':'bg-yellow-900/50 text-yellow-300',
  'Submitted':'bg-orange-900/50 text-orange-300',
  'Interview':'bg-indigo-900/50 text-indigo-300',
  'Won':'bg-green-900/50 text-green-300',
  'Lost':'bg-red-900/50 text-red-300',
  'Withdrawn':'bg-gray-700 text-gray-400',
};

const PIPELINE_STAGES = ['Identified','Pre-Qualification','ITT Issued','Pricing','Submitted'];

const emptyForm = { project_name:'',client:'',type:'',value:'',submission_date:'',result_date:'',stage:'Identified',probability:'',notes:'' };

export function Tenders() {
  const { useList, useCreate, useUpdate, useDelete } = useTenders;
  const { data: raw = [], isLoading } = useList();
  const tenders = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [stageGroup, setStageGroup] = useState<'all'|'active'|'won'|'lost'>('all');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [view, setView] = useState<'pipeline'|'list'>('pipeline');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const GROUP_STAGES: Record<string, string[]> = {
    all: [],
    active: ['Identified','Pre-Qualification','ITT Issued','Pricing','Submitted','Interview'],
    won: ['Won'],
    lost: ['Lost','Withdrawn'],
  };

  const filtered = tenders.filter(t => {
    const name = String(t.project_name??'').toLowerCase();
    const client = String(t.client??'').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || client.includes(search.toLowerCase());
    const matchStage = stageFilter === 'All' || t.stage === stageFilter;
    const groupStages = GROUP_STAGES[stageGroup] ?? [];
    const matchGroup = groupStages.length === 0 || groupStages.includes(String(t.stage??''));
    return matchSearch && matchStage && matchGroup;
  });

  const totalValue = tenders.reduce((s,t)=>s+Number(t.value??0),0);
  const wonCount = tenders.filter(t=>t.stage==='Won').length;
  const activeCount = tenders.filter(t=>!['Won','Lost','Withdrawn'].includes(String(t.stage??''))).length;
  const winRate = tenders.filter(t=>['Won','Lost'].includes(String(t.stage??''))).length > 0
    ? Math.round((wonCount / tenders.filter(t=>['Won','Lost'].includes(String(t.stage??''))).length) * 100) : 0;

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(t: AnyRow) {
    setEditing(t);
    setForm({ project_name:String(t.project_name??''),client:String(t.client??''),type:String(t.type??''),value:String(t.value??''),submission_date:String(t.submission_date??''),result_date:String(t.result_date??''),stage:String(t.stage??'Identified'),probability:String(t.probability??''),notes:String(t.notes??'') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, value:Number(form.value)||0, probability:Number(form.probability)||0 };
    if (editing) { await updateMutation.mutateAsync({ id:String(editing.id), data:payload }); toast.success('Tender updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Tender added'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this tender?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Tender deleted');
  }

  async function advanceStage(t: AnyRow) {
    const idx = STAGES.indexOf(String(t.stage??''));
    if (idx < 0 || idx >= STAGES.length-1) return;
    await updateMutation.mutateAsync({ id:String(t.id), data:{stage:STAGES[idx+1]} });
    toast.success(`Advanced to ${STAGES[idx+1]}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tender Pipeline</h1>
          <p className="text-sm text-gray-400 mt-1">Bid management & win/loss tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-800 rounded-lg p-1">
            {(['pipeline','list'] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${view===v?'bg-gray-600 text-white shadow':'text-gray-400 hover:text-gray-200'}`}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={16}/><span>New Tender</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Pipeline Value', value:`£${(totalValue/1000000).toFixed(1)}M`, icon:PoundSterling, colour:'text-blue-400' },
          { label:'Active Bids', value:activeCount, icon:Clock, colour:'text-orange-400' },
          { label:'Won', value:wonCount, icon:CheckCircle, colour:'text-green-400' },
          { label:'Win Rate', value:`${winRate}%`, icon:TrendingUp, colour:'text-purple-400' },
        ].map(kpi=>(
          <div key={kpi.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400">{kpi.label}</p>
              <kpi.icon size={18} className={kpi.colour}/>
            </div>
            <p className={`text-2xl font-bold ${kpi.colour}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Stage group tabs */}
      <div className="flex gap-1 border-b border-gray-700">
        {([
          { key:'all',    label:'All Tenders',      count:tenders.length },
          { key:'active', label:'In Progress',       count:tenders.filter(t=>GROUP_STAGES.active.includes(String(t.stage??''))).length },
          { key:'won',    label:'Won',               count:tenders.filter(t=>t.stage==='Won').length },
          { key:'lost',   label:'Lost / Withdrawn',  count:tenders.filter(t=>['Lost','Withdrawn'].includes(String(t.stage??''))).length },
        ] as const).map(tab=>(
          <button key={tab.key} onClick={()=>{ setStageGroup(tab.key); setStageFilter('All'); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${stageGroup===tab.key?'border-orange-500 text-orange-400':'border-transparent text-gray-400 hover:text-gray-200'}`}>
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              tab.key==='won' ? 'bg-green-900/40 text-green-400' :
              tab.key==='lost' ? 'bg-red-900/40 text-red-400' :
              'bg-gray-800 text-gray-400'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3 items-center bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search project or client…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"/>
        </div>
        <select value={stageFilter} onChange={e=>setStageFilter(e.target.value)}
          className="text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500">
          {['All',...STAGES].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"/></div>
      ) : view === 'pipeline' ? (
        /* Pipeline View */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {PIPELINE_STAGES.map(stage => {
              const stageTenders = filtered.filter(t=>t.stage===stage);
              const stageValue = stageTenders.reduce((s,t)=>s+Number(t.value??0),0);
              return (
                <div key={stage} className="w-64 flex-shrink-0">
                  <div className="bg-gray-800 rounded-t-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{stage}</span>
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{stageTenders.length}</span>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 border-t-0 rounded-b-lg p-2 space-y-2 min-h-48">
                    {stageValue > 0 && <p className="text-xs text-center text-gray-500 py-1">£{(stageValue/1000).toFixed(0)}k</p>}
                    {stageTenders.map(t=>(
                      <div key={String(t.id)} className="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-colors cursor-pointer" onClick={()=>openEdit(t)}>
                        <p className="font-medium text-sm text-white truncate">{String(t.project_name??'Untitled')}</p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Building2 size={10}/>{String(t.client??'—')}</p>
                        {!!t.value && <p className="text-xs font-semibold text-orange-400 mt-2">£{Number(t.value).toLocaleString()}</p>}
                        {!!t.submission_date && <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Calendar size={10}/>{String(t.submission_date)}</p>}
                        {!!t.probability && <div className="mt-2">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs text-gray-500">Win prob.</span>
                            <span className="text-xs text-gray-400">{Number(t.probability)}%</span>
                          </div>
                          <div className="h-1 bg-gray-700 rounded-full">
                            <div className="h-full bg-orange-500 rounded-full" style={{width:`${Math.min(Number(t.probability),100)}%`}}/>
                          </div>
                        </div>}
                        <button onClick={e=>{e.stopPropagation();advanceStage(t);}} className="mt-2 w-full text-xs text-center text-orange-400 hover:text-orange-300 flex items-center justify-center gap-1 transition-colors">
                          Advance <ChevronRight size={12}/>
                        </button>
                      </div>
                    ))}
                    {stageTenders.length === 0 && <p className="text-xs text-center text-gray-600 py-4">No tenders</p>}
                  </div>
                </div>
              );
            })}
            {/* Won/Lost columns */}
            {(['Won','Lost'] as const).map(stage=>{
              const stageTenders = filtered.filter(t=>t.stage===stage);
              const isWon = stage === 'Won';
              return (
                <div key={stage} className="w-64 flex-shrink-0">
                  <div className={`rounded-t-lg px-4 py-3 flex items-center justify-between ${isWon?'bg-green-900/40':'bg-red-900/40'}`}>
                    <span className={`text-xs font-semibold uppercase tracking-wide ${isWon?'text-green-400':'text-red-400'}`}>{stage}</span>
                    <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">{stageTenders.length}</span>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 border-t-0 rounded-b-lg p-2 space-y-2 min-h-48">
                    {stageTenders.map(t=>(
                      <div key={String(t.id)} className="bg-gray-800 border border-gray-700 rounded-lg p-3 cursor-pointer hover:border-gray-600 transition-colors" onClick={()=>openEdit(t)}>
                        <p className="font-medium text-sm text-white truncate">{String(t.project_name??'Untitled')}</p>
                        <p className="text-xs text-gray-400">{String(t.client??'—')}</p>
                        {!!t.value && <p className="text-xs font-semibold text-gray-300 mt-1">£{Number(t.value).toLocaleString()}</p>}
                      </div>
                    ))}
                    {stageTenders.length === 0 && <p className="text-xs text-center text-gray-600 py-4">No tenders</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/60 border-b border-gray-700">
              <tr>{['Project','Client','Type','Value','Submission','Stage',''].map(h=>(
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map(t=>(
                <tr key={String(t.id)} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{String(t.project_name??'—')}</td>
                  <td className="px-4 py-3 text-gray-400">{String(t.client??'—')}</td>
                  <td className="px-4 py-3 text-gray-400">{String(t.type??'—')}</td>
                  <td className="px-4 py-3 text-white font-medium">£{Number(t.value??0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-400">{String(t.submission_date??'—')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${stageColour[String(t.stage??'')] ?? 'bg-gray-700 text-gray-300'}`}>
                      {String(t.stage??'')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={()=>openEdit(t)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 rounded"><Edit2 size={14}/></button>
                      <button onClick={()=>handleDelete(String(t.id))} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <FileText size={40} className="mx-auto mb-3 opacity-30"/><p>No tenders found</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-bold text-white">{editing?'Edit Tender':'New Tender'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Project Name *</label>
                  <input required value={form.project_name} onChange={e=>setForm(f=>({...f,project_name:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Client</label>
                  <input value={form.client} onChange={e=>setForm(f=>({...f,client:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Contract Type</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                    <option value="">Select…</option>{TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Estimated Value (£)</label>
                  <input type="number" value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Stage</label>
                  <select value={form.stage} onChange={e=>setForm(f=>({...f,stage:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                    {STAGES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Win Probability (%)</label>
                  <input type="number" min="0" max="100" value={form.probability} onChange={e=>setForm(f=>({...f,probability:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Submission Date</label>
                  <input type="date" value={form.submission_date} onChange={e=>setForm(f=>({...f,submission_date:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Result Date</label>
                  <input type="date" value={form.result_date} onChange={e=>setForm(f=>({...f,result_date:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
                  <textarea rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {editing?'Update Tender':'Create Tender'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
