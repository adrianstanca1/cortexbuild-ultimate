// Module: DailyReports
import React, { useState } from 'react';
import { Plus, Calendar, Cloud, Users, AlertCircle, Camera, Bot } from 'lucide-react';
import { dailyReports } from '../../data/mockData';
import { DailyReport } from '../../types';

export function DailyReports() {
  const [selectedDate, setSelectedDate] = useState('2026-03-20');
  const report = dailyReports[0];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Daily Reports</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Report
        </button>
      </div>

      {/* Date Selector */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <label className="text-sm font-medium text-gray-300 mb-2 block">Select Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white w-full md:w-48"
        />
      </div>

      {/* Report Content */}
      {report && (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Project</p>
                <p className="text-white font-semibold">{report.project}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Date</p>
                <p className="text-white font-semibold">{new Date(report.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Prepared By</p>
                <p className="text-white font-semibold">{report.preparedBy}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Progress</p>
                <p className="text-white font-semibold">{report.progress}%</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${report.progress}%` }}></div>
              </div>
            </div>
          </div>

          {/* Weather & Site Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="w-5 h-5 text-blue-400" />
                <p className="text-gray-400 text-sm">Weather</p>
              </div>
              <p className="text-white font-semibold">{report.weather}</p>
              <p className="text-gray-300 mt-1">{report.temperature}</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-green-400" />
                <p className="text-gray-400 text-sm">Workers On Site</p>
              </div>
              <p className="text-white font-semibold text-2xl">{report.workersOnSite}</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-5 h-5 text-purple-400" />
                <p className="text-gray-400 text-sm">Photos</p>
              </div>
              <p className="text-white font-semibold text-2xl">{report.photos}</p>
            </div>
          </div>

          {/* Activities */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Activities</h3>
            <ul className="space-y-2">
              {report.activities.map((activity, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-300">{activity}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Materials & Equipment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Materials Used</h3>
              <ul className="space-y-2">
                {report.materials.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Equipment On Site</h3>
              <ul className="space-y-2">
                {report.equipment.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Issues */}
          {report.issues.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-red-400 mb-3">Issues & Delays</h3>
                  <ul className="space-y-2">
                    {report.issues.map((issue, idx) => (
                      <li key={idx} className="text-red-300">• {issue}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* AI Summary */}
          {report.aiSummary && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Bot className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-400 mb-2">AI Summary</h3>
                  <p className="text-blue-300">{report.aiSummary}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium">
              Edit Report
            </button>
            <button className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 font-medium">
              Download PDF
            </button>
            <button className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 font-medium">
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
