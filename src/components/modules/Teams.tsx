import { useState } from 'react';
import { Users, Plus, Search, Phone, Mail, Briefcase, Edit2, Trash2, X, ChevronDown, ChevronUp, Shield, Clock, Award, AlertTriangle, PoundSterling, MapPin, CheckCircle2, AlertCircle, Calendar, Upload } from 'lucide-react';
import { useTeam } from '../../hooks/useData';
import { uploadFile } from '../../services/api';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const ROLES = ['Site Manager','Project Manager','Foreman','Carpenter','Bricklayer','Electrician','Plumber','Steel Fixer','Labourer','Health & Safety Officer','QS','Engineer'];
const TRADE_TYPES = ['Management','Structural','Electrical','Mechanical','Civil','Finishing','Safety'];
const STATUS_OPTIONS = ['Active','On Leave','Signed Off','Inactive'];

const SKILLS = ['CSCS', 'First Aid', 'Working at Height', 'Confined Space', 'Asbestos Awareness', 'Scaffold Inspection', 'MEWP', 'Plant Operator'];
const CSCS_TYPES = ['Gold', 'Blue', 'Green', 'White'];

const statusColour: Record<string,string> = {
  'Active':'bg-green-900 text-green-100','On Leave':'bg-amber-900 text-amber-100',
  'Signed Off':'bg-blue-900 text-blue-100','Inactive':'bg-gray-800 text-gray-400',
};

const emptyForm = { name:'',role:'',trade_type:'',email:'',phone:'',daily_rate:'',cscs_card:'',cscs_expiry:'',cscs_type:'Gold',status:'Active',notes:'' };

// Mock skill assignments (in real app, would come from API)
function getMemberSkills(name: string): Record<string, 'yes'|'no'|'expired'> {
  const mockSkills: Record<string, Record<string, 'yes'|'no'|'expired'>> = {
    'John Smith': { 'CSCS': 'yes', 'First Aid': 'yes', 'Working at Height': 'yes', 'Confined Space': 'no', 'Asbestos Awareness': 'yes', 'Scaffold Inspection': 'no', 'MEWP': 'expired', 'Plant Operator': 'yes' },
    'Sarah Johnson': { 'CSCS': 'yes', 'First Aid': 'yes', 'Working at Height': 'yes', 'Confined Space': 'yes', 'Asbestos Awareness': 'no', 'Scaffold Inspection': 'yes', 'MEWP': 'yes', 'Plant Operator': 'no' },
    'Mike Davis': { 'CSCS': 'yes', 'First Aid': 'no', 'Working at Height': 'yes', 'Confined Space': 'yes', 'Asbestos Awareness': 'yes', 'Scaffold Inspection': 'yes', 'MEWP': 'no', 'Plant Operator': 'yes' },
  };
  return mockSkills[name] || {};
}

// Mock induction records
function getMemberInductions(name: string): Array<{ project: string; date: string; nextDue: string; status: 'current'|'due_soon'|'overdue' }> {
  const today = new Date();
  return [
    { project: 'Central Tower', date: '2025-09-15', nextDue: '2026-03-15', status: today.getTime() < new Date('2026-03-15').getTime() ? 'current' : 'due_soon' },
    { project: 'Metro Link', date: '2025-11-20', nextDue: '2026-05-20', status: 'current' },
  ];
}

// Mock availability
function getMemberAvailability(name: string): Record<string, 'onsite'|'office'|'off'|'sick'> {
  const mockAvail: Record<string, Record<string, 'onsite'|'office'|'off'|'sick'>> = {
    'John Smith': { 'Mon': 'onsite', 'Tue': 'onsite', 'Wed': 'onsite', 'Thu': 'office', 'Fri': 'onsite' },
    'Sarah Johnson': { 'Mon': 'onsite', 'Tue': 'office', 'Wed': 'onsite', 'Thu': 'onsite', 'Fri': 'onsite' },
    'Mike Davis': { 'Mon': 'onsite', 'Tue': 'onsite', 'Wed': 'onsite', 'Thu': 'onsite', 'Fri': 'off' },
  };
  return mockAvail[name] || { 'Mon': 'off', 'Tue': 'off', 'Wed': 'off', 'Thu': 'off', 'Fri': 'off' };
}

