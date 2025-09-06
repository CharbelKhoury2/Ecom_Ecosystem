/**
 * Enhanced Dashboard component with advanced features
 * Integrates export functionality, advanced filtering, and real-time alerts
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, 
  Filter, 
  Search, 
  Bell, 
  Settings, 
  RefreshCw,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAdvancedFiltering } from '../utils/advancedFiltering';
import { useExport } from '../utils/export';
import { useRealTimeAlerts } from '../utils/realTimeAlerts';
import { useNotificationHelpers } from './NotificationSystem';
import { LoadingSpinner } from './LoadingSpinner';

interface DashboardData {
  orders: Array<{
    id: string;
    orderId: string;
    sku: string;
    quantity: number;
    revenue: number;
    dateCreated: Date;
    status: string;
  }>;
  campaigns: Array<{
    id: string;
    name: string;
    spend: number;
    revenue: number;
    roas: number;
    date: Date;
    status: string;
  }>;
  products: Array<{
    id: string;
    sku: string;
    name: string;
    stockLevel: number;
    costPerItem: number;
    lastUpdated: Date;
  }>;
}

interface AdvancedDashboardProps {
  data: DashboardData;
  loading?: boolean;
  onRefresh?: () => void;
}

export const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({
  data,
  loading = false,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'campaigns' | 'products'>('orders');
  const [showFilters, setShowFilters] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    end: new Date()
  });

  const { showSuccess, showError } = useNotificationHelpers();
  const { isExporting, exportData } = useExport();
  const { addRule, processData, getAlertHistory, getRules } = useRealTimeAlerts();

  // Get current tab data
  const currentData = useMemo(() => {
    switch (activeTab) {
      case 'orders':
        return data.orders;
      case 'campaigns':
        return data.campaigns;
      case 'products':
        return data.products;
      default:
        return [];
    }
  }, [data, activeTab]);

  // Advanced filtering for current tab
  const {
    filteredData,
    originalCount,
    filteredCount,
    searchTerm,
    setSearchTerm,
    addFilterGroup,
    clearAllFilters,
    addSort
  } = useAdvancedFiltering(currentData);

  // Setup default alert rules
  useEffect(() => {
    // Low stock alert
    addRule({
      id: 'low-stock-alert',
      name: 'Low Stock Alert',
      description: 'Alert when product stock is below 10 units',
      enabled: true,
      condition: {
        type: 'threshold',
        field: 'stockLevel',
        operator: 'less_than',
        value: 10
      },
      actions: [{
        type: 'notification',
        config: {
          severity: 'high',
          title: 'Low Stock Alert',
          message: 'Product stock is running low',
          persistent: true
        }
      }],
      cooldown: 300000 // 5 minutes
    });

    // Poor ROAS alert
    addRule({
      id: 'poor-roas-alert',
      name: 'Poor ROAS Alert',
      description: 'Alert when campaign ROAS drops below 2.0',
      enabled: true,
      condition: {
        type: 'threshold',
        field: 'roas',
        operator: 'less_than',
        value: 2.0
      },
      actions: [{
        type: 'notification',
        config: {
          severity: 'medium',
          title: 'Poor Campaign Performance',
          message: 'Campaign ROAS is below profitable threshold',
          persistent: false
        }
      }],
      cooldown: 600000 // 10 minutes
    });
  }, [addRule]);

  // Process data for real-time alerts
  useEffect(() => {
    if (data.products.length > 0) {
      data.products.forEach(product => {
        processData('products', {
          timestamp: Date.now(),
          ...product
        });
      });
    }

    if (data.campaigns.length > 0) {
      data.campaigns.forEach(campaign => {
        processData('campaigns', {
          timestamp: Date.now(),
          ...campaign
        });
      });
    }
  }, [data, processData]);

  // Handle export
  const handleExport = async (format: 'csv' | 'json' | 'excel') => {
    try {
      await exportData(filteredData, {
        format,
        filename: `${activeTab}_export_${new Date().toISOString().split('T')[0]}`,
        includeHeaders: true,
        dateRange
      });
    } catch (error) {
      showError('Export Failed', `Failed to export ${activeTab} data`);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
      showSuccess('Data Refreshed', 'Dashboard data has been updated');
    }
  };

  // Get search fields for current tab
  const getSearchFields = () => {
    switch (activeTab) {
      case 'orders':
        return ['orderId', 'sku'];
      case 'campaigns':
        return ['name'];
      case 'products':
        return ['sku', 'name'];
      default:
        return [];
    }
  };

  const alertHistory = getAlertHistory(10);
  const activeRules = getRules().filter(rule => rule.enabled);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" message="Loading dashboard data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Advanced Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time analytics with advanced filtering and alerts
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Bell className="w-4 h-4 mr-2" />
            Alerts
            {alertHistory.filter(a => !a.acknowledged).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {alertHistory.filter(a => !a.acknowledged).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Alert Panel */}
      {showAlerts && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Recent Alerts
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {activeRules.length} active rules
            </span>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alertHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                <p>No alerts triggered</p>
              </div>
            ) : (
              alertHistory.map(alert => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.acknowledged
                      ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      : alert.severity === 'high' || alert.severity === 'critical'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                        alert.severity === 'high' || alert.severity === 'critical'
                          ? 'text-red-500'
                          : 'text-yellow-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {alert.ruleName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      alert.severity === 'critical'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : alert.severity === 'high'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : alert.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {(['orders', 'campaigns', 'products'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 py-0.5 px-2 rounded-full text-xs">
                {currentData.length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium ${
              showFilters
                ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>

          {/* Results count */}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filteredCount} of {originalCount} {activeTab}
          </span>
        </div>

        {/* Export */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Export:</span>
          {(['csv', 'json', 'excel'] as const).map((format) => (
            <button
              key={format}
              onClick={() => handleExport(format)}
              disabled={isExporting}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-1" />
              {format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Advanced Filters
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={addFilterGroup}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Filter Group
              </button>
              <button
                onClick={clearAllFilters}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Advanced filtering interface would be implemented here.</p>
            <p>Features: Multiple conditions, date ranges, custom operators, saved filters.</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {activeTab === 'orders' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                    </>
                  )}
                  {activeTab === 'campaigns' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Spend
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        ROAS
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                    </>
                  )}
                  {activeTab === 'products' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Stock Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cost Per Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Updated
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredData.slice(0, 50).map((item: any, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {activeTab === 'orders' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {item.orderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          ${item.revenue.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(item.dateCreated).toLocaleDateString()}
                        </td>
                      </>
                    )}
                    {activeTab === 'campaigns' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          ${item.spend.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          ${item.revenue.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            item.roas >= 3 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            item.roas >= 2 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {item.roas.toFixed(2)}x
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                      </>
                    )}
                    {activeTab === 'products' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {item.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            item.stockLevel === 0 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            item.stockLevel < 10 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {item.stockLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          ${item.costPerItem.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(item.lastUpdated).toLocaleDateString()}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No data found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            )}
            
            {filteredData.length > 50 && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing first 50 of {filteredData.length} results. Use filters to narrow down the data.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboard;