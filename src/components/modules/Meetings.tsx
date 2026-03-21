import { useState } from 'react';
import { Calendar, Plus, Search, Clock, CheckCircle, Users, MapPin, Edit2, Trash2, X, ChevronDown, ChevronUp, Video } from 'lucide-react';
import { useMeetings } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const MEETING_TYPES = ['Site Progress','Design Review','Safety Meeting','Client Update','Subcontractor Coordination','Pre-Start','Toolbox Talk','Board Meeting','Other'];
const STATUS_OPTIONS = ['Scheduled','In Progress','Completed','Cancelled'];

const statusColour: Record<string,string> = {
  'Scheduled':'bg-blue-100 text-blue-800','In Progress':'bg-yellow-100 text-yellow-800',
  'Completed':'bg-green-100 text-green-800','Cancelled':'bg-gray-100 text-gray-500',
};

const emptyForm = { title:'',meeting_type:'Site Progress',date:'',time:'',location:'',attendees:'',agenda:'',minutes:'',actions:'',status:'Scheduled',project_id:'',link:'' };

export function Meetings() {
  const { useList, useCreate, useUpdate, useDelete } = useMeetings;
  const { data: raw = [], isLoading } = useList();
  const meetings = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  function setTab(key: string, filter: string) { setSubTab(key); setStatusFilter(filter); }
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0,10);

  const filtered = meetings.filter(m => {
    if (subTab==='upcoming') return String(m.date??'')>=today && m.status!=='Cancelled' && m.status!=='Completed';
    if (subTab==='past') return String(m.date??'')<today || m.status==='Completed';
    if (subTab==='today') return String(m.date??'')===today;
    const title = String(m.title??'').toLowerCase();
    const type = String(m.meeting_type??'').toLowerCase();
    const matchSearch = title.includes(search.toLowerCase()) || type.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const upcomingCount = meetings.filter(m=>m.status==='Scheduled' && String(m.date??'')>=today).length;
  const completedCount = meetings.filter(m=>m.status==='Completed').length;
  const todayCount = meetings.filter(m=>String(m.date??'')===today).length;
  const actionItems = meetings.filter(m=>String(m.actions??'').trim().length>0).length;

  function openCreate() { setEditing(null); setForm({ ...emptyForm, date:today }); setShowModal(true); }
  function openEdit(m: AnyRow) {
    setEditing(m);
    setForm({ title:String(m.title??''),meeting_type:String(m.meeting_type??'Site Progress'),date:String(m.date??''),time:String(m.time??''),location:String(m.location??''),attendees:String(m.attendees??''),agenda:String(m.agenda??''),minutes:String(m.minutes??''),actions:String(m.actions??''),status:String(m.status??'Scheduled'),project_id:String(m.project_id??''),link:String(m.link??'') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) { await updateMutation.mutateAsync({ id:String(editing.id), data:form }); toast.success('Meeting updated'); }
    else { await createMutation.mutateAsync(form); toast.success('Meeting scheduled'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this meeting?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Meeting deleted');
  }

  async function markComplete(m: AnyRow) {
    await updateMutation.mutateAsync({ id:String(m.id), data:{ status:'Completed' } });
    toast.success('Meeting marked complete');
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-sm text-gray-500 mt-1">Site meetings, minutes & action items</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>Schedule Meeting</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Today', value:todayCount, icon:Calendar, colour:'text-orange-600', bg:'bg-orange-50' },
          { label:'Upcoming', value:upcomingCount, icon:Clock, colour:'text-blue-600', bg:'bg-blue-50' },
          { label:'Completed', value:completedCount, icon:CheckCircle, colour:'text-green-600', bg:'bg-green-50' },
          { label:'With Actions', value:actionItems, icon:Users, colour:'text-purple-600', bg:'bg-purple-50' },
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
          { key:'upcoming', label:'Upcoming',  count:upcomingCount },
          { key:'today',    label:'Today',     count:todayCount },
          { key:'past',     label:'Past',      count:completedCount },
          { key:'all',      label:'All',       count:meetings.length },
        ]).map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key,'All')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab===t.key?'border-orange-600 text-orange-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key==='today'&&t.count>0?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-600'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search meetings…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} meetings</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><Calendar size={40} className="mx-auto mb-3 opacity-30"/><p>No meetings found</p></div>}
          {filtered.map(m => {
            const id = String(m.id??'');
            const isExp = expanded === id;
            const isToday = String(m.date??'') === today;
            return (
              <div key={id}>
                <div className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer" onClick={()=>setExpanded(isExp?null:id)}>
                  <div className={`w-14 text-center flex-shrink-0 rounded-lg py-2 ${isToday?'bg-orange-100':'bg-gray-100'}`}>
                    <p className={`text-xs font-bold ${isToday?'text-orange-700':'text-gray-600'}`}>{String(m.date??'—').slice(5)}</p>
                    {!!m.time && <p className="text-xs text-gray-500">{String(m.time)}</p>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{String(m.title??'Untitled')}</p>
                      {isToday && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Today</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500">{String(m.meeting_type??'')}</span>
                      {!!m.location && <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10}/>{String(m.location)}</span>}
                      {!!m.link && <span className="text-xs text-blue-600 flex items-center gap-1"><Video size={10}/>Online</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(m.status??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(m.status??'')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {m.status==='Scheduled' && <button onClick={e=>{e.stopPropagation();markComplete(m);}} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Mark Complete"><CheckCircle size={14}/></button>}
                    <button onClick={e=>{e.stopPropagation();openEdit(m);}} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                    <button onClick={e=>{e.stopPropagation();handleDelete(id);}} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                    {isExp?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
                  </div>
                </div>
                {isExp && (
                  <div className="px-6 pb-5 bg-gray-50 space-y-3 text-sm">
                    {!!m.attendees && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Attendees</p><p className="text-gray-700">{String(m.attendees)}</p></div>}
                    {!!m.agenda && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Agenda</p><p className="text-gray-700 whitespace-pre-wrap">{String(m.agenda)}</p></div>}
                    {!!m.minutes && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Minutes</p><p className="text-gray-700 whitespace-pre-wrap">{String(m.minutes)}</p></div>}
                    {!!m.actions && <div><p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Action Items</p><p className="text-gray-700 whitespace-pre-wrap">{String(m.actions)}</p></div>}
                    {!!m.link && <div><p className="text-xs text-gray-400 mb-1">Meeting Link</p><a href={String(m.link)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">{String(m.link)}</a></div>}
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
              <h2 className="text-lg font-semibold">{editing?'Edit Meeting':'Schedule Meeting'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title *</label>
                  <input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Type</label>
                  <select value={form.meeting_type} onChange={e=>setForm(f=>({...f,meeting_type:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {MEETING_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="e.g. Site Office" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attendees</label>
                  <input value={form.attendees} onChange={e=>setForm(f=>({...f,attendees:e.target.value}))} placeholder="e.g. John Smith, Sarah Jones" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agenda</label>
                  <textarea rows={3} value={form.agenda} onChange={e=>setForm(f=>({...f,agenda:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minutes</label>
                  <textarea rows={3} value={form.minutes} onChange={e=>setForm(f=>({...f,minutes:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action Items</label>
                  <textarea rows={3} value={form.actions} onChange={e=>setForm(f=>({...f,actions:e.target.value}))} placeholder="List any action items with owner names…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Online Meeting Link</label>
                  <input type="url" value={form.link} onChange={e=>setForm(f=>({...f,link:e.target.value}))} placeholder="https://teams.microsoft.com/…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing?'Update Meeting':'Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
