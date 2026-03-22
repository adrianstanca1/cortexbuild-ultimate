import { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Users,
  Lock,
  Unlock,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { permissionsApi, type Role, type Permissions } from '../../services/api';
import { toast } from 'sonner';
import clsx from 'clsx';

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-500/20 text-emerald-400',
  read: 'bg-blue-500/20 text-blue-400',
  update: 'bg-amber-500/20 text-amber-400',
  delete: 'bg-red-500/20 text-red-400',
  export: 'bg-purple-500/20 text-purple-400',
  approve: 'bg-cyan-500/20 text-cyan-400',
};

export function PermissionsManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [editedPermissions, setEditedPermissions] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      setRoles(rolesData);
      setPermissions(permsData);
    } catch (err) {
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (role: Role) => {
    setSelectedRole(role);
    setEditedPermissions(role.permissions || {});
  };

  const togglePermission = (module: string, action: string) => {
    setEditedPermissions(prev => {
      const modulePerms = prev[module] || [];
      if (modulePerms.includes(action)) {
        return { ...prev, [module]: modulePerms.filter(a => a !== action) };
      }
      return { ...prev, [module]: [...modulePerms, action] };
    });
  };

  const toggleModuleWildcard = (module: string) => {
    setEditedPermissions(prev => {
      if (prev[module]?.includes('*')) {
        return { ...prev, [module]: [] };
      }
      return { ...prev, [module]: ['*'] };
    });
  };

  const toggleGlobalWildcard = () => {
    if (editedPermissions['*']?.includes('*')) {
      setEditedPermissions({});
    } else {
      setEditedPermissions({ '*': ['*'] });
    }
  };

  const hasPermission = (module: string, action: string) => {
    const modulePerms = editedPermissions[module] || [];
    if (modulePerms.includes('*')) return true;
    if (editedPermissions['*']?.includes('*')) return true;
    if (editedPermissions['*']?.includes(action)) return true;
    return modulePerms.includes(action);
  };

  const saveChanges = async () => {
    if (!selectedRole) return;
    if (selectedRole.isSystem) {
      toast.error('Cannot modify system roles');
      return;
    }
    setSaving(true);
    try {
      await permissionsApi.updateRole(selectedRole.id, { permissions: editedPermissions });
      toast.success('Permissions updated');
      loadData();
    } catch (err) {
      toast.error('Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await permissionsApi.deleteRole(roleId);
      toast.success('Role deleted');
      if (selectedRole?.id === roleId) setSelectedRole(null);
      loadData();
    } catch (err) {
      toast.error('Failed to delete role');
    }
  };

  const toggleModule = (module: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  };

  const actions = permissions?.actions || {};
  const modules = permissions?.modules || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white font-display flex items-center gap-3">
            <Shield className="h-7 w-7 text-purple-400" />
            Permissions & Roles
          </h1>
          <p className="text-sm text-gray-500">Manage roles and access control</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 uppercase">Roles</h3>
            </div>
            <div className="divide-y divide-gray-800">
              {loading ? (
                <div className="p-4 flex justify-center">
                  <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                </div>
              ) : (
                roles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => selectRole(role)}
                    className={clsx(
                      'w-full text-left p-4 transition-colors',
                      selectedRole?.id === role.id ? 'bg-blue-600/20' : 'hover:bg-gray-800/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{role.name}</p>
                        <p className="text-xs text-gray-500">{role.description}</p>
                      </div>
                      {role.isSystem && (
                        <Lock className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={clsx(
                        'px-2 py-0.5 rounded-full text-xs',
                        role.isCustom ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700 text-gray-400'
                      )}>
                        {role.isCustom ? 'Custom' : 'System'}
                      </span>
                      {role.isSystem && (
                        <span className="px-2 py-0.5 bg-gray-700 text-gray-500 rounded-full text-xs">Read-only</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedRole ? (
            <div className="card">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedRole.name}</h3>
                  <p className="text-sm text-gray-500">{selectedRole.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!selectedRole.isSystem && (
                    <>
                      <button
                        onClick={saveChanges}
                        disabled={saving}
                        className="btn btn-primary"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </button>
                      <button
                        onClick={() => deleteRole(selectedRole.id)}
                        className="btn btn-secondary text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {selectedRole.isSystem && (
                <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <p className="text-sm text-amber-400">
                    System roles cannot be modified. Create a custom role to make changes.
                  </p>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-white">Global Permissions</h4>
                  <button
                    onClick={toggleGlobalWildcard}
                    className={clsx(
                      'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                      editedPermissions['*']?.includes('*')
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    )}
                  >
                    {editedPermissions['*']?.includes('*') ? 'Full Access' : 'No Global Access'}
                  </button>
                </div>

                <div className="space-y-2">
                  {Object.entries(actions).map(([action, info]) => (
                    <div key={action} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50">
                      <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', ACTION_COLORS[action])}>
                        {info.label}
                      </span>
                      <span className="text-sm text-gray-500 flex-1">{info.description}</span>
                      {editedPermissions['*']?.includes('*') || editedPermissions['*']?.includes(action) ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <X className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-800">
                <div className="p-4">
                  <h4 className="font-medium text-white mb-4">Module Permissions</h4>
                  <div className="space-y-1">
                    {Object.entries(modules).map(([module, info]) => {
                      const isExpanded = expandedModules.has(module);
                      const hasAll = editedPermissions[module]?.includes('*');
                      const hasSome = (editedPermissions[module]?.length || 0) > 0;
                      return (
                        <div key={module} className="border border-gray-800 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleModule(module)}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-800/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                              <span className="font-medium text-white">{info.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasAll ? (
                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">Full</span>
                              ) : hasSome ? (
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">Partial</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-700 text-gray-500 rounded text-xs">None</span>
                              )}
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="border-t border-gray-800 p-3 bg-gray-900/50">
                              <button
                                onClick={() => toggleModuleWildcard(module)}
                                className={clsx(
                                  'w-full mb-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                                  hasAll
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                )}
                              >
                                {hasAll ? 'Revoke Full Access' : 'Grant Full Access'}
                              </button>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {Object.entries(actions).map(([action, actionInfo]) => (
                                  <button
                                    key={action}
                                    onClick={() => togglePermission(module, action)}
                                    disabled={hasAll}
                                    className={clsx(
                                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                                      hasPermission(module, action) && !hasAll
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700',
                                      hasAll && 'opacity-50 cursor-not-allowed'
                                    )}
                                  >
                                    {hasPermission(module, action) && !hasAll ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <div className="h-4 w-4" />
                                    )}
                                    {actionInfo.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center">
              <Shield className="h-12 w-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">Select a role to view and edit permissions</p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateRoleModal
          onClose={() => setShowCreateModal(false)}
          onSave={() => { setShowCreateModal(false); loadData(); }}
        />
      )}
    </div>
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
    } catch (err) {
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
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              placeholder="Site Supervisor"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white h-20"
              placeholder="Manage site operations and safety..."
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={handleCreate} disabled={saving} className="btn btn-primary">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
