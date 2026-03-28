export default function TimesheetsPage() {
  const timesheets = [
    { id: '1', employee: 'John Smith', project: 'Metro Station', date: 'Mar 18', hours: 8, status: 'SUBMITTED' },
    { id: '2', employee: 'Sarah Connor', project: 'Office Tower', date: 'Mar 18', hours: 7.5, status: 'APPROVED' },
    { id: '3', employee: 'Mike Ross', project: 'Hospital Wing', date: 'Mar 18', hours: 8, status: 'PENDING' },
    { id: '4', employee: 'Emily Chen', project: 'Metro Station', date: 'Mar 18', hours: 6, status: 'SUBMITTED' },
  ];

  const statusColors: Record<string, string> = {
    'DRAFT': 'bg-slate-100 text-slate-700',
    'SUBMITTED': 'bg-blue-100 text-blue-700',
    'APPROVED': 'bg-green-100 text-green-700',
    'REJECTED': 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Timesheets</h1>
          <p className="text-slate-500">Time entry tracking</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + New Time Entry
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">156</div>
          <div className="text-slate-500 text-sm">Hours This Week</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">45</div>
          <div className="text-slate-500 text-sm">Approved</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-yellow-600">12</div>
          <div className="text-slate-500 text-sm">Pending</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-slate-900">$18.5K</div>
          <div className="text-slate-500 text-sm">Labor Cost</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Hours</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {timesheets.map((ts) => (
              <tr key={ts.id} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-6 py-4 text-slate-900 font-medium">{ts.employee}</td>
                <td className="px-6 py-4 text-slate-600">{ts.project}</td>
                <td className="px-6 py-4 text-slate-600">{ts.date}</td>
                <td className="px-6 py-4 text-slate-900 font-medium">{ts.hours}h</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[ts.status]}`}>
                    {ts.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
