import { useState } from 'react';
import {
  TrendingUp, AlertTriangle, PoundSterling, Calendar, Wind, Brain,
  RefreshCw, Gauge, Activity, Zap, Cloud, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, Radar,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Cell,
} from 'recharts';

type TabType = 'risk' | 'cost' | 'schedule' | 'resource' | 'weather' | 'models';
type AnyRow = Record<string, unknown>;

interface MLModel {
  name: string;
  lastTrained: string;
  accuracy: number;
  trainingData: number;
  confidence: number;
  dataSources: string[];
}

interface RiskItem {
  id: string;
  name: string;
  category: 'Financial' | 'Safety' | 'Programme' | 'Resource' | 'External';
  probability: number;
  impact: number;
  bestCase: number;
  mostLikely: number;
  worstCase: number;
  trend: number;
}

const fmtCurrency = (n: number) => {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}K`;
  return `£${n.toFixed(0)}`;
};

const getRiskColor = (level: number): string => {
  if (level >= 70) return '#ef4444';
  if (level >= 50) return '#f97316';
  if (level >= 30) return '#f59e0b';
  return '#10b981';
};

const RISK_ITEMS: RiskItem[] = [
  {
    id: 'r1',
    name: 'Supply chain delays',
    category: 'Programme',
    probability: 65,
    impact: 45,
    bestCase: 8,
    mostLikely: 18,
    worstCase: 35,
    trend: -5,
  },
  {
    id: 'r2',
    name: 'Labour shortage',
    category: 'Resource',
    probability: 52,
    impact: 62,
    bestCase: 5,
    mostLikely: 14,
    worstCase: 28,
    trend: 3,
  },
  {
    id: 'r3',
    name: 'Cost inflation',
    category: 'Financial',
    probability: 48,
    impact: 58,
    bestCase: 120000,
    mostLikely: 280000,
    worstCase: 520000,
    trend: 8,
  },
  {
    id: 'r4',
    name: 'Safety incident',
    category: 'Safety',
    probability: 18,
    impact: 85,
    bestCase: 0,
    mostLikely: 0,
    worstCase: 850000,
    trend: -2,
  },
  {
    id: 'r5',
    name: 'Weather delays',
    category: 'External',
    probability: 72,
    impact: 32,
    bestCase: 3,
    mostLikely: 9,
    worstCase: 21,
    trend: 0,
  },
];

const riskMatrix = RISK_ITEMS.map(r => ({
  name: r.name,
  probability: r.probability,
  impact: r.impact,
  category: r.category,
}));

const riskScoreTrend = [
  { month: 'Jan', score: 32 },
  { month: 'Feb', score: 35 },
  { month: 'Mar', score: 38 },
  { month: 'Apr', score: 42 },
  { month: 'May', score: 39 },
  { month: 'Jun', score: 41 },
  { month: 'Jul', score: 45 },
  { month: 'Aug', score: 48 },
  { month: 'Sep', score: 52 },
  { month: 'Oct', score: 51 },
  { month: 'Nov', score: 54 },
  { month: 'Dec', score: 58 },
];

const riskDimensions = [
  { category: 'Financial', value: 42 },
  { category: 'Safety', value: 18 },
  { category: 'Programme', value: 65 },
  { category: 'Resource', value: 55 },
  { category: 'External', value: 48 },
];

const costData = [
  { month: 'Jan', actual: 1200000, predicted: 1200000, lowerBound: 1180000, upperBound: 1220000 },
  { month: 'Feb', actual: 1320000, predicted: 1315000, lowerBound: 1290000, upperBound: 1350000 },
  { month: 'Mar', actual: 1280000, predicted: 1290000, lowerBound: 1250000, upperBound: 1330000 },
  { month: 'Apr', actual: 1450000, predicted: 1480000, lowerBound: 1420000, upperBound: 1550000 },
  { month: 'May', actual: 1390000, predicted: 1420000, lowerBound: 1360000, upperBound: 1490000 },
  { month: 'Jun', actual: 1560000, predicted: 1580000, lowerBound: 1500000, upperBound: 1670000 },
];

const scheduleData = [
  { week: 'W1', planned: 2, actual: 1.5, predicted: 1.8 },
  { week: 'W4', planned: 8, actual: 6.2, predicted: 7.0 },
  { week: 'W8', planned: 18, actual: 14.5, predicted: 16.0 },
  { week: 'W12', planned: 32, actual: 28.0, predicted: 30.0 },
  { week: 'W16', planned: 50, actual: 42.0, predicted: 45.0 },
  { week: 'W20', planned: 72, actual: 58.0, predicted: 65.0 },
];

const resourceUtilization = [
  { week: 'W1', carpentry: 78, concrete: 85, electrical: 62, plumbing: 71 },
  { week: 'W2', carpentry: 82, concrete: 88, electrical: 68, plumbing: 75 },
  { week: 'W3', carpentry: 89, concrete: 92, electrical: 79, plumbing: 84 },
  { week: 'W4', carpentry: 85, concrete: 90, electrical: 75, plumbing: 82 },
];

const skillGaps = [
  { trade: 'Carpenters', required: 12, available: 9, gap: 3 },
  { trade: 'Electricians', required: 8, available: 6, gap: 2 },
  { trade: 'Plumbers', required: 6, available: 5, gap: 1 },
  { trade: 'Labourers', required: 20, available: 18, gap: 2 },
  { trade: 'Supervisors', required: 4, available: 3, gap: 1 },
];

const weatherForecast = [
  { day: 'Mon', risk: 'Low', temp: 14, wind: 12, rain: false },
  { day: 'Tue', risk: 'Medium', temp: 12, wind: 18, rain: true },
  { day: 'Wed', risk: 'High', temp: 10, wind: 24, rain: true },
  { day: 'Thu', risk: 'Medium', temp: 13, wind: 15, rain: false },
  { day: 'Fri', risk: 'Low', temp: 15, wind: 8, rain: false },
];

const mlModels: MLModel[] = [
  {
    name: 'Cost Overrun Predictor',
    lastTrained: '2026-03-15',
    accuracy: 87,
    trainingData: 2847,
    confidence: 92,
    dataSources: ['Invoices', 'Purchase Orders', 'Labour'],
  },
  {
    name: 'Schedule Slip Detector',
    lastTrained: '2026-03-12',
    accuracy: 84,
    trainingData: 1654,
    confidence: 88,
    dataSources: ['Programme', 'Daily Reports', 'RFIs'],
  },
  {
    name: 'Safety Risk Scorer',
    lastTrained: '2026-03-18',
    accuracy: 91,
    trainingData: 3421,
    confidence: 95,
    dataSources: ['Incidents', 'RAMS', 'Inspections'],
  },
  {
    name: 'Cash Flow Forecaster',
    lastTrained: '2026-03-10',
    accuracy: 79,
    trainingData: 1247,
    confidence: 82,
    dataSources: ['Payments', 'Invoices', 'Contracts'],
  },
  {
    name: 'Tender Win Probability',
    lastTrained: '2026-03-16',
    accuracy: 76,
    trainingData: 892,
    confidence: 78,
    dataSources: ['Historical bids', 'Client data'],
  },
];

export function PredictiveAnalytics() {
  const [activeTab, setActiveTab] = useState<TabType>('risk');

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'risk', label: 'Risk Forecast', icon: AlertTriangle },
    { id: 'cost', label: 'Cost Prediction', icon: PoundSterling },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'resource', label: 'Resource', icon: Activity },
    { id: 'weather', label: 'Weather Impact', icon: Wind },
    { id: 'models', label: 'ML Models', icon: Brain },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">Predictive Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">AI-powered forecasting for risk, cost & schedule</p>
        </div>
        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-700 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? 'text-orange-500 border-orange-500'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* RISK FORECAST TAB */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {RISK_ITEMS.map((risk) => (
                <div key={risk.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-white">{risk.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{risk.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full font-bold text-white" style={{ backgroundColor: `${getRiskColor(risk.probability * risk.impact / 100)}40`, color: getRiskColor(risk.probability * risk.impact / 100) }}>
                        {Math.round((risk.probability * risk.impact) / 100)}
                      </span>
                      {risk.trend !== 0 && (
                        <span className={`flex items-center gap-0.5 text-xs font-bold ${risk.trend > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {risk.trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {Math.abs(risk.trend)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-gray-900 rounded p-2">
                      <p className="text-gray-400">Best Case</p>
                      <p className="text-emerald-400 font-bold">{typeof risk.bestCase === 'number' && risk.bestCase > 100 ? fmtCurrency(risk.bestCase) : risk.bestCase + ' days'}</p>
                    </div>
                    <div className="bg-gray-900 rounded p-2">
                      <p className="text-gray-400">Most Likely</p>
                      <p className="text-orange-400 font-bold">{typeof risk.mostLikely === 'number' && risk.mostLikely > 100 ? fmtCurrency(risk.mostLikely) : risk.mostLikely + ' days'}</p>
                    </div>
                    <div className="bg-gray-900 rounded p-2">
                      <p className="text-gray-400">Worst Case</p>
                      <p className="text-red-400 font-bold">{typeof risk.worstCase === 'number' && risk.worstCase > 100 ? fmtCurrency(risk.worstCase) : risk.worstCase + ' days'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h3 className="text-lg font-bold text-white mb-4">Risk by Category</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={riskDimensions}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="category" stroke="#9ca3af" fontSize={11} />
                    <PolarRadiusAxis stroke="#9ca3af" />
                    <Radar name="Risk Level" dataKey="value" stroke="#f97316" fill="#f97316" fillOpacity={0.6} />
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h3 className="text-lg font-bold text-white mb-4">Risk Score Trend (12 Months)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskScoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                  <Line type="monotone" dataKey="score" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* COST PREDICTION TAB */}
      {activeTab === 'cost' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Current Budget', value: fmtCurrency(9000000), trend: '—' },
              { label: 'Predicted Final Cost', value: fmtCurrency(9180000), trend: '+2.0%', trending: true },
              { label: 'Confidence Interval', value: '±3.2%', trend: '—' },
            ].map((item) => (
              <div key={String(item.label)} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase mb-2 font-bold">{String(item.label)}</p>
                <p className="text-2xl font-bold text-white">{String(item.value)}</p>
                {Boolean(item.trending) && <p className="text-xs text-red-400 mt-1">{String(item.trend)}</p>}
              </div>
            ))}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h3 className="text-lg font-bold text-white mb-4">Cost Forecast with Confidence Bands</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} formatter={(v: unknown) => fmtCurrency(Number(v))} />
                  <Legend />
                  <Area type="monotone" dataKey="upperBound" stroke="none" fill="#3b82f620" name="Upper Bound" />
                  <Area type="monotone" dataKey="lowerBound" stroke="none" fill="#3b82f620" name="Lower Bound" />
                  <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="Actual" />
                  <Line type="monotone" dataKey="predicted" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" name="Predicted" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Optimistic (+5% productivity)', finalCost: fmtCurrency(8800000), confidence: '78%' },
              { label: 'Base Case (current trend)', finalCost: fmtCurrency(9180000), confidence: '92%' },
              { label: 'Pessimistic (-10% productivity)', finalCost: fmtCurrency(9650000), confidence: '85%' },
            ].map((scenario) => (
              <div key={String(scenario.label)} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-300 mb-2">{String(scenario.label)}</p>
                <p className="text-xl font-bold text-white mb-1">{String(scenario.finalCost)}</p>
                <p className="text-xs text-gray-500">Confidence: {String(scenario.confidence)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCHEDULE TAB */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h3 className="text-lg font-bold text-white mb-4">Programme S-Curve: Planned vs Actual vs Predicted</h3>
            <div className="h-72">
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
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h3 className="text-lg font-bold text-white mb-4">Schedule Health Index</h3>
              <div className="space-y-4">
                {[
                  { project: 'Riverside Tower', health: 85, status: 'On Track' },
                  { project: 'Tech Hub Phase 2', health: 62, status: 'At Risk' },
                  { project: 'Retail Centre', health: 78, status: 'Minor Delays' },
                ].map((proj) => (
                  <div key={proj.project}>
                    <div className="flex justify-between mb-2">
                      <p className="text-sm font-medium text-white">{proj.project}</p>
                      <span className="text-sm font-bold text-white">{proj.health}%</span>
                    </div>
                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${proj.health}%`, backgroundColor: proj.health >= 80 ? '#10b981' : proj.health >= 60 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{proj.status}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h3 className="text-lg font-bold text-white mb-4">Critical Path at Risk</h3>
              <div className="space-y-2 text-sm">
                {[
                  { item: 'Riverside: Concrete curing', float: '3 days', risk: 'Low' },
                  { item: 'Tech Hub: M&E rough-in', float: '0 days', risk: 'High' },
                  { item: 'Retail: FF&E installation', float: '2 days', risk: 'Low' },
                ].map((cp, idx) => (
                  <div key={idx} className="bg-gray-900 rounded-lg p-3">
                    <p className="font-medium text-white mb-1">{cp.item}</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Float: {cp.float}</span>
                      <span className={`font-bold ${cp.risk === 'High' ? 'text-red-400' : 'text-emerald-400'}`}>{cp.risk} Risk</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESOURCE TAB */}
      {activeTab === 'resource' && (
        <div className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h3 className="text-lg font-bold text-white mb-4">Resource Utilization Heatmap</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceUtilization}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="week" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                  <Legend />
                  <Bar dataKey="carpentry" stackId="a" fill="#3b82f6" name="Carpentry" />
                  <Bar dataKey="concrete" stackId="a" fill="#10b981" name="Concrete" />
                  <Bar dataKey="electrical" stackId="a" fill="#f59e0b" name="Electrical" />
                  <Bar dataKey="plumbing" stackId="a" fill="#8b5cf6" name="Plumbing" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h3 className="text-lg font-bold text-white mb-4">Skill Gap Analysis</h3>
            <div className="space-y-3">
              {skillGaps.map((skill) => (
                <div key={skill.trade} className="bg-gray-900 rounded-lg p-3">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-medium text-white">{skill.trade}</p>
                    <p className="text-sm text-gray-400">{skill.available}/{skill.required}</p>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div className="flex-1 bg-emerald-500 rounded" style={{ width: `${(skill.available / skill.required) * 100}%` }} />
                    <div className="flex-1 bg-red-500 rounded" style={{ width: `${(skill.gap / skill.required) * 100}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Gap: {skill.gap} {skill.gap === 1 ? 'person' : 'people'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WEATHER IMPACT TAB */}
      {activeTab === 'weather' && (
        <div className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h3 className="text-lg font-bold text-white mb-4">4-Week Weather Forecast & Activity Impact</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-400 font-medium">Day</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Risk Level</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Temp (°C)</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Wind (mph)</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Rain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {weatherForecast.map((day) => (
                    <tr key={day.day} className="hover:bg-gray-900/50">
                      <td className="p-3 font-medium text-white">{day.day}</td>
                      <td className="p-3">
                        <span
                          className="px-2 py-1 rounded text-xs font-bold"
                          style={{
                            backgroundColor: day.risk === 'High' ? '#ef444420' : day.risk === 'Medium' ? '#f59e0b20' : '#10b98120',
                            color: day.risk === 'High' ? '#ef4444' : day.risk === 'Medium' ? '#f59e0b' : '#10b981',
                          }}
                        >
                          {day.risk}
                        </span>
                      </td>
                      <td className="p-3 text-gray-300">{day.temp}°C</td>
                      <td className="p-3 text-gray-300">{day.wind} mph</td>
                      <td className="p-3 text-gray-300">{day.rain ? '⚠️ Yes' : '✓ No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h3 className="text-lg font-bold text-white mb-4">Historical Weather Delays</h3>
              <div className="space-y-2">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => (
                  <div key={month} className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">{month}</span>
                    <div className="flex-1 mx-3 h-2 bg-gray-900 rounded overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: `${[12, 14, 8, 5, 3, 2][i] * 8}%` }} />
                    </div>
                    <span className="text-sm font-bold text-white w-12 text-right">{[12, 14, 8, 5, 3, 2][i]} days</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h3 className="text-lg font-bold text-white mb-4">Project Vulnerability</h3>
              <div className="space-y-3">
                {['Wind Exposure', 'Rain Sensitivity', 'Frost Risk', 'Heat Impact'].map((type) => (
                  <div key={type} className="bg-gray-900 rounded-lg p-3">
                    <p className="text-sm font-medium text-white mb-2">{type}</p>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${Math.random() * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ML MODELS TAB */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mlModels.map((model) => (
              <div key={model.name} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-white">{model.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Last trained: {model.lastTrained}</p>
                  </div>
                  <button className="p-2 hover:bg-gray-700 rounded-lg transition">
                    <RefreshCw size={16} className="text-gray-400" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-300">Accuracy</span>
                      <span className="text-sm font-bold text-white">{model.accuracy}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${model.accuracy}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-300">Confidence</span>
                      <span className="text-sm font-bold text-white">{model.confidence}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${model.confidence}%` }} />
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-2">Training Data</p>
                    <p className="text-sm font-bold text-white">{model.trainingData.toLocaleString()} records</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-2">Data Sources</p>
                    <div className="flex flex-wrap gap-1">
                      {model.dataSources.map((source) => (
                        <span key={source} className="text-xs px-2 py-1 bg-gray-900 text-gray-300 rounded">
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h3 className="text-lg font-bold text-white mb-4">Model Performance: Accuracy vs Confidence</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mlModels.map((m) => ({ name: m.name.split(' ')[0], accuracy: m.accuracy, confidence: m.confidence }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151' }} />
                  <Legend />
                  <Bar dataKey="accuracy" fill="#3b82f6" name="Accuracy" />
                  <Bar dataKey="confidence" fill="#10b981" name="Confidence" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
