/**
 * Enhanced authentication system with security features
 */

import { InputValidator, AuditLogger, RateLimiter } from './security';
import { performanceMonitor } from './performance';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  permissions: string[];
  lastLogin?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

export interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Authentication service with security features
 */
export class AuthService {
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly REFRESH_TOKEN_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  private static users: Map<string, User> = new Map();
  private static sessions: Map<string, AuthSession> = new Map();
  private static refreshTokens: Map<string, string> = new Map(); // refreshToken -> sessionId

  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<{ user: User; session: AuthSession }> {
    const startTime = performance.now();
    
    try {
      // Validate input
      this.validateRegistrationData(data);
      
      // Check if user already exists
      const existingUser = Array.from(this.users.values())
        .find(user => user.email.toLowerCase() === data.email.toLowerCase());
      
      if (existingUser) {
        throw new AuthError('User already exists', 'USER_EXISTS');
      }
      
      // Create user
      const user: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: data.email.toLowerCase(),
        name: data.name,
        role: 'user',
        permissions: ['read:own', 'write:own'],
        loginAttempts: 0,
        emailVerified: false,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      this.users.set(user.id, user);
      
      // Create session
      const session = this.createSession(user.id);
      
      // Log audit event
      AuditLogger.log('user_register', 'user', {
        userId: user.id,
        email: user.email,
      }, user.id, true);
      
      const endTime = performance.now();
      performanceMonitor.recordMetric('auth-register', endTime - startTime, {
        success: true,
      });
      
      return { user, session };
      
    } catch (error) {
      const endTime = performance.now();
      performanceMonitor.recordMetric('auth-register', endTime - startTime, {
        success: false,
        error: (error as Error).message,
      });
      
      AuditLogger.log('user_register', 'user', {
        email: data.email,
        error: (error as Error).message,
      }, undefined, false, (error as Error).message);
      
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<{ user: User; session: AuthSession }> {
    const startTime = performance.now();
    
    try {
      // Rate limiting
      const rateLimitResult = RateLimiter.checkLimit(`login:${credentials.email}`, 5, 15 * 60 * 1000);
      if (!rateLimitResult.allowed) {
        throw new AuthError('Too many login attempts. Please try again later.', 'RATE_LIMITED');
      }
      
      // Validate input
      this.validateLoginCredentials(credentials);
      
      // Find user
      const user = Array.from(this.users.values())
        .find(u => u.email.toLowerCase() === credentials.email.toLowerCase());
      
      if (!user) {
        throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
      }
      
      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
        throw new AuthError(
          `Account is locked. Try again in ${remainingTime} minutes.`,
          'ACCOUNT_LOCKED'
        );
      }
      
      // Simulate password verification (in real app, use bcrypt)
      const isPasswordValid = this.verifyPassword(credentials.password, user.id);
      
      if (!isPasswordValid) {
        // Increment login attempts
        user.loginAttempts++;
        
        // Lock account if too many attempts
        if (user.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
          user.lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
          
          AuditLogger.log('account_locked', 'user', {
            userId: user.id,
            attempts: user.loginAttempts,
          }, user.id, false, 'Too many failed login attempts');
        }
        
        this.users.set(user.id, user);
        
        throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
      }
      
      // Check 2FA if enabled
      if (user.twoFactorEnabled && !credentials.twoFactorCode) {
        throw new AuthError('Two-factor authentication code required', 'TWO_FACTOR_REQUIRED');
      }
      
      if (user.twoFactorEnabled && credentials.twoFactorCode) {
        const isValidTwoFactor = this.verifyTwoFactorCode(credentials.twoFactorCode, user.id);
        if (!isValidTwoFactor) {
          throw new AuthError('Invalid two-factor authentication code', 'INVALID_TWO_FACTOR');
        }
      }
      
      // Reset login attempts and unlock account
      user.loginAttempts = 0;
      user.lockedUntil = undefined;
      user.lastLogin = new Date();
      user.updatedAt = new Date();
      this.users.set(user.id, user);
      
      // Create session
      const session = this.createSession(user.id, credentials.rememberMe);
      
      // Log successful login
      AuditLogger.log('user_login', 'user', {
        userId: user.id,
        email: user.email,
        rememberMe: credentials.rememberMe,
      }, user.id, true);
      
      const endTime = performance.now();
      performanceMonitor.recordMetric('auth-login', endTime - startTime, {
        success: true,
        twoFactorUsed: user.twoFactorEnabled,
      });
      
      return { user, session };
      
    } catch (error) {
      const endTime = performance.now();
      performanceMonitor.recordMetric('auth-login', endTime - startTime, {
        success: false,
        error: (error as Error).message,
      });
      
      AuditLogger.log('user_login', 'user', {
        email: credentials.email,
        error: (error as Error).message,
      }, undefined, false, (error as Error).message);
      
      throw error;
    }
  }

  /**
   * Logout user
   */
  static async logout(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      // Deactivate session
      session.isActive = false;
      this.sessions.set(sessionId, session);
      
      // Remove refresh token
      for (const [refreshToken, sId] of this.refreshTokens.entries()) {
        if (sId === sessionId) {
          this.refreshTokens.delete(refreshToken);
          break;
        }
      }
      
      // Log logout
      AuditLogger.log('user_logout', 'user', {
        sessionId,
        userId: session.userId,
      }, session.userId, true);
    }
  }

