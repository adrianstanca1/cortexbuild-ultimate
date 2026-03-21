// Module: Teams
import React, { useState } from 'react';
import { Plus, Users, MapPin, Check, X } from 'lucide-react';
import { teamMembers } from '../../data/mockData';
import { TeamMember } from '../../types';

export function Teams() {
  const [filterTrade, setFilterTrade] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filteredMembers = filterTrade === 'all' ? teamMembers : teamMembers.filter(m => m.trade === filterTrade);

  const statusColor = (status: string) => {
    switch (status) {
      case 'on_site': return 'bg-green-500 text-white';
      case 'off_site': return 'bg-yellow-500 text-white';
      case 'leave': return 'bg-gray-500 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const cisStatusLabel = (status: string) => {
    switch (status) {
      case 'gross': return 'Gross (0%)';
      case 'net': return 'Net (20%)';
      case 'unverified': return 'Unverified (30%)';
      default: return status;
    }
  };

  const stats = [
    { label: 'Total Staff', value: teamMembers.length },
    { label: 'On Site', value: teamMembers.filter(t => t.status === 'on_site').length },
    { label: 'Off Site', value: teamMembers.filter(t => t.status === 'off_site').length },
    { label: 'On Leave', value: teamMembers.filter(t => t.status === 'leave').length },
  ];

  const trades = [...new Set(teamMembers.map(m => m.trade))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Team Members</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Team Member
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

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-800 overflow-x-auto pb-4">
        {['all', ...trades].map(trade => (
          <button
            key={trade}
            onClick={() => setFilterTrade(trade)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition ${
              filterTrade === trade
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {trade.charAt(0).toUpperCase() + trade.slice(1)}
          </button>
        ))}
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map(member => (
          <div
            key={member.id}
            onClick={() => { setSelectedMember(member); setShowModal(true); }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-blue-600 cursor-pointer transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-semibold text-white">{member.name}</h4>
                  <p className="text-xs text-gray-400">{member.role}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${statusColor(member.status)}`}>
                {member.status === 'on_site' ? 'On Site' : member.status === 'off_site' ? 'Off Site' : member.status}
              </span>
            </div>

            <div className="space-y-2 text-xs text-gray-400 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-300">Trade:</span>
                <span>{member.trade}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-300">CIS Status:</span>
                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                  {cisStatusLabel(member.cisStatus)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-300">This Week:</span>
                <span>{member.hoursThisWeek}h</span>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-800">
              <button className="flex-1 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded text-blue-400 text-xs font-medium">
                Profile
              </button>
              <button className="flex-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 text-xs font-medium flex items-center justify-center gap-1">
                {member.ramsCompleted ? (
                  <>
                    <Check className="w-3 h-3" />
                    RAMS OK
                  </>
                ) : (
                  <>
                    <X className="w-3 h-3" />
                    No RAMS
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {showModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedMember.name}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Role</p>
                  <p className="text-white font-semibold">{selectedMember.role}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Trade</p>
                  <p className="text-white font-semibold">{selectedMember.trade}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Email</p>
                  <p className="text-white font-semibold">{selectedMember.email}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Phone</p>
                  <p className="text-white font-semibold">{selectedMember.phone}</p>
                </div>
              </div>

              {/* Tax & CIS Info */}
              <div className="border-t border-gray-800 pt-4">
                <h3 className="font-bold text-white mb-3">Tax & CIS Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">UTR</p>
                    <p className="text-white font-mono">{selectedMember.utrNumber || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">NI Number</p>
                    <p className="text-white font-mono">{selectedMember.niNumber || 'N/A'}</p>
                  </div>
                  <div className="col-span-2 bg-gray-800/50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">CIS Status</p>
                    <p className="text-white font-semibold">{cisStatusLabel(selectedMember.cisStatus)}</p>
                  </div>
                </div>
              </div>

              {/* Projects & Hours */}
              <div className="border-t border-gray-800 pt-4">
                <h3 className="font-bold text-white mb-3">Assignment</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Current Projects</p>
                    <p className="text-white">{selectedMember.projects.length} active</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Hours This Week</p>
                    <p className="text-white font-semibold">{selectedMember.hoursThisWeek} hours</p>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-gray-400 text-xs mb-2">RAMS Completion</p>
                    <div className="flex items-center gap-2">
                      {selectedMember.ramsCompleted ? (
                        <>
                          <Check className="w-5 h-5 text-green-400" />
                          <span className="text-green-400 font-medium">All RAMS documents signed</span>
                        </>
                      ) : (
                        <>
                          <X className="w-5 h-5 text-red-400" />
                          <span className="text-red-400 font-medium">Missing RAMS signatures</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white">Close</button>
              <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium">Edit Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
