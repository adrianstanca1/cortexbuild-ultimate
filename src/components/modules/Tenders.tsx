import { useState } from 'react';
import { FileText, Plus, Search, TrendingUp, Clock, CheckCircle, XCircle, Edit2, Trash2, X, ChevronRight, Building2, Calendar, PoundSterling, BarChart3, AlertCircle } from 'lucide-react';
import { useTenders } from '../../hooks/useData';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

type AnyRow = Record<string, unknown>;

const STAGES = ['Identified','Pre-Qualification','ITT Issued','Pricing','Submitted','Interview','Won','Lost','Withdrawn'];
const TYPES = ['Design & Build','Traditional','Two Stage','Framework','Negotiated','Minor Works'];
const SCORING_CRITERIA = ['Technical Capability', 'Commercial Competitiveness', 'Programme', 'H&S', 'Experience'];

const stageColour: Record<string,string> = {
  'Identified':'bg-gray-700 text-gray-200','Pre-Qualification':'bg-blue-900 text-blue-200',
  'ITT Issued':'bg-purple-900 text-purple-200','Pricing':'bg-yellow-900 text-yellow-200',
  'Submitted':'bg-orange-900 text-orange-200','Interview':'bg-indigo-900 text-indigo-200',
  'Won':'bg-green-900 text-green-200','Lost':'bg-red-900 text-red-200','Withdrawn':'bg-gray-700 text-gray-400',
};

const PIPELINE_STAGES = ['Identified','Pre-Qualification','ITT Issued','Pricing','Submitted'];

