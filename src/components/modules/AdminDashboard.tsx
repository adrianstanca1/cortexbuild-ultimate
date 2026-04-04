// Module: Admin Dashboard — CortexBuild Ultimate
// Comprehensive administration panel for system management, user oversight,
// company settings, analytics, audit logs, and backup operations.

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Building2, Settings2, BarChart3, FileText, Database,
  RefreshCw, Shield, AlertTriangle, Activity, TrendingUp, Cloud,
  Key, Mail, Globe, ToggleRight, Lock, UserCheck,
  ChevronRight, X, CheckSquare, Square, Loader2,
  LayoutDashboard, FolderOpen, HardHat, ShieldCheck, ShieldAlert,
} from 'lucide-react';
import { usersApi, auditApi, backupApi, settingsApi, type AppSettings } from '../../services/api';
import { eventBus } from '../../lib/eventBus';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { DeploymentDashboard } from '../dashboard/DeploymentDashboard';
import { toast } from 'sonner';
import clsx from 'clsx';
import {
  OverviewTab, UsersTab, CompaniesTab, SettingsTab,
  AnalyticsTab, AuditTab, BackupTab,
} from '../admin-dashboard';
import type { User, Company, SystemStats, AuditEntry, ActivityFeedItem, UserRole } from '../admin-dashboard/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type AnyRow = Record<string, unknown>;
type AdminTab = 'overview' | 'users' | 'companies' | 'settings' | 'analytics' | 'audit' | 'backup' | 'deployment';

// ─── Tab Definitions ──────────────────────────────────────────────────────────

const TABS: { key: AdminTab; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'companies', label: 'Companies', icon: Building2 },
  { key: 'settings', label: 'Settings', icon: Settings2 },
  { key: 'analytics', label: 'Analytics', icon: TrendingUp },
  { key: 'audit', label: 'Audit Logs', icon: FileText },
  { key: 'backup', label: 'Backup & Export', icon: Database },
  { key: 'deployment', label: 'Deployment', icon: Activity },
];

// ─── Main Admin Dashboard Component ───────────────────────────────────────────

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const activities: ActivityFeedItem[] = [
    { id: '1', type: 'success', title: 'New user registered', description: 'john.doe@example.com joined as Project Manager', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), icon: UserCheck },
    { id: '2', type: 'user', title: 'Company upgraded plan', description: 'Acme Ltd upgraded to Enterprise plan', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), icon: Building2 },
    { id: '3', type: 'alert', title: 'High API usage detected', description: 'Rate limit approaching for API key pk_live_***', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), icon: AlertTriangle },
    { id: '4', type: 'system', title: 'Backup completed', description: 'Daily database backup completed successfully', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), icon: Cloud },
    { id: '5', type: 'success', title: 'New project created', description: 'Manchester Office Complex - £2.5M', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), icon: FolderOpen },
  ];

  const loadData = useCallback(async () => {
    try {
      const [usersData, auditData] = await Promise.all([
        usersApi.getAll() as Promise<AnyRow[]>,
        auditApi.getAll({ limit: 100 }) as Promise<AnyRow[]>,
      ]);

      setUsers(usersData.map(u => ({
        id: String(u.id), name: String(u.name || ''), email: String(u.email || ''),
        role: (u.role as UserRole) || 'field_worker', company: String(u.company || ''),
        status: (u.status as User['status']) || 'active', avatar: u.avatar as string | undefined,
        phone: u.phone as string | undefined, lastLogin: u.last_login as string | undefined,
        createdAt: u.created_at as string || new Date().toISOString(),
      })));

      setAuditEntries(auditData.map(a => ({
        id: Number(a.id), user_id: String(a.user_id || ''), action: String(a.action || ''),
        table_name: String(a.table_name || ''), record_id: a.record_id ? Number(a.record_id) : undefined,
        changes: a.changes as string | undefined, created_at: a.created_at as string || new Date().toISOString(),
        ip_address: a.ip_address as string | undefined, user: a.user as AuditEntry['user'],
      })));

      setCompanies([
        { id: '1', name: 'Acme Construction Ltd', status: 'active', subscriptionPlan: 'enterprise', userCount: 45, userLimit: 50, projectCount: 12, storageUsed: 8 * 1024 * 1024 * 1024, storageLimit: 100 * 1024 * 1024 * 1024, createdAt: '2023-01-15T00:00:00Z' },
        { id: '2', name: 'BuildRight Inc', status: 'active', subscriptionPlan: 'professional', userCount: 18, userLimit: 25, projectCount: 6, storageUsed: 2 * 1024 * 1024 * 1024, storageLimit: 50 * 1024 * 1024 * 1024, createdAt: '2023-09-20T00:00:00Z', expiresAt: '2025-09-20T00:00:00Z' },
        { id: '3', name: 'Greenfield Developers', status: 'trial', subscriptionPlan: 'starter', userCount: 5, userLimit: 10, projectCount: 2, storageUsed: 512 * 1024 * 1024, storageLimit: 10 * 1024 * 1024 * 1024, createdAt: '2024-10-01T00:00:00Z', expiresAt: '2024-11-01T00:00:00Z' },
        { id: '4', name: 'Urban Builders', status: 'active', subscriptionPlan: 'professional', userCount: 22, userLimit: 25, projectCount: 8, storageUsed: 3.5 * 1024 * 1024 * 1024, storageLimit: 50 * 1024 * 1024 * 1024, createdAt: '2023-03-10T00:00:00Z' },
      ]);

      setSystemStats({
        totalUsers: 289, activeUsers: 156, totalCompanies: 35, activeCompanies: 31,
        totalProjects: 142, activeProjects: 87, activeSessions: 42, apiCallsToday: 15847,
        storageUsed: 125 * 1024 * 1024 * 1024, storageTotal: 500 * 1024 * 1024 * 1024,
        systemHealth: 'healthy', uptime: 99.8,
      });

      try { const settingsData = await settingsApi.getAll(); setSettings(settingsData); }
      catch { setSettings({ theme: 'dark', language: 'en', timezone: 'Europe/London' }); }
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsub = eventBus.on('ws:message', ({ type }) => {
      if (type === 'notification' || type === 'dashboard_update') {
        setRefreshing(true);
        setTimeout(() => { loadData(); }, 500);
      }
    });
    return () => unsub();
  }, [loadData]);

  const handleRefresh = () => { setRefreshing(true); loadData(); };
  const handleSettingsSave = (newSettings: AppSettings) => { setSettings(newSettings); };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab stats={systemStats} activities={activities} loading={loading} />;
      case 'users': return <UsersTab users={users} loading={loading} onRefresh={handleRefresh} />;
      case 'companies': return <CompaniesTab companies={companies} loading={loading} />;
      case 'settings': return <SettingsTab settings={settings} loading={loading} onSave={handleSettingsSave} />;
      case 'analytics': return <AnalyticsTab loading={loading} />;
      case 'audit': return <AuditTab entries={auditEntries} loading={loading} />;
      case 'backup': return <BackupTab loading={loading} />;
      case 'deployment': return <DeploymentDashboard />;
      default: return null;
    }
  };

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      <div className="mb-6">
        <ModuleBreadcrumbs currentModule="dashboard" onNavigate={() => {}} extraItems={[{ label: 'Admin Dashboard' }]} />
        <div className="flex items-center justify-between mt-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">System administration and oversight</p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} className="btn btn-secondary flex items-center gap-2">
            <RefreshCw className={clsx('w-4 h-4', refreshing && 'animate-spin')} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all',
                activeTab === tab.key
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="animate-fadeIn">{renderTab()}</div>
    </div>
  );
}

export default AdminDashboard;
