export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'FIELD_WORKER' | 'VIEWER';

export type Permission =
  | 'projects:create'
  | 'projects:read'
  | 'projects:update'
  | 'projects:delete'
  | 'tasks:create'
  | 'tasks:read'
  | 'tasks:update'
  | 'tasks:delete'
  | 'rfis:create'
  | 'rfis:read'
  | 'rfis:update'
  | 'rfis:delete'
  | 'daily_reports:create'
  | 'daily_reports:read'
  | 'daily_reports:update'
  | 'daily_reports:delete'
  | 'safety_incidents:create'
  | 'safety_incidents:read'
  | 'safety_incidents:update'
  | 'safety_incidents:delete'
  | 'change_orders:create'
  | 'change_orders:read'
  | 'change_orders:update'
  | 'change_orders:delete'
  | 'submittals:create'
  | 'submittals:read'
  | 'submittals:update'
  | 'submittals:delete'
  | 'budget:read'
  | 'budget:update'
  | 'users:create'
  | 'users:read'
  | 'users:update'
  | 'users:delete'
  | 'reports:export'
  | 'settings:manage'
  | 'ai:access';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'projects:create', 'projects:read', 'projects:update', 'projects:delete',
    'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
    'rfis:create', 'rfis:read', 'rfis:update', 'rfis:delete',
    'daily_reports:create', 'daily_reports:read', 'daily_reports:update', 'daily_reports:delete',
    'safety_incidents:create', 'safety_incidents:read', 'safety_incidents:update', 'safety_incidents:delete',
    'change_orders:create', 'change_orders:read', 'change_orders:update', 'change_orders:delete',
    'submittals:create', 'submittals:read', 'submittals:update', 'submittals:delete',
    'budget:read', 'budget:update',
    'users:create', 'users:read', 'users:update', 'users:delete',
    'reports:export', 'settings:manage', 'ai:access',
  ],
  PROJECT_MANAGER: [
    'projects:read', 'projects:update',
    'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
    'rfis:create', 'rfis:read', 'rfis:update', 'rfis:delete',
    'daily_reports:create', 'daily_reports:read', 'daily_reports:update', 'daily_reports:delete',
    'safety_incidents:create', 'safety_incidents:read', 'safety_incidents:update',
    'change_orders:create', 'change_orders:read', 'change_orders:update',
    'submittals:create', 'submittals:read', 'submittals:update',
    'budget:read', 'budget:update',
    'reports:export', 'ai:access',
  ],
  FIELD_WORKER: [
    'projects:read',
    'tasks:read', 'tasks:update',
    'rfis:read',
    'daily_reports:create', 'daily_reports:read',
    'safety_incidents:create', 'safety_incidents:read',
    'change_orders:read',
    'submittals:read',
    'budget:read',
  ],
  VIEWER: [
    'projects:read',
    'tasks:read',
    'rfis:read',
    'daily_reports:read',
    'safety_incidents:read',
    'change_orders:read',
    'submittals:read',
    'budget:read',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

export function getRoleDisplayName(role: Role): string {
  const names: Record<Role, string> = {
    ADMIN: 'Administrator',
    PROJECT_MANAGER: 'Project Manager',
    FIELD_WORKER: 'Field Worker',
    VIEWER: 'Viewer',
  };
  return names[role];
}

export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    ADMIN: 'Full system access with all permissions',
    PROJECT_MANAGER: 'Can manage projects, tasks, RFIs, and reports',
    FIELD_WORKER: 'Can view projects and update assigned tasks',
    VIEWER: 'Read-only access to project information',
  };
  return descriptions[role];
}
