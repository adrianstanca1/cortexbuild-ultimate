export default function ChangeOrdersPage() {
  const changeOrders = [
    { id: '1', number: 'CO-001', title: 'Additional foundation work', project: 'Metro Station', amount: '$45,000', status: 'PENDING', submittedBy: 'John Smith', date: 'Mar 15' },
    { id: '2', number: 'CO-002', title: 'HVAC system upgrade', project: 'Office Tower', amount: '$28,500', status: 'APPROVED', submittedBy: 'Sarah Connor', date: 'Mar 12' },
    { id: '3', number: 'CO-003', title: 'Electrical panel replacement', project: 'Hospital Wing', amount: '$12,200', status: 'REJECTED', submittedBy: 'Mike Ross', date: 'Mar 10' },
    { id: '4', number: 'CO-004', title: 'Structural steel reinforcement', project: 'Metro Station', amount: '$67,000', status: 'PENDING', submittedBy: 'Emily Chen', date: 'Mar 18' },
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
          <h1 className="text-2xl font-bold text-slate-900">Change Orders</h1>
          <p className="text-slate-500">Track and approve project changes</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + New Change Order
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-yellow-600">5</div>
          <div className="text-slate-500 text-sm">Pending</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">12</div>
          <div className="text-slate-500 text-sm">Approved</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-red-600">2</div>
          <div className="text-slate-500 text-sm">Rejected</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-slate-900">$234K</div>
          <div className="text-slate-500 text-sm">Total Value</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">CO #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {changeOrders.map((co) => (
              <tr key={co.id} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-6 py-4 font-medium text-blue-600">{co.number}</td>
                <td className="px-6 py-4 text-slate-900">{co.title}</td>
                <td className="px-6 py-4 text-slate-600">{co.project}</td>
                <td className="px-6 py-4 text-slate-900 font-medium">{co.amount}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[co.status]}`}>
                    {co.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{co.submittedBy}</td>
                <td className="px-6 py-4 text-slate-500">{co.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
