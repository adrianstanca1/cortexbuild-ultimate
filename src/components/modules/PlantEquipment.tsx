// Module: PlantEquipment
import React, { useState } from 'react';
import { Plus, AlertCircle, Wrench } from 'lucide-react';
import { equipment } from '../../data/mockData';
import { Equipment } from '../../types';

export function PlantEquipment() {
  const statusColor = (status: string) => {
    switch (status) {
      case 'on_site': return 'bg-green-500/20 text-green-400';
      case 'available': return 'bg-blue-500/20 text-blue-400';
      case 'maintenance': return 'bg-orange-500/20 text-orange-400';
      case 'hired_out': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const stats = [
    { label: 'Total Plant', value: equipment.length },
    { label: 'On Site', value: equipment.filter(e => e.status === 'on_site').length },
    { label: 'Available', value: equipment.filter(e => e.status === 'available').length },
    { label: 'Maintenance', value: equipment.filter(e => e.status === 'maintenance').length },
    { label: 'Hired Out', value: equipment.filter(e => e.status === 'hired_out').length },
  ];

  const serviceAlerts = equipment.filter(e => {
    const nextService = new Date(e.nextService);
    const now = new Date();
    const daysUntil = Math.floor((nextService.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil < 14 && daysUntil > 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Plant & Equipment</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Equipment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Service Alerts */}
      {serviceAlerts.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-semibold">Service Due Soon</p>
            <p className="text-yellow-300 text-sm">{serviceAlerts.length} item(s) require servicing within 14 days</p>
          </div>
        </div>
      )}

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.map(eq => {
          const nextService = new Date(eq.nextService);
          const now = new Date();
          const daysUntil = Math.floor((nextService.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const serviceOverdue = daysUntil < 0;
          const serviceSoon = daysUntil < 14 && daysUntil >= 0;

          return (
            <div key={eq.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-blue-600 transition">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-white">{eq.name}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(eq.status)}`}>
                  {eq.status.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-400 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-white">{eq.type}</p>
                </div>
                {eq.registration && (
                  <div>
                    <p className="text-xs text-gray-500">Registration</p>
                    <p className="text-white font-mono">{eq.registration}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-white">{eq.location}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Daily Rate</p>
                  <p className="text-white font-semibold">£{eq.dailyRate.toLocaleString()}</p>
                </div>
              </div>

              <div className={`border-t border-gray-800 pt-3 ${serviceOverdue ? 'bg-red-500/10' : serviceSoon ? 'bg-yellow-500/10' : ''} rounded p-2`}>
                <div className="flex items-center gap-2 mb-1">
                  <Wrench className={`w-4 h-4 ${serviceOverdue ? 'text-red-400' : serviceSoon ? 'text-yellow-400' : 'text-gray-400'}`} />
                  <span className="text-xs text-gray-400">Next Service</span>
                </div>
                <p className={`font-semibold ${serviceOverdue ? 'text-red-400' : serviceSoon ? 'text-yellow-400' : 'text-white'}`}>
                  {nextService.toLocaleDateString()}
                </p>
                {(serviceOverdue || serviceSoon) && (
                  <p className={`text-xs mt-1 ${serviceOverdue ? 'text-red-400' : 'text-yellow-400'}`}>
                    {serviceOverdue ? '⚠ Overdue' : `⏰ Due in ${daysUntil} days`}
                  </p>
                )}
              </div>

              <button className="w-full mt-3 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 text-sm font-medium">
                View Details
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
