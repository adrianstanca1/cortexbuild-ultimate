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
  Box,
  X,
  Loader2,
  Trash2,
  Edit,
  Check,
} from 'lucide-react';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { bimModelsApi } from '../../services/api';
import { toast } from 'sonner';

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
  const [models, setModels] = useState<BIMModel[]>([]);
  const [clashes, setClashes] = useState<ClashDetection[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState<string[]>(['structure', 'hvac', 'electrical']);

  // Load models from API
  useEffect(() => {
    loadModels();
  }, []);

  async function loadModels() {
    try {
      setLoading(true);
      const data: any[] = await bimModelsApi.getAll();
      const transformed = data.map((m: any) => ({
        id: m.id,
        name: m.name,
        format: m.format as 'IFC' | 'OBJ' | 'GLTF' | 'FBX',
        size: m.file_size || 0,
        uploadDate: new Date(m.created_at),
        status: m.status as 'processing' | 'ready' | 'error',
        version: m.version || 'v1.0',
        elements: m.elements_count || 0,
      }));
      setModels(transformed);
      if (transformed.length > 0 && !activeModel) {
        setActiveModel(transformed[0]);
        loadClashes(transformed[0].id);
      }
    } catch (err) {
      console.error('Failed to load BIM models', err);
      toast.error('Failed to load BIM models');
    } finally {
      setLoading(false);
    }
  }

  async function loadClashes(modelId: string) {
    try {
      const data: any[] = await bimModelsApi.getClashes(modelId);
      const transformed = data.map((c: any) => ({
        id: c.id,
        type: c.clash_type as 'hard' | 'soft' | 'clearance',
        severity: c.severity as 'critical' | 'major' | 'minor',
        elements: [c.element_a_name, c.element_b_name].filter(Boolean),
        location: [c.location_x, c.location_y, c.location_z] as [number, number, number],
        description: c.description,
        status: c.status as 'open' | 'resolved' | 'ignored',
      }));
      setClashes(transformed);
    } catch (err) {
      console.error('Failed to load clashes', err);
    }
  }

  async function handleModelSelect(model: BIMModel) {
    setActiveModel(model);
    await loadClashes(model.id);
  }

  useEffect(() => {
    const currentViewerRef = viewerRef.current;
    if (!currentViewerRef) return;

    // Initialize Three.js BIM viewer placeholder
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '400px';
    canvas.style.background = 'linear-gradient(to bottom, #1f2937, #111827)';
    canvas.style.borderRadius = '8px';
    canvas.style.border = '1px solid #374151';

    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = currentViewerRef.clientWidth;
      canvas.height = 400;

      // Draw placeholder BIM scene
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw building outline
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 100, 300, 200);

      // Draw floors
      for (let i = 0; i < 5; i++) {
        ctx.strokeRect(50, 100 + (i * 40), 300, 40);
      }

      // Add labels
      ctx.fillStyle = '#f3f4f6';
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
      case 'critical': return 'bg-red-900/30 text-red-400';
      case 'major': return 'bg-orange-900/30 text-orange-400';
      case 'minor': return 'bg-yellow-900/30 text-yellow-400';
      default: return 'bg-gray-900/30 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'processing': return <div className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-base-300 min-h-screen">
      {/* Breadcrumbs */}
      <ModuleBreadcrumbs currentModule="bim" onNavigate={() => {}} />

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Box className="h-8 w-8 text-amber-500" />
            BIM Viewer
          </h1>
          <p className="text-gray-400 mt-1">3D Building Information Model Management</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-base-200 border border-base-300 text-gray-300 rounded-lg hover:bg-base-100 transition-colors">
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
          <div className="card bg-base-200 border border-base-300">
            <div className="card-header flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Box className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-white">3D Model Viewer</h3>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 bg-base-300 text-gray-300 rounded hover:bg-base-100 transition-colors">
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-base-300 text-gray-300 rounded hover:bg-base-100 transition-colors">
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-base-300 text-gray-300 rounded hover:bg-base-100 transition-colors">
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-base-300 text-gray-300 rounded hover:bg-base-100 transition-colors">
                  <Move3D className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="card-content">
              <div ref={viewerRef} className="w-full h-96 border border-base-300 rounded-lg bg-base-300">
                {/* Three.js viewer will be mounted here */}
              </div>

              {/* Layer Controls */}
              <div className="mt-4 p-4 bg-base-300 rounded-lg">
                <p className="text-sm font-medium mb-3 text-gray-300">Visible Layers</p>
                <div className="flex flex-wrap gap-2">
                  {['structure', 'hvac', 'electrical', 'plumbing', 'finishes'].map((layer) => (
                    <button
                      key={layer}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                        selectedLayers.includes(layer)
                          ? 'bg-amber-600 text-white'
                          : 'bg-base-200 border border-base-300 text-gray-300 hover:bg-base-100'
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
          <div className="card bg-base-200 border border-base-300">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-white">Loaded Models</h3>
            </div>
            <div className="card-content space-y-3">
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-base-300 ${
                    activeModel?.id === model.id ? 'border-amber-500 bg-amber-900/20' : 'border-base-300'
                  }`}
                  onClick={() => setActiveModel(model)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm text-gray-200">{model.name}</h4>
                    {getStatusIcon(model.status)}
                  </div>
                  <div className="space-y-1 text-xs text-gray-400">
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <span className="px-2 py-0.5 bg-base-300 text-gray-300 rounded text-xs">{model.format}</span>
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

          <div className="card bg-base-200 border border-base-300">
            <div className="card-header flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <h3 className="text-lg font-semibold text-white">Clash Detection</h3>
            </div>
            <div className="card-content space-y-3">
              {clashes.map((clash) => (
                <div key={clash.id} className="p-3 border border-base-300 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(clash.severity)}`}>
                      {clash.severity}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      clash.status === 'open' ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'
                    }`}>
                      {clash.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{clash.description}</p>
                  <div className="text-xs text-gray-400">
                    <div>Type: {clash.type}</div>
                    <div>Elements: {clash.elements.join(', ')}</div>
                    <div>Location: {clash.location.join(', ')}</div>
                  </div>
                </div>
              ))}

              <button className="w-full mt-3 px-4 py-2 bg-base-200 border border-base-300 text-gray-300 rounded hover:bg-base-100 transition-colors">
                Run Clash Detection
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-base-200 border border-base-300 text-center">
          <div className="card-content">
            <div className="text-2xl font-bold text-blue-400">3</div>
            <div className="text-sm text-blue-300">Models Loaded</div>
          </div>
        </div>
        <div className="card bg-base-200 border border-base-300 text-center">
          <div className="card-content">
            <div className="text-2xl font-bold text-green-400">17,580</div>
            <div className="text-sm text-green-300">Total Elements</div>
          </div>
        </div>
        <div className="card bg-base-200 border border-base-300 text-center">
          <div className="card-content">
            <div className="text-2xl font-bold text-orange-400">2</div>
            <div className="text-sm text-orange-300">Active Clashes</div>
          </div>
        </div>
        <div className="card bg-base-200 border border-base-300 text-center">
          <div className="card-content">
            <div className="text-2xl font-bold text-purple-400">38.7</div>
            <div className="text-sm text-purple-300">Total Size (MB)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BIMViewer;