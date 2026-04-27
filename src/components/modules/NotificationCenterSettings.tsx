/**
 * NotificationCenterSettings Component
 * Manages notification preferences and settings
 */

import React from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Volume2,
  VolumeX,
  Clock,
  Calendar,
  Settings,
  X,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react';
import type { NotificationSettings, CategoryPreferences } from '@/types/notification';

interface NotificationCenterSettingsProps {
  settings: NotificationSettings;
  onUpdateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  onToggleCategory: (category: keyof CategoryPreferences) => void;
  onToggleQuietHours: () => void;
  onToggleSoundAlerts: () => void;
  onToggleBrowserNotifications: () => Promise<void>;
  onClose?: () => void;
}

const CATEGORY_LABELS: Record<keyof CategoryPreferences, string> = {
  project_update: 'Project Updates',
  task_assignment: 'Task Assignments',
  rfi_response: 'RFI Responses',
  safety_incident: 'Safety Incidents',
  document_upload: 'Document Uploads',
  meeting_reminder: 'Meeting Reminders',
  team_mention: 'Team Mentions',
  system_alert: 'System Alerts',
  approval_request: 'Approval Requests',
  deadline_warning: 'Deadline Warnings',
  budget_alert: 'Budget Alerts',
  change_order: 'Change Orders',
  inspection_scheduled: 'Inspections',
  material_delivery: 'Material Deliveries',
  timesheet_approval: 'Timesheet Approvals',
  subcontractor_update: 'Subcontractor Updates',
};

const DIGEST_FREQUENCIES: { value: 'never' | 'hourly' | 'daily' | 'weekly'; label: string; description: string }[] = [
  { value: 'never', label: 'Never', description: 'No digest emails' },
  { value: 'hourly', label: 'Hourly', description: 'Summary every hour' },
  { value: 'daily', label: 'Daily', description: 'Summary once per day' },
  { value: 'weekly', label: 'Weekly', description: 'Summary once per week' },
];

