import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsMetric {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6'];

export function AdvancedAnalytics() {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    // Simulate loading metrics
    const mockMetrics: AnalyticsMetric[] = [
      { name: 'Total Revenue', value: 2450000, change: 12.5, trend: 'up' },
      { name: 'Active Projects', value: 24, change: -2.3, trend: 'down' },
      { name: 'Team Members', value: 156, change: 5.8, trend: 'up' },
      { name: 'Safety Incidents', value: 3, change: -45.2, trend: 'up' },
    ];
    setMetrics(mockMetrics);
  }, [timeRange]);

  const revenueData = [
    { month: 'Jan', revenue: 180000, costs: 150000 },
    { month: 'Feb', revenue: 220000, costs: 180000 },
    { month: 'Mar', revenue: 195000, costs: 165000 },
    { month: 'Apr', revenue: 280000, costs: 220000 },
    { month: 'May', revenue: 320000, costs: 250000 },
    { month: 'Jun', revenue: 290000, costs: 230000 },
  ];

  const projectStatusData = [
    { name: 'Active', value: 12 },
    { name: 'Planning', value: 5 },
    { name: 'On Hold', value: 3 },
    { name: 'Completed', value: 24 },
  ];

  const productivityData = [
    { week: 'W1', productivity: 75, tasks: 45 },
    { week: 'W2', productivity: 82, tasks: 52 },
    { week: 'W3', productivity: 78, tasks: 48 },
    { week: 'W4', productivity: 88, tasks: 58 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Advanced Analytics</h1>
          <p className="text-gray-500">Comprehensive business intelligence dashboard</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
          className="select select-bordered"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="card bg-base-100 border border-base-300">
            <div className="card-body p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">{metric.name}</p>
                  <p className="text-2xl font-bold mt-1">
                    {metric.name.includes('Revenue') ? '£' : ''}{metric.value.toLocaleString()}
                    {metric.name.includes('Members') || metric.name.includes('Projects') || metric.name.includes('Incidents') ? '' : ''}
                  </p>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${metric.trend === 'up' ? 'text-success' : metric.change < 0 ? 'text-error' : 'text-gray-500'}`}>
                    {metric.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>{Math.abs(metric.change)}%</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  {metric.name.includes('Revenue') && <DollarSign className="w-5 h-5 text-primary" />}
                  {metric.name.includes('Projects') && <CheckCircle className="w-5 h-5 text-primary" />}
                  {metric.name.includes('Members') && <Users className="w-5 h-5 text-primary" />}
                  {metric.name.includes('Incidents') && <AlertTriangle className="w-5 h-5 text-primary" />}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Costs */}
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h2 className="card-title">Revenue vs Costs</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151' }} />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                <Area type="monotone" dataKey="costs" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Status Distribution */}
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h2 className="card-title">Project Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Trends */}
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h2 className="card-title">Productivity Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={productivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151' }} />
                <Legend />
                <Line type="monotone" dataKey="productivity" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="tasks" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h2 className="card-title">Key Performance Indicators</h2>
            <div className="space-y-4">
              {[
                { label: 'On-Time Delivery', value: 92, target: 90 },
                { label: 'Budget Adherence', value: 87, target: 85 },
                { label: 'Quality Score', value: 94, target: 90 },
                { label: 'Safety Compliance', value: 98, target: 95 },
              ].map((kpi, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{kpi.label}</span>
                    <span className={kpi.value >= kpi.target ? 'text-success' : 'text-warning'}>
                      {kpi.value}% (Target: {kpi.target}%)
                    </span>
                  </div>
                  <div className="w-full bg-base-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${kpi.value >= kpi.target ? 'bg-success' : 'bg-warning'}`}
                      style={{ width: `${kpi.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AdvancedAnalytics;
