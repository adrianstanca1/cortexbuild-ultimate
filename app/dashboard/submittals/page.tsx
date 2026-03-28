export default function SubmittalsPage() {
  const submittals = [
    { id: '1', number: 'SUB-001', title: 'Structural steel shop drawings', project: 'Metro Station', status: 'PENDING', submittedBy: 'John Smith', dueDate: 'Mar 25' },
    { id: '2', number: 'SUB-002', title: 'HVAC equipment submittals', project: 'Office Tower', status: 'APPROVED', submittedBy: 'Sarah Connor', dueDate: 'Mar 18' },
    { id: '3', number: 'SUB-003', title: 'Electrical panel schedules', project: 'Hospital Wing', status: 'REJECTED', submittedBy: 'Mike Ross', dueDate: 'Mar 15' },
    { id: '4', number: 'SUB-004', title: 'Plumbing fixture specifications', project: 'Metro Station', status: 'PENDING', submittedBy: 'Emily Chen', dueDate: 'Mar 28' },
  ];

  const statusColors: Record<string, string> = {
    'PENDING': 'bg-yellow-100 text-yellow-700',
    'APPROVED': 'bg-green-100 text-green-700',
    'REJECTED': 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Submittals</h1>
          <p className="text-slate-500">Shop drawings and specifications</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + New Submittal
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-yellow-600">7</div>
          <div className="text-slate-500 text-sm">Pending</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">15</div>
          <div className="text-slate-500 text-sm">Approved</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-red-600">3</div>
          <div className="text-slate-500 text-sm">Rejected</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-slate-900">25</div>
          <div className="text-slate-500 text-sm">Total</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Submittal #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {submittals.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-6 py-4 font-medium text-blue-600">{sub.number}</td>
                <td className="px-6 py-4 text-slate-900">{sub.title}</td>
                <td className="px-6 py-4 text-slate-600">{sub.project}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[sub.status]}`}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{sub.submittedBy}</td>
                <td className="px-6 py-4 text-slate-500">{sub.dueDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
