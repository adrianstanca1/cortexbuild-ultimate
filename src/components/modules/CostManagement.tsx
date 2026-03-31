import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Plus,
  FileText,
  Calculator,
  PieChart,
  Target
} from 'lucide-react';

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

const CostManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'budget' | 'forecast' | 'variance'>('budget');

  const [budgetItems] = useState<BudgetItem[]>([
    {
      id: '1',
      category: 'Labour',
      description: 'Site workforce & subcontractors',
      budgeted: 1250000,
      spent: 875000,
      committed: 125000,
      remaining: 250000,
      variance: -125000,
      variancePercent: -10.0,
      status: 'at-risk'
    },
    {
      id: '2',
      category: 'Materials',
      description: 'Concrete, steel, finishes',
      budgeted: 850000,
      spent: 620000,
      committed: 85000,
      remaining: 145000,
      variance: 145000,
      variancePercent: 17.1,
      status: 'on-track'
    },
    {
      id: '3',
      category: 'Plant & Equipment',
      description: 'Crane hire, excavators, tools',
      budgeted: 320000,
      spent: 285000,
      committed: 45000,
      remaining: -10000,
      variance: -10000,
      variancePercent: -3.1,
      status: 'over-budget'
    },
    {
      id: '4',
      category: 'Professional Services',
      description: 'Architects, engineers, consultants',
      budgeted: 180000,
      spent: 145000,
      committed: 20000,
      remaining: 15000,
      variance: 15000,
      variancePercent: 8.3,
      status: 'on-track'
    }
  ]);

  const [forecast] = useState<CostForecast[]>([
    { month: 'Jan', projected: 450000, actual: 465000, cumulative: 465000 },
    { month: 'Feb', projected: 380000, actual: 395000, cumulative: 860000 },
    { month: 'Mar', projected: 520000, actual: 485000, cumulative: 1345000 },
    { month: 'Apr', projected: 425000, cumulative: 1770000 },
    { month: 'May', projected: 380000, cumulative: 2150000 },
    { month: 'Jun', projected: 450000, cumulative: 2600000 }
  ]);

  const totalBudget = budgetItems.reduce((sum, item) => sum + item.budgeted, 0);
  const totalSpent = budgetItems.reduce((sum, item) => sum + item.spent, 0);
  const totalCommitted = budgetItems.reduce((sum, item) => sum + item.committed, 0);
  const totalVariance = budgetItems.reduce((sum, item) => sum + item.variance, 0);

  const formatCurrency = (amount: number): string => {
    return `£${Math.abs(amount).toLocaleString()}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'on-track': return 'bg-green-100 text-green-800';
      case 'at-risk': return 'bg-yellow-100 text-yellow-800';
      case 'over-budget': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (variance < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4" />;
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-green-600" />
            Cost Management
          </h1>
          <p className="text-gray-600 mt-1">Budget tracking, forecasting & variance analysis</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Plus className="h-4 w-4" />
            Add Budget Item
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <FileText className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Spent to Date</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
                <p className="text-sm text-gray-500">{((totalSpent / totalBudget) * 100).toFixed(1)}% of budget</p>
              </div>
              <Calculator className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Committed</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCommitted)}</p>
                <p className="text-sm text-gray-500">Pending commitments</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Variance</p>
                <p className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalVariance >= 0 ? '+' : '-'}{formatCurrency(totalVariance)}
                </p>
                <p className="text-sm text-gray-500">{((totalVariance / totalBudget) * 100).toFixed(1)}% variance</p>
              </div>
              {getVarianceIcon(totalVariance)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="card-header">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {['budget', 'forecast', 'variance'].map((tab) => (
              <button
                key={tab}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab(tab as any)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Analysis
              </button>
            ))}
          </div>
        </div>

        <div className="card-content">
          {activeTab === 'budget' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Budgeted</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Spent</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Committed</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Remaining</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Variance</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetItems.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{item.category}</div>
                            <div className="text-sm text-gray-600">{item.description}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-medium">{formatCurrency(item.budgeted)}</td>
                        <td className="py-4 px-4 text-right">{formatCurrency(item.spent)}</td>
                        <td className="py-4 px-4 text-right">{formatCurrency(item.committed)}</td>
                        <td className={`py-4 px-4 text-right font-medium ${item.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(item.remaining)}
                        </td>
                        <td className={`py-4 px-4 text-right font-medium ${item.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {item.variance >= 0 ? '+' : '-'}{formatCurrency(item.variance)}
                          <div className="text-xs text-gray-500">
                            ({item.variancePercent >= 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%)
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status.replace('-', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'forecast' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Monthly Spend Forecast</h3>
                  <div className="space-y-3">
                    {forecast.map((item) => (
                      <div key={item.month} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{item.month} 2026</span>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(item.projected)}</div>
                          {item.actual && (
                            <div className={`text-sm ${item.actual > item.projected ? 'text-red-600' : 'text-green-600'}`}>
                              Actual: {formatCurrency(item.actual)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Cumulative Projection</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{formatCurrency(2600000)}</div>
                      <div className="text-sm text-gray-600">Project Completion Forecast</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Budget at Completion:</span>
                      <span>{formatCurrency(totalBudget)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Estimated at Completion:</span>
                      <span>{formatCurrency(2600000)}</span>
                    </div>
                    <div className={`flex justify-between text-sm font-medium ${2600000 > totalBudget ? 'text-red-600' : 'text-green-600'}`}>
                      <span>Projected Variance:</span>
                      <span>{2600000 > totalBudget ? '-' : '+'}{formatCurrency(Math.abs(2600000 - totalBudget))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'variance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Variance Analysis</h3>
                  <div className="space-y-3">
                    {budgetItems
                      .filter(item => Math.abs(item.variancePercent) > 5)
                      .sort((a, b) => Math.abs(b.variancePercent) - Math.abs(a.variancePercent))
                      .map((item) => (
                        <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{item.category}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">{item.description}</div>
                          <div className={`text-lg font-bold ${item.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {item.variance >= 0 ? '+' : '-'}{formatCurrency(item.variance)}
                            <span className="text-sm ml-1">
                              ({item.variancePercent >= 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Key Performance Indicators</h3>
                  <div className="space-y-3">
                    <div className="card">
                      <div className="card-content">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Budget Performance Index</span>
                          <span className="text-lg font-bold text-green-600">1.05</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Ahead of budget</div>
                      </div>
                    </div>
                    
                    <div className="card">
                      <div className="card-content">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Cost Performance Index</span>
                          <span className="text-lg font-bold text-yellow-600">0.95</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Slightly over spending rate</div>
                      </div>
                    </div>
                    
                    <div className="card">
                      <div className="card-content">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Earned Value</span>
                          <span className="text-lg font-bold text-blue-600">{formatCurrency(1420000)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Work completed value</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CostManagement;