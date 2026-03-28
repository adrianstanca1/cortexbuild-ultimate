export default function TeamPage() {
  const team = [
    { id: '1', name: 'John Smith', role: 'Project Manager', email: 'john.smith@company.com', phone: '(555) 123-4567', project: 'Metro Station' },
    { id: '2', name: 'Sarah Connor', role: 'Site Superintendent', email: 'sarah.connor@company.com', phone: '(555) 234-5678', project: 'Office Tower' },
    { id: '3', name: 'Mike Ross', role: 'Safety Officer', email: 'mike.ross@company.com', phone: '(555) 345-6789', project: 'Hospital Wing' },
    { id: '4', name: 'Emily Chen', role: 'Project Engineer', email: 'emily.chen@company.com', phone: '(555) 456-7890', project: 'Metro Station' },
  ];

  const roleColors: Record<string, string> = {
    'Project Manager': 'bg-purple-100 text-purple-700',
    'Site Superintendent': 'bg-blue-100 text-blue-700',
    'Safety Officer': 'bg-red-100 text-red-700',
    'Project Engineer': 'bg-green-100 text-green-700',
    'Foreman': 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team</h1>
          <p className="text-slate-500">Team directory</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Add Team Member
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-slate-900">24</div>
          <div className="text-slate-500 text-sm">Total Members</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">3</div>
          <div className="text-slate-500 text-sm">Projects</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-purple-600">5</div>
          <div className="text-slate-500 text-sm">Managers</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">19</div>
          <div className="text-slate-500 text-sm">Field Staff</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Project</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {team.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-6 py-4 text-slate-900 font-medium">{member.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[member.role] || 'bg-slate-100 text-slate-700'}`}>
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{member.email}</td>
                <td className="px-6 py-4 text-slate-600">{member.phone}</td>
                <td className="px-6 py-4 text-slate-600">{member.project}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
