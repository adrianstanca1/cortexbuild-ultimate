import { useState } from 'react';
import { FileText, Plus, Search, TrendingUp, Clock, CheckCircle, XCircle, Edit2, Trash2, X, ChevronRight, Building2, Calendar, PoundSterling } from 'lucide-react';
import { useTenders } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const STAGES = ['Identified','Pre-Qualification','ITT Issued','Pricing','Submitted','Interview','Won','Lost','Withdrawn'];
const TYPES = ['Design & Build','Traditional','Two Stage','Framework','Negotiated','Minor Works'];

const stageColour: Record<string,string> = {
  'Identified':'bg-gray-100 text-gray-700','Pre-Qualification':'bg-blue-100 text-blue-700',
  'ITT Issued':'bg-purple-100 text-purple-700','Pricing':'bg-yellow-100 text-yellow-700',
  'Submitted':'bg-orange-100 text-orange-700','Interview':'bg-indigo-100 text-indigo-700',
  'Won':'bg-green-100 text-green-700','Lost':'bg-red-100 text-red-700','Withdrawn':'bg-gray-100 text-gray-500',
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

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [view, setView] = useState<'pipeline'|'list'>('pipeline');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const filtered = tenders.filter(t => {
    const name = String(t.project_name??'').toLowerCase();
    const client = String(t.client??'').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || client.includes(search.toLowerCase());
    const matchStage = stageFilter === 'All' || t.stage === stageFilter;
    return matchSearch && matchStage;
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tender Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">Bid management & win/loss tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['pipeline','list'] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${view===v?'bg-white shadow text-gray-900':'text-gray-500 hover:text-gray-700'}`}>{v}</button>
            ))}
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
            <Plus size={16}/><span>New Tender</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Pipeline Value', value:`£${(totalValue/1000000).toFixed(1)}M`, icon:PoundSterling, colour:'text-blue-600', bg:'bg-blue-50' },
          { label:'Active Bids', value:activeCount, icon:Clock, colour:'text-orange-600', bg:'bg-orange-50' },
          { label:'Won', value:wonCount, icon:CheckCircle, colour:'text-green-600', bg:'bg-green-50' },
          { label:'Win Rate', value:`${winRate}%`, icon:TrendingUp, colour:'text-purple-600', bg:'bg-purple-50' },
        ].map(kpi=>(
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour}/></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-gray-900">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search project or client…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <select value={stageFilter} onChange={e=>setStageFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...STAGES].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : view === 'pipeline' ? (
        /* Pipeline View */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {PIPELINE_STAGES.map(stage => {
              const stageTenders = filtered.filter(t=>t.stage===stage);
              const stageValue = stageTenders.reduce((s,t)=>s+Number(t.value??0),0);
              return (
                <div key={stage} className="w-64 flex-shrink-0">
                  <div className="bg-gray-100 rounded-t-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{stage}</span>
                    <span className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded-full">{stageTenders.length}</span>
                  </div>
                  <div className="bg-gray-50 rounded-b-lg p-2 space-y-2 min-h-48">
                    {stageValue > 0 && <p className="text-xs text-center text-gray-500 py-1">£{(stageValue/1000).toFixed(0)}k</p>}
                    {stageTenders.map(t=>(
                      <div key={String(t.id)} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={()=>openEdit(t)}>
                        <p className="font-medium text-sm text-gray-900 truncate">{String(t.project_name??'Untitled')}</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Building2 size={10}/>{String(t.client??'—')}</p>
                        {!!t.value && <p className="text-xs font-semibold text-orange-600 mt-2">£{Number(t.value).toLocaleString()}</p>}
                        {!!t.submission_date && <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Calendar size={10}/>{String(t.submission_date)}</p>}
                        <button onClick={e=>{e.stopPropagation();advanceStage(t);}} className="mt-2 w-full text-xs text-center text-orange-600 hover:text-orange-800 flex items-center justify-center gap-1">Advance <ChevronRight size={12}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Won/Lost columns */}
            {['Won','Lost'].map(stage=>{
              const stageTenders = filtered.filter(t=>t.stage===stage);
              return (
                <div key={stage} className="w-64 flex-shrink-0">
                  <div className={`rounded-t-lg px-4 py-3 flex items-center justify-between ${stage==='Won'?'bg-green-100':'bg-red-100'}`}>
                    <span className={`text-xs font-semibold uppercase tracking-wide ${stage==='Won'?'text-green-700':'text-red-700'}`}>{stage}</span>
                    <span className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded-full">{stageTenders.length}</span>
                  </div>
                  <div className="bg-gray-50 rounded-b-lg p-2 space-y-2 min-h-48">
                    {stageTenders.map(t=>(
                      <div key={String(t.id)} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200" onClick={()=>openEdit(t)}>
                        <p className="font-medium text-sm text-gray-900 truncate">{String(t.project_name??'Untitled')}</p>
                        <p className="text-xs text-gray-500">{String(t.client??'—')}</p>
                        {!!t.value && <p className="text-xs font-semibold text-gray-700 mt-1">£{Number(t.value).toLocaleString()}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Project','Client','Type','Value','Submission','Stage',''].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(t=>(
                <tr key={String(t.id)} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{String(t.project_name??'—')}</td>
                  <td className="px-4 py-3 text-gray-600">{String(t.client??'—')}</td>
                  <td className="px-4 py-3 text-gray-600">{String(t.type??'—')}</td>
                  <td className="px-4 py-3 text-gray-600">£{Number(t.value??0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{String(t.submission_date??'—')}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${stageColour[String(t.stage??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(t.stage??'')}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={()=>openEdit(t)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                      <button onClick={()=>handleDelete(String(t.id))} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><FileText size={40} className="mx-auto mb-3 opacity-30"/><p>No tenders found</p></div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">{editing?'Edit Tender':'New Tender'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                  <input required value={form.project_name} onChange={e=>setForm(f=>({...f,project_name:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <input value={form.client} onChange={e=>setForm(f=>({...f,client:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select…</option>{TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Value (£)</label>
                  <input type="number" value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                  <select value={form.stage} onChange={e=>setForm(f=>({...f,stage:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STAGES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Win Probability (%)</label>
                  <input type="number" min="0" max="100" value={form.probability} onChange={e=>setForm(f=>({...f,probability:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submission Date</label>
                  <input type="date" value={form.submission_date} onChange={e=>setForm(f=>({...f,submission_date:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Result Date</label>
                  <input type="date" value={form.result_date} onChange={e=>setForm(f=>({...f,result_date:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
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
