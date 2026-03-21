import { useState } from 'react';
import { Truck, Plus, Search, Wrench, AlertTriangle, CheckCircle, Clock, Edit2, Trash2, X, ChevronDown, ChevronUp, Calendar, PoundSterling } from 'lucide-react';
import { useEquipment } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const CATEGORIES = ['Excavator','Crane','Forklift','MEWP','Scaffold','Generator','Compressor','Concrete Mixer','Dumper','Roller','Piling Rig','Telehandler','Skip Lorry','Tower Crane','Pump'];
const STATUS_OPTIONS = ['Available','In Use','Under Service','Off Hire','Fault Reported'];
const OWNERSHIP = ['Owned','Hired','Lease'];

const statusColour: Record<string,string> = {
  'Available':'bg-green-100 text-green-800','In Use':'bg-blue-100 text-blue-800',
  'Under Service':'bg-yellow-100 text-yellow-800','Off Hire':'bg-gray-100 text-gray-700','Fault Reported':'bg-red-100 text-red-700',
};

const emptyForm = { name:'',category:'',serial_number:'',status:'Available',ownership:'Owned',daily_cost:'',service_due:'',inspection_due:'',mewp_check:'',project_id:'',supplier:'',notes:'' };

export function PlantEquipment() {
  const { useList, useCreate, useUpdate, useDelete } = useEquipment;
  const { data: raw = [], isLoading } = useList();
  const equipment = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState<'fleet'|'alerts'|'costs'>('fleet');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = equipment.filter(e => {
    const name = String(e.name??'').toLowerCase();
    const cat = String(e.category??'').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || cat.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    const matchCat = categoryFilter === 'All' || e.category === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const availableCount = equipment.filter(e=>e.status==='Available').length;
  const inUseCount = equipment.filter(e=>e.status==='In Use').length;
  const faultCount = equipment.filter(e=>e.status==='Fault Reported').length;
  const servicesDue = equipment.filter(e => {
    if (!e.service_due) return false;
    const diff = (new Date(String(e.service_due)).getTime()-Date.now())/86400000;
    return diff >= 0 && diff <= 14;
  }).length;
  const inspDue = equipment.filter(e => {
    if (!e.inspection_due) return false;
    const diff = (new Date(String(e.inspection_due)).getTime()-Date.now())/86400000;
    return diff >= 0 && diff <= 14;
  }).length;
  const hiredCost = equipment.filter(e=>e.ownership==='Hired').reduce((s,e)=>s+Number(e.daily_cost??0),0);

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(e: AnyRow) {
    setEditing(e);
    setForm({ name:String(e.name??''),category:String(e.category??''),serial_number:String(e.serial_number??''),status:String(e.status??'Available'),ownership:String(e.ownership??'Owned'),daily_cost:String(e.daily_cost??''),service_due:String(e.service_due??''),inspection_due:String(e.inspection_due??''),mewp_check:String(e.mewp_check??''),project_id:String(e.project_id??''),supplier:String(e.supplier??''),notes:String(e.notes??'') });
    setShowModal(true);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const payload = { ...form, daily_cost:Number(form.daily_cost)||0 };
    if (editing) { await updateMutation.mutateAsync({ id:String(editing.id), data:payload }); toast.success('Equipment updated'); }
    else { await createMutation.mutateAsync(payload); toast.success('Equipment added'); }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this equipment?')) return;
    await deleteMutation.mutateAsync(id); toast.success('Equipment removed');
  }

  async function changeStatus(e: AnyRow, status: string) {
    await updateMutation.mutateAsync({ id:String(e.id), data:{ status } });
    toast.success(`Status set to ${status}`);
  }

  const uniqueCategories = ['All',...Array.from(new Set(equipment.map(e=>String(e.category??'')).filter(Boolean)))];

  // Maintenance alerts: service/inspection overdue or within 14 days + faults
  const maintenanceAlerts = equipment.filter(e => {
    if (e.status === 'Fault Reported') return true;
    const svc = e.service_due ? (new Date(String(e.service_due)).getTime()-Date.now())/86400000 : null;
    const ins = e.inspection_due ? (new Date(String(e.inspection_due)).getTime()-Date.now())/86400000 : null;
    return (svc !== null && svc <= 14) || (ins !== null && ins <= 14);
  });

  // Hire costs
  const hiredEquipment = equipment.filter(e=>e.ownership==='Hired');
  const totalHireDaily = hiredEquipment.reduce((s,e)=>s+Number(e.daily_cost??0),0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plant & Equipment</h1>
          <p className="text-sm text-gray-500 mt-1">Asset tracking, inspections & MEWP checks</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
          <Plus size={16}/><span>Add Equipment</span>
        </button>
      </div>

      {(servicesDue > 0 || inspDue > 0 || faultCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {faultCount > 0 && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2"><AlertTriangle size={16} className="text-red-600"/><span className="text-sm text-red-700 font-medium">{faultCount} fault{faultCount>1?'s':''} reported</span></div>}
          {servicesDue > 0 && <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2"><Wrench size={16} className="text-yellow-600"/><span className="text-sm text-yellow-700 font-medium">{servicesDue} service{servicesDue>1?'s':''} due in 14 days</span></div>}
          {inspDue > 0 && <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2"><Calendar size={16} className="text-orange-600"/><span className="text-sm text-orange-700 font-medium">{inspDue} inspection{inspDue>1?'s':''} due in 14 days</span></div>}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Available', value:availableCount, icon:CheckCircle, colour:'text-green-600', bg:'bg-green-50' },
          { label:'In Use', value:inUseCount, icon:Truck, colour:'text-blue-600', bg:'bg-blue-50' },
          { label:'Hire Cost (Daily)', value:`£${hiredCost.toLocaleString()}`, icon:PoundSterling, colour:'text-orange-600', bg:'bg-orange-50' },
          { label:'Faults Reported', value:faultCount, icon:AlertTriangle, colour:faultCount>0?'text-red-600':'text-gray-600', bg:faultCount>0?'bg-red-50':'bg-gray-50' },
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
          { key:'fleet',  label:'Fleet',              icon:Truck,          count:equipment.length },
          { key:'alerts', label:'Maintenance Alerts',  icon:Wrench,         count:maintenanceAlerts.length },
          { key:'costs',  label:'Hire Costs',          icon:PoundSterling,  count:null },
        ] as const).map(t=>(
          <button key={t.key} onClick={()=>setSubTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab===t.key?'border-orange-600 text-orange-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={14}/>{t.label}
            {t.count!==null && <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key==='alerts'&&t.count>0?'bg-red-100 text-red-700':'bg-gray-100 text-gray-600'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── MAINTENANCE ALERTS tab ─────────────────────────── */}
      {subTab==='alerts' && (
        <div className="space-y-4">
          {maintenanceAlerts.length===0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
              <CheckCircle size={40} className="mx-auto mb-3 opacity-30 text-green-500"/>
              <p className="font-medium">All equipment services up to date</p>
              <p className="text-sm mt-1">No maintenance alerts in the next 14 days</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                <Wrench size={16} className="text-amber-600"/>
                <span className="text-sm font-medium text-amber-800">{maintenanceAlerts.length} item{maintenanceAlerts.length!==1?'s':''} need attention</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>{['Equipment','Category','Service Due','Inspection Due','Status','Action'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {maintenanceAlerts.map(e => {
                    const svcDays = e.service_due ? Math.round((new Date(String(e.service_due)).getTime()-Date.now())/86400000) : null;
                    const insDays = e.inspection_due ? Math.round((new Date(String(e.inspection_due)).getTime()-Date.now())/86400000) : null;
                    return (
                      <tr key={String(e.id??'')} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{String(e.name??'')}</p>
                          {!!e.serial_number && <p className="text-xs text-gray-500">S/N: {String(e.serial_number)}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{String(e.category??'—')}</td>
                        <td className="px-4 py-3">
                          {e.service_due ? <span className={svcDays!==null&&svcDays<0?'text-red-600 font-semibold':svcDays!==null&&svcDays<=7?'text-amber-600 font-medium':'text-gray-700'}>{String(e.service_due)}{svcDays!==null&&svcDays<0?' (Overdue)':svcDays!==null?` (${svcDays}d)`:''}</span> : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {e.inspection_due ? <span className={insDays!==null&&insDays<0?'text-red-600 font-semibold':insDays!==null&&insDays<=7?'text-amber-600 font-medium':'text-gray-700'}>{String(e.inspection_due)}{insDays!==null&&insDays<0?' (Overdue)':insDays!==null?` (${insDays}d)`:''}</span> : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(e.status??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(e.status??'')}</span></td>
                        <td className="px-4 py-3"><button onClick={()=>openEdit(e)} className="text-xs px-3 py-1 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 font-medium">Update</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── HIRE COSTS tab ─────────────────────────────────── */}
      {subTab==='costs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label:'Hired Items', value:hiredEquipment.length, sub:'Active hire agreements' },
              { label:'Daily Hire Cost', value:`£${totalHireDaily.toLocaleString()}`, sub:'All active hires' },
              { label:'Monthly Projection', value:`£${(totalHireDaily*21).toLocaleString()}`, sub:'21 working days' },
            ].map(c=>(
              <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm text-gray-500 mb-1">{c.label}</p>
                <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>
          {hiredEquipment.length===0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200"><PoundSterling size={32} className="mx-auto mb-2 opacity-30"/><p>No hired equipment on record</p></div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>{['Equipment','Category','Supplier','Daily Rate','Weekly','Monthly','Status',''].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {hiredEquipment.sort((a,b)=>Number(b.daily_cost??0)-Number(a.daily_cost??0)).map(e=>{
                    const d = Number(e.daily_cost??0);
                    return (
                      <tr key={String(e.id??'')} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{String(e.name??'')}</p>
                          {!!e.serial_number && <p className="text-xs text-gray-500">S/N: {String(e.serial_number)}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{String(e.category??'—')}</td>
                        <td className="px-4 py-3 text-gray-600">{String(e.supplier??'—')}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">£{d.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-700">£{(d*5).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-700">£{(d*21).toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(e.status??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(e.status??'')}</span></td>
                        <td className="px-4 py-3"><button onClick={()=>openEdit(e)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={13}/></button></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 font-semibold text-gray-900">Total ({hiredEquipment.length} items)</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">£{totalHireDaily.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">£{(totalHireDaily*5).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">£{(totalHireDaily*21).toLocaleString()}</td>
                    <td colSpan={2}/>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {subTab==='fleet' && <div className="flex flex-wrap gap-3 items-center bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search equipment…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"/>
        </div>
        <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {uniqueCategories.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          {['All',...STATUS_OPTIONS].map(s=><option key={s}>{s}</option>)}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} items</span>
      </div>}

      {subTab==='fleet' && (isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"/></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {filtered.length === 0 && <div className="text-center py-16 text-gray-400"><Truck size={40} className="mx-auto mb-3 opacity-30"/><p>No equipment found</p></div>}
          {filtered.map(e => {
            const id = String(e.id??'');
            const isExp = expanded === id;
            const serviceDue = (() => { if (!e.service_due) return false; const d=(new Date(String(e.service_due)).getTime()-Date.now())/86400000; return d>=0&&d<=14; })();
            const inspDueFlag = (() => { if (!e.inspection_due) return false; const d=(new Date(String(e.inspection_due)).getTime()-Date.now())/86400000; return d>=0&&d<=14; })();
            return (
              <div key={id}>
                <div className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer" onClick={()=>setExpanded(isExp?null:id)}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white flex-shrink-0">
                    <Truck size={18}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{String(e.name??'Unknown')}</p>
                      {serviceDue && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Service Due</span>}
                      {inspDueFlag && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Inspection Due</span>}
                    </div>
                    <p className="text-sm text-gray-500">{String(e.category??'')} {e.serial_number?`· SN: ${e.serial_number}`:''} · {String(e.ownership??'')}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    {!!e.daily_cost && <span className="text-sm text-gray-600">£{Number(e.daily_cost)}/day</span>}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(e.status??'')] ?? 'bg-gray-100 text-gray-700'}`}>{String(e.status??'')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {e.status === 'Available' && <button onClick={ev=>{ev.stopPropagation();changeStatus(e,'In Use');}} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded text-xs" title="Set In Use"><Clock size={14}/></button>}
                    {e.status === 'In Use' && <button onClick={ev=>{ev.stopPropagation();changeStatus(e,'Available');}} className="p-1.5 text-green-600 hover:bg-green-50 rounded text-xs" title="Return"><CheckCircle size={14}/></button>}
                    <button onClick={ev=>{ev.stopPropagation();openEdit(e);}} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                    <button onClick={ev=>{ev.stopPropagation();handleDelete(id);}} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                    {isExp?<ChevronUp size={16} className="text-gray-400"/>:<ChevronDown size={16} className="text-gray-400"/>}
                  </div>
                </div>
                {isExp && (
                  <div className="px-6 pb-4 bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {!!e.supplier && <div><p className="text-xs text-gray-400 mb-1">Supplier/Hire Co.</p><p>{String(e.supplier)}</p></div>}
                    {!!e.service_due && <div><p className="text-xs text-gray-400 mb-1">Service Due</p><p className={serviceDue?'text-yellow-600 font-medium':''}>{String(e.service_due)}</p></div>}
                    {!!e.inspection_due && <div><p className="text-xs text-gray-400 mb-1">Inspection Due</p><p className={inspDueFlag?'text-orange-600 font-medium':''}>{String(e.inspection_due)}</p></div>}
                    {!!e.mewp_check && <div><p className="text-xs text-gray-400 mb-1">MEWP Check</p><p>{String(e.mewp_check)}</p></div>}
                    {!!e.notes && <div className="col-span-2 md:col-span-4"><p className="text-xs text-gray-400 mb-1">Notes</p><p className="text-gray-700">{String(e.notes)}</p></div>}
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
              <h2 className="text-lg font-semibold">{editing?'Edit Equipment':'Add Equipment'}</h2>
              <button onClick={()=>setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name *</label>
                  <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">Select…</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serial / Reg Number</label>
                  <input value={form.serial_number} onChange={e=>setForm(f=>({...f,serial_number:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ownership</label>
                  <select value={form.ownership} onChange={e=>setForm(f=>({...f,ownership:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    {OWNERSHIP.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Cost (£)</label>
                  <input type="number" value={form.daily_cost} onChange={e=>setForm(f=>({...f,daily_cost:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier / Hire Co.</label>
                  <input value={form.supplier} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Due</label>
                  <input type="date" value={form.service_due} onChange={e=>setForm(f=>({...f,service_due:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Due</label>
                  <input type="date" value={form.inspection_due} onChange={e=>setForm(f=>({...f,inspection_due:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MEWP Last Check</label>
                  <input type="date" value={form.mewp_check} onChange={e=>setForm(f=>({...f,mewp_check:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createMutation.isPending||updateMutation.isPending} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                  {editing?'Update Equipment':'Add Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
