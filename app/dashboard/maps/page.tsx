'use client';

import { useState } from 'react';
import { MapPin, Building2, AlertCircle, Navigation, Layers, Search } from 'lucide-react';

interface ProjectLocation {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'completed' | 'planned';
  lat: number;
  lng: number;
  budget: string;
  completion: number;
}

const projectLocations: ProjectLocation[] = [
  {
    id: '1',
    name: 'Downtown Office Tower',
    address: '123 Main Street, New York, NY',
    status: 'active',
    lat: 40.7128,
    lng: -74.006,
    budget: '$12.5M',
    completion: 65,
  },
  {
    id: '2',
    name: 'Highway 101 Expansion',
    address: 'Highway 101, San Mateo, CA',
    status: 'active',
    lat: 37.5630,
    lng: -122.3255,
    budget: '$45.2M',
    completion: 42,
  },
  {
    id: '3',
    name: 'Medical Center Renovation',
    address: '500 Hospital Drive, Boston, MA',
    status: 'active',
    lat: 42.3601,
    lng: -71.0589,
    budget: '$28.7M',
    completion: 78,
  },
  {
    id: '4',
    name: 'School Campus Upgrade',
    address: '1200 Education Ave, Chicago, IL',
    status: 'planned',
    lat: 41.8781,
    lng: -87.6298,
    budget: '$8.3M',
    completion: 10,
  },
  {
    id: '5',
    name: 'Bridge Replacement Project',
    address: 'River Road, Portland, OR',
    status: 'active',
    lat: 45.5152,
    lng: -122.6784,
    budget: '$18.9M',
    completion: 55,
  },
];

export default function MapsPage() {
  const [selectedProject, setSelectedProject] = useState<ProjectLocation | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projectLocations.filter((project) => {
    const matchesFilter = filter === 'all' || project.status === filter;
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'planned':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Project Locations</h2>
          <p className="text-sm text-gray-500 mt-1">{filteredProjects.length} projects found</p>
        </div>

        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('planned')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === 'planned'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Planned
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                selectedProject?.id === project.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(project.status)}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{project.name}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">{project.address}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-medium text-gray-700">{project.budget}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">{project.completion}% complete</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredProjects.length === 0 && (
            <div className="p-8 text-center">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="mt-3 text-sm text-gray-500">No projects found</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Planned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Completed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 w-72">
          <h3 className="font-semibold text-gray-900 mb-2">Map Placeholder</h3>
          <p className="text-sm text-gray-600 mb-3">
            Integrate Leaflet map here with the following features:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              Interactive project markers
            </li>
            <li className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Layer toggle (satellite, terrain)
            </li>
            <li className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              Safety incident markers
            </li>
            <li className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Project site boundaries
            </li>
          </ul>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              Install leaflet: <code className="bg-blue-100 px-1 rounded">npm install leaflet react-leaflet</code>
            </p>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
              Satellite
            </button>
            <button className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              Terrain
            </button>
            <button className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
              Traffic
            </button>
          </div>
        </div>

        {selectedProject && (
          <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 w-80">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedProject.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedProject.address}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getStatusColor(selectedProject.status)}`}>
                {selectedProject.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Budget</p>
                <p className="font-semibold text-gray-900 mt-1">{selectedProject.budget}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Completion</p>
                <p className="font-semibold text-gray-900 mt-1">{selectedProject.completion}%</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{selectedProject.completion}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${selectedProject.completion}%` }}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                View Details
              </button>
              <button className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Directions
              </button>
            </div>
          </div>
        )}

        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto" />
            <p className="mt-4 text-lg font-medium text-gray-600">Map View</p>
            <p className="text-sm text-gray-500 mt-1">Add your Leaflet integration here</p>
            <div className="mt-4 flex justify-center gap-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white px-3 py-2 rounded-lg shadow text-sm"
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getStatusColor(project.status)}`} />
                  <span className="text-gray-700">{project.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
