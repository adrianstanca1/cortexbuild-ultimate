import { useState } from 'react';
import { MapPin, Users, AlertTriangle, CheckCircle, Clock, Building2, Layers, Navigation2, CloudRain, Sun, Cloud } from 'lucide-react';
import { useProjects, useDailyReports, useSafety } from '../../hooks/useData';

type AnyRow = Record<string, unknown>;

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  'Sunny': <Sun size={14} className="text-yellow-500"/>,
  'Partly Cloudy': <Cloud size={14} className="text-gray-400"/>,
  'Light Rain': <CloudRain size={14} className="text-blue-400"/>,
  'Heavy Rain': <CloudRain size={14} className="text-blue-600"/>,
  'Overcast': <Cloud size={14} className="text-gray-500"/>,
};

function WeatherIcon({ weather }: { weather: string }) {
  return <>{WEATHER_ICONS[weather] ?? <Cloud size={14} className="text-gray-400"/>}</>;
}

export function FieldView() {
  const { data: rawProjects = [] } = useProjects.useList();
  const { data: rawReports = [] } = useDailyReports.useList();
  const { data: rawSafety = [] } = useSafety.useList();

  const projects = rawProjects as AnyRow[];
  const reports = rawReports as AnyRow[];
  const incidents = rawSafety as AnyRow[];

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Field View</h1>
          <p className="text-sm text-gray-500 mt-1">Live site-by-site overview for today — {today}</p>
        </div>
        <select value={selectedProject} onChange={e=>setSelectedProject(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="all">All Active Projects ({activeProjects.length})</option>
          {activeProjects.map(p=><option key={String(p.id)} value={String(p.id)}>{String(p.name??p.title??'Unnamed')}</option>)}
        </select>
      </div>

      {/* Summary strips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Sites Active Today', value:activeProjects.length, icon:Building2, colour:'text-blue-600', bg:'bg-blue-50' },
          { label:'Reports Submitted', value:reports.filter(r=>String(r.report_date??'')===today).length, icon:CheckCircle, colour:'text-green-600', bg:'bg-green-50' },
          { label:'Total Workers', value:reports.filter(r=>String(r.report_date??'')===today).reduce((s,r)=>s+Number(r.workers_on_site??0),0)||'—', icon:Users, colour:'text-orange-600', bg:'bg-orange-50' },
          { label:'Open Incidents', value:incidents.filter(i=>!['Closed'].includes(String(i.status??''))).length, icon:AlertTriangle, colour:incidents.filter(i=>!['Closed'].includes(String(i.status??''))).length>0?'text-red-600':'text-gray-500', bg:incidents.filter(i=>!['Closed'].includes(String(i.status??''))).length>0?'bg-red-50':'bg-gray-50' },
        ].map(kpi=>(
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={18} className={kpi.colour}/></div>
              <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-gray-900">{kpi.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Project cards */}
      {displayProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-16 text-gray-400">
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
              <div key={pid} className={`bg-white rounded-xl border-2 transition-colors ${hasReport?'border-green-200':'border-gray-200'}`}>
                {/* Header */}
                <div className="px-5 py-4 flex items-start justify-between border-b border-gray-100">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{String(p.name??p.title??'Unnamed')}</h3>
                      {hasReport
                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10}/>Reported</span>
                        : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={10}/>No report yet</span>}
                    </div>
                    {!!p.location && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={10}/>{String(p.location)}</p>}
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-2xl font-black text-orange-600">{progress}%</p>
                    <p className="text-xs text-gray-400">complete</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="px-5 py-3 border-b border-gray-100">
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all" style={{width:`${Math.min(progress,100)}%`}}/>
                  </div>
                </div>

                {/* Today's report snippet */}
                {report && (
                  <div className="px-5 py-3 border-b border-gray-100 bg-green-50/50">
                    <div className="flex items-center gap-2 mb-1.5">
                      <WeatherIcon weather={String(report.weather??'')}/>
                      <span className="text-xs text-gray-500">{String(report.weather??'')} · <span className="font-medium">{Number(report.workers_on_site??0)} workers</span></span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{String(report.work_carried_out??'No work description')}</p>
                    {!!report.delays && <p className="text-xs text-orange-600 mt-1 flex items-center gap-1"><AlertTriangle size={10}/>Delays: {String(report.delays)}</p>}
                  </div>
                )}

                {/* Safety & KPIs */}
                <div className="px-5 py-3 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{Number(p.budget??0)>0?`£${(Number(p.budget)/1000).toFixed(0)}k`:'—'}</p>
                    <p className="text-xs text-gray-400">Budget</p>
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${openInc.length>0?'text-red-600':'text-green-600'}`}>{openInc.length}</p>
                    <p className="text-xs text-gray-400">Open Incidents</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{Number(p.workers??0)||'—'}</p>
                    <p className="text-xs text-gray-400">Workforce</p>
                  </div>
                </div>

                {/* Open incidents list */}
                {openInc.length > 0 && (
                  <div className="px-5 pb-4 space-y-1">
                    {openInc.slice(0,2).map(i=>(
                      <div key={String(i.id)} className="flex items-center gap-2 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
                        <AlertTriangle size={11} className="text-red-500 flex-shrink-0"/>
                        <span className="text-gray-700 truncate">{String(i.title??i.description??'Incident')}</span>
                        <span className="ml-auto text-red-600 font-medium">{String(i.severity??'')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
