import { Calendar, ClipboardList, Users, AlertTriangle } from 'lucide-react';

type DailyReport = Record<string, unknown>;

type SummaryStatsCardsProps = {
  thisWeekCount: number;
  draftCount: number;
  averageWorkersPerDay: number;
  projectsWithoutReport: DailyReport[];
};

export function SummaryStatsCards({ thisWeekCount, draftCount, averageWorkersPerDay, projectsWithoutReport }: SummaryStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        {
          label: 'This Week',
          value: thisWeekCount,
          icon: Calendar,
          colour: 'text-blue-400',
          bg: 'bg-blue-500/10 border-blue-500/30',
        },
        {
          label: 'Draft Reports',
          value: draftCount,
          icon: ClipboardList,
          colour: 'text-yellow-400',
          bg: 'bg-yellow-500/10 border-yellow-500/30',
        },
        {
          label: 'Avg Workers/Day',
          value: averageWorkersPerDay,
          icon: Users,
          colour: 'text-green-400',
          bg: 'bg-green-500/10 border-green-500/30',
        },
        {
          label: 'No Report Today',
          value: projectsWithoutReport.length,
          icon: AlertTriangle,
          colour: projectsWithoutReport.length > 0 ? 'text-red-400' : 'text-gray-400',
          bg: projectsWithoutReport.length > 0
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-gray-500/10 border-gray-500/30',
        },
      ].map(kpi => (
        <div key={kpi.label} className={`bg-gray-800 rounded-xl border ${kpi.bg} p-4`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-700">
              <kpi.icon size={20} className={kpi.colour} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{kpi.label}</p>
              <p className="text-xl font-bold text-white">{kpi.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
