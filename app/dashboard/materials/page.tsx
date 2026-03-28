export default function MaterialsPage() {
  const materials = [
    { id: '1', name: 'Structural Steel Beams', quantity: '250 tons', project: 'Metro Station', status: 'DELIVERED', expectedDelivery: 'Mar 15' },
    { id: '2', name: 'Concrete Mix C40', quantity: '1,200 yd³', project: 'Office Tower', status: 'IN_TRANSIT', expectedDelivery: 'Mar 20' },
    { id: '3', name: 'Rebar #5', quantity: '180 tons', project: 'Hospital Wing', status: 'ORDERED', expectedDelivery: 'Mar 25' },
    { id: '4', name: 'HVAC Ductwork', quantity: '45 units', project: 'Metro Station', status: 'PENDING', expectedDelivery: 'Apr 5' },
  ];

  const statusColors: Record<string, string> = {
    'DELIVERED': 'bg-green-100 text-green-700',
    'IN_TRANSIT': 'bg-blue-100 text-blue-700',
    'ORDERED': 'bg-purple-100 text-purple-700',
    'PENDING': 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Materials</h1>
          <p className="text-slate-500">Material tracking and delivery</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Add Material
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">45</div>
          <div className="text-slate-500 text-sm">Delivered</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">12</div>
          <div className="text-slate-500 text-sm">In Transit</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-purple-600">28</div>
          <div className="text-slate-500 text-sm">Ordered</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-slate-900">85</div>
          <div className="text-slate-500 text-sm">Total</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Material</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Expected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {materials.map((mat) => (
              <tr key={mat.id} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-6 py-4 text-slate-900 font-medium">{mat.name}</td>
                <td className="px-6 py-4 text-slate-600">{mat.quantity}</td>
                <td className="px-6 py-4 text-slate-600">{mat.project}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[mat.status]}`}>
                    {mat.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{mat.expectedDelivery}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
