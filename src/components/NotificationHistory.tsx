/**
 * Notification History Component
 * Displays notification history with filtering, search, and detailed logging
 */

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  Smartphone,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { NotificationPayload } from '../services/notificationService';
import { useNotificationHelpers } from './NotificationSystem';

interface NotificationLog {
  id: string;
  notificationId: string;
  userId: string;
  type: 'alert' | 'report' | 'system' | 'marketing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  provider: string;
  status: 'sent' | 'failed' | 'pending' | 'delivered' | 'read';
  timestamp: Date;
  deliveredAt?: Date;
  readAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

interface NotificationHistoryProps {
  userId?: string;
  maxItems?: number;
}

const NotificationHistory: React.FC<NotificationHistoryProps> = ({
  userId = 'current_user',
  maxItems = 100
}) => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const { showSuccess, showError } = useNotificationHelpers();

  useEffect(() => {
    loadNotificationHistory();
  }, [userId]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, selectedType, selectedStatus, selectedProvider, dateRange]);

  const loadNotificationHistory = async () => {
    try {
      setLoading(true);
      
      // TODO: Load from API
      // const response = await fetch(`/api/notifications/history?userId=${userId}&limit=${maxItems}`);
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockLogs: NotificationLog[] = [
        {
          id: 'log_1',
          notificationId: 'notif_1',
          userId,
          type: 'alert',
          severity: 'high',
          title: 'Low Stock Alert',
          message: 'iPhone 15 Pro is running low on stock',
          provider: 'email',
          status: 'delivered',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5000),
          readAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          metadata: { emailAddress: 'user@example.com', messageId: 'email_123' }
        },
        {
          id: 'log_2',
          notificationId: 'notif_2',
          userId,
          type: 'alert',
          severity: 'critical',
          title: 'Out of Stock Alert',
          message: 'Samsung Galaxy S24 is out of stock',
          provider: 'sms',
          status: 'sent',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          deliveredAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 3000),
          metadata: { phoneNumber: '+1234567890', messageId: 'sms_456' }
        },
        {
          id: 'log_3',
          notificationId: 'notif_3',
          userId,
          type: 'report',
          severity: 'medium',
          title: 'Weekly Sales Report',
          message: 'Your weekly sales report is ready',
          provider: 'push',
          status: 'delivered',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 2000),
          readAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
          metadata: { pushEndpoint: 'https://fcm.googleapis.com/...' }
        },
        {
          id: 'log_4',
          notificationId: 'notif_4',
          userId,
          type: 'system',
          severity: 'low',
          title: 'System Maintenance',
          message: 'Scheduled maintenance tonight',
          provider: 'webhook',
          status: 'failed',
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
          error: 'Webhook endpoint returned 500 error',
          metadata: { webhookUrl: 'https://hooks.slack.com/...' }
        },
        {
          id: 'log_5',
          notificationId: 'notif_5',
          userId,
          type: 'marketing',
          severity: 'low',
          title: 'New Feature Available',
          message: 'Check out our new analytics dashboard',
          provider: 'email',
          status: 'pending',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          metadata: { emailAddress: 'user@example.com', scheduled: true }
        }
      ];
      
      setLogs(mockLogs);
    } catch (error) {
      console.error('Error loading notification history:', error);
      showError('Failed to load notification history');
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(log => log.type === selectedType);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(log => log.status === selectedStatus);
    }

    // Provider filter
    if (selectedProvider !== 'all') {
      filtered = filtered.filter(log => log.provider === selectedProvider);
    }

    // Date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(log => log.timestamp >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => log.timestamp <= endDate);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setFilteredLogs(filtered);
  };

  const exportHistory = async () => {
    try {
      const csvContent = generateCSV(filteredLogs);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `notification-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSuccess('Notification history exported successfully');
    } catch (error) {
      console.error('Error exporting history:', error);
      showError('Failed to export notification history');
    }
  };

  const generateCSV = (data: NotificationLog[]): string => {
    const headers = [
      'ID',
      'Type',
      'Severity',
      'Title',
      'Message',
      'Provider',
      'Status',
      'Timestamp',
      'Delivered At',
      'Read At',
      'Error'
    ];

    const rows = data.map(log => [
      log.id,
      log.type,
      log.severity,
      `"${log.title}"`,
      `"${log.message}"`,
      log.provider,
      log.status,
      log.timestamp.toISOString(),
      log.deliveredAt?.toISOString() || '',
      log.readAt?.toISOString() || '',
      log.error ? `"${log.error}"` : ''
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const clearHistory = async () => {
    try {
      // TODO: Call API to clear history
      setLogs([]);
      showSuccess('Notification history cleared');
    } catch (error) {
      console.error('Error clearing history:', error);
      showError('Failed to clear notification history');
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      case 'webhook': return <MessageSquare className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'read': return <Eye className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString();
  };

  const getDeliveryTime = (log: NotificationLog) => {
    if (!log.deliveredAt) return null;
    const deliveryTime = log.deliveredAt.getTime() - log.timestamp.getTime();
    return `${deliveryTime}ms`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <History className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Notification History
            </h2>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={exportHistory}
              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
            <button
              onClick={clearHistory}
              className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="alert">Alerts</option>
            <option value="report">Reports</option>
            <option value="system">System</option>
            <option value="marketing">Marketing</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="read">Read</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>

          {/* Provider Filter */}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Providers</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="push">Push</option>
            <option value="webhook">Webhook</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredLogs.length} of {logs.length} notifications
        </p>
      </div>

      {/* Notification List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notifications found matching your criteria</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => setSelectedLog(log)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      {getProviderIcon(log.provider)}
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {log.provider}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                      getSeverityColor(log.severity)
                    }`}>
                      {log.severity}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {log.type}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    {log.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {log.message}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatTimestamp(log.timestamp)}
                    </span>
                    {log.deliveredAt && (
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Delivered in {getDeliveryTime(log)}
                      </span>
                    )}
                  </div>
                  
                  {log.error && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                      <strong>Error:</strong> {log.error}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStatusIcon(log.status)}
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {log.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detailed Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notification Details
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ID
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white font-mono">
                    {selectedLog.id}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notification ID
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white font-mono">
                    {selectedLog.notificationId}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedLog.title}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedLog.message}
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white capitalize">
                    {selectedLog.type}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Severity
                  </label>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${
                    getSeverityColor(selectedLog.severity)
                  }`}>
                    {selectedLog.severity}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Provider
                  </label>
                  <div className="flex items-center space-x-1">
                    {getProviderIcon(selectedLog.provider)}
                    <span className="text-sm text-gray-900 dark:text-white capitalize">
                      {selectedLog.provider}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedLog.status)}
                    <span className="text-sm text-gray-900 dark:text-white capitalize">
                      {selectedLog.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Timestamp
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatTimestamp(selectedLog.timestamp)}
                  </p>
                </div>
              </div>
              
              {selectedLog.deliveredAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Delivered At
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatTimestamp(selectedLog.deliveredAt)} 
                    <span className="text-gray-500 dark:text-gray-400">
                      ({getDeliveryTime(selectedLog)} after sent)
                    </span>
                  </p>
                </div>
              )}
              
              {selectedLog.readAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Read At
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatTimestamp(selectedLog.readAt)}
                  </p>
                </div>
              )}
              
              {selectedLog.error && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Error
                  </label>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
                    {selectedLog.error}
                  </div>
                </div>
              )}
              
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Metadata
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                    <pre className="text-xs text-gray-900 dark:text-white overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationHistory;