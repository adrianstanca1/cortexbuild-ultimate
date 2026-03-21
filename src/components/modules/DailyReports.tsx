import { useState } from 'react';
import { ClipboardList, Plus, Search, CloudRain, Sun, Cloud, Wind, Users, Edit2, Trash2, X, ChevronDown, ChevronUp, Calendar, AlertTriangle } from 'lucide-react';
import { useDailyReports } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const WEATHER_OPTIONS = ['Sunny','Partly Cloudy','Overcast','Light Rain','Heavy Rain','Fog','High Wind','Snow','Frost'];
const STATUS_OPTIONS = ['Draft','Submitted','Approved'];

const statusColour: Record<string,string> = {
  'Draft':'bg-gray-100 text-gray-600','Submitted':'bg-blue-100 text-blue-800','Approved':'bg-green-100 text-green-800',
};

const weatherIcon = (w: string) => {
  if (w.includes('Rain')) return <CloudRain size={14} className="text-blue-500"/>;
  if (w.includes('Sun') || w.includes('Sunny')) return <Sun size={14} className="text-yellow-500"/>;
  if (w.includes('Wind')) return <Wind size={14} className="text-gray-500"/>;
  return <Cloud size={14} className="text-gray-400"/>;
};

const emptyForm = { report_date:'',project_id:'',weather:'Sunny',temp_high:'',temp_low:'',workers_on_site:'',work_carried_out:'',delays:'',safety_observations:'',visitors:'',status:'Draft',submitted_by:'' };