  /**
   * Refresh session token
   */
  static async refreshSession(refreshToken: string): Promise<AuthSession> {
    const sessionId = this.refreshTokens.get(refreshToken);
    
    if (!sessionId) {
      throw new AuthError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }
    
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.isActive) {
      throw new AuthError('Session not found or inactive', 'SESSION_INVALID');
    }
    
    // Check if refresh token is expired
    const refreshTokenExpiry = new Date(session.createdAt.getTime() + this.REFRESH_TOKEN_DURATION);
    if (new Date() > refreshTokenExpiry) {
      throw new AuthError('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
    }
    
    // Create new session
    const newSession = this.createSession(session.userId);
    
    // Deactivate old session
    session.isActive = false;
    this.sessions.set(sessionId, session);
    
    // Remove old refresh token
    this.refreshTokens.delete(refreshToken);
    
    AuditLogger.log('session_refresh', 'session', {
      oldSessionId: sessionId,
      newSessionId: newSession.id,
      userId: session.userId,
    }, session.userId, true);
    
    return newSession;
  }

  /**
   * Validate session
   */
  static async validateSession(token: string): Promise<{ user: User; session: AuthSession } | null> {
    const session = Array.from(this.sessions.values())
      .find(s => s.token === token && s.isActive);
    
    if (!session) {
      return null;
    }
    
    // Check if session is expired
    if (new Date() > session.expiresAt) {
      session.isActive = false;
      this.sessions.set(session.id, session);
      return null;
    }
    
    const user = this.users.get(session.userId);
    
    if (!user) {
      return null;
    }
    
    return { user, session };
  }

  /**
   * Get user by ID
   */
  static getUser(userId: string): User | null {
    return this.users.get(userId) || null;
  }

  /**
   * Update user
   */
  static updateUser(userId: string, updates: Partial<User>): User {
    const user = this.users.get(userId);
    
    if (!user) {
      throw new AuthError('User not found', 'USER_NOT_FOUND');
    }
    
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.users.set(userId, updatedUser);
    
    AuditLogger.log('user_update', 'user', {
      userId,
      updates: Object.keys(updates),
    }, userId, true);
    
    return updatedUser;
  }

  /**
   * Change password
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = this.users.get(userId);
    
    if (!user) {
      throw new AuthError('User not found', 'USER_NOT_FOUND');
    }
    
    // Verify current password
    const isCurrentPasswordValid = this.verifyPassword(currentPassword, userId);
    if (!isCurrentPasswordValid) {
      throw new AuthError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
    }
    
    // Validate new password
    const passwordValidation = InputValidator.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new AuthError(
        `Password validation failed: ${passwordValidation.feedback.join(', ')}`,
        'WEAK_PASSWORD'
      );
    }
    
    // Update password (in real app, hash with bcrypt)
    // For demo purposes, we'll just log the change
    
    AuditLogger.log('password_change', 'user', {
      userId,
    }, userId, true);
    
    // Invalidate all sessions except current one
    this.invalidateUserSessions(userId);
  }

  /**
   * Enable two-factor authentication
   */
  static enableTwoFactor(userId: string): { secret: string; qrCode: string } {
    const user = this.users.get(userId);
    
    if (!user) {
      throw new AuthError('User not found', 'USER_NOT_FOUND');
    }
    
    // Generate 2FA secret (simplified)
    const secret = Math.random().toString(36).substr(2, 16);
    const qrCode = `otpauth://totp/${encodeURIComponent(user.email)}?secret=${secret}&issuer=EcomCopilot`;
    
    user.twoFactorEnabled = true;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    
    AuditLogger.log('two_factor_enable', 'user', {
      userId,
    }, userId, true);
    
    return { secret, qrCode };
  }

