import { useState } from 'react';
import { Truck, Plus, Search, Wrench, AlertTriangle, CheckCircle, Clock, Edit2, Trash2, X, ChevronDown, ChevronUp, Calendar, PoundSterling, BarChart2 } from 'lucide-react';
import { useEquipment } from '../../hooks/useData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

const CATEGORIES = ['Excavator','Crane','Forklift','MEWP','Scaffold','Generator','Compressor','Concrete Mixer','Dumper','Roller','Piling Rig','Telehandler','Skip Lorry','Tower Crane','Pump'];
const STATUS_OPTIONS = ['Available','On Hire','In Maintenance','Retired'];
const OWNERSHIP = ['Owned','Hired','Lease'];
const SERVICE_TYPES = ['Routine','Repair','LOLER','PUWER'];
const INSPECTION_TYPES = ['LOLER','PUWER','MEWP'];

const statusColour: Record<string,string> = {
  'Available':'bg-green-900/50 text-green-300',
  'On Hire':'bg-blue-900/50 text-blue-300',
  'In Maintenance':'bg-yellow-900/50 text-yellow-300',
  'Retired':'bg-gray-700 text-gray-400',
};

const emptyForm = { name:'',category:'',serial_number:'',status:'Available',ownership:'Owned',daily_rate:'',year:'',make_model:'',service_interval:'',last_service:'',inspection_due:'',mewp_check:'',project_id:'',supplier:'',notes:'' };

