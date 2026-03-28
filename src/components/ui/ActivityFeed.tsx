import { useState, useEffect } from 'react';
import {
  Activity,
  Briefcase,
  FileText,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Settings,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import { notificationsApi } from '../../services/api';

interface ActivityItem {
  id: string;
  type: 'project' | 'invoice' | 'safety' | 'document' | 'task' | 'comment' | 'system';
  action: 'created' | 'updated' | 'deleted' | 'completed' | 'commented' | 'shared';
  title: string;
  description?: string;
  user?: { name: string; avatar?: string };
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const activityIcons: Record<string, typeof Activity> = {
  project: Briefcase,
  invoice: FileText,
  safety: AlertTriangle,
  document: FileText,
  task: CheckCircle,
  comment: MessageSquare,
  system: Settings,
};

const activityColors: Record<string, string> = {
  project: 'bg-blue-500/20 text-blue-400',
  invoice: 'bg-emerald-500/20 text-emerald-400',
  safety: 'bg-red-500/20 text-red-400',
  document: 'bg-purple-500/20 text-purple-400',
  task: 'bg-amber-500/20 text-amber-400',
  comment: 'bg-cyan-500/20 text-cyan-400',
  system: 'bg-gray-500/20 text-gray-400',
};

interface ActivityFeedProps {
  items?: ActivityItem[];
  limit?: number;
  showFilters?: boolean;
  onItemClick?: (item: ActivityItem) => void;
}

export function ActivityFeed({ items: propItems, limit = 20, showFilters = true, onItemClick }: ActivityFeedProps) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');

  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      if (propItems) {
        setItems(propItems);
      } else {
        // Try to load from notifications API as activity source
        const rows = await notificationsApi.getAll();
        const mapped: ActivityItem[] = (rows as Record<string, unknown>[]).map((r: Record<string, unknown>) => ({
          id: String(r.id ?? ''),
          type: (r.type as ActivityItem['type']) || 'system',
          action: (r.action as ActivityItem['action']) || 'updated',
          title: String(r.title || r.subject || 'Activity'),
          description: String(r.message || r.description || ''),
          user: { name: String(r.userName || r.createdBy || r.actor || 'System') },
          timestamp: String(r.createdAt || new Date().toISOString()),
          metadata: {},
        }));
        setItems(mapped.length > 0 ? mapped : generateMockActivities());
      }
    } catch {
      setItems(generateMockActivities());
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterAction !== 'all' && item.action !== filterAction) return false;
    return true;
  }).slice(0, limit);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: 'created',
      updated: 'updated',
      deleted: 'deleted',
      completed: 'completed',
      commented: 'commented on',
      shared: 'shared',
    };
    return labels[action] || action;
  };

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2"
          >
            <option value="all">All Types</option>
            <option value="project">Projects</option>
            <option value="invoice">Invoices</option>
            <option value="safety">Safety</option>
            <option value="document">Documents</option>
            <option value="task">Tasks</option>
            <option value="comment">Comments</option>
          </select>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2"
          >
            <option value="all">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="completed">Completed</option>
            <option value="commented">Commented</option>
          </select>
          <button onClick={loadActivities} className="btn btn-secondary text-sm p-2">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="space-y-1">
        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p>No activities found</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const Icon = activityIcons[item.type] || Activity;
            const colorClass = activityColors[item.type] || activityColors.system;
            
            return (
              <div
                key={item.id}
                onClick={() => onItemClick?.(item)}
                className={clsx(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors',
                  onItemClick ? 'cursor-pointer hover:bg-gray-800/50' : ''
                )}
              >
                <div className={clsx('p-2 rounded-lg shrink-0', colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {item.user && (
                      <span className="font-medium text-white text-sm">{item.user.name}</span>
                    )}
                    <span className="text-gray-500 text-sm">
                      {getActionLabel(item.action)}
                    </span>
                    <span className="text-gray-300 text-sm font-medium">{item.title}</span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-600">{formatTime(item.timestamp)}</span>
                  {onItemClick && <ChevronRight className="h-4 w-4 text-gray-600" />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function generateMockActivities(): ActivityItem[] {
  const users = [
    { name: 'Adrian Stanca', avatar: 'AS' },
    { name: 'James Wilson', avatar: 'JW' },
    { name: 'Sarah Chen', avatar: 'SC' },
    { name: 'Mike Johnson', avatar: 'MJ' },
  ];

  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'project',
      action: 'updated',
      title: 'Canary Wharf Tower',
      description: 'Progress updated to 75%',
      user: users[0],
      timestamp: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: '2',
      type: 'invoice',
      action: 'created',
      title: 'INV-2024-045',
      description: '£45,000 sent to Acme Corp',
      user: users[1],
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: '3',
      type: 'safety',
      action: 'completed',
      title: 'Weekly Safety Inspection',
      description: 'All areas passed inspection',
      user: users[2],
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '4',
      type: 'document',
      action: 'shared',
      title: 'RAMS Document v2.1',
      description: 'Shared with 3 team members',
      user: users[0],
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: '5',
      type: 'task',
      action: 'completed',
      title: 'Foundation Pour Complete',
      description: 'Area B foundation work finished',
      user: users[3],
      timestamp: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: '6',
      type: 'comment',
      action: 'commented',
      title: 'RFI #234 Response',
      description: 'Added clarification on structural steel specs',
      user: users[1],
      timestamp: new Date(Date.now() - 28800000).toISOString(),
    },
    {
      id: '7',
      type: 'project',
      action: 'created',
      title: 'Birmingham Retail Park',
      description: 'New project added',
      user: users[0],
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '8',
      type: 'invoice',
      action: 'updated',
      title: 'INV-2024-044',
      description: 'Status changed to Paid',
      user: users[2],
      timestamp: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  return activities;
}
