import { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Users,
  Lock,
  RefreshCw,
  Activity,
  CheckSquare,
  Square,
} from 'lucide-react';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { permissionsApi, type Role, type Permissions } from '../../services/api';
import { toast } from 'sonner';
import clsx from 'clsx';

type AnyRow = Record<string, unknown>;
type SubTab = 'roles' | 'permissions' | 'users' | 'teams' | 'activity';

const _ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-500/20 text-emerald-400',
  read: 'bg-blue-500/20 text-blue-400',
  update: 'bg-amber-500/20 text-amber-400',
  delete: 'bg-red-500/20 text-red-400',
  export: 'bg-purple-500/20 text-purple-400',
  approve: 'bg-cyan-500/20 text-cyan-400',
};

const TABS: { key: SubTab; label: string; icon: React.ElementType }[] = [
  { key: 'roles', label: 'Roles', icon: Shield },
  { key: 'permissions', label: 'Permissions', icon: Lock },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'teams', label: 'Teams', icon: Users },
  { key: 'activity', label: 'Activity', icon: Activity },
];

export function PermissionsManager() {
  const [roles, setRoles] = useState<(Role & AnyRow)[]>([]);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<SubTab>('roles');
  const [selectedRole, setSelectedRole] = useState<(Role & AnyRow) | null>(null);
  const [_expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [editedPermissions, setEditedPermissions] = useState<Record<string, string[]>>({});
  const [_saving, _setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} role(s)?`)) return;
    try {
      await Promise.all(ids.map(id => permissionsApi.deleteRole(String(id))));
      toast.success(`Deleted ${ids.length} role(s)`);
      loadData();
      clearSelection();
    } catch {
      toast.error('Bulk delete failed');
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, permsData] = await Promise.all([
        permissionsApi.getRoles(),
        permissionsApi.getPermissions(),
      ]);
      setRoles(rolesData as (Role & AnyRow)[]);
      setPermissions(permsData);
    } catch {
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (role: Role & AnyRow) => {
    setSelectedRole(role);
    setEditedPermissions((role.permissions as Record<string, string[]>) || {});
  };

  const _togglePermission = (module: string, action: string) => {
    setEditedPermissions(prev => {
      const modulePerms = prev[module] || [];
      if (modulePerms.includes(action)) {
        return { ...prev, [module]: modulePerms.filter(a => a !== action) };
      }
      return { ...prev, [module]: [...modulePerms, action] };
    });
  };

  const _toggleModuleWildcard = (module: string) => {
    setEditedPermissions(prev => {
      if (prev[module]?.includes('*')) {
        return { ...prev, [module]: [] };
      }
      return { ...prev, [module]: ['*'] };
    });
  };

  const _hasPermission = (module: string, action: string): boolean => {
    const modulePerms = editedPermissions[module] || [];
    if (modulePerms.includes('*')) return true;
    if (editedPermissions['*']?.includes('*')) return true;
    return modulePerms.includes(action);
  };

  const _saveChanges = async () => {
    if (!selectedRole) return;
    if (selectedRole.isSystem) {
      toast.error('Cannot modify system roles');
      return;
    }
    _setSaving(true);
    try {
      await permissionsApi.updateRole(String(selectedRole.id), { permissions: editedPermissions });
      toast.success('Permissions updated');
      loadData();
    } catch {
      toast.error('Failed to update permissions');
    } finally {
      _setSaving(false);
    }
  };

  const _deleteRole = async (roleId: string | number) => {
    if (!window.confirm('Delete this role? This action cannot be undone.')) return;
    try {
      await permissionsApi.deleteRole(String(roleId));
      toast.success('Role deleted');
      if (String(selectedRole?.id) === String(roleId)) setSelectedRole(null);
      loadData();
    } catch {
      toast.error('Failed to delete role');
    }
  };

  const _toggleModule = (module: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  };

  const _actions = (permissions?.actions as Record<string, AnyRow>) || {};
  const modules = (permissions?.modules as Record<string, AnyRow>) || {};

  const filteredRoles = roles.filter(r =>
    String(r.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <ModuleBreadcrumbs currentModule="permissions" onNavigate={() => {}} />
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Permissions & Access Control</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 btn btn-primary rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Role
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="input input-bordered p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Total Users</p>
          <p className="text-2xl font-bold text-white">124</p>
        </div>
        <div className="input input-bordered p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Roles Defined</p>
          <p className="text-2xl font-bold text-white">{Number(roles.length)}</p>
        </div>
        <div className="input input-bordered p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Permission Changes</p>
          <p className="text-2xl font-bold text-white">18</p>
        </div>
        <div className="input input-bordered p-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Inactive Users</p>
          <p className="text-2xl font-bold text-white">7</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-gray-700 flex gap-1 cb-table-scroll touch-pan-x">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                subTab === t.key
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ROLES TAB */}
      {subTab === 'roles' && (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                />
              </div>
              <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 flex justify-center">
                    <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                  </div>
                ) : (
                  filteredRoles.map(role => {
                    const isSelected = selectedIds.has(String(role.id));
                    return (
                    <button
                      key={String(role.id)}
                      onClick={() => selectRole(role)}
                      className={clsx(
                        'w-full text-left p-4 transition-colors border-l-2 flex items-start gap-2',
                        String(selectedRole?.id) === String(role.id)
                          ? 'bg-blue-600/20 border-blue-500'
                          : 'hover:bg-gray-800/50 border-transparent'
                      )}
                    >
                      <button type="button" onClick={e => { e.stopPropagation(); toggle(String(role.id)); }} className="mt-0.5">
                        {isSelected ? <CheckSquare size={16} className="text-blue-400"/> : <Square size={16} className="text-gray-500"/>}
                      </button>
                      <div>
                        <p className="font-medium text-white text-sm">{String(role.name ?? 'Untitled')}</p>
                        <p className="text-xs text-gray-500">{String(role.description ?? '')}</p>
                        {Boolean(role.isSystem) && (
                          <div className="mt-2 flex items-center gap-1">
                            <Lock className="h-3 w-3 text-gray-600" />
                            <span className="text-xs text-gray-500">System Role</span>
                          </div>
                        )}
                      </div>
                    </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          </div>

          <BulkActionsBar
          selectedIds={Array.from(selectedIds)}
          actions={[
            { id: 'delete', label: 'Delete Selected', icon: Trash2, variant: 'danger', onClick: handleBulkDelete, confirm: 'This action cannot be undone.' },
          ]}
          onClearSelection={clearSelection}
        />
        </>
      )}

      {/* PERMISSIONS TAB */}
      {subTab === 'permissions' && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <div className="cb-table-scroll touch-pan-x">
            <table className="w-full text-xs">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-300">Module</th>
                  {filteredRoles.slice(0, 4).map(role => (
                    <th key={String(role.id)} className="text-center px-3 py-3 font-semibold text-gray-300">
                      {String(role.name ?? '')
                        .split(' ')
                        .slice(0, 2)
                        .join(' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {Object.entries(modules).map(([module]) => (
                  <tr key={String(module)} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-300">{String(module)}</td>
                    {filteredRoles.slice(0, 4).map(role => (
                      <td key={String(role.id)} className="text-center px-3 py-3">
                        <span className="text-gray-400">●●●●</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {subTab === 'users' && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex gap-3">
            <input
              type="text"
              placeholder="Search users..."
              className="flex-1 bg-gray-800 border border-gray-700 btn text-white text-sm"
            />
            <button className="px-4 py-2 btn btn-primary rounded-lg text-sm font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Invite User
            </button>
          </div>
          <div className="cb-table-scroll touch-pan-x">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Last Active</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {[
                  { name: 'Alice Johnson', email: 'alice@cortex.com', role: 'Admin', lastActive: '2 hours ago' },
                  { name: 'Bob Smith', email: 'bob@cortex.com', role: 'Project Manager', lastActive: '1 day ago' },
                ].map((user, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-300 font-medium">{String(user.name)}</td>
                    <td className="px-4 py-3 text-gray-400">{String(user.email)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                        {String(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{String(user.lastActive)}</td>
                    <td className="px-4 py-3">
                      <button className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TEAMS TAB */}
      {subTab === 'teams' && (
        <div className="space-y-4">
          <button className="px-4 py-2 btn btn-primary rounded-lg text-sm font-medium flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Team
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Site Team A', members: 8, projects: 3 },
              { name: 'Finance Team', members: 4, projects: 2 },
            ].map((team, idx) => (
              <div key={idx} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-white">{String(team.name)}</h4>
                    <p className="text-xs text-gray-400">{Number(team.members)} members</p>
                  </div>
                  <button className="p-2 hover:bg-gray-800 rounded-lg">
                    <Edit2 className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">Projects: {Number(team.projects)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVITY TAB */}
      {subTab === 'activity' && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <div className="cb-table-scroll touch-pan-x">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Changed By</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Change</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {[
                  { by: 'Admin', change: 'Updated Site Manager role permissions', date: '2026-03-20' },
                  { by: 'Alice', change: 'Created Finance Officer role', date: '2026-03-18' },
                ].map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-300">{String(log.by)}</td>
                    <td className="px-4 py-3 text-gray-400">{String(log.change)}</td>
                    <td className="px-4 py-3 text-gray-500">{String(log.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateRoleModal
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}
    </div>
    </>
  );
}

function CreateRoleModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      await permissionsApi.createRole({
        name,
        description,
        permissions: { '*': ['read'] },
      });
      toast.success('Role created');
      onSave();
    } catch {
      toast.error('Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">Create Custom Role</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Role Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 btn text-white"
              placeholder="Site Supervisor"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 btn text-white h-20"
              placeholder="Manage site operations..."
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 btn btn-ghost rounded-lg">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-4 py-2 btn btn-primary rounded-lg font-medium flex items-center gap-2"
          >
            {Boolean(saving) && <RefreshCw className="h-4 w-4 animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
export default PermissionsManager;
