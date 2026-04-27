import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Minus, Square, Terminal, Activity, FileText, 
  Settings, Calculator, Folder, Globe, Code, Search,
  Wifi, Battery, Volume2, Grid,
  MessageSquare, HardHat, Layers, Shield
} from 'lucide-react';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
interface AppInfo {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description?: string;
  category: 'productivity' | 'construction' | 'system' | 'development';
}

interface WindowState {
  id: string;
  appId: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
  isMinimized: boolean;
  isMaximized: boolean;
  position: { x: number; y: number };
  size: { w: number; h: number };
  zIndex: number;
}



// ⚡ Bolt Performance Optimization:
// Extracted SystemClock into a standalone component.
// Previously, currentTime was stored in the parent MyDesktop state and updated via
// setInterval every second, which caused the entire MyDesktop (and all its windows)
// to re-render 1x/sec. Isolating this state ensures only the clock UI re-renders.
const SystemClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-white text-sm font-medium flex flex-col items-end">
      <div>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      <div className="text-xs text-gray-400">{currentTime.toLocaleDateString()}</div>
    </div>
  );
};

export const MyDesktop: React.FC = () => {
  // Desktop State
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [maxZIndex, setMaxZIndex] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSystemStats, setShowSystemStats] = useState(false);
  
  const desktopRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string, startX: number, startY: number, initX: number, initY: number, currentX?: number, currentY?: number } | null>(null);

  // Available Applications
  const availableApps: AppInfo[] = [
    // Construction Apps
    { id: 'bim-viewer', name: 'BIM Viewer', icon: Layers, color: 'bg-blue-600', category: 'construction' },
    { id: 'safety-monitor', name: 'Safety Monitor', icon: Shield, color: 'bg-red-600', category: 'construction' },
    { id: 'site-manager', name: 'Site Manager', icon: HardHat, color: 'bg-orange-600', category: 'construction' },
    
    // Development Apps
    { id: 'terminal', name: 'Terminal', icon: Terminal, color: 'bg-gray-800', category: 'development' },
    { id: 'code-editor', name: 'Code Editor', icon: Code, color: 'bg-indigo-600', category: 'development' },
    { id: 'dev-sandbox', name: 'Dev Sandbox', icon: Activity, color: 'bg-green-600', category: 'development' },
    
    // Productivity Apps
    { id: 'file-manager', name: 'File Manager', icon: Folder, color: 'bg-yellow-600', category: 'productivity' },
    { id: 'calculator', name: 'Calculator', icon: Calculator, color: 'bg-purple-600', category: 'productivity' },
    { id: 'notepad', name: 'Notepad', icon: FileText, color: 'bg-teal-600', category: 'productivity' },
    { id: 'chat', name: 'Team Chat', icon: MessageSquare, color: 'bg-pink-600', category: 'productivity' },
    
    // System Apps
    { id: 'settings', name: 'Settings', icon: Settings, color: 'bg-gray-600', category: 'system' },
    { id: 'browser', name: 'Browser', icon: Globe, color: 'bg-blue-500', category: 'system' },
  ];

  // Filter apps based on search
  const filteredApps = availableApps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedApps = filteredApps.reduce((acc, app) => {
    if (!acc[app.category]) acc[app.category] = [];
    acc[app.category].push(app);
    return acc;
  }, {} as Record<string, AppInfo[]>);


  // --- Window Management Callbacks ---
  const focusWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId 
        ? { ...w, zIndex: maxZIndex + 1 }
        : w
    ));
    setActiveWindowId(windowId);
    setMaxZIndex(prev => prev + 1);
  }, [maxZIndex, setActiveWindowId]);

  const toggleMinimize = useCallback((windowId: string) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId 
        ? { ...w, isMinimized: !w.isMinimized }
        : w
    ));
  }, []);

  const toggleMaximize = useCallback((windowId: string) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId 
        ? { ...w, isMaximized: !w.isMaximized }
        : w
    ));
  }, []);

  const closeWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.filter(w => w.id !== windowId));
    if (activeWindowId === windowId) {
      setActiveWindowId(null);
    } 
  }, [activeWindowId]);

  const handleMouseDown = useCallback((e: React.MouseEvent, windowId: string) => {
    if ((e.target as HTMLElement).closest('.window-controls')) return;
    
    const window = windows.find(w => w.id === windowId);
    if (!window) return;

    focusWindow(windowId);
    
    dragRef.current = {
      id: windowId,
      startX: e.clientX,
      startY: e.clientY,
      initX: window.position.x,
      initY: window.position.y
    };
  }, [windows, focusWindow]);

  // App Content Components
  const getAppContent = useCallback((appId: string): React.ReactNode => {
    switch (appId) {
      case 'terminal':
        return (
          <div className="bg-black text-green-400 font-mono p-4 h-full overflow-auto">
            <div>Welcome to CortexBuild Terminal v2.5</div>
            <div>Type 'help' for available commands</div>
            <div className="mt-4 flex items-center">
              <span className="text-blue-400">admin@cortexbuild:~$</span>
              <span className="ml-2 bg-green-400 w-2 h-4 animate-pulse"></span>
            </div>
          </div>
        );
      
      case 'file-manager':
        return (
          <div className="p-4 h-full bg-gray-50">
            <div className="border-b pb-3 mb-3">
              <div className="text-sm text-gray-600">C:/Users/Admin/Documents</div>
            </div>
            <div className="space-y-2">
              {[ 'Project_Alpha.pdf', 'Budget_2025.xlsx', 'Safety_Report.docx', 'Meeting_Notes.txt' ].map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{file}</span>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'calculator':
        return (
          <div className="p-4 bg-gray-100 h-full">
            <div className="bg-black text-white text-right p-3 mb-3 font-mono text-lg">0</div>
            <div className="grid grid-cols-4 gap-2">
              {[ 'C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '0', '.', '=' ].map((btn, index) => (
                <button key={`${btn}-${index}`} className="bg-gray-300 hover:bg-gray-400 p-3 rounded text-sm font-medium">
                  {btn}
                </button>
              ))}
            </div>
          </div>
        );
      
      case 'notepad':
        return (
          <div className="h-full flex flex-col">
            <div className="border-b p-2 bg-gray-50">
              <div className="text-sm text-gray-600">Untitled.txt</div>
            </div>
            <textarea 
              className="flex-1 p-4 border-none outline-none resize-none font-mono text-sm"
              placeholder="Start typing..."
              defaultValue="Meeting Notes - Q4 Planning Session\n\n- Review project timelines\n- Discuss resource allocation\n- Safety protocol updates\n- Budget review for next quarter"
            />
          </div>
        );
      
      case 'settings':
        return (
          <div className="p-4 h-full bg-gray-50">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">System Settings</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span>Desktop Theme</span>
                  <select className="border rounded px-2 py-1">
                    <option>Dark Industrial</option>
                    <option>Light Professional</option>
                  </select>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span>Auto-lock Screen</span>
                  <select className="border rounded px-2 py-1">
                    <option>15 minutes</option>
                    <option>30 minutes</option>
                    <option>Never</option>
                  </select>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded border">
                  <span>Sound Effects</span>
                  <input type="checkbox" defaultChecked />
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-8 text-center text-gray-500 h-full flex items-center justify-center">
            <div>
              <div className="text-2xl mb-2">⚙️</div>
              <div>This module is currently unavailable</div>
              <div className="text-sm mt-1">Please contact your system administrator</div>
            </div>
          </div>
        );
    }
  }, []);

  const openApp = useCallback((app: AppInfo) => {
    const existingWindow = windows.find(w => w.appId === app.id);
    if (existingWindow) {
      // Bring to front and restore if minimized
      focusWindow(existingWindow.id);
      if (existingWindow.isMinimized) {
        toggleMinimize(existingWindow.id);
      }
      return;
    }

    const newWindow: WindowState = {
      id: `window-${Math.random().toString(36).substring(2, 9)}`,
      appId: app.id,
      title: app.name,
      icon: app.icon,
      content: getAppContent(app.id),
      isMinimized: false,
      isMaximized: false,
      position: { 
        x: 50 + (windows.length * 30), 
        y: 50 + (windows.length * 30) 
      },
      size: { w: 600, h: 400 },
      zIndex: maxZIndex + 1
    };

    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
    setMaxZIndex(prev => prev + 1);
    setStartMenuOpen(false);
  }, [windows, maxZIndex, focusWindow, toggleMinimize, getAppContent]);

  useEffect(() => {
    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      const newX = Math.max(0, dragRef.current.initX + deltaX);
      const newY = Math.max(0, dragRef.current.initY + deltaY);

      dragRef.current.currentX = newX;
      dragRef.current.currentY = newY;

      const windowEl = document.getElementById(dragRef.current.id);
      if (windowEl) {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          // Direct DOM manipulation to avoid top-level re-renders
          windowEl.style.left = `${newX}px`;
          windowEl.style.top = `${newY}px`;
        });
      }
    };

    const handleMouseUp = () => {
      if (dragRef.current && dragRef.current.currentX !== undefined && dragRef.current.currentY !== undefined) {
        // Sync final position to React state
        const { id, currentX, currentY } = dragRef.current;
        setWindows(prev => prev.map(w =>
          w.id === id
            ? { ...w, position: { x: currentX, y: currentY } }
            : w
        ));
      }
      dragRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const categoryNames = {
    construction: 'Construction',
    development: 'Development',
    productivity: 'Productivity',
    system: 'System'
  };

  return (
    <div
      ref={desktopRef}
      className="h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black relative overflow-hidden"
      onClick={() => setStartMenuOpen(false)}
    >
      <div className="absolute top-10 left-4 right-4 z-40 max-w-[1680px] mx-auto pointer-events-auto">
        <ModuleBreadcrumbs currentModule="my-desktop" />
      </div>
      {/* Demo Banner */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-amber-500/20 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-center gap-2">
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/30 text-amber-300 border border-amber-500/40">EXPERIMENTAL</span>
        <span className="text-amber-300/80 text-xs">Window manager prototype — app contents are placeholders</span>
      </div>
      {/* Desktop Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full bg-repeat" 
             style={{
               // Correctly escaped SVG data URL
               backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
             }}>
        </div>
      </div>

      {/* Desktop Icons — below demo strip + module breadcrumbs */}
      <div className="absolute top-28 left-4 grid gap-4">
        {[
          { icon: Folder, name: 'Documents', color: 'text-yellow-400' },
          { icon: Terminal, name: 'Terminal', color: 'text-green-400' },
          { icon: Activity, name: 'System Monitor', color: 'text-blue-400' },
          { icon: FileText, name: 'Project Notes', color: 'text-purple-400' }
        ].map((item, index) => (
          <div key={index} className="flex flex-col items-center gap-1 p-2 rounded hover:bg-white/10 cursor-pointer transition-colors">
            <item.icon className={`h-8 w-8 ${item.color}`} />
            <span className="text-white text-xs text-center max-w-16 truncate">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Windows */}
      {windows.map(window => (
        <div
          key={window.id}
          id={window.id}
          className={`absolute bg-white rounded-lg shadow-2xl overflow-hidden ${window.isMinimized ? 'hidden' : ''}`}
          style={{
            left: window.isMaximized ? 0 : window.position.x,
            top: window.isMaximized ? 0 : window.position.y,
            width: window.isMaximized ? '100%' : window.size.w,
            height: window.isMaximized ? '100%' : window.size.h,
            zIndex: window.zIndex
          }}
        >
          {/* Window Title Bar */}
          <div 
            className="bg-gray-100 border-b flex items-center justify-between px-3 py-2 cursor-move select-none"
            onMouseDown={(e) => handleMouseDown(e, window.id)}
            onClick={() => focusWindow(window.id)}
          >
            <div className="flex items-center gap-2">
              <window.icon className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-800">{window.title}</span>
            </div>
            <div className="window-controls flex items-center gap-1">
              <button
                onClick={() => toggleMinimize(window.id)}
                className="w-6 h-6 rounded bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors"
              >
                <Minus className="h-3 w-3 text-white" />
              </button>
              <button
                onClick={() => toggleMaximize(window.id)}
                className="w-6 h-6 rounded bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
              >
                <Square className="h-3 w-3 text-white" />
              </button>
              <button
                onClick={() => closeWindow(window.id)}
                className="w-6 h-6 rounded btn btn-error flex items-center justify-center transition-colors"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          </div>
          
          {/* Window Content */}
          <div className="h-full">
            {window.content}
          </div>
        </div>
      ))}

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-700 h-12 flex items-center px-4">
        {/* Start Menu Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setStartMenuOpen(!startMenuOpen);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
            startMenuOpen ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-gray-300'
          }`}
        >
          <Grid className="h-4 w-4" />
          <span className="text-sm font-medium">Start</span>
        </button>

        {/* Quick Launch */}
        <div className="flex ml-4 gap-2">
          {availableApps.slice(0, 4).map(app => (
            <button
              key={app.id}
              onClick={() => openApp(app)}
              className="p-2 rounded hover:bg-slate-800 transition-colors group"
              title={app.name}
            >
              <app.icon className="h-5 w-5 text-gray-400 group-hover:text-white" />
            </button>
          ))}
        </div>

        {/* Open Windows */}
        <div className="flex ml-6 gap-1">
          {windows.map(window => (
            <button
              key={window.id}
              onClick={() => {
                if (window.isMinimized) {
                  toggleMinimize(window.id);
                }
                focusWindow(window.id);
              }}
              className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                activeWindowId === window.id 
                  ? 'bg-blue-600 text-white' 
                  : window.isMinimized 
                    ? 'bg-slate-700 text-gray-400'
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              <window.icon className="h-3 w-3" />
              <span className="max-w-32 truncate">{window.title}</span>
            </button>
          ))}
        </div>

        {/* System Tray */}
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Wifi className="h-4 w-4" />
            <Battery className="h-4 w-4" />
            <Volume2 className="h-4 w-4" />
          </div>
          
          <button 
            onClick={() => setShowSystemStats(!showSystemStats)}
            className="text-gray-300 hover:text-white text-sm"
          >
            CPU: 12%
          </button>
          
          <SystemClock />
        </div>
      </div>

      {/* Start Menu */}
      {startMenuOpen && (
        <div className="absolute bottom-12 left-4 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg shadow-2xl w-80 max-h-96 overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Apps Grid */}
          <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
            {Object.entries(groupedApps).map(([category, apps]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {categoryNames[category as keyof typeof categoryNames]}
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {apps.map(app => (
                    <button
                      key={app.id}
                      onClick={() => openApp(app)}
                      className="flex flex-col items-center gap-1 p-2 rounded hover:bg-slate-800 transition-colors"
                    >
                      <app.icon className={`h-6 w-6 ${app.color}`} />
                      <span className="text-white text-xs text-center">{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-700 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">AS</div>
            <div className="text-sm text-white">Adrian Stanca</div>
          </div>
        </div>
      )}

      {/* System Stats Overlay */}
      {showSystemStats && (
        <div className="absolute bottom-16 right-4 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg shadow-2xl p-4 text-white text-sm w-64">
          <h3 className="font-semibold mb-2">System Metrics</h3>
          <div className="space-y-1">
            <div className="flex justify-between"><span>CPU:</span><span>12%</span></div>
            <div className="flex justify-between"><span>RAM:</span><span>8GB / 48GB</span></div>
            <div className="flex justify-between"><span>Network:</span><span>50Mbps</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDesktop;
