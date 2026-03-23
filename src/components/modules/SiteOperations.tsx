import { useState } from 'react';
import { Users, Truck, ClipboardList, AlertTriangle, CheckCircle, MapPin, Building2, Layers, Cloud, Wind, Droplets, Plus, X, Edit2, Trash2, Zap } from 'lucide-react';
import { useDailyReports } from '../../hooks/useData';
import { toast } from 'sonner';

type AnyRow = Record<string, unknown>;
type SubTab = 'overview' | 'workforce' | 'resources' | 'logistics' | 'progress';

const TABS: { key: SubTab; label: string; icon: React.ElementType }[] = [
  { key: 'overview',   label: 'Overview',     icon: Layers },
  { key: 'workforce',  label: 'Workforce',    icon: Users },
  { key: 'resources',  label: 'Resources',    icon: Truck },
  { key: 'logistics',  label: 'Logistics',    icon: MapPin },
  { key: 'progress',   label: 'Progress',     icon: CheckCircle },
];

export function SiteOperations() {
  const { useList, useCreate, useUpdate, useDelete } = useDailyReports;
  const { data: raw = [], isLoading } = useList();
  const operations = raw as AnyRow[];
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();

  const [subTab, setSubTab] = useState<SubTab>('overview');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [form, setForm] = useState({
    type: 'labour_allocation',
    description: '',
    date: new Date().toISOString().split('T')[0],
    area: '',
    responsible: '',
    workforce_count: 0,
    notes: '',
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayOps = operations.filter(op => String(op.date ?? '') === today);
  const activeOps = operations.filter(op => op.status === 'Active');
  const workersToday = todayOps.reduce((sum, op) => sum + Number(op.workforce_count ?? 0), 0);
  const deliveriesToday = operations.filter(op => String(op.type ?? '') === 'delivery' && String(op.date ?? '') === today).length;
  const alertsCount = operations.filter(op => String(op.status ?? '') === 'Alert' || String(op.status ?? '') === 'Issue').length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await updateMutation.mutateAsync({ id: String(editing.id), data: form });
      toast.success('Operation updated');
    } else {
      await createMutation.mutateAsync(form);
      toast.success('Operation created');
    }
    setShowModal(false);
    setForm({ type: 'labour_allocation', description: '', date: today, area: '', responsible: '', workforce_count: 0, notes: '' });
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this operation?')) return;
    await deleteMutation.mutateAsync(id);
    toast.success('Operation deleted');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Site Operations</h1>
          <p className="text-sm text-gray-400 mt-1">Live site overview — today's activity across all projects</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ type: 'labour_allocation', description: '', date: today, area: '', responsible: '', workforce_count: 0, notes: '' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
        >
          <Plus size={16} />
          <span>Log Operation</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Workforce Today', value: workersToday || '—', icon: Users, colour: 'text-green-400', bg: 'bg-green-500/20' },
          { label: 'Active Operations', value: activeOps.length, icon: Zap, colour: 'text-blue-400', bg: 'bg-blue-500/20' },
          { label: 'Deliveries Today', value: deliveriesToday, icon: Truck, colour: 'text-orange-400', bg: 'bg-orange-500/20' },
          { label: 'Alerts', value: alertsCount, icon: AlertTriangle, colour: alertsCount > 0 ? 'text-red-400' : 'text-gray-400', bg: alertsCount > 0 ? 'bg-red-500/20' : 'bg-gray-500/20' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400">{kpi.label}</p>
              <kpi.icon size={18} className={kpi.colour} />
            </div>
            <p className={`text-2xl font-bold ${kpi.colour}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="border-b border-gray-700 flex gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                subTab === t.key
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
        </div>
      ) : (
        <>
          {subTab === 'overview' && (
            <div className="space-y-4">
              {alertsCount > 0 && (
                <div className="flex items-center gap-3 bg-red-900/30 border border-red-700 rounded-xl px-4 py-3">
                  <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">
                    <span className="font-semibold">{alertsCount} active alert{alertsCount > 1 ? 's' : ''}</span> — requires attention.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
                    <Cloud size={16} className="text-blue-400" />
                    <h2 className="font-semibold text-white text-sm">Weather</h2>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Temperature</span>
                      <span className="text-white font-semibold">15°C</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm flex items-center gap-1">
                        <Wind size={14} />
                        Wind
                      </span>
                      <span className="text-white font-semibold">12 mph</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm flex items-center gap-1">
                        <Droplets size={14} />
                        Rain Risk
                      </span>
                      <span className="text-white font-semibold">20%</span>
                    </div>
                    <div className="pt-2 border-t border-gray-700">
                      <p className="text-xs text-gray-500">Status: <span className="text-green-400 font-medium">Good</span></p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
                    <Users size={16} className="text-green-400" />
                    <h2 className="font-semibold text-white text-sm">Labour Today</h2>
                    <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full ml-auto">{workersToday}</span>
                  </div>
                  <div className="divide-y divide-gray-800">
                    {todayOps.filter(op => String(op.type ?? '') === 'labour').length === 0 ? (
                      <p className="p-5 text-sm text-gray-500 text-center">No labour logged</p>
                    ) : (
                      todayOps
                        .filter(op => String(op.type ?? '') === 'labour')
                        .map((op) => (
                          <div key={String(op.id)} className="px-5 py-3">
                            <p className="text-sm font-medium text-white">{String(op.description ?? 'Labour')}</p>
                            <p className="text-xs text-gray-500 mt-1">{Number(op.workforce_count ?? 0)} workers • {String(op.area ?? '—')}</p>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
                    <Truck size={16} className="text-orange-400" />
                    <h2 className="font-semibold text-white text-sm">Deliveries</h2>
                    <span className="text-xs bg-orange-900/40 text-orange-400 px-2 py-0.5 rounded-full ml-auto">{deliveriesToday}</span>
                  </div>
                  <div className="divide-y divide-gray-800">
                    {todayOps.filter(op => String(op.type ?? '') === 'delivery').length === 0 ? (
                      <p className="p-5 text-sm text-gray-500 text-center">No deliveries today</p>
                    ) : (
                      todayOps
                        .filter(op => String(op.type ?? '') === 'delivery')
                        .map((op) => (
                          <div key={String(op.id)} className="px-5 py-3">
                            <p className="text-sm font-medium text-white">{String(op.description ?? 'Delivery')}</p>
                            <p className="text-xs text-gray-500 mt-1">Supplier: {String(op.responsible ?? '—')}</p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-800">
                  <h2 className="font-semibold text-white text-sm">Recent Activity</h2>
                </div>
                <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
                  {todayOps.length === 0 ? (
                    <p className="p-5 text-sm text-gray-500 text-center">No activity today</p>
                  ) : (
                    todayOps.slice(0, 10).map((op) => (
                      <div key={String(op.id)} className="px-5 py-3 hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-300">{String(op.description ?? 'Operation')}</p>
                          <span className="text-xs text-gray-500">{String(op.type ?? '—')}</span>
                        </div>
                        {!!op.notes && <p className="text-xs text-gray-500 mt-1">{String(op.notes)}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {subTab === 'workforce' && (
            <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/60 border-b border-gray-700">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Trade</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Hours Planned</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Task</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {todayOps.filter(op => String(op.type ?? '') === 'labour').length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No workforce data
                        </td>
                      </tr>
                    ) : (
                      todayOps
                        .filter(op => String(op.type ?? '') === 'labour')
                        .map((op) => (
                          <tr key={String(op.id)} className="hover:bg-gray-800/40">
                            <td className="px-4 py-3 font-medium text-white">{String(op.description ?? '—')}</td>
                            <td className="px-4 py-3 text-gray-400">{String(op.area ?? '—')}</td>
                            <td className="px-4 py-3 text-gray-400">{Number(op.workforce_count ?? 0)}h</td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded-full">Present</span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{String(op.notes ?? '—')}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {subTab === 'resources' && (
            <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/60 border-b border-gray-700">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Resource</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Location</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Responsible</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {operations.filter(op => String(op.type ?? '') === 'resource').length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No resources recorded
                        </td>
                      </tr>
                    ) : (
                      operations
                        .filter(op => String(op.type ?? '') === 'resource')
                        .slice(0, 20)
                        .map((op) => (
                          <tr key={String(op.id)} className="hover:bg-gray-800/40">
                            <td className="px-4 py-3 font-medium text-white">{String(op.description ?? '—')}</td>
                            <td className="px-4 py-3 text-gray-400">{String(op.area ?? '—')}</td>
                            <td className="px-4 py-3 text-gray-400">{String(op.notes ?? '—')}</td>
                            <td className="px-4 py-3 text-gray-400">{String(op.responsible ?? '—')}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">Active</span>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {subTab === 'logistics' && (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-800">
                  <h2 className="font-semibold text-white text-sm">Delivery Schedule</h2>
                </div>
                <div className="divide-y divide-gray-800">
                  {operations.filter(op => String(op.type ?? '') === 'delivery').length === 0 ? (
                    <p className="px-5 py-8 text-center text-gray-500 text-sm">No deliveries scheduled</p>
                  ) : (
                    operations
                      .filter(op => String(op.type ?? '') === 'delivery')
                      .slice(0, 10)
                      .map((op) => (
                        <div key={String(op.id)} className="px-5 py-4 hover:bg-gray-800/40 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-white">{String(op.description ?? 'Delivery')}</p>
                            <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full">Expected</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                            <div>Supplier: {String(op.responsible ?? '—')}</div>
                            <div>Gate: {String(op.area ?? '—')}</div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {subTab === 'progress' && (
            <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/60 border-b border-gray-700">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Work Section</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Planned</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Actual</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Variance</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {[
                      { name: 'Foundations', planned: 80, actual: 85, variance: 5 },
                      { name: 'Superstructure', planned: 45, actual: 40, variance: -5 },
                      { name: 'Envelope', planned: 20, actual: 15, variance: -5 },
                      { name: 'MEP Install', planned: 10, actual: 8, variance: -2 },
                    ].map((section) => (
                      <tr key={section.name} className="hover:bg-gray-800/40">
                        <td className="px-4 py-3 font-medium text-white">{section.name}</td>
                        <td className="text-center px-4 py-3 text-gray-400">{section.planned}%</td>
                        <td className="text-center px-4 py-3 text-gray-400">{section.actual}%</td>
                        <td className={`text-center px-4 py-3 font-medium ${section.variance >= 0 ? 'text-green-400' : 'text-orange-400'}`}>
                          {section.variance > 0 ? '+' : ''}{section.variance}%
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${section.variance < 0 ? 'bg-orange-500/20 text-orange-300' : 'bg-green-500/20 text-green-300'}`}>
                            {section.variance < 0 ? 'Behind' : 'On Track'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Operation' : 'Log Operation'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description *</label>
                  <input
                    required
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Operation Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option>labour_allocation</option>
                    <option>delivery</option>
                    <option>resource</option>
                    <option>permit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Area</label>
                  <input
                    value={form.area}
                    onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                    placeholder="Site area or location"
                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Responsible</label>
                  <input
                    value={form.responsible}
                    onChange={(e) => setForm((f) => ({ ...f, responsible: e.target.value }))}
                    placeholder="Person or company"
                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Workforce Count</label>
                  <input
                    type="number"
                    min="0"
                    value={form.workforce_count}
                    onChange={(e) => setForm((f) => ({ ...f, workforce_count: Number(e.target.value) }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                >
                  {editing ? 'Update' : 'Log Operation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