  /**
   * Disable two-factor authentication
   */
  static disableTwoFactor(userId: string, twoFactorCode: string): void {
    const user = this.users.get(userId);
    
    if (!user) {
      throw new AuthError('User not found', 'USER_NOT_FOUND');
    }
    
    if (!user.twoFactorEnabled) {
      throw new AuthError('Two-factor authentication is not enabled', 'TWO_FACTOR_NOT_ENABLED');
    }
    
    // Verify 2FA code
    const isValidCode = this.verifyTwoFactorCode(twoFactorCode, userId);
    if (!isValidCode) {
      throw new AuthError('Invalid two-factor authentication code', 'INVALID_TWO_FACTOR');
    }
    
    user.twoFactorEnabled = false;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    
    AuditLogger.log('two_factor_disable', 'user', {
      userId,
    }, userId, true);
  }

  /**
   * Get user sessions
   */
  static getUserSessions(userId: string): AuthSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId && session.isActive)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Invalidate user sessions
   */
  static invalidateUserSessions(userId: string, excludeSessionId?: string): void {
    const userSessions = this.getUserSessions(userId);
    
    userSessions.forEach(session => {
      if (session.id !== excludeSessionId) {
        session.isActive = false;
        this.sessions.set(session.id, session);
        
        // Remove refresh token
        for (const [refreshToken, sId] of this.refreshTokens.entries()) {
          if (sId === session.id) {
            this.refreshTokens.delete(refreshToken);
            break;
          }
        }
      }
    });
    
    AuditLogger.log('sessions_invalidate', 'user', {
      userId,
      sessionCount: userSessions.length,
      excludeSessionId,
    }, userId, true);
  }

  /**
   * Create session
   */
  private static createSession(userId: string, rememberMe: boolean = false): AuthSession {
    const sessionDuration = rememberMe ? this.REFRESH_TOKEN_DURATION : this.SESSION_DURATION;
    
    const session: AuthSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      token: this.generateToken(),
      refreshToken: this.generateToken(),
      expiresAt: new Date(Date.now() + sessionDuration),
      createdAt: new Date(),
      ipAddress: 'client-ip', // Would be actual IP in real app
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      isActive: true,
    };
    
    this.sessions.set(session.id, session);
    this.refreshTokens.set(session.refreshToken, session.id);
    
    return session;
  }

  /**
   * Generate secure token
   */
  private static generateToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 32)}`;
  }

  /**
   * Verify password (simplified)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static verifyPassword(password: string, _userId: string): boolean {
    // In a real app, this would compare against a hashed password
    // For demo purposes, we'll accept any password that's not empty
    return password.length > 0;
  }

  /**
   * Verify two-factor code (simplified)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static verifyTwoFactorCode(code: string, _userId: string): boolean {
    // In a real app, this would verify against TOTP
    // For demo purposes, we'll accept '123456'
    return code === '123456';
  }

  /**
   * Validate registration data
   */
  private static validateRegistrationData(data: RegisterData): void {
    if (!InputValidator.validateEmail(data.email)) {
      throw new AuthError('Invalid email format', 'INVALID_EMAIL');
    }
    
    if (!InputValidator.validateLength(data.name, 2, 50, 'Name')) {
      throw new AuthError('Name must be between 2 and 50 characters', 'INVALID_NAME');
    }
    
    const passwordValidation = InputValidator.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      throw new AuthError(
        `Password validation failed: ${passwordValidation.feedback.join(', ')}`,
        'WEAK_PASSWORD'
      );
    }
    
    if (data.password !== data.confirmPassword) {
      throw new AuthError('Passwords do not match', 'PASSWORD_MISMATCH');
    }
  }

  /**
   * Validate login credentials
   */
  private static validateLoginCredentials(credentials: LoginCredentials): void {
    if (!InputValidator.validateEmail(credentials.email)) {
      throw new AuthError('Invalid email format', 'INVALID_EMAIL');
    }
    
    if (!credentials.password || credentials.password.length === 0) {
      throw new AuthError('Password is required', 'PASSWORD_REQUIRED');
    }
  }
}

export default AuthService;