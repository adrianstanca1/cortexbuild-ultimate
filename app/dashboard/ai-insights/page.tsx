'use client';

import { useState } from 'react';

export default function AIInsightsPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Array<{type: string; message: string}>>([
    { type: 'risk', message: 'Project "Metro Station" has 3 RFIs overdue by more than 7 days. Recommend immediate follow-up.' },
    { type: 'schedule', message: 'Critical path analysis shows potential 2-week delay in Foundation phase due to weather forecast.' },
    { type: 'safety', message: 'No toolbox talks recorded in Zone B for 2 weeks. Compliance risk.' },
    { type: 'cost', message: 'Budget variance of +5% detected in Materials. Review change orders.' },
  ]);

  const handleQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setInsights(prev => [...prev, { type: 'ai', message: `AI analysis: ${query}` }]);
      setQuery('');
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">AI Insights</h1>
        <p className="text-slate-500">Powered by local Ollama LLM</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">🤖</div>
            <div>
              <div className="text-lg font-bold text-slate-900">Ollama</div>
              <div className="text-sm text-green-600">Connected</div>
            </div>
          </div>
          <div className="text-sm text-slate-500 mt-2">Model: llama3.2</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">📊</div>
            <div>
              <div className="text-lg font-bold text-slate-900">12</div>
              <div className="text-sm text-slate-500">Insights Generated</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">⚠️</div>
            <div>
              <div className="text-lg font-bold text-slate-900">3</div>
              <div className="text-sm text-orange-600">Action Required</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Ask AI</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about your projects, safety, schedule..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
          />
          <button
            onClick={handleQuery}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Ask'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Insights</h2>
        <div className="space-y-4">
          {insights.map((insight, i) => (
            <div key={i} className={`p-4 rounded-lg border ${
              insight.type === 'risk' ? 'bg-red-50 border-red-200' :
              insight.type === 'schedule' ? 'bg-yellow-50 border-yellow-200' :
              insight.type === 'safety' ? 'bg-orange-50 border-orange-200' :
              insight.type === 'cost' ? 'bg-blue-50 border-blue-200' :
              'bg-purple-50 border-purple-200'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-lg">
                  {insight.type === 'risk' ? '⚠️' :
                   insight.type === 'schedule' ? '📅' :
                   insight.type === 'safety' ? '🦺' :
                   insight.type === 'cost' ? '💰' : '🤖'}
                </span>
                <p className="text-slate-700">{insight.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-left">
          <div className="font-medium text-slate-900">Risk Analysis</div>
          <div className="text-sm text-slate-500">Identify project risks</div>
        </button>
        <button className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-left">
          <div className="font-medium text-slate-900">Schedule Forecast</div>
          <div className="text-sm text-slate-500">Predict delays</div>
        </button>
        <button className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-left">
          <div className="font-medium text-slate-900">Document Summary</div>
          <div className="text-sm text-slate-500">RFI & CO analysis</div>
        </button>
      </div>
    </div>
  );
}