export function PlantEquipment() {
  const { useList, useCreate, useUpdate, useDelete } = useEquipment;
  const { data: raw = [], isLoading } = useList();
  const equipment = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState<'fleet'|'maintenance'|'inspections'|'utilisation'|'hire'>('fleet');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = equipment.filter(e => {
    const name = String(e.name ?? '').toLowerCase();
    const cat = String(e.category ?? '').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || cat.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    const matchCat = categoryFilter === 'All' || e.category === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const onSiteCount = equipment.filter(e => e.status === 'Available' || e.status === 'On Hire').length;
  const inMaintenanceCount = equipment.filter(e => e.status === 'In Maintenance').length;
  const hireCount = equipment.filter(e => e.ownership === 'Hired').length;
  const hireCost = equipment.filter(e => e.ownership === 'Hired').reduce((s, e) => s + Number(e.daily_rate ?? 0), 0) * 21;

  const maintenanceAlerts = equipment.filter(e => {
    if (!(e.last_service ?? e.nextService)) return false;
    const nextDue = new Date(String(e.last_service ?? e.nextService));
    const interval = Number(e.service_interval ?? 90);
    nextDue.setDate(nextDue.getDate() + interval);
    return nextDue < new Date();
  });

  const inspectionAlerts = equipment.filter(e => {
    if (!e.inspection_due) return false;
    const diff = (new Date(String(e.inspection_due)).getTime() - Date.now()) / 86400000;
    return diff <= 14 && diff >= -30;
  });

  function openCreate() { setEditing(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(e: AnyRow) {
    setEditing(e);
    setForm({
      name: String(e.name ?? ''), category: String(e.category ?? ''), serial_number: String(e.serial_number ?? ''),
      status: String(e.status ?? 'Available'), ownership: String(e.ownership ?? 'Owned'), daily_rate: String(e.daily_rate ?? ''),
      year: String(e.year ?? ''), make_model: String(e.make_model ?? ''), service_interval: String(e.service_interval ?? 90),
      last_service: String(e.last_service ?? ''), inspection_due: String(e.inspection_due ?? ''), mewp_check: String(e.mewp_check ?? ''),
      project_id: String(e.project_id ?? ''), supplier: String(e.supplier ?? ''), notes: String(e.notes ?? ''),
    });
    setShowModal(true);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const payload = { ...form, daily_rate: Number(form.daily_rate) || 0 };
    if (editing) {
      await updateMutation.mutateAsync({ id: String(editing.id), data: payload });
      toast.success('Equipment updated');
    } else {
      await createMutation.mutateAsync(payload);
      toast.success('Equipment added');
    }
    setShowModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this equipment?')) return;
    await deleteMutation.mutateAsync(id);
    toast.success('Equipment removed');
  }

  async function changeStatus(e: AnyRow, status: string) {
    await updateMutation.mutateAsync({ id: String(e.id), data: { status } });
    toast.success(`Status set to ${status}`);
  }

  const uniqueCategories = ['All', ...Array.from(new Set(equipment.map(e => String(e.category ?? '')).filter(Boolean)))];

  const utilisationData = equipment.map(e => ({
    name: String(e.name ?? '').slice(0, 12),
    utilisation: Number(e.ownership === 'Hired' ? 85 : 60),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Plant & Equipment</h1>
          <p className="text-sm text-gray-400 mt-1">Asset tracking, maintenance & inspections</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /><span>Add Equipment</span>
        </button>
      </div>

      {(maintenanceAlerts.length > 0 || inspectionAlerts.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {maintenanceAlerts.length > 0 && (
            <div className="flex items-center gap-2 bg-yellow-900/30 border border-yellow-700 rounded-lg px-4 py-2">
              <Wrench size={16} className="text-yellow-400" />
              <span className="text-sm text-yellow-300 font-medium">{maintenanceAlerts.length} service{maintenanceAlerts.length > 1 ? 's' : ''} overdue</span>
            </div>
          )}
          {inspectionAlerts.length > 0 && (
            <div className="flex items-center gap-2 bg-orange-900/30 border border-orange-700 rounded-lg px-4 py-2">
              <Calendar size={16} className="text-orange-400" />
              <span className="text-sm text-orange-300 font-medium">{inspectionAlerts.length} inspection{inspectionAlerts.length > 1 ? 's' : ''} due soon</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Assets', value: equipment.length, icon: Truck, colour: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'On Site', value: onSiteCount, icon: CheckCircle, colour: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'In Maintenance', value: inMaintenanceCount, icon: Wrench, colour: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Hire Cost (MTD)', value: `£${Math.round(hireCost).toLocaleString()}`, icon: PoundSterling, colour: 'text-orange-400', bg: 'bg-orange-500/10' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour} /></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-white">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-gray-700">
        {([
          { key: 'fleet', label: 'Fleet', count: equipment.length },
          { key: 'maintenance', label: 'Maintenance', count: maintenanceAlerts.length },
          { key: 'inspections', label: 'Inspections', count: inspectionAlerts.length },
          { key: 'utilisation', label: 'Utilisation', count: null },
          { key: 'hire', label: 'Hire', count: hireCount },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab === t.key ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
            {t.label}
            {t.count !== null && <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.key === 'maintenance' && t.count > 0 ? 'bg-yellow-900/40 text-yellow-400' : 'bg-gray-800 text-gray-400'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {subTab === 'fleet' && (
        <>
          <div className="flex flex-wrap gap-3 items-center bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="relative flex-1 min-w-48">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search equipment…"
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500" />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500">
              {uniqueCategories.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500">
              {['All', ...STATUS_OPTIONS].map(s => <option key={s}>{s}</option>)}
            </select>
            <span className="text-sm text-gray-500 ml-auto">{filtered.length} items</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/50 border-b border-gray-800">
                  <tr>{['Equipment', 'Category', 'Serial', 'Location', 'Status', 'Next Service', 'Next Inspection', 'Action'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filtered.map(e => {
                    const nextSvc = e.last_service ? new Date(String(e.last_service)) : null;
                    if (nextSvc) nextSvc.setDate(nextSvc.getDate() + Number(e.service_interval ?? 90));
                    const svcOverdue = nextSvc && nextSvc < new Date();
                    return (
                      <tr key={String(e.id ?? '')} className={`hover:bg-gray-800/50 ${svcOverdue ? 'bg-red-500/5' : ''}`}>
                        <td className="px-4 py-3 font-medium text-white">{String(e.name ?? '')}</td>
                        <td className="px-4 py-3 text-gray-400">{String(e.category ?? '—')}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{String(e.serial_number ?? '—')}</td>
                        <td className="px-4 py-3 text-gray-400">{String(e.project_id ?? '—')}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColour[String(e.status ?? '')] ?? 'bg-gray-700 text-gray-300'}`}>{String(e.status ?? '')}</span></td>
                        <td className={`px-4 py-3 text-sm ${svcOverdue ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>{nextSvc ? nextSvc.toISOString().split('T')[0] : '—'}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{String(e.inspection_due ?? '—')}</td>
                        <td className="px-4 py-3"><div className="flex items-center gap-1"><button onClick={() => openEdit(e)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 rounded"><Edit2 size={14} /></button><button onClick={() => handleDelete(String(e.id))} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded"><Trash2 size={14} /></button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="text-center py-16 text-gray-500"><Truck size={40} className="mx-auto mb-3 opacity-30" /><p>No equipment found</p></div>}
            </div>
          )}
        </>
      )}

      {subTab === 'maintenance' && (
        <div className="space-y-4">
          {maintenanceAlerts.length === 0 ? (
            <div className="text-center py-16 text-gray-500 bg-gray-900 rounded-xl border border-gray-800">
              <CheckCircle size={40} className="mx-auto mb-3 opacity-30 text-green-500" />
              <p className="font-medium text-gray-300">All services up to date</p>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-4 py-3 bg-yellow-900/20 border-b border-yellow-900/40 flex items-center gap-2">
                <Wrench size={16} className="text-yellow-400" />
                <span className="text-sm font-medium text-yellow-300">{maintenanceAlerts.length} service{maintenanceAlerts.length !== 1 ? 's' : ''} overdue</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-800/60 border-b border-gray-700">
                  <tr>{['Equipment', 'Category', 'Last Service', 'Service Type', 'Service Interval', 'Engineer', 'Cost', 'Next Due'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {maintenanceAlerts.map(e => (
                    <tr key={String(e.id ?? '')} className="hover:bg-gray-800/40">
                      <td className="px-4 py-3 font-medium text-white">{String(e.name ?? '')}</td>
                      <td className="px-4 py-3 text-gray-400">{String(e.category ?? '—')}</td>
                      <td className="px-4 py-3 text-gray-300">{String(e.last_service ?? '—')}</td>
                      <td className="px-4 py-3 text-gray-400">Routine</td>
                      <td className="px-4 py-3 text-gray-400">{Number(e.service_interval ?? 90)}d</td>
                      <td className="px-4 py-3 text-gray-400">—</td>
                      <td className="px-4 py-3 text-gray-400">—</td>
                      <td className="px-4 py-3"><button onClick={() => openEdit(e)} className="text-xs px-3 py-1 bg-orange-900/40 text-orange-300 rounded-lg hover:bg-orange-900/60 font-medium">Log Service</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {subTab === 'inspections' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50 border-b border-gray-800">
              <tr>{['Equipment', 'Inspection Type', 'Last Inspection', 'Next Due', 'Inspector', 'Certificate', 'Status', 'Action'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {equipment.filter(e => e.inspection_due).map(e => {
                const nextDue = new Date(String(e.inspection_due ?? ''));
                const daysLeft = Math.round((nextDue.getTime() - Date.now()) / 86400000);
                const overdue = daysLeft < 0;
                return (
                  <tr key={String(e.id ?? '')} className={`hover:bg-gray-800/50 ${overdue ? 'bg-red-500/5' : ''}`}>
                    <td className="px-4 py-3 font-medium text-white">{String(e.name ?? '')}</td>
                    <td className="px-4 py-3 text-gray-400">LOLER / PUWER</td>
                    <td className="px-4 py-3 text-gray-300">—</td>
                    <td className={`px-4 py-3 ${overdue ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>{String(e.inspection_due)}</td>
                    <td className="px-4 py-3 text-gray-400">—</td>
                    <td className="px-4 py-3 text-gray-400">—</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${overdue ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{overdue ? 'Overdue' : 'Pending'}</span></td>
                    <td className="px-4 py-3"><button onClick={() => openEdit(e)} className="text-xs px-3 py-1 bg-blue-900/40 text-blue-300 rounded-lg hover:bg-blue-900/60 font-medium">Update</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'utilisation' && (
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><BarChart2 size={16} /> Asset Utilisation %</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={utilisationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                <Bar dataKey="utilisation" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Avg Utilisation', value: '72%', colour: 'text-blue-400' },
              { label: 'Weekly Hours Avg', value: '32h', colour: 'text-green-400' },
              { label: 'Idle Assets', value: '2', colour: 'text-yellow-400' },
              { label: 'Cost per Hour', value: '£125', colour: 'text-orange-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <p className="text-xs text-gray-500 mb-2">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.colour}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'hire' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Items on Hire', value: hireCount, colour: 'text-blue-400' },
              { label: 'Daily Cost', value: `£${equipment.filter(e => e.ownership === 'Hired').reduce((s, e) => s + Number(e.daily_rate ?? 0), 0).toLocaleString()}`, colour: 'text-orange-400' },
              { label: 'Monthly Projection', value: `£${Math.round(hireCost).toLocaleString()}`, colour: 'text-red-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.colour}`}>{stat.value}</p>
              </div>
            ))}
          </div>
          {hireCount === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-900 border border-gray-800 rounded-xl">
              <PoundSterling size={32} className="mx-auto mb-2 opacity-30" /><p>No hired equipment on record</p>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/60 border-b border-gray-700">
                  <tr>{['Equipment', 'Hire Company', 'Daily Rate', 'On Hire Date', 'Expected Off-Hire', 'Project', 'Total Cost'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {equipment.filter(e => e.ownership === 'Hired').map(e => (
                    <tr key={String(e.id ?? '')} className="hover:bg-gray-800/40">
                      <td className="px-4 py-3 font-medium text-white">{String(e.name ?? '')}</td>
                      <td className="px-4 py-3 text-gray-400">{String(e.supplier ?? '—')}</td>
                      <td className="px-4 py-3 text-white font-semibold">£{Number(e.daily_rate ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-300">—</td>
                      <td className="px-4 py-3 text-gray-300">—</td>
                      <td className="px-4 py-3 text-gray-400">{String(e.project_id ?? '—')}</td>
                      <td className="px-4 py-3 font-semibold text-white">£{(Number(e.daily_rate ?? 0) * 30).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-bold text-white">{editing ? 'Edit Equipment' : 'Add Equipment'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Equipment Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                    <option value="">Select…</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Serial / Reg Number</label>
                  <input value={form.serial_number} onChange={e => setForm(f => ({...f, serial_number: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Make/Model</label>
                  <input value={form.make_model} onChange={e => setForm(f => ({...f, make_model: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Year</label>
                  <input value={form.year} onChange={e => setForm(f => ({...f, year: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Ownership</label>
                  <select value={form.ownership} onChange={e => setForm(f => ({...f, ownership: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500">
                    {OWNERSHIP.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Daily Cost (£)</label>
                  <input type="number" value={form.daily_rate} onChange={e => setForm(f => ({...f, daily_rate: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Service Interval (days)</label>
                  <input type="number" value={form.service_interval} onChange={e => setForm(f => ({...f, service_interval: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Last Service</label>
                  <input type="date" value={form.last_service} onChange={e => setForm(f => ({...f, last_service: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Inspection Due</label>
                  <input type="date" value={form.inspection_due} onChange={e => setForm(f => ({...f, inspection_due: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">MEWP Last Check</label>
                  <input type="date" value={form.mewp_check} onChange={e => setForm(f => ({...f, mewp_check: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Supplier / Hire Co.</label>
                  <input value={form.supplier} onChange={e => setForm(f => ({...f, supplier: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
                  <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {editing ? 'Update Equipment' : 'Add Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
