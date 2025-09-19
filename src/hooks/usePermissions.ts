import { useMemo } from 'react';
import { useAuth } from '../components/AuthProvider';
import { 
  UserRole, 
  hasPermission, 
  hasAnyPermission, 
  canAccessResource, 
  getRoleLevel,
  ROLES 
} from '../types/auth';

export const usePermissions = () => {
  const { user } = useAuth();

  const userRole = useMemo(() => {
    if (!user) return null;
    // Get role from user metadata, default to 'user' if not set
    return (user.user_metadata?.role as UserRole) || 'user';
  }, [user]);

  const permissions = useMemo(() => {
    if (!userRole) return [];
    return ROLES[userRole].permissions;
  }, [userRole]);

  const roleLevel = useMemo(() => {
    if (!userRole) return 0;
    return getRoleLevel(userRole);
  }, [userRole]);

  // Check if user has a specific permission
  const can = (resource: string, action: string): boolean => {
    if (!userRole) return false;
    return hasPermission(userRole, resource, action);
  };

  // Check if user has any of the specified permissions
  const canAny = (permissionsList: string[]): boolean => {
    if (!userRole) return false;
    return hasAnyPermission(userRole, permissionsList);
  };

  // Check if user can access a resource that requires a minimum role
  const canAccess = (requiredRole: UserRole): boolean => {
    if (!userRole) return false;
    return canAccessResource(userRole, requiredRole);
  };

  // Check if user is admin
  const isAdmin = (): boolean => {
    return userRole === 'admin';
  };

  // Check if user is at least a regular user (not just viewer)
  const isUser = (): boolean => {
    if (!userRole) return false;
    return roleLevel >= getRoleLevel('user');
  };

  // Check if user is viewer or higher
  const isViewer = (): boolean => {
    if (!userRole) return false;
    return roleLevel >= getRoleLevel('viewer');
  };

  // Get user's role information
  const getRoleInfo = () => {
    if (!userRole) return null;
    return ROLES[userRole];
  };

  // Check specific feature permissions
  const canViewDashboard = () => can('dashboard', 'view');
  const canEditDashboard = () => can('dashboard', 'edit');
  
  const canViewAnalytics = () => can('analytics', 'view');
  const canExportAnalytics = () => can('analytics', 'export');
  
  const canViewCopilot = () => can('copilot', 'view');
  const canInteractWithCopilot = () => can('copilot', 'interact');
  const canConfigureCopilot = () => can('copilot', 'configure');
  
  const canViewAlerts = () => can('alerts', 'view');
  const canCreateAlerts = () => can('alerts', 'create');
  const canEditAlerts = () => can('alerts', 'edit');
  const canDeleteAlerts = () => can('alerts', 'delete');
  
  const canViewSettings = () => can('settings', 'view');
  const canEditSettings = () => can('settings', 'edit');
  
  const canManageUsers = () => can('users', 'view');
  const canCreateUsers = () => can('users', 'create');
  const canEditUsers = () => can('users', 'edit');
  const canDeleteUsers = () => can('users', 'delete');
  
  const canManageWorkspace = () => can('workspace', 'view');
  const canEditWorkspace = () => can('workspace', 'edit');
  
  const canAccessAPI = () => can('api', 'access');
  const canAdminAPI = () => can('api', 'admin');
  
  const canViewReports = () => can('reports', 'view');
  const canCreateReports = () => can('reports', 'create');
  const canExportReports = () => can('reports', 'export');
  const canScheduleReports = () => can('reports', 'schedule');
  const canShareReports = () => can('reports', 'share');

  return {
    // User info
    user,
    userRole,
    permissions,
    roleLevel,
    getRoleInfo,
    
    // General permission checks
    can,
    canAny,
    canAccess,
    
    // Role checks
    isAdmin,
    isUser,
    isViewer,
    
    // Feature-specific permissions
    dashboard: {
      canView: canViewDashboard,
      canEdit: canEditDashboard,
    },
    analytics: {
      canView: canViewAnalytics,
      canExport: canExportAnalytics,
    },
    copilot: {
      canView: canViewCopilot,
      canInteract: canInteractWithCopilot,
      canConfigure: canConfigureCopilot,
    },
    alerts: {
      canView: canViewAlerts,
      canCreate: canCreateAlerts,
      canEdit: canEditAlerts,
      canDelete: canDeleteAlerts,
    },
    settings: {
      canView: canViewSettings,
      canEdit: canEditSettings,
    },
    users: {
      canView: canManageUsers,
      canCreate: canCreateUsers,
      canEdit: canEditUsers,
      canDelete: canDeleteUsers,
    },
    workspace: {
      canView: canManageWorkspace,
      canEdit: canEditWorkspace,
    },
    api: {
      canAccess: canAccessAPI,
      canAdmin: canAdminAPI,
    },
    reports: {
      canView: canViewReports,
      canCreate: canCreateReports,
      canExport: canExportReports,
      canSchedule: canScheduleReports,
      canShare: canShareReports,
    },
  };
};

export default usePermissions;