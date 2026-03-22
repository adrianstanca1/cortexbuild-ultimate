import { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Check,
  X,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
  icon: React.ElementType;
}

interface NotificationPreferencesProps {
  onSave?: (preferences: NotificationPreference[]) => void;
  onClose?: () => void;
}

const DEFAULT_PREFERENCES: NotificationPreference[] = [
  {
    id: 'invoice_overdue',
    label: 'Invoice Overdue',
    description: 'When an invoice becomes overdue',
    email: true,
    push: true,
    inApp: true,
    icon: Bell,
  },
  {
    id: 'invoice_paid',
    label: 'Invoice Paid',
    description: 'When payment is received',
    email: true,
    push: false,
    inApp: true,
    icon: Bell,
  },
  {
    id: 'project_update',
    label: 'Project Updates',
    description: 'Status changes on your projects',
    email: true,
    push: true,
    inApp: true,
    icon: Bell,
  },
  {
    id: 'safety_alert',
    label: 'Safety Alerts',
    description: 'Critical safety incidents',
    email: true,
    push: true,
    inApp: true,
    icon: Bell,
  },
  {
    id: 'rfi_response',
    label: 'RFI Responses',
    description: 'When RFIs receive responses',
    email: true,
    push: false,
    inApp: true,
    icon: Bell,
  },
  {
    id: 'meeting_reminder',
    label: 'Meeting Reminders',
    description: '1 hour before scheduled meetings',
    email: true,
    push: true,
    inApp: true,
    icon: Bell,
  },
  {
    id: 'deadline_reminder',
    label: 'Deadline Reminders',
    description: '24 hours before deadlines',
    email: true,
    push: true,
    inApp: true,
    icon: Bell,
  },
  {
    id: 'document_shared',
    label: 'Document Sharing',
    description: 'When documents are shared with you',
    email: false,
    push: false,
    inApp: true,
    icon: Bell,
  },
  {
    id: 'team_assignment',
    label: 'Task Assignments',
    description: 'When tasks are assigned to you',
    email: true,
    push: true,
    inApp: true,
    icon: Bell,
  },
  {
    id: 'weekly_summary',
    label: 'Weekly Summary',
    description: 'Monday morning overview',
    email: false,
    push: false,
    inApp: true,
    icon: Bell,
  },
];

export function NotificationPreferences({ onSave, onClose }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreference[]>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [quietHours, setQuietHours] = useState({ enabled: false, from: '22:00', to: '08:00' });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const saved = localStorage.getItem('notification-preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences(parsed.preferences || DEFAULT_PREFERENCES);
        setEnabled(parsed.enabled ?? true);
        setQuietHours(parsed.quietHours || quietHours);
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (id: string, channel: 'email' | 'push' | 'inApp') => {
    setPreferences(prev =>
      prev.map(p =>
        p.id === id ? { ...p, [channel]: !p[channel] } : p
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { preferences, enabled, quietHours };
      localStorage.setItem('notification-preferences', JSON.stringify(data));
      onSave?.(preferences);
      toast.success('Notification preferences saved');
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const enableAll = (channel: 'email' | 'push' | 'inApp') => {
    setPreferences(prev =>
      prev.map(p => ({ ...p, [channel]: true }))
    );
  };

  const disableAll = (channel: 'email' | 'push' | 'inApp') => {
    setPreferences(prev =>
      prev.map(p => ({ ...p, [channel]: false }))
    );
  };

  const NotificationRow = ({ pref }: { pref: NotificationPreference }) => {
    const Icon = pref.icon;
    return (
      <div className="flex items-center gap-4 py-3 border-b border-gray-800 last:border-0">
        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
          <Icon className="h-4 w-4 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{pref.label}</p>
          <p className="text-xs text-gray-500">{pref.description}</p>
        </div>
        <div className="flex items-center gap-6">
          <ChannelToggle
            channel="email"
            checked={pref.email}
            onChange={() => togglePreference(pref.id, 'email')}
          />
          <ChannelToggle
            channel="push"
            checked={pref.push}
            onChange={() => togglePreference(pref.id, 'push')}
          />
          <ChannelToggle
            channel="inApp"
            checked={pref.inApp}
            onChange={() => togglePreference(pref.id, 'inApp')}
          />
        </div>
      </div>
    );
  };

  const ChannelToggle = ({ channel, checked, onChange }: {
    channel: string;
    checked: boolean;
    onChange: () => void;
  }) => {
    const icons: Record<string, typeof Mail> = {
      email: Mail,
      push: Smartphone,
      inApp: Bell,
    };
    const Icon = icons[channel];
    const labels: Record<string, string> = {
      email: 'Email',
      push: 'Push',
      inApp: 'In-App',
    };

    return (
      <button
        onClick={onChange}
        className={clsx(
          'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-14',
          checked ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
        )}
        title={labels[channel]}
      >
        <Icon className="h-4 w-4" />
        <span className="text-xs">{labels[channel]}</span>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-gray-400" />
          <div>
            <h3 className="font-medium text-white">Notification Settings</h3>
            <p className="text-xs text-gray-500">Choose how you want to be notified</p>
          </div>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={clsx(
            'relative w-12 h-6 rounded-full transition-colors',
            enabled ? 'bg-blue-600' : 'bg-gray-700'
          )}
        >
          <span
            className={clsx(
              'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
              enabled ? 'left-7' : 'left-1'
            )}
          />
        </button>
      </div>

      <div className="border-b border-gray-800 pb-4">
        <div className="flex items-center justify-end gap-4 text-xs text-gray-500">
          <span>Email</span>
          <span className="w-14 text-center">Push</span>
          <span className="w-14 text-center">In-App</span>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {preferences.map(pref => (
          <NotificationRow key={pref.id} pref={pref} />
        ))}
      </div>

      <div className="border-t border-gray-800 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-400">Quick Actions</h4>
        </div>
        <div className="flex gap-2">
          <button onClick={() => enableAll('email')} className="text-xs text-blue-400 hover:text-blue-300">
            Enable All Email
          </button>
          <span className="text-gray-700">|</span>
          <button onClick={() => disableAll('email')} className="text-xs text-gray-500 hover:text-gray-400">
            Disable All Email
          </button>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-400">Quiet Hours</h4>
          <button
            onClick={() => setQuietHours(p => ({ ...p, enabled: !p.enabled }))}
            className={clsx(
              'relative w-10 h-5 rounded-full transition-colors',
              quietHours.enabled ? 'bg-blue-600' : 'bg-gray-700'
            )}
          >
            <span
              className={clsx(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                quietHours.enabled ? 'left-5' : 'left-0.5'
              )}
            />
          </button>
        </div>
        {quietHours.enabled && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">From</span>
            <input
              type="time"
              value={quietHours.from}
              onChange={(e) => setQuietHours(p => ({ ...p, from: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white"
            />
            <span className="text-gray-500">to</span>
            <input
              type="time"
              value={quietHours.to}
              onChange={(e) => setQuietHours(p => ({ ...p, to: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button onClick={onClose} className="btn btn-secondary">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Preferences
        </button>
      </div>
    </div>
  );
}
