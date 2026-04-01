import { useEffect, useState } from 'react';
import { User, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Activity {
  id: string;
  type: 'comment' | 'update' | 'alert' | 'complete' | 'create';
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  target: string;
  timestamp: string;
  icon?: React.ReactNode;
}

interface ActivityFeedProps {
  projectId?: string;
  limit?: number;
}

const iconMap = {
  comment: <User className="w-4 h-4" />,
  update: <FileText className="w-4 h-4" />,
  alert: <AlertTriangle className="w-4 h-4" />,
  complete: <CheckCircle className="w-4 h-4" />,
  create: <Clock className="w-4 h-4" />,
};

export function ActivityFeed({ projectId, limit = 10 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Simulate loading activities
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'create',
        userId: 'user1',
        userName: 'Sarah Chen',
        action: 'created',
        target: 'new project milestone',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: '2',
        type: 'complete',
        userId: 'user2',
        userName: 'James Miller',
        action: 'completed',
        target: 'safety inspection report',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: '3',
        type: 'alert',
        userId: 'system',
        userName: 'System',
        action: 'alerted',
        target: 'budget variance exceeded 10%',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
      {
        id: '4',
        type: 'update',
        userId: 'user3',
        userName: 'Patricia Watson',
        action: 'updated',
        target: 'project timeline',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
      {
        id: '5',
        type: 'comment',
        userId: 'user4',
        userName: 'Michael Brown',
        action: 'commented on',
        target: 'RFI-2024-001',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
    ];

    setActivities(mockActivities.slice(0, limit));
  }, [projectId, limit]);

  const getTimeAgo = (timestamp: string) => {
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <div key={activity.id} className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center">
              {activity.icon || iconMap[activity.type] || <User className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">{activity.userName}</span>{' '}
              <span className="text-gray-500">{activity.action}</span>{' '}
              <span className="font-medium text-primary">{activity.target}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {getTimeAgo(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