export function NotificationCenterSettings({
  settings,
  onUpdateSettings,
  onToggleCategory,
  onToggleQuietHours,
  onToggleSoundAlerts,
  onToggleBrowserNotifications,
  onClose,
}: NotificationCenterSettingsProps) {
  const [localSettings, setLocalSettings] = React.useState(settings);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleUpdate = async (updates: Partial<NotificationSettings>) => {
    setIsSaving(true);
    setLocalSettings((prev) => ({ ...prev, ...updates }));
    try {
      await onUpdateSettings(updates);
    } catch (err) {
      console.error('Failed to update settings:', err);
      setLocalSettings(settings); // Revert on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuietHoursChange = (field: 'startTime' | 'endTime', value: string) => {
    handleUpdate({
      quietHours: {
        ...localSettings.quietHours,
        [field]: value,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-base-300">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-base-content" />
          <h2 className="text-lg font-display">Notification Settings</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Notification Channels */}
        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notification Channels
          </h3>
          <div className="space-y-3">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-base-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Email Notifications</p>
                  <p className="text-xs text-base-content/60">Receive notifications via email</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.emailNotifications}
                onChange={(e) => handleUpdate({ emailNotifications: e.target.checked })}
                className="toggle toggle-primary"
                disabled={isSaving}
              />
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-base-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Smartphone className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Push Notifications</p>
                  <p className="text-xs text-base-content/60">Browser push notifications</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.pushNotifications}
                onChange={(e) => handleUpdate({ pushNotifications: e.target.checked })}
                className="toggle toggle-primary"
                disabled={isSaving}
              />
            </div>

            {/* Browser Notifications */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-base-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Browser Notifications</p>
                  <p className="text-xs text-base-content/60">Desktop notifications</p>
                </div>
              </div>
              <button
                onClick={onToggleBrowserNotifications}
                className={`btn btn-sm ${localSettings.browserNotifications ? 'btn-success' : 'btn-ghost'}`}
                disabled={isSaving}
              >
                {localSettings.browserNotifications ? (
                  <>
                    <Check className="w-4 h-4" />
                    Enabled
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Enable
                  </>
                )}
              </button>
            </div>

            {/* Sound Alerts */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-base-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  {localSettings.soundAlerts ? (
                    <Volume2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">Sound Alerts</p>
                  <p className="text-xs text-base-content/60">Play sound for new notifications</p>
                </div>
              </div>
              <button
                onClick={onToggleSoundAlerts}
                className={`btn btn-sm ${localSettings.soundAlerts ? 'btn-success' : 'btn-ghost'}`}
                disabled={isSaving}
              >
                {localSettings.soundAlerts ? (
                  <>
                    <Check className="w-4 h-4" />
                    On
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4" />
                    Off
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Digest Frequency */}
        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Digest Frequency
          </h3>
          <div className="space-y-2">
            {DIGEST_FREQUENCIES.map((freq) => (
              <div
                key={freq.value}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  localSettings.digestFrequency === freq.value
                    ? 'border-primary bg-primary/5'
                    : 'border-base-300 bg-base-200 hover:border-base-400'
                }`}
                onClick={() => handleUpdate({ digestFrequency: freq.value })}
              >
                <div>
                  <p className="font-medium text-sm">{freq.label}</p>
                  <p className="text-xs text-base-content/60">{freq.description}</p>
                </div>
                {localSettings.digestFrequency === freq.value && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Quiet Hours */}
        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Quiet Hours
          </h3>
          <div className="p-3 rounded-lg bg-base-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Enable Quiet Hours</p>
                <p className="text-xs text-base-content/60">Pause notifications during specified hours</p>
              </div>
              <button
                onClick={onToggleQuietHours}
                className={`btn btn-sm ${localSettings.quietHours.enabled ? 'btn-success' : 'btn-ghost'}`}
                disabled={isSaving}
              >
                {localSettings.quietHours.enabled ? (
                  <>
                    <Check className="w-4 h-4" />
                    On
                  </>
                ) : (
                  'Off'
                )}
              </button>
            </div>

            {localSettings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-base-content/60 mb-1 block">Start Time</label>
                  <input
                    type="time"
                    value={localSettings.quietHours.startTime}
                    onChange={(e) => handleQuietHoursChange('startTime', e.target.value)}
                    className="input input-bordered input-sm w-full"
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="text-xs text-base-content/60 mb-1 block">End Time</label>
                  <input
                    type="time"
                    value={localSettings.quietHours.endTime}
                    onChange={(e) => handleQuietHoursChange('endTime', e.target.value)}
                    className="input input-bordered input-sm w-full"
                    disabled={isSaving}
                  />
                </div>
              </div>
            )}

            <div className="text-xs text-base-content/60 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Timezone: {localSettings.quietHours.timezone}
            </div>
          </div>
        </section>

        {/* Category Preferences */}
        <section>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notification Types
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(Object.keys(CATEGORY_LABELS) as Array<keyof CategoryPreferences>).map((category) => (
              <div
                key={category}
                className="flex items-center justify-between p-2.5 rounded-lg bg-base-200"
              >
                <span className="text-sm">{CATEGORY_LABELS[category]}</span>
                <input
                  type="checkbox"
                  checked={localSettings.categoryPreferences[category]}
                  onChange={() => onToggleCategory(category)}
                  className="toggle toggle-sm toggle-primary"
                  disabled={isSaving}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-base-300 flex justify-between items-center">
        <button
          onClick={() => handleUpdate({ ...settings })}
          className="btn btn-sm btn-ghost"
          disabled={isSaving}
        >
          Reset to Defaults
        </button>
        <div className="text-xs text-base-content/50">
          {isSaving ? 'Saving...' : 'Changes saved automatically'}
        </div>
      </div>
    </div>
  );
}

export default NotificationCenterSettings;
