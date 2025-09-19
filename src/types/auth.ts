export type UserRole = 'admin' | 'user' | 'viewer';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: UserRole;
  displayName: string;
  description: string;
  permissions: Permission[];
  level: number; // Higher number = more permissions
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  role: UserRole;
  workspaceId?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  settings: WorkspaceSettings;
}

export interface WorkspaceSettings {
  allowUserRegistration: boolean;
  defaultUserRole: UserRole;
  maxUsers?: number;
  features: {
    analytics: boolean;
    aiCopilot: boolean;
    alerts: boolean;
    reporting: boolean;
    apiAccess: boolean;
  };
}

// Permission constants
export const PERMISSIONS = {
  // Dashboard permissions
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_EDIT: 'dashboard:edit',
  
  // Analytics permissions
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // AI Copilot permissions
  COPILOT_VIEW: 'copilot:view',
  COPILOT_INTERACT: 'copilot:interact',
  COPILOT_CONFIGURE: 'copilot:configure',
  
  // Alerts permissions
  ALERTS_VIEW: 'alerts:view',
  ALERTS_CREATE: 'alerts:create',
  ALERTS_EDIT: 'alerts:edit',
  ALERTS_DELETE: 'alerts:delete',
  
  // Reports permissions
  REPORTS_VIEW: 'reports:view',
  REPORTS_CREATE: 'reports:create',
  REPORTS_EXPORT: 'reports:export',
  REPORTS_SCHEDULE: 'reports:schedule',
  REPORTS_SHARE: 'reports:share',
  
  // Settings permissions
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  
  // User management permissions
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  
  // Workspace permissions
  WORKSPACE_VIEW: 'workspace:view',
  WORKSPACE_EDIT: 'workspace:edit',
  WORKSPACE_DELETE: 'workspace:delete',
  
  // API permissions
  API_ACCESS: 'api:access',
  API_ADMIN: 'api:admin',
} as const;

