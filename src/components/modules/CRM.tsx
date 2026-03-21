// Module: CRM
import React, { useState } from 'react';
import { Plus, Mail, Phone, MapPin, Star } from 'lucide-react';
import { contacts } from '../../data/mockData';
import { Contact } from '../../types';

export function CRM() {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredContacts = filterType === 'all' ? contacts : contacts.filter(c => c.type === filterType);

  const typeColor = (type: string) => {
    switch (type) {
      case 'client': return 'bg-blue-500/20 text-blue-400';
      case 'supplier': return 'bg-purple-500/20 text-purple-400';
      case 'subcontractor': return 'bg-orange-500/20 text-orange-400';
      case 'prospect': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const stats = [
    { label: 'Total Contacts', value: contacts.length },
    { label: 'Clients', value: contacts.filter(c => c.type === 'client').length },
    { label: 'Suppliers', value: contacts.filter(c => c.type === 'supplier').length },
    { label: 'Subcontractors', value: contacts.filter(c => c.type === 'subcontractor').length },
  ];

  const totalValue = contacts.reduce((sum, c) => sum + c.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">CRM & Relationships</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Total Relationship Value */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <p className="text-blue-100 text-sm mb-1">Total Relationship Value</p>
        <p className="text-4xl font-bold">£{(totalValue / 1000000).toFixed(2)}M</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-800 overflow-x-auto pb-4">
        {['all', 'client', 'supplier', 'subcontractor', 'prospect'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition ${
              filterType === type
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Contacts Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-400">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="px-6 py-3 text-left font-semibold text-white">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Company</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Role</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Type</th>
                <th className="px-6 py-3 text-right font-semibold text-white">Value</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Last Contact</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Status</th>
                <th className="px-6 py-3 text-right font-semibold text-white">Projects</th>
                <th className="px-6 py-3 text-center font-semibold text-white">Contact</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map(contact => (
                <tr key={contact.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="px-6 py-4 font-medium text-white">{contact.name}</td>
                  <td className="px-6 py-4 text-gray-300">{contact.company}</td>
                  <td className="px-6 py-4 text-gray-300">{contact.role}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColor(contact.type)}`}>
                      {contact.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-white">£{(contact.value / 1000000).toFixed(1)}M</td>
                  <td className="px-6 py-4 text-white">{new Date(contact.lastContact).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      contact.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      contact.status === 'dormant' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {contact.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-white">{contact.projects}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="text-blue-400 hover:text-blue-300" title="Email">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-300" title="Call">
                        <Phone className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
