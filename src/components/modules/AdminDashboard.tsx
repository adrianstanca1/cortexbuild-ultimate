// Module: Admin Dashboard — CortexBuild Ultimate
// Comprehensive administration panel for system management, user oversight,
// company settings, analytics, audit logs, and backup operations.

import { useState } from 'react';
import {
  Users, Building2, Settings2, BarChart3, FileText, Database,
  RefreshCw, Activity, TrendingUp,
} from 'lucide-react';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { DeploymentDashboard } from '../dashboard/DeploymentDashboard';
import clsx from 'clsx';
import {
  OverviewTab, UsersTab, CompaniesTab, SettingsTab,
  AnalyticsTab, AuditTab, BackupTab,
} from '../admin-dashboard';

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
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab loading={false} />;
      case 'users': return <UsersTab loading={false} onRefresh={handleRefresh} />;
      case 'companies': return <CompaniesTab loading={false} />;
      case 'settings': return <SettingsTab loading={false} onSave={() => {}} />;
      case 'analytics': return <AnalyticsTab loading={false} />;
      case 'audit': return <AuditTab loading={false} />;
      case 'backup': return <BackupTab loading={false} />;
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
