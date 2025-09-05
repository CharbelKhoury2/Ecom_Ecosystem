import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { Alert } from '../types';
import { format } from 'date-fns';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'dismissed'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        // Simulate API call with sample alerts
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const sampleAlerts: Alert[] = [
          {
            id: 'alert-001',
            type: 'roas-drop',
            title: 'ROAS Drop Alert',
            message: 'Accessories Bundle campaign ROAS dropped 35% to 2.1x in the last 3 days. Consider pausing or optimizing.',
            severity: 'high',
            status: 'active',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            actionable: true,
          },
          {
            id: 'alert-002',
            type: 'low-stock',
            title: 'Low Stock Alert',
            message: 'Smart Watch (PROD-002) has only 8 units left with active campaigns spending $180/day.',
            severity: 'high',
            status: 'active',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            actionable: true,
          },
          {
            id: 'alert-003',
            type: 'refund-spike',
            title: 'Refund Spike Alert',
            message: 'Refund rate increased to 8.2% (normal: 3.1%) in the last 48 hours. Check product quality issues.',
            severity: 'medium',
            status: 'active',
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            actionable: false,
          },
          {
            id: 'alert-004',
            type: 'campaign-performance',
            title: 'Campaign Performance',
            message: 'Black Friday Prep campaign performance improved after budget adjustment. ROAS: 2.8x → 3.4x',
            severity: 'low',
            status: 'dismissed',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            actionable: false,
          },
          {
            id: 'alert-005',
            type: 'low-stock',
            title: 'Out of Stock Alert',
            message: 'Bluetooth Speaker (PROD-004) is completely out of stock. Paused related campaigns automatically.',
            severity: 'medium',
            status: 'resolved',
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
            actionable: false,
          },
        ];
        
        setAlerts(sampleAlerts);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    if (filter !== 'all' && alert.status !== filter) return false;
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    return true;
  });

  const handleAction = async (alertId: string, action: 'approve' | 'dismiss') => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: action === 'approve' ? 'resolved' : 'dismissed' }
            : alert
        )
      );
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-6"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-5 bg-gray-300 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-full mb-3"></div>
                  <div className="h-3 bg-gray-300 rounded w-32"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 bg-gray-300 rounded w-20"></div>
                  <div className="h-8 bg-gray-300 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-600 mt-1">Monitor and act on critical business events</p>
        </div>
        
        <div className="text-sm text-gray-500">
          {filteredAlerts.length} alerts
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <Filter className="h-5 w-5 text-gray-400" />
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Severity:</label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
            <p className="text-gray-600">All systems are running smoothly</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${
                alert.severity === 'high' ? 'border-l-red-500' :
                alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
              } border border-gray-200`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getSeverityIcon(alert.severity)}
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {alert.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      {alert.status !== 'active' && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          alert.status === 'resolved' ? 'text-green-700 bg-green-100' : 'text-gray-700 bg-gray-100'
                        }`}>
                          {alert.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mt-1">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(alert.createdAt, 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
                
                {alert.status === 'active' && alert.actionable && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleAction(alert.id, 'approve')}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Approve Action
                    </button>
                    <button
                      onClick={() => handleAction(alert.id, 'dismiss')}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;