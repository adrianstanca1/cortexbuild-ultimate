/**
 * ClientPortal — read-only Client/Owner Portal for UK construction projects.
 * Reads optional `?token=` for UX / future portal-token auth; API calls use the logged-in session (see server/routes/client-portal.js).
 * Uses portalApi from services/api.ts.
 */
import { useState, useEffect } from 'react';
import {
  Building2, FileText, AlertTriangle, Clock,
  TrendingUp, ChevronDown, ChevronUp
} from 'lucide-react';
import { portalApi } from '../../services/api';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { toast } from 'sonner';

type PortalProject = {
  id: string;
  name: string;
  client: string;
  status: string;
  progress: number;
  budget: number;
  spent: number;
  manager: string;
  location: string;
  type: string;
  startDate: string;
  endDate: string;
  description: string;
};

type PortalRfi = {
  number: string;
  subject: string;
  priority: string;
  status: string;
  submittedDate: string;
  dueDate: string;
  assignedTo: string;
};

type PortalValuation = {
  appNo: string;
  period: string;
  startDate: string;
  endDate: string;
  grossValue: number;
  retentionPct: number;
  netValue: number;
  status: string;
  certifiedDate: string;
  submittedDate: string;
};

type PortalDailyReport = {
  reportDate: string;
  weather: string;
  workersOnSite: number;
  progress: string;
  delays: string;
  safetyObservations: string;
};

