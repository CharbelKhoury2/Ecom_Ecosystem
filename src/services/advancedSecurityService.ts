import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'data_access' | 'data_modification' | 'permission_change' | 'suspicious_activity';
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  resource?: string;
  action?: string;
  details: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  location?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
}

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'read' | 'update' | 'delete';
  userId: string;
  userEmail: string;
  changes?: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  metadata: Record<string, unknown>;
  timestamp: string;
  ipAddress: string;
}

interface ComplianceReport {
  id: string;
  type: 'gdpr' | 'ccpa' | 'pci_dss' | 'sox' | 'hipaa';
  status: 'compliant' | 'non_compliant' | 'partial';
  findings: ComplianceFinding[];
  recommendations: string[];
  generatedAt: string;
  generatedBy: string;
  validUntil: string;
}

interface ComplianceFinding {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  requirement: string;
  evidence?: string[];
  remediation: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
}

interface VulnerabilityAssessment {
  id: string;
  type: 'dependency' | 'code' | 'infrastructure' | 'configuration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedComponents: string[];
  cveId?: string;
  cvssScore?: number;
  discoveredAt: string;
  status: 'open' | 'in_progress' | 'resolved' | 'false_positive';
  remediation: string;
  estimatedEffort: string;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  failedLogins: number;
  suspiciousActivities: number;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  complianceScore: number;
  lastAssessment: string;
  trends: {
    period: string;
    events: number;
    vulnerabilities: number;
    complianceScore: number;
  }[];
}

class AdvancedSecurityService {
  private supabase;
  private encryptionKey: string;
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  private suspiciousActivityThresholds = {
    failedLoginAttempts: 5,
    rapidRequests: 100,
    unusualLocations: true,
    offHoursAccess: true
  };

  constructor() {
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  // Audit Trail Management
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        ...event,
        id: this.generateId(),
        timestamp: new Date().toISOString()
      };

      // Store in database
      const { error } = await this.supabase
        .from('security_events')
        .insert([securityEvent]);

      if (error) {
        console.error('Failed to log security event:', error);
      }

      // Check for suspicious patterns
      await this.analyzeSuspiciousActivity(securityEvent);

      // Send alerts for critical events
      if (event.severity === 'critical') {
        await this.sendSecurityAlert(securityEvent);
      }
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  async logAuditEvent(audit: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditLog: AuditLog = {
        ...audit,
        id: this.generateId(),
        timestamp: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('audit_logs')
        .insert([auditLog]);

      if (error) {
        console.error('Failed to log audit event:', error);
      }
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  // Data Encryption
  encryptSensitiveData(data: string): string {
    try {
      return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decryptSensitiveData(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Rate Limiting
  checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const key = `${identifier}_${Math.floor(now / windowMs)}`;
    
    const current = this.rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (now > current.resetTime) {
      current.count = 0;
      current.resetTime = now + windowMs;
    }
    
    current.count++;
    this.rateLimitMap.set(key, current);
    
    if (current.count > limit) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        ipAddress: identifier,
        userAgent: 'Unknown',
        details: { reason: 'Rate limit exceeded', count: current.count, limit },
        severity: 'medium'
      });
      return false;
    }
    
    return true;
  }

  // Vulnerability Assessment
  async runVulnerabilityAssessment(): Promise<VulnerabilityAssessment[]> {
    const vulnerabilities: VulnerabilityAssessment[] = [];

    try {
      // Check for dependency vulnerabilities
      const dependencyVulns = await this.checkDependencyVulnerabilities();
      vulnerabilities.push(...dependencyVulns);

      // Check for configuration issues
      const configVulns = await this.checkConfigurationVulnerabilities();
      vulnerabilities.push(...configVulns);

      // Check for code vulnerabilities
      const codeVulns = await this.checkCodeVulnerabilities();
      vulnerabilities.push(...codeVulns);

      // Store results
      for (const vuln of vulnerabilities) {
        await this.supabase
          .from('vulnerability_assessments')
          .upsert([vuln]);
      }

      return vulnerabilities;
    } catch (error) {
      console.error('Vulnerability assessment failed:', error);
      return [];
    }
  }

  private async checkDependencyVulnerabilities(): Promise<VulnerabilityAssessment[]> {
    // Mock dependency vulnerability check
    // In production, integrate with tools like Snyk, OWASP Dependency Check, etc.
    return [
      {
        id: this.generateId(),
        type: 'dependency',
        severity: 'medium',
        title: 'Outdated React Version',
        description: 'React version has known security vulnerabilities',
        affectedComponents: ['frontend'],
        cveId: 'CVE-2023-1234',
        cvssScore: 6.5,
        discoveredAt: new Date().toISOString(),
        status: 'open',
        remediation: 'Update React to latest stable version',
        estimatedEffort: '2 hours'
      }
    ];
  }

  private async checkConfigurationVulnerabilities(): Promise<VulnerabilityAssessment[]> {
    const vulnerabilities: VulnerabilityAssessment[] = [];

    // Check for insecure configurations
    if (!process.env.HTTPS_ONLY) {
      vulnerabilities.push({
        id: this.generateId(),
        type: 'configuration',
        severity: 'high',
        title: 'HTTPS Not Enforced',
        description: 'Application does not enforce HTTPS connections',
        affectedComponents: ['web-server'],
        discoveredAt: new Date().toISOString(),
        status: 'open',
        remediation: 'Configure server to redirect HTTP to HTTPS',
        estimatedEffort: '1 hour'
      });
    }

    // Check for weak session configuration
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      vulnerabilities.push({
        id: this.generateId(),
        type: 'configuration',
        severity: 'critical',
        title: 'Weak Session Secret',
        description: 'Session secret is too short or using default value',
        affectedComponents: ['authentication'],
        discoveredAt: new Date().toISOString(),
        status: 'open',
        remediation: 'Generate a strong, random session secret (32+ characters)',
        estimatedEffort: '30 minutes'
      });
    }

    return vulnerabilities;
  }

  private async checkCodeVulnerabilities(): Promise<VulnerabilityAssessment[]> {
    // Mock code vulnerability check
    // In production, integrate with SAST tools like SonarQube, CodeQL, etc.
    return [
      {
        id: this.generateId(),
        type: 'code',
        severity: 'low',
        title: 'Potential XSS in User Input',
        description: 'User input not properly sanitized in search component',
        affectedComponents: ['search-component'],
        discoveredAt: new Date().toISOString(),
        status: 'open',
        remediation: 'Implement proper input sanitization and output encoding',
        estimatedEffort: '4 hours'
      }
    ];
  }

  // Compliance Reporting
  async generateComplianceReport(type: ComplianceReport['type']): Promise<ComplianceReport> {
    const findings: ComplianceFinding[] = [];
    const recommendations: string[] = [];

    try {
      switch (type) {
        case 'gdpr':
          findings.push(...await this.checkGDPRCompliance());
          break;
        case 'pci_dss':
          findings.push(...await this.checkPCIDSSCompliance());
          break;
        case 'ccpa':
          findings.push(...await this.checkCCPACompliance());
          break;
        default:
          throw new Error(`Unsupported compliance type: ${type}`);
      }

      // Generate recommendations based on findings
      const criticalFindings = findings.filter(f => f.severity === 'critical');
      if (criticalFindings.length > 0) {
        recommendations.push('Address all critical compliance findings immediately');
      }

      const status = this.calculateComplianceStatus(findings);

      const report: ComplianceReport = {
        id: this.generateId(),
        type,
        status,
        findings,
        recommendations,
        generatedAt: new Date().toISOString(),
        generatedBy: 'system',
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
      };

      // Store report
      await this.supabase
        .from('compliance_reports')
        .insert([report]);

      return report;
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw error;
    }
  }

