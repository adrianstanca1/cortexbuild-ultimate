import { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import { emailApi } from '../../services/api';
import { toast } from 'sonner';
import clsx from 'clsx';

interface EmailLog {
  id: number;
  recipient: string;
  subject: string;
  body: string;
  email_type: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced';
  error?: string;
  created_at: string;
  sent_at?: string;
}

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  queued: { color: 'text-gray-400 bg-gray-500/20', icon: Clock, label: 'Queued' },
  sent: { color: 'text-blue-400 bg-blue-500/20', icon: Send, label: 'Sent' },
  delivered: { color: 'text-emerald-400 bg-emerald-500/20', icon: CheckCircle, label: 'Delivered' },
  failed: { color: 'text-red-400 bg-red-500/20', icon: XCircle, label: 'Failed' },
  bounced: { color: 'text-amber-400 bg-amber-500/20', icon: AlertTriangle, label: 'Bounced' },
};

const typeLabels: Record<string, string> = {
  invoice_overdue: 'Invoice Overdue',
  invoice_paid: 'Invoice Paid',
  project_update: 'Project Update',
  safety_alert: 'Safety Alert',
  rfi_response: 'RFI Response',
  meeting_reminder: 'Meeting Reminder',
  deadline_reminder: 'Deadline Reminder',
  document_shared: 'Document Shared',
  team_assignment: 'Team Assignment',
  weekly_summary: 'Weekly Summary',
  bulk: 'Bulk Email',
};

export function EmailHistory() {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadEmails();
  }, [page, filterStatus, filterType]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const data = await emailApi.getHistory(limit, page * limit);
      let filtered = data.emails as unknown as EmailLog[];
      if (filterStatus !== 'all') {
        filtered = filtered.filter((e) => e.status === filterStatus);
      }
      if (filterType !== 'all') {
        filtered = filtered.filter((e) => e.email_type === filterType);
      }
      setEmails(filtered);
      setTotal(data.total);
    } catch (err) {
      toast.error('Failed to load email history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const uniqueTypes = [...new Set(emails.map((e: EmailLog) => e.email_type))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white font-display flex items-center gap-3">
            <Mail className="h-7 w-7 text-blue-400" />
            Email History
          </h1>
          <p className="text-sm text-gray-500">Track all sent emails and notifications</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-4 py-2"
          >
            <option value="all">All Status</option>
            <option value="queued">Queued</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-4 py-2"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map((type: string) => (
              <option key={type} value={type}>{typeLabels[type] || type}</option>
            ))}
          </select>
          <button onClick={loadEmails} className="btn btn-secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'emerald' },
          { key: 'sent', label: 'Sent', icon: Send, color: 'blue' },
          { key: 'failed', label: 'Failed', icon: XCircle, color: 'red' },
          { key: 'total', label: 'Total', icon: Mail, color: 'gray' },
        ].map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="card p-5">
            <div className="flex items-center gap-3">
              <div className={clsx(`p-2 rounded-lg bg-${color}-500/20`)}>
                <Icon className={clsx(`h-5 w-5 text-${color}-400`)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {key === 'total' ? total : emails.filter((e: EmailLog) => e.status === key).length}
                </p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 text-xs text-gray-500 uppercase">Recipient</th>
                <th className="text-left p-4 text-xs text-gray-500 uppercase">Subject</th>
                <th className="text-left p-4 text-xs text-gray-500 uppercase">Type</th>
                <th className="text-left p-4 text-xs text-gray-500 uppercase">Status</th>
                <th className="text-left p-4 text-xs text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <RefreshCw className="h-6 w-6 text-blue-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No emails found</td>
                </tr>
              ) : (
                emails.map((email: EmailLog) => {
                  const status = statusConfig[email.status] || statusConfig.queued;
                  const StatusIcon = status.icon;
                  return (
                    <tr
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors"
                    >
                      <td className="p-4">
                        <p className="text-sm font-medium text-white">{email.recipient}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-300 truncate max-w-xs">{email.subject}</p>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-400">
                          {typeLabels[email.email_type] || email.email_type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={clsx('flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium', status.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-400">{formatDate(email.created_at)}</p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {total > limit && (
          <div className="p-4 border-t border-gray-800 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn btn-secondary text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => (p + 1) * limit < total ? p + 1 : p)}
                disabled={(page + 1) * limit >= total}
                className="btn btn-secondary text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedEmail(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-800">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white">Email Details</h3>
                  <p className="text-sm text-gray-500">{formatDate(selectedEmail.created_at)}</p>
                </div>
                <button onClick={() => setSelectedEmail(null)} className="text-gray-500 hover:text-white">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Recipient</p>
                  <p className="text-white">{selectedEmail.recipient}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Type</p>
                  <p className="text-white">{typeLabels[selectedEmail.email_type] || selectedEmail.email_type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Status</p>
                  <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', statusConfig[selectedEmail.status]?.color)}>
                    {statusConfig[selectedEmail.status]?.label}
                  </span>
                </div>
                {selectedEmail.error && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 uppercase mb-1">Error</p>
                    <p className="text-red-400">{selectedEmail.error}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Subject</p>
                <p className="text-white font-medium">{selectedEmail.subject}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Body</p>
                <div
                  className="bg-gray-800 rounded-lg p-4 text-gray-300 text-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body || '<p class="text-gray-500">No body content</p>' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
