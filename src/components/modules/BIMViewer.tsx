import React, { useEffect, useRef, useState } from 'react';
import {
  Upload,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move3D,
  Eye,
  EyeOff,
  Layers,
  AlertTriangle,
  CheckCircle,
  Box
} from 'lucide-react';

interface BIMModel {
  id: string;
  name: string;
  format: 'IFC' | 'OBJ' | 'GLTF' | 'FBX';
  size: number;
  uploadDate: Date;
  status: 'processing' | 'ready' | 'error';
  version: string;
  elements?: number;
}

interface ClashDetection {
  id: string;
  type: 'hard' | 'soft' | 'clearance';
  severity: 'critical' | 'major' | 'minor';
  elements: string[];
  location: [number, number, number];
  description: string;
  status: 'open' | 'resolved' | 'ignored';
}

export const BIMViewer: React.FC = () => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [activeModel, setActiveModel] = useState<BIMModel | null>(null);
  const [models] = useState<BIMModel[]>([
    {
      id: '1',
      name: 'Main Building Structure',
      format: 'IFC',
      size: 25600000,
      uploadDate: new Date('2026-03-25'),
      status: 'ready',
      version: 'v2.1',
      elements: 12450
    },
    {
      id: '2', 
      name: 'HVAC System',
      format: 'IFC',
      size: 8900000,
      uploadDate: new Date('2026-03-28'),
      status: 'ready',
      version: 'v1.3',
      elements: 3240
    },
    {
      id: '3',
      name: 'Electrical Layout',
      format: 'IFC', 
      size: 4200000,
      uploadDate: new Date('2026-03-30'),
      status: 'processing',
      version: 'v1.0',
      elements: 1890
    }
  ]);

  const [clashes] = useState<ClashDetection[]>([
    {
      id: 'clash-1',
      type: 'hard',
      severity: 'critical',
      elements: ['HVAC_Duct_001', 'Structural_Beam_045'],
      location: [125.5, 45.2, 12.8],
      description: 'HVAC duct intersects with structural beam',
      status: 'open'
    },
    {
      id: 'clash-2',
      type: 'clearance',
      severity: 'major',
      elements: ['Electrical_Conduit_023', 'HVAC_Duct_007'],
      location: [89.1, 23.7, 8.4],
      description: 'Insufficient clearance between conduit and ductwork',
      status: 'open'
    }
  ]);

  const [selectedLayers, setSelectedLayers] = useState<string[]>(['structure', 'hvac', 'electrical']);

  useEffect(() => {
    const currentViewerRef = viewerRef.current;
    if (!currentViewerRef) return;

    // Initialize Three.js BIM viewer placeholder
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '400px';
    canvas.style.background = 'linear-gradient(to bottom, #e2e8f0, #f8fafc)';
    canvas.style.borderRadius = '8px';
    canvas.style.border = '1px solid #e2e8f0';
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = currentViewerRef.clientWidth;
      canvas.height = 400;
      
      // Draw placeholder BIM scene
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw building outline
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 100, 300, 200);
      
      // Draw floors
      for (let i = 0; i < 5; i++) {
        ctx.strokeRect(50, 100 + (i * 40), 300, 40);
      }
      
      // Add labels
      ctx.fillStyle = '#1e293b';
      ctx.font = '14px system-ui';
      ctx.fillText('3D BIM Model Viewer', canvas.width / 2 - 80, 30);
      ctx.fillText('Interactive model will load here', canvas.width / 2 - 100, canvas.height - 20);
    }
    
    currentViewerRef.appendChild(canvas);
    
    return () => {
      if (currentViewerRef.contains(canvas)) {
        currentViewerRef.removeChild(canvas);
      }
    };
  }, [activeModel]);

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'major': return 'bg-orange-100 text-orange-800'; 
      case 'minor': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing': return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Box className="h-8 w-8 text-amber-600" />
            BIM Viewer
          </h1>
          <p className="text-gray-600 mt-1">3D Building Information Model Management</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Upload className="h-4 w-4" />
            Upload Model
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
            <Layers className="h-4 w-4" />
            Manage Models
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Viewer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Box className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-semibold">3D Model Viewer</h3>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                  <Move3D className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="card-content">
              <div ref={viewerRef} className="w-full h-96 border border-gray-200 rounded-lg bg-white">
                {/* Three.js viewer will be mounted here */}
              </div>
              
              {/* Layer Controls */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-3 text-gray-700">Visible Layers</p>
                <div className="flex flex-wrap gap-2">
                  {['structure', 'hvac', 'electrical', 'plumbing', 'finishes'].map((layer) => (
                    <button
                      key={layer}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                        selectedLayers.includes(layer)
                          ? 'bg-amber-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (selectedLayers.includes(layer)) {
                          setSelectedLayers(selectedLayers.filter(l => l !== layer));
                        } else {
                          setSelectedLayers([...selectedLayers, layer]);
                        }
                      }}
                    >
                      {selectedLayers.includes(layer) ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {layer.charAt(0).toUpperCase() + layer.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Loaded Models</h3>
            </div>
            <div className="card-content space-y-3">
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    activeModel?.id === model.id ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
                  }`}
                  onClick={() => setActiveModel(model)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{model.name}</h4>
                    {getStatusIcon(model.status)}
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">{model.format}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{formatFileSize(model.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Elements:</span>
                      <span>{model.elements?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Version:</span>
                      <span>{model.version}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <h3 className="text-lg font-semibold">Clash Detection</h3>
            </div>
            <div className="card-content space-y-3">
              {clashes.map((clash) => (
                <div key={clash.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(clash.severity)}`}>
                      {clash.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      clash.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {clash.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{clash.description}</p>
                  <div className="text-xs text-gray-600">
                    <div>Type: {clash.type}</div>
                    <div>Elements: {clash.elements.join(', ')}</div>
                    <div>Location: {clash.location.join(', ')}</div>
                  </div>
                </div>
              ))}
              
              <button className="w-full mt-3 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                Run Clash Detection
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="card-content">
            <div className="text-2xl font-bold text-blue-600">3</div>
            <div className="text-sm text-blue-700">Models Loaded</div>
          </div>
        </div>
        <div className="card text-center">
          <div className="card-content">
            <div className="text-2xl font-bold text-green-600">17,580</div>
            <div className="text-sm text-green-700">Total Elements</div>
          </div>
        </div>
        <div className="card text-center">
          <div className="card-content">
            <div className="text-2xl font-bold text-orange-600">2</div>
            <div className="text-sm text-orange-700">Active Clashes</div>
          </div>
        </div>
        <div className="card text-center">
          <div className="card-content">
            <div className="text-2xl font-bold text-purple-600">38.7</div>
            <div className="text-sm text-purple-700">Total Size (MB)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BIMViewer;