  private async checkGDPRCompliance(): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];

    // Check for privacy policy
    if (!await this.hasPrivacyPolicy()) {
      findings.push({
        id: this.generateId(),
        category: 'Privacy Rights',
        severity: 'critical',
        description: 'No privacy policy found',
        requirement: 'Article 13 - Information to be provided',
        remediation: 'Create and publish a comprehensive privacy policy',
        status: 'open'
      });
    }

    // Check for consent management
    if (!await this.hasConsentManagement()) {
      findings.push({
        id: this.generateId(),
        category: 'Consent',
        severity: 'high',
        description: 'No consent management system implemented',
        requirement: 'Article 7 - Conditions for consent',
        remediation: 'Implement cookie consent and data processing consent mechanisms',
        status: 'open'
      });
    }

    // Check for data retention policies
    if (!await this.hasDataRetentionPolicy()) {
      findings.push({
        id: this.generateId(),
        category: 'Data Retention',
        severity: 'medium',
        description: 'No data retention policy defined',
        requirement: 'Article 5 - Principles relating to processing',
        remediation: 'Define and implement data retention and deletion policies',
        status: 'open'
      });
    }

    return findings;
  }

  private async checkPCIDSSCompliance(): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];

    // Check for encryption in transit
    if (!process.env.HTTPS_ONLY) {
      findings.push({
        id: this.generateId(),
        category: 'Network Security',
        severity: 'critical',
        description: 'Data transmission not encrypted',
        requirement: 'Requirement 4 - Encrypt transmission of cardholder data',
        remediation: 'Implement HTTPS/TLS encryption for all data transmission',
        status: 'open'
      });
    }

    // Check for access controls
    if (!await this.hasRoleBasedAccess()) {
      findings.push({
        id: this.generateId(),
        category: 'Access Control',
        severity: 'high',
        description: 'Role-based access control not implemented',
        requirement: 'Requirement 7 - Restrict access by business need-to-know',
        remediation: 'Implement role-based access control system',
        status: 'open'
      });
    }

    return findings;
  }

  private async checkCCPACompliance(): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];

    // Check for "Do Not Sell" option
    if (!await this.hasDoNotSellOption()) {
      findings.push({
        id: this.generateId(),
        category: 'Consumer Rights',
        severity: 'high',
        description: 'No "Do Not Sell My Personal Information" option provided',
        requirement: 'CCPA Section 1798.135 - Right to opt-out',
        remediation: 'Implement "Do Not Sell" option for California residents',
        status: 'open'
      });
    }

    return findings;
  }

  // Suspicious Activity Detection
  private async analyzeSuspiciousActivity(event: SecurityEvent): Promise<void> {
    const suspiciousPatterns = [];

    // Check for multiple failed logins
    if (event.type === 'failed_login') {
      const recentFailures = await this.getRecentFailedLogins(event.ipAddress, 15); // 15 minutes
      if (recentFailures >= this.suspiciousActivityThresholds.failedLoginAttempts) {
        suspiciousPatterns.push('Multiple failed login attempts');
      }
    }

    // Check for unusual location
    if (event.location && await this.isUnusualLocation(event.userId, event.location)) {
      suspiciousPatterns.push('Login from unusual location');
    }

    // Check for off-hours access
    if (this.isOffHoursAccess(event.timestamp)) {
      suspiciousPatterns.push('Off-hours access');
    }

    if (suspiciousPatterns.length > 0) {
      await this.logSecurityEvent({
        type: 'suspicious_activity',
        userId: event.userId,
        userEmail: event.userEmail,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        details: {
          originalEvent: event.id,
          patterns: suspiciousPatterns
        },
        severity: 'high'
      });

      // Trigger additional security measures
      if (event.userId) {
        await this.triggerAdditionalVerification(event.userId);
      }
    }
  }

  // Security Metrics
  async getSecurityMetrics(timeRange: string = '30d'): Promise<SecurityMetrics> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      // Get security events
      const { data: events } = await this.supabase
        .from('security_events')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      // Get vulnerabilities
      const { data: vulnerabilities } = await this.supabase
        .from('vulnerability_assessments')
        .select('*')
        .eq('status', 'open');

      // Calculate metrics
      const totalEvents = events?.length || 0;
      const criticalEvents = events?.filter(e => e.severity === 'critical').length || 0;
      const failedLogins = events?.filter(e => e.type === 'failed_login').length || 0;
      const suspiciousActivities = events?.filter(e => e.type === 'suspicious_activity').length || 0;

      const vulnCounts = {
        critical: vulnerabilities?.filter(v => v.severity === 'critical').length || 0,
        high: vulnerabilities?.filter(v => v.severity === 'high').length || 0,
        medium: vulnerabilities?.filter(v => v.severity === 'medium').length || 0,
        low: vulnerabilities?.filter(v => v.severity === 'low').length || 0
      };

      // Calculate compliance score (simplified)
      const complianceScore = this.calculateComplianceScore(vulnCounts);

      return {
        totalEvents,
        criticalEvents,
        failedLogins,
        suspiciousActivities,
        vulnerabilities: vulnCounts,
        complianceScore,
        lastAssessment: new Date().toISOString(),
        trends: [] // TODO: Implement trend calculation
      };
    } catch (error) {
      console.error('Failed to get security metrics:', error);
      throw error;
    }
  }

  // Helper methods
  private generateId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateComplianceStatus(findings: ComplianceFinding[]): ComplianceReport['status'] {
    const criticalFindings = findings.filter(f => f.severity === 'critical');
    const highFindings = findings.filter(f => f.severity === 'high');
    
    if (criticalFindings.length > 0) {
      return 'non_compliant';
    } else if (highFindings.length > 0) {
      return 'partial';
    } else {
      return 'compliant';
    }
  }

  private calculateComplianceScore(vulnerabilities: { critical: number; high: number; medium: number; low: number }): number {
    const totalVulns = vulnerabilities.critical + vulnerabilities.high + vulnerabilities.medium + vulnerabilities.low;
    if (totalVulns === 0) return 100;
    
    const weightedScore = (
      vulnerabilities.critical * 10 +
      vulnerabilities.high * 5 +
      vulnerabilities.medium * 2 +
      vulnerabilities.low * 1
    );
    
    return Math.max(0, 100 - (weightedScore / totalVulns) * 10);
  }

  private async getRecentFailedLogins(ipAddress: string, minutes: number): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    
    const { data } = await this.supabase
      .from('security_events')
      .select('id')
      .eq('type', 'failed_login')
      .eq('ipAddress', ipAddress)
      .gte('timestamp', since);
    
    return data?.length || 0;
  }

  private async isUnusualLocation(userId?: string, location?: SecurityEvent['location']): Promise<boolean> {
    if (!userId || !location?.country) return false;
    
    // Check user's typical locations
    const { data } = await this.supabase
      .from('security_events')
      .select('location')
      .eq('userId', userId)
      .eq('type', 'login')
      .order('timestamp', { ascending: false })
      .limit(10);
    
    const recentCountries = data?.map(e => e.location?.country).filter(Boolean) || [];
    return !recentCountries.includes(location.country);
  }

  private isOffHoursAccess(timestamp: string): boolean {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const day = date.getDay();
    
    // Consider off-hours as weekends or outside 9 AM - 6 PM
    return day === 0 || day === 6 || hour < 9 || hour > 18;
  }

  private async triggerAdditionalVerification(userId: string): Promise<void> {
    // Implement additional verification logic
    // e.g., require 2FA, send security alert email, etc.
    console.log(`Triggering additional verification for user: ${userId}`);
  }

  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    // Implement security alert logic
    // e.g., send email, Slack notification, etc.
    console.log(`Security alert: ${event.type} - ${event.severity}`);
  }

  // Mock compliance check methods
  private async hasPrivacyPolicy(): Promise<boolean> {
    // Check if privacy policy exists
    return false; // Mock result
  }

  private async hasConsentManagement(): Promise<boolean> {
    // Check if consent management is implemented
    return false; // Mock result
  }

  private async hasDataRetentionPolicy(): Promise<boolean> {
    // Check if data retention policy exists
    return false; // Mock result
  }

  private async hasRoleBasedAccess(): Promise<boolean> {
    // Check if RBAC is implemented
    return true; // Mock result
  }

  private async hasDoNotSellOption(): Promise<boolean> {
    // Check if "Do Not Sell" option exists
    return false; // Mock result
  }
}

export default AdvancedSecurityService;
export type {
  SecurityEvent,
  AuditLog,
  ComplianceReport,
  ComplianceFinding,
  VulnerabilityAssessment,
  SecurityMetrics
};