// Module: FieldView
import React, { useState } from 'react';
import { MapPin, Cloud, Navigation2, Filter } from 'lucide-react';
import { projects } from '../../data/mockData';

export function FieldView() {
  const [filterProject, setFilterProject] = useState<string>('all');
  const activeProjects = projects.filter(p => p.status === 'active');
  const filteredProjects = filterProject === 'all' ? activeProjects : activeProjects.filter(p => p.id === filterProject);

  const projectColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Field View & GPS Tracking</h1>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-4">
        <label className="text-gray-400 font-medium">Filter by Project:</label>
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="all">All Projects</option>
          {activeProjects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Map Placeholder */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden h-[400px] relative">
        {/* Grid Pattern Simulating Map */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Project Markers */}
        {filteredProjects.map((project, idx) => {
          const left = (idx + 1) * (100 / (filteredProjects.length + 1));
          const top = 30 + (idx * 15) % 50;
          return (
            <div
              key={project.id}
              className="absolute"
              style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:w-10 hover:h-10 transition"
                style={{ backgroundColor: projectColors[idx % projectColors.length] }}
              >
                <MapPin className="w-4 h-4" />
              </div>
              <div className="absolute top-full mt-2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-gray-700 pointer-events-none">
                {project.location}
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-gray-300">
          <p className="font-semibold text-white mb-2">Active Sites</p>
          {filteredProjects.map((project, idx) => (
            <div key={project.id} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: projectColors[idx % projectColors.length] }}
              ></div>
              <span>{project.location}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Worker Tracking */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Navigation2 className="w-5 h-5" />
          Worker GPS Tracking
        </h3>
        <div className="space-y-2">
          {[
            { worker: 'Mike Turner', location: 'On Site — Canary Wharf', coords: '51.5045, -0.0190' },
            { worker: 'Dave Patel', location: 'On Site — Manchester', coords: '53.4808, -2.2426' },
            { worker: 'Tom Bradley', location: 'On Site — Birmingham', coords: '52.5086, -1.8854' },
            { worker: 'Sarah Mitchell', location: 'Off Site — Office', coords: '51.5074, -0.1278' },
            { worker: 'James Harrington', location: 'On Site — Canary Wharf', coords: '51.5045, -0.0190' },
          ].map((item, idx) => (
            <div key={idx} className="bg-gray-800/50 rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="text-white font-medium">{item.worker}</p>
                <p className="text-xs text-gray-400">{item.location}</p>
              </div>
              <p className="text-xs text-gray-500 font-mono">{item.coords}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weather Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredProjects.map((project, idx) => (
          <div key={project.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h4 className="font-semibold text-white mb-3">{project.location}</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-white">14°C</p>
                <p className="text-sm text-gray-400">Partly Cloudy</p>
              </div>
              <Cloud className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-xs text-gray-400 mt-2">Wind: 12 mph | Humidity: 65%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
