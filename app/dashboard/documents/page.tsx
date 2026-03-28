export default function DocumentsPage() {
  const documents = [
    { id: '1', name: 'Foundation Plans v2.pdf', type: 'DRAWING', project: 'Metro Station', size: '2.4 MB', uploadedBy: 'John Smith', date: 'Mar 15' },
    { id: '2', name: 'Safety Manual 2024.pdf', type: 'MANUAL', project: 'All Projects', size: '1.8 MB', uploadedBy: 'Sarah Connor', date: 'Mar 12' },
    { id: '3', name: 'Structural Calcs.xlsx', type: 'CALCULATION', project: 'Office Tower', size: '890 KB', uploadedBy: 'Mike Ross', date: 'Mar 10' },
    { id: '4', name: 'HVAC Specifications.pdf', type: 'SPECIFICATION', project: 'Hospital Wing', size: '3.2 MB', uploadedBy: 'Emily Chen', date: 'Mar 18' },
  ];

  const typeColors: Record<string, string> = {
    'DRAWING': 'bg-blue-100 text-blue-700',
    'MANUAL': 'bg-purple-100 text-purple-700',
    'CALCULATION': 'bg-green-100 text-green-700',
    'SPECIFICATION': 'bg-orange-100 text-orange-700',
    'CONTRACT': 'bg-slate-100 text-slate-700',
    'PHOTO': 'bg-pink-100 text-pink-700',
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-500">Project file management</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Upload Document
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-slate-900">156</div>
          <div className="text-slate-500 text-sm">Total Files</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">48 GB</div>
          <div className="text-slate-500 text-sm">Storage Used</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">12</div>
          <div className="text-slate-500 text-sm">Shared Today</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-purple-600">8</div>
          <div className="text-slate-500 text-sm">Folders</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Uploaded</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-6 py-4 text-slate-900 font-medium">{doc.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[doc.type]}`}>
                    {doc.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{doc.project}</td>
                <td className="px-6 py-4 text-slate-600">{doc.size}</td>
                <td className="px-6 py-4 text-slate-600">{doc.uploadedBy}</td>
                <td className="px-6 py-4 text-slate-500">{doc.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
