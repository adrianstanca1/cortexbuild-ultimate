// Module: PredictiveAnalytics — CortexBuild Ultimate Enhanced
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, Activity, AlertTriangle,
  BarChart3, LineChart as LineChartIcon, PieChart,
  Target, ArrowUpRight, ArrowDownRight, Eye,
  Shield, PoundSterling, Clock, Calendar, RefreshCw,
  Zap, Award, Brain, Wind, Cloud, Gauge,
  CheckSquare, Square, Trash2,
} from 'lucide-react';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart,
} from 'recharts';

type AnyRow = Record<string, unknown>;
type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

interface MLModel {
  name: string;
  lastTrained: string;
  accuracy: number;
  trainingData: number;
  confidence: number;
}

const fmtCurrency = (n: number) => {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}K`;
  return `£${n.toFixed(0)}`;
};

const getRiskColor = (level: RiskLevel): string => {
  return level === 'critical' ? '#ef4444' : level === 'high' ? '#f97316' : level === 'medium' ? '#f59e0b' : '#10b981';
};

export function PredictiveAnalytics() {
  const [activeTab, setActiveTab] = useState<'risk' | 'cost' | 'schedule' | 'weather' | 'models'>('risk');

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

  const deleteMutation = { mutateAsync: async () => {} };

  const tabs = [
    { id: 'risk', label: 'Risk Forecast', icon: AlertTriangle },
    { id: 'cost', label: 'Cost Prediction', icon: PoundSterling },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'weather', label: 'Weather Impact', icon: Cloud },
    { id: 'models', label: 'ML Models', icon: Brain },
  ];

  // Mock project risk data
  const projectRisks = [
    { name: 'Riverside Tower', riskScore: 35, factors: ['Cost tracking well', 'Schedule on track', 'Low safety risk'], trend: -2 },
    { name: 'Tech Hub Phase 2', riskScore: 68, factors: ['12 days behind schedule', 'Budget variance +8%', 'Resource constraints'], trend: 5 },
    { name: 'Retail Centre Fit-out', riskScore: 42, factors: ['Quality issues +15%', 'Schedule risk amber', 'Budget on track'], trend: 3 },
  ];

  // Risk forecast radar data
  const riskDimensions = [
    { dimension: 'Cost', portfolio: 35 },
    { dimension: 'Schedule', portfolio: 42 },
    { dimension: 'Safety', portfolio: 18 },
    { dimension: 'Quality', portfolio: 28 },
    { dimension: 'Resource', portfolio: 32 },
  ];

  // Cost prediction data
  const costData = [
    { month: 'Jan', actual: 1200000, predicted: 1200000, lowerBound: 1180000, upperBound: 1220000 },
    { month: 'Feb', actual: 1320000, predicted: 1315000, lowerBound: 1290000, upperBound: 1350000 },
    { month: 'Mar', actual: 1280000, predicted: 1290000, lowerBound: 1250000, upperBound: 1330000 },
    { month: 'Apr', actual: 1450000, predicted: 1480000, lowerBound: 1420000, upperBound: 1550000 },
    { month: 'May', actual: 1390000, predicted: 1420000, lowerBound: 1360000, upperBound: 1490000 },
    { month: 'Jun', actual: 1560000, predicted: 1580000, lowerBound: 1500000, upperBound: 1670000 },
  ];

  // Schedule S-curve
  const scheduleData = [
    { week: 'W1', planned: 2, actual: 1.5, predicted: 1.8 },
    { week: 'W4', planned: 8, actual: 6.2, predicted: 7.0 },
    { week: 'W8', planned: 18, actual: 14.5, predicted: 16.0 },
    { week: 'W12', planned: 32, actual: 28.0, predicted: 30.0 },
    { week: 'W16', planned: 50, actual: 42.0, predicted: 45.0 },
    { week: 'W20', planned: 72, actual: 58.0, predicted: 65.0 },
  ];

  // Weather forecast
  const weatherForecast = [
    { day: 'Mon', temp: 14, risk: 'Low', activity: 'Concreting OK', alternative: 'None needed' },
    { day: 'Tue', temp: 12, risk: 'Medium', activity: 'Roof work risky', alternative: 'Interior work' },
    { day: 'Wed', temp: 10, risk: 'High', activity: 'All exterior suspended', alternative: 'M&E / fit-out' },
    { day: 'Thu', temp: 13, risk: 'Medium', activity: 'Partial exterior', alternative: 'Phased approach' },
    { day: 'Fri', temp: 15, risk: 'Low', activity: 'Full programme', alternative: 'On schedule' },
  ];

  // ML Models
  const mlModels: MLModel[] = [
    { name: 'Cost Overrun Predictor', lastTrained: '2024-03-15', accuracy: 87, trainingData: 2847, confidence: 92 },
    { name: 'Delay Risk Classifier', lastTrained: '2024-03-12', accuracy: 84, trainingData: 1654, confidence: 88 },
    { name: 'Safety Incident Predictor', lastTrained: '2024-03-18', accuracy: 91, trainingData: 3421, confidence: 95 },
    { name: 'Payment Default Risk', lastTrained: '2024-03-10', accuracy: 79, trainingData: 1247, confidence: 82 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white font-display">Predictive Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">AI-powered forecasting for projects and risk</p>
        </div>
        <button className="btn btn-secondary">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-gray-800 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={String(tab.id)}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? 'text-orange-500 border-orange-500'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {String(tab.label)}
            </button>
          );
        })}
      </div>

      {/* Risk Forecast Tab */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {projectRisks.map((proj) => (
                <div key={String(proj.name)} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-white">{String(proj.name)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden max-w-xs">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${proj.riskScore}%`,
                              backgroundColor: getRiskColor(
                                proj.riskScore >= 60 ? 'critical' : proj.riskScore >= 40 ? 'high' : proj.riskScore >= 20 ? 'medium' : 'low'
                              ),
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold text-white ml-2">{proj.riskScore}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-xs font-bold px-2 py-1 rounded"
                        style={{
                          backgroundColor: `${getRiskColor(proj.riskScore >= 60 ? 'critical' : proj.riskScore >= 40 ? 'high' : proj.riskScore >= 20 ? 'medium' : 'low')}20`,
                          color: getRiskColor(proj.riskScore >= 60 ? 'critical' : proj.riskScore >= 40 ? 'high' : proj.riskScore >= 20 ? 'medium' : 'low'),
                        }}
                      >
                        {proj.riskScore >= 60 ? 'Critical' : proj.riskScore >= 40 ? 'High' : proj.riskScore >= 20 ? 'Medium' : 'Low'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{proj.trend > 0 ? '+' : ''}{proj.trend}% vs last week</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {proj.factors.map((factor, idx) => (
                      <p key={idx} className="text-xs text-gray-400">
                        • {String(factor)}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="card p-5">
              <h3 className="text-lg font-bold text-white mb-4">Risk Dimensions</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={riskDimensions}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="dimension" stroke="#9ca3af" fontSize={11} />
                    <PolarRadiusAxis stroke="#9ca3af" />
                    <Radar name="Portfolio Risk" dataKey="portfolio" stroke="#f97316" fill="#f97316" fillOpacity={0.6} />
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cost Prediction Tab */}
      {activeTab === 'cost' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Current Budget', value: fmtCurrency(9000000) },
              { label: 'Predicted Final Cost', value: fmtCurrency(9180000), change: '+2%' },
              { label: 'Confidence Interval', value: '±3.2%' },
            ].map((item) => (
              <div key={String(item.label)} className="card p-4">
                <p className="text-xs text-gray-400 uppercase mb-2">{String(item.label)}</p>
                <p className="text-2xl font-bold text-white">{String(item.value)}</p>
                {Boolean(item.change) && <p className="text-xs text-red-400 mt-1">{String(item.change)}</p>}
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Cost Forecast with Confidence Interval</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                  <Legend />
                  <Area type="monotone" dataKey="upperBound" stroke="none" fill="#3b82f620" name="Upper Bound" />
                  <Area type="monotone" dataKey="lowerBound" stroke="none" fill="#3b82f620" name="Lower Bound" />
                  <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="Actual" />
                  <Line type="monotone" dataKey="predicted" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" name="Predicted" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Scenario Analysis</h3>
            <div className="space-y-3">
              {[
                { label: 'Optimistic (+5% productivity)', finalCost: fmtCurrency(8800000), confidence: '78%' },
                { label: 'Base Case (current trend)', finalCost: fmtCurrency(9180000), confidence: '92%' },
                { label: 'Pessimistic (-10% productivity)', finalCost: fmtCurrency(9650000), confidence: '85%' },
              ].map((scenario) => (
                <div key={String(scenario.label)} className="p-4 bg-gray-800/50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white">{String(scenario.label)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{String(scenario.finalCost)}</p>
                    <p className="text-xs text-gray-500">Confidence: {String(scenario.confidence)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Programme S-Curve: Planned vs Actual vs Predicted</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scheduleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="week" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                  <Legend />
                  <Line type="monotone" dataKey="planned" stroke="#9ca3af" strokeDasharray="5 5" name="Planned" />
                  <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="Actual" />
                  <Line type="monotone" dataKey="predicted" stroke="#f97316" strokeWidth={2} strokeDasharray="3 3" name="Predicted" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="text-lg font-bold text-white mb-4">Delay Probability by Project</h3>
              <div className="space-y-3">
                {projectRisks.map((proj) => {
                  const delayPct = proj.riskScore > 60 ? 42 : proj.riskScore > 40 ? 18 : 5;
                  return (
                    <div key={String(proj.name)} className="p-3 bg-gray-800/50 rounded">
                      <div className="flex justify-between mb-2">
                        <p className="text-sm font-medium text-white">{String(proj.name)}</p>
                        <span className="text-sm font-bold text-white">{delayPct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500" style={{ width: `${delayPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-lg font-bold text-white mb-4">Critical Path Items at Risk</h3>
              <div className="space-y-2 text-sm">
                {[
                  { item: 'Riverside: Concrete curing', float: '3 days', risk: 'Low' },
                  { item: 'Tech Hub: M&E rough-in', float: '0 days', risk: 'High' },
                  { item: 'Retail: FF&E installation', float: '2 days', risk: 'Low' },
                ].map((cp, idx) => (
                  <div key={idx} className="p-3 bg-gray-800/50 rounded">
                    <p className="font-medium text-white mb-1">{String(cp.item)}</p>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Float: {String(cp.float)}</span>
                      <span className={`font-bold ${cp.risk === 'High' ? 'text-red-400' : 'text-emerald-400'}`}>{String(cp.risk)} Risk</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weather Impact Tab */}
      {activeTab === 'weather' && (
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-lg font-bold text-white mb-4">7-Day Weather Forecast & Activity Impact</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left p-3 text-gray-400 font-medium">Day</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Temp</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Risk Level</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Impact on Activities</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Alternative</th>
                  </tr>
                </thead>
                <tbody>
                  {weatherForecast.map((day) => (
                    <tr key={String(day.day)} className="border-b border-gray-800/50">
                      <td className="p-3 font-medium text-white">{String(day.day)}</td>
                      <td className="p-3 text-gray-300">{Number(day.temp)}°C</td>
                      <td className="p-3">
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: day.risk === 'High' ? '#ef444420' : day.risk === 'Medium' ? '#f59e0b20' : '#10b98120',
                            color: day.risk === 'High' ? '#ef4444' : day.risk === 'Medium' ? '#f59e0b' : '#10b981',
                          }}
                        >
                          {String(day.risk)}
                        </span>
                      </td>
                      <td className="p-3 text-gray-300 text-xs">{String(day.activity)}</td>
                      <td className="p-3 text-gray-300 text-xs">{String(day.alternative)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Activity Risk Calendar</h3>
            <div className="grid grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const riskLevel = ['Low', 'Medium', 'High', 'Medium', 'Low', 'Low', 'Low'][idx];
                return (
                  <div
                    key={day}
                    className="p-4 rounded-lg text-center"
                    style={{
                      backgroundColor: riskLevel === 'High' ? '#ef444420' : riskLevel === 'Medium' ? '#f59e0b20' : '#10b98120',
                      border: `1px solid ${riskLevel === 'High' ? '#ef4444' : riskLevel === 'Medium' ? '#f59e0b' : '#10b981'}40`,
                    }}
                  >
                    <p className="text-sm font-bold text-white">{day}</p>
                    <p
                      className="text-xs font-medium mt-1"
                      style={{ color: riskLevel === 'High' ? '#ef4444' : riskLevel === 'Medium' ? '#f59e0b' : '#10b981' }}
                    >
                      {riskLevel}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ML Models Tab */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mlModels.map((model) => {
              const isSelected = selectedIds.has(String(model.name));
              return (
              <div key={String(model.name)} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={e => { e.stopPropagation(); toggle(String(model.name)); }}>
                      {isSelected ? <CheckSquare size={18} className="text-blue-400"/> : <Square size={18} className="text-gray-500"/>}
                    </button>
                    <div>
                      <p className="font-bold text-white">{String(model.name)}</p>
                      <p className="text-xs text-gray-500 mt-1">Last trained: {String(model.lastTrained)}</p>
                    </div>
                  </div>
                  <button type="button" className="btn btn-secondary text-xs px-2 py-1">
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-300">Accuracy</span>
                      <span className="text-sm font-bold text-white">{Number(model.accuracy)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${model.accuracy}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-300">Confidence</span>
                      <span className="text-sm font-bold text-white">{Number(model.confidence)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${model.confidence}%` }} />
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">Training data: {String(model.trainingData).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} records</p>
                </div>
              </div>
              );
            })}
          </div>

          <BulkActionsBar
            selectedIds={Array.from(selectedIds)}
            actions={[
              { id: 'delete', label: 'Delete Selected', icon: Trash2, variant: 'danger', onClick: handleBulkDelete, confirm: 'This action cannot be undone.' },
            ]}
            onClearSelection={clearSelection}
          />

          <div className="card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Model Performance: Precision vs Recall</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mlModels.map((m) => ({ name: m.name.split(' ')[0], precision: m.accuracy, recall: m.confidence }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                  <Legend />
                  <Bar dataKey="precision" fill="#3b82f6" name="Precision" />
                  <Bar dataKey="recall" fill="#10b981" name="Recall" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
