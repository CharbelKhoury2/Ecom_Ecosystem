import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Lock,
  Users,
  Activity,
  FileText,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Zap,
  Bug,
  Key,
  Database,
  Globe,
  Settings
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdvancedSecurityService, { SecurityMetrics, SecurityEvent, VulnerabilityAssessment, ComplianceReport } from '../services/advancedSecurityService';
import { toast } from 'sonner';

interface SecurityAlert {
  id: string;
  type: 'vulnerability' | 'breach' | 'compliance' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  status: 'open' | 'investigating' | 'resolved';
  assignedTo?: string;
}

const SecurityDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityAssessment[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  
  const securityService = new AdvancedSecurityService();

  useEffect(() => {
    loadSecurityData();
  }, [selectedTimeRange]);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      // Load security metrics
      const metrics = await securityService.getSecurityMetrics(selectedTimeRange);
      setSecurityMetrics(metrics);

      // Load recent vulnerabilities
      const vulns = await securityService.runVulnerabilityAssessment();
      setVulnerabilities(vulns);

      // Mock data for other components
      setRecentEvents([
        {
          id: '1',
          type: 'failed_login',
          userId: 'user-123',
          userEmail: 'john.doe@example.com',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          details: { attempts: 3 },
          severity: 'medium',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          location: { country: 'US', city: 'New York' }
        },
        {
          id: '2',
          type: 'suspicious_activity',
          userId: 'user-456',
          userEmail: 'jane.smith@example.com',
          ipAddress: '10.0.0.50',
          userAgent: 'Mozilla/5.0...',
          details: { reason: 'Unusual location' },
          severity: 'high',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          location: { country: 'RU', city: 'Moscow' }
        }
      ]);

      setSecurityAlerts([
        {
          id: '1',
          type: 'vulnerability',
          severity: 'critical',
          title: 'Critical SQL Injection Vulnerability',
          description: 'SQL injection vulnerability found in user authentication module',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          status: 'open'
        },
        {
          id: '2',
          type: 'compliance',
          severity: 'high',
          title: 'GDPR Compliance Issue',
          description: 'Missing consent management for data processing',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          status: 'investigating',
          assignedTo: 'security-team'
        }
      ]);

      setComplianceReports([
        {
          id: '1',
          type: 'gdpr',
          status: 'partial',
          findings: [],
          recommendations: ['Implement consent management', 'Update privacy policy'],
          generatedAt: new Date().toISOString(),
          generatedBy: 'system',
          validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);
    } catch (error) {
      console.error('Failed to load security data:', error);
      toast.error('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const runSecurityScan = async () => {
    toast.loading('Running security scan...');
    try {
      const vulns = await securityService.runVulnerabilityAssessment();
      setVulnerabilities(vulns);
      toast.success('Security scan completed');
    } catch (error) {
      toast.error('Security scan failed');
    }
  };

  const generateComplianceReport = async (type: 'gdpr' | 'pci_dss' | 'ccpa') => {
    toast.loading(`Generating ${type.toUpperCase()} compliance report...`);
    try {
      const report = await securityService.generateComplianceReport(type);
      setComplianceReports(prev => [report, ...prev]);
      toast.success('Compliance report generated');
    } catch (error) {
      toast.error('Failed to generate compliance report');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'non_compliant': return 'text-red-600 bg-red-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'investigating': return 'text-blue-600 bg-blue-100';
      case 'open': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Mock chart data
  const securityTrendData = [
    { date: '2024-01-01', events: 45, vulnerabilities: 12, threats: 3 },
    { date: '2024-01-02', events: 52, vulnerabilities: 8, threats: 5 },
    { date: '2024-01-03', events: 38, vulnerabilities: 15, threats: 2 },
    { date: '2024-01-04', events: 61, vulnerabilities: 6, threats: 7 },
    { date: '2024-01-05', events: 43, vulnerabilities: 11, threats: 4 },
    { date: '2024-01-06', events: 55, vulnerabilities: 9, threats: 6 },
    { date: '2024-01-07', events: 47, vulnerabilities: 13, threats: 3 }
  ];

  const vulnerabilityDistribution = [
    { name: 'Critical', value: securityMetrics?.vulnerabilities.critical || 0, color: '#ef4444' },
    { name: 'High', value: securityMetrics?.vulnerabilities.high || 0, color: '#f97316' },
    { name: 'Medium', value: securityMetrics?.vulnerabilities.medium || 0, color: '#eab308' },
    { name: 'Low', value: securityMetrics?.vulnerabilities.low || 0, color: '#3b82f6' }
  ];

  const eventTypeData = [
    { type: 'Failed Logins', count: securityMetrics?.failedLogins || 0 },
    { type: 'Suspicious Activity', count: securityMetrics?.suspiciousActivities || 0 },
    { type: 'Critical Events', count: securityMetrics?.criticalEvents || 0 },
    { type: 'Total Events', count: securityMetrics?.totalEvents || 0 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              Security Dashboard
            </h1>
            <p className="text-gray-600">Monitor security events, vulnerabilities, and compliance status</p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            
            <button
              onClick={runSecurityScan}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              Run Scan
            </button>
          </div>
        </div>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Security Score</p>
              <p className="text-3xl font-bold text-gray-900">
                {securityMetrics?.complianceScore.toFixed(0) || 0}%
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              (securityMetrics?.complianceScore || 0) >= 80 ? 'bg-green-100' : 
              (securityMetrics?.complianceScore || 0) >= 60 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <Shield className={`w-6 h-6 ${
                (securityMetrics?.complianceScore || 0) >= 80 ? 'text-green-600' : 
                (securityMetrics?.complianceScore || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
          </div>
          <div className="mt-4">
            <div className={`flex items-center gap-1 text-sm ${
              (securityMetrics?.complianceScore || 0) >= 80 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(securityMetrics?.complianceScore || 0) >= 80 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {(securityMetrics?.complianceScore || 0) >= 80 ? 'Good' : 'Needs Attention'}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Threats</p>
              <p className="text-3xl font-bold text-gray-900">
                {(securityMetrics?.vulnerabilities.critical || 0) + (securityMetrics?.vulnerabilities.high || 0)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-1 text-sm text-red-600">
              <span>{securityMetrics?.vulnerabilities.critical || 0} Critical</span>
              <span className="text-gray-400">•</span>
              <span>{securityMetrics?.vulnerabilities.high || 0} High</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Security Events</p>
              <p className="text-3xl font-bold text-gray-900">
                {securityMetrics?.totalEvents || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span>{securityMetrics?.criticalEvents || 0} Critical Events</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed Logins</p>
              <p className="text-3xl font-bold text-gray-900">
                {securityMetrics?.failedLogins || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Lock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span>Last 24 hours</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'vulnerabilities', label: 'Vulnerabilities', icon: Bug },
              { id: 'compliance', label: 'Compliance', icon: FileText },
              { id: 'events', label: 'Security Events', icon: Eye },
              { id: 'alerts', label: 'Alerts', icon: AlertTriangle }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Security Trends Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={securityTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="events" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="vulnerabilities" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="threats" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Vulnerability Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Vulnerability Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={vulnerabilityDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {vulnerabilityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Event Types */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Event Types</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={eventTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'vulnerabilities' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Vulnerabilities</h3>
              <button
                onClick={runSecurityScan}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                Scan Now
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vulnerability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Component
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discovered
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vulnerabilities.map(vuln => (
                  <tr key={vuln.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{vuln.title}</div>
                        <div className="text-sm text-gray-500">{vuln.description}</div>
                        {vuln.cveId && (
                          <div className="text-xs text-blue-600 mt-1">{vuln.cveId}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(vuln.severity)}`}>
                        {vuln.severity.charAt(0).toUpperCase() + vuln.severity.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {vuln.affectedComponents.join(', ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vuln.status)}`}>
                        {vuln.status.replace('_', ' ').charAt(0).toUpperCase() + vuln.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(vuln.discoveredAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="space-y-6">
          {/* Compliance Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Compliance Reports</h3>
            <div className="flex gap-4">
              <button
                onClick={() => generateComplianceReport('gdpr')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <FileText className="w-4 h-4" />
                GDPR Report
              </button>
              <button
                onClick={() => generateComplianceReport('pci_dss')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <FileText className="w-4 h-4" />
                PCI DSS Report
              </button>
              <button
                onClick={() => generateComplianceReport('ccpa')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                <FileText className="w-4 h-4" />
                CCPA Report
              </button>
            </div>
          </div>

          {/* Compliance Reports */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Compliance Reports</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {complianceReports.map(report => (
                <div key={report.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-medium text-gray-900">
                          {report.type.toUpperCase()} Compliance Report
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                          {report.status.replace('_', ' ').charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Generated on {formatDate(report.generatedAt)} • Valid until {formatDate(report.validUntil)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {report.recommendations.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Recommendations:</h5>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {report.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Security Events</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {recentEvents.map(event => (
              <div key={event.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(event.severity)}`}>
                        {event.severity.charAt(0).toUpperCase() + event.severity.slice(1)}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {event.type.replace('_', ' ').charAt(0).toUpperCase() + event.type.slice(1)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {event.userEmail && <p><strong>User:</strong> {event.userEmail}</p>}
                      <p><strong>IP Address:</strong> {event.ipAddress}</p>
                      {event.location && (
                        <p><strong>Location:</strong> {event.location.city}, {event.location.country}</p>
                      )}
                      <p><strong>Details:</strong> {JSON.stringify(event.details)}</p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {formatDate(event.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Security Alerts</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {securityAlerts.map(alert => (
              <div key={alert.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(alert.status)}`}>
                        {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-medium text-gray-900 mb-1">{alert.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                    
                    {alert.assignedTo && (
                      <p className="text-sm text-gray-500">
                        <strong>Assigned to:</strong> {alert.assignedTo}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {formatDate(alert.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;