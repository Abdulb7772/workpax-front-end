/**
 * Role-based permissions for frontend
 * Matches backend permissions in roleGuard.middleware.js
 */

export type UserRole = 'admin' | 'manager' | 'member';

export type Resource = 'organizations' | 'projects' | 'tasks' | 'users';

export type Action = 
  | 'create' | 'read' | 'update' | 'delete' | 'manage'
  | 'invite' | 'assign_role' | 'remove'
  | 'add_to_project' | 'assign' | 'change_status'
  | 'switch' | 'update_own';

const PERMISSIONS: Record<UserRole, Record<Resource, Action[]>> = {
  admin: {
    organizations: ['create', 'read', 'update', 'delete', 'manage'],
    users: ['invite', 'assign_role', 'remove', 'read', 'update'],
    projects: ['create', 'read', 'update', 'delete', 'manage'],
    tasks: ['create', 'read', 'update', 'delete', 'assign'],
  },
  manager: {
    organizations: ['read', 'switch'],
    projects: ['read', 'update', 'manage', 'change_status'],
    users: ['add_to_project', 'read'],
    tasks: ['create', 'read', 'update', 'delete', 'assign'],
  },
  member: {
    organizations: ['read'],
    projects: ['read'],
    tasks: ['read', 'update_own'],
    users: ['read'],
  },
};

/**
 * Check if user has required permission
 */
export const hasPermission = (
  userRole: string | null | undefined,
  resource: Resource,
  action: Action
): boolean => {
  const role = (userRole?.toLowerCase() || 'member') as UserRole;
  const permissions = PERMISSIONS[role];
  
  if (!permissions || !permissions[resource]) {
    return false;
  }
  
  return permissions[resource].includes(action);
};

/**
 * Check if user has one of the required roles
 */
export const hasRole = (
  userRole: string | null | undefined,
  allowedRoles: UserRole | UserRole[]
): boolean => {
  const role = (userRole?.toLowerCase() || 'member') as UserRole;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(role);
};

/**
 * Check if user is admin
 */
export const isAdmin = (userRole: string | null | undefined): boolean => {
  return hasRole(userRole, 'admin');
};

/**
 * Check if user is manager or admin
 */
export const isManagerOrAdmin = (userRole: string | null | undefined): boolean => {
  return hasRole(userRole, ['manager', 'admin']);
};

/**
 * Specific permission checks
 */
export const canManageOrganizations = (userRole: string | null | undefined): boolean => {
  return hasPermission(userRole, 'organizations', 'manage');
};
export const canAddUsersToProject = (userRole: string | null | undefined): boolean => {
  return hasPermission(userRole, 'users', 'add_to_project');
};
export const canCreateProjects = (userRole: string | null | undefined): boolean => {
  return hasPermission(userRole, 'projects', 'create');
};

export const canAssignTasks = (userRole: string | null | undefined): boolean => {
  return hasPermission(userRole, 'tasks', 'assign');
};

export const canInviteUsers = (userRole: string | null | undefined): boolean => {
  return hasPermission(userRole, 'users', 'invite');
};

export const canAssignRoles = (userRole: string | null | undefined): boolean => {
  return hasPermission(userRole, 'users', 'assign_role');
};

export const canRemoveUsers = (userRole: string | null | undefined): boolean => {
  return hasPermission(userRole, 'users', 'remove');
};

export const canChangeProjectStatus = (userRole: string | null | undefined): boolean => {
  return hasPermission(userRole, 'projects', 'change_status');
};

export const canSwitchOrganizations = (userRole: string | null | undefined): boolean => {
  return hasPermission(userRole, 'organizations', 'switch');
};