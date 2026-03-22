import { useState, useEffect } from 'react';
import {
  Layout,
  GripVertical,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  X,
  Check,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  visible: boolean;
  order: number;
  size?: 'sm' | 'md' | 'lg' | 'full';
  config?: Record<string, unknown>;
}

interface WidgetCustomizerProps {
  widgets: DashboardWidget[];
  onSave: (widgets: DashboardWidget[]) => void;
  onClose: () => void;
}

export function WidgetCustomizer({ widgets, onSave, onClose }: WidgetCustomizerProps) {
  const [localWidgets, setLocalWidgets] = useState(widgets);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const toggleVisibility = (id: string) => {
    setLocalWidgets(prev =>
      prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w)
    );
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    setLocalWidgets(prev => {
      const items = [...prev];
      const draggedIndex = items.findIndex(i => i.id === draggedId);
      const targetIndex = items.findIndex(i => i.id === targetId);
      
      const [draggedItem] = items.splice(draggedIndex, 1);
      items.splice(targetIndex, 0, draggedItem);
      
      return items.map((item, i) => ({ ...item, order: i }));
    });
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleSave = () => {
    onSave(localWidgets);
    toast.success('Dashboard layout saved');
    onClose();
  };

  const resetToDefault = () => {
    setLocalWidgets(widgets.map((w, i) => ({ ...w, visible: true, order: i })));
    toast.info('Layout reset to default');
  };

  const availableWidgets: DashboardWidget[] = [
    { id: 'stats-overview', type: 'stats', title: 'Stats Overview', visible: true, order: 0 },
    { id: 'projects-summary', type: 'projects', title: 'Projects Summary', visible: true, order: 1 },
    { id: 'activity-feed', type: 'activity', title: 'Activity Feed', visible: true, order: 2 },
    { id: 'upcoming-deadlines', type: 'deadlines', title: 'Upcoming Deadlines', visible: true, order: 3 },
    { id: 'safety-alerts', type: 'safety', title: 'Safety Alerts', visible: true, order: 4 },
    { id: 'team-availability', type: 'team', title: 'Team Availability', visible: true, order: 5 },
    { id: 'invoice-status', type: 'invoices', title: 'Invoice Status', visible: true, order: 6 },
    { id: 'budget-tracking', type: 'budget', title: 'Budget Tracking', visible: true, order: 7 },
    { id: 'recent-documents', type: 'documents', title: 'Recent Documents', visible: true, order: 8 },
    { id: 'ai-insights', type: 'ai', title: 'AI Insights', visible: true, order: 9 },
  ];

  const addWidget = (widget: DashboardWidget) => {
    setLocalWidgets(prev => [
      ...prev,
      { ...widget, visible: true, order: prev.length }
    ]);
    toast.success(`Added ${widget.title}`);
  };

  const notAddedWidgets = availableWidgets.filter(
    aw => !localWidgets.find(lw => lw.id === aw.id)
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Customize Dashboard</h2>
            <p className="text-sm text-gray-500">Drag to reorder, toggle to show/hide widgets</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
              Current Widgets
            </h3>
            <div className="space-y-2">
              {localWidgets.map((widget) => (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={() => handleDragStart(widget.id)}
                  onDragOver={(e) => handleDragOver(e, widget.id)}
                  onDragEnd={handleDragEnd}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-lg border transition-all',
                    draggedId === widget.id
                      ? 'border-blue-500 bg-blue-500/10 opacity-50'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  )}
                >
                  <GripVertical className="h-5 w-5 text-gray-500 cursor-grab" />
                  <span className="text-gray-400 text-sm">{widget.title}</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className={clsx(
                      'px-2 py-0.5 rounded text-xs',
                      widget.visible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-500'
                    )}>
                      {widget.visible ? 'Visible' : 'Hidden'}
                    </span>
                    <button
                      onClick={() => toggleVisibility(widget.id)}
                      className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                    >
                      {widget.visible ? (
                        <Eye className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {notAddedWidgets.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                Available Widgets
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {notAddedWidgets.map((widget) => (
                  <button
                    key={widget.id}
                    onClick={() => addWidget(widget)}
                    className="flex items-center gap-2 p-3 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-600 transition-all text-left"
                  >
                    <Plus className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-300">{widget.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-800 flex items-center justify-between">
          <button onClick={resetToDefault} className="text-sm text-gray-500 hover:text-white">
            Reset to Default
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useDashboardLayout(defaultWidgets: DashboardWidget[]) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    const saved = localStorage.getItem('dashboard-layout');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultWidgets;
      }
    }
    return defaultWidgets;
  });

  const saveWidgets = (newWidgets: DashboardWidget[]) => {
    setWidgets(newWidgets);
    localStorage.setItem('dashboard-layout', JSON.stringify(newWidgets));
  };

  const resetWidgets = () => {
    setWidgets(defaultWidgets);
    localStorage.removeItem('dashboard-layout');
  };

  const visibleWidgets = widgets
    .filter(w => w.visible)
    .sort((a, b) => a.order - b.order);

  return { widgets, visibleWidgets, saveWidgets, resetWidgets };
}
