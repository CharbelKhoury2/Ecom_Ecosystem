/**
 * Enterprise Security Service
 * Handles 2FA, API rate limiting, GDPR compliance, audit logging, and data encryption
 */

import crypto from 'crypto';
import { supabase } from '../lib/supabase';

// Two-Factor Authentication Interfaces
export interface TwoFactorAuth {
  id: string;
  userId: string;
  secret: string;
  isEnabled: boolean;
  backupCodes: string[];
  lastUsed?: string;
  createdAt: string;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  token: string;
  backupCode?: string;
}

// API Rate Limiting Interfaces
export interface RateLimitRule {
  id: string;
  endpoint: string;
  method: string;
  limit: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: string; // Function name for custom key generation
}

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitViolation {
  id: string;
  ip: string;
  userId?: string;
  endpoint: string;
  method: string;
  timestamp: string;
  requestCount: number;
  limit: number;
}

// GDPR Compliance Interfaces
export interface DataSubject {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  consentStatus: 'given' | 'withdrawn' | 'pending';
  consentDate?: string;
  dataCategories: string[];
  retentionPeriod: number; // days
  lastActivity: string;
}

export interface DataRequest {
  id: string;
  subjectId: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDate: string;
  completionDate?: string;
  description: string;
  attachments?: string[];
}

export interface ConsentRecord {
  id: string;
  subjectId: string;
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  status: 'given' | 'withdrawn';
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

// Audit Logging Interfaces
export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'login_success' | 'login_failure' | 'password_change' | 'permission_change' | 'data_access' | 'data_modification' | 'suspicious_activity';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  riskScore: number;
  timestamp: string;
}

// Data Encryption Interfaces
export interface EncryptionKey {
  id: string;
  algorithm: 'AES-256-GCM' | 'AES-256-CBC' | 'RSA-2048' | 'RSA-4096';
  purpose: 'data_encryption' | 'key_encryption' | 'signing';
  keyData: string; // Base64 encoded
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface EncryptedData {
  data: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  tag?: string; // Base64 encoded authentication tag (for GCM)
  keyId: string;
  algorithm: string;
}

class SecurityService {
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private encryptionKeys: Map<string, EncryptionKey> = new Map();
  private activeKeys: Map<string, Buffer> = new Map();

  constructor() {
    this.initializeEncryptionKeys();
    this.startCleanupTasks();
  }

  private initializeEncryptionKeys() {
    // Generate default encryption key
    const defaultKey: EncryptionKey = {
      id: 'default-aes-256',
      algorithm: 'AES-256-GCM',
      purpose: 'data_encryption',
      keyData: crypto.randomBytes(32).toString('base64'),
      createdAt: new Date().toISOString(),
      isActive: true
    };
    
    this.encryptionKeys.set(defaultKey.id, defaultKey);
    this.activeKeys.set(defaultKey.id, Buffer.from(defaultKey.keyData, 'base64'));
  }

  private startCleanupTasks() {
    // Clean up rate limit store every hour
    setInterval(() => {
      this.cleanupRateLimitStore();
    }, 3600000);

    // Clean up expired encryption keys daily
    setInterval(() => {
      this.cleanupExpiredKeys();
    }, 86400000);
  }

