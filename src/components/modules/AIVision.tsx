import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, Eye, AlertTriangle, CheckCircle2, Shield, 
  AlertOctagon, Play, Pause, Zap, ScanLine, 
  Target, Activity, Upload, Image as ImageIcon, 
  Maximize2, X, CheckSquare, ArrowRight, FileText,
  Download, RefreshCw, Settings, Filter
} from 'lucide-react';

type AnalysisMode = 'SAFETY' | 'QUALITY' | 'PROGRESS';

interface Detection {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'PASS';
  title: string;
  description: string;
  recommendation: string;
  coordinates?: { x: number, y: number, w: number, h: number };
  confidence: number;
}

interface AnalysisResult {
  detections: Detection[];
  summary: {
    total: number;
    critical: number;
    warnings: number;
    passed: number;
  };
  processedAt: string;
}

const AIVision: React.FC = () => {
  // Camera and Analysis State
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<AnalysisMode>('SAFETY');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  
  // File Upload State
  const [staticImage, setStaticImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Filter State
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO' | 'PASS'>('ALL');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('ALL');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera Management
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }, 
          facingMode: 'environment' 
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsActive(true);
        
        // Start periodic analysis
        intervalRef.current = window.setInterval(captureAndAnalyze, 5000);
      }
    } catch (error) {
      setCameraError('Camera access denied or unavailable');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
  };

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Capture frame
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    
    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Analyze image
    await analyzeImage(imageData);
  }, [mode]);

  // Image Analysis
  const analyzeImage = async (imageData: string) => {
    setIsProcessing(true);
    
    try {
      // Simulate AI vision analysis - in production, call your AI service
      const mockDetections = generateMockDetections(mode);
      
      const result: AnalysisResult = {
        detections: mockDetections,
        summary: {
          total: mockDetections.length,
          critical: mockDetections.filter(d => d.severity === 'CRITICAL').length,
          warnings: mockDetections.filter(d => d.severity === 'WARNING').length,
          passed: mockDetections.filter(d => d.severity === 'PASS').length,
        },
        processedAt: new Date().toISOString()
      };
      
      setAnalysisResults(prev => [result, ...prev.slice(0, 19)]); // Keep last 20 results
      
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Mock detection generator based on analysis mode
  const generateMockDetections = (analysisMode: AnalysisMode): Detection[] => {
    const baseDetections = {
      SAFETY: [
        {
          severity: 'CRITICAL' as const,
          title: 'Worker without hard hat detected',
          description: 'Construction worker observed in active zone without required head protection',
          recommendation: 'Ensure all personnel wear approved hard hats in designated areas'
        },
        {
          severity: 'WARNING' as const,
          title: 'Unsecured scaffolding',
          description: 'Scaffolding structure appears to lack proper securing mechanisms',
          recommendation: 'Inspect and secure scaffolding according to safety standards'
        },
        {
          severity: 'PASS' as const,
          title: 'Proper safety signage visible',
          description: 'Safety warning signs are clearly visible and appropriately placed',
          recommendation: 'Continue maintaining good safety signage practices'
        }
      ],
      QUALITY: [
        {
          severity: 'WARNING' as const,
          title: 'Surface finish inconsistency',
          description: 'Variation in concrete surface texture detected',
          recommendation: 'Review finishing techniques and ensure consistent application'
        },
        {
          severity: 'INFO' as const,
          title: 'Material placement verified',
          description: 'Construction materials are properly positioned according to specifications',
          recommendation: 'Maintain current material handling procedures'
        }
      ],
      PROGRESS: [
        {
          severity: 'INFO' as const,
          title: 'Foundation work 75% complete',
          description: 'Foundation construction is progressing according to schedule',
          recommendation: 'Continue current pace to meet project milestones'
        },
        {
          severity: 'WARNING' as const,
          title: 'Potential schedule delay detected',
          description: 'Current work rate may impact planned completion date',
          recommendation: 'Consider additional resources to maintain schedule'
        }
      ]
    };

    return baseDetections[analysisMode].map((det, index) => ({
      id: `${analysisMode}-${Date.now()}-${index}`,
      timestamp: new Date().toLocaleTimeString(),
      ...det,
      confidence: 0.85 + Math.random() * 0.15, // 85-100% confidence
      coordinates: {
        x: Math.random() * 0.8,
        y: Math.random() * 0.8,
        w: 0.1 + Math.random() * 0.1,
        h: 0.1 + Math.random() * 0.1
      }
    }));
  };

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setStaticImage(result);
        analyzeImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setStaticImage(result);
        analyzeImage(result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  // Filter results
  const filteredResults = analysisResults.filter(result => {
    if (severityFilter === 'ALL') return true;
    return result.detections.some(d => d.severity === severityFilter);
  });

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const getSeverityColor = (severity: Detection['severity']) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      case 'WARNING': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'INFO': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'PASS': return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getSeverityIcon = (severity: Detection['severity']) => {
    switch (severity) {
      case 'CRITICAL': return <AlertOctagon className="h-4 w-4" />;
      case 'WARNING': return <AlertTriangle className="h-4 w-4" />;
      case 'INFO': return <Eye className="h-4 w-4" />;
      case 'PASS': return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ScanLine className="h-8 w-8 text-blue-600" />
            AI Vision Analytics
          </h1>
          <p className="text-gray-600 mt-1">Real-time construction site monitoring and analysis</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Analysis Mode Selector */}
          <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
            {(['SAFETY', 'QUALITY', 'PROGRESS'] as AnalysisMode[]).map((modeOption) => (
              <button
                key={modeOption}
                onClick={() => setMode(modeOption)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  mode === modeOption
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {modeOption}
              </button>
            ))}
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            {isActive ? 'Live' : 'Offline'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Vision Area */}
        <div className="xl:col-span-2 space-y-6">
          {/* Camera/Image Input */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5 text-gray-600" />
                Vision Input
              </h2>
            </div>
            <div className="card-content">
              {/* Camera View */}
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                {isActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-80 object-cover"
                  />
                ) : staticImage ? (
                  <img
                    src={staticImage}
                    alt="Analysis target"
                    className="w-full h-80 object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-80 flex items-center justify-center border-2 border-dashed transition-colors ${
                      dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-2">Drop an image here or click to upload</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Choose File
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Processing Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                      <div className="w-6 h-6 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-gray-900 font-medium">Analyzing...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex justify-between items-center">
                <div className="flex gap-3">
                  {!isActive ? (
                    <button
                      onClick={startCamera}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      Start Camera
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Pause className="h-4 w-4" />
                      Stop Camera
                    </button>
                  )}
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </button>
                </div>
                
                {staticImage && (
                  <button
                    onClick={() => setStaticImage(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {cameraError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {cameraError}
                </div>
              )}
            </div>
          </div>

          {/* Recent Detections */}
          {analysisResults.length > 0 && (
            <div className="card">
              <div className="card-header flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-gray-600" />
                  Latest Analysis
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value as typeof severityFilter)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="ALL">All Severity</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="WARNING">Warning</option>
                    <option value="INFO">Info</option>
                    <option value="PASS">Pass</option>
                  </select>
                </div>
              </div>
              <div className="card-content">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredResults[0]?.detections.map((detection) => (
                    <div
                      key={detection.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${getSeverityColor(detection.severity)}`}
                      onClick={() => setSelectedDetection(detection)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(detection.severity)}
                          <div className="flex-1">
                            <h3 className="font-medium">{detection.title}</h3>
                            <p className="text-sm opacity-75 mt-1">{detection.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs opacity-60">
                              <span>{detection.timestamp}</span>
                              <span>Confidence: {Math.round(detection.confidence * 100)}%</span>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 opacity-50" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Stats */}
          {analysisResults.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-gray-600" />
                  Analysis Summary
                </h3>
              </div>
              <div className="card-content space-y-3">
                {analysisResults[0] && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{analysisResults[0].summary.critical}</div>
                        <div className="text-xs text-red-600 font-medium">Critical</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{analysisResults[0].summary.warnings}</div>
                        <div className="text-xs text-orange-600 font-medium">Warnings</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{analysisResults[0].summary.total - analysisResults[0].summary.critical - analysisResults[0].summary.warnings - analysisResults[0].summary.passed}</div>
                        <div className="text-xs text-blue-600 font-medium">Info</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{analysisResults[0].summary.passed}</div>
                        <div className="text-xs text-green-600 font-medium">Passed</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Analysis History */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                Analysis History
              </h3>
            </div>
            <div className="card-content">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {analysisResults.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-8">
                    No analysis results yet
                  </div>
                ) : (
                  analysisResults.map((result, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{mode} Analysis</span>
                        <span className="text-xs text-gray-500">
                          {new Date(result.processedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Total: {result.summary.total}</span>
                        <span className="text-red-600">Critical: {result.summary.critical}</span>
                        <span className="text-orange-600">Warnings: {result.summary.warnings}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Detection Detail Modal */}
      {selectedDetection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${getSeverityColor(selectedDetection.severity)}`}>
                  {getSeverityIcon(selectedDetection.severity)}
                  <span className="font-medium text-sm">{selectedDetection.severity}</span>
                </div>
                <button
                  onClick={() => setSelectedDetection(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <h3 className="text-lg font-semibold mb-2">{selectedDetection.title}</h3>
              <p className="text-gray-700 mb-4">{selectedDetection.description}</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <h4 className="font-medium text-blue-900 mb-1">Recommendation</h4>
                <p className="text-blue-800 text-sm">{selectedDetection.recommendation}</p>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div>Detected: {selectedDetection.timestamp}</div>
                <div>Confidence: {Math.round(selectedDetection.confidence * 100)}%</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIVision;