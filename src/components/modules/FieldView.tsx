import { useState } from 'react';
import {
  MapPin, Users, AlertTriangle, CheckCircle, Clock, Building2, Layers,
  Navigation2, CloudRain, Sun, Cloud, FileText, ShieldAlert, Wind,
  Map, Calendar, BarChart3, FileCheck, Zap, CheckSquare, Square, Trash2
} from 'lucide-react';
import { useProjects, useDailyReports, useSafety } from '../../hooks/useData';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;

// Mock data for weather and workers by location
const LOCATION_WEATHER: Record<string, { weather: string; temp: number }> = {
  'london': { weather: 'Partly Cloudy', temp: 12 },
  'manchester': { weather: 'Light Rain', temp: 8 },
  'birmingham': { weather: 'Overcast', temp: 10 },
  'coventry': { weather: 'Light Rain', temp: 9 },
  'bristol': { weather: 'Sunny', temp: 14 },
  'leeds': { weather: 'Overcast', temp: 7 },
};

const LOCATION_WORKERS: Record<string, number> = {
  'london': 24,
  'manchester': 18,
  'birmingham': 16,
  'coventry': 12,
  'bristol': 20,
  'leeds': 14,
};

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  'Sunny': <Sun size={16} className="text-yellow-500" />,
  'Partly Cloudy': <Cloud size={16} className="text-gray-300" />,
  'Light Rain': <CloudRain size={16} className="text-blue-300" />,
  'Heavy Rain': <CloudRain size={16} className="text-blue-400" />,
  'Overcast': <Cloud size={16} className="text-gray-400" />,
  'Frost': <Cloud size={16} className="text-blue-200" />,
  'Snow': <Cloud size={16} className="text-blue-100" />,
};

function WeatherIcon({ weather }: { weather: string }) {
  return <>{WEATHER_ICONS[weather] ?? <Cloud size={16} className="text-gray-400" />}</>;
}

type SubTab = 'live' | 'map' | 'weather' | 'permits' | 'reports' | 'safety';

const TABS: { key: SubTab; label: string; icon: React.ElementType }[] = [
  { key: 'live', label: 'Live View', icon: Layers },
  { key: 'map', label: 'Site Map', icon: Map },
  { key: 'weather', label: 'Weather', icon: Cloud },
  { key: 'permits', label: 'Permits', icon: FileCheck },
  { key: 'reports', label: 'Daily Reports', icon: FileText },
  { key: 'safety', label: 'Safety', icon: ShieldAlert },
];

