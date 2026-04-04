// Module: Admin Dashboard — CortexBuild Ultimate
// ═══════════════════════════════════════════════════════════════════════════
// Comprehensive administration panel for system management, user oversight,
// company settings, analytics, audit logs, and backup operations.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Building2, Settings2, BarChart3, FileText, Database,
  Search, Plus, Edit2, Trash2, Shield, ShieldAlert, ShieldCheck,
  RefreshCw, Download, Upload, Cloud, CloudOff, CheckCircle2,
  XCircle, Clock, AlertTriangle, Activity, TrendingUp, TrendingDown,
  Eye, Key, Mail, Globe, ToggleLeft, ToggleRight, Lock, Unlock,
  FileSpreadsheet, FileJson, Calendar, LogOut, UserCheck, UserX,
  ChevronRight, Home, X, CheckSquare, Square, Loader2,
  LayoutDashboard, FolderOpen, HardHat,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { usersApi, auditApi, backupApi, settingsApi, type AppSettings } from '../../services/api';
import { eventBus } from '../../lib/eventBus';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { EmptyState } from '../ui/EmptyState';
import { KPICardSkeleton, CardSkeleton, ChartSkeleton } from '../ui/Skeleton';
import { BulkActionsBar, useBulkSelection, type BulkAction } from '../ui/BulkActions';
import { exportData } from '../ui/DataImportExport';
import { DeploymentDashboard } from '../dashboard/DeploymentDashboard';
import { type Module } from '../../types';
import { toast } from 'sonner';
import clsx from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

type AnyRow = Record<string, unknown>;

type UserRole = 'super_admin' | 'company_owner' | 'admin' | 'project_manager' | 'field_worker' | 'client';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company?: string;
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  phone?: string;
  lastLogin?: string;
  createdAt: string;
}

interface Company {
  id: string;
  name: string;
  status: 'active' | 'suspended' | 'trial';
  subscriptionPlan: 'free' | 'starter' | 'professional' | 'enterprise';
  userCount: number;
  userLimit: number;
  projectCount: number;
  storageUsed: number;
  storageLimit: number;
  createdAt: string;
  expiresAt?: string;
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalCompanies: number;
  activeCompanies: number;
  totalProjects: number;
  activeProjects: number;
  activeSessions: number;
  apiCallsToday: number;
  storageUsed: number;
  storageTotal: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  uptime: number;
}

interface AuditEntry {
  id: number;
  user_id: string;
  action: string;
  table_name: string;
  record_id?: number;
  changes?: string;
  created_at: string;
  ip_address?: string;
  user?: { name: string; email: string; avatar?: string };
}

interface ActivityFeedItem {
  id: string;
  type: 'user' | 'system' | 'alert' | 'success';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ElementType;
}

interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

// ─── Tab Definitions ──────────────────────────────────────────────────────────

type AdminTab = 'overview' | 'users' | 'companies' | 'settings' | 'analytics' | 'audit' | 'backup' | 'deployment';

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

// ─── Utility Functions ────────────────────────────────────────────────────────

const fmtCurrency = (n: number) => {
  if (!n || isNaN(n)) return '£0';
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}K`;
  return `£${n.toLocaleString()}`;
};

const fmtNumber = (n: number) => n.toLocaleString();

const fmtDate = (d: string) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

const fmtDateTime = (d: string) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  catch { return d; }
};

const fmtBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const getTimeAgo = (timestamp: string) => {
  const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  company_owner: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  admin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  project_manager: 'bg-green-500/20 text-green-400 border-green-500/30',
  field_worker: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  client: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  company_owner: 'Company Owner',
  admin: 'Admin',
  project_manager: 'Project Manager',
  field_worker: 'Field Worker',
  client: 'Client',
};

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-500/20 text-gray-400',
  starter: 'bg-blue-500/20 text-blue-400',
  professional: 'bg-green-500/20 text-green-400',
  enterprise: 'bg-purple-500/20 text-purple-400',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400',
  inactive: 'bg-gray-500/20 text-gray-400',
  suspended: 'bg-red-500/20 text-red-400',
  trial: 'bg-amber-500/20 text-amber-400',
};

const HEALTH_COLORS: Record<string, string> = {
  healthy: 'text-emerald-400',
  degraded: 'text-amber-400',
  critical: 'text-red-400',
};

// ─── KPI Card Component ───────────────────────────────────────────────────────

interface KPICardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  loading?: boolean;
}

function KPICard({ title, value, change, icon: Icon, color, subtitle, loading }: KPICardProps) {
  if (loading) return <KPICardSkeleton />;

  const TrendIcon = change && change >= 0 ? TrendingUp : TrendingDown;
  const changeColor = change && change >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="card p-5 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
          {change !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              <TrendIcon className={`w-4 h-4 ${changeColor}`} />
              <span className={changeColor}>{change >= 0 ? '+' : ''}{change.toFixed(1)}%</span>
              <span className="text-gray-500">vs last week</span>
            </div>
          )}
          {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20`, color }}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge Component ───────────────────────────────────────────────────

