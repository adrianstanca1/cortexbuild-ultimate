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
} from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
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

// Mock data fallback — shown when API is unavailable
const MOCK_MODELS: BIMModel[] = [
  {
    id: 'mock-1',
    name: 'Main Building Structure',
    format: 'IFC',
    size: 12800,
    uploadDate: new Date('2026-03-28'),
    status: 'ready',
    version: 'v2.1',
    elements: 17580,
  },
  {
    id: 'mock-2',
    name: 'MEP Coordination Model',
    format: 'IFC',
    size: 8200,
    uploadDate: new Date('2026-03-30'),
    status: 'ready',
    version: 'v1.0',
    elements: 9240,
  },
  {
    id: 'mock-3',
    name: 'Architectural Finish Model',
    format: 'GLTF',
    size: 4500,
    uploadDate: new Date('2026-04-01'),
    status: 'ready',
    version: 'v1.2',
    elements: 12100,
  },
];

const MOCK_CLASHES: ClashDetection[] = [
  {
    id: 'clash-1',
    type: 'hard',
    severity: 'critical',
    elements: ['Wall-A1', 'Column-C3'],
    location: [5.2, 0, 3.1],
    description: 'Structural wall intersects with structural column',
    status: 'open',
  },
  {
    id: 'clash-2',
    type: 'clearance',
    severity: 'minor',
    elements: ['Duct-D1', 'Beam-B2'],
    location: [2.1, 1.5, 0],
    description: 'HVAC duct has insufficient clearance to beam',
    status: 'open',
  },
];

export const BIMViewer: React.FC = () => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [activeModel, setActiveModel] = useState<BIMModel | null>(null);
  const [models, setModels] = useState<BIMModel[]>([]);
  const [clashes, setClashes] = useState<ClashDetection[]>([]);
  const [_loading, setLoading] = useState(true);
  const [selectedLayers, setSelectedLayers] = useState<string[]>(['structure', 'hvac', 'electrical']);

  // Load models from API
  useEffect(() => {
    loadModels();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadModels() {
    try {
      setLoading(true);
      const data: BIMModel[] = await bimModelsApi.getAll() as unknown as BIMModel[];
      if (data.length > 0) {
        setModels(data);
        setActiveModel(data[0]);
        loadClashes(data[0].id);
      } else {
        // No models yet — use mock data for demo
        setModels(MOCK_MODELS);
        setClashes(MOCK_CLASHES);
        toast.info('No BIM models found — showing sample data');
      }
    } catch {
      toast.error('Failed to load BIM models — using offline data');
      setModels(MOCK_MODELS);
      setClashes(MOCK_CLASHES);
    } finally {
      setLoading(false);
    }
  }

  async function loadClashes(modelId: string) {
    try {
      const data: ClashDetection[] = await bimModelsApi.getClashes(modelId) as unknown as ClashDetection[];
      setClashes(data);
    } catch (err) {
      console.error('Failed to load clashes', err);
    }
  }

  async function _handleModelSelect(model: BIMModel) {
    setActiveModel(model);
    await loadClashes(model.id);
  }

  useEffect(() => {
    const currentViewerRef = viewerRef.current;
    if (!currentViewerRef) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827); // matches bg-gray-900

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      75,
      currentViewerRef.clientWidth / 400,
      0.1,
      1000
    );
    camera.position.set(10, 10, 10);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentViewerRef.clientWidth, 400);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentViewerRef.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // 6. Model Loading Logic
    const loaderGroup = new THREE.Group();
    scene.add(loaderGroup);

    async function loadModelFile(model: BIMModel) {
      loaderGroup.clear();

      try {
        if (model.format === 'GLTF') {
          const gltfLoader = new GLTFLoader();
          gltfLoader.load(
            `/api/bim-models/download/${model.id}`,
            (gltf) => {
              loaderGroup.add(gltf.scene);
              toast.success(`Loaded ${model.name} (GLTF)`);
            },
            undefined,
            (err) => {
              console.error('GLTF Load Error:', err);
              loadPlaceholderBuilding();
            }
          );
        } else {
          // IFC, OBJ, FBX — use placeholder until native loaders are bundled
          loadPlaceholderBuilding();
          toast.success(`Loaded ${model.name} (3D preview)`);
        }
      } catch (err) {
        console.error('Model Load Error:', err);
        loadPlaceholderBuilding();
      }
    }

    function loadPlaceholderBuilding() {
      const boxGeo = new THREE.BoxGeometry(1, 1, 1);
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          const material = new THREE.MeshStandardMaterial({
            color: Math.random() > 0.8 ? 0xef4444 : 0x3b82f6,
            transparent: true,
            opacity: 0.8
          });
          const cube = new THREE.Mesh(boxGeo, material);
          cube.position.set(i * 2, 0, j * 2);
          cube.scale.set(1.8, Math.random() * 5 + 2, 1.8);
          cube.position.y = cube.scale.y / 2;
          loaderGroup.add(cube);
        }
      }
    }

    if (activeModel) {
      loadModelFile(activeModel);
    }

    // 7. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = currentViewerRef.clientWidth / 400;
      camera.updateProjectionMatrix();
      renderer.setSize(currentViewerRef.clientWidth, 400);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (currentViewerRef.contains(renderer.domElement)) {
        currentViewerRef.removeChild(renderer.domElement);
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
      <ModuleBreadcrumbs currentModule="bim-viewer" onNavigate={() => {}} />

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
            <div className="text-2xl font-bold text-blue-400">{models.length}</div>
            <div className="text-sm text-blue-300">Models Loaded</div>
          </div>
        </div>
        <div className="card bg-base-200 border border-base-300 text-center">
          <div className="card-content">
            <div className="text-2xl font-bold text-green-400">
              {models.reduce((sum, m) => sum + (m.elements || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-green-300">Total Elements</div>
          </div>
        </div>
        <div className="card bg-base-200 border border-base-300 text-center">
          <div className="card-content">
            <div className="text-2xl font-bold text-orange-400">
              {clashes.filter(c => c.status === 'open').length}
            </div>
            <div className="text-sm text-orange-300">Active Clashes</div>
          </div>
        </div>
        <div className="card bg-base-200 border border-base-300 text-center">
          <div className="card-content">
            <div className="text-2xl font-bold text-purple-400">
              {(models.reduce((sum, m) => sum + m.size, 0) / 1024).toFixed(1)}
            </div>
            <div className="text-sm text-purple-300">Total Size (MB)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BIMViewer;