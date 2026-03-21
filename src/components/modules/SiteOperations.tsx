import { useState } from 'react';
import { HardHat, Users, Truck, ClipboardList, AlertTriangle, CheckCircle, MapPin, Clock, Building2, Layers } from 'lucide-react';
import { useProjects, useSafety, useEquipment, useDailyReports } from '../../hooks/useData';

type AnyRow = Record<string, unknown>;

type SubTab = 'overview' | 'projects' | 'reports' | 'equipment';

const TABS: { key: SubTab; label: string; icon: React.ElementType }[] = [
  { key: 'overview',   label: 'Overview',    icon: Layers },
  { key: 'projects',  label: 'Projects',    icon: Building2 },
  { key: 'reports',   label: 'Site Reports', icon: ClipboardList },
  { key: 'equipment', label: 'Equipment',   icon: Truck },
];

export function SiteOperations() {
  const { data: rawProjects = [] } = useProjects.useList();
  const { data: rawSafety = [] } = useSafety.useList();
  const { data: rawEquipment = [] } = useEquipment.useList();
  const { data: rawReports = [] } = useDailyReports.useList();

  const projects = rawProjects as AnyRow[];
  const safetyIncidents = rawSafety as AnyRow[];
  const equipment = rawEquipment as AnyRow[];
  const reports = rawReports as AnyRow[];

  const [subTab, setSubTab] = useState<SubTab>('overview');

  const activeProjects = projects.filter(p => p.status === 'Active' || p.status === 'active' || p.status === 'In Progress');
  const today = new Date().toISOString().slice(0,10);
  const todayReports = reports.filter(r => String(r.report_date??'') === today);
  const openIncidents = safetyIncidents.filter(i => i.status === 'Open' || i.status === 'Investigation');
  const equipmentInUse = equipment.filter(e => e.status === 'In Use');
  const faultedEquipment = equipment.filter(e => e.status === 'Fault Reported');
  const totalWorkersToday = todayReports.reduce((s,r) => s + Number(r.workers_on_site??0), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Site Operations</h1>
        <p className="text-sm text-gray-500 mt-1">Live site overview — today's activity across all projects</p>
      </div>

      {/* Summary KPIs — always visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Active Projects', value:activeProjects.length, icon:Building2, colour:'text-blue-600', bg:'bg-blue-50' },
          { label:'Workers on Site Today', value:totalWorkersToday || '—', icon:Users, colour:'text-green-600', bg:'bg-green-50' },
          { label:'Open Safety Incidents', value:openIncidents.length, icon:AlertTriangle, colour:openIncidents.length>0?'text-red-600':'text-gray-500', bg:openIncidents.length>0?'bg-red-50':'bg-gray-50' },
          { label:'Equipment In Use', value:equipmentInUse.length, icon:Truck, colour:'text-orange-600', bg:'bg-orange-50' },
        ].map(kpi=>(
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={20} className={kpi.colour}/></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-gray-900">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-nav */}
      <div className="border-b border-gray-200 flex gap-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                subTab === t.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14}/>{t.label}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW */}
      {subTab === 'overview' && (
        <div className="space-y-4">
          {/* Alerts */}
          {(openIncidents.length > 0 || faultedEquipment.length > 0) && (
            <div className="space-y-2">
              {openIncidents.length > 0 && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertTriangle size={16} className="text-red-600 flex-shrink-0"/>
                  <p className="text-sm text-red-700"><span className="font-semibold">{openIncidents.length} open safety incident{openIncidents.length>1?'s':''}</span> — requires immediate attention.</p>
                </div>
              )}
              {faultedEquipment.length > 0 && (
                <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                  <Truck size={16} className="text-orange-600 flex-shrink-0"/>
                  <p className="text-sm text-orange-700"><span className="font-semibold">{faultedEquipment.length} equipment fault{faultedEquipment.length>1?'s':''}</span> — out of service.</p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active projects */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Building2 size={16} className="text-blue-500"/>
                <h2 className="font-semibold text-gray-900 text-sm">Active Projects</h2>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-auto">{activeProjects.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {activeProjects.length === 0 && <p className="p-5 text-sm text-gray-400 text-center">No active projects</p>}
                {activeProjects.slice(0,6).map(p=>{
                  const progress = Number(p.progress??p.completion_percentage??0);
                  return (
                    <div key={String(p.id)} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="font-medium text-gray-900 text-sm truncate">{String(p.name??p.title??'Unnamed')}</p>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full" style={{width:`${Math.min(progress,100)}%`}}/>
                      </div>
                      {!!p.location && <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><MapPin size={9}/>{String(p.location)}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Today's daily reports */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <ClipboardList size={16} className="text-green-500"/>
                <h2 className="font-semibold text-gray-900 text-sm">Today's Site Reports</h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-auto">{todayReports.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {todayReports.length === 0 && <p className="p-5 text-sm text-gray-400 text-center">No reports submitted yet today</p>}
                {todayReports.map(r=>(
                  <div key={String(r.id)} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-700 truncate">{String(r.work_carried_out??'No description')}</p>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0 flex items-center gap-1"><Users size={10}/>{String(r.workers_on_site??0)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{String(r.weather??'')} {r.submitted_by?`· ${r.submitted_by}`:''}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Open safety incidents */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500"/>
                <h2 className="font-semibold text-gray-900 text-sm">Open Safety Incidents</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ml-auto font-medium ${openIncidents.length>0?'bg-red-100 text-red-700':'bg-gray-100 text-gray-600'}`}>{openIncidents.length}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {openIncidents.length === 0 && <p className="p-5 text-sm text-gray-400 text-center">No open incidents — site running safely ✓</p>}
                {openIncidents.slice(0,5).map(i=>{
                  const sev = String(i.severity??'');
                  const sevColour = sev==='Critical'?'bg-red-100 text-red-700':sev==='Serious'?'bg-orange-100 text-orange-700':'bg-yellow-100 text-yellow-700';
                  return (
                    <div key={String(i.id)} className="px-5 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-700 truncate">{String(i.title??i.description??'Incident')}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 flex-shrink-0 ${sevColour}`}>{sev}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{String(i.date??i.incident_date??'')} {i.location?`· ${i.location}`:''}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Equipment status */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Truck size={16} className="text-orange-500"/>
                <h2 className="font-semibold text-gray-900 text-sm">Equipment Status</h2>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full ml-auto">{equipment.length} total</span>
              </div>
              <div className="divide-y divide-gray-50">
                {equipment.length === 0 && <p className="p-5 text-sm text-gray-400 text-center">No equipment registered</p>}
                {equipment.slice(0,6).map(e=>{
                  const st = String(e.status??'');
                  const stColour = st==='In Use'?'bg-blue-100 text-blue-700':st==='Fault Reported'?'bg-red-100 text-red-700':st==='Under Service'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700';
                  return (
                    <div key={String(e.id)} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{String(e.name??'Unknown')}</p>
                        <p className="text-xs text-gray-400">{String(e.category??'')} · {String(e.ownership??'')}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stColour}`}>{st}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROJECTS */}
      {subTab === 'projects' && (
        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 text-center py-16 text-gray-400">
              <Building2 size={40} className="mx-auto mb-3 opacity-30"/><p>No projects found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Project</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Location</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Progress</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Budget</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Start Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">End Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {projects.map(p => {
                      const progress = Number(p.progress??p.completion_percentage??0);
                      const st = String(p.status??'');
                      const stColour = st==='Active'||st==='In Progress'?'bg-green-100 text-green-700':st==='Completed'?'bg-gray-100 text-gray-600':st==='Cancelled'?'bg-red-100 text-red-600':'bg-blue-100 text-blue-700';
                      return (
                        <tr key={String(p.id)} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{String(p.name??p.title??'Unnamed')}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {!!p.location && <span className="flex items-center gap-1"><MapPin size={10}/>{String(p.location)}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stColour}`}>{st}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 min-w-[100px]">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                                <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full" style={{width:`${Math.min(progress,100)}%`}}/>
                              </div>
                              <span className="text-xs text-gray-600">{progress}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {Number(p.budget??0)>0?`£${(Number(p.budget)/1000).toFixed(0)}k`:'—'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{String(p.start_date??'—')}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{String(p.end_date??p.expected_end_date??'—')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REPORTS */}
      {subTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">{todayReports.length} today</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">{reports.length} total</span>
          </div>
          {reports.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 text-center py-16 text-gray-400">
              <ClipboardList size={40} className="mx-auto mb-3 opacity-30"/><p>No site reports found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Submitted By</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Workers</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Weather</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Activities</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Issues / Delays</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...reports].sort((a,b)=>String(b.report_date??'').localeCompare(String(a.report_date??''))).map(r=>{
                      const isToday = String(r.report_date??'') === today;
                      return (
                        <tr key={String(r.id)} className={`hover:bg-gray-50 ${isToday?'bg-green-50/30':''}`}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {isToday && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Today</span>}
                              <span className="text-gray-600 text-xs">{String(r.report_date??'—')}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{String(r.submitted_by??r.author??'—')}</td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-gray-700"><Users size={12}/>{Number(r.workers_on_site??0)}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{String(r.weather??'—')}</td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{String(r.work_carried_out??'—')}</td>
                          <td className="px-4 py-3">
                            {!!r.delays
                              ? <span className="text-xs text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">{String(r.delays)}</span>
                              : <span className="text-xs text-green-600">None</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EQUIPMENT */}
      {subTab === 'equipment' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {[
              { label:'In Use', count:equipmentInUse.length, colour:'bg-blue-100 text-blue-700' },
              { label:'Faults', count:faultedEquipment.length, colour:'bg-red-100 text-red-700' },
              { label:'Available', count:equipment.filter(e=>e.status==='Available').length, colour:'bg-green-100 text-green-700' },
              { label:'Total', count:equipment.length, colour:'bg-gray-100 text-gray-600' },
            ].map(b=>(
              <span key={b.label} className={`text-xs px-3 py-1 rounded-full font-medium ${b.colour}`}>{b.label}: {b.count}</span>
            ))}
          </div>
          {equipment.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 text-center py-16 text-gray-400">
              <Truck size={40} className="mx-auto mb-3 opacity-30"/><p>No equipment registered</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Ownership</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Location</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Next Service</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {equipment.map(e => {
                      const st = String(e.status??'');
                      const stColour = st==='In Use'?'bg-blue-100 text-blue-700':st==='Fault Reported'?'bg-red-100 text-red-700':st==='Under Service'?'bg-yellow-100 text-yellow-700':st==='Hired Out'?'bg-purple-100 text-purple-700':'bg-green-100 text-green-700';
                      return (
                        <tr key={String(e.id)} className={`hover:bg-gray-50 ${st==='Fault Reported'?'bg-red-50/30':''}`}>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              {st==='Fault Reported' && <AlertTriangle size={13} className="text-red-500 flex-shrink-0"/>}
                              {String(e.name??'Unknown')}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{String(e.category??'—')}</td>
                          <td className="px-4 py-3 text-gray-600">{String(e.ownership??'—')}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stColour}`}>{st}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {!!e.location && <span className="flex items-center gap-1"><MapPin size={10}/>{String(e.location)}</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{String(e.next_service??e.service_due??'—')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
