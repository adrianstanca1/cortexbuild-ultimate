import React, { useState, useRef, useCallback } from 'react';
import { 
  Terminal, Play, AlertCircle, CheckCircle, 
  Activity, Code, Settings, X, Upload, Download, RefreshCw, Copy, FileText
} from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

interface ApiResponse {
  success: boolean;
  data?: unknown; // Changed from 'any' to 'unknown'
  error?: string;
  executionTime: number;
}

const generateMockResponse = (prompt: string): string => {
  // Mock AI responses based on prompt content
  if (prompt.toLowerCase().includes('bim')) {
    return 'Building Information Modeling (BIM) is a digital representation process that combines 3D models with data to provide comprehensive project visualization, enabling better collaboration, planning, and lifecycle management in construction projects.';
  }
  if (prompt.toLowerCase().includes('construction')) {
    return 'Construction management involves coordinating resources, schedules, and processes to deliver building projects safely, on time, and within budget while maintaining quality standards.';
  }
  if (prompt.toLowerCase().includes('safety')) {
    return 'Construction safety protocols include hazard identification, risk assessment, PPE requirements, safety training, and continuous monitoring to prevent accidents and ensure worker wellbeing.';
  }
  
  return `Processed prompt: "${prompt}"\n\nThis is a mock response from the DevSandbox environment. In production, this would connect to your preferred AI service (OpenAI, Anthropic, Google, etc.) with the configured parameters.`;
};

export const DevSandbox: React.FC = () => {
  const [prompt, setPrompt] = useState('Explain the concept of BIM (Building Information Modeling) in one sentence.');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const initialLogs: LogEntry[] = [
      { timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'DevSandbox initialized' },
      { timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'API Connection: Ready' },
    ];
    return initialLogs;
  });
  
  // Configuration State
  const [temperature, setTemperature] = useState(1.0);
  const [topP, setTopP] = useState(0.95);
  const [jsonMode, setJsonMode] = useState(false);
  const [systemInstruction, setSystemInstruction] = useState('');
  
  // Image Support
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Environment State
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'production'>('development');

  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    setLogs(prev => [entry, ...prev.slice(0, 99)]); // Keep last 100 logs
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setSelectedImage(result);
        addLog('success', `Image loaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunPrompt = useCallback(async () => {
    if ((!prompt.trim() && !selectedImage) || isLoading) return;
    
    setIsLoading(true);
    const startTime = Date.now();
    
    addLog('info', `Sending request to AI model...`);
    addLog('info', `Params: Temp=${temperature}, TopP=${topP}, JSON=${jsonMode}`);
    
    try {
      // Simulated API call - in real implementation, connect to your AI service
      const mockResponse: ApiResponse = {
        success: true,
        data: generateMockResponse(prompt),
        executionTime: Date.now() - startTime
      };
      
      setResponse(mockResponse.data as string); // Type assertion for mock data
      addLog('success', `Response received (${mockResponse.executionTime}ms)`);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addLog('error', `Request failed: ${errorMsg}`);
      setResponse(`Error: ${errorMsg}`);
    }
    
    setIsLoading(false);
  }, [prompt, selectedImage, isLoading, temperature, topP, jsonMode, addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    addLog('info', 'Logs cleared');
  }, [addLog]);

  const exportLogs = useCallback(() => {
    const logData = logs.map(log => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`).join('\n');
    const blob = new Blob([logData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devsandbox-logs-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [logs]);


  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return <AlertCircle className="h-3 w-3 text-red-500" />;
      case 'warn': return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-3 w-3 text-green-500" />;
      default: return <Activity className="h-3 w-3 text-blue-500" />;
    }
  };

  const getLogTextColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Terminal className="h-8 w-8 text-blue-600" />
              Dev Sandbox
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">DEMO</span>
          </div>
          <p className="text-gray-400 mt-1">AI Development & Testing Environment — simulated responses</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as typeof environment)}
            className="px-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-white text-sm"
          >
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-900/30 text-green-400 rounded-lg text-sm border border-green-800/30">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Online
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Testing Area */}
        <div className="xl:col-span-2 space-y-6">
          {/* Configuration Panel */}
          <div className="card bg-gray-900 border border-gray-800">
            <div className="card-header">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                <Settings className="h-5 w-5 text-gray-400" />
                Model Configuration
              </h2>
            </div>
            <div className="card-content space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Temperature: {temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Top P: {topP}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={jsonMode}
                      onChange={(e) => setJsonMode(e.target.checked)}
                      className="w-4 h-4 text-blue-500 border-gray-600 rounded bg-gray-800"
                    />
                    <span className="text-sm font-medium text-gray-300">JSON Mode</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  System Instruction (Optional)
                </label>
                <textarea
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  placeholder="Enter system instruction to guide AI behavior..."
                  className="w-full p-3 border border-gray-700 rounded-lg resize-none bg-gray-800 text-white placeholder-gray-500"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Prompt Testing */}
          <div className="card bg-gray-900 border border-gray-800">
            <div className="card-header">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                <Code className="h-5 w-5 text-gray-400" />
                Prompt Testing
              </h2>
            </div>
            <div className="card-content space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Test Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your test prompt..."
                  className="w-full p-3 border border-gray-700 rounded-lg resize-none bg-gray-800 text-white placeholder-gray-500"
                  rows={4}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Image Input (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </button>
                  {selectedImage && (
                    <div className="flex items-center gap-2">
                      <img src={selectedImage} alt="Preview" className="w-10 h-10 object-cover rounded border border-gray-700" />
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              <button
                onClick={handleRunPrompt}
                disabled={isLoading || (!prompt.trim() && !selectedImage)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isLoading ? 'Processing...' : 'Run Test'}
              </button>
            </div>
          </div>

          {/* Response Display */}
          {response && (
            <div className="card bg-gray-900 border border-gray-800">
              <div className="card-header flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5 text-gray-400" />
                  Response
                </h2>
                <button
                  onClick={() => navigator.clipboard.writeText(response)}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </button>
              </div>
              <div className="card-content">
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <pre className="whitespace-pre-wrap text-sm text-gray-200 font-mono">
                    {response}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Logs and System Info */}
        <div className="space-y-6">
          {/* System Status */}
          <div className="card bg-gray-900 border border-gray-800">
            <div className="card-header">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                System Status
              </h3>
            </div>
            <div className="card-content space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Environment:</span>
                <span className="text-sm font-medium capitalize text-white">{environment}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">API Endpoint:</span>
                <span className="text-sm font-mono text-green-400">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Model:</span>
                <span className="text-sm font-medium text-white">GPT-4-Turbo</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Tokens Used:</span>
                <span className="text-sm font-medium text-white">1,247</span>
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="card bg-gray-900 border border-gray-800">
            <div className="card-header flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                <Activity className="h-5 w-5 text-gray-400" />
                Activity Logs
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={exportLogs}
                  className="text-gray-500 hover:text-gray-300"
                  title="Export Logs"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={clearLogs}
                  className="text-gray-500 hover:text-gray-300"
                  title="Clear Logs"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="card-content">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-4">
                    No logs yet
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs">
                      {getLogIcon(log.level)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">[{log.timestamp}]</span>
                          <span className={`font-medium ${getLogTextColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-gray-300 mt-1 break-words">
                          {log.message}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevSandbox;