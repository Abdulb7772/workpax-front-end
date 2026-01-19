/**
 * Component to conditionally render elements based on user permissions
 */

import { ReactNode } from 'react';
import { useAuth } from '@/lib/useAuth';
import { type UserRole, type Resource, type Action } from '@/lib/permissions';

interface ProtectedElementProps {
  children: ReactNode;
  
  // Either specify roles
  roles?: UserRole | UserRole[];
  
  // Or specify permission
  resource?: Resource;
  action?: Action;
  
  // Fallback content if user doesn't have permission
  fallback?: ReactNode;
}

export default function ProtectedElement({
  children,
  roles,
  resource,
  action,
  fallback = null,
}: ProtectedElementProps) {
  const auth = useAuth();

  // Check role-based access
  if (roles) {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const hasAccess = auth.hasRole(roleArray);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // Check permission-based access
  if (resource && action) {
    const hasAccess = auth.hasPermission(resource, action);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // If no permission specified, show content
  return <>{children}</>;
}

// Specific permission-based components for convenience
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <ProtectedElement roles="admin" fallback={fallback}>{children}</ProtectedElement>;
}

export function ManagerOrAdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <ProtectedElement roles={['manager', 'admin']} fallback={fallback}>{children}</ProtectedElement>;
}

export function CanManageOrganizations({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <ProtectedElement resource="organizations" action="manage" fallback={fallback}>{children}</ProtectedElement>;
}

export function CanCreateProjects({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <ProtectedElement resource="projects" action="create" fallback={fallback}>{children}</ProtectedElement>;
}

export function CanInviteUsers({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <ProtectedElement resource="users" action="invite" fallback={fallback}>{children}</ProtectedElement>;
}

export function CanAssignRoles({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <ProtectedElement resource="users" action="assign_role" fallback={fallback}>{children}</ProtectedElement>;
}
