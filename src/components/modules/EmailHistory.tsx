import React, { useState, useEffect, useCallback } from 'react';
import { emailApi } from '@/services/api';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  ArrowUpRight,
  Calendar,
  Trash2,
  CheckCircle,
  Mail,
  Loader2,
  ChevronDown,
  ChevronUp,
  Edit,
} from 'lucide-react';

interface EmailLog {
  id: number;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  email_type: string;
  status: string;
  sent_at: string;
  read_at?: string;
}

interface EmailHistoryProps {
  initialFilterStatus?: string;
  initialFilterType?: string;
}

export function EmailHistory({
  initialFilterStatus = 'all',
  initialFilterType = 'all',
}: EmailHistoryProps) {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>(
    initialFilterStatus
  );
  const [filterType, setFilterType] = useState<string>(initialFilterType);
  const limit = 20;

  const loadEmails = useCallback(async () => {
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
  }, [page, filterStatus, filterType, limit]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleFilterChange = () => {
    setPage(0); // Reset to first page when filters change
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Email History</h2>
        <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <input
              type="text"
              placeholder="Search emails..."
              className="border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                handleFilterChange();
              }}
              className="border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-400"
            >
              <option value="all">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                handleFilterChange();
              }}
              className="border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-400"
            >
              <option value="all">All Types</option>
              <option value="invoice">Invoice</option>
              <option value="reminder">Reminder</option>
              <option value="report">Report</option>
              <option value="update">Update</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 mx-auto mb-4 text-emerald-400" />
          <p className="text-gray-500">Loading email history...</p>
        </div>
      ) : emails.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No emails found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {emails.map((email) => (
                  <tr key={email.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {formatDate(email.sent_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{email.sender}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{email.recipient}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">{email.subject}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 capitalize">{email.email_type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          email.status === 'sent'
                            ? 'text-emerald-400 bg-emerald-500/20'
                            : email.status === 'failed'
                              ? 'text-red-400 bg-red-500/20'
                              : 'text-gray-400 bg-gray-500/20'
                        }`}
                      >
                        {email.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                      {email.status !== 'draft' && (
                        <Mail
                          className="h-4 w-4 hover:text-emerald-400"
                          onClick={() => {
                            // TODO: Implement view email
                          }}
                        />
                      )}
                      <Edit
                        className="h-4 w-4 hover:text-blue-400"
                        onClick={() => {
                          // TODO: Implement edit email
                        }}
                      />
                      <Trash2
                        className="h-4 w-4 hover:text-red-400"
                        onClick={() => {
                          // TODO: Implement delete email
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4">
            <div className="text-sm text-gray-500">
              Showing {page * limit + 1}-{
                Math.min((page + 1) * limit, total)
              } of {total} emails
            </div>
            <div className="flex items-center gap-4 mt-3 sm:mt-0">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={(page + 1) * limit >= total}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
