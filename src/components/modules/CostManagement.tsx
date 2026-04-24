// Module: Cost Management — CortexBuild Ultimate
import React, { useState, useEffect } from 'react';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import {
  TrendingUp, TrendingDown, DollarSign, Plus, FileText, Calculator, Target,
  BarChart3, PieChart as PieChartIcon, Activity, Loader2, BrainCircuit, AlertTriangle
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Cell, PieChart
} from 'recharts';
import { toast } from 'sonner';
import { costManagementApi, predictiveApi } from '../../services/api';

interface BudgetItem {
  id: string;
  category: string;
  description: string;
  budgeted: number;
  spent: number;
  committed: number;
  remaining: number;
  variance: number;
  variancePercent: number;
  status: 'on-track' | 'at-risk' | 'over-budget';
}

interface CostForecast {
  month: string;
  projected: number;
  actual?: number;
  cumulative: number;
}

const CHART_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

export function CostManagement() {
  const [activeTab, setActiveTab] = useState<'budget' | 'forecast' | 'variance'>('budget');
  const [showAddItem, setShowAddItem] = useState(false);
  const [loading, setLoading] = useState(true);

  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [forecast, setForecast] = useState<CostForecast[]>([]);
  const [predictiveData, setPredictiveData] = useState<Record<string, unknown> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Add item form state
  const [newItem, setNewItem] = useState({ category: '', description: '', budgeted: '', committed: '' });

  // Load data from API
  useEffect(() => {
    loadCostData();
  }, []);

  async function handleAddItem() {
    if (!newItem.category || !newItem.budgeted) {
      toast.error('Category and budgeted amount are required');
      return;
    }
    try {
      await costManagementApi.createBudget({
        cost_code_name: newItem.category,
        description: newItem.description,
        budgeted: parseFloat(newItem.budgeted) || 0,
        committed: parseFloat(newItem.committed) || 0,
      });
      toast.success('Budget item added');
      setShowAddItem(false);
      setNewItem({ category: '', description: '', budgeted: '', committed: '' });
      loadCostData();
    } catch {
      toast.error('Failed to add budget item');
    }
  }

  async function loadCostData() {
    try {
      setLoading(true);
      const [budgetData, forecastData] = await Promise.all([
        costManagementApi.getBudget(),
        costManagementApi.getForecast()
      ]);

      // Transform budget data
      const transformedBudget = budgetData.map((item: Record<string, unknown>) => ({
        id: String(item.id ?? ''),
        category: String(item.cost_code_name ?? item.name ?? ''),
        description: String(item.description ?? ''),
        budgeted: parseFloat(String(item.budgeted ?? 0)) || 0,
        spent: parseFloat(String(item.spent ?? 0)) || 0,
        committed: parseFloat(String(item.committed ?? 0)) || 0,
        remaining: parseFloat(String(item.remaining ?? 0)) || 0,
        variance: parseFloat(String(item.variance ?? 0)) || 0,
        variancePercent: parseFloat(String(item.variance_percent ?? 0)) || 0,
        status: String(item.status ?? 'on-track') as BudgetItem['status'],
      }));

      // Transform forecast data
      const transformedForecast = forecastData.map((f: Record<string, unknown>) => ({
        month: new Date(String(f.period_start ?? '')).toLocaleString('default', { month: 'short' }),
        projected: parseFloat(String(f.projected_cost ?? 0)) || 0,
        actual:
          f.actual_cost !== undefined && f.actual_cost !== null
            ? parseFloat(String(f.actual_cost))
            : undefined,
        cumulative: parseFloat(String(f.cumulative_cost ?? 0)) || 0,
      }));

      setBudgetItems(transformedBudget);
      setForecast(transformedForecast);
    } catch (err) {
      console.error('Failed to load cost data', err);
      toast.error('Failed to load cost data');
    } finally {
      setLoading(false);
    }
  }

  async function runPredictiveAnalysis() {
    // Use first project from budget items as reference if no specific project is selected
    const projectId = budgetItems[0]?.id || 'default';
    try {
      setIsAnalyzing(true);
      const result = await predictiveApi.getForecast(projectId);
      setPredictiveData(result);
      toast.success('AI Analysis complete');
    } catch (err) {
      console.error('Predictive analysis failed', err);
      toast.error('AI Analysis failed to generate forecast');
    } finally {
      setIsAnalyzing(false);
    }
  }

  const totalBudget = budgetItems.reduce((sum, item) => sum + item.budgeted, 0);
  const totalSpent = budgetItems.reduce((sum, item) => sum + item.spent, 0);
  const totalCommitted = budgetItems.reduce((sum, item) => sum + item.committed, 0);
  const totalVariance = budgetItems.reduce((sum, item) => sum + item.variance, 0);

  const fmt = (n: number) => `£${Math.abs(n).toLocaleString()}`;

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'on-track': return 'bg-emerald-900/30 text-emerald-400 border-emerald-700/50';
      case 'at-risk': return 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50';
      case 'over-budget': return 'bg-red-900/30 text-red-400 border-red-700/50';
      default: return 'bg-gray-700/50 text-gray-400 border-gray-600/50';
    }
  };

  const budgetVarianceData = budgetItems.map(item => ({
    name: item.category.substring(0, 8),
    budgeted: item.budgeted / 1000,
    spent: item.spent / 1000,
    variance: item.variance / 1000,
  }));

  const categoryDistribution = budgetItems.map(item => ({
    name: item.category,
    value: item.budgeted,
    color: CHART_COLORS[budgetItems.indexOf(item) % CHART_COLORS.length],
  }));

  return (
    <div className="space-y-6 bg-gray-900 min-h-screen p-6">
      <ModuleBreadcrumbs currentModule="cost-management" />
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <span className="ml-3 text-gray-400">Loading cost data...</span>
        </div>
      ) : (
        <>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display text-white flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-emerald-400" />
            Cost Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">Budget tracking, forecasting & variance analysis</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAddItem(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-lg transition-colors">
            <Plus className="h-4 w-4" />
            Add Budget Item
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
            <FileText className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Budget', value: fmt(totalBudget), icon: Target, color: 'text-blue-400', bg: 'bg-blue-900/30' },
          { label: 'Spent to Date', value: fmt(totalSpent), sub: `${((totalSpent / totalBudget) * 100).toFixed(1)}% of budget`, icon: Calculator, color: 'text-orange-400', bg: 'bg-orange-900/30' },
          { label: 'Committed', value: fmt(totalCommitted), sub: 'Pending commitments', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-900/30' },
          { label: 'Variance', value: `${totalVariance >= 0 ? '+' : '-'}${fmt(totalVariance)}`, sub: `${((totalVariance / totalBudget) * 100).toFixed(1)}% variance`, icon: totalVariance >= 0 ? TrendingUp : TrendingDown, color: totalVariance >= 0 ? 'text-green-400' : 'text-red-400', bg: totalVariance >= 0 ? 'bg-green-900/30' : 'bg-red-900/30' },
        ].map((item) => (
          <div key={item.label} className="card bg-base-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-gray-400 text-sm">{item.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{item.value}</p>
                {item.sub && <p className="text-xs text-gray-500 mt-1">{item.sub}</p>}
              </div>
              <div className={`p-2 rounded-lg ${item.bg}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-700 pb-2">
        {['budget', 'forecast', 'variance'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} Analysis
          </button>
        ))}
      </div>

      {/* Budget Tab */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget Table */}
            <div className="card bg-base-200 overflow-hidden lg:col-span-2">
              <div className="cb-table-scroll touch-pan-x">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 border-b border-gray-700">
                    <tr>
                      {['Category', 'Budgeted', 'Spent', 'Committed', 'Remaining', 'Variance', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-display tracking-widest text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {budgetItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-900/40 transition-colors">
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-medium text-white">{item.category}</div>
                            <div className="text-sm text-gray-500">{item.description}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-white">{fmt(item.budgeted)}</td>
                        <td className="px-4 py-4 text-right text-gray-300">{fmt(item.spent)}</td>
                        <td className="px-4 py-4 text-right text-gray-300">{fmt(item.committed)}</td>
                        <td className={`px-4 py-4 text-right font-medium ${item.remaining < 0 ? 'text-red-400' : 'text-green-400'}`}>{fmt(item.remaining)}</td>
                        <td className={`px-4 py-4 text-right font-medium ${item.variance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {item.variance >= 0 ? '+' : '-'}{fmt(item.variance)}
                          <div className="text-xs text-gray-500">({item.variancePercent >= 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%)</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                            {item.status.replace('-', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Budget vs Actual Chart */}
            <div className="card bg-base-200 p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Budget vs Spent by Category
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetVarianceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `£${v}K`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }} formatter={(v) => `£${((v as number) * 1000).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="budgeted" name="Budgeted (£K)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" name="Spent (£K)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution */}
            <div className="card bg-base-200 p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4" />
                Budget Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} formatter={(v) => fmt(v as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Forecast Tab */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Forecast Chart */}
            <div className="lg:col-span-2 card bg-base-200 p-6">
              <h3 className="text-white font-semibold mb-4">Monthly Spend Forecast</h3>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={forecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={(v) => `£${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} formatter={(v) => fmt(v as number)} />
                  <Legend />
                  <Area type="monotone" dataKey="projected" name="Projected" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="actual" name="Actual" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Cumulative Stats */}
            <div className="card bg-base-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">Cumulative Projection</h3>
                <button
                  onClick={runPredictiveAnalysis}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />}
                  {isAnalyzing ? 'Analyzing...' : 'AI Insight'}
                </button>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 text-center mb-6 border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">Project Completion Forecast</p>
                <p className="text-4xl font-bold text-white">{fmt(2600000)}</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                  <span className="text-gray-400">Budget at Completion</span>
                  <span className="text-white font-bold">{fmt(totalBudget)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                  <span className="text-gray-400">Estimated at Completion</span>
                  <span className="text-white font-bold">{fmt(2600000)}</span>
                </div>
                <div className={`flex justify-between items-center p-3 rounded-lg ${2600000 > totalBudget ? 'bg-red-900/20' : 'bg-green-900/20'}`}>
                  <span className="text-gray-400">Projected Variance</span>
                  <span className={`font-bold ${2600000 > totalBudget ? 'text-red-400' : 'text-green-400'}`}>
                    {2600000 > totalBudget ? '-' : '+'}{fmt(Math.abs(2600000 - totalBudget))}
                  </span>
                </div>
              </div>
            </div>

            {predictiveData && (
              <div className="card bg-base-200 p-6 border-l-4 border-emerald-500 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-4 text-emerald-400">
                  <BrainCircuit className="w-5 h-5" />
                  <h3 className="text-white font-semibold">AI Predictive Analysis</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Risk Level</p>
                    <div className={`flex items-center gap-2 font-bold ${
                      (predictiveData as Record<string, unknown>).riskLevel === 'HIGH' ? 'text-red-400' :
                      (predictiveData as Record<string, unknown>).riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-emerald-400'
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                      {String((predictiveData as Record<string, unknown>).riskLevel)}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Predicted Final Cost</p>
                    <p className="text-lg font-bold text-white">{fmt((predictiveData as Record<string, unknown>).predictedFinalCost as number)}</p>
                  </div>
                  <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Confidence</p>
                    <p className="text-lg font-bold text-white">{String((predictiveData as Record<string, unknown>).confidenceScore)}%</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Analysis</p>
                    <p className="text-sm text-gray-300 leading-relaxed italic">"{String((predictiveData as Record<string, unknown>).analysis)}"</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Recommendations</p>
                    <ul className="space-y-2">
                      {((predictiveData as Record<string, unknown>).recommendations as string[]).map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* KPI Cards */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Key Performance Indicators</h3>
              {[
                { label: 'Budget Performance Index', value: '1.05', sub: 'Ahead of budget', color: 'text-green-400' },
                { label: 'Cost Performance Index', value: '0.95', sub: 'Slightly over spending rate', color: 'text-yellow-400' },
                { label: 'Earned Value', value: fmt(1420000), sub: 'Work completed value', color: 'text-blue-400' },
              ].map((kpi) => (
                <div key={kpi.label} className="card bg-base-200 p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">{kpi.label}</span>
                    <span className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{kpi.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Variance Tab */}
      {activeTab === 'variance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Variance Analysis */}
            <div className="card bg-base-200 p-6">
              <h3 className="text-white font-semibold mb-4">Variance Analysis</h3>
              <div className="space-y-3">
                {budgetItems
                  .filter(item => Math.abs(item.variancePercent) > 5)
                  .sort((a, b) => Math.abs(b.variancePercent) - Math.abs(a.variancePercent))
                  .map((item) => (
                    <div key={item.id} className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-white">{item.category}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(item.status)}`}>
                          {item.status.replace('-', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{item.description}</p>
                      <div className={`text-lg font-bold ${item.variance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {item.variance >= 0 ? '+' : '-'}{fmt(item.variance)}
                        <span className="text-sm ml-1 text-gray-400">
                          ({item.variancePercent >= 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Variance Trend Chart */}
            <div className="card bg-base-200 p-6">
              <h3 className="text-white font-semibold mb-4">Variance Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetVarianceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `£${v}K`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} formatter={(v) => `£${((v as number) * 1000).toLocaleString()}`} />
                  <Bar dataKey="variance" name="Variance (£K)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">Add Budget Item</h2>
              <button onClick={() => setShowAddItem(false)} className="text-gray-400 hover:text-white"><FileText className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
                <input value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))} placeholder="e.g., Materials" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                <textarea value={newItem.description} onChange={e => setNewItem(n => ({ ...n, description: e.target.value }))} placeholder="Item description" rows={2} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Budgeted (£)</label>
                  <input type="number" value={newItem.budgeted} onChange={e => setNewItem(n => ({ ...n, budgeted: e.target.value }))} placeholder="0.00" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Committed (£)</label>
                  <input type="number" value={newItem.committed} onChange={e => setNewItem(n => ({ ...n, committed: e.target.value }))} placeholder="0.00" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-700">
              <button onClick={handleAddItem} className="flex-1 btn btn-primary rounded-lg py-2 text-sm font-semibold">
                Add Item
              </button>
              <button onClick={() => setShowAddItem(false)} className="flex-1 btn btn-ghost rounded-lg py-2 text-sm font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
    )}
    </div>
  );
}

export default React.memo(CostManagement);