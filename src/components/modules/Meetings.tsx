import { useState } from 'react';
import { Calendar, Plus, Search, Clock, CheckCircle, Users, MapPin, Edit2, Trash2, X, ChevronDown, ChevronUp, Video, AlertTriangle, BarChart2 } from 'lucide-react';
import { useMeetings } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;
type SubTab = 'upcoming' | 'minutes' | 'actions' | 'recurring' | 'templates';

const MEETING_TYPES = ['Site Progress','Design Review','Safety Meeting','Client Update','Subcontractor Coordination','Pre-Start','Toolbox Talk','Board Meeting','Other'];
const STATUS_OPTIONS = ['Scheduled','In Progress','Completed','Cancelled'];
const TEMPLATES = [
  { name: 'Site Meeting', items: ['Attendance & CSCS checks', 'Work programme review', 'Health & Safety briefing', 'Site inspections', 'Quality checks', 'Next week plan'] },
  { name: 'Design Review', items: ['Design status', 'RFIs outstanding', 'Approvals required', 'Schedule impact', 'Decisions needed'] },
  { name: 'Commercial Review', items: ['Budget status', 'Contract variations', 'Invoicing', 'Change orders', 'Risk register'] },
  { name: 'Safety Meeting', items: ['Incident review', 'NEAR hits', 'Hazard register', 'Training updates', 'Corrective actions'] },
  { name: 'Board Review', items: ['Project updates', 'Key milestones', 'Issues & risks', 'Financial summary', 'Forward plan'] },
];

const statusColour: Record<string,string> = {
  'Scheduled':'bg-blue-500/20 text-blue-300','In Progress':'bg-yellow-500/20 text-yellow-300',
  'Completed':'bg-green-500/20 text-green-300','Cancelled':'bg-gray-800 text-gray-400',
};

const emptyForm = { title:'',meeting_type:'Site Progress',date:'',time:'',location:'',attendees:'',agenda:'',minutes:'',actions:'',status:'Scheduled',project_id:'',link:'' };

