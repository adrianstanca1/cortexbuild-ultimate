export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Organization settings</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Organization Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                <input type="text" defaultValue="Cortex Build Inc." className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input type="text" defaultValue="123 Construction Ave, Denver, CO 80202" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="text" defaultValue="(555) 123-4567" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" defaultValue="info@cortexbuild.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Notifications</h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                <span className="ml-2 text-slate-700">Email notifications for RFI responses</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                <span className="ml-2 text-slate-700">Email notifications for change orders</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                <span className="ml-2 text-slate-700">Daily digest summary</span>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 rounded-lg">Manage Users</button>
              <button className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 rounded-lg">API Keys</button>
              <button className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 rounded-lg">Integrations</button>
              <button className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 rounded-lg">Billing</button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Plan</h2>
            <div className="text-2xl font-bold text-blue-600 mb-1">Professional</div>
            <p className="text-slate-500 text-sm mb-4">Unlimited projects, users, and storage</p>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Save Changes
        </button>
      </div>
    </div>
  );
}
