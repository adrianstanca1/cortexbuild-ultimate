export default function SubcontractorsPage() {
  const subcontractors = [
    { id: '1', name: 'Apex Electrical Co.', specialty: 'Electrical', project: 'Metro Station', status: 'ACTIVE', rating: 4.8 },
    { id: '2', name: 'Pinnacle Plumbing', specialty: 'Plumbing', project: 'Office Tower', status: 'ACTIVE', rating: 4.5 },
    { id: '3', name: 'Steel Works Inc.', specialty: 'Structural Steel', project: 'Hospital Wing', status: 'ACTIVE', rating: 4.9 },
    { id: '4', name: 'Metro HVAC Systems', specialty: 'HVAC', project: 'Metro Station', status: 'PENDING', rating: 4.2 },
  ];

  const statusColors: Record<string, string> = {
    'ACTIVE': 'bg-green-100 text-green-700',
    'PENDING': 'bg-yellow-100 text-yellow-700',
    'INACTIVE': 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subcontractors</h1>
          <p className="text-slate-500">Subcontractor directory</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Add Subcontractor
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">18</div>
          <div className="text-slate-500 text-sm">Active</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-yellow-600">5</div>
          <div className="text-slate-500 text-sm">Pending</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-slate-900">32</div>
          <div className="text-slate-500 text-sm">Total</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">4.7</div>
          <div className="text-slate-500 text-sm">Avg Rating</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Specialty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {subcontractors.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-6 py-4 text-slate-900 font-medium">{sub.name}</td>
                <td className="px-6 py-4 text-slate-600">{sub.specialty}</td>
                <td className="px-6 py-4 text-slate-600">{sub.project}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[sub.status]}`}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{sub.rating}/5</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
