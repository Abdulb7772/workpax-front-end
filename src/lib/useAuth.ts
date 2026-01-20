import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import {
  hasPermission,
  hasRole,
  isAdmin,
  isManagerOrAdmin,
  canManageOrganizations,
  canCreateProjects,
  canAssignTasks,
  canInviteUsers,
  canAssignRoles,
  canRemoveUsers,
  canChangeProjectStatus,
  canSwitchOrganizations,
  type UserRole,
  type Resource,
  type Action,
} from './permissions';
import { useTeamContext } from '@/contexts/TeamContext';

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
}

export const useAuth = () => {
  const { data: session, status } = useSession();
  const { selectedTeamRole } = useTeamContext();
  const user = session?.user as ExtendedUser | undefined;
  const baseRole = user?.role?.toLowerCase() || 'member';
  
  // Use team role if selected, otherwise fall back to base role
  const role = selectedTeamRole?.toLowerCase() || baseRole;

  const permissions = useMemo(
    () => ({
      // Core permission checks
      hasPermission: (resource: Resource, action: Action) =>
        hasPermission(role, resource, action),
      hasRole: (allowedRoles: UserRole | UserRole[]) => hasRole(role, allowedRoles),

      // Role checks
      isAdmin: isAdmin(role),
      isManager: role === 'manager',
      isMember: role === 'member',
      isManagerOrAdmin: isManagerOrAdmin(role),

      // Specific permissions
      canManageOrganizations: canManageOrganizations(role),
      canCreateProjects: canCreateProjects(role),
      canAssignTasks: canAssignTasks(role),
      canInviteUsers: canInviteUsers(role),
      canAssignRoles: canAssignRoles(role),
      canRemoveUsers: canRemoveUsers(role),
      canChangeProjectStatus: canChangeProjectStatus(role),
      canSwitchOrganizations: canSwitchOrganizations(role),
    }),
    [role]
  );

  return {
    user,
    role,
    baseRole, // The user's default role
    teamRole: selectedTeamRole, // The role from selected team
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    ...permissions,
  };
};