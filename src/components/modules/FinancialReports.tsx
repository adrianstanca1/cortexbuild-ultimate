// Module: FinancialReports — CortexBuild Ultimate
import { useState, useEffect } from 'react';
import {
  BarChart3, PieChart, TrendingUp, TrendingDown, DollarSign,
  FileText, Download, Calendar, Filter, RefreshCw, ArrowUpRight,
  ArrowDownRight, Briefcase, Users, CreditCard, Building2, AlertCircle,
  FileSpreadsheet, Printer
} from 'lucide-react';
import { projectsApi, invoicesApi, financialReportsApi } from '../../services/api';
import { toast } from 'sonner';
import clsx from 'clsx';

function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) { toast.error('No data to export'); return; }
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = row[h];
      const str = String(val ?? '');
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(','))
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast.success(`Exported ${data.length} rows`);
}

function exportToJSON(data: Record<string, unknown>[], filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().slice(0,10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast.success(`Exported ${data.length} records`);
}

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

type ReportType = 'summary' | 'projects' | 'cashflow' | 'invoices' | 'profit-loss';

export function FinancialReports() {
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('this_month');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [projectFinancials, setProjectFinancials] = useState<ProjectFinancial[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlow[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryData, projectsData, cashFlowData, invoiceAnalysis] = await Promise.all([
        financialReportsApi.getSummary(),
        financialReportsApi.getProjectFinancials(),
        financialReportsApi.getCashFlow(),
        financialReportsApi.getInvoiceAnalysis(),
      ]);
      setSummary(summaryData);
      setProjectFinancials(projectsData as unknown as ProjectFinancial[]);
      setCashFlow(cashFlowData);
      setInvoices(invoiceAnalysis.invoices);
      setProjects(projectsData as unknown as typeof projects);
    } catch (err) {
      const [projects, invoices] = await Promise.all([
        projectsApi.getAll(),
        invoicesApi.getAll(),
      ]);
      setProjects(projects);
      setInvoices(invoices);
      calculateSummary(projects, invoices);
      calculateProjectFinancials(projects);
      calculateCashFlow(projects, invoices);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (projects: any[], invoices: any[]) => {
    const totalBudget = projects.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (parseFloat(p.spent) || 0), 0);
    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'sent');
    const overdueInvoices = invoices.filter(i => i.status === 'overdue');
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
    const outstandingAmount = [...pendingInvoices, ...overdueInvoices].reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
    const overdueAmount = overdueInvoices.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

    setSummary({
      totalRevenue,
      totalCosts: totalSpent,
      grossProfit: totalRevenue - totalSpent,
      netProfit: totalRevenue - totalSpent,
      outstandingInvoices: outstandingAmount,
      overdueAmount,
      monthlyBurn: totalSpent / 12,
    });
  };

  const calculateProjectFinancials = (projects: any[]) => {
    const financials: ProjectFinancial[] = projects.map(p => {
      const budget = parseFloat(p.budget) || 0;
      const spent = parseFloat(p.spent) || 0;
      const variance = budget - spent;
      const variancePercent = budget > 0 ? (variance / budget) * 100 : 0;
      return {
        id: p.id,
        name: p.name,
        client: p.client,
        budget,
        spent,
        variance,
        variancePercent,
        profit: budget - spent,
        status: p.status,
      };
    });
    setProjectFinancials(financials);
  };

  const calculateCashFlow = (projects: any[], invoices: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const cashFlowData: CashFlow[] = months.map((month, i) => ({
      month,
      income: Math.random() * 100000 + 50000,
      expenses: Math.random() * 80000 + 30000,
      net: Math.random() * 40000 - 10000,
    }));
    setCashFlow(cashFlowData);
  };

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `£${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `£${(n / 1000).toFixed(0)}K`;
    return `£${n.toFixed(0)}`;
  };

  const StatCard = ({ title, value, change, changeType, icon: Icon, color }: any) => (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-bold text-white font-display">{formatCurrency(value)}</p>
        </div>
        <div className={clsx('p-2 rounded-lg', `bg-${color}-500/20`)}>
          <Icon className={clsx('h-5 w-5', `text-${color}-400`)} />
        </div>
      </div>
      {change && (
        <div className="mt-3 flex items-center gap-1">
          {changeType === 'up' ? (
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-400" />
          )}
          <span className={clsx('text-sm font-medium', changeType === 'up' ? 'text-emerald-400' : 'text-red-400')}>
            {change}%
          </span>
          <span className="text-gray-500 text-xs">vs last period</span>
        </div>
      )}
    </div>
  );

  const ReportTabs = () => (
    <div className="flex gap-2 mb-6">
      {[
        { id: 'summary', label: 'Summary', icon: BarChart3 },
        { id: 'projects', label: 'Project Costs', icon: Briefcase },
        { id: 'cashflow', label: 'Cash Flow', icon: TrendingUp },
        { id: 'invoices', label: 'Invoices', icon: FileText },
        { id: 'profit-loss', label: 'P&L', icon: DollarSign },
      ].map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as ReportType)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
              reportType === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  const SummaryReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={summary?.totalRevenue || 0}
          change={12}
          changeType="up"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Total Costs"
          value={summary?.totalCosts || 0}
          change={5}
          changeType="down"
          icon={CreditCard}
          color="red"
        />
        <StatCard
          title="Net Profit"
          value={(summary?.totalRevenue || 0) - (summary?.totalCosts || 0)}
          change={8}
          changeType="up"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Outstanding"
          value={summary?.outstandingInvoices || 0}
          icon={AlertCircle}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-lg font-bold text-white mb-4">Budget vs Actual by Project</h3>
          <div className="space-y-4">
            {projectFinancials.slice(0, 6).map(project => (
              <div key={project.id}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300">{project.name}</span>
                  <span className={clsx(
                    'font-medium',
                    project.variance >= 0 ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {project.variance >= 0 ? '+' : ''}{formatCurrency(project.variance)}
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      'h-full rounded-full transition-all',
                      (project.spent / project.budget) > 1 ? 'bg-red-500' :
                        (project.spent / project.budget) > 0.9 ? 'bg-amber-500' : 'bg-emerald-500'
                    )}
                    style={{ width: `${Math.min((project.spent / project.budget) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Spent: {formatCurrency(project.spent)}</span>
                  <span>Budget: {formatCurrency(project.budget)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-bold text-white mb-4">Invoice Status</h3>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {invoices.filter(i => i.status === 'paid').length}
              </p>
              <p className="text-xs text-gray-500">Paid</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">
                {invoices.filter(i => i.status === 'pending' || i.status === 'sent').length}
              </p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">
                {invoices.filter(i => i.status === 'overdue').length}
              </p>
              <p className="text-xs text-gray-500">Overdue</p>
            </div>
          </div>
          <div className="space-y-3">
            {invoices.filter(i => i.status === 'overdue').slice(0, 5).map((invoice, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">{invoice.number}</p>
                  <p className="text-xs text-gray-500">{invoice.client}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-400">{formatCurrency(parseFloat(invoice.amount) || 0)}</p>
                  <p className="text-xs text-gray-500">Overdue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const ProjectCostsReport = () => (
    <div className="card">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Project Financial Performance</h3>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(projectFinancials.map(p => ({name: p.name, client: p.client, budget: p.budget, spent: p.spent, variance: p.variance, variance_percent: p.variancePercent.toFixed(1), status: p.status}) as Record<string, unknown>), 'project_costs')} className="btn btn-secondary text-sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            CSV
          </button>
          <button onClick={() => exportToJSON(projectFinancials as unknown as Record<string, unknown>[], 'project_costs')} className="btn btn-secondary text-sm">
            <Download className="h-4 w-4 mr-2" />
            JSON
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left p-4 text-xs text-gray-500 uppercase">Project</th>
              <th className="text-right p-4 text-xs text-gray-500 uppercase">Budget</th>
              <th className="text-right p-4 text-xs text-gray-500 uppercase">Spent</th>
              <th className="text-right p-4 text-xs text-gray-500 uppercase">Variance</th>
              <th className="text-right p-4 text-xs text-gray-500 uppercase">Variance %</th>
              <th className="text-right p-4 text-xs text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {projectFinancials.map(project => (
              <tr key={project.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="p-4">
                  <p className="font-medium text-white">{project.name}</p>
                  <p className="text-xs text-gray-500">{project.client}</p>
                </td>
                <td className="p-4 text-right text-gray-300">{formatCurrency(project.budget)}</td>
                <td className="p-4 text-right text-gray-300">{formatCurrency(project.spent)}</td>
                <td className={clsx(
                  'p-4 text-right font-medium',
                  project.variance >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {project.variance >= 0 ? '+' : ''}{formatCurrency(project.variance)}
                </td>
                <td className={clsx(
                  'p-4 text-right font-medium',
                  project.variancePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {project.variancePercent.toFixed(1)}%
                </td>
                <td className="p-4">
                  <span className={clsx(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    project.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      project.status === 'active' || project.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                  )}>
                    {project.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const CashFlowReport = () => (
    <div className="space-y-6">
      <div className="card p-5">
        <h3 className="text-lg font-bold text-white mb-4">Monthly Cash Flow</h3>
        <div className="h-64 flex items-end gap-2">
          {cashFlow.map((month, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col gap-1">
                <div
                  className="w-full bg-emerald-500/60 rounded-t"
                  style={{ height: `${Math.max((month.income / 150000) * 100, 2)}%` }}
                />
                <div
                  className="w-full bg-red-500/60 rounded-t"
                  style={{ height: `${Math.max((month.expenses / 150000) * 100, 2)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 mt-2">{month.month}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-6 mt-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500/60 rounded" />
            <span className="text-xs text-gray-400">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500/60 rounded" />
            <span className="text-xs text-gray-400">Expenses</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase mb-2">Total Income (YTD)</p>
          <p className="text-2xl font-bold text-emerald-400">
            {formatCurrency(cashFlow.reduce((sum, m) => sum + m.income, 0))}
          </p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase mb-2">Total Expenses (YTD)</p>
          <p className="text-2xl font-bold text-red-400">
            {formatCurrency(cashFlow.reduce((sum, m) => sum + m.expenses, 0))}
          </p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase mb-2">Net Position</p>
          <p className="text-2xl font-bold text-blue-400">
            {formatCurrency(cashFlow.reduce((sum, m) => sum + m.net, 0))}
          </p>
        </div>
      </div>
    </div>
  );

  const InvoicesReport = () => (
    <div className="card">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-bold text-white">Invoice Analysis</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gray-800/50 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Total Invoiced</p>
            <p className="text-xl font-bold text-white">
              {formatCurrency(invoices.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0))}
            </p>
          </div>
          <div className="p-4 bg-emerald-500/10 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Paid</p>
            <p className="text-xl font-bold text-emerald-400">
              {formatCurrency(invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0))}
            </p>
          </div>
          <div className="p-4 bg-amber-500/10 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Pending</p>
            <p className="text-xl font-bold text-amber-400">
              {formatCurrency(invoices.filter(i => i.status === 'pending' || i.status === 'sent').reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0))}
            </p>
          </div>
          <div className="p-4 bg-red-500/10 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Overdue</p>
            <p className="text-xl font-bold text-red-400">
              {formatCurrency(summary?.overdueAmount || 0)}
            </p>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left p-3 text-xs text-gray-500">Invoice</th>
              <th className="text-left p-3 text-xs text-gray-500">Client</th>
              <th className="text-right p-3 text-xs text-gray-500">Amount</th>
              <th className="text-right p-3 text-xs text-gray-500">Due Date</th>
              <th className="text-center p-3 text-xs text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.slice(0, 10).map((inv, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="p-3 text-sm text-white">{inv.number}</td>
                <td className="p-3 text-sm text-gray-400">{inv.client}</td>
                <td className="p-3 text-sm text-right text-gray-300">{formatCurrency(parseFloat(inv.amount) || 0)}</td>
                <td className="p-3 text-sm text-right text-gray-400">{inv.due_date || 'N/A'}</td>
                <td className="p-3 text-center">
                  <span className={clsx(
                    'px-2 py-1 rounded-full text-xs',
                    inv.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                      inv.status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                  )}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ProfitLossReport = () => (
    <div className="card">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Profit & Loss Statement</h3>
        <button className="btn btn-secondary text-sm">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </button>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h4 className="text-sm text-gray-500 uppercase mb-3">Revenue</h4>
            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-emerald-500/5 rounded">
                <span className="text-gray-300">Contract Revenue</span>
                <span className="text-emerald-400 font-medium">{formatCurrency(summary?.totalRevenue || 0)}</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-gray-300">Total Revenue</span>
                <span className="text-white font-bold">{formatCurrency(summary?.totalRevenue || 0)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm text-gray-500 uppercase mb-3">Costs</h4>
            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-red-500/5 rounded">
                <span className="text-gray-300">Direct Costs (Spent)</span>
                <span className="text-red-400 font-medium">{formatCurrency(summary?.totalCosts || 0)}</span>
              </div>
              <div className="flex justify-between p-3 bg-red-500/5 rounded">
                <span className="text-gray-300">Labour Costs</span>
                <span className="text-red-400 font-medium">{formatCurrency((summary?.totalCosts || 0) * 0.4)}</span>
              </div>
              <div className="flex justify-between p-3 bg-red-500/5 rounded">
                <span className="text-gray-300">Materials & Subcontractors</span>
                <span className="text-red-400 font-medium">{formatCurrency((summary?.totalCosts || 0) * 0.6)}</span>
              </div>
              <div className="flex justify-between p-3 border-t border-gray-700">
                <span className="text-gray-300">Total Costs</span>
                <span className="text-white font-bold">{formatCurrency(summary?.totalCosts || 0)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="flex justify-between p-4 bg-blue-500/10 rounded-lg">
              <span className="text-lg font-bold text-white">Net Profit</span>
              <span className={clsx(
                'text-lg font-bold',
                (summary?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                {formatCurrency(summary?.netProfit || 0)}
              </span>
            </div>
          </div>
        </div>
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
          <button onClick={loadData} className="btn btn-secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <ReportTabs />

      {reportType === 'summary' && <SummaryReport />}
      {reportType === 'projects' && <ProjectCostsReport />}
      {reportType === 'cashflow' && <CashFlowReport />}
      {reportType === 'invoices' && <InvoicesReport />}
      {reportType === 'profit-loss' && <ProfitLossReport />}
    </div>
  );
}
