// Module: CIS
import React, { useState } from 'react';
import { Plus, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { cisReturns } from '../../data/mockData';
import { CISReturn } from '../../types';

export function CIS() {
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [checkerUTR, setCheckerUTR] = useState('');

  const verificationStatusColor = (status: string) => {
    switch (status) {
      case 'gross': return 'bg-red-500/20 text-red-400';
      case 'net': return 'bg-orange-500/20 text-orange-400';
      case 'unverified': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const returnStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-500/20 text-green-400';
      case 'submitted': return 'bg-blue-500/20 text-blue-400';
      case 'pending': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const verificationRates = {
    gross: '0%',
    net: '20%',
    unverified: '30%'
  };

  const stats = [
    { label: 'Monthly Deductions', value: '£15.2K', icon: CheckCircle2 },
    { label: 'Verified Subcontractors', value: '8', icon: CheckCircle2 },
    { label: 'Unverified', value: '2', icon: AlertCircle },
    { label: 'Returns Due', value: '5', icon: AlertCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Construction Industry Scheme (CIS)</h1>
        <button onClick={() => setShowSubmitForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Submit Monthly Return
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-blue-400 text-sm"><strong>CIS Compliance:</strong> Track Construction Industry Scheme deductions for subcontractors. HMRC requires monthly returns with verification status (Gross 0%, Net 20%, Unverified 30%).</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <Icon className="w-5 h-5 mb-2 text-blue-400" />
              <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* HMRC Deadline Alert */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-yellow-400 font-semibold">HMRC Monthly Return Due: 21st April 2026</p>
          <p className="text-yellow-300 text-sm">Submit CIS returns by the 14th of following month</p>
        </div>
      </div>

      {/* CIS Returns Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-400">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="px-6 py-3 text-left font-semibold text-white">Contractor</th>
                <th className="px-6 py-3 text-left font-semibold text-white">UTR</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Period</th>
                <th className="px-6 py-3 text-right font-semibold text-white">Gross Payment</th>
                <th className="px-6 py-3 text-right font-semibold text-white">Materials</th>
                <th className="px-6 py-3 text-right font-semibold text-white">Labour (Net)</th>
                <th className="px-6 py-3 text-right font-semibold text-white">CIS Deduction</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Verification</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Return Status</th>
              </tr>
            </thead>
            <tbody>
              {cisReturns.map(cr => (
                <tr key={cr.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="px-6 py-4 font-medium text-white">{cr.contractor}</td>
                  <td className="px-6 py-4 font-mono text-white">{cr.utr}</td>
                  <td className="px-6 py-4 text-white">{cr.period}</td>
                  <td className="px-6 py-4 text-right font-semibold text-white">£{cr.grossPayment.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-white">£{cr.materialsCost.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-white">£{cr.labourNet.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-semibold text-orange-400">£{cr.cisDeduction.toLocaleString()} ({verificationRates[cr.verificationStatus as keyof typeof verificationRates]})</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${verificationStatusColor(cr.verificationStatus)}`}>
                      {cr.verificationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${returnStatusColor(cr.status)}`}>
                      {cr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Status Legend */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { status: 'Gross', rate: '0%', desc: 'Employee contractors — no CIS deduction' },
          { status: 'Net', rate: '20%', desc: 'Verified self-employed — 20% deduction' },
          { status: 'Unverified', rate: '30%', desc: 'Not verified on HMRC list — 30% deduction' },
        ].map((item, idx) => (
          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="font-semibold text-white">{item.status}</p>
            <p className="text-2xl font-bold text-blue-400 my-1">{item.rate}</p>
            <p className="text-xs text-gray-400">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Contractor Verification Checker */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Verify Contractor Status</h3>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={checkerUTR}
              onChange={(e) => setCheckerUTR(e.target.value)}
              placeholder="Enter UTR or company name..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white"
            />
          </div>
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium">
            Check
          </button>
        </div>
        {checkerUTR && (
          <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-400">Enter a UTR to check HMRC verification status</p>
          </div>
        )}
      </div>

      {/* Submit Modal */}
      {showSubmitForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Submit Monthly Return</h2>
              <button onClick={() => setShowSubmitForm(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Month</label>
                <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
                  <option>April 2026</option>
                  <option>May 2026</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Total Payments to Subcontractors</label>
                <input type="number" placeholder="£" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Materials Cost (exclude from CIS)</label>
                <input type="number" placeholder="£" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowSubmitForm(false)} className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white">Cancel</button>
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium">Submit to HMRC</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