// Role definitions
export const ROLES: Record<UserRole, Role> = {
  viewer: {
    id: 'viewer',
    name: 'viewer',
    displayName: 'Viewer',
    description: 'Can view dashboards and reports but cannot make changes',
    level: 1,
    permissions: [
      { id: '1', name: 'View Dashboard', description: 'View dashboard data', resource: 'dashboard', action: 'view' },
      { id: '2', name: 'View Analytics', description: 'View analytics data', resource: 'analytics', action: 'view' },
      { id: '3', name: 'View Alerts', description: 'View alerts', resource: 'alerts', action: 'view' },
      { id: '4', name: 'View Reports', description: 'View reports', resource: 'reports', action: 'view' },
    ],
  },
  user: {
    id: 'user',
    name: 'user',
    displayName: 'User',
    description: 'Can view and interact with most features, create alerts and use AI copilot',
    level: 2,
    permissions: [
      { id: '1', name: 'View Dashboard', description: 'View dashboard data', resource: 'dashboard', action: 'view' },
      { id: '2', name: 'View Analytics', description: 'View analytics data', resource: 'analytics', action: 'view' },
      { id: '3', name: 'Export Analytics', description: 'Export analytics data', resource: 'analytics', action: 'export' },
      { id: '4', name: 'View Alerts', description: 'View alerts', resource: 'alerts', action: 'view' },
      { id: '5', name: 'Create Alerts', description: 'Create new alerts', resource: 'alerts', action: 'create' },
      { id: '6', name: 'Edit Alerts', description: 'Edit existing alerts', resource: 'alerts', action: 'edit' },
      { id: '7', name: 'View Copilot', description: 'View AI copilot', resource: 'copilot', action: 'view' },
      { id: '8', name: 'Interact with Copilot', description: 'Interact with AI copilot', resource: 'copilot', action: 'interact' },
      { id: '9', name: 'View Settings', description: 'View personal settings', resource: 'settings', action: 'view' },
      { id: '10', name: 'Edit Settings', description: 'Edit personal settings', resource: 'settings', action: 'edit' },
      { id: '11', name: 'View Reports', description: 'View reports', resource: 'reports', action: 'view' },
      { id: '12', name: 'Create Reports', description: 'Create custom reports', resource: 'reports', action: 'create' },
      { id: '13', name: 'Export Reports', description: 'Export reports to various formats', resource: 'reports', action: 'export' },
    ],
  },
  admin: {
    id: 'admin',
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full access to all features including user management and workspace settings',
    level: 3,
    permissions: [
      { id: '1', name: 'View Dashboard', description: 'View dashboard data', resource: 'dashboard', action: 'view' },
      { id: '2', name: 'Edit Dashboard', description: 'Edit dashboard configuration', resource: 'dashboard', action: 'edit' },
      { id: '3', name: 'View Analytics', description: 'View analytics data', resource: 'analytics', action: 'view' },
      { id: '4', name: 'Export Analytics', description: 'Export analytics data', resource: 'analytics', action: 'export' },
      { id: '5', name: 'View Alerts', description: 'View alerts', resource: 'alerts', action: 'view' },
      { id: '6', name: 'Create Alerts', description: 'Create new alerts', resource: 'alerts', action: 'create' },
      { id: '7', name: 'Edit Alerts', description: 'Edit existing alerts', resource: 'alerts', action: 'edit' },
      { id: '8', name: 'Delete Alerts', description: 'Delete alerts', resource: 'alerts', action: 'delete' },
      { id: '9', name: 'View Copilot', description: 'View AI copilot', resource: 'copilot', action: 'view' },
      { id: '10', name: 'Interact with Copilot', description: 'Interact with AI copilot', resource: 'copilot', action: 'interact' },
      { id: '11', name: 'Configure Copilot', description: 'Configure AI copilot settings', resource: 'copilot', action: 'configure' },
      { id: '12', name: 'View Settings', description: 'View all settings', resource: 'settings', action: 'view' },
      { id: '13', name: 'Edit Settings', description: 'Edit all settings', resource: 'settings', action: 'edit' },
      { id: '14', name: 'View Users', description: 'View user list', resource: 'users', action: 'view' },
      { id: '15', name: 'Create Users', description: 'Create new users', resource: 'users', action: 'create' },
      { id: '16', name: 'Edit Users', description: 'Edit user details', resource: 'users', action: 'edit' },
      { id: '17', name: 'Delete Users', description: 'Delete users', resource: 'users', action: 'delete' },
      { id: '18', name: 'View Workspace', description: 'View workspace settings', resource: 'workspace', action: 'view' },
      { id: '19', name: 'Edit Workspace', description: 'Edit workspace settings', resource: 'workspace', action: 'edit' },
      { id: '20', name: 'API Access', description: 'Access API endpoints', resource: 'api', action: 'access' },
      { id: '21', name: 'API Admin', description: 'Admin API access', resource: 'api', action: 'admin' },
      { id: '22', name: 'View Reports', description: 'View reports', resource: 'reports', action: 'view' },
      { id: '23', name: 'Create Reports', description: 'Create custom reports', resource: 'reports', action: 'create' },
      { id: '24', name: 'Export Reports', description: 'Export reports to various formats', resource: 'reports', action: 'export' },
      { id: '25', name: 'Schedule Reports', description: 'Schedule automated reports', resource: 'reports', action: 'schedule' },
      { id: '26', name: 'Share Reports', description: 'Share reports with other users', resource: 'reports', action: 'share' },
    ],
  },
};

// Helper functions
export const hasPermission = (userRole: UserRole, resource: string, action: string): boolean => {
  const role = ROLES[userRole];
  return role.permissions.some(permission => 
    permission.resource === resource && permission.action === action
  );
};

export const hasAnyPermission = (userRole: UserRole, permissions: string[]): boolean => {
  return permissions.some(permission => {
    const [resource, action] = permission.split(':');
    return hasPermission(userRole, resource, action);
  });
};

export const getRoleLevel = (userRole: UserRole): number => {
  return ROLES[userRole].level;
};

export const canAccessResource = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
};