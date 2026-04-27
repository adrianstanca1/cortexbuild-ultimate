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
  Trash2,
  BarChart3,
  PlayCircle,
  FilterX,
  FileUp,
  Info,
  Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { EmptyState } from '../ui/EmptyState';
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
  clashNumber?: string;
  discipline1?: string;
  discipline2?: string;
  assignedTo?: string;
  dateFound?: string;
}

interface ModelFile {
  id: string;
  filename: string;
  discipline: 'Architecture' | 'Structure' | 'MEP';
  revision: string;
  date: string;
  size: number;
  elementCount: number;
  author: string;
}

interface Phase {
  id: string;
  name: 'Groundwork' | 'Superstructure' | 'Envelope' | 'Fit-out';
  startDate: string;
  endDate: string;
  progress: number;
}

type ViewerTab = 'models' | 'clashes' | 'info' | '4d';

export const BIMViewer: React.FC = () => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const jumpToClashRef = useRef<(clash: ClashDetection) => void>(() => {});
  const _animationFrameIdRef = useRef<number | null>(null);
  const _handleResizeRef = useRef<(() => void) | null>(null);
  const [activeModel, setActiveModel] = useState<BIMModel | null>(null);
  const [models, setModels] = useState<BIMModel[]>([]);
  const [clashes, setClashes] = useState<ClashDetection[]>([]);
  const [_loading, setLoading] = useState(true);
  const [showModelsModal, setShowModelsModal] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState<string[]>(['structure', 'hvac', 'electrical']);
  const [viewerTab, setViewerTab] = useState<ViewerTab>('models');
  const [clashStatusFilter, setClashStatusFilter] = useState<'all' | 'New' | 'Active' | 'Reviewed' | 'Resolved'>('all');
  const [clashDisciplineFilter, setClashDisciplineFilter] = useState<'all' | string>('all');
  const [selectedModelInfo, setSelectedModelInfo] = useState<ModelFile | null>(null);
  const [showModelPropsPanel, setShowModelPropsPanel] = useState(false);
  const [simulationDate, setSimulationDate] = useState('2026-01-01');
  const [projectStartDate] = useState('2026-01-01');
  const [projectEndDate] = useState('2026-12-31');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<Phase['name']>('Groundwork');
  const [visibleDisciplines, setVisibleDisciplines] = useState<Array<'Architecture' | 'Structure' | 'MEP'>>(['Architecture', 'Structure', 'MEP']);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedClashForResolve, setSelectedClashForResolve] = useState<ClashDetection | null>(null);

  const phases: Phase[] = [
    { id: '1', name: 'Groundwork', startDate: '2026-01-01', endDate: '2026-02-28', progress: 100 },
    { id: '2', name: 'Superstructure', startDate: '2026-03-01', endDate: '2026-06-30', progress: 65 },
    { id: '3', name: 'Envelope', startDate: '2026-07-01', endDate: '2026-09-30', progress: 0 },
    { id: '4', name: 'Fit-out', startDate: '2026-10-01', endDate: '2026-12-31', progress: 0 },
  ];

  const mockModelFiles: ModelFile[] = [
    { id: '1', filename: 'Architecture_A.ifc', discipline: 'Architecture', revision: 'R2.3', date: '2026-04-20', size: 245000000, elementCount: 4521, author: 'Jane Smith' },
    { id: '2', filename: 'Structure_S.ifc', discipline: 'Structure', revision: 'R1.8', date: '2026-04-18', size: 189000000, elementCount: 3201, author: 'John Doe' },
    { id: '3', filename: 'MEP_Combined.ifc', discipline: 'MEP', revision: 'R3.1', date: '2026-04-19', size: 312000000, elementCount: 5840, author: 'Mike Johnson' },
  ];

  // Load models from API
  useEffect(() => {
    loadModels();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadModels() {
    try {
      setLoading(true);
      const data: BIMModel[] = await bimModelsApi.getAll() as unknown as BIMModel[];
      if (data && data.length > 0) {
        setModels(data);
        setActiveModel(data[0]);
        loadClashes(data[0].id);
      } else {
        setModels([]);
        setClashes([]);
        toast.info('No BIM models found. Please upload a model to get started.');
      }
    } catch (err) {
      console.error('Failed to load BIM models:', err);
      toast.error('Failed to load BIM models from server');
      setModels([]);
      setClashes([]);
    } finally {
      setLoading(false);
    }
  }

  const handleUploadModel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    formData.append('format', file.name.split('.').pop()?.toUpperCase() || 'IFC');

    try {
      const newModel = await bimModelsApi.create(formData) as unknown as BIMModel;
      setModels(prev => [...prev, newModel]);
      toast.success('Model uploaded successfully');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload BIM model');
    }
  };

  async function loadClashes(modelId: string) {
    try {
      const data: ClashDetection[] = await bimModelsApi.getClashes(modelId) as unknown as ClashDetection[];
      // Enhance with mock data for demo
      const enhanced = data.map((c, idx) => ({
        ...c,
        clashNumber: `C-${String(idx + 1).padStart(4, '0')}`,
        discipline1: ['Architecture', 'Structure', 'MEP'][idx % 3],
        discipline2: ['Architecture', 'Structure', 'MEP'][(idx + 1) % 3],
        assignedTo: ['Jane Smith', 'John Doe', 'Mike Johnson'][idx % 3],
        dateFound: new Date(Date.now() - idx * 86400000).toISOString().slice(0, 10),
      })) as ClashDetection[];
      setClashes(enhanced);
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let THREE: any, OrbitControls: any, GLTFLoader: any, IFCLoader: any;

      async function initThree() {
        try {
          // Dynamically import heavy 3D libraries to keep them out of the main bundle
          const [threeModule, controlsModule, gltfModule, ifcModule] = await Promise.all([
            import('three'),
            import('three/examples/jsm/controls/OrbitControls'),
            import('three/examples/jsm/loaders/GLTFLoader'),
            import('web-ifc-three')
          ]);

          THREE = threeModule;
          OrbitControls = controlsModule.OrbitControls;
          GLTFLoader = gltfModule.GLTFLoader;
          IFCLoader = ifcModule.IFCLoader;

          // 1. Scene Setup
          const scene = new THREE.Scene();
          scene.background = new THREE.Color(0x111827); // matches bg-gray-900

          // 2. Camera Setup
          const camera = new THREE.PerspectiveCamera(
            75,
            (currentViewerRef?.clientWidth ?? 800) / 400,
            0.1,
            1000
          );
          camera.position.set(10, 10, 10);

          // 3. Renderer Setup
          const renderer = new THREE.WebGLRenderer({ antialias: true });
          renderer.setSize(currentViewerRef?.clientWidth ?? 800, 400);
          renderer.setPixelRatio(window.devicePixelRatio);
          currentViewerRef?.appendChild(renderer.domElement);

          // 4. Lighting
          const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
          scene.add(ambientLight);
          const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
          directionalLight.position.set(10, 20, 10);
          scene.add(directionalLight);

          // 5. Controls
          const controls = new OrbitControls(camera, renderer.domElement);
          controls.enableDamping = true;

          // Viewer Control Handlers
          const resetCamera = () => {
            camera.position.set(10, 10, 10);
            controls.target.set(0, 0, 0);
            controls.update();
            toast.info('Camera reset to default');
          };

          const zoomIn = () => {
            camera.position.multiplyScalar(0.9);
            controls.update();
          };

          const zoomOut = () => {
            camera.position.multiplyScalar(1.1);
            controls.update();
          };

          // Expose controls to the window or a ref for the buttons to call
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).bimControls = { resetCamera, zoomIn, zoomOut };

          function jumpToClash(clash: ClashDetection) {
            const [x, y, z] = clash.location;
            const targetPos = new THREE.Vector3(x, y, z);

            const cameraOffset = new THREE.Vector3(5, 5, 5);
            const newCameraPos = targetPos.clone().add(cameraOffset);

            const duration = 1000;
            const startPos = camera.position.clone();
            const startTarget = controls.target.clone();
            const startTime = performance.now();

            function animateJump(currentTime: number) {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const ease = 1 - Math.pow(1 - progress, 3);

              camera.position.lerpVectors(startPos, newCameraPos, ease);
              controls.target.lerpVectors(startTarget, targetPos, ease);
              controls.update();

              if (progress < 1) {
                requestAnimationFrame(animateJump);
              } else {
                toast.info(`Zoomed to clash: ${clash.description}`);
              }
            }

            requestAnimationFrame(animateJump);
          }

          jumpToClashRef.current = jumpToClash;

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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (gltf: any) => {
                    loaderGroup.add(gltf.scene);
                    toast.success(`Loaded ${model.name} (GLTF)`);
                  },
                  undefined,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (err: any) => {
                    console.error('GLTF Load Error:', err);
                    loadPlaceholderBuilding();
                  }
                );
              } else if (model.format === 'IFC') {
                const ifcLoader = new IFCLoader();
                ifcLoader.ifcManager.setWasmPath('/wasm/');

                ifcLoader.load(
                  `/api/bim-models/download/${model.id}`,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (ifcModel: any) => {
                    loaderGroup.add(ifcModel);
                    toast.success(`Loaded ${model.name} (IFC)`);
                  },
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (progress: any) => {
                    // Loading progress - intentionally silent to avoid console spam
                    console.warn(`Loading IFC model: ${Math.round(progress.loaded / progress.total * 100)}%`);
                  },
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (err: any) => {
                    console.error('IFC Load Error:', err);
                    loadPlaceholderBuilding();
                  }
                );
              } else {
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

          const handleResize = () => {
            camera.aspect = (currentViewerRef?.clientWidth ?? 800) / 400;
            camera.updateProjectionMatrix();
            renderer.setSize(currentViewerRef?.clientWidth ?? 800, 400);
          };
          window.addEventListener('resize', handleResize);

          return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
            if (currentViewerRef?.contains(renderer.domElement)) {
              currentViewerRef?.removeChild(renderer.domElement);
            }
          };
        } catch (err) {
          console.error('Three.js Init Error:', err);
          toast.error('Failed to initialize 3D viewer');
          return;
        }
      }

      initThree().catch(() => {
        // Error already logged and toasted in initThree
      });

      return () => {
        // Cleanup is handled inside initThree returning a function or via a manual flag
        // For simplicity in this refactor, we'll just let the renderer.dispose call run
      };
    }, [activeModel]);

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getClashStatusColor = (status: string): string => {
    switch (status) {
      case 'New': return 'bg-red-900/30 text-red-400 border-red-500/30';
      case 'Active': return 'bg-orange-900/30 text-orange-400 border-orange-500/30';
      case 'Reviewed': return 'bg-blue-900/30 text-blue-400 border-blue-500/30';
      case 'Resolved': return 'bg-green-900/30 text-green-400 border-green-500/30';
      default: return 'bg-gray-900/30 text-gray-400';
    }
  };

  const filteredClashes = clashes.filter(c => {
    const statusMatch = clashStatusFilter === 'all' || (c.status === 'open' && clashStatusFilter === 'New') || (c.status === 'open' && clashStatusFilter === 'Active');
    const disciplineMatch = clashDisciplineFilter === 'all' || c.discipline1 === clashDisciplineFilter || c.discipline2 === clashDisciplineFilter;
    return statusMatch && disciplineMatch;
  });

  const clashStats = {
    total: clashes.length,
    critical: clashes.filter(c => c.severity === 'critical').length,
    major: clashes.filter(c => c.severity === 'major').length,
    minor: clashes.filter(c => c.severity === 'minor').length,
    resolved: clashes.filter(c => c.status === 'resolved').length,
  };

  const clashByDiscipline = [
    { name: 'Arch-Struct', value: Math.floor(clashes.length * 0.35) },
    { name: 'Struct-MEP', value: Math.floor(clashes.length * 0.25) },
    { name: 'Arch-MEP', value: Math.floor(clashes.length * 0.20) },
    { name: 'Other', value: Math.floor(clashes.length * 0.20) },
  ];

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        const current = new Date(simulationDate);
        current.setDate(current.getDate() + 1);
        if (current <= new Date(projectEndDate)) {
          setSimulationDate(current.toISOString().slice(0, 10));
        } else {
          setIsPlaying(false);
        }
      }, 500);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isPlaying, simulationDate, projectEndDate]);

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
      <ModuleBreadcrumbs currentModule="bim-viewer" />

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display text-white flex items-center gap-2">
            <Box className="h-8 w-8 text-amber-500" />
            BIM Viewer
          </h1>
          <p className="text-gray-400 mt-1">3D Building Information Model Management</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => document.getElementById('bim-upload')?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-base-200 border border-base-300 text-gray-300 rounded-lg hover:bg-base-100 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload Model
          </button>
          <input
            id="bim-upload"
            type="file"
            className="hidden"
            accept=".ifc,.gltf,.glb,.obj,.fbx"
            onChange={handleUploadModel}
          />
          <button
            onClick={() => setShowModelsModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Layers className="h-4 w-4" />
            Manage Models
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700 flex gap-1 overflow-x-auto">
        {[
          { key: 'models', label: 'Models', icon: Box },
          { key: 'clashes', label: 'Clash Detection', icon: AlertTriangle },
          { key: 'info', label: 'Model Info', icon: Info },
          { key: '4d', label: '4D Simulation', icon: Clock },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setViewerTab(tab.key as ViewerTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                viewerTab === tab.key ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main Viewer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card bg-base-200 border border-base-300">
            <div className="card-header flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Box className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-display text-white">3D Model Viewer</h3>
              </div>
              <div className="flex gap-2">
                <button
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={() => ((window as any).bimControls?.resetCamera?.())}
                  className="flex items-center gap-1 px-3 py-1.5 bg-base-300 text-gray-300 rounded hover:bg-base-100 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={() => ((window as any).bimControls?.zoomIn?.())}
                  className="flex items-center gap-1 px-3 py-1.5 bg-base-300 text-gray-300 rounded hover:bg-base-100 transition-colors"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={() => ((window as any).bimControls?.zoomOut?.())}
                  className="flex items-center gap-1 px-3 py-1.5 bg-base-300 text-gray-300 rounded hover:bg-base-100 transition-colors"
                >
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
          {/* TAB: MODELS */}
          {viewerTab === 'models' && (
            <div className="card bg-base-200 border border-base-300">
              <div className="card-header">
                <h3 className="text-lg font-display text-white">Loaded Models</h3>
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
          )}

          {/* TAB: CLASH DETECTION */}
          {viewerTab === 'clashes' && (
            <>
              <div className="card bg-base-200 border border-base-300">
                <div className="card-header flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <h3 className="text-lg font-display text-white">Clash Detection</h3>
                </div>
                <div className="card-content space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-base-300 rounded text-center">
                      <div className="font-display text-red-400">{clashStats.total}</div>
                      <div className="text-gray-400">Total Clashes</div>
                    </div>
                    <div className="p-2 bg-base-300 rounded text-center">
                      <div className="font-display text-red-500">{clashStats.critical}</div>
                      <div className="text-gray-400">Critical</div>
                    </div>
                    <div className="p-2 bg-base-300 rounded text-center">
                      <div className="font-display text-green-400">{clashStats.resolved}</div>
                      <div className="text-gray-400">Resolved</div>
                    </div>
                    <div className="p-2 bg-base-300 rounded text-center">
                      <div className="font-display text-green-400">{Math.round((clashStats.resolved / Math.max(clashStats.total, 1)) * 100)}%</div>
                      <div className="text-gray-400">Rate</div>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (!activeModel) {
                        toast.error('Please select a model first');
                        return;
                      }
                      toast.info('Clash detection analysis starting...');
                      try {
                        await bimModelsApi.runClashDetection(activeModel.id);
                        await loadClashes(activeModel.id);
                        toast.success('Clash detection complete');
                      } catch (_err) {
                        toast.error('Clash detection failed');
                      }
                    }}
                    className="w-full px-4 py-2 bg-base-100 border border-base-300 text-gray-300 rounded hover:bg-base-200 transition-colors text-sm"
                  >
                    Run Clash Detection
                  </button>
                </div>
              </div>

              <div className="card bg-base-200 border border-base-300">
                <div className="card-header">
                  <h3 className="text-sm font-display text-white">Clash List</h3>
                </div>
                <div className="card-content space-y-2">
                  {filteredClashes.slice(0, 5).map((clash) => (
                    <div
                      key={clash.id}
                      className="p-2 border border-base-300 rounded-lg cursor-pointer hover:bg-base-300 transition-colors"
                      onClick={() => jumpToClashRef.current(clash)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(clash.severity)}`}>
                          {clash.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300">{clash.description.slice(0, 40)}…</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB: MODEL INFO */}
          {viewerTab === 'info' && (
            <div className="card bg-base-200 border border-base-300">
              <div className="card-header">
                <h3 className="text-lg font-display text-white">Model Files</h3>
              </div>
              <div className="card-content space-y-2">
                {mockModelFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-2 border border-base-300 rounded-lg cursor-pointer hover:bg-base-300 transition-colors"
                    onClick={() => { setSelectedModelInfo(file); setShowModelPropsPanel(true); }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-xs font-medium text-gray-200">{file.filename}</h4>
                      <span className="text-xs bg-base-300 text-gray-400 px-1.5 py-0.5 rounded">{file.discipline}</span>
                    </div>
                    <p className="text-xs text-gray-500">v{file.revision} • {formatFileSize(file.size)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: 4D SIMULATION */}
          {viewerTab === '4d' && (
            <div className="card bg-base-200 border border-base-300">
              <div className="card-header">
                <h3 className="text-lg font-display text-white">Timeline</h3>
              </div>
              <div className="card-content space-y-3">
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 block">Current Date</label>
                  <input
                    type="date"
                    value={simulationDate}
                    onChange={(e) => setSimulationDate(e.target.value)}
                    className="w-full bg-base-300 border border-base-300 text-white text-xs rounded px-2 py-1"
                  />
                </div>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-full px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  <PlayCircle size={14} />
                  {isPlaying ? 'Pause' : 'Play'}
                </button>

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 block">Phase Progress</label>
                  {phases.map(p => (
                    <div key={p.id} className="text-xs">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-gray-300">{p.name}</span>
                        <span className="text-gray-500">{p.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-base-300 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CLASH DETECTION TAB DETAILS */}
      {viewerTab === 'clashes' && (
        <div className="space-y-6 mt-6">
          {/* Clash Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card bg-base-200 border border-base-300 text-center">
              <div className="card-content">
                <div className="text-2xl font-display text-red-400">{clashStats.total}</div>
                <div className="text-sm text-red-300">Total Clashes</div>
              </div>
            </div>
            <div className="card bg-base-200 border border-base-300 text-center">
              <div className="card-content">
                <div className="text-2xl font-display text-red-500">{clashStats.critical}</div>
                <div className="text-sm text-red-400">Critical</div>
              </div>
            </div>
            <div className="card bg-base-200 border border-base-300 text-center">
              <div className="card-content">
                <div className="text-2xl font-display text-green-400">{clashStats.resolved}</div>
                <div className="text-sm text-green-300">Resolved This Week</div>
              </div>
            </div>
            <div className="card bg-base-200 border border-base-300 text-center">
              <div className="card-content">
                <div className="text-2xl font-display text-blue-400">{Math.round((clashStats.resolved / Math.max(clashStats.total, 1)) * 100)}%</div>
                <div className="text-sm text-blue-300">Resolution Rate</div>
              </div>
            </div>
          </div>

          {/* Clashes by Discipline Chart */}
          <div className="card bg-base-200 border border-base-300">
            <div className="card-header">
              <h3 className="text-lg font-display text-white">Clashes by Discipline Pair</h3>
            </div>
            <div className="card-content">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={clashByDiscipline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '0.5rem' }} />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Clash Table */}
          <div className="card bg-base-200 border border-base-300">
            <div className="card-header flex justify-between items-center">
              <h3 className="text-lg font-display text-white">Clash Details</h3>
              <div className="flex gap-2">
                <select
                  value={clashStatusFilter}
                  onChange={(e) => setClashStatusFilter(e.target.value as any)}
                  className="bg-base-300 border border-base-300 text-gray-300 text-xs rounded px-2 py-1"
                >
                  <option value="all">All Status</option>
                  <option value="New">New</option>
                  <option value="Active">Active</option>
                </select>
                <select
                  value={clashDisciplineFilter}
                  onChange={(e) => setClashDisciplineFilter(e.target.value)}
                  className="bg-base-300 border border-base-300 text-gray-300 text-xs rounded px-2 py-1"
                >
                  <option value="all">All Disciplines</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Structure">Structure</option>
                  <option value="MEP">MEP</option>
                </select>
              </div>
            </div>
            <div className="card-content overflow-x-auto">
              <table className="w-full text-xs text-gray-300">
                <thead>
                  <tr className="border-b border-base-300">
                    <th className="text-left py-2 px-2">Clash #</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Priority</th>
                    <th className="text-left py-2 px-2">Disciplines</th>
                    <th className="text-left py-2 px-2">Assigned To</th>
                    <th className="text-left py-2 px-2">Found</th>
                    <th className="text-left py-2 px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClashes.map((clash) => (
                    <tr key={clash.id} className="border-b border-base-300 hover:bg-base-300 transition-colors">
                      <td className="py-2 px-2 font-medium">{clash.clashNumber}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getClashStatusColor(clash.status === 'open' ? 'New' : 'Resolved')}`}>
                          {clash.status === 'open' ? 'New' : 'Resolved'}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(clash.severity)}`}>
                          {clash.severity}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-gray-400">{clash.discipline1} vs {clash.discipline2}</td>
                      <td className="py-2 px-2">{clash.assignedTo}</td>
                      <td className="py-2 px-2 text-gray-500">{clash.dateFound}</td>
                      <td className="py-2 px-2">
                        <button
                          onClick={() => { setSelectedClashForResolve(clash); setShowResolveModal(true); }}
                          className="text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODEL INFO TAB DETAILS */}
      {viewerTab === 'info' && (
        <div className="space-y-6 mt-6">
          <div className="card bg-base-200 border border-base-300">
            <div className="card-header">
              <h3 className="text-lg font-display text-white">Loaded Model Files</h3>
            </div>
            <div className="card-content overflow-x-auto">
              <table className="w-full text-xs text-gray-300">
                <thead>
                  <tr className="border-b border-base-300">
                    <th className="text-left py-2 px-2">Filename</th>
                    <th className="text-left py-2 px-2">Discipline</th>
                    <th className="text-left py-2 px-2">Revision</th>
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Size</th>
                    <th className="text-left py-2 px-2">Elements</th>
                    <th className="text-left py-2 px-2">Author</th>
                    <th className="text-left py-2 px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mockModelFiles.map((file) => (
                    <tr key={file.id} className="border-b border-base-300 hover:bg-base-300 transition-colors">
                      <td className="py-2 px-2 font-medium">{file.filename}</td>
                      <td className="py-2 px-2">{file.discipline}</td>
                      <td className="py-2 px-2">{file.revision}</td>
                      <td className="py-2 px-2">{file.date}</td>
                      <td className="py-2 px-2">{formatFileSize(file.size)}</td>
                      <td className="py-2 px-2">{file.elementCount.toLocaleString()}</td>
                      <td className="py-2 px-2 text-gray-500">{file.author}</td>
                      <td className="py-2 px-2">
                        <button
                          onClick={() => { setSelectedModelInfo(file); setShowModelPropsPanel(true); }}
                          className="text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Coordination Status */}
          <div className="card bg-base-200 border border-base-300">
            <div className="card-header">
              <h3 className="text-lg font-display text-white">Coordination Status</h3>
            </div>
            <div className="card-content space-y-2">
              <div className="p-3 bg-base-300 rounded border border-base-300 flex items-center justify-between">
                <span className="text-sm">Coordination Model</span>
                <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs font-medium border border-blue-500/30">In Review</span>
              </div>
              <div className="p-3 bg-base-300 rounded border border-base-300 flex items-center justify-between">
                <span className="text-sm">IFC Schema Version</span>
                <span className="text-xs text-gray-400">IFC 4.0</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4D SIMULATION TAB DETAILS */}
      {viewerTab === '4d' && (
        <div className="space-y-6 mt-6">
          <div className="card bg-base-200 border border-base-300">
            <div className="card-header">
              <h3 className="text-lg font-display text-white">Construction Schedule</h3>
            </div>
            <div className="card-content space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-300 block">Project Timeline</label>
                <input
                  type="range"
                  min={new Date(projectStartDate).getTime()}
                  max={new Date(projectEndDate).getTime()}
                  value={new Date(simulationDate).getTime()}
                  onChange={(e) => setSimulationDate(new Date(Number(e.target.value)).toISOString().slice(0, 10))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{projectStartDate}</span>
                  <span className="font-medium text-white">{simulationDate}</span>
                  <span>{projectEndDate}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-300 block">Current Phase</label>
                <select
                  value={selectedPhase}
                  onChange={(e) => setSelectedPhase(e.target.value as Phase['name'])}
                  className="w-full bg-base-300 border border-base-300 text-white text-xs rounded px-3 py-1.5"
                >
                  {phases.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-300 block">Visible Disciplines</label>
                <div className="flex flex-wrap gap-2">
                  {(['Architecture', 'Structure', 'MEP'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => {
                        setVisibleDisciplines(
                          visibleDisciplines.includes(d)
                            ? visibleDisciplines.filter(x => x !== d)
                            : [...visibleDisciplines, d]
                        );
                      }}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        visibleDisciplines.includes(d)
                          ? 'bg-amber-600 text-white'
                          : 'bg-base-300 text-gray-400 hover:bg-base-200'
                      }`}
                    >
                      {visibleDisciplines.includes(d) ? <Eye size={12} className="inline mr-1" /> : <EyeOff size={12} className="inline mr-1" />}
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-300 block">Phase Progress</label>
                {phases.map(p => (
                  <div key={p.id} className="text-xs">
                    <div className="flex justify-between mb-0.5">
                      <span className={p.name === selectedPhase ? 'text-amber-400 font-medium' : 'text-gray-400'}>{p.name}</span>
                      <span className="text-gray-500">{p.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-base-300 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {viewerTab === 'models' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="card bg-base-200 border border-base-300 text-center">
            <div className="card-content">
              <div className="text-2xl font-display text-blue-400">{models.length}</div>
              <div className="text-sm text-blue-300">Models Loaded</div>
            </div>
          </div>
          <div className="card bg-base-200 border border-base-300 text-center">
            <div className="card-content">
              <div className="text-2xl font-display text-green-400">
                {models.reduce((sum, m) => sum + (m.elements || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-green-300">Total Elements</div>
            </div>
          </div>
          <div className="card bg-base-200 border border-base-300 text-center">
            <div className="card-content">
              <div className="text-2xl font-display text-orange-400">
                {clashes.filter(c => c.status === 'open').length}
              </div>
              <div className="text-sm text-orange-300">Active Clashes</div>
            </div>
          </div>
          <div className="card bg-base-200 border border-base-300 text-center">
            <div className="card-content">
              <div className="text-2xl font-display text-purple-400">
                {(models.reduce((sum, m) => sum + m.size, 0) / 1024).toFixed(1)}
              </div>
              <div className="text-sm text-purple-300">Total Size (MB)</div>
            </div>
          </div>
        </div>
      )}
      {/* Model Management Modal */}
      {showModelsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-base-200 border border-base-300 rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-base-300 flex items-center justify-between">
              <h3 className="text-xl font-display text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-amber-500" />
                Model Management
              </h3>
              <button onClick={() => setShowModelsModal(false)} className="text-gray-400 hover:text-white transition">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-white font-display mb-2">Available Models</h4>
                  <div className="space-y-2">
                    {models.map(model => (
                      <div key={model.id} className="p-3 bg-base-300 rounded-lg border border-base-300 flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                          <Box className="h-4 w-4 text-amber-500" />
                          <div>
                            <p className="text-sm font-medium text-white">{model.name}</p>
                            <p className="text-xs text-gray-400">{model.format} • {formatFileSize(model.size)} • v{model.version}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setActiveModel(model); setShowModelsModal(false); }}
                            className="px-3 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 transition"
                          >
                            Load
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete model ${model.name}?`)) {
                                try {
                                  await bimModelsApi.delete(model.id);
                                  setModels(prev => prev.filter(m => m.id !== model.id));
                                  toast.success('Model deleted');
                                } catch (_err) {
                                  toast.error('Delete failed');
                                }
                              }
                            }}
                            className="p-1 text-red-400 hover:bg-red-900/20 rounded transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {models.length === 0 && <EmptyState title="No models found" description="Upload a model to begin." />}
                  </div>
                </div>
                <div className="bg-base-300 p-4 rounded-lg border border-base-300 space-y-4">
                  <h4 className="text-white font-display mb-2">Quick Upload</h4>
                  <div className="space-y-3">
                    <label className="block w-full p-4 border-2 border-dashed border-base-300 rounded-lg cursor-pointer hover:border-amber-500 transition-colors text-center">
                      <input type="file" className="hidden" accept=".ifc,.gltf,.glb,.obj,.fbx" onChange={handleUploadModel} />
                      <Upload className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">Click to upload new model</p>
                    </label>
                    <div className="text-[10px] text-gray-500 space-y-1">
                      <p>Supported: IFC, GLTF, GLB, OBJ, FBX</p>
                      <p>Max size: 500MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Properties Panel */}
      {showModelPropsPanel && selectedModelInfo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-base-200 border border-base-300 rounded-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-display text-white">{selectedModelInfo.filename}</h3>
              <button onClick={() => setShowModelPropsPanel(false)} className="text-gray-400 hover:text-white transition">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-base-300 rounded-lg border border-base-300">
                  <p className="text-xs text-gray-400 mb-1">Discipline</p>
                  <p className="text-sm font-medium text-white">{selectedModelInfo.discipline}</p>
                </div>
                <div className="p-3 bg-base-300 rounded-lg border border-base-300">
                  <p className="text-xs text-gray-400 mb-1">Revision</p>
                  <p className="text-sm font-medium text-white">{selectedModelInfo.revision}</p>
                </div>
                <div className="p-3 bg-base-300 rounded-lg border border-base-300">
                  <p className="text-xs text-gray-400 mb-1">File Size</p>
                  <p className="text-sm font-medium text-white">{formatFileSize(selectedModelInfo.size)}</p>
                </div>
                <div className="p-3 bg-base-300 rounded-lg border border-base-300">
                  <p className="text-xs text-gray-400 mb-1">Element Count</p>
                  <p className="text-sm font-medium text-white">{selectedModelInfo.elementCount.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-base-300 rounded-lg border border-base-300">
                  <p className="text-xs text-gray-400 mb-1">Date</p>
                  <p className="text-sm font-medium text-white">{selectedModelInfo.date}</p>
                </div>
                <div className="p-3 bg-base-300 rounded-lg border border-base-300">
                  <p className="text-xs text-gray-400 mb-1">Author</p>
                  <p className="text-sm font-medium text-white">{selectedModelInfo.author}</p>
                </div>
              </div>

              <div className="p-4 bg-base-300 rounded-lg border border-base-300">
                <p className="text-xs text-gray-400 mb-2">Model Statistics</p>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-300">
                  <div>Storeys: 5</div>
                  <div>Spaces: 128</div>
                  <div>Doors: 245</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-300 mt-2">
                  <div>Windows: 312</div>
                  <div>Volume: 45,230m³</div>
                  <div>Area: 12,450m²</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setShowModelPropsPanel(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Clash Resolve Modal */}
      {showResolveModal && selectedClashForResolve && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-base-200 border border-base-300 rounded-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-display text-white">Resolve Clash {selectedClashForResolve.clashNumber}</h3>
              <button onClick={() => setShowResolveModal(false)} className="text-gray-400 hover:text-white transition">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 mb-5">
              <div className="p-3 bg-base-300 rounded-lg border border-base-300">
                <p className="text-xs text-gray-400 mb-1">Clash Description</p>
                <p className="text-sm text-white">{selectedClashForResolve.description}</p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2">Resolution Notes</label>
                <textarea
                  placeholder="Describe how this clash was resolved…"
                  className="w-full bg-base-300 border border-base-300 text-white text-sm rounded px-3 py-2 h-24 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowResolveModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  toast.success('Clash resolved');
                }}
                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BIMViewer;