export function ClientPortal() {
  const [projects, setProjects] = useState<PortalProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<PortalProject | null>(null);
  const [rfis, setRfis] = useState<PortalRfi[]>([]);
  const [valuations, setValuations] = useState<PortalValuation[]>([]);
  const [dailyReports, setDailyReports] = useState<PortalDailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [rfisExpanded, setRfisExpanded] = useState(false);
  const [reportsExpanded, setReportsExpanded] = useState(false);
  const [valuationsExpanded, setValuationsExpanded] = useState(false);

  const portalToken = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await portalApi.getProjects();
        const data = Array.isArray(res.data) ? res.data : [];
        setProjects(data);
        if (data.length > 0 && !selectedProject) {
          setSelectedProject(data[0]);
        }
      } catch {
        toast.error('Failed to load portal projects');
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadProjectData() {
      if (!selectedProject) return;
      try {
        const [rfiRes, valRes, drRes] = await Promise.allSettled([
          portalApi.getProjectRfis(selectedProject.id, { limit: 10 }),
          portalApi.getProjectValuations(selectedProject.id),
          portalApi.getProjectDailyReports(selectedProject.id, 14),
        ]);
        if (rfiRes.status === 'fulfilled') setRfis(Array.isArray(rfiRes.value.data) ? rfiRes.value.data : []);
        if (valRes.status === 'fulfilled') setValuations(Array.isArray(valRes.value.data) ? valRes.value.data : []);
        if (drRes.status === 'fulfilled') setDailyReports(Array.isArray(drRes.value.data) ? drRes.value.data : []);
      } catch {
        toast.error('Failed to load project data');
      }
    }
    loadProjectData();
  }, [selectedProject]);

  const fmt = (n: number) => `£${Number(n ?? 0).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const priorityColour = (p: string) => {
    switch (p) {
      case 'Urgent': return 'bg-red-500/20 text-red-300';
      case 'High': return 'bg-orange-500/20 text-orange-300';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-300';
      default: return 'bg-gray-700/30 text-gray-300';
    }
  };

  const statusColour = (s: string) => {
    switch (s) {
      case 'Open': return 'bg-blue-500/20 text-blue-300';
      case 'In Review': return 'bg-yellow-500/20 text-yellow-300';
      case 'Answered': return 'bg-green-500/20 text-green-300';
      case 'Closed': return 'bg-gray-700/30 text-gray-300';
      default: return 'bg-gray-700/30 text-gray-300';
    }
  };

  const valStatusColour = (s: string) => {
    switch (s) {
      case 'Certified': return 'bg-green-500/20 text-green-300';
      case 'Paid': return 'bg-emerald-500/20 text-emerald-300';
      case 'Submitted': return 'bg-blue-500/20 text-blue-300';
      default: return 'bg-gray-700/30 text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <ModuleBreadcrumbs currentModule="client-portal" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Building2 size={20} className="text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-display text-white">Client Portal</h1>
              <p className="text-sm text-gray-400">Project progress & documents for clients and owners</p>
            </div>
          </div>
          {!portalToken && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertTriangle size={14} className="text-yellow-400" />
              <span className="text-xs text-yellow-300">Portal token missing — add ?token=xxx to URL</span>
            </div>
          )}
        </div>

        {/* Project Selector */}
        {projects.length > 1 && (
          <div className="flex gap-3 flex-wrap">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedProject?.id === p.id
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {!selectedProject ? (
          <div className="text-center py-16 text-gray-500">
            <Building2 size={48} className="mx-auto mb-3 opacity-30" />
            <p>No projects available for this portal.</p>
          </div>
        ) : (
          <>
            {/* Project Overview */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">{selectedProject.name}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Client</p>
                  <p className="text-sm font-medium text-white">{selectedProject.client}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <p className="text-sm font-medium text-white">{selectedProject.status}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Project Manager</p>
                  <p className="text-sm font-medium text-white">{selectedProject.manager}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  <p className="text-sm font-medium text-white">{selectedProject.location}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Overall Progress</span>
                  <span>{selectedProject.progress ?? 0}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-orange-500 h-3 rounded-full transition-all"
                    style={{ width: `${selectedProject.progress ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500">Contract Sum</p>
                  <p className="text-lg font-display text-white">{fmt(selectedProject.budget)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Certified to Date</p>
                  <p className="text-lg font-display text-green-400">{fmt(selectedProject.spent)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Remaining</p>
                  <p className="text-lg font-display text-orange-400">{fmt((selectedProject.budget ?? 0) - (selectedProject.spent ?? 0))}</p>
                </div>
              </div>
            </div>

            {/* Valuations Summary */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <button
                onClick={() => setValuationsExpanded(p => !p)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp size={18} className="text-green-400" />
                  <h3 className="font-semibold text-white">Valuations & Certificates</h3>
                  <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{valuations.length}</span>
                </div>
                {valuationsExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>
              {valuationsExpanded && (
                <div className="border-t border-gray-800">
                  {valuations.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 text-center">No valuations available.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800/50 border-b border-gray-800">
                        <tr>
                          {['App No.', 'Period', 'Gross Value', 'Retention', 'Net Value', 'Status', 'Certified'].map(h => (
                            <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {valuations.map((v, i) => (
                          <tr key={i} className="hover:bg-gray-800/30">
                            <td className="px-4 py-3 font-mono text-orange-400">{v.appNo}</td>
                            <td className="px-4 py-3 text-gray-300">{v.period}</td>
                            <td className="px-4 py-3 text-white">{fmt(v.grossValue)}</td>
                            <td className="px-4 py-3 text-gray-400">{v.retentionPct}%</td>
                            <td className="px-4 py-3 text-white font-medium">{fmt(v.netValue)}</td>
                            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${valStatusColour(v.status)}`}>{v.status}</span></td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{v.certifiedDate || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* RFIs Summary */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <button
                onClick={() => setRfisExpanded(p => !p)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-blue-400" />
                  <h3 className="font-semibold text-white">RFI Status</h3>
                  <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{rfis.length}</span>
                  {rfis.filter(r => r.status === 'Open').length > 0 && (
                    <span className="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full">
                      {rfis.filter(r => r.status === 'Open').length} open
                    </span>
                  )}
                </div>
                {rfisExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>
              {rfisExpanded && (
                <div className="border-t border-gray-800">
                  {rfis.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 text-center">No RFIs available.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800/50 border-b border-gray-800">
                        <tr>
                          {['Number', 'Subject', 'Priority', 'Status', 'Submitted', 'Due', 'Assigned'].map(h => (
                            <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {rfis.map((r, i) => (
                          <tr key={i} className="hover:bg-gray-800/30">
                            <td className="px-4 py-3 font-mono text-blue-400">{r.number}</td>
                            <td className="px-4 py-3 text-gray-200">{r.subject}</td>
                            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${priorityColour(r.priority)}`}>{r.priority}</span></td>
                            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColour(r.status)}`}>{r.status}</span></td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{r.submittedDate || '—'}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{r.dueDate || '—'}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{r.assignedTo || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Daily Reports Summary */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <button
                onClick={() => setReportsExpanded(p => !p)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-purple-400" />
                  <h3 className="font-semibold text-white">Site Progress (Last 14 Days)</h3>
                  <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{dailyReports.length}</span>
                </div>
                {reportsExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>
              {reportsExpanded && (
                <div className="border-t border-gray-800">
                  {dailyReports.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 text-center">No daily reports available.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800/50 border-b border-gray-800">
                        <tr>
                          {['Date', 'Weather', 'Workers', 'Progress', 'Delays/Issues', 'Safety'].map(h => (
                            <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {dailyReports.map((dr, i) => (
                          <tr key={i} className="hover:bg-gray-800/30">
                            <td className="px-4 py-3 font-mono text-gray-300 text-xs">{dr.reportDate}</td>
                            <td className="px-4 py-3 text-gray-300 text-xs">{dr.weather}</td>
                            <td className="px-4 py-3 text-white">{dr.workersOnSite ?? 0}</td>
                            <td className="px-4 py-3 text-gray-300 text-xs max-w-xs truncate">{dr.progress || '—'}</td>
                            <td className="px-4 py-3 text-xs">
                              {dr.delays ? <span className="text-red-400">{dr.delays.slice(0, 50)}…</span> : <span className="text-gray-500">None</span>}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{dr.safetyObservations || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Programme */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="font-semibold text-white mb-3">Programme</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Start Date</p>
                  <p className="text-white">{selectedProject.startDate || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">End Date</p>
                  <p className="text-white">{selectedProject.endDate || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Project Type</p>
                  <p className="text-white">{selectedProject.type || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-white">{selectedProject.location || '—'}</p>
                </div>
              </div>
              {selectedProject.description && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-300">{selectedProject.description}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default ClientPortal;
