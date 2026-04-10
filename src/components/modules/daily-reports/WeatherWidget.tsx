import { CloudRain, Sun, Wind, Cloud, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type DailyReport = Record<string, unknown>;

type WeatherWidgetProps = {
  reports: DailyReport[];
  projectFilter: string;
};

function WeatherIcon({ weather }: { weather: string }) {
  if (weather.includes('Rain')) return <CloudRain size={16} className="text-blue-400" />;
  if (weather.includes('Sun') || weather.includes('Sunny')) return <Sun size={16} className="text-yellow-400" />;
  if (weather.includes('Wind')) return <Wind size={16} className="text-gray-400" />;
  return <Cloud size={16} className="text-gray-400" />;
}

export function WeatherWidget({ reports, projectFilter }: WeatherWidgetProps) {
  const filtered = reports.filter(r => !projectFilter || String(r.project_id) === projectFilter);
  const last14 = filtered
    .sort((a, b) => new Date(String(a.report_date)).getTime() - new Date(String(b.report_date)).getTime())
    .slice(-14);

  const chartData = last14.map(r => ({
    date: String(r.report_date ?? '').slice(-5),
    temp: Number(r.temperature ?? 0),
  }));

  const sunnyCount = filtered.filter(r => String(r.weather ?? '').includes('Sunny')).length;
  const rainyCount = filtered.filter(r => String(r.weather ?? '').includes('Rain')).length;
  const delayCount = filtered.filter(r => String(r.issues_delays ?? '').toLowerCase().includes('weather')).length;

  return (
    <>
      {/* Temperature Trend */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Temperature Trend (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#374151" />
            <XAxis dataKey="date" tick={{ fill: '#9ca3af' }} />
            <YAxis tick={{ fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Line type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Weather Grid */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Daily Weather (Last 14 Days)</h3>
        <div className="grid grid-cols-7 gap-3">
          {last14.map(r => (
            <div key={String(r.id)} className="bg-gray-700/50 rounded-lg p-3 border border-gray-700 text-center">
              <p className="text-xs text-gray-400 mb-2">{String(r.report_date ?? '').slice(-5)}</p>
              <div className="flex justify-center mb-2">
                <WeatherIcon weather={String(r.weather ?? '')} />
              </div>
              <p className="text-xs text-gray-300 font-medium">{Number(r.temperature ?? 0)}°C</p>
              <p className="text-xs text-gray-500 mt-1">
                <CheckCircle2 size={12} className="inline text-green-400" />
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Weather Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Sunny Days</p>
          <p className="text-2xl font-bold text-yellow-400">{sunnyCount}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Rainy Days</p>
          <p className="text-2xl font-bold text-blue-400">{rainyCount}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Weather Delays</p>
          <p className="text-2xl font-bold text-orange-400">{delayCount}</p>
        </div>
      </div>
    </>
  );
}