export function Teams() {
  const { useList, useCreate, useUpdate, useDelete } = useTeam;
  const { data: raw = [], isLoading } = useList();
  const members = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState<'members'|'skills'|'cscs'|'inductions'|'onsite'>('members');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [uploadingCscs, setUploadingCscs] = useState<string | null>(null);

  const filtered = members.filter(m => {
    const name = String(m.name ?? '').toLowerCase();
    const role = String(m.role ?? '').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || role.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = members.filter(m => m.status === 'Active').length;
  const onLeaveCount = members.filter(m => m.status === 'On Leave').length;
  const totalDailyCost = members.filter(m => m.status === 'Active').reduce((s, m) => s + Number(m.daily_rate ?? 0), 0);
  const weeklyForecast = totalDailyCost * 5;
  const monthlyForecast = totalDailyCost * 21;

  const cscsExpiring = members.filter(m => {
    if (!m.cscs_expiry) return false;
    const diff = (new Date(String(m.cscs_expiry)).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 30;
  }).length;

  const cscsAlerts = members.filter(m => {
    if (!m.cscs_expiry) return true;
    const diff = (new Date(String(m.cscs_expiry)).getTime() - Date.now()) / 86400000;
    return diff < 60;
  });

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(m: AnyRow) {
    setEditing(m);
    setForm({ name:String(m.name??''),role:String(m.role??''),trade_type:String(m.trade_type??''),email:String(m.email??''),phone:String(m.phone??''),daily_rate:String(m.daily_rate??''),cscs_card:String(m.cscs_card??''),cscs_expiry:String(m.cscs_expiry??''),cscs_type:String(m.cscs_type??'Gold'),status:String(m.status??'Active'),notes:String(m.notes??'') });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, daily_rate: Number(form.daily_rate)||0 };
    if (editing) { await updateMutation.mutateAsync({ id: String(editing.id), data: payload }); toast.success('Member updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Member added'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this team member?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Member removed');
  }

  async function renewCSCS(id: string) {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    await updateMutation.mutateAsync({ id, data: { cscs_expiry: nextYear.toISOString().split('T')[0] } });
    toast.success('CSCS card renewed');
  }

  async function handleUploadCscsCert(memberId: string, file: File) {
    setUploadingCscs(memberId);
    try {
      await uploadFile(file, 'REPORTS');
      toast.success(`Uploaded: ${file.name}`);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploadingCscs(null);
    }
  }

  function getAvailabilityColor(status: string): string {
    switch (status) {
      case 'onsite': return 'bg-green-900 text-green-100';
      case 'office': return 'bg-yellow-900 text-yellow-100';
      case 'sick': return 'bg-red-900 text-red-100';
      case 'off': return 'bg-gray-800 text-gray-400';
      default: return 'bg-gray-800 text-gray-400';
    }
  }

  function getInductionColor(status: string): string {
    switch (status) {
      case 'current': return 'bg-green-900 text-green-100';
      case 'due_soon': return 'bg-amber-900 text-amber-100';
      case 'overdue': return 'bg-red-900 text-red-100';
      default: return 'bg-gray-800 text-gray-400';
    }
  }

  function MemberRow({ m }: { m: AnyRow }) {
    const id = String(m.id??'');
    const isExp = expanded === id;
    const expiring = (() => {
      if (!m.cscs_expiry) return false;
      const d = (new Date(String(m.cscs_expiry)).getTime() - Date.now()) / 86400000;
      return d < 60;
    })();
    const expired = (() => {
      if (!m.cscs_expiry) return false;
      return new Date(String(m.cscs_expiry)).getTime() < Date.now();
    })();
    return (
      <div>
        <div className="flex items-center gap-4 p-4 hover:bg-gray-800 cursor-pointer border-b border-gray-700" onClick={()=>setExpanded(isExp?null:id)}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {String(m.name??'?').split(' ').map((n:string)=>n[0]).slice(0,2).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-white truncate">{String(m.name??'Unknown')}</p>
              {expired && <span className="text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded-full">CSCS Expired</span>}
              {!expired && expiring && <span className="text-xs bg-amber-900 text-amber-200 px-2 py-0.5 rounded-full">CSCS Expiring</span>}
              {!m.cscs_card && <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">No CSCS</span>}
            </div>
            <p className="text-sm text-gray-400">{String(m.role??'')} {m.trade_type?`· ${m.trade_type}`:''}</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {!!m.daily_rate && <span className="text-sm font-medium text-gray-300">£{Number(m.daily_rate).toLocaleString()}/day</span>}
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(m.status??'')] ?? 'bg-gray-800 text-gray-400'}`}>{String(m.status??'')}</span>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button type="button" onClick={e=>{e.stopPropagation();openEdit(m);}} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-900/30 rounded"><Edit2 size={14}/></button>
            <button type="button" onClick={e=>{e.stopPropagation();handleDelete(id);}} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/30 rounded"><Trash2 size={14}/></button>
            {isExp?<ChevronUp size={16} className="text-gray-500"/>:<ChevronDown size={16} className="text-gray-500"/>}
          </div>
        </div>
        {isExp && (
          <div className="px-6 pb-4 bg-gray-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-b border-gray-700">
            {!!m.email && <div><p className="text-xs text-gray-400 mb-1">Email</p><a href={`mailto:${m.email}`} className="flex items-center gap-1 text-blue-400 hover:underline"><Mail size={12}/>{String(m.email)}</a></div>}
            {!!m.phone && <div><p className="text-xs text-gray-400 mb-1">Phone</p><a href={`tel:${m.phone}`} className="flex items-center gap-1 text-blue-400 hover:underline"><Phone size={12}/>{String(m.phone)}</a></div>}
            {!!m.cscs_card && <div><p className="text-xs text-gray-400 mb-1">CSCS Card</p><p className="flex items-center gap-1 text-yellow-400"><Award size={12}/>{String(m.cscs_card)} (Type: {String(m.cscs_type??'Gold')})</p></div>}
            {!!m.cscs_expiry && <div><p className="text-xs text-gray-400 mb-1">CSCS Expiry</p><p className={expiring?'text-red-400 font-medium':'text-gray-300'}>{String(m.cscs_expiry)}</p></div>}
            {!!m.notes && <div className="col-span-2 md:col-span-4"><p className="text-xs text-gray-400 mb-1">Notes</p><p className="text-gray-300">{String(m.notes)}</p></div>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Team Management</h1>
          <p className="text-sm text-gray-400 mt-1">Site workforce & personnel records</p>
        </div>
        <button type="button" onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>Add Member</span>
        </button>
      </div>

      {/* Labour Cost KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Active Workers', value:activeCount, icon:Users, colour:'text-blue-400', bg:'bg-blue-900/30' },
          { label:'Daily Labour Cost', value:`£${totalDailyCost.toLocaleString()}`, icon:PoundSterling, colour:'text-green-400', bg:'bg-green-900/30' },
          { label:'Weekly Forecast', value:`£${weeklyForecast.toLocaleString()}`, icon:Clock, colour:'text-purple-400', bg:'bg-purple-900/30' },
          { label:'Monthly Forecast', value:`£${monthlyForecast.toLocaleString()}`, icon:TrendingUp, colour:'text-orange-400', bg:'bg-orange-900/30' },
        ].map(kpi=>(
          <div key={kpi.label} className={`rounded-xl border border-gray-700 p-4 ${kpi.bg}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-800"><kpi.icon size={20} className={kpi.colour}/></div>
              <div><p className="text-xs text-gray-400">{kpi.label}</p><p className="text-xl font-bold text-white">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* CSCS Alert Banner */}
      {cscsExpiring > 0 && (
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-400 flex-shrink-0"/>
          <div>
            <p className="font-semibold text-amber-200">{cscsExpiring} CSCS card{cscsExpiring !== 1 ? 's' : ''} expiring within 30 days</p>
            <p className="text-sm text-amber-300">Review and renew certifications to maintain compliance</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-700 overflow-x-auto">
        {([
          { key:'members'    as const, label:'Members',     icon:Users },
          { key:'skills'     as const, label:'Skills',      icon:Shield },
          { key:'cscs'       as const, label:'CSCS Cards',  icon:Award },
          { key:'inductions' as const, label:'Inductions',  icon:Calendar },
          { key:'onsite'     as const, label:'On Site',     icon:MapPin },
        ]).map(t=>(
          <button type="button"  key={t.key} onClick={()=>setSubTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${subTab===t.key?'border-orange-600 text-orange-400':'border-transparent text-gray-400 hover:text-gray-300'}`}>
            <t.icon size={16}/>
            {t.label}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {subTab === 'members' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center bg-gray-900 rounded-xl border border-gray-700 p-4">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or role…" className="w-full pl-9 pr-4 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
            </div>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500">
              {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-500"><Users size={40} className="mx-auto mb-3 opacity-30"/><p>No team members found</p></div>
              ) : (
                filtered.map(m => <MemberRow key={String(m.id)} m={m} />)
              )}
            </div>
          )}
        </div>
      )}

      {/* Skills Matrix Tab */}
      {subTab === 'skills' && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Member</th>
                {SKILLS.map(skill => <th key={skill} className="text-center px-3 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider min-w-24">{skill}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {members.filter(m=>m.status==='Active').map(m=>{
                const skills = getMemberSkills(String(m.name??''));
                return (
                  <tr key={String(m.id)} className="hover:bg-gray-800">
                    <td className="px-6 py-4 font-medium text-white">{String(m.name??'Unknown')}</td>
                    {SKILLS.map(skill=>{
                      const status = skills[skill];
                      return (
                        <td key={skill} className="text-center px-3 py-4">
                          {status === 'yes' && <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-900 text-green-100"><CheckCircle2 size={14}/></span>}
                          {status === 'no' && <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-900 text-red-100">✗</span>}
                          {status === 'expired' && <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-amber-900 text-amber-200">Exp</span>}
                          {!status && <span className="text-gray-500">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {members.filter(m=>m.status==='Active').length === 0 && <div className="text-center py-12 text-gray-500"><Shield size={32} className="mx-auto mb-2 opacity-30"/><p>No active members to display</p></div>}
        </div>
      )}

      {/* CSCS Cards Tab */}
      {subTab === 'cscs' && (
        <div className="space-y-4">
          {cscsAlerts.length > 0 && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
              <p className="text-sm text-red-300">⚠ {cscsAlerts.length} member{cscsAlerts.length !== 1 ? 's' : ''} with expired or expiring CSCS cards</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.filter(m=>m.status==='Active').map(m=>{
              const expiry = m.cscs_expiry ? new Date(String(m.cscs_expiry)) : null;
              const daysUntil = expiry ? Math.floor((expiry.getTime() - Date.now()) / 86400000) : null;
              const isExpired = daysUntil !== null && daysUntil < 0;
              const isExpiring = daysUntil !== null && daysUntil >= 0 && daysUntil <= 30;

              let colorClass = 'bg-green-900 text-green-100';
              if (isExpired) colorClass = 'bg-red-900 text-red-100';
              else if (isExpiring) colorClass = 'bg-amber-900 text-amber-100';

              return (
                <div key={String(m.id)} className={`rounded-xl border border-gray-700 p-5 ${colorClass}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold">{String(m.name??'?').split(' ').map((n:string)=>n[0]).slice(0,1).join('')}</div>
                      <div>
                        <p className="font-semibold">{String(m.name??'Unknown')}</p>
                        <p className="text-xs opacity-75">{String(m.role??'')}</p>
                      </div>
                    </div>
                    {isExpired && <AlertTriangle size={20} className="text-red-300"/>}
                  </div>

                  <div className="space-y-3 text-sm">
                    {m.cscs_card ? (
                      <>
                        <div>
                          <p className="opacity-75 text-xs">Card Type</p>
                          <p className="font-semibold">{String(m.cscs_type??'Gold')}</p>
                        </div>
                        <div>
                          <p className="opacity-75 text-xs">Card Number</p>
                          <p className="font-mono">{String(m.cscs_card)}</p>
                        </div>
                        {expiry && (
                          <div>
                            <p className="opacity-75 text-xs">Expiry Date</p>
                            <p className="font-semibold">{expiry.toLocaleDateString()}</p>
                            {daysUntil !== null && (
                              <p className="text-xs opacity-75 mt-1">
                                {isExpired ? `Expired ${Math.abs(daysUntil)} days ago` : `${daysUntil} days remaining`}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="opacity-75">No CSCS card on file</p>
                    )}
                  </div>

                  <div className="w-full h-24 bg-gray-700 rounded-lg mt-4 flex items-center justify-center text-xs opacity-50">QR Code Placeholder</div>

                  {Boolean(m.cscs_card) && isExpiring && (
                    <button type="button" onClick={()=>renewCSCS(String(m.id))} className="w-full mt-4 px-3 py-2 bg-gray-800/20 hover:bg-gray-800/30 rounded-lg text-sm font-medium transition-colors">
                      Renew Certificate
                    </button>
                  )}

                  <input
                    type="file"
                    id={`upload-cscs-${m.id}`}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadCscsCert(String(m.id), file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    onClick={() => document.getElementById(`upload-cscs-${m.id}`)?.click()}
                    disabled={uploadingCscs === String(m.id)}
                    className="w-full mt-2 px-3 py-2 bg-blue-900/30 hover:bg-blue-900/50 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload size={14} />
                    {uploadingCscs === String(m.id) ? 'Uploading...' : 'Upload CSCS Certificate'}
                  </button>
                </div>
              );
            })}
          </div>
          {members.filter(m=>m.status==='Active').length === 0 && <div className="text-center py-12 text-gray-500"><Award size={32} className="mx-auto mb-2 opacity-30"/><p>No active members to display</p></div>}
        </div>
      )}

      {/* Inductions Tab */}
      {subTab === 'inductions' && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Member</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Project</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Inducted</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Re-Induction Due</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {members.filter(m=>m.status==='Active').flatMap(m=>
                getMemberInductions(String(m.name??'')).map(ind=>(
                  <tr key={`${m.id}-${ind.project}`} className="hover:bg-gray-800">
                    <td className="px-6 py-4 font-medium text-white">{String(m.name??'Unknown')}</td>
                    <td className="px-6 py-4 text-gray-300">{ind.project}</td>
                    <td className="px-6 py-4 text-gray-400">{new Date(ind.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-400">{new Date(ind.nextDue).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getInductionColor(ind.status)}`}>
                        {ind.status === 'current' && 'Current'}
                        {ind.status === 'due_soon' && 'Due Soon'}
                        {ind.status === 'overdue' && 'Overdue'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {members.filter(m=>m.status==='Active').length === 0 && <div className="text-center py-12 text-gray-500"><Calendar size={32} className="mx-auto mb-2 opacity-30"/><p>No active members to display</p></div>}
        </div>
      )}

      {/* On Site Tab */}
      {subTab === 'onsite' && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Member</th>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day=><th key={day} className="text-center px-4 py-3 text-xs font-semibold text-gray-300 uppercase">{day}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {members.filter(m=>m.status==='Active').map(m=>{
                const avail = getMemberAvailability(String(m.name??''));
                return (
                  <tr key={String(m.id)} className="hover:bg-gray-800">
                    <td className="px-6 py-4 font-medium text-white">{String(m.name??'Unknown')}</td>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day=>{
                      const status = avail[day];
                      return (
                        <td key={day} className="text-center px-4 py-4">
                          <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${getAvailabilityColor(status)}`}>
                            {status === 'onsite' && 'On Site'}
                            {status === 'office' && 'Office'}
                            {status === 'sick' && 'Sick'}
                            {status === 'off' && 'Off'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {members.filter(m=>m.status==='Active').length === 0 && <div className="text-center py-12 text-gray-500"><MapPin size={32} className="mx-auto mb-2 opacity-30"/><p>No active members to display</p></div>}
        </div>
      )}

      {/* Member Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-white">{editing?'Edit Member':'Add Team Member'}</h2>
              <button type="button" onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg"><X size={18} className="text-gray-400"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                  <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                  <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select role…</option>
                    {ROLES.map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Trade Type</label>
                  <select value={form.trade_type} onChange={e=>setForm(f=>({...f,trade_type:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select trade…</option>
                    {TRADE_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Daily Rate (£)</label>
                  <input type="number" step="0.01" value={form.daily_rate} onChange={e=>setForm(f=>({...f,daily_rate:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                  <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">CSCS Card Number</label>
                  <input value={form.cscs_card} onChange={e=>setForm(f=>({...f,cscs_card:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">CSCS Card Type</label>
                  <select value={form.cscs_type} onChange={e=>setForm(f=>({...f,cscs_type:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {CSCS_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">CSCS Expiry Date</label>
                  <input type="date" value={form.cscs_expiry} onChange={e=>setForm(f=>({...f,cscs_expiry:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing?'Update Member':'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TrendingUp(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
