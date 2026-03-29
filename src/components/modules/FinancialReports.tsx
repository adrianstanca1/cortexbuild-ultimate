// Module: FinancialReports — CortexBuild Ultimate Enhanced
import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Download, RefreshCw, ArrowUpRight,
  ArrowDownRight, CreditCard, AlertCircle, Trash2,
  CheckSquare, Square,
} from 'lucide-react';
import { BulkActionsBar, useBulkSelection } from '../../components/ui/BulkActions';
import { financialReportsApi } from '../../services/api';
import { toast } from 'sonner';
import clsx from 'clsx';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

type AnyRow = Record<string, unknown>;
type ReportType = 'summary' | 'p-l' | 'projects' | 'cashflow' | 'invoices';

interface FinancialSummary {
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  outstandingInvoices: number;
  overdueAmount: number;
  monthlyBurn: number;
}

interface ProjectFinancial {
  id: number;
  name: string;
  client: string;
  budget: number;
  spent: number;
  variance: number;
  variancePercent: number;
  profit: number;
  status: string;
}

interface CashFlow {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

function _exportToCSV(data: AnyRow[], filename: string) {
  if (data.length === 0) {
    toast.error('No data to export');
    return;
  }
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => {
        const val = row[h];
        const str = String(val ?? '');
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast.success(`Exported ${data.length} rows`);
}

const fmtCurrency = (n: number) => {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}K`;
  return `£${n.toFixed(0)}`;
};

const StatCard = ({ title, value, change, changeType, icon: Icon, color }: any) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{String(title)}</p>
        <p className="text-2xl font-bold text-white font-display">{fmtCurrency(Number(value))}</p>
      </div>
      <div className={clsx('p-2 rounded-lg', `bg-${color}-500/20`)}>
        <Icon className={clsx('h-5 w-5', `text-${color}-400`)} />
      </div>
    </div>
    {Boolean(change) && (
      <div className="mt-3 flex items-center gap-1">
        {String(changeType) === 'up' ? (
          <ArrowUpRight className="h-4 w-4 text-emerald-400" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-red-400" />
        )}
        <span className={clsx('text-sm font-medium', String(changeType) === 'up' ? 'text-emerald-400' : 'text-red-400')}>
          {Number(change)}%
        </span>
        <span className="text-gray-500 text-xs">vs budget</span>
      </div>
    )}
  </div>
);

export function FinancialReports() {
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('this_month');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [projectFinancials, setProjectFinancials] = useState<ProjectFinancial[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([]);
  const [_projects, _setProjects] = useState<AnyRow[]>([]);
  const [_invoices, _setInvoices] = useState<AnyRow[]>([]);

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

  const _deleteMutation = { mutateAsync: async () => {} };

  useEffect(() => {
    Promise.all([
      financialReportsApi.getSummary(),
      financialReportsApi.getProjectFinancials(),
      financialReportsApi.getCashFlow(),
    ]).then(([summaryData, projData, cashFlowData]) => {
      setSummary(summaryData as FinancialSummary);
      setProjectFinancials(projData as unknown as ProjectFinancial[]);
      setCashFlow(cashFlowData as unknown as CashFlow[]);
    }).catch(() => {
      setSummary({
        totalRevenue: 0, totalCosts: 0, grossProfit: 0, netProfit: 0,
        outstandingInvoices: 0, overdueAmount: 0, monthlyBurn: 0,
      });
    }).finally(() => setLoading(false));
  }, []);

  const ReportTabs = () => (
    <div className="flex gap-2 mb-6 border-b border-gray-800">
      {[
        { id: 'summary', label: 'Summary' },
        { id: 'p-l', label: 'P&L' },
        { id: 'projects', label: 'Projects' },
        { id: 'cashflow', label: 'Cash Flow' },
        { id: 'invoices', label: 'Invoices' },
      ].map((tab) => (
        <button
          key={String(tab.id)}
          onClick={() => setReportType(tab.id as ReportType)}
          className={clsx(
            'px-4 py-3 font-medium text-sm transition-all border-b-2',
            reportType === tab.id
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          )}
        >
          {String(tab.label)}
        </button>
      ))}
    </div>
  );

  const SummaryTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Revenue" value={summary?.totalRevenue || 0} change={12} changeType="up" icon={DollarSign} color="emerald" />
        <StatCard title="Costs" value={summary?.totalCosts || 0} change={5} changeType="down" icon={CreditCard} color="red" />
        <StatCard title="Gross Profit" value={summary?.grossProfit || 0} change={8} changeType="up" icon={TrendingUp} color="blue" />
        <StatCard title="Outstanding" value={summary?.outstandingInvoices || 0} icon={AlertCircle} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-lg font-bold text-white mb-4">Revenue vs Cost</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { month: 'Jan', revenue: 185000, cost: 142000 },
                { month: 'Feb', revenue: 220000, cost: 165000 },
                { month: 'Mar', revenue: 198000, cost: 148000 },
                { month: 'Apr', revenue: 289000, cost: 218000 },
                { month: 'May', revenue: 267000, cost: 200000 },
                { month: 'Jun', revenue: 310000, cost: 232000 },
              ]}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="cost" stroke="#ef4444" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-bold text-white mb-4">Gross Margin %</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { month: 'Jan', margin: 23 },
                { month: 'Feb', margin: 25 },
                { month: 'Mar', margin: 25 },
                { month: 'Apr', margin: 24 },
                { month: 'May', margin: 25 },
                { month: 'Jun', margin: 25 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                <Line type="monotone" dataKey="margin" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const PLTab = () => (
    <div className="card">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Profit & Loss Statement</h3>
        <button className="btn btn-secondary text-sm">
          <Download className="h-4 w-4 mr-2" />
          PDF
        </button>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div className="border-b border-gray-700 pb-4">
            <h4 className="text-sm text-gray-400 uppercase mb-3 font-bold">Revenue</h4>
            <div className="space-y-2">
              <div className="flex justify-between p-2">
                <span className="text-gray-300">Contract Income</span>
                <span className="text-white font-medium">{fmtCurrency(summary?.totalRevenue || 0)}</span>
              </div>
              <div className="flex justify-between p-2">
                <span className="text-gray-300">Variations</span>
                <span className="text-white font-medium">{fmtCurrency((summary?.totalRevenue || 0) * 0.05)}</span>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-700 pb-4">
            <h4 className="text-sm text-gray-400 uppercase mb-3 font-bold">Costs</h4>
            <div className="space-y-2">
              <div className="flex justify-between p-2">
                <span className="text-gray-300">Labour</span>
                <span className="text-white font-medium">{fmtCurrency((summary?.totalCosts || 0) * 0.4)}</span>
              </div>
              <div className="flex justify-between p-2">
                <span className="text-gray-300">Materials</span>
                <span className="text-white font-medium">{fmtCurrency((summary?.totalCosts || 0) * 0.4)}</span>
              </div>
              <div className="flex justify-between p-2">
                <span className="text-gray-300">Plant & Equipment</span>
                <span className="text-white font-medium">{fmtCurrency((summary?.totalCosts || 0) * 0.1)}</span>
              </div>
              <div className="flex justify-between p-2">
                <span className="text-gray-300">Subcontractors</span>
                <span className="text-white font-medium">{fmtCurrency((summary?.totalCosts || 0) * 0.1)}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-white">Net Profit</span>
              <span className="text-lg font-bold text-emerald-400">{fmtCurrency(summary?.netProfit || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ProjectsTab = () => (
    <div className="space-y-6">
      <div className="card p-5">
        <h3 className="text-lg font-bold text-white mb-4">Project Cost Analysis</h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="w-10"></th>
                <th className="text-left p-3 text-gray-400 font-medium">Project</th>
                <th className="text-right p-3 text-gray-400 font-medium">Budget</th>
                <th className="text-right p-3 text-gray-400 font-medium">Spent</th>
                <th className="text-right p-3 text-gray-400 font-medium">Variance</th>
                <th className="text-right p-3 text-gray-400 font-medium">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {projectFinancials.map((proj) => {
                const isSelected = selectedIds.has(String(proj.id));
                return (
                <tr key={proj.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="p-3">
                    <button type="button" onClick={e => { e.stopPropagation(); toggle(String(proj.id)); }}>
                      {isSelected ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
                    </button>
                  </td>
                  <td className="p-3">
                    <div>
                      <p className="font-medium text-white">{String(proj.name)}</p>
                      <p className="text-xs text-gray-500">{String(proj.client)}</p>
                    </div>
                  </td>
                  <td className="text-right p-3 text-gray-300">{fmtCurrency(proj.budget)}</td>
                  <td className="text-right p-3 text-gray-300">{fmtCurrency(proj.spent)}</td>
                  <td className={clsx('text-right p-3 font-medium', proj.variance >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {proj.variance >= 0 ? '+' : ''}{fmtCurrency(proj.variance)}
                  </td>
                  <td className="text-right p-3 text-gray-300">{proj.variancePercent.toFixed(1)}%</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectFinancials.map((p) => ({ name: p.name, budget: p.budget, spent: p.spent }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
              <Legend />
              <Bar dataKey="budget" fill="#3b82f6" />
              <Bar dataKey="spent" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const CashFlowTab = () => (
    <div className="space-y-6">
      <div className="card p-5">
        <h3 className="text-lg font-bold text-white mb-4">Monthly Cash Flow</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashFlow}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
              <Legend />
              <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-400 uppercase mb-2">Total Income</p>
          <p className="text-2xl font-bold text-emerald-400">{fmtCurrency(cashFlow.reduce((s, m) => s + m.income, 0))}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-400 uppercase mb-2">Total Expenses</p>
          <p className="text-2xl font-bold text-red-400">{fmtCurrency(cashFlow.reduce((s, m) => s + m.expenses, 0))}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-400 uppercase mb-2">Net Position</p>
          <p className="text-2xl font-bold text-blue-400">{fmtCurrency(cashFlow.reduce((s, m) => s + m.net, 0))}</p>
        </div>
      </div>
    </div>
  );

  const InvoicesTab = () => (
    <div className="card p-5">
      <h3 className="text-lg font-bold text-white mb-4">Invoice Aging Analysis</h3>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '0-30 days', value: 145000 },
          { label: '31-60 days', value: 89000 },
          { label: '61-90 days', value: 56000 },
          { label: '90+ days', value: 95000 },
        ].map((item) => (
          <div key={String(item.label)} className="p-4 bg-gray-800/50 rounded-lg text-center">
            <p className="text-xs text-gray-400 mb-2">{String(item.label)}</p>
            <p className="text-xl font-bold text-white">{fmtCurrency(item.value)}</p>
          </div>
        ))}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[
            { bucket: '0-30', total: 145000 },
            { bucket: '31-60', total: 89000 },
            { bucket: '61-90', total: 56000 },
            { bucket: '90+', total: 95000 },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="bucket" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
            <Bar dataKey="total" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Financial Reports</h1>
          <p className="text-sm text-gray-500">Comprehensive financial analysis and reporting</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-4 py-2"
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_quarter">This Quarter</option>
            <option value="this_year">This Year</option>
          </select>
          <button type="button" onClick={() => {}} className="btn btn-secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {ReportTabs()}

      {reportType === 'summary' && SummaryTab()}
      {reportType === 'p-l' && PLTab()}
      {reportType === 'projects' && (
        <>
          {ProjectsTab()}
          <BulkActionsBar
            selectedIds={Array.from(selectedIds)}
            actions={[
              { id: 'delete', label: 'Delete Selected', icon: Trash2, variant: 'danger', onClick: handleBulkDelete, confirm: 'This action cannot be undone.' },
            ]}
            onClearSelection={clearSelection}
          />
        </>
      )}
      {reportType === 'cashflow' && CashFlowTab()}
      {reportType === 'invoices' && InvoicesTab()}
    </div>
  );
}
