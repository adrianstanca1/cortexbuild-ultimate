// Module: SiteOperations
import React, { useState } from 'react';
import { Zap, Users, Truck, LogIn } from 'lucide-react';
import { projects } from '../../data/mockData';

export function SiteOperations() {
  const activeProjects = projects.filter(p => p.status === 'active');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Site Operations</h1>

      {/* Site Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeProjects.map(project => (
          <div key={project.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-1">{project.name}</h3>
            <p className="text-sm text-gray-400 mb-4">{project.location}</p>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Foreman</span>
                <span className="text-white font-medium">{project.manager}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1"><Users className="w-4 h-4" /> Workers On Site</span>
                <span className="text-white font-semibold">{project.workers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Progress</span>
                <span className="text-white font-semibold">{project.progress}%</span>
              </div>
            </div>

            <button className="w-full mt-4 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-blue-400 text-sm font-medium">
              View Site Details
            </button>
          </div>
        ))}
      </div>

      {/* Daily Activities */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Today's Activities</h3>
        <ul className="space-y-3">
          {[
            '08:00 — Site induction for 3 new groundworkers — Canary Wharf',
            '09:30 — Steel delivery and unloading — Canary Wharf (28 tonnes UC sections)',
            '11:00 — Concrete pour starts on Floor 7 — Canary Wharf (120m³)',
            '13:00 — Lunch break — All sites',
            '14:00 — MEP first fix inspection — Manchester (Electrical rough-in)',
            '15:30 — Daily stand-up meeting — All PMs (15 mins)',
            '16:00 — Weather check — Site operations',
          ].map((activity, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Zap className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
              <span className="text-gray-300">{activity}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Deliveries Today */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Deliveries Today
        </h3>
        <div className="space-y-3">
          {[
            { time: '09:30', item: 'Steel Sections (28t) — Tata Steel', location: 'Canary Wharf', status: 'arriving' },
            { time: '10:00', item: 'Ready-Mix Concrete (120m³) — Hanson UK', location: 'Canary Wharf', status: 'arriving' },
            { time: '14:00', item: 'Electrical Cable & Conduit — Apex Electrical', location: 'Manchester', status: 'pending' },
          ].map((delivery, idx) => (
            <div key={idx} className="bg-gray-800/50 rounded-lg p-3 flex justify-between items-start">
              <div>
                <p className="text-white font-semibold">{delivery.item}</p>
                <p className="text-xs text-gray-400 mt-1">{delivery.location}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-mono">{delivery.time}</p>
                <span className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                  delivery.status === 'arriving' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {delivery.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visitors Log */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <LogIn className="w-5 h-5" />
          Visitors Log (This Week)
        </h3>
        <div className="space-y-2">
          {[
            { name: 'Robert Sinclair', company: 'Meridian Properties', date: '2026-03-18', purpose: 'Site inspection' },
            { name: 'Dr. Helen Shaw', company: 'NHS South Yorkshire', date: '2026-03-17', purpose: 'Pre-contract meeting' },
            { name: 'Health & Safety Auditor', company: 'HSE', date: '2026-03-15', purpose: 'Annual compliance audit' },
          ].map((visitor, idx) => (
            <div key={idx} className="bg-gray-800/50 rounded-lg p-3 flex justify-between items-start">
              <div>
                <p className="text-white font-semibold">{visitor.name}</p>
                <p className="text-xs text-gray-400">{visitor.company} — {visitor.purpose}</p>
              </div>
              <p className="text-sm text-gray-400">{new Date(visitor.date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weather for All Sites */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Weather Conditions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['London', 'Manchester', 'Birmingham'].map((location, idx) => (
            <div key={idx} className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-white font-semibold mb-2">{location}</p>
              <p className="text-2xl font-bold text-blue-400">14°C</p>
              <p className="text-sm text-gray-400">Partly Cloudy</p>
              <p className="text-xs text-gray-500 mt-2">Wind: 12 mph | Humidity: 65%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
