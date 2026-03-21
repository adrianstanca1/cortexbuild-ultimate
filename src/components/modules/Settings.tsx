// Module: Settings
import React, { useState } from 'react';
import { Save, LogOut, Bell } from 'lucide-react';

export function Settings() {
  const [activeTab, setActiveTab] = useState('company');

  const tabs = [
    { id: 'company', label: 'Company' },
    { id: 'users', label: 'Users' },
    { id: 'billing', label: 'Billing' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'security', label: 'Security' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Settings</h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-800 overflow-x-auto pb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Company Tab */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-6">Company Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                <input type="text" defaultValue="CortexBuild Ltd" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Logo</label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-blue-600">
                  <p className="text-gray-400">Click to upload or drag and drop</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                  <input type="text" defaultValue="London, UK" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Registration Number</label>
                  <input type="text" defaultValue="12345678" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">VAT Number</label>
                  <input type="text" defaultValue="GB123456789" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">CIS Status</label>
                  <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
                    <option>Registered & Compliant</option>
                    <option>Not Registered</option>
                  </select>
                </div>
              </div>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-400">
              <thead>
                <tr className="bg-gray-800/50 border-b border-gray-800">
                  <th className="px-6 py-3 text-left font-semibold text-white">Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-white">Email</th>
                  <th className="px-6 py-3 text-left font-semibold text-white">Role</th>
                  <th className="px-6 py-3 text-left font-semibold text-white">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-white">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Adrian Stanca', email: 'adrian@cortexbuild.co.uk', role: 'Owner', status: 'active', lastLogin: '2026-03-20' },
                  { name: 'James Harrington', email: 'j.harrington@cortexbuild.co.uk', role: 'PM', status: 'active', lastLogin: '2026-03-19' },
                  { name: 'Claire Watson', email: 'c.watson@cortexbuild.co.uk', role: 'QS', status: 'active', lastLogin: '2026-03-18' },
                  { name: 'Lisa Okafor', email: 'l.okafor@cortexbuild.co.uk', role: 'Safety Officer', status: 'active', lastLogin: '2026-03-20' },
                ].map((user, idx) => (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="px-6 py-4 text-white font-medium">{user.name}</td>
                    <td className="px-6 py-4 text-gray-300">{user.email}</td>
                    <td className="px-6 py-4 text-gray-300">{user.role}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{new Date(user.lastLogin).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Current Plan</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Plan</p>
                <p className="text-white font-semibold text-xl">Professional</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Cost per Month</p>
                <p className="text-white font-semibold text-xl">£499</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Renewal Date</p>
                <p className="text-white font-semibold">21 April 2026</p>
              </div>
            </div>
            <button className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium">
              Upgrade Plan
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Recent Invoices</h3>
            <div className="space-y-2">
              {['INV-2026-0005', 'INV-2026-0004', 'INV-2026-0003'].map(inv => (
                <div key={inv} className="flex justify-between items-center bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-300">{inv}</span>
                  <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">Download</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { label: 'Project Updates', email: true, sms: false, push: true },
              { label: 'Safety Incidents', email: true, sms: true, push: true },
              { label: 'RFI Responses', email: true, sms: false, push: true },
              { label: 'Invoice Notifications', email: true, sms: false, push: false },
              { label: 'Team Messages', email: true, sms: false, push: true },
            ].map((notif, idx) => (
              <div key={idx} className="border-b border-gray-800 pb-4 last:border-0">
                <p className="text-white font-medium mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  {notif.label}
                </p>
                <div className="flex gap-6 ml-6">
                  {[
                    { type: 'email', label: 'Email', active: notif.email },
                    { type: 'sms', label: 'SMS', active: notif.sms },
                    { type: 'push', label: 'Push', active: notif.push },
                  ].map(method => (
                    <label key={method.type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={method.active}
                        className="w-4 h-4 rounded bg-gray-800 border border-gray-700"
                      />
                      <span className="text-sm text-gray-400">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Preferences
          </button>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'HMRC CIS', status: 'connected', icon: '🏛️' },
            { name: 'Xero', status: 'not_connected', icon: '📊' },
            { name: 'Google Calendar', status: 'connected', icon: '📅' },
            { name: 'Slack', status: 'not_connected', icon: '💬' },
          ].map((integration, idx) => (
            <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-white">{integration.name}</h4>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  integration.status === 'connected'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {integration.status === 'connected' ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <button className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition ${
                integration.status === 'connected'
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}>
                {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Two-Factor Authentication</h3>
            <p className="text-gray-400 mb-4">Enable 2FA for enhanced account security</p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium">
              Enable 2FA
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Active Sessions</h3>
            <div className="space-y-2">
              {[
                { device: 'Chrome on macOS', location: 'London, UK', lastActive: '5 mins ago' },
                { device: 'Safari on iOS', location: 'London, UK', lastActive: '2 hours ago' },
              ].map((session, idx) => (
                <div key={idx} className="bg-gray-800/50 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{session.device}</p>
                    <p className="text-xs text-gray-400">{session.location}</p>
                  </div>
                  <p className="text-sm text-gray-400">{session.lastActive}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-red-400 mb-4">Danger Zone</h3>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Log Out All Sessions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
