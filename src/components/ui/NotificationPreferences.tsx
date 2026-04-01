import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Phone, X } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPreference {
  type: string;
  label: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
}

export function NotificationPreferences({ onClose }: { onClose?: () => void }) {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);

  useEffect(() => {
    const mockPreferences: NotificationPreference[] = [
      {
        type: 'safety_alerts',
        label: 'Safety Alerts',
        email: true,
        push: true,
        sms: true,
        inApp: true,
      },
      {
        type: 'project_updates',
        label: 'Project Updates',
        email: true,
        push: true,
        sms: false,
        inApp: true,
      },
      {
        type: 'budget_alerts',
        label: 'Budget Alerts',
        email: true,
        push: true,
        sms: false,
        inApp: true,
      },
      {
        type: 'task_assignments',
        label: 'Task Assignments',
        email: false,
        push: true,
        sms: false,
        inApp: true,
      },
      {
        type: 'document_changes',
        label: 'Document Changes',
        email: false,
        push: false,
        sms: false,
        inApp: true,
      },
      {
        type: 'meeting_reminders',
        label: 'Meeting Reminders',
        email: true,
        push: true,
        sms: true,
        inApp: true,
      },
    ];
    setPreferences(mockPreferences);
  }, []);

  const updatePreference = (type: string, channel: keyof Omit<NotificationPreference, 'type' | 'label'>, value: boolean) => {
    setPreferences(prev =>
      prev.map(p => (p.type === type ? { ...p, [channel]: value } : p))
    );
  };

  const savePreferences = () => {
    toast.success('Notification preferences saved');
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-base-100 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex items-center justify-between">
          <h2 className="text-lg font-bold">Notification Preferences</h2>
          {onClose && (
            <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Preferences Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Notification Type</th>
                <th className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Bell className="w-4 h-4" />
                    Push
                  </div>
                </th>
                <th className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                </th>
                <th className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    SMS
                  </div>
                </th>
                <th className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Bell className="w-4 h-4" />
                    In-App
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {preferences.map(pref => (
                <tr key={pref.type}>
                  <td className="font-medium">{pref.label}</td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={pref.push}
                      onChange={e => updatePreference(pref.type, 'push', e.target.checked)}
                      className="checkbox checkbox-sm checkbox-primary"
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={pref.email}
                      onChange={e => updatePreference(pref.type, 'email', e.target.checked)}
                      className="checkbox checkbox-sm checkbox-primary"
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={pref.sms}
                      onChange={e => updatePreference(pref.type, 'sms', e.target.checked)}
                      className="checkbox checkbox-sm checkbox-primary"
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={pref.inApp}
                      onChange={e => updatePreference(pref.type, 'inApp', e.target.checked)}
                      className="checkbox checkbox-sm checkbox-primary"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-300 flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={savePreferences} className="btn btn-primary">Save Preferences</button>
        </div>
      </div>
    </div>
  );
}