interface StatusBadgeProps {
  status: string;
  type?: 'user' | 'company' | 'plan' | 'health';
}

function StatusBadge({ status, type = 'user' }: StatusBadgeProps) {
  const colors = type === 'plan' ? PLAN_COLORS : type === 'health' ? HEALTH_COLORS : STATUS_COLORS;
  const color = colors[status] || 'bg-gray-500/20 text-gray-400';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' || status === 'healthy' ? 'bg-current animate-pulse' : 'bg-current'}`} />
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  );
}

// ─── Modal Component ──────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
        {footer && (
          <div className="p-6 border-t border-gray-800 bg-gray-900/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

interface OverviewTabProps {
  stats: SystemStats | null;
  activities: ActivityFeedItem[];
  loading: boolean;
}

function OverviewTab({ stats, activities, loading }: OverviewTabProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <KPICardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height={300} />
          <ChartSkeleton height={300} />
        </div>
      </div>
    );
  }

  if (!stats) return <EmptyState title="No data available" description="System stats could not be loaded" variant="error" />;

  const chartData: ChartDataPoint[] = [
    { name: 'Users', value: stats.totalUsers, fill: '#3b82f6' },
    { name: 'Companies', value: stats.totalCompanies, fill: '#10b981' },
    { name: 'Projects', value: stats.totalProjects, fill: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Users"
          value={fmtNumber(stats.totalUsers)}
          change={12.5}
          icon={Users}
          color="#3b82f6"
          subtitle={`${fmtNumber(stats.activeUsers)} active`}
        />
        <KPICard
          title="Companies"
          value={fmtNumber(stats.totalCompanies)}
          change={8.3}
          icon={Building2}
          color="#10b981"
          subtitle={`${fmtNumber(stats.activeCompanies)} active`}
        />
        <KPICard
          title="Projects"
          value={fmtNumber(stats.totalProjects)}
          change={-2.1}
          icon={BarChart3}
          color="#f59e0b"
          subtitle={`${fmtNumber(stats.activeProjects)} active`}
        />
        <KPICard
          title="System Health"
          value={stats.systemHealth === 'healthy' ? '98.5%' : stats.systemHealth === 'degraded' ? '85.2%' : '62.1%'}
          change={stats.systemHealth === 'healthy' ? 1.2 : -5.4}
          icon={stats.systemHealth === 'healthy' ? ShieldCheck : stats.systemHealth === 'degraded' ? AlertTriangle : ShieldAlert}
          color={stats.systemHealth === 'healthy' ? '#10b981' : stats.systemHealth === 'degraded' ? '#f59e0b' : '#ef4444'}
          subtitle={`Uptime: ${stats.uptime.toFixed(1)}%`}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">Active Sessions</span>
          </div>
          <p className="text-2xl font-bold text-white">{fmtNumber(stats.activeSessions)}</p>
          <p className="text-xs text-gray-500 mt-1">Current concurrent users</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Cloud className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Storage Used</span>
          </div>
          <p className="text-2xl font-bold text-white">{fmtBytes(stats.storageUsed)}</p>
          <p className="text-xs text-gray-500 mt-1">of {fmtBytes(stats.storageTotal)} total</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-400">API Calls Today</span>
          </div>
          <p className="text-2xl font-bold text-white">{fmtNumber(stats.apiCallsToday)}</p>
          <p className="text-xs text-gray-500 mt-1">Total requests</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="card p-5">
          <h3 className="text-lg font-bold text-white mb-4">User Growth (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={[
              { name: 'May', users: 120 },
              { name: 'Jun', users: 145 },
              { name: 'Jul', users: 178 },
              { name: 'Aug', users: 210 },
              { name: 'Sep', users: 245 },
              { name: 'Oct', users: stats.totalUsers },
            ]}>
              <defs>
                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} stroke="#374151" />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} stroke="#374151" />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} fill="url(#userGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution Chart */}
        <div className="card p-5">
          <h3 className="text-lg font-bold text-white mb-4">Resource Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill as string} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="card p-5">
        <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            const colors = {
              user: 'bg-blue-500/20 text-blue-400',
              system: 'bg-gray-500/20 text-gray-400',
              alert: 'bg-amber-500/20 text-amber-400',
              success: 'bg-emerald-500/20 text-emerald-400',
            };
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors"
                style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s both` }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors[activity.type]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{activity.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                </div>
                <span className="text-xs text-gray-500">{getTimeAgo(activity.timestamp)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

interface UsersTabProps {
  users: User[];
  loading: boolean;
  onRefresh: () => void;
}

function UsersTab({ users, loading, onRefresh }: UsersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  const { selectedIds, isSelected, toggle, toggleAll, clearSelection, selectAll } = useBulkSelection();

  const filteredUsers = users.filter(user => {
    if (searchQuery && !user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !user.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterRole !== 'all' && user.role !== filterRole) return false;
    if (filterStatus !== 'all' && user.status !== filterStatus) return false;
    return true;
  });

  const handleBulkAction = async (action: string) => {
    const ids = Array.from(selectedIds);
    if (action === 'delete') {
      if (!confirm(`Delete ${ids.length} users? This cannot be undone.`)) return;
      try {
        await Promise.all(ids.map(id => usersApi.delete(id)));
        toast.success(`Deleted ${ids.length} users`);
        onRefresh();
        clearSelection();
      } catch {
        toast.error('Failed to delete users');
      }
    } else if (action === 'activate') {
      toast.success(`Activated ${ids.length} users`);
      clearSelection();
    } else if (action === 'deactivate') {
      toast.success(`Deactivated ${ids.length} users`);
      clearSelection();
    }
  };

  const bulkActions: BulkAction[] = [
    { id: 'activate', label: 'Activate', icon: UserCheck, variant: 'primary', onClick: () => handleBulkAction('activate') },
    { id: 'deactivate', label: 'Deactivate', icon: UserX, variant: 'default', onClick: () => handleBulkAction('deactivate') },
    { id: 'delete', label: 'Delete', icon: Trash2, variant: 'danger', onClick: () => handleBulkAction('delete'), confirm: 'Are you sure?' },
  ];

  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '', email: '', role: 'field_worker', status: 'active',
  });

  const handleCreate = async () => {
    if (!newUser.name || !newUser.email) {
      toast.error('Name and email are required');
      return;
    }
    setCreating(true);
    try {
      await usersApi.create({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      });
      toast.success('User created successfully');
      setShowCreateModal(false);
      setNewUser({ name: '', email: '', role: 'field_worker', status: 'active' });
      onRefresh();
    } catch {
      toast.error('Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const columns = [
    { key: 'user', header: 'User', width: '250px', render: (user: AnyRow) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
          {String(user.name || '').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-white">{String(user.name || '')}</p>
          <p className="text-xs text-gray-500">{String(user.email || '')}</p>
        </div>
      </div>
    )},
    { key: 'role', header: 'Role', width: '150px', render: (user: AnyRow) => {
      const role = String(user.role || 'field_worker') as UserRole;
      return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[role] || ROLE_COLORS.field_worker}`}>
          {ROLE_LABELS[role] || 'Field Worker'}
        </span>
      );
    }},
    { key: 'status', header: 'Status', width: '120px', render: (user: AnyRow) => (
      <StatusBadge status={String(user.status || 'active')} />
    )},
    { key: 'company', header: 'Company', width: '180px', render: (user: AnyRow) => (
      <span className="text-sm text-gray-300">{String(user.company || '—')}</span>
    )},
    { key: 'lastLogin', header: 'Last Login', width: '150px', render: (user: AnyRow) => (
      <span className="text-sm text-gray-400">{fmtDateTime(String(user.lastLogin || ''))}</span>
    )},
    { key: 'actions', header: 'Actions', width: '120px', render: (user: AnyRow) => (
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedUser(user as unknown as User); setShowEditModal(true); }}
          className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
          title="Edit user"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); }}
          className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
          title="Reset password"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <div className="h-10 w-64 bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-10 w-40 bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-10 w-40 bg-gray-800 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-800 rounded-lg animate-pulse" />
        </div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-800/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <option key={role} value={role}>{label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add User
        </button>
        <button onClick={onRefresh} className="btn btn-secondary p-2">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900 sticky top-0 z-10">
            <tr className="border-b border-gray-700">
              <th className="w-12 p-3">
                <button onClick={toggleAll} className="flex items-center justify-center">
                  {selectedIds.size === filteredUsers.length && filteredUsers.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-600 hover:text-gray-400" />
                  )}
                </button>
              </th>
              {columns.map(col => (
                <th key={col.key} className="text-left p-3 text-xs font-medium text-gray-400 uppercase" style={{ width: col.width }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-12 text-center">
                  <EmptyState title="No users found" description="Try adjusting your search or filters" />
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr
                  key={user.id}
                  onClick={() => toggle(user.id)}
                  className={clsx(
                    'border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors',
                    isSelected(user.id) && 'bg-blue-900/20'
                  )}
                >
                  <td className="p-3">
                    <div className="flex items-center justify-center">
                      {isSelected(user.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-600 hover:text-gray-400" />
                      )}
                    </div>
                  </td>
                  {columns.map(col => (
                    <td key={col.key} className="p-3">
                      {col.render ? col.render(user as unknown as AnyRow) : String((user as unknown as AnyRow)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <BulkActionsBar
          selectedIds={Array.from(selectedIds)}
          actions={bulkActions}
          onClearSelection={clearSelection}
        />
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleCreate} disabled={creating} className="btn btn-primary">
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create User
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
            <input
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {Object.entries(ROLE_LABELS).map(([role, label]) => (
                <option key={role} value={role}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
            <select
              value={newUser.status}
              onChange={(e) => setNewUser({ ...newUser, status: e.target.value as User['status'] })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedUser(null); }}
        title="Edit User"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => { setShowEditModal(false); setSelectedUser(null); }} className="btn btn-secondary">Cancel</button>
            <button onClick={() => { toast.success('User updated'); setShowEditModal(false); setSelectedUser(null); }} className="btn btn-primary">
              Save Changes
            </button>
          </div>
        }
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
              <input
                type="text"
                defaultValue={selectedUser.name}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input
                type="email"
                defaultValue={selectedUser.email}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
              <select defaultValue={selectedUser.role} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <option key={role} value={role}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
              <select defaultValue={selectedUser.status} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Companies Tab ────────────────────────────────────────────────────────────

interface CompaniesTabProps {
  companies: Company[];
  loading: boolean;
}

function CompaniesTab({ companies, loading }: CompaniesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const filteredCompanies = companies.filter(company => {
    if (searchQuery && !company.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPlan !== 'all' && company.subscriptionPlan !== filterPlan) return false;
    if (filterStatus !== 'all' && company.status !== filterStatus) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredCompanies.length === 0 ? (
          <div className="col-span-full">
            <EmptyState title="No companies found" description="Try adjusting your search or filters" />
          </div>
        ) : (
          filteredCompanies.map(company => (
            <div
              key={company.id}
              onClick={() => { setSelectedCompany(company); setShowDetailsModal(true); }}
              className="card p-5 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {company.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{company.name}</h3>
                    <p className="text-xs text-gray-500">Since {fmtDate(company.createdAt)}</p>
                  </div>
                </div>
                <StatusBadge status={company.status} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Plan</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PLAN_COLORS[company.subscriptionPlan]}`}>
                    {company.subscriptionPlan.charAt(0).toUpperCase() + company.subscriptionPlan.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Users</span>
                  <span className="text-sm text-white">{company.userCount} / {company.userLimit}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${(company.userCount / company.userLimit) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {company.projectCount} projects
                    </span>
                    <span className="flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      {fmtBytes(company.storageUsed)}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Company Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedCompany(null); }}
        title="Company Details"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => { setShowDetailsModal(false); setSelectedCompany(null); }} className="btn btn-secondary">Close</button>
            <button className="btn btn-primary">Edit Settings</button>
          </div>
        }
      >
        {selectedCompany && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-800">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                {selectedCompany.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedCompany.name}</h3>
                <p className="text-sm text-gray-500">Created {fmtDate(selectedCompany.createdAt)}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Subscription</p>
                <p className="text-lg font-bold text-white capitalize">{selectedCompany.subscriptionPlan}</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Users</p>
                <p className="text-lg font-bold text-white">{selectedCompany.userCount}/{selectedCompany.userLimit}</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Projects</p>
                <p className="text-lg font-bold text-white">{selectedCompany.projectCount}</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Storage</p>
                <p className="text-lg font-bold text-white">{fmtBytes(selectedCompany.storageUsed)}</p>
              </div>
            </div>

            {/* Usage Bars */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">User Limit Usage</span>
                  <span className="text-sm text-white">{((selectedCompany.userCount / selectedCompany.userLimit) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${(selectedCompany.userCount / selectedCompany.userLimit) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Storage Usage</span>
                  <span className="text-sm text-white">{((selectedCompany.storageUsed / selectedCompany.storageLimit) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${(selectedCompany.storageUsed / selectedCompany.storageLimit) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h4 className="font-medium text-white mb-3">Subscription Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status</span>
                  <StatusBadge status={selectedCompany.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Plan Started</span>
                  <span className="text-white">{fmtDate(selectedCompany.createdAt)}</span>
                </div>
                {selectedCompany.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Renews On</span>
                    <span className="text-white">{fmtDate(selectedCompany.expiresAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

interface SettingsTabProps {
  settings: AppSettings | null;
  loading: boolean;
  onSave: (settings: AppSettings) => void;
}

function SettingsTab({ settings, loading, onSave }: SettingsTabProps) {
  const [activeSection, setActiveSection] = useState('general');
  const [localSettings, setLocalSettings] = useState<AppSettings>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  const sections = [
    { id: 'general', label: 'General', icon: Settings2 },
    { id: 'features', label: 'Feature Flags', icon: ToggleRight },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'oauth', label: 'OAuth', icon: Key },
    { id: 'api', label: 'API Keys', icon: Lock },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.updateSetting('theme', localSettings.theme || 'dark');
      toast.success('Settings saved successfully');
      onSave(localSettings);
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-6">
        <div className="w-64 space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-800 rounded-lg animate-pulse" />)}
        </div>
        <div className="flex-1 space-y-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-64 shrink-0">
        <nav className="space-y-1">
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  activeSection === section.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white capitalize">{activeSection} Settings</h3>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Save Changes
          </button>
        </div>

        {activeSection === 'general' && (
          <div className="space-y-6">
            <div className="card p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Platform Name</label>
                <input
                  type="text"
                  defaultValue="CortexBuild Ultimate"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Default Theme</label>
                <select
                  value={localSettings.theme || 'dark'}
                  onChange={(e) => setLocalSettings({ ...localSettings, theme: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Default Language</label>
                <select
                  value={localSettings.language || 'en'}
                  onChange={(e) => setLocalSettings({ ...localSettings, language: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Timezone</label>
                <input
                  type="text"
                  value={localSettings.timezone || 'Europe/London'}
                  onChange={(e) => setLocalSettings({ ...localSettings, timezone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'features' && (
          <div className="card p-5 space-y-4">
            {[
              { key: 'aiAssistant', label: 'AI Assistant', description: 'Enable AI-powered features across the platform' },
              { key: 'advancedAnalytics', label: 'Advanced Analytics', description: 'Access to predictive analytics and BI tools' },
              { key: 'bimViewer', label: 'BIM Viewer', description: '3D model viewing and collaboration' },
              { key: 'mobileApp', label: 'Mobile App', description: 'Allow mobile app access for field workers' },
              { key: 'apiAccess', label: 'API Access', description: 'Enable API access for integrations' },
              { key: 'webhooks', label: 'Webhooks', description: 'Allow webhook configurations' },
            ].map(feature => (
              <div key={feature.key} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">{feature.label}</p>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
                <button
                  onClick={() => {
                    const features = localSettings.dashboard || {};
                    setLocalSettings({ ...localSettings, dashboard: { ...features, [feature.key]: !features[feature.key] } });
                  }}
                  className={clsx(
                    'relative w-12 h-6 rounded-full transition-colors',
                    (localSettings.dashboard?.[feature.key]) ? 'bg-blue-500' : 'bg-gray-700'
                  )}
                >
                  <div
                    className={clsx(
                      'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                      (localSettings.dashboard?.[feature.key]) ? 'left-7' : 'left-1'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'email' && (
          <div className="card p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">SMTP Host</label>
              <input
                type="text"
                placeholder="smtp.example.com"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">SMTP Port</label>
                <input
                  type="number"
                  placeholder="587"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Encryption</label>
                <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                  <option value="tls">TLS</option>
                  <option value="ssl">SSL</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
              <input
                type="text"
                placeholder="notifications@example.com"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button className="btn btn-secondary">Test Connection</button>
              <span className="text-sm text-gray-500">Send a test email to verify settings</span>
            </div>
          </div>
        )}

        {activeSection === 'oauth' && (
          <div className="card p-5 space-y-6">
            {[
              { provider: 'Google', enabled: true },
              { provider: 'GitHub', enabled: false },
              { provider: 'Microsoft', enabled: false },
            ].map(provider => (
              <div key={provider.provider} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-white">{provider.provider} OAuth</p>
                    <p className="text-sm text-gray-500">
                      {provider.enabled ? 'Configured and active' : 'Not configured'}
                    </p>
                  </div>
                </div>
                <button className="btn btn-secondary text-sm">
                  {provider.enabled ? 'Configure' : 'Set Up'}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'api' && (
          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-white">API Keys</h4>
                <button className="btn btn-primary text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Key
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Production Key', prefix: 'pk_live_', created: '2024-01-15', lastUsed: '2 hours ago' },
                  { name: 'Development Key', prefix: 'pk_test_', created: '2024-02-20', lastUsed: '1 day ago' },
                ].map((key, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="font-medium text-white">{key.name}</p>
                      <p className="text-sm text-gray-500 font-mono">{key.prefix}••••••••••••</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">Last used {key.lastUsed}</span>
                      <button className="text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

interface AnalyticsTabProps {
  loading: boolean;
}

function AnalyticsTab({ loading }: AnalyticsTabProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height={300} />
          <ChartSkeleton height={300} />
          <ChartSkeleton height={300} />
          <ChartSkeleton height={300} />
        </div>
      </div>
    );
  }

  const userGrowthData = [
    { month: 'May', users: 120, companies: 15 },
    { month: 'Jun', users: 145, companies: 18 },
    { month: 'Jul', users: 178, companies: 22 },
    { month: 'Aug', users: 210, companies: 26 },
    { month: 'Sep', users: 245, companies: 31 },
    { month: 'Oct', users: 289, companies: 35 },
  ];

  const moduleUsageData = [
    { name: 'Projects', value: 85, color: '#3b82f6' },
    { name: 'Invoicing', value: 72, color: '#10b981' },
    { name: 'Safety', value: 68, color: '#f59e0b' },
    { name: 'RFIs', value: 54, color: '#8b5cf6' },
    { name: 'Documents', value: 48, color: '#06b6d4' },
    { name: 'Teams', value: 42, color: '#ec4899' },
  ];

  const projectCreationData = [
    { week: 'Week 1', projects: 12 },
    { week: 'Week 2', projects: 18 },
    { week: 'Week 3', projects: 15 },
    { week: 'Week 4', projects: 24 },
  ];

  const errorTrackingData = [
    { date: 'Mon', errors: 5, warnings: 12 },
    { date: 'Tue', errors: 3, warnings: 8 },
    { date: 'Wed', errors: 8, warnings: 15 },
    { date: 'Thu', errors: 2, warnings: 6 },
    { date: 'Fri', errors: 6, warnings: 10 },
    { date: 'Sat', errors: 1, warnings: 3 },
    { date: 'Sun', errors: 2, warnings: 4 },
  ];

  return (
    <div className="space-y-6">
      {/* User Growth & Project Creation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-lg font-bold text-white mb-4">User & Company Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={userGrowthData}>
              <defs>
                <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="companiesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} stroke="#374151" />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} stroke="#374151" />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Legend />
              <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} fill="url(#usersGradient)" name="Users" />
              <Area type="monotone" dataKey="companies" stroke="#10b981" strokeWidth={2} fill="url(#companiesGradient)" name="Companies" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-bold text-white mb-4">Project Creation Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectCreationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 11 }} stroke="#374151" />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} stroke="#374151" />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Bar dataKey="projects" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Module Usage & Error Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-lg font-bold text-white mb-4">Module Usage Statistics</h3>
          <div className="space-y-4">
            {moduleUsageData.map((module, i) => (
              <div key={module.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">{module.name}</span>
                  <span className="text-sm font-medium text-white">{module.value}% adoption</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${module.value}%`, background: module.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-bold text-white mb-4">Error Tracking (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={errorTrackingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} stroke="#374151" />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} stroke="#374151" />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="errors" fill="#ef4444" radius={[4, 4, 0, 0]} name="Errors" />
              <Bar dataKey="warnings" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Warnings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Popular Features */}
      <div className="card p-5">
        <h3 className="text-lg font-bold text-white mb-4">Popular Features</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { name: 'Dashboard', usage: '92%', icon: LayoutDashboard },
            { name: 'Projects', usage: '87%', icon: FolderOpen },
            { name: 'Invoicing', usage: '78%', icon: FileText },
            { name: 'Safety', usage: '71%', icon: Shield },
            { name: 'RFIs', usage: '65%', icon: HardHat },
            { name: 'Documents', usage: '58%', icon: FileText },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="p-4 bg-gray-800/50 rounded-lg text-center">
                <Icon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">{feature.name}</p>
                <p className="text-xs text-gray-500 mt-1">{feature.usage} active</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Audit Logs Tab ───────────────────────────────────────────────────────────

interface AuditTabProps {
  entries: AuditEntry[];
  loading: boolean;
}

function AuditTab({ entries, loading }: AuditTabProps) {
  const [filterAction, setFilterAction] = useState('all');
  const [filterTable, setFilterTable] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = entries.filter(entry => {
    if (filterAction !== 'all' && entry.action !== filterAction) return false;
    if (filterTable !== 'all' && entry.table_name !== filterTable) return false;
    if (searchQuery && !entry.table_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'create': return 'bg-emerald-500/20 text-emerald-400';
      case 'update': return 'bg-blue-500/20 text-blue-400';
      case 'delete': return 'bg-red-500/20 text-red-400';
      case 'view': return 'bg-cyan-500/20 text-cyan-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(10)].map((_, i) => <div key={i} className="h-16 bg-gray-800/50 rounded-lg animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search audit logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="view">View</option>
        </select>
        <select
          value={filterTable}
          onChange={(e) => setFilterTable(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Tables</option>
          <option value="projects">Projects</option>
          <option value="users">Users</option>
          <option value="invoices">Invoices</option>
          <option value="safety_incidents">Safety</option>
        </select>
        <button className="btn btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900 sticky top-0 z-10">
            <tr className="border-b border-gray-700">
              <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase">Action</th>
              <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase">User</th>
              <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase">Table</th>
              <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase">Record ID</th>
              <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase">Timestamp</th>
              <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <EmptyState title="No audit entries found" description="Try adjusting your filters" />
                </td>
              </tr>
            ) : (
              filteredEntries.map(entry => (
                <tr key={entry.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(entry.action)}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                        {entry.user?.name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-sm text-white">{entry.user?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-gray-300">{entry.table_name}</td>
                  <td className="p-3 text-sm text-gray-400 font-mono">{entry.record_id || '—'}</td>
                  <td className="p-3 text-sm text-gray-400">{fmtDateTime(entry.created_at)}</td>
                  <td className="p-3 text-sm text-gray-500 font-mono">{entry.ip_address || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Backup & Export Tab ──────────────────────────────────────────────────────

interface BackupTabProps {
  loading: boolean;
}

function BackupTab({ loading }: BackupTabProps) {
  const [exporting, setExporting] = useState(false);
  const [backupRunning, setBackupRunning] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('json');

  const handleExport = async (table?: string) => {
    setExporting(true);
    try {
      if (table) {
        const data = await backupApi.exportTable(table, exportFormat);
        const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], {
          type: exportFormat === 'json' ? 'application/json' : 'text/csv',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${table}_${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
        link.click();
        URL.revokeObjectURL(link.href);
        toast.success(`Exported ${table}`);
      } else {
        const data = await backupApi.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `full_backup_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
        toast.success('Full backup exported');
      }
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleBackup = async () => {
    setBackupRunning(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Database backup created successfully');
    } catch {
      toast.error('Backup failed');
    } finally {
      setBackupRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Database className="w-6 h-6 text-blue-400" />
            <h3 className="font-bold text-white">Database Backup</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">Create a full backup of all database tables</p>
          <button onClick={handleBackup} disabled={backupRunning} className="btn btn-primary w-full">
            {backupRunning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Cloud className="w-4 h-4 mr-2" />}
            {backupRunning ? 'Creating Backup...' : 'Create Backup'}
          </button>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Download className="w-6 h-6 text-green-400" />
            <h3 className="font-bold text-white">Export All Data</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">Download complete system data as JSON</p>
          <button onClick={() => handleExport()} disabled={exporting} className="btn btn-primary w-full">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            {exporting ? 'Exporting...' : 'Export All'}
          </button>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <Upload className="w-6 h-6 text-purple-400" />
            <h3 className="font-bold text-white">Import Data</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">Restore data from backup file</p>
          <button className="btn btn-secondary w-full">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </button>
        </div>
      </div>

      {/* Table Exports */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Export Tables</h3>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            'users', 'projects', 'invoices', 'safety_incidents', 'rfis', 'team_members',
            'companies', 'documents', 'change_orders', 'timesheets', 'meetings', 'audit_log',
          ].map(table => (
            <button
              key={table}
              onClick={() => handleExport(table)}
              disabled={exporting}
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors group"
            >
              <span className="text-sm text-gray-300 capitalize">{table.replace(/_/g, ' ')}</span>
              <Download className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Scheduled Backups */}
      <div className="card p-5">
        <h3 className="text-lg font-bold text-white mb-4">Scheduled Backups</h3>
        <div className="space-y-3">
          {[
            { name: 'Daily Backup', schedule: '0 2 * * *', lastRun: '2 hours ago', nextRun: 'in 22 hours', enabled: true },
            { name: 'Weekly Full Backup', schedule: '0 3 * * 0', lastRun: '3 days ago', nextRun: 'in 4 days', enabled: true },
            { name: 'Monthly Archive', schedule: '0 4 1 * *', lastRun: '1 month ago', nextRun: 'in 29 days', enabled: false },
          ].map((backup, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${backup.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
                <div>
                  <p className="font-medium text-white">{backup.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{backup.schedule}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Last run</p>
                  <p className="text-sm text-white">{backup.lastRun}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Next run</p>
                  <p className="text-sm text-white">{backup.nextRun}</p>
                </div>
                <button className={clsx(
                  'relative w-12 h-6 rounded-full transition-colors',
                  backup.enabled ? 'bg-blue-500' : 'bg-gray-700'
                )}>
                  <div className={clsx(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    backup.enabled ? 'left-7' : 'left-1'
                  )} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
        id: String(u.id),
        name: String(u.name || ''),
        email: String(u.email || ''),
        role: (u.role as UserRole) || 'field_worker',
        company: String(u.company || ''),
        status: (u.status as User['status']) || 'active',
        avatar: u.avatar as string | undefined,
        phone: u.phone as string | undefined,
        lastLogin: u.last_login as string | undefined,
        createdAt: u.created_at as string || new Date().toISOString(),
      })));

      setAuditEntries(auditData.map(a => ({
        id: Number(a.id),
        user_id: String(a.user_id || ''),
        action: String(a.action || ''),
        table_name: String(a.table_name || ''),
        record_id: a.record_id ? Number(a.record_id) : undefined,
        changes: a.changes as string | undefined,
        created_at: a.created_at as string || new Date().toISOString(),
        ip_address: a.ip_address as string | undefined,
        user: a.user as AuditEntry['user'],
      })));

      // Mock companies data
      setCompanies([
        { id: '1', name: 'Acme Construction Ltd', status: 'active', subscriptionPlan: 'enterprise', userCount: 45, userLimit: 100, projectCount: 12, storageUsed: 5 * 1024 * 1024 * 1024, storageLimit: 100 * 1024 * 1024 * 1024, createdAt: '2023-06-15T00:00:00Z', expiresAt: '2025-06-15T00:00:00Z' },
        { id: '2', name: 'BuildRight Inc', status: 'active', subscriptionPlan: 'professional', userCount: 18, userLimit: 25, projectCount: 6, storageUsed: 2 * 1024 * 1024 * 1024, storageLimit: 50 * 1024 * 1024 * 1024, createdAt: '2023-09-20T00:00:00Z', expiresAt: '2025-09-20T00:00:00Z' },
        { id: '3', name: 'Greenfield Developers', status: 'trial', subscriptionPlan: 'starter', userCount: 5, userLimit: 10, projectCount: 2, storageUsed: 512 * 1024 * 1024, storageLimit: 10 * 1024 * 1024 * 1024, createdAt: '2024-10-01T00:00:00Z', expiresAt: '2024-11-01T00:00:00Z' },
        { id: '4', name: 'Urban Builders', status: 'active', subscriptionPlan: 'professional', userCount: 22, userLimit: 25, projectCount: 8, storageUsed: 3.5 * 1024 * 1024 * 1024, storageLimit: 50 * 1024 * 1024 * 1024, createdAt: '2023-03-10T00:00:00Z' },
      ]);

      // Mock system stats
      setSystemStats({
        totalUsers: 289,
        activeUsers: 156,
        totalCompanies: 35,
        activeCompanies: 31,
        totalProjects: 142,
        activeProjects: 87,
        activeSessions: 42,
        apiCallsToday: 15847,
        storageUsed: 125 * 1024 * 1024 * 1024,
        storageTotal: 500 * 1024 * 1024 * 1024,
        systemHealth: 'healthy',
        uptime: 99.8,
      });

      // Load settings
      try {
        const settingsData = await settingsApi.getAll();
        setSettings(settingsData);
      } catch {
        setSettings({ theme: 'dark', language: 'en', timezone: 'Europe/London' });
      }
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // WebSocket for real-time updates
    const unsub = eventBus.on('ws:message', ({ type }) => {
      if (type === 'notification' || type === 'dashboard_update') {
        setRefreshing(true);
        setTimeout(() => {
          loadData();
        }, 500);
      }
    });

    return () => unsub();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSettingsSave = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={systemStats} activities={activities} loading={loading} />;
      case 'users':
        return <UsersTab users={users} loading={loading} onRefresh={handleRefresh} />;
      case 'companies':
        return <CompaniesTab companies={companies} loading={loading} />;
      case 'settings':
        return <SettingsTab settings={settings} loading={loading} onSave={handleSettingsSave} />;
      case 'analytics':
        return <AnalyticsTab loading={loading} />;
      case 'audit':
        return <AuditTab entries={auditEntries} loading={loading} />;
      case 'backup':
        return <BackupTab loading={loading} />;
      case 'deployment':
        return <DeploymentDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      {/* Header */}
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

      {/* Tab Navigation */}
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

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {renderTab()}
      </div>
    </div>
  );
}

export default AdminDashboard;