const emptyForm = {
  project_name:'',client:'',type:'',value:'',submission_date:'',result_date:'',
  stage:'Identified',probability:'',notes:'',competitor_notes:'',
  scores:{ technical:0, commercial:0, programme:0, safety:0, experience:0 },
  documents:{ prelims:false, method:false, programme:false, safety_plan:false, cvs:false, insurance:false }
};

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
  const [view, setView] = useState<'pipeline'|'list'|'analytics'>('pipeline');
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
  const weightedValue = tenders.reduce((s,t)=>s+(Number(t.value??0)*(Number(t.probability??0)/100)),0);
  const wonCount = tenders.filter(t=>t.stage==='Won').length;
  const lostCount = tenders.filter(t=>['Lost','Withdrawn'].includes(String(t.stage??''))).length;
  const activeCount = tenders.filter(t=>!['Won','Lost','Withdrawn'].includes(String(t.stage??''))).length;
  const winRate = (wonCount + lostCount) > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0;

  // Analytics data
  const wonBids = tenders.filter(t=>t.stage==='Won');
  const lostBids = tenders.filter(t=>['Lost','Withdrawn'].includes(String(t.stage??'')));
  const avgWonValue = wonBids.length > 0 ? wonBids.reduce((s,t)=>s+Number(t.value??0),0) / wonBids.length : 0;
  const avgLostValue = lostBids.length > 0 ? lostBids.reduce((s,t)=>s+Number(t.value??0),0) / lostBids.length : 0;

  const monthlyData = Array.from({length:6}, (_,i)=>{
    const d = new Date(); d.setMonth(d.getMonth()-i);
    const m = d.toLocaleString('default',{month:'short'});
    const y = d.getFullYear();
    const c = tenders.filter(t=> {
      const sd = String(t.submission_date??'');
      return sd.startsWith(`${y}-${String(d.getMonth()+1).padStart(2,'0')}`);
    }).length;
    return {month:`${m} ${y}`,count:c};
  }).reverse();

  const funnelData = [
    {stage:'Identified',count:tenders.filter(t=>t.stage==='Identified').length},
    {stage:'Pre-Qual',count:tenders.filter(t=>t.stage==='Pre-Qualification').length},
    {stage:'ITT',count:tenders.filter(t=>t.stage==='ITT Issued').length},
    {stage:'Submitted',count:tenders.filter(t=>t.stage==='Submitted').length},
    {stage:'Won',count:wonCount},
  ];

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(t: AnyRow) {
    setEditing(t);
    setForm({
      project_name:String(t.project_name??''),client:String(t.client??''),type:String(t.type??''),
      value:String(t.value??''),submission_date:String(t.submission_date??''),result_date:String(t.result_date??''),
      stage:String(t.stage??'Identified'),probability:String(t.probability??''),notes:String(t.notes??''),
      competitor_notes:String(t.competitor_notes??''),
      scores:{
        technical:Number((t.scores as Record<string,number>)?.technical??0),
        commercial:Number((t.scores as Record<string,number>)?.commercial??0),
        programme:Number((t.scores as Record<string,number>)?.programme??0),
        safety:Number((t.scores as Record<string,number>)?.safety??0),
        experience:Number((t.scores as Record<string,number>)?.experience??0),
      },
      documents:{
        prelims:Boolean((t.documents as Record<string,boolean>)?.prelims??false),
        method:Boolean((t.documents as Record<string,boolean>)?.method??false),
        programme:Boolean((t.documents as Record<string,boolean>)?.programme??false),
        safety_plan:Boolean((t.documents as Record<string,boolean>)?.safety_plan??false),
        cvs:Boolean((t.documents as Record<string,boolean>)?.cvs??false),
        insurance:Boolean((t.documents as Record<string,boolean>)?.insurance??false),
      }
    });
    setShowModal(true);
  }

  function getDaysUntilSubmission(submissionDate: unknown): number | null {
    const sd = String(submissionDate??'');
    if (!sd) return null;
    const d = new Date(sd);
    const today = new Date();
    const diff = d.getTime() - today.getTime();
    return Math.ceil(diff / (1000*3600*24));
  }

  function getSubmissionStatus(days: number | null): string {
    if (days === null) return '';
    if (days < 0) return 'OVERDUE';
    if (days <= 7) return `${days}d`;
    if (days <= 30) return `${Math.ceil(days/7)}w`;
    return `${Math.ceil(days/30)}m`;
  }

  function getSubmissionColour(days: number | null): string {
    if (days === null) return 'text-gray-400';
    if (days < 0) return 'text-red-400';
    if (days <= 7) return 'text-red-400';
    if (days <= 14) return 'text-yellow-400';
    return 'text-green-400';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      value:Number(form.value)||0,
      probability:Number(form.probability)||0,
      scores:form.scores,
      documents:form.documents
    };
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
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tender Pipeline</h1>
          <p className="text-sm text-gray-400 mt-1">Bid management & win/loss tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
            {(['pipeline','list','analytics'] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${view===v?'bg-orange-600 text-white shadow':'text-gray-400 hover:text-gray-300'}`}>{v}</button>
            ))}
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
            <Plus size={16}/><span>New Tender</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Pipeline Value', value:`£${(totalValue/1000000).toFixed(1)}M`, icon:PoundSterling, colour:'text-blue-400', bg:'bg-blue-900/30' },
          { label:'Weighted Value', value:`£${(weightedValue/1000000).toFixed(1)}M`, icon:TrendingUp, colour:'text-purple-400', bg:'bg-purple-900/30' },
          { label:'Active Bids', value:activeCount, icon:Clock, colour:'text-orange-400', bg:'bg-orange-900/30' },
          { label:'Win Rate', value:`${winRate}%`, icon:CheckCircle, colour:'text-green-400', bg:'bg-green-900/30' },
        ].map(kpi=>(
          <div key={kpi.label} className="bg-gray-800 rounded-xl border border-gray-700 p-4 hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour}/></div>
              <div><p className="text-xs text-gray-400">{kpi.label}</p><p className="text-xl font-bold text-white">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-gray-700">
        {([
          { key:'all',    label:'All Tenders',  count:tenders.length },
          { key:'active', label:'In Progress',  count:tenders.filter(t=>GROUP_STAGES.active.includes(String(t.stage??''))).length },
          { key:'won',    label:'Won',           count:wonCount },
          { key:'lost',   label:'Lost / Withdrawn', count:lostCount },
        ] as const).map(tab=>(
          <button key={tab.key} onClick={()=>{ setStageGroup(tab.key); setStageFilter('All'); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${stageGroup===tab.key?'border-orange-600 text-orange-400':'border-transparent text-gray-400 hover:text-gray-300'}`}>
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              tab.key==='won' ? 'bg-green-900/50 text-green-300' :
              tab.key==='lost' ? 'bg-red-900/50 text-red-300' :
              'bg-gray-700 text-gray-300'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search project or client…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <select value={stageFilter} onChange={e=>setStageFilter(e.target.value)} className="text-sm border border-gray-700 rounded-lg px-3 py-2 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...STAGES].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : view === 'pipeline' ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {PIPELINE_STAGES.map(stage => {
              const stageTenders = filtered.filter(t=>t.stage===stage);
              const stageValue = stageTenders.reduce((s,t)=>s+Number(t.value??0),0);
              const stageWeighted = stageTenders.reduce((s,t)=>s+(Number(t.value??0)*(Number(t.probability??0)/100)),0);
              return (
                <div key={stage} className="w-72 flex-shrink-0">
                  <div className="bg-gray-800 rounded-t-lg px-4 py-3 flex items-center justify-between border-b border-gray-700">
                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{stage}</span>
                    <span className="text-xs bg-gray-700 text-gray-200 px-2 py-0.5 rounded-full">{stageTenders.length}</span>
                  </div>
                  <div className="text-xs text-center py-2 px-2 bg-gray-900/50 border-b border-gray-700">
                    <p className="text-gray-400">Total: <span className="text-white font-semibold">£{(stageValue/1000).toFixed(0)}k</span></p>
                    <p className="text-gray-500 text-xs">Weighted: <span className="text-gray-300">£{(stageWeighted/1000).toFixed(0)}k</span></p>
                  </div>
                  <div className="bg-gray-900 rounded-b-lg p-2 space-y-2 min-h-96">
                    {stageTenders.map(t=>{
                      const days = getDaysUntilSubmission(t.submission_date);
                      const status = getSubmissionStatus(days);
                      const colour = getSubmissionColour(days);
                      return (
                        <div key={String(t.id)} className="bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-700 hover:border-gray-600 transition-all cursor-pointer hover:shadow-lg" onClick={()=>openEdit(t)}>
                          <div className="flex items-start justify-between">
                            <p className="font-medium text-sm text-white truncate flex-1">{String(t.project_name??'Untitled')}</p>
                            {status && <span className={`text-xs font-bold ml-2 flex-shrink-0 ${colour}`}>{status}</span>}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Building2 size={10}/>{String(t.client??'—')}</p>
                          {!!t.value && <p className="text-xs font-semibold text-orange-400 mt-2">£{Number(t.value).toLocaleString()}</p>}
                          {!!t.probability && <p className="text-xs text-gray-400 mt-1">Win prob: {Number(t.probability)}%</p>}
                          {!!t.submission_date && <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Calendar size={10}/>{String(t.submission_date)}</p>}
                          <button onClick={e=>{e.stopPropagation();advanceStage(t);}} className="mt-2 w-full text-xs text-center text-orange-400 hover:text-orange-300 flex items-center justify-center gap-1">Advance <ChevronRight size={12}/></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {['Won','Lost'].map(stage=>{
              const stageTenders = filtered.filter(t=>t.stage===stage);
              return (
                <div key={stage} className="w-72 flex-shrink-0">
                  <div className={`rounded-t-lg px-4 py-3 flex items-center justify-between ${stage==='Won'?'bg-green-900/30 border-green-700':'bg-red-900/30 border-red-700'} border-b`}>
                    <span className={`text-xs font-semibold uppercase tracking-wide ${stage==='Won'?'text-green-300':'text-red-300'}`}>{stage}</span>
                    <span className="text-xs bg-gray-700 text-gray-200 px-2 py-0.5 rounded-full">{stageTenders.length}</span>
                  </div>
                  <div className="bg-gray-900 rounded-b-lg p-2 space-y-2 min-h-96">
                    {stageTenders.map(t=>(
                      <div key={String(t.id)} className="bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer" onClick={()=>openEdit(t)}>
                        <p className="font-medium text-sm text-white truncate">{String(t.project_name??'Untitled')}</p>
                        <p className="text-xs text-gray-400">{String(t.client??'—')}</p>
                        {!!t.value && <p className="text-xs font-semibold text-gray-300 mt-1">£{Number(t.value).toLocaleString()}</p>}
                        {Boolean(t.result_date) && <p className="text-xs text-gray-500 mt-1">{String(t.result_date)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : view === 'analytics' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
              <p className="text-xs text-gray-400 mb-2">Win Rate</p>
              <p className="text-3xl font-bold text-green-400">{winRate}%</p>
              <p className="text-xs text-gray-500 mt-2">{wonCount} won, {lostCount} lost</p>
            </div>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
              <p className="text-xs text-gray-400 mb-2">Avg Won Value</p>
              <p className="text-3xl font-bold text-green-400">£{(avgWonValue/1000).toFixed(0)}k</p>
              <p className="text-xs text-gray-500 mt-2">{wonBids.length} projects</p>
            </div>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
              <p className="text-xs text-gray-400 mb-2">Avg Lost Value</p>
              <p className="text-3xl font-bold text-red-400">£{(avgLostValue/1000).toFixed(0)}k</p>
              <p className="text-xs text-gray-500 mt-2">{lostBids.length} projects</p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Monthly Bid Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                <XAxis dataKey="month" stroke="#9CA3AF" style={{fontSize:'12px'}}/>
                <YAxis stroke="#9CA3AF" style={{fontSize:'12px'}}/>
                <Tooltip contentStyle={{backgroundColor:'#111827',border:'1px solid #374151',borderRadius:'8px',color:'#FFF'}}/>
                <Bar dataKey="count" fill="#F97316" radius={[8,8,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Conversion Funnel</h3>
            <div className="space-y-3">
              {funnelData.map((item,idx)=>{
                const maxCount = Math.max(...funnelData.map(d=>d.count));
                const width = maxCount > 0 ? (item.count / maxCount * 100) : 0;
                return (
                  <div key={item.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-300">{item.stage}</span>
                      <span className="text-xs text-gray-400">{item.count}</span>
                    </div>
                    <div className="h-6 bg-gray-900 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full" style={{width:`${width}%`}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>{['Project','Client','Type','Value','Submission','Status',''].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.map(t=>{
                const days = getDaysUntilSubmission(t.submission_date);
                const status = getSubmissionStatus(days);
                const colour = getSubmissionColour(days);
                return (
                  <tr key={String(t.id)} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{String(t.project_name??'—')}</td>
                    <td className="px-4 py-3 text-gray-300">{String(t.client??'—')}</td>
                    <td className="px-4 py-3 text-gray-300">{String(t.type??'—')}</td>
                    <td className="px-4 py-3 text-gray-300">£{Number(t.value??0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-400">
                      <div>
                        <p>{String(t.submission_date??'—')}</p>
                        {status && <p className={`text-xs font-bold ${colour}`}>{status}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${stageColour[String(t.stage??'')] ?? 'bg-gray-700 text-gray-300'}`}>{String(t.stage??'')}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={()=>openEdit(t)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 rounded"><Edit2 size={14}/></button>
                        <button onClick={()=>handleDelete(String(t.id))} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-16 text-gray-500"><FileText size={40} className="mx-auto mb-3 opacity-30"/><p>No tenders found</p></div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <h2 className="text-lg font-semibold text-white">{editing?'Edit Tender':'New Tender'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Project Name *</label>
                    <input required value={form.project_name} onChange={e=>setForm(f=>({...f,project_name:e.target.value}))} className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-900 text-white placeholder-gray-600"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Client</label>
                    <input value={form.client} onChange={e=>setForm(f=>({...f,client:e.target.value}))} className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-900 text-white placeholder-gray-600"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Contract Type</label>
                    <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-900 text-white">
                      <option value="">Select…</option>{TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Estimated Value (£)</label>
                    <input type="number" value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))} className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-900 text-white placeholder-gray-600"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Stage</label>
                    <select value={form.stage} onChange={e=>setForm(f=>({...f,stage:e.target.value}))} className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-900 text-white">
                      {STAGES.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Win Probability (%)</label>
                    <input type="number" min="0" max="100" value={form.probability} onChange={e=>setForm(f=>({...f,probability:e.target.value}))} className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-900 text-white placeholder-gray-600"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Submission Date</label>
                    <input type="date" value={form.submission_date} onChange={e=>setForm(f=>({...f,submission_date:e.target.value}))} className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-900 text-white"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Result Date</label>
                    <input type="date" value={form.result_date} onChange={e=>setForm(f=>({...f,result_date:e.target.value}))} className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-900 text-white"/>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Competitor Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Competitor Notes</label>
                  <textarea rows={2} value={form.competitor_notes} onChange={e=>setForm(f=>({...f,competitor_notes:e.target.value}))} placeholder="Known competitors, likely pricing strategies, etc." className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-900 text-white placeholder-gray-600 resize-none"/>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Bid Scoring (1-10)</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  {[
                    {key:'technical',label:'Technical Capability'},
                    {key:'commercial',label:'Commercial'},
                    {key:'programme',label:'Programme'},
                    {key:'safety',label:'H&S'},
                    {key:'experience',label:'Experience'},
                  ].map(crit=>(
                    <div key={crit.key}>
                      <label className="block text-xs font-medium text-gray-300 mb-1">{crit.label}</label>
                      <input type="number" min="0" max="10" value={form.scores[crit.key as keyof typeof form.scores]} onChange={e=>setForm(f=>({...f,scores:{...f.scores,[crit.key]:Number(e.target.value)||0}}))} className="w-full border border-gray-700 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-900 text-white text-center"/>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-gray-300">Total Score</p>
                    <p className="text-lg font-bold text-orange-400">{Object.values(form.scores).reduce((a,b)=>a+b,0)}/50</p>
                  </div>
                  <div className="flex gap-1">
                    {Object.entries(form.scores).map(([key,val])=>(
                      <div key={key} className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{width:`${(val/10)*100}%`}}/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Tender Documents Checklist</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    {key:'prelims',label:'Preliminaries'},
                    {key:'method',label:'Method Statement'},
                    {key:'programme',label:'Programme'},
                    {key:'safety_plan',label:'H&S Plan'},
                    {key:'cvs',label:'CVs'},
                    {key:'insurance',label:'Insurance Docs'},
                  ].map(doc=>(
                    <label key={doc.key} className="flex items-center gap-2 p-2 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors">
                      <input type="checkbox" checked={form.documents[doc.key as keyof typeof form.documents]} onChange={e=>setForm(f=>({...f,documents:{...f.documents,[doc.key]:e.target.checked}}))} className="w-4 h-4 rounded border-gray-700 accent-orange-600"/>
                      <span className="text-sm text-gray-300">{doc.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Additional Notes</h3>
                <textarea rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-900 text-white placeholder-gray-600 resize-none"/>
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-700">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700">Cancel</button>
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