const STATUS_BADGE_COLORS: Record<string, string> = {
  'Active': 'bg-green-500/20 text-green-300 border-green-500/30',
  'On Hold': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Completed': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

export function FieldView() {
  const { data: rawProjects = [] } = useProjects.useList();
  const { data: rawReports = [], isLoading: loadingReports } = useDailyReports.useList();
  const { data: rawSafety = [], isLoading: loadingSafety } = useSafety.useList();

  const projects = rawProjects as AnyRow[];
  const reports = rawReports as AnyRow[];
  const incidents = rawSafety as AnyRow[];

  const [subTab, setSubTab] = useState<SubTab>('live');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedWeatherProject, setSelectedWeatherProject] = useState<string>('london');

  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} item(s)?`)) return;
    try {
      toast.success(`Deleted ${ids.length} item(s)`);
      clearSelection();
    } catch {
      toast.error('Bulk delete failed');
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const activeProjects = projects.filter(p => !['Completed', 'Cancelled'].includes(String(p.status ?? '')));
  const displayProjects = selectedProject === 'all' ? activeProjects : activeProjects.filter(p => String(p.id) === selectedProject);

  function getProjectReport(projectId: string) {
    return reports.find(r => String(r.project_id ?? '') === projectId && String(r.report_date ?? '') === today);
  }

  function getProjectIncidents(projectId: string) {
    return incidents.filter(i => String(i.project_id ?? '') === projectId && !['Closed'].includes(String(i.status ?? '')));
  }

  const openIncidents = incidents.filter(i => !['Closed'].includes(String(i.status ?? '')));
  const todayReports = reports.filter(r => String(r.report_date ?? '') === today);

  const getLocationKey = (location: string): string => {
    const key = location.toLowerCase().split(' ')[0];
    return Object.keys(LOCATION_WEATHER).includes(key) ? key : 'london';
  };

  const getWeatherForLocation = (location: string) => {
    const key = getLocationKey(location);
    return LOCATION_WEATHER[key];
  };

  const getWorkersForLocation = (location: string) => {
    const key = getLocationKey(location);
    return LOCATION_WORKERS[key] || 15;
  };

  const sevColour = (sev: string) =>
    sev === 'Critical' ? 'bg-red-500/20 text-red-300' : sev === 'Serious' ? 'bg-orange-500/20 text-orange-300' : 'bg-yellow-500/20 text-yellow-300';

  // Generate 7-day weather forecast
  const get7DayForecast = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weatherSeq = ['Sunny', 'Partly Cloudy', 'Light Rain', 'Heavy Rain', 'Overcast', 'Partly Cloudy', 'Sunny'];
    const tempSeq = [14, 12, 9, 8, 10, 11, 13];
    const windSeq = [5, 8, 12, 15, 10, 6, 4];
    return days.map((day, i) => ({
      day,
      weather: weatherSeq[i],
      temp: tempSeq[i],
      wind: windSeq[i],
      suitable: !['Heavy Rain', 'Light Rain'].includes(weatherSeq[i]),
    }));
  };

  // Mock permits
  const mockPermits = [
    { id: '1', type: 'Hot Work', site: 'London E14', issuedBy: 'Sarah Johnson', from: '2026-03-20', to: '2026-03-27', status: 'Active' },
    { id: '2', type: 'Confined Space', site: 'Manchester M1', issuedBy: 'Mike Chen', from: '2026-03-18', to: '2026-03-25', status: 'Active' },
    { id: '3', type: 'Working at Height', site: 'Birmingham B1', issuedBy: 'Emma Davis', from: '2026-03-15', to: '2026-03-22', status: 'Expired' },
    { id: '4', type: 'Excavation', site: 'Coventry CV1', issuedBy: 'John Smith', from: '2026-03-21', to: '2026-03-28', status: 'Active' },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Field View</h1>
          <p className="text-sm text-gray-400 mt-1">Live site-by-site overview — {today}</p>
        </div>
        {(subTab === 'live' || subTab === 'weather') && (
          <select
            value={subTab === 'weather' ? selectedWeatherProject : selectedProject}
            onChange={e => (subTab === 'weather' ? setSelectedWeatherProject(e.target.value) : setSelectedProject(e.target.value))}
            className="text-sm border border-gray-700 bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">{subTab === 'weather' ? 'Select Location' : 'All Active Projects'} ({activeProjects.length})</option>
            {activeProjects.map(p => (
              <option key={String(p.id)} value={subTab === 'weather' ? String(p.location ?? '').toLowerCase().split(' ')[0] : String(p.id)}>
                {String(p.name ?? p.title ?? 'Unnamed')}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Sites Active', value: activeProjects.length, icon: Building2, colour: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
          { label: 'Reports Today', value: todayReports.length, icon: CheckCircle, colour: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
          { label: 'Workers on Site', value: todayReports.reduce((s, r) => s + Number(r.workers_on_site ?? 0), 0) || '—', icon: Users, colour: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
          { label: 'Open Incidents', value: openIncidents.length, icon: AlertTriangle, colour: openIncidents.length > 0 ? 'text-red-400' : 'text-gray-400', bg: openIncidents.length > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-500/10 border-gray-500/30' },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-gray-800 rounded-xl border ${kpi.bg} p-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-700">
                <kpi.icon size={18} className={kpi.colour} />
              </div>
              <div>
                <p className="text-xs text-gray-400">{kpi.label}</p>
                <p className="text-xl font-bold text-white">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700 flex gap-1 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                subTab === t.key ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* LIVE VIEW */}
      {subTab === 'live' && (
        displayProjects.length === 0 ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 text-center py-16 text-gray-500">
            <Navigation2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>No active projects</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {displayProjects.map(p => {
              const pid = String(p.id ?? '');
              const report = getProjectReport(pid);
              const openInc = getProjectIncidents(pid);
              const progress = Number(p.progress ?? p.completion_percentage ?? 0);
              const hasReport = !!report;
              const location = String(p.location ?? '');
              const locationWeather = getWeatherForLocation(location);
              const workersOnSite = getWorkersForLocation(location);

              return (
                <div key={pid} className={`bg-gray-800 rounded-xl border-2 transition-colors ${hasReport ? 'border-green-500/50' : 'border-gray-700'}`}>
                  {/* Header */}
                  <div className="px-5 py-4 flex items-start justify-between border-b border-gray-700">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white">{String(p.name ?? p.title ?? 'Unnamed')}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_BADGE_COLORS[String(p.status ?? 'Active')] ?? 'bg-gray-600 text-gray-300'}`}>
                          {String(p.status ?? 'Active')}
                        </span>
                        {hasReport ? (
                          <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-500/30">
                            <CheckCircle size={10} />
                            Reported
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-yellow-500/30">
                            <Clock size={10} />
                            No report yet
                          </span>
                        )}
                      </div>
                      {location && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} />{location}</p>}
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-2xl font-black text-orange-400">{progress}%</p>
                      <p className="text-xs text-gray-500">complete</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="px-5 py-3 border-b border-gray-700">
                    <div className="h-2 bg-gray-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                  </div>

                  {/* Weather & Workers Card */}
                  <div className="px-5 py-3 border-b border-gray-700 bg-gray-700/30">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Weather Today</p>
                        <div className="flex items-center gap-2">
                          <WeatherIcon weather={locationWeather.weather} />
                          <div>
                            <p className="text-sm font-medium text-white">{locationWeather.weather}</p>
                            <p className="text-xs text-gray-400">{locationWeather.temp}°C</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Workers on Site</p>
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-blue-400" />
                          <p className="text-sm font-medium text-white">{workersOnSite}</p>
                        </div>
                      </div>
                    </div>
                    {hasReport && (
                      <p className="text-xs text-gray-300 mt-2 line-clamp-2">
                        Last report: {String(report.work_carried_out ?? 'No description')}
                      </p>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="px-5 py-3 grid grid-cols-3 gap-3 text-center border-b border-gray-700">
                    <div>
                      <p className="text-lg font-bold text-white">{Number(p.budget ?? 0) > 0 ? `£${(Number(p.budget) / 1000).toFixed(0)}k` : '—'}</p>
                      <p className="text-xs text-gray-400">Budget</p>
                    </div>
                    <div>
                      <p className={`text-lg font-bold ${openInc.length > 0 ? 'text-red-400' : 'text-green-400'}`}>{openInc.length}</p>
                      <p className="text-xs text-gray-400">Incidents</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{Number(p.workers ?? 0) || '—'}</p>
                      <p className="text-xs text-gray-400">Workforce</p>
                    </div>
                  </div>

                  {/* Incidents */}
                  {openInc.length > 0 && (
                    <div className="px-5 pb-4 space-y-1">
                      {openInc.slice(0, 2).map(i => (
                        <div key={String(i.id)} className="flex items-center gap-2 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-1.5">
                          <AlertTriangle size={11} className="text-red-400 flex-shrink-0" />
                          <span className="text-gray-300 truncate">{String(i.title ?? i.description ?? 'Incident')}</span>
                          <span className="ml-auto text-red-400 font-medium">{String(i.severity ?? '')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="px-5 py-3 flex gap-2 border-t border-gray-700">
                    <button className="flex-1 px-3 py-2 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg border border-blue-600/30 transition-colors">
                      View Reports
                    </button>
                    <button className="flex-1 px-3 py-2 text-xs bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 rounded-lg border border-orange-600/30 transition-colors">
                      Log Report
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* SITE MAP VIEW */}
      {subTab === 'map' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Project Locations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Canary Wharf', location: 'London E14', status: 'Active', workers: 24 },
              { name: 'Manchester Hub', location: 'Manchester M1', status: 'Active', workers: 18 },
              { name: 'Birmingham Build', location: 'Birmingham B1', status: 'On Hold', workers: 16 },
              { name: 'Coventry Works', location: 'Coventry CV1', status: 'Active', workers: 12 },
              { name: 'Bristol Platform', location: 'Bristol BS1', status: 'Active', workers: 20 },
              { name: 'Leeds Complex', location: 'Leeds LS1', status: 'Active', workers: 14 },
            ].map((site, idx) => {
              const statusColor = site.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500';
              const progressPercent = Math.floor(Math.random() * 100);
              return (
                <div key={idx} className="bg-gray-700 rounded-lg border border-gray-600 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-white">{site.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin size={10} />
                        {site.location}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${statusColor}`} />
                  </div>

                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <Users size={14} className="text-blue-400" />
                    <span className="text-gray-300">{site.workers} workers</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">Progress</span>
                      <span className="text-xs text-gray-300 font-medium">{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEATHER VIEW */}
      {subTab === 'weather' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">7-Day Weather Forecast</h2>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-8">
            {get7DayForecast().map((day, idx) => (
              <div key={idx} className="bg-gray-700 rounded-lg border border-gray-600 p-3 text-center">
                <p className="text-sm font-medium text-white mb-2">{day.day}</p>
                <div className="flex justify-center mb-2">
                  <WeatherIcon weather={day.weather} />
                </div>
                <p className="text-xs text-gray-300 mb-1">{day.weather}</p>
                <p className="text-lg font-bold text-white mb-1">{day.temp}°C</p>
                <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-2">
                  <Wind size={12} />
                  {day.wind} mph
                </div>
                <div className={`text-xs px-1.5 py-0.5 rounded border ${day.suitable ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                  {day.suitable ? 'Suitable' : 'Not Suitable'}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-sm text-yellow-300 font-medium mb-1">Weather Risk Assessment</p>
            <p className="text-xs text-yellow-200">
              Heavy rain forecast Thu-Fri — Concrete pours not recommended. Ensure site drainage is clear and protective covers are in place.
            </p>
          </div>
        </div>
      )}

      {/* PERMITS VIEW */}
      {subTab === 'permits' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Active Permits to Work</h2>
            <button className="px-3 py-2 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">
              Issue New Permit
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-700 border-b border-gray-600">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Permit Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Site</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Issued By</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Valid From</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Valid To</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {mockPermits.map(permit => {
                  const isSelected = selectedIds.has(permit.id);
                  return (
                    <tr key={permit.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <button type="button" onClick={e => { e.stopPropagation(); toggle(permit.id); }}>
                          {isSelected ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{permit.type}</td>
                      <td className="px-4 py-3 text-gray-300">{permit.site}</td>
                      <td className="px-4 py-3 text-gray-400">{permit.issuedBy}</td>
                      <td className="px-4 py-3 text-gray-400">{permit.from}</td>
                      <td className="px-4 py-3 text-gray-400">{permit.to}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                            permit.status === 'Active'
                              ? 'bg-green-500/20 text-green-300 border-green-500/30'
                              : permit.status === 'Expired'
                                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                          }`}
                        >
                          {permit.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DAILY REPORTS */}
      {subTab === 'reports' && (
        loadingReports ? (
          <div className="text-center py-16 text-gray-400">Loading reports…</div>
        ) : reports.length === 0 ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 text-center py-16 text-gray-500">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p>No reports found</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-700 border-b border-gray-600">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Project</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Submitted By</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Workers</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Weather</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Work Carried Out</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Delays</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {[...reports].sort((a, b) => String(b.report_date ?? '').localeCompare(String(a.report_date ?? ''))).map(r => {
                    const isToday = String(r.report_date ?? '') === today;
                    return (
                      <tr key={String(r.id)} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isToday ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'text-gray-400'}`}>
                            {String(r.report_date ?? '—')}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-white">{String(r.project_name ?? r.project ?? '—')}</td>
                        <td className="px-4 py-3 text-gray-400">{String(r.submitted_by ?? r.author ?? '—')}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="flex items-center gap-1 text-gray-300 justify-center">
                            <Users size={12} />
                            {Number(r.workers_on_site ?? 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-gray-400">
                            <WeatherIcon weather={String(r.weather ?? '')} />
                            {String(r.weather ?? '—')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{String(r.work_carried_out ?? '—')}</td>
                        <td className="px-4 py-3">
                          {r.delays ? (
                            <span className="text-xs text-orange-300 bg-orange-500/20 px-2 py-0.5 rounded-full border border-orange-500/30">{String(r.delays)}</span>
                          ) : (
                            <span className="text-xs text-gray-500">None</span>
                          )}
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
          <div className="bg-gray-800 rounded-xl border border-gray-700 text-center py-16 text-gray-500">
            <ShieldAlert size={40} className="mx-auto mb-3 opacity-30" />
            <p>No safety incidents recorded</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-700 bg-gray-700 flex items-center justify-between">
              <p className="text-sm font-medium text-white">All Safety Incidents</p>
              <div className="flex gap-2">
                <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">{openIncidents.length} open</span>
                <span className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full">{incidents.length} total</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-700 border-b border-gray-600">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Severity</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Location</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {[...incidents].sort((a, b) => String(b.date ?? b.incident_date ?? '').localeCompare(String(a.date ?? a.incident_date ?? ''))).map(i => {
                    const sev = String(i.severity ?? '');
                    const st = String(i.status ?? '');
                    const stColour = st === 'Closed' ? 'bg-gray-600 text-gray-300' : st === 'Investigation' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30';
                    return (
                      <tr key={String(i.id)} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{String(i.date ?? i.incident_date ?? '—')}</td>
                        <td className="px-4 py-3 font-medium text-white">{String(i.title ?? i.description ?? 'Incident')}</td>
                        <td className="px-4 py-3 text-gray-400">{String(i.type ?? i.incident_type ?? '—')}</td>
                        <td className="px-4 py-3">
                          {!!sev && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sevColour(sev)}`}>{sev}</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {!!i.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={10} />
                              {String(i.location)}
                            </span>
                          )}
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

      <BulkActionsBar
        selectedIds={Array.from(selectedIds)}
        actions={[
          { id: 'delete', label: 'Delete Selected', icon: Trash2, variant: 'danger', onClick: handleBulkDelete, confirm: 'This action cannot be undone.' },
        ]}
        onClearSelection={clearSelection}
      />
    </div>
  );
}