  private cleanupRateLimitStore() {
    const now = Date.now();
    for (const [key, value] of this.rateLimitStore.entries()) {
      if (value.resetTime <= now) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  private cleanupExpiredKeys() {
    const now = new Date();
    for (const [keyId, key] of this.encryptionKeys.entries()) {
      if (key.expiresAt && new Date(key.expiresAt) <= now) {
        this.encryptionKeys.delete(keyId);
        this.activeKeys.delete(keyId);
      }
    }
  }

  // Two-Factor Authentication Methods
  async setupTwoFactor(userId: string): Promise<TwoFactorSetup> {
    const secret = crypto.randomBytes(20).toString('base32');
    const backupCodes = this.generateBackupCodes();
    
    // Generate QR code URL for authenticator apps
    const qrCodeUrl = `otpauth://totp/EcomEcosystem:${userId}?secret=${secret}&issuer=EcomEcosystem`;
    
    // Store in database (encrypted)
    const encryptedSecret = await this.encrypt(secret);
    const encryptedBackupCodes = await Promise.all(
      backupCodes.map(code => this.encrypt(code))
    );
    
    await supabase.from('two_factor_auth').upsert({
      user_id: userId,
      secret: JSON.stringify(encryptedSecret),
      backup_codes: JSON.stringify(encryptedBackupCodes),
      is_enabled: false,
      created_at: new Date().toISOString()
    });
    
    return {
      secret,
      qrCodeUrl,
      backupCodes
    };
  }

  async enableTwoFactor(userId: string, token: string): Promise<boolean> {
    const { data: tfaData } = await supabase
      .from('two_factor_auth')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!tfaData) {
      throw new Error('Two-factor authentication not set up');
    }
    
    const encryptedSecret = JSON.parse(tfaData.secret);
    const secret = await this.decrypt(encryptedSecret);
    
    const isValid = this.verifyTOTP(secret, token);
    if (!isValid) {
      return false;
    }
    
    await supabase
      .from('two_factor_auth')
      .update({ is_enabled: true })
      .eq('user_id', userId);
    
    await this.logSecurityEvent({
      type: 'login_attempt',
      userId,
      details: { action: '2FA_enabled' },
      riskScore: 0.1
    });
    
    return true;
  }

  async verifyTwoFactor(userId: string, verification: TwoFactorVerification): Promise<boolean> {
    const { data: tfaData } = await supabase
      .from('two_factor_auth')
      .select('*')
      .eq('user_id', userId)
      .eq('is_enabled', true)
      .single();
    
    if (!tfaData) {
      return false;
    }
    
    if (verification.token) {
      const encryptedSecret = JSON.parse(tfaData.secret);
      const secret = await this.decrypt(encryptedSecret);
      const isValid = this.verifyTOTP(secret, verification.token);
      
      if (isValid) {
        await supabase
          .from('two_factor_auth')
          .update({ last_used: new Date().toISOString() })
          .eq('user_id', userId);
        return true;
      }
    }
    
    if (verification.backupCode) {
      const encryptedBackupCodes = JSON.parse(tfaData.backup_codes);
      const backupCodes = await Promise.all(
        encryptedBackupCodes.map((encrypted: EncryptedData) => this.decrypt(encrypted))
      );
      
      const codeIndex = backupCodes.indexOf(verification.backupCode);
      if (codeIndex !== -1) {
        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        const newEncryptedCodes = await Promise.all(
          backupCodes.map(code => this.encrypt(code))
        );
        
        await supabase
          .from('two_factor_auth')
          .update({ 
            backup_codes: JSON.stringify(newEncryptedCodes),
            last_used: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        return true;
      }
    }
    
    return false;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  private verifyTOTP(secret: string, token: string): boolean {
    // Simple TOTP verification - in production, use a proper TOTP library
    const window = Math.floor(Date.now() / 30000);
    const expectedToken = crypto
      .createHmac('sha1', Buffer.from(secret, 'base32'))
      .update(Buffer.from(window.toString()))
      .digest('hex')
      .slice(-6);
    
    return expectedToken === token;
  }

  // API Rate Limiting Methods
  async checkRateLimit(
    key: string,
    rule: RateLimitRule,
    ip: string,
    userId?: string
  ): Promise<{ allowed: boolean; status: RateLimitStatus }> {
    const now = Date.now();
    const windowStart = now - rule.windowMs;
    
    let current = this.rateLimitStore.get(key);
    
    if (!current || current.resetTime <= now) {
      current = {
        count: 0,
        resetTime: now + rule.windowMs
      };
    }
    
    current.count++;
    this.rateLimitStore.set(key, current);
    
    const allowed = current.count <= rule.limit;
    
    if (!allowed) {
      await this.logRateLimitViolation({
        ip,
        userId,
        endpoint: rule.endpoint,
        method: rule.method,
        requestCount: current.count,
        limit: rule.limit
      });
    }
    
    return {
      allowed,
      status: {
        limit: rule.limit,
        remaining: Math.max(0, rule.limit - current.count),
        resetTime: current.resetTime,
        retryAfter: allowed ? undefined : Math.ceil((current.resetTime - now) / 1000)
      }
    };
  }

  private async logRateLimitViolation(violation: Omit<RateLimitViolation, 'id' | 'timestamp'>) {
    const record: RateLimitViolation = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...violation
    };
    
    await supabase.from('rate_limit_violations').insert(record);
    
    // Log as security event if excessive violations
    if (violation.requestCount > violation.limit * 2) {
      await this.logSecurityEvent({
        type: 'suspicious_activity',
        userId: violation.userId,
        details: {
          type: 'rate_limit_violation',
          endpoint: violation.endpoint,
          requestCount: violation.requestCount,
          limit: violation.limit
        },
        riskScore: 0.7
      });
    }
  }

  // GDPR Compliance Methods
  async createDataRequest(
    subjectId: string,
    type: DataRequest['type'],
    description: string
  ): Promise<string> {
    const request: Omit<DataRequest, 'id'> = {
      subjectId,
      type,
      status: 'pending',
      requestDate: new Date().toISOString(),
      description
    };
    
    const { data, error } = await supabase
      .from('data_requests')
      .insert(request)
      .select('id')
      .single();
    
    if (error) throw error;
    
    await this.logAudit({
      action: 'data_request_created',
      resource: 'data_request',
      resourceId: data.id,
      details: { type, subjectId },
      severity: 'medium'
    });
    
    return data.id;
  }

  async processDataRequest(requestId: string): Promise<void> {
    const { data: request } = await supabase
      .from('data_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (!request) {
      throw new Error('Data request not found');
    }
    
    await supabase
      .from('data_requests')
      .update({ 
        status: 'processing',
        completion_date: new Date().toISOString()
      })
      .eq('id', requestId);
    
    // Process based on request type
    switch (request.type) {
      case 'access':
        await this.generateDataExport(request.subject_id);
        break;
      case 'erasure':
        await this.erasePersonalData(request.subject_id);
        break;
      case 'portability':
        await this.generatePortableData(request.subject_id);
        break;
      // Add other request types as needed
    }
    
    await supabase
      .from('data_requests')
      .update({ status: 'completed' })
      .eq('id', requestId);
  }

  private async generateDataExport(subjectId: string): Promise<void> {
    // Collect all personal data for the subject
    const personalData = {
      profile: await this.getPersonalData(subjectId),
      orders: await this.getOrderData(subjectId),
      interactions: await this.getInteractionData(subjectId)
    };
    
    // In a real implementation, this would generate a downloadable file
    console.log('Generated data export for subject:', subjectId);
  }

  private async erasePersonalData(subjectId: string): Promise<void> {
    // Anonymize or delete personal data while preserving business records
    await supabase.from('user_profiles').delete().eq('id', subjectId);
    await supabase.from('user_interactions').delete().eq('user_id', subjectId);
    
    // Anonymize order data instead of deleting for business records
    await supabase
      .from('orders')
      .update({ 
        customer_email: 'anonymized@example.com',
        customer_name: 'Anonymized User'
      })
      .eq('customer_id', subjectId);
  }

  private async generatePortableData(subjectId: string): Promise<void> {
    // Generate machine-readable data export
    const portableData = {
      format: 'JSON',
      version: '1.0',
      exported_at: new Date().toISOString(),
      data: await this.getPersonalData(subjectId)
    };
    
    console.log('Generated portable data for subject:', subjectId);
  }

  private async getPersonalData(subjectId: string): Promise<any> {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', subjectId)
      .single();
    
    return data;
  }

  private async getOrderData(subjectId: string): Promise<any> {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', subjectId);
    
    return data;
  }

  private async getInteractionData(subjectId: string): Promise<any> {
    const { data } = await supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', subjectId);
    
    return data;
  }

  async recordConsent(
    subjectId: string,
    purpose: string,
    legalBasis: ConsentRecord['legalBasis'],
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const consent: Omit<ConsentRecord, 'id'> = {
      subjectId,
      purpose,
      legalBasis,
      status: 'given',
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent
    };
    
    await supabase.from('consent_records').insert(consent);
  }

  async withdrawConsent(subjectId: string, purpose: string): Promise<void> {
    await supabase
      .from('consent_records')
      .update({ status: 'withdrawn', timestamp: new Date().toISOString() })
      .eq('subject_id', subjectId)
      .eq('purpose', purpose);
  }

  // Audit Logging Methods
  async logAudit(
    audit: Omit<AuditLog, 'id' | 'timestamp' | 'ipAddress' | 'userAgent'>,
    request?: { ip?: string; userAgent?: string }
  ): Promise<void> {
    const record: Omit<AuditLog, 'id'> = {
      ...audit,
      timestamp: new Date().toISOString(),
      ipAddress: request?.ip || 'unknown',
      userAgent: request?.userAgent || 'unknown'
    };
    
    await supabase.from('audit_logs').insert(record);
  }

  async logSecurityEvent(
    event: Omit<SecurityEvent, 'id' | 'timestamp' | 'ipAddress' | 'userAgent'>,
    request?: { ip?: string; userAgent?: string }
  ): Promise<void> {
    const record: Omit<SecurityEvent, 'id'> = {
      ...event,
      timestamp: new Date().toISOString(),
      ipAddress: request?.ip || 'unknown',
      userAgent: request?.userAgent || 'unknown'
    };
    
    await supabase.from('security_events').insert(record);
    
    // Trigger alerts for high-risk events
    if (event.riskScore >= 0.8) {
      await this.triggerSecurityAlert(record);
    }
  }

  private async triggerSecurityAlert(event: Omit<SecurityEvent, 'id'>): Promise<void> {
    // Send alert to security team
    console.log('High-risk security event detected:', event);
    
    // In a real implementation, this would send notifications
    // via email, Slack, or other alerting systems
  }

  // Data Encryption Methods
  async encrypt(data: string, keyId: string = 'default-aes-256'): Promise<EncryptedData> {
    const key = this.activeKeys.get(keyId);
    const keyInfo = this.encryptionKeys.get(keyId);
    
    if (!key || !keyInfo) {
      throw new Error(`Encryption key ${keyId} not found`);
    }
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', key);
    cipher.setAAD(Buffer.from(keyId));
    
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const tag = cipher.getAuthTag();
    
    return {
      data: encrypted,
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      keyId,
      algorithm: keyInfo.algorithm
    };
  }

  async decrypt(encryptedData: EncryptedData): Promise<string> {
    const key = this.activeKeys.get(encryptedData.keyId);
    
    if (!key) {
      throw new Error(`Decryption key ${encryptedData.keyId} not found`);
    }
    
    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAAD(Buffer.from(encryptedData.keyId));
    
    if (encryptedData.tag) {
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'base64'));
    }
    
    let decrypted = decipher.update(encryptedData.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async rotateEncryptionKey(keyId: string): Promise<string> {
    const oldKey = this.encryptionKeys.get(keyId);
    if (!oldKey) {
      throw new Error(`Key ${keyId} not found`);
    }
    
    // Create new key
    const newKeyId = `${keyId}-${Date.now()}`;
    const newKey: EncryptionKey = {
      ...oldKey,
      id: newKeyId,
      keyData: crypto.randomBytes(32).toString('base64'),
      createdAt: new Date().toISOString()
    };
    
    this.encryptionKeys.set(newKeyId, newKey);
    this.activeKeys.set(newKeyId, Buffer.from(newKey.keyData, 'base64'));
    
    // Mark old key as inactive
    oldKey.isActive = false;
    oldKey.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    
    await this.logAudit({
      action: 'encryption_key_rotated',
      resource: 'encryption_key',
      resourceId: keyId,
      details: { newKeyId },
      severity: 'medium'
    });
    
    return newKeyId;
  }

  // Security Headers and Middleware
  getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }

  // Utility Methods
  async getSecurityMetrics(): Promise<{
    rateLimitViolations: number;
    securityEvents: number;
    dataRequests: number;
    activeUsers2FA: number;
  }> {
    const [violations, events, requests, tfa] = await Promise.all([
      supabase.from('rate_limit_violations').select('id', { count: 'exact' }),
      supabase.from('security_events').select('id', { count: 'exact' }),
      supabase.from('data_requests').select('id', { count: 'exact' }),
      supabase.from('two_factor_auth').select('id', { count: 'exact' }).eq('is_enabled', true)
    ]);
    
    return {
      rateLimitViolations: violations.count || 0,
      securityEvents: events.count || 0,
      dataRequests: requests.count || 0,
      activeUsers2FA: tfa.count || 0
    };
  }
}

export const securityService = new SecurityService();
export default securityService;