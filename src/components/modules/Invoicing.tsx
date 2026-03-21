// Module: Invoicing — CortexBuild Ultimate
import { useState } from 'react';
import { Plus, Download, X, Check, AlertCircle, FileText } from 'lucide-react';
import { invoices } from '../../data/mockData';
import type { Invoice } from '../../types';
import clsx from 'clsx';

export function Invoicing() {
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');

  const statusConfig: Record<Invoice['status'], { label: string; color: string; bg: string; icon: React.FC<{ className?: string }> }> = {
    paid: { label: 'Paid', color: 'text-green-400', bg: 'bg-green-500/20', icon: Check },
    sent: { label: 'Sent', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: FileText },
    overdue: { label: 'Overdue', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertCircle },
    disputed: { label: 'Disputed', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: AlertCircle },
    draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-700', icon: FileText }
  };

  const totalInvoices = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const sentAmount = invoices.filter(i => i.status === 'sent').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);
  const disputedAmount = invoices.filter(i => i.status === 'disputed').reduce((sum, inv) => sum + inv.amount, 0);

  const metrics = [
    { label: 'Total', value: `£${(totalInvoices / 1000).toFixed(1)}K`, color: 'text-blue-400' },
    { label: 'Paid', value: `£${(paidAmount / 1000).toFixed(1)}K`, color: 'text-green-400' },
    { label: 'Outstanding', value: `£${(sentAmount / 1000).toFixed(1)}K`, color: 'text-purple-400' },
    { label: 'Overdue', value: `£${(overdueAmount / 1000).toFixed(1)}K`, color: 'text-red-400' },
    { label: 'Disputed', value: `£${(disputedAmount / 1000).toFixed(1)}K`, color: 'text-yellow-400' }
  ];

  const sortedInvoices = [...invoices].sort((a, b) => {
    if (sortBy === 'amount') return b.amount - a.amount;
    if (sortBy === 'status') return a.status.localeCompare(b.status);
    return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
  });

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Invoicing</h1>
        <button
          onClick={() => setShowNewInvoice(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-blue-600"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="mb-8 grid grid-cols-5 gap-3">
        {metrics.map((metric, idx) => (
          <div key={idx} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="text-xs text-gray-400">{metric.label}</p>
            <p className={clsx('mt-2 text-lg font-bold', metric.color)}>{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Invoice Table */}
      <div className="mb-8 rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-white">Recent Invoices</h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'status')}
            className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-white border border-gray-700 focus:outline-none focus:border-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/50">
                <th className="px-5 py-3 text-left font-semibold text-gray-400">Invoice #</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-400">Client</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-400">Project</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-400">Amount</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-400">VAT</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-400">CIS</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-400">Net</th>
                <th className="px-5 py-3 text-center font-semibold text-gray-400">Status</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-400">Due Date</th>
                <th className="px-5 py-3 text-center font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.map((inv, idx) => {
                const config = statusConfig[inv.status];
                const StatusIcon = config.icon;
                const net = inv.amount - inv.cisDeduction;
                const isOverdue = inv.status === 'overdue';
                return (
                  <tr
                    key={inv.id}
                    className={clsx(
                      'border-b border-gray-800 transition-colors hover:bg-gray-800/50',
                      idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/50',
                      isOverdue && 'border-l-4 border-l-red-600'
                    )}
                  >
                    <td className="px-5 py-3 font-medium text-blue-400">{inv.number}</td>
                    <td className="px-5 py-3 text-white">{inv.client}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{inv.project.split(' ').slice(0, 2).join(' ')}</td>
                    <td className="px-5 py-3 text-right font-semibold text-white">£{(inv.amount / 1000).toFixed(0)}K</td>
                    <td className="px-5 py-3 text-right text-gray-400">£{(inv.vat / 1000).toFixed(0)}K</td>
                    <td className="px-5 py-3 text-right text-gray-400">£{(inv.cisDeduction / 1000).toFixed(0)}K</td>
                    <td className="px-5 py-3 text-right font-semibold text-white">£{(net / 1000).toFixed(0)}K</td>
                    <td className="px-5 py-3 text-center">
                      <div className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold', config.bg, config.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{inv.dueDate}</td>
                    <td className="px-5 py-3 text-center">
                      <button className="rounded-lg bg-gray-800 p-1.5 text-gray-400 transition hover:bg-gray-700 hover:text-white">
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Invoice Modal */}
      {showNewInvoice && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50">
          <div className="w-full max-w-md border-l border-gray-800 bg-gray-900 p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">New Invoice</h2>
              <button
                onClick={() => setShowNewInvoice(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400">Client</label>
                <select className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500">
                  <option>Select client...</option>
                  <option>Meridian Properties</option>
                  <option>Northern Living Ltd</option>
                  <option>West Midlands Council</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400">Project</label>
                <select className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500">
                  <option>Select project...</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400">Description</label>
                <textarea className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500 h-24 resize-none" placeholder="Invoice description..."></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400">Amount (£)</label>
                <input type="number" placeholder="0.00" className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-gray-800/50 p-3">
                <input type="checkbox" id="vat" className="rounded" defaultChecked />
                <label htmlFor="vat" className="flex-1 text-sm text-white">Apply VAT (20%)</label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400">CIS Rate</label>
                <select className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500">
                  <option value="0">None (0%)</option>
                  <option value="20">20%</option>
                  <option value="30">30%</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400">Due Date</label>
                <input type="date" className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => setShowNewInvoice(false)}
                  className="flex-1 rounded-lg bg-gray-800 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-2 text-sm font-medium text-white transition hover:from-blue-500 hover:to-blue-600">
                  Send Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
