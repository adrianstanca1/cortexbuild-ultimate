import { useState } from 'react';
import { MapPin, Users, AlertTriangle, CheckCircle, Clock, Building2, Layers, Navigation2, CloudRain, Sun, Cloud, FileText, ShieldAlert } from 'lucide-react';
import { useProjects, useDailyReports, useSafety } from '../../hooks/useData';

type AnyRow = Record<string, unknown>;

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  'Sunny': <Sun size={14} className="text-yellow-400"/>,
  'Partly Cloudy': <Cloud size={14} className="text-gray-400"/>,
  'Light Rain': <CloudRain size={14} className="text-blue-400"/>,
  'Heavy Rain': <CloudRain size={14} className="text-blue-500"/>,
  'Overcast': <Cloud size={14} className="text-gray-500"/>,
};

function WeatherIcon({ weather }: { weather: string }) {
  return <>{WEATHER_ICONS[weather] ?? <Cloud size={14} className="text-gray-400"/>}</>;
}

type SubTab = 'live' | 'reports' | 'safety';

const TABS: { key: SubTab; label: string; icon: React.ElementType }[] = [
  { key: 'live',    label: 'Live View',     icon: Layers },
  { key: 'reports', label: 'Daily Reports', icon: FileText },
  { key: 'safety',  label: 'Safety',        icon: ShieldAlert },
];

