import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { Alert } from '../types';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

const Alerts: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'dismissed'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        // Fetch campaign alerts from database
        const { data: campaignAlerts, error: campaignError } = await supabase
          .from('campaign_alerts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (campaignError) {
          throw campaignError;
        }

        // Fetch low stock alerts from products
        const { data: products, error: productsError } = await supabase
          .from('shopify_products')
          .select('*')
          .eq('user_id', user.id)
          .lte('stock_quantity', 10);

        if (productsError) {
          console.warn('Failed to fetch product alerts:', productsError);
        }

        // Convert to Alert format
        const allAlerts: Alert[] = [];

        // Add campaign alerts
        campaignAlerts?.forEach(alert => {
          allAlerts.push({
            id: alert.id,
            type: alert.alert_type as any,
            title: getAlertTitle(alert.alert_type),
            message: alert.message,
            severity: alert.severity as any,
            status: alert.status as any,
            createdAt: new Date(alert.created_at),
            actionable: alert.alert_type === 'roas_drop' || alert.alert_type === 'zero_conversions',
          });
        });

        // Add stock alerts
        products?.forEach(product => {
          if (product.stock_quantity === 0) {
            allAlerts.push({
              id: `stock-${product.id}`,
              type: 'low-stock',
              title: 'Out of Stock Alert',
              message: `${product.name} (${product.sku}) is completely out of stock.`,
              severity: 'high',
              status: 'active',
              createdAt: new Date(product.last_updated),
              actionable: false,
            });
          } else if (product.stock_quantity < 10) {
            allAlerts.push({
              id: `stock-${product.id}`,
              type: 'low-stock',
              title: 'Low Stock Alert',
              message: `${product.name} (${product.sku}) has only ${product.stock_quantity} units left.`,
              severity: product.stock_quantity < 5 ? 'high' : 'medium',
              status: 'active',
              createdAt: new Date(product.last_updated),
              actionable: false,
            });
          }
        });

        setAlerts(allAlerts);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [user?.id]);

  const getAlertTitle = (alertType: string) => {
    switch (alertType) {
      case 'roas_drop':
        return 'ROAS Drop Alert';
      case 'zero_conversions':
        return 'Zero Conversions Alert';
      case 'high_spend':
        return 'High Spend Alert';
      default:
        return 'Campaign Alert';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter !== 'all' && alert.status !== filter) return false;
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    return true;
  });

  const handleAction = async (alertId: string, action: 'approve' | 'dismiss') => {
    try {
      if (action === 'approve') {
        // For campaign alerts, try to pause the campaign
        const alert = alerts.find(a => a.id === alertId);
        if (alert && (alert.type === 'roas-drop' || alert.type === 'zero_conversions')) {
          // Extract campaign ID from alert (would need to be stored in alert data)
          // For now, just mark as resolved
          await supabase
            .from('campaign_alerts')
            .update({ status: 'resolved', resolved_at: new Date().toISOString() })
            .eq('id', alertId);
        }
      } else {
        // Dismiss alert
        await supabase
          .from('campaign_alerts')
          .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
          .eq('id', alertId);
      }

      // Update local state
      setAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId
            ? { ...alert, status: action === 'approve' ? 'resolved' : 'dismissed' }
            : alert
        )
      );
    } catch (error) {
      console.error('Error updating alert:', error);
      alert('Failed to update alert. Please try again.');
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
            <p className="text-gray-600">
              {user?.id ? 'All systems are running smoothly' : 'Please sign in to view alerts'}
            </p>
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