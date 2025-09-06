import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, Filter, RefreshCw, Package, ArrowUpDown, Play, Settings } from 'lucide-react';
import { Alert } from '../types';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import CampaignControl from '../components/CampaignControl';

const Alerts: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'severity' | 'type'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [workspaceId] = useState('default_workspace'); // For now, use default workspace

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const fetchAlerts = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      // Use the new API endpoint with workspace support
      const params = new URLSearchParams({
        workspace_id: workspaceId,
        status: filter !== 'all' ? filter : '',
        severity: severityFilter !== 'all' ? severityFilter : ''
      });
      
      const response = await fetch(`/src/api/alerts/inventory?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      } else {
        console.error('Failed to fetch alerts');
        setAlerts([]);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const runInventoryCheck = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/src/api/alerts/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspace_id: workspaceId, force: true }),
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
        
        // Show success message
        const message = `Inventory check completed: ${data.created || 0} new alerts, ${data.closed || 0} closed alerts`;
        alert(message);
      } else {
        console.error('Failed to run inventory check');
        alert('Failed to run inventory check. Please try again.');
      }
    } catch (error) {
      console.error('Error running inventory check:', error);
      alert('Error running inventory check. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };
  
  const runScheduler = async () => {
    setSchedulerRunning(true);
    try {
      const response = await fetch('/src/api/alerts/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ manual: true, workspace_id: workspaceId }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Scheduler completed: ${data.summary?.successful_checks || 0} successful checks`);
        // Refresh alerts after scheduler run
        await fetchAlerts(true);
      } else {
        console.error('Failed to run scheduler');
        alert('Failed to run scheduler. Please try again.');
      }
    } catch (error) {
      console.error('Error running scheduler:', error);
      alert('Error running scheduler. Please try again.');
    } finally {
      setSchedulerRunning(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filter, severityFilter]); // Refetch when filters change

  const handleAcknowledge = async (alertId: string) => {
    try {
      const response = await fetch(`/src/api/alerts/${alertId}/acknowledge`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          acknowledged_by: user?.email || 'user'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setAlerts(prev =>
          prev.map(alert =>
            alert.id === alertId
              ? { 
                  ...alert, 
                  acknowledged_by: data.alert.acknowledged_by,
                  acknowledged_at: data.alert.acknowledged_at,
                  updated_at: data.alert.updated_at
                }
              : alert
          )
        );
        alert('Alert acknowledged successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to acknowledge alert.');
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      alert('Failed to acknowledge alert. Please try again.');
    }
  };
  
  const handleMockRestock = async (alertId: string) => {
    const qty = prompt('Enter quantity to restock:', '20');
    if (!qty || isNaN(Number(qty))) {
      alert('Please enter a valid quantity.');
      return;
    }
    
    try {
      const response = await fetch(`/src/api/alerts/${alertId}/mock_restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          qty: Number(qty),
          actor: user?.email || 'user'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Mock restock completed! Added ${data.product.quantity_added} units to ${data.product.sku}`);
        // Refresh alerts to see updated status
        await fetchAlerts(true);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to perform mock restock.');
      }
    } catch (error) {
      console.error('Error performing mock restock:', error);
      alert('Failed to perform mock restock. Please try again.');
    }
  };

  const handleSort = (field: 'created_at' | 'severity' | 'type') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedAndFilteredAlerts = alerts
    .filter(alert => {
      if (filter !== 'all' && alert.status !== filter) return false;
      if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'severity':
          const severityOrder = { 'critical': 3, 'warning': 2, 'high': 3, 'medium': 2, 'low': 1 };
          aValue = severityOrder[a.severity as keyof typeof severityOrder] || 0;
          bValue = severityOrder[b.severity as keyof typeof severityOrder] || 0;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />;
      case 'warning':
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />;
      case 'low':
        return <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Low Stock':
      case 'Out of Stock':
        return <Package className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-6"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-3"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Alerts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor stock levels and manage inventory alerts</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={runInventoryCheck}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Checking...' : 'Manual Check'}</span>
          </button>
          
          <button
            onClick={runScheduler}
            disabled={schedulerRunning}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className={`h-4 w-4 ${schedulerRunning ? 'animate-spin' : ''}`} />
            <span>{schedulerRunning ? 'Running...' : 'Run Scheduler'}</span>
          </button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {sortedAndFilteredAlerts.length} alerts
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Severity:</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
          <button
            onClick={() => handleSort('created_at')}
            className={`flex items-center space-x-1 px-3 py-1 text-sm rounded border transition-colors ${
              sortBy === 'created_at' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <span>Date</span>
            {sortBy === 'created_at' && <ArrowUpDown className="h-3 w-3" />}
          </button>
          <button
            onClick={() => handleSort('severity')}
            className={`flex items-center space-x-1 px-3 py-1 text-sm rounded border transition-colors ${
              sortBy === 'severity' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <span>Severity</span>
            {sortBy === 'severity' && <ArrowUpDown className="h-3 w-3" />}
          </button>
          <button
            onClick={() => handleSort('type')}
            className={`flex items-center space-x-1 px-3 py-1 text-sm rounded border transition-colors ${
              sortBy === 'type' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <span>Type</span>
            {sortBy === 'type' && <ArrowUpDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Campaign Control Section */}
      {user?.id && <CampaignControl userId={user.id} />}

      {/* Alert List */}
      <div className="space-y-4">
        {sortedAndFilteredAlerts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No inventory alerts found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' ? 'All inventory levels are healthy' : `No ${filter} alerts found`}
            </p>
            <div className="mt-4 space-x-2">
              <button
                onClick={runInventoryCheck}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Run Manual Check
              </button>
              <button
                onClick={runScheduler}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Run Scheduler
              </button>
            </div>
          </div>
        ) : (
          sortedAndFilteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-l-4 ${
                alert.severity === 'critical' ? 'border-l-red-500 dark:border-l-red-400' :
                alert.severity === 'warning' ? 'border-l-yellow-500 dark:border-l-yellow-400' : 'border-l-gray-500 dark:border-l-gray-400'
              } border border-gray-200 dark:border-gray-700`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(alert.type)}
                    {getSeverityIcon(alert.severity)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {alert.type}
                      </h3>
                      {alert.sku && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          SKU: {alert.sku}
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      {alert.status !== 'open' && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700">
                          {alert.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2 flex-wrap">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(new Date(alert.created_at), 'MMM d, h:mm a')}
                      {alert.updated_at && alert.updated_at !== alert.created_at && (
                        <span className="ml-2">
                          • Updated {format(new Date(alert.updated_at), 'MMM d, h:mm a')}
                        </span>
                      )}
                      {alert.acknowledged_by && (
                        <span className="ml-2 text-green-600 dark:text-green-400">
                          • Acknowledged by {alert.acknowledged_by}
                          {alert.acknowledged_at && ` on ${format(new Date(alert.acknowledged_at), 'MMM d, h:mm a')}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {alert.status === 'open' && (
                  <div className="flex space-x-2 ml-4">
                    {!alert.acknowledged_by && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    {process.env.NODE_ENV !== 'production' && (
                      <button
                        onClick={() => handleMockRestock(alert.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        title="Development only: Simulate restocking"
                      >
                        Mock Restock
                      </button>
                    )}
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