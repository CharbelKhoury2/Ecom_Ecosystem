import { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { UserRole } from '../types/auth';

interface PermissionGuardProps {
  children: ReactNode;
  // Permission-based access
  resource?: string;
  action?: string;
  permissions?: string[]; // Array of "resource:action" strings
  // Role-based access
  role?: UserRole;
  minRole?: UserRole;
  // Logical operators
  requireAll?: boolean; // If true, user must have ALL permissions (default: false - ANY permission)
  // Fallback content
  fallback?: ReactNode;
  // Show loading state while checking permissions
  showLoading?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  resource,
  action,
  permissions = [],
  role,
  minRole,
  requireAll = false,
  fallback = null,
  showLoading = false,
}) => {
  const {
    user,
    userRole,
    can,
    canAny,
    canAccess,
  } = usePermissions();

  // Show loading if user is not loaded yet
  if (showLoading && !user) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no user, deny access
  if (!user || !userRole) {
    return <>{fallback}</>;
  }

  // Check exact role match
  if (role && userRole !== role) {
    return <>{fallback}</>;
  }

  // Check minimum role requirement
  if (minRole && !canAccess(minRole)) {
    return <>{fallback}</>;
  }

  // Check specific resource:action permission
  if (resource && action && !can(resource, action)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions.length > 0) {
    if (requireAll) {
      // User must have ALL permissions
      const hasAllPermissions = permissions.every(permission => {
        const [res, act] = permission.split(':');
        return can(res, act);
      });
      if (!hasAllPermissions) {
        return <>{fallback}</>;
      }
    } else {
      // User must have ANY permission
      if (!canAny(permissions)) {
        return <>{fallback}</>;
      }
    }
  }

  // If all checks pass, render children
  return <>{children}</>;
};

// Convenience components for common use cases
export const AdminOnly: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <PermissionGuard role="admin" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const UserOrAbove: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <PermissionGuard minRole="user" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const ViewerOrAbove: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback = null,
}) => (
  <PermissionGuard minRole="viewer" fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Feature-specific guards
export const DashboardGuard: React.FC<{ 
  children: ReactNode; 
  action?: 'view' | 'edit';
  fallback?: ReactNode;
}> = ({ children, action = 'view', fallback = null }) => (
  <PermissionGuard resource="dashboard" action={action} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const AnalyticsGuard: React.FC<{ 
  children: ReactNode; 
  action?: 'view' | 'export';
  fallback?: ReactNode;
}> = ({ children, action = 'view', fallback = null }) => (
  <PermissionGuard resource="analytics" action={action} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const CopilotGuard: React.FC<{ 
  children: ReactNode; 
  action?: 'view' | 'interact' | 'configure';
  fallback?: ReactNode;
}> = ({ children, action = 'view', fallback = null }) => (
  <PermissionGuard resource="copilot" action={action} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const AlertsGuard: React.FC<{ 
  children: ReactNode; 
  action?: 'view' | 'create' | 'edit' | 'delete';
  fallback?: ReactNode;
}> = ({ children, action = 'view', fallback = null }) => (
  <PermissionGuard resource="alerts" action={action} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const SettingsGuard: React.FC<{ 
  children: ReactNode; 
  action?: 'view' | 'edit';
  fallback?: ReactNode;
}> = ({ children, action = 'view', fallback = null }) => (
  <PermissionGuard resource="settings" action={action} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const UsersGuard: React.FC<{ 
  children: ReactNode; 
  action?: 'view' | 'create' | 'edit' | 'delete';
  fallback?: ReactNode;
}> = ({ children, action = 'view', fallback = null }) => (
  <PermissionGuard resource="users" action={action} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export default PermissionGuard;