export function DailyReports() {
  const { useList, useCreate, useUpdate, useDelete } = useDailyReports;
  const { data: raw = [], isLoading } = useList();
  const reports = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState<'today'|'week'|'all'|'drafts'>('today');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0,10);

  const filtered = reports.filter(r => {
    const date = String(r.report_date??'');
    const work = String(r.work_carried_out??'').toLowerCase();
    const matchSearch = date.includes(search) || work.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    if (!matchSearch || !matchStatus) return false;
    if (subTab === 'today') return date === today;
    if (subTab === 'week') {
      const diff = (Date.now() - new Date(date).getTime()) / 86400000;
      return diff >= 0 && diff <= 7;
    }
    if (subTab === 'drafts') return r.status === 'Draft';
    return true; // 'all'
  });

  const thisWeekCount = reports.filter(r => {
    const d = new Date(String(r.report_date??''));
    const diff = (Date.now() - d.getTime()) / 86400000;
    return diff >= 0 && diff <= 7;
  }).length;
  const draftCount = reports.filter(r=>r.status==='Draft').length;
  const totalWorkerDays = reports.reduce((s,r)=>s+Number(r.workers_on_site??0),0);
  const delayCount = reports.filter(r=>String(r.delays??'').trim().length>0).length;

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, report_date:today });
    setShowModal(true);
  }
  function openEdit(r: AnyRow) {
    setEditing(r);
    setForm({ report_date:String(r.report_date??''),project_id:String(r.project_id??''),weather:String(r.weather??'Sunny'),temp_high:String(r.temp_high??''),temp_low:String(r.temp_low??''),workers_on_site:String(r.workers_on_site??''),work_carried_out:String(r.work_carried_out??''),delays:String(r.delays??''),safety_observations:String(r.safety_observations??''),visitors:String(r.visitors??''),status:String(r.status??'Draft'),submitted_by:String(r.submitted_by??'') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, workers_on_site:Number(form.workers_on_site)||0, temp_high:Number(form.temp_high)||null, temp_low:Number(form.temp_low)||null };
    if (editing) { await updateMutation.mutateAsync({ id:String(editing.id), data:payload }); toast.success('Report updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Report submitted'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this daily report?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Report deleted');
  }

  async function submitReport(r: AnyRow) {
    await updateMutation.mutateAsync({ id:String(r.id), data:{ status:'Submitted' } });
    toast.success('Report submitted for approval');
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Site Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Daily progress, weather & site records</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>New Report</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'This Week', value:thisWeekCount, icon:Calendar, colour:'text-blue-600', bg:'bg-blue-50' },
          { label:'Drafts', value:draftCount, icon:ClipboardList, colour:'text-yellow-600', bg:'bg-yellow-50' },
          { label:'Worker Days', value:totalWorkerDays, icon:Users, colour:'text-green-600', bg:'bg-green-50' },
          { label:'Delays Reported', value:delayCount, icon:AlertTriangle, colour:delayCount>0?'text-orange-600':'text-gray-600', bg:delayCount>0?'bg-orange-50':'bg-gray-50' },
        ].map(kpi=>(
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour}/></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-gray-900">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-b border-gray-200 flex gap-1">
        {([
          { key:'today' as const,  label:'Today',     count:reports.filter(r=>String(r.report_date??'')===today).length, cls:'' },
          { key:'week'  as const,  label:'This Week',  count:thisWeekCount, cls:'' },
          { key:'drafts' as const, label:'Drafts',     count:draftCount, cls:'bg-yellow-100 text-yellow-700' },
          { key:'all'   as const,  label:'All Reports', count:reports.length, cls:'' },
        ]).map(t=>(
          <button key={t.key} onClick={()=>setSubTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab===t.key?'border-orange-500 text-orange-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.cls||'bg-gray-100 text-gray-600'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search date or work description…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} reports</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><ClipboardList size={40} className="mx-auto mb-3 opacity-30"/><p>No daily reports found</p></div>}
          {filtered.map(r => {
            const id = String(r.id??'');
            const isExp = expanded === id;
            return (
              <div key={id}>
                <div className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer" onClick={()=>setExpanded(isExp?null:id)}>
                  <div className="w-20 flex-shrink-0 text-center">
                    <p className="text-sm font-bold text-gray-800">{String(r.report_date??'—')}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {weatherIcon(String(r.weather??''))}
                    <span className="text-xs text-gray-500">{String(r.weather??'—')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{String(r.work_carried_out??'No description')}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {!!r.workers_on_site && <span className="text-xs text-gray-500 flex items-center gap-1"><Users size={11}/>{String(r.workers_on_site)} workers</span>}
                      {!!r.delays && <span className="text-xs text-orange-600 flex items-center gap-1"><AlertTriangle size={11}/>Delays noted</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(r.status??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(r.status??'')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {r.status==='Draft' && <button onClick={e=>{e.stopPropagation();submitReport(r);}} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded text-xs" title="Submit"><ClipboardList size={14}/></button>}
                    <button onClick={e=>{e.stopPropagation();openEdit(r);}} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                    <button onClick={e=>{e.stopPropagation();handleDelete(id);}} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                    {isExp?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
                  </div>
                </div>
                {isExp && (
                  <div className="px-6 pb-5 bg-gray-50 space-y-3 text-sm">
                    {!!r.work_carried_out && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Work Carried Out</p><p className="text-gray-700 whitespace-pre-wrap">{String(r.work_carried_out)}</p></div>}
                    {!!r.delays && <div><p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Delays / Issues</p><p className="text-gray-700">{String(r.delays)}</p></div>}
                    {!!r.safety_observations && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Safety Observations</p><p className="text-gray-700">{String(r.safety_observations)}</p></div>}
                    {!!r.visitors && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Visitors</p><p className="text-gray-700">{String(r.visitors)}</p></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">{editing?'Edit Daily Report':'New Daily Report'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Date *</label>
                  <input required type="date" value={form.report_date} onChange={e=>setForm(f=>({...f,report_date:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Workers on Site</label>
                  <input type="number" value={form.workers_on_site} onChange={e=>setForm(f=>({...f,workers_on_site:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weather</label>
                  <select value={form.weather} onChange={e=>setForm(f=>({...f,weather:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {WEATHER_OPTIONS.map(w=><option key={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temp High (°C)</label>
                  <input type="number" value={form.temp_high} onChange={e=>setForm(f=>({...f,temp_high:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temp Low (°C)</label>
                  <input type="number" value={form.temp_low} onChange={e=>setForm(f=>({...f,temp_low:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Carried Out *</label>
                  <textarea required rows={4} value={form.work_carried_out} onChange={e=>setForm(f=>({...f,work_carried_out:e.target.value}))} placeholder="Describe all work activities on site today…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delays / Issues</label>
                  <textarea rows={2} value={form.delays} onChange={e=>setForm(f=>({...f,delays:e.target.value}))} placeholder="Any delays, stoppages or issues…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Safety Observations</label>
                  <textarea rows={2} value={form.safety_observations} onChange={e=>setForm(f=>({...f,safety_observations:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visitors / Inspections</label>
                  <input value={form.visitors} onChange={e=>setForm(f=>({...f,visitors:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted By</label>
                  <input value={form.submitted_by} onChange={e=>setForm(f=>({...f,submitted_by:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing?'Update Report':'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