export function Meetings() {
  const { useList, useCreate, useUpdate, useDelete } = useMeetings;
  const { data: raw = [], isLoading } = useList();
  const meetings = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState<SubTab>('upcoming');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0,10);

  const filtered = meetings.filter(m => {
    if (subTab==='upcoming') return String(m.date??'')>=today && m.status!=='Cancelled' && m.status!=='Completed';
    const title = String(m.title??'').toLowerCase();
    const type = String(m.meeting_type??'').toLowerCase();
    const matchSearch = title.includes(search.toLowerCase()) || type.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const upcomingCount = meetings.filter(m=>m.status==='Scheduled' && String(m.date??'')>=today).length;
  const completedCount = meetings.filter(m=>m.status==='Completed').length;
  const actionItems = meetings.filter(m=>String(m.actions??'').trim().length>0).reduce((acc,m)=>acc+String(m.actions??'').split('\n').length, 0);
  const openActions = meetings.filter(m=>String(m.actions??'').includes('OPEN')).length;
  const recurringMeetings = meetings.filter(m=>Boolean(m.recurring)).length;

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
          <h1 className="text-2xl font-bold text-white">Meetings</h1>
          <p className="text-sm text-gray-500 mt-1">Site meetings, minutes & action items</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>Schedule Meeting</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label:'Upcoming', value:upcomingCount, icon:Calendar, colour:'text-blue-400', bg:'bg-blue-500/20' },
          { label:'Completed', value:completedCount, icon:CheckCircle, colour:'text-green-400', bg:'bg-green-500/20' },
          { label:'Action Items', value:actionItems, icon:AlertTriangle, colour:'text-orange-400', bg:'bg-orange-500/20' },
          { label:'Open Actions', value:openActions, icon:BarChart2, colour:'text-red-400', bg:'bg-red-500/20' },
          { label:'Recurring', value:recurringMeetings, icon:Clock, colour:'text-purple-400', bg:'bg-purple-500/20' },
        ].map(kpi=>(
          <div key={kpi.label} className="bg-gray-900 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour}/></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-white">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-gray-700 overflow-x-auto">
        {([
          { key:'upcoming', label:'Upcoming' },
          { key:'minutes', label:'Minutes' },
          { key:'actions', label:'Actions' },
          { key:'recurring', label:'Recurring' },
          { key:'templates', label:'Templates' },
        ] as Array<{key: SubTab; label: string}>).map(t=>(
          <button key={t.key} onClick={()=>setSubTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${subTab===t.key?'border-orange-600 text-orange-400':'border-transparent text-gray-500 hover:text-gray-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {subTab !== 'templates' && (
        <div className="flex flex-wrap gap-3 items-center bg-gray-900 rounded-xl border border-gray-700 p-4">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="w-full pl-9 pr-4 py-2 text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
            {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
          </select>
          <span className="text-sm text-gray-500 ml-auto">{filtered.length} found</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : (
        <>
          {subTab === 'upcoming' && (
            <div className="bg-gray-900 rounded-xl border border-gray-700 divide-y divide-gray-700">
              {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><Calendar size={40} className="mx-auto mb-3 opacity-30"/><p>No upcoming meetings</p></div>}
              {filtered.map(m => {
                const id = String(m.id??'');
                const isExp = expanded === id;
                return (
                  <div key={id}>
                    <div className="flex items-center gap-4 p-4 hover:bg-gray-800 cursor-pointer" onClick={()=>setExpanded(isExp?null:id)}>
                      <div className="w-14 text-center flex-shrink-0 rounded-lg py-2 bg-gray-800">
                        <p className="text-xs font-bold text-gray-300">{String(m.date??'—').slice(5)}</p>
                        {!!m.time && <p className="text-xs text-gray-500">{String(m.time)}</p>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{String(m.title??'Untitled')}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-500">{String(m.meeting_type??'')}</span>
                          {!!m.location && <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10}/>{String(m.location)}</span>}
                          {!!m.attendees && <span className="text-xs text-gray-500 flex items-center gap-1"><Users size={10}/>{String(m.attendees).split(',').length} attendees</span>}
                          {!!m.link && <span className="text-xs text-blue-400 flex items-center gap-1"><Video size={10}/>Online</span>}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(m.status??'')] ?? 'bg-gray-800 text-gray-300'}`}>{String(m.status??'')}</span>
                      <div className="flex items-center gap-1">
                        {m.status==='Scheduled' && <button onClick={e=>{e.stopPropagation();markComplete(m);}} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded" title="Mark Complete"><CheckCircle size={14}/></button>}
                        <button onClick={e=>{e.stopPropagation();openEdit(m);}} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 rounded"><Edit2 size={14}/></button>
                        <button onClick={e=>{e.stopPropagation();handleDelete(id);}} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded"><Trash2 size={14}/></button>
                        {isExp?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
                      </div>
                    </div>
                    {isExp && (
                      <div className="px-6 pb-5 bg-gray-900 space-y-3 text-sm">
                        {!!m.attendees && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Attendees</p><p className="text-gray-300">{String(m.attendees)}</p></div>}
                        {!!m.agenda && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Agenda</p><p className="text-gray-300 whitespace-pre-wrap">{String(m.agenda)}</p></div>}
                        {!!m.minutes && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Minutes</p><p className="text-gray-300 whitespace-pre-wrap">{String(m.minutes)}</p></div>}
                        {!!m.actions && <div><p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1">Action Items</p><p className="text-gray-300 whitespace-pre-wrap">{String(m.actions)}</p></div>}
                        {!!m.link && <div><p className="text-xs text-gray-400 mb-1">Meeting Link</p><a href={String(m.link)} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs">{String(m.link)}</a></div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {subTab === 'minutes' && (
            <div className="bg-gray-900 rounded-xl border border-gray-700 divide-y divide-gray-700">
              {meetings.filter(m=>String(m.minutes??'').trim().length>0).length === 0 ? (
                <div className="text-center py-16 text-gray-400"><Calendar size={40} className="mx-auto mb-3 opacity-30"/><p>No meeting minutes recorded</p></div>
              ) : (
                meetings.filter(m=>String(m.minutes??'').trim().length>0).map(m => {
                  const id = String(m.id??'');
                  const isExp = expanded === `min-${id}`;
                  return (
                    <div key={id} onClick={()=>setExpanded(isExp?null:`min-${id}`)} className="p-4 hover:bg-gray-800 cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">{String(m.title??'Meeting')}</h3>
                        {isExp?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
                      </div>
                      <p className="text-xs text-gray-500">{String(m.date??'')}</p>
                      {isExp && <p className="text-sm text-gray-300 mt-3 whitespace-pre-wrap">{String(m.minutes??'')}</p>}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {subTab === 'actions' && (
            <div className="bg-gray-900 rounded-xl border border-gray-700 divide-y divide-gray-700">
              {actionItems === 0 ? (
                <div className="text-center py-16 text-gray-400"><AlertTriangle size={40} className="mx-auto mb-3 opacity-30"/><p>No action items</p></div>
              ) : (
                meetings.filter(m=>String(m.actions??'').trim().length>0).map(m => (
                  <div key={String(m.id)} className="p-4">
                    <p className="font-semibold text-white mb-2">{String(m.title??'Meeting')} ({String(m.date??'')})</p>
                    <div className="space-y-2">
                      {String(m.actions??'').split('\n').filter((a:string)=>a.trim()).map((action:string,i:number)=>(
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0"/>
                          <p className="text-gray-300">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {subTab === 'recurring' && (
            <div className="bg-gray-900 rounded-xl border border-gray-700 divide-y divide-gray-700">
              {recurringMeetings === 0 ? (
                <div className="text-center py-16 text-gray-400"><Clock size={40} className="mx-auto mb-3 opacity-30"/><p>No recurring meetings</p></div>
              ) : (
                meetings.filter(m=>Boolean(m.recurring)).map(m => (
                  <div key={String(m.id)} className="p-4 hover:bg-gray-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">{String(m.title??'Meeting')}</h3>
                      <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">Recurring</span>
                    </div>
                    <p className="text-sm text-gray-400">{String(m.meeting_type??'')} • {String(m.time??'')} • {String(m.location??'—')}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {subTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATES.map(t=>(
                <div key={t.name} className="bg-gray-900 rounded-xl border border-gray-700 p-4">
                  <h3 className="font-semibold text-white mb-3">{t.name}</h3>
                  <ul className="space-y-1 mb-4">
                    {t.items.map((item,i)=>(
                      <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                        <span className="text-orange-400">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={()=>{setSelectedTemplate(t.name);setShowTemplateModal(true);}} className="w-full px-3 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 font-medium">
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-white">{editing?'Edit Meeting':'Schedule Meeting'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Meeting Title *</label>
                  <input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Meeting Type</label>
                  <select value={form.meeting_type} onChange={e=>setForm(f=>({...f,meeting_type:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {MEETING_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Time</label>
                  <input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                  <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="e.g. Site Office" className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Attendees</label>
                  <input value={form.attendees} onChange={e=>setForm(f=>({...f,attendees:e.target.value}))} placeholder="e.g. John Smith, Sarah Jones" className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Agenda</label>
                  <textarea rows={3} value={form.agenda} onChange={e=>setForm(f=>({...f,agenda:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Minutes</label>
                  <textarea rows={3} value={form.minutes} onChange={e=>setForm(f=>({...f,minutes:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Action Items</label>
                  <textarea rows={3} value={form.actions} onChange={e=>setForm(f=>({...f,actions:e.target.value}))} placeholder="List any action items with owner names…" className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Online Meeting Link</label>
                  <input type="url" value={form.link} onChange={e=>setForm(f=>({...f,link:e.target.value}))} placeholder="https://teams.microsoft.com/…" className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
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