export function FieldView() {
  const { data: rawProjects = [] } = useProjects.useList();
  const { data: rawReports = [], isLoading: loadingReports } = useDailyReports.useList();
  const { data: rawSafety = [], isLoading: loadingSafety } = useSafety.useList();

  const projects = rawProjects as AnyRow[];
  const reports = rawReports as AnyRow[];
  const incidents = rawSafety as AnyRow[];

  const [subTab, setSubTab] = useState<SubTab>('live');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const today = new Date().toISOString().slice(0,10);
  const activeProjects = projects.filter(p => !['Completed','Cancelled'].includes(String(p.status??'')));
  const displayProjects = selectedProject === 'all' ? activeProjects : activeProjects.filter(p => String(p.id) === selectedProject);

  function getProjectReport(projectId: string) {
    return reports.find(r => String(r.project_id??'') === projectId && String(r.report_date??'') === today);
  }

  function getProjectIncidents(projectId: string) {
    return incidents.filter(i => String(i.project_id??'') === projectId && !['Closed'].includes(String(i.status??'')));
  }

  const openIncidents = incidents.filter(i => !['Closed'].includes(String(i.status??'')));
  const todayReports = reports.filter(r => String(r.report_date??'') === today);

  const sevColour = (sev: string) =>
    sev==='Critical'?'bg-red-900/50 text-red-300':sev==='Serious'?'bg-orange-900/50 text-orange-300':'bg-yellow-900/50 text-yellow-300';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Field View</h1>
          <p className="text-sm text-gray-400 mt-1">Live site-by-site overview — {today}</p>
        </div>
        {subTab === 'live' && (
          <select value={selectedProject} onChange={e=>setSelectedProject(e.target.value)}
            className="text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500">
            <option value="all">All Active Projects ({activeProjects.length})</option>
            {activeProjects.map(p=><option key={String(p.id)} value={String(p.id)}>{String(p.name??p.title??'Unnamed')}</option>)}
          </select>
        )}
      </div>

      {/* Summary strips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Sites Active Today', value:activeProjects.length, icon:Building2, colour:'text-blue-400' },
          { label:'Reports Submitted', value:todayReports.length, icon:CheckCircle, colour:'text-green-400' },
          { label:'Total Workers', value:todayReports.reduce((s,r)=>s+Number(r.workers_on_site??0),0)||'—', icon:Users, colour:'text-orange-400' },
          { label:'Open Incidents', value:openIncidents.length, icon:AlertTriangle, colour:openIncidents.length>0?'text-red-400':'text-gray-400' },
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

      {/* Sub-nav */}
      <div className="border-b border-gray-700 flex gap-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                subTab === t.key
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon size={14}/>{t.label}
            </button>
          );
        })}
      </div>

      {/* LIVE VIEW */}
      {subTab === 'live' && (
        displayProjects.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl text-center py-16 text-gray-500">
            <Navigation2 size={40} className="mx-auto mb-3 opacity-30"/><p>No active projects</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {displayProjects.map(p => {
              const pid = String(p.id??'');
              const report = getProjectReport(pid);
              const openInc = getProjectIncidents(pid);
              const progress = Number(p.progress??p.completion_percentage??0);
              const hasReport = !!report;

              return (
                <div key={pid} className={`bg-gray-900 border-2 rounded-xl transition-colors ${hasReport?'border-green-800':'border-gray-800'}`}>
                  <div className="px-5 py-4 flex items-start justify-between border-b border-gray-800">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white">{String(p.name??p.title??'Unnamed')}</h3>
                        {hasReport
                          ? <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10}/>Reported</span>
                          : <span className="text-xs bg-yellow-900/40 text-yellow-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={10}/>No report yet</span>}
                      </div>
                      {!!p.location && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={10}/>{String(p.location)}</p>}
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-2xl font-black text-orange-500">{progress}%</p>
                      <p className="text-xs text-gray-500">complete</p>
                    </div>
                  </div>

                  <div className="px-5 py-3 border-b border-gray-800">
                    <div className="h-2 bg-gray-800 rounded-full">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all" style={{width:`${Math.min(progress,100)}%`}}/>
                    </div>
                  </div>

                  {report && (
                    <div className="px-5 py-3 border-b border-gray-800 bg-green-900/10">
                      <div className="flex items-center gap-2 mb-1.5">
                        <WeatherIcon weather={String(report.weather??'')}/>
                        <span className="text-xs text-gray-400">{String(report.weather??'')} · <span className="font-medium text-gray-300">{Number(report.workers_on_site??0)} workers</span></span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{String(report.work_carried_out??'No work description')}</p>
                      {!!report.delays && <p className="text-xs text-orange-400 mt-1 flex items-center gap-1"><AlertTriangle size={10}/>Delays: {String(report.delays)}</p>}
                    </div>
                  )}

                  <div className="px-5 py-3 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold text-white">{Number(p.budget??0)>0?`£${(Number(p.budget)/1000).toFixed(0)}k`:'—'}</p>
                      <p className="text-xs text-gray-500">Budget</p>
                    </div>
                    <div>
                      <p className={`text-lg font-bold ${openInc.length>0?'text-red-400':'text-green-400'}`}>{openInc.length}</p>
                      <p className="text-xs text-gray-500">Open Incidents</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{Number(p.workers??0)||'—'}</p>
                      <p className="text-xs text-gray-500">Workforce</p>
                    </div>
                  </div>

                  {openInc.length > 0 && (
                    <div className="px-5 pb-4 space-y-1">
                      {openInc.slice(0,2).map(i=>(
                        <div key={String(i.id)} className="flex items-center gap-2 text-xs bg-red-900/30 border border-red-800 rounded-lg px-3 py-1.5">
                          <AlertTriangle size={11} className="text-red-400 flex-shrink-0"/>
                          <span className="text-gray-300 truncate">{String(i.title??i.description??'Incident')}</span>
                          <span className="ml-auto text-red-400 font-medium">{String(i.severity??'')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* DAILY REPORTS */}
      {subTab === 'reports' && (
        loadingReports ? (
          <div className="text-center py-16 text-gray-400">Loading reports…</div>
        ) : reports.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl text-center py-16 text-gray-500">
            <FileText size={40} className="mx-auto mb-3 opacity-30"/><p>No reports found</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/60 border-b border-gray-700">
                  <tr>
                    {['Date','Project','Submitted By','Workers','Weather','Work Carried Out','Delays'].map(h=>(
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {[...reports].sort((a,b)=>String(b.report_date??'').localeCompare(String(a.report_date??''))).map(r => {
                    const isToday = String(r.report_date??'') === today;
                    return (
                      <tr key={String(r.id)} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isToday?'bg-green-900/40 text-green-400':'text-gray-400'}`}>
                            {String(r.report_date??'—')}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-white">{String(r.project_name??r.project??'—')}</td>
                        <td className="px-4 py-3 text-gray-400">{String(r.submitted_by??r.author??'—')}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="flex items-center gap-1 text-gray-300"><Users size={12}/>{Number(r.workers_on_site??0)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-gray-400">
                            <WeatherIcon weather={String(r.weather??'')}/>
                            {String(r.weather??'—')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{String(r.work_carried_out??'—')}</td>
                        <td className="px-4 py-3">
                          {!!r.delays
                            ? <span className="text-xs text-orange-300 bg-orange-900/30 px-2 py-0.5 rounded-full">{String(r.delays)}</span>
                            : <span className="text-xs text-gray-500">None</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* SAFETY */}
      {subTab === 'safety' && (
        loadingSafety ? (
          <div className="text-center py-16 text-gray-400">Loading incidents…</div>
        ) : incidents.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl text-center py-16 text-gray-500">
            <ShieldAlert size={40} className="mx-auto mb-3 opacity-30"/><p>No safety incidents recorded</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-800 bg-gray-800/60 flex items-center justify-between">
              <p className="text-sm font-medium text-white">All Safety Incidents</p>
              <div className="flex gap-2">
                <span className="text-xs bg-red-900/40 text-red-400 px-2 py-0.5 rounded-full">{openIncidents.length} open</span>
                <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{incidents.length} total</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/60 border-b border-gray-700">
                  <tr>
                    {['Date','Title','Type','Severity','Location','Status'].map(h=>(
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {[...incidents].sort((a,b)=>String(b.date??b.incident_date??'').localeCompare(String(a.date??a.incident_date??''))).map(i => {
                    const sev = String(i.severity??'');
                    const st = String(i.status??'');
                    const stColour = st==='Closed'?'bg-gray-700 text-gray-400':st==='Investigation'?'bg-purple-900/50 text-purple-300':'bg-red-900/50 text-red-300';
                    return (
                      <tr key={String(i.id)} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{String(i.date??i.incident_date??'—')}</td>
                        <td className="px-4 py-3 font-medium text-white">{String(i.title??i.description??'Incident')}</td>
                        <td className="px-4 py-3 text-gray-400">{String(i.type??i.incident_type??'—')}</td>
                        <td className="px-4 py-3">
                          {!!sev && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sevColour(sev)}`}>{sev}</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {!!i.location && <span className="flex items-center gap-1"><MapPin size={10}/>{String(i.location)}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stColour}`}>{st}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
