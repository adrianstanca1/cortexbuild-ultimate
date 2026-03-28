export default function InspectionsPage() {
  const inspections = [
    { id: '1', number: 'INS-001', title: 'Foundation pour inspection', project: 'Metro Station', type: 'STRUCTURAL', status: 'SCHEDULED', inspector: 'Bob Wilson', date: 'Mar 22' },
    { id: '2', number: 'INS-002', title: 'Electrical rough-in', project: 'Office Tower', type: 'ELECTRICAL', status: 'PASSED', inspector: 'Lisa Brown', date: 'Mar 15' },
    { id: '3', number: 'INS-003', title: 'Plumbing pressure test', project: 'Hospital Wing', type: 'PLUMBING', status: 'FAILED', inspector: 'Tom Harris', date: 'Mar 18' },
    { id: '4', number: 'INS-004', title: 'Fire safety inspection', project: 'Metro Station', type: 'SAFETY', status: 'SCHEDULED', inspector: 'Lisa Brown', date: 'Mar 25' },
  ];

  const statusColors: Record<string, string> = {
    'SCHEDULED': 'bg-blue-100 text-blue-700',
    'PASSED': 'bg-green-100 text-green-700',
    'FAILED': 'bg-red-100 text-red-700',
    'CANCELLED': 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inspections</h1>
          <p className="text-slate-500">Schedule and track inspections</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Schedule Inspection
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">5</div>
          <div className="text-slate-500 text-sm">Scheduled</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">18</div>
          <div className="text-slate-500 text-sm">Passed</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-red-600">3</div>
          <div className="text-slate-500 text-sm">Failed</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-slate-900">26</div>
          <div className="text-slate-500 text-sm">Total</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Inspection #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Inspector</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {inspections.map((ins) => (
              <tr key={ins.id} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-6 py-4 font-medium text-blue-600">{ins.number}</td>
                <td className="px-6 py-4 text-slate-900">{ins.title}</td>
                <td className="px-6 py-4 text-slate-600">{ins.project}</td>
                <td className="px-6 py-4 text-slate-600">{ins.type}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[ins.status]}`}>
                    {ins.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{ins.inspector}</td>
                <td className="px-6 py-4 text-slate-500">{ins.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
