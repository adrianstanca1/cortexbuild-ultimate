// Module: Subcontractors
import React, { useState } from 'react';
import { Plus, AlertCircle, CheckCircle2, Star, Eye } from 'lucide-react';
import { subcontractors } from '../../data/mockData';
import { Subcontractor } from '../../types';

export function Subcontractors() {
  const [selectedSC, setSelectedSC] = useState<Subcontractor | null>(null);
  const [showModal, setShowModal] = useState(false);

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-orange-500/20 text-orange-400';
      case 'inactive': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const cisColor = (verified: boolean) => verified ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
  const cisLabel = (verified: boolean) => verified ? 'Verified' : 'Unverified';

  const stats = [
    { label: 'Active', value: subcontractors.filter(s => s.status === 'active').length },
    { label: 'Pending', value: subcontractors.filter(s => s.status === 'pending').length },
    { label: 'CIS Verified', value: subcontractors.filter(s => s.cisVerified).length },
    { label: 'Insurance Expiring Soon', value: subcontractors.filter(s => {
      const expiry = new Date(s.insuranceExpiry);
      const now = new Date();
      const daysUntil = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil < 90 && daysUntil > 0;
    }).length },
  ];

  const warnings = subcontractors.filter(s => {
    const issues = [];
    if (!s.cisVerified) issues.push('unverified-cis');
    const expiry = new Date(s.insuranceExpiry);
    const now = new Date();
    const daysUntil = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 90) issues.push('insurance-expiring');
    if (!s.ramsApproved) issues.push('no-rams');
    return issues.length > 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Subcontractors</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Subcontractor
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

      {/* Compliance Alert */}
      {warnings.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold">Compliance Issues Detected</p>
            <p className="text-red-300 text-sm">{warnings.length} subcontractor(s) have compliance issues: unverified CIS, expired insurance, or missing RAMS</p>
          </div>
        </div>
      )}

      {/* Subcontractors Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-400">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="px-6 py-3 text-left font-semibold text-white">Company</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Trade</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Contact</th>
                <th className="px-6 py-3 text-left font-semibold text-white">CIS</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Insurance Expiry</th>
                <th className="px-6 py-3 text-left font-semibold text-white">RAMS</th>
                <th className="px-6 py-3 text-center font-semibold text-white">Rating</th>
                <th className="px-6 py-3 text-right font-semibold text-white">Contract Value</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Status</th>
                <th className="px-6 py-3 text-center font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subcontractors.map(sc => {
                const expiry = new Date(sc.insuranceExpiry);
                const now = new Date();
                const daysUntil = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const insuranceAlert = daysUntil < 90;
                return (
                  <tr key={sc.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="px-6 py-4 font-medium text-white">{sc.company}</td>
                    <td className="px-6 py-4 text-white">{sc.trade}</td>
                    <td className="px-6 py-4 text-gray-300">{sc.contact}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${cisColor(sc.cisVerified)}`}>
                        {cisLabel(sc.cisVerified)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={insuranceAlert ? 'text-red-400 font-semibold' : 'text-white'}>
                        {new Date(sc.insuranceExpiry).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {sc.ramsApproved ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-white font-semibold">{sc.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-white font-semibold">£{sc.contractValue.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(sc.status)}`}>
                        {sc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => { setSelectedSC(sc); setShowModal(true); }}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedSC && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md w-full">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedSC.company}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Trade</p>
                  <p className="text-white font-semibold">{selectedSC.trade}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(selectedSC.status)}`}>
                    {selectedSC.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Contact</p>
                  <p className="text-white font-semibold">{selectedSC.contact}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Email</p>
                  <p className="text-white text-sm font-mono">{selectedSC.email}</p>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <h3 className="font-bold text-white mb-3">Compliance</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">CIS Verified</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cisColor(selectedSC.cisVerified)}`}>
                      {cisLabel(selectedSC.cisVerified)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Insurance Expiry</span>
                    <span className="text-white font-semibold">{new Date(selectedSC.insuranceExpiry).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">RAMS Approved</span>
                    {selectedSC.ramsApproved ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <p className="text-gray-400 text-xs mb-1">Contract Value</p>
                <p className="text-2xl font-bold text-white">£{selectedSC.contractValue.toLocaleString()}</p>
              </div>
            </div>

            <button onClick={() => setShowModal(false)} className="w-full mt-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
