export default function EquipmentPage() {
  const equipment = [
    { id: '1', name: 'Tower Crane TC-500', type: 'CRANE', project: 'Metro Station', status: 'IN_USE', condition: 'GOOD', lastMaintenance: 'Feb 28' },
    { id: '2', name: 'Excavator CAT 320', type: 'EXCAVATOR', project: 'Office Tower', status: 'AVAILABLE', condition: 'GOOD', lastMaintenance: 'Mar 5' },
    { id: '3', name: 'Concrete Pump CP-200', type: 'PUMP', project: 'Hospital Wing', status: 'MAINTENANCE', condition: 'FAIR', lastMaintenance: 'Mar 10' },
    { id: '4', name: 'Scissor Lift SL-15', type: 'LIFT', project: 'Metro Station', status: 'IN_USE', condition: 'GOOD', lastMaintenance: 'Feb 20' },
  ];

  const statusColors: Record<string, string> = {
    'AVAILABLE': 'bg-green-100 text-green-700',
    'IN_USE': 'bg-blue-100 text-blue-700',
    'MAINTENANCE': 'bg-yellow-100 text-yellow-700',
  };

  const conditionColors: Record<string, string> = {
    'EXCELLENT': 'bg-green-100 text-green-700',
    'GOOD': 'bg-blue-100 text-blue-700',
    'FAIR': 'bg-yellow-100 text-yellow-700',
    'POOR': 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipment</h1>
          <p className="text-slate-500">Equipment inventory and tracking</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Add Equipment
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">8</div>
          <div className="text-slate-500 text-sm">Available</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">12</div>
          <div className="text-slate-500 text-sm">In Use</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-yellow-600">3</div>
          <div className="text-slate-500 text-sm">Maintenance</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-slate-900">23</div>
          <div className="text-slate-500 text-sm">Total</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Equipment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Condition</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Last Maintenance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {equipment.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-6 py-4 text-slate-900 font-medium">{item.name}</td>
                <td className="px-6 py-4 text-slate-600">{item.type}</td>
                <td className="px-6 py-4 text-slate-600">{item.project}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[item.status]}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${conditionColors[item.condition]}`}>
                    {item.condition}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{item.lastMaintenance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
