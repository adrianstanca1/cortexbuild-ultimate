'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  FileText,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
  Users,
  HardHat,
} from 'lucide-react';

const projectStatusData = [
  { name: 'Planning', value: 4, color: '#3B82F6' },
  { name: 'In Progress', value: 8, color: '#22C55E' },
  { name: 'On Hold', value: 2, color: '#F59E0B' },
  { name: 'Completed', value: 12, color: '#6B7280' },
];

const budgetData = [
  { month: 'Jan', planned: 450000, actual: 420000 },
  { month: 'Feb', planned: 480000, actual: 510000 },
  { month: 'Mar', planned: 520000, actual: 495000 },
  { month: 'Apr', planned: 550000, actual: 580000 },
  { month: 'May', planned: 600000, actual: 590000 },
  { month: 'Jun', planned: 580000, actual: 620000 },
];

const safetyTrendData = [
  { month: 'Jan', incidents: 3, nearMisses: 8 },
  { month: 'Feb', incidents: 2, nearMisses: 6 },
  { month: 'Mar', incidents: 1, nearMisses: 4 },
  { month: 'Apr', incidents: 2, nearMisses: 5 },
  { month: 'May', incidents: 1, nearMisses: 3 },
  { month: 'Jun', incidents: 0, nearMisses: 2 },
];

const projectPerformanceData = [
  { name: 'Downtown Tower', schedule: 95, budget: 92, safety: 98 },
  { name: 'Highway 101', schedule: 88, budget: 85, safety: 94 },
  { name: 'Medical Center', schedule: 92, budget: 96, safety: 99 },
  { name: 'School Renovation', schedule: 85, budget: 88, safety: 96 },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('Last 6 Months');

  const stats = [
    {
      label: 'Active Projects',
      value: '14',
      change: '+2',
      trend: 'up',
      icon: FileText,
    },
    {
      label: 'Safety Score',
      value: '94.5%',
      change: '+2.3%',
      trend: 'up',
      icon: HardHat,
    },
    {
      label: 'Budget Variance',
      value: '-$12,400',
      change: '-1.2%',
      trend: 'down',
      icon: DollarSign,
    },
    {
      label: 'On-Time Delivery',
      value: '91%',
      change: '+4%',
      trend: 'up',
      icon: TrendingUp,
    },
  ];

  const handleExportPDF = () => {
    console.log('Exporting to PDF...');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Analytics</h1>
            <p className="text-gray-500 mt-1">Comprehensive overview of all construction projects</p>
          </div>
          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm"
            >
              <option>Last 6 Months</option>
              <option>Last Year</option>
              <option>All Time</option>
            </select>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className={`text-xs mt-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from last period
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Budget Overview</h2>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Planned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Actual</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6B7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <Bar dataKey="planned" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Project Status Distribution</h2>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, 'Projects']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {projectStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-600">{item.name}</span>
                    <span className="text-sm font-semibold text-gray-900 ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Safety Statistics</h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                Improving
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={safetyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6B7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <Line type="monotone" dataKey="incidents" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444' }} />
                  <Line type="monotone" dataKey="nearMisses" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Incidents</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Near Misses</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Project Performance Score</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectPerformanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#6B7280" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#6B7280" width={100} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, '']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <Bar dataKey="schedule" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Schedule" />
                  <Bar dataKey="budget" fill="#22C55E" radius={[0, 4, 4, 0]} name="Budget" />
                  <Bar dataKey="safety" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Safety" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Safety Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">247</p>
              <p className="text-sm text-gray-500 mt-1">Days Without Lost Time Injury</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">9</p>
              <p className="text-sm text-gray-500 mt-1">Total Incidents YTD</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-amber-600">28</p>
              <p className="text-sm text-gray-500 mt-1">Near Misses Reported</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">94.5%</p>
              <p className="text-sm text-gray-500 mt-1">Safety Compliance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
