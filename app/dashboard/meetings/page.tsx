export default function MeetingsPage() {
  const meetings = [
    { id: '1', title: 'Weekly Progress Meeting', project: 'Metro Station', date: 'Mar 18', time: '9:00 AM', attendees: 8, actionItems: 5 },
    { id: '2', title: 'Safety Review Committee', project: 'Office Tower', date: 'Mar 15', time: '2:00 PM', attendees: 5, actionItems: 3 },
    { id: '3', title: 'Owner Progress Meeting', project: 'Hospital Wing', date: 'Mar 12', time: '10:30 AM', attendees: 12, actionItems: 8 },
    { id: '4', title: 'Subcontractor Coordination', project: 'Metro Station', date: 'Mar 20', time: '1:00 PM', attendees: 6, actionItems: 4 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meetings</h1>
          <p className="text-slate-500">Meeting minutes and action items</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Schedule Meeting
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-blue-600">3</div>
          <div className="text-slate-500 text-sm">This Week</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-green-600">15</div>
          <div className="text-slate-500 text-sm">Completed</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-orange-600">22</div>
          <div className="text-slate-500 text-sm">Action Items</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-2xl font-bold text-slate-900">18</div>
          <div className="text-slate-500 text-sm">Total Meetings</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Meeting</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Attendees</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action Items</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {meetings.map((meeting) => (
              <tr key={meeting.id} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-6 py-4 text-slate-900 font-medium">{meeting.title}</td>
                <td className="px-6 py-4 text-slate-600">{meeting.project}</td>
                <td className="px-6 py-4 text-slate-600">{meeting.date}</td>
                <td className="px-6 py-4 text-slate-600">{meeting.time}</td>
                <td className="px-6 py-4 text-slate-600">{meeting.attendees}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                    {meeting.actionItems} items
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
