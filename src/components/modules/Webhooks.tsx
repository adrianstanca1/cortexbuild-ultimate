/**
 * Webhooks — UI for managing webhook subscriptions and delivery logs.
 * Uses webhooksApi from services/api.ts.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Webhook as WebhookIcon, Plus, Search, Trash2, Edit2, X, Send, CheckCircle,
  XCircle, Clock, ChevronDown, ChevronUp, RefreshCw, Activity
} from 'lucide-react';
import { webhooksApi } from '../../services/api';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { EmptyState } from '../ui/EmptyState';
import { toast } from 'sonner';

type Webhook = {
  id: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  headers?: Record<string, string>;
  active: boolean;
  created_at: string;
  updated_at?: string;
};

type Delivery = {
  id: string;
  webhook_id: string;
  event: string;
  status: 'success' | 'failed' | 'pending';
  response_status?: number;
  response_body?: string;
  attempted_at: string;
  duration_ms?: number;
  error?: string;
};

const EVENT_OPTIONS = [
  'rfi.created', 'rfi.updated', 'rfi.answered',
  'daily-report.created', 'change-order.created', 'change-order.approved',
  'invoice.created', 'invoice.paid', 'valuation.created',
  'document.uploaded', 'safety.incident', 'project.updated',
];

export function Webhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Webhook | null>(null);
  const [form, setForm] = useState({ name: '', url: '', secret: '', events: [] as string[], headers: {} as Record<string, string>, active: true });
  const [headerKey, setHeaderKey] = useState('');
  const [headerVal, setHeaderVal] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Record<string, Delivery[]>>({});
  const [deliveryLoading, setDeliveryLoading] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await webhooksApi.getAll();
      setWebhooks((Array.isArray(res.data) ? res.data : []) as Webhook[]);
    } catch {
      toast.error('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  async function loadDeliveries(webhookId: string) {
    if (expandedId !== webhookId) {
      setExpandedId(webhookId);
    }
    if (deliveries[webhookId]) return;
    setDeliveryLoading(webhookId);
    try {
      const res = await webhooksApi.getDeliveries(webhookId);
      setDeliveries(prev => ({ ...prev, [webhookId]: (Array.isArray(res.data) ? res.data : []) as Delivery[] }));
    } catch {
      toast.error('Failed to load delivery logs');
    } finally {
      setDeliveryLoading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.url) {
      toast.error('Name and URL are required');
      return;
    }
    try {
      if (editing) {
        await webhooksApi.update(editing.id, form);
        toast.success('Webhook updated');
      } else {
        await webhooksApi.create(form);
        toast.success('Webhook created');
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', url: '', secret: '', events: [], headers: {}, active: true });
      fetchWebhooks();
    } catch {
      toast.error(editing ? 'Failed to update webhook' : 'Failed to create webhook');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this webhook?')) return;
    try {
      await webhooksApi.delete(id);
      toast.success('Webhook deleted');
      fetchWebhooks();
    } catch {
      toast.error('Failed to delete webhook');
    }
  }

  async function handleSendTest(id: string) {
    setTestingId(id);
    try {
      await webhooksApi.sendTest(id);
      toast.success('Test event sent');
    } catch {
      toast.error('Failed to send test event');
    } finally {
      setTestingId(null);
    }
  }

  function openEdit(w: Webhook) {
    setEditing(w);
    setForm({ name: w.name, url: w.url, secret: w.secret || '', events: w.events || [], headers: w.headers || {}, active: w.active });
    setShowModal(true);
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: '', url: '', secret: '', events: [], headers: {}, active: true });
    setShowModal(true);
  }

  function toggleEvent(event: string) {
    setForm(f => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter(e => e !== event) : [...f.events, event],
    }));
  }

  function addHeader() {
    if (!headerKey.trim()) return;
    setForm(f => ({ ...f, headers: { ...f.headers, [headerKey.trim()]: headerVal } }));
    setHeaderKey('');
    setHeaderVal('');
  }

  function removeHeader(key: string) {
    setForm(f => {
      const h = { ...f.headers };
      delete h[key];
      return { ...f, headers: h };
    });
  }

  const filtered = webhooks.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.url.toLowerCase().includes(search.toLowerCase())
  );

  const statusColour = (active: boolean) => active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/30 text-gray-400';

  const deliveryColour = (status: string) => {
    if (status === 'success') return 'text-green-400';
    if (status === 'failed') return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <>
      <ModuleBreadcrumbs currentModule="webhooks" onNavigate={() => {}} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display text-white">Webhooks</h1>
            <p className="text-sm text-gray-400 mt-1">Manage webhook subscriptions and delivery logs</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
          >
            <Plus size={16} /> New Webhook
          </button>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search webhooks..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={WebhookIcon}
            title="No webhooks configured"
            description="Create a webhook to receive real-time notifications when events occur."
          />
        ) : (
          <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
            {filtered.map(w => (
              <div key={w.id}>
                <div className="flex items-center gap-4 p-4 hover:bg-gray-800/50 cursor-pointer" onClick={() => loadDeliveries(w.id)}>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <WebhookIcon size={20} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{w.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColour(w.active)}`}>
                        {w.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">{w.url}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(w.events || []).slice(0, 5).map(e => (
                        <span key={e} className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">{e}</span>
                      ))}
                      {(w.events || []).length > 5 && (
                        <span className="text-xs text-gray-500">+{w.events.length - 5} more</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); handleSendTest(w.id); }}
                      disabled={testingId === w.id}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Send test event"
                    >
                      {testingId === w.id ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(w); }}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(w.id); }}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                    {(expandedId === w.id || deliveries[w.id]) && (
                      <ChevronUp size={16} className="text-gray-500" onClick={e => { e.stopPropagation(); setExpandedId(null); }} />
                    )}
                    {expandedId !== w.id && !deliveries[w.id] && (
                      <ChevronDown size={16} className="text-gray-500" />
                    )}
                  </div>
                </div>

                {expandedId === w.id && (
                  <div className="px-6 pb-4 bg-gray-800/30 border-t border-gray-800">
                    <div className="flex items-center gap-2 mb-3 pt-3">
                      <Activity size={14} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-300">Recent Deliveries</span>
                      {deliveryLoading === w.id && <RefreshCw size={12} className="animate-spin text-gray-400" />}
                    </div>
                    {deliveryLoading === w.id ? (
                      <div className="text-center py-4 text-sm text-gray-500">Loading...</div>
                    ) : deliveries[w.id]?.length === 0 ? (
                      <div className="text-center py-4 text-sm text-gray-500">No delivery logs yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {(deliveries[w.id] || []).slice(0, 10).map(d => (
                          <div key={d.id} className="flex items-center gap-3 text-xs bg-gray-800 rounded-lg p-3">
                            <span className={deliveryColour(d.status)}>
                              {d.status === 'success' ? <CheckCircle size={12} /> : d.status === 'failed' ? <XCircle size={12} /> : <Clock size={12} />}
                            </span>
                            <span className="text-gray-400">{d.event}</span>
                            {d.response_status && <span className="text-gray-500">HTTP {d.response_status}</span>}
                            {d.duration_ms && <span className="text-gray-500">{d.duration_ms}ms</span>}
                            <span className="text-gray-600 ml-auto">{new Date(d.attempted_at).toLocaleString()}</span>
                            {d.error && <span className="text-red-400 truncate max-w-xs">{d.error}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
                <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Webhook' : 'New Webhook'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><X size={18} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Slack Notifications"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">URL *</label>
                  <input
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="https://example.com/webhook"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Secret (optional)</label>
                  <input
                    value={form.secret}
                    onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
                    placeholder="Signing secret for verification"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Events</label>
                  <div className="grid grid-cols-2 gap-2">
                    {EVENT_OPTIONS.map(e => (
                      <label key={e} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.events.includes(e)}
                          onChange={() => toggleEvent(e)}
                          className="rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-xs text-gray-300">{e}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Custom Headers</label>
                  {Object.entries(form.headers).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">{k}: {v}</span>
                      <button type="button" onClick={() => removeHeader(k)} className="text-gray-400 hover:text-red-400"><X size={12} /></button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      value={headerKey}
                      onChange={e => setHeaderKey(e.target.value)}
                      placeholder="Header name"
                      className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      value={headerVal}
                      onChange={e => setHeaderVal(e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button type="button" onClick={addHeader} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white">Add</button>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    className="rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-300">Active</span>
                </label>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
                    {editing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Webhooks;
