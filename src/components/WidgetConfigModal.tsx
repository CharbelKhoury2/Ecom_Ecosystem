/**
 * Widget Configuration Modal - Configure dashboard widgets
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  BarChart3,
  PieChart,
  LineChart,
  Table,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle
} from 'lucide-react';
import { WidgetConfig } from './DashboardWidget';

interface WidgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WidgetConfig) => void;
  initialConfig?: WidgetConfig;
}

const WidgetConfigModal: React.FC<WidgetConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig
}) => {
  const [config, setConfig] = useState<Partial<WidgetConfig>>({
    title: '',
    type: 'kpi',
    size: 'medium',
    dataSource: 'revenue',
    chartType: 'bar',
    refreshInterval: 5,
    position: { x: 0, y: 0 },
    settings: {
      showTrend: true,
      showPercentage: true,
      colorScheme: 'blue',
      dateRange: 'last_30_days',
      filters: []
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    } else {
      // Reset to defaults when creating new widget
      setConfig({
        title: '',
        type: 'kpi',
        size: 'medium',
        dataSource: 'revenue',
        chartType: 'bar',
        refreshInterval: 5,
        position: { x: 0, y: 0 },
        settings: {
          showTrend: true,
          showPercentage: true,
          colorScheme: 'blue',
          dateRange: 'last_30_days',
          filters: []
        }
      });
    }
    setErrors({});
  }, [initialConfig, isOpen]);

  const widgetTypes = [
    { id: 'kpi', label: 'KPI Card', icon: TrendingUp, description: 'Display key metrics with trends' },
    { id: 'chart', label: 'Chart', icon: BarChart3, description: 'Visualize data with charts' },
    { id: 'table', label: 'Table', icon: Table, description: 'Show data in tabular format' },
    { id: 'metric', label: 'Simple Metric', icon: DollarSign, description: 'Basic number display' }
  ];

  const dataSources = [
    { id: 'revenue', label: 'Revenue', icon: DollarSign, description: 'Sales revenue data' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, description: 'Order statistics' },
    { id: 'products', label: 'Products', icon: Package, description: 'Product inventory data' },
    { id: 'customers', label: 'Customers', icon: Users, description: 'Customer metrics' },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, description: 'System alerts' }
  ];

  const chartTypes = [
    { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { id: 'line', label: 'Line Chart', icon: LineChart },
    { id: 'pie', label: 'Pie Chart', icon: PieChart },
    { id: 'area', label: 'Area Chart', icon: BarChart3 }
  ];

  const sizes = [
    { id: 'small', label: 'Small', description: '1x1 grid' },
    { id: 'medium', label: 'Medium', description: '2x1 grid' },
    { id: 'large', label: 'Large', description: '2x2 grid' }
  ];

  const dateRanges = [
    { id: 'last_7_days', label: 'Last 7 Days' },
    { id: 'last_30_days', label: 'Last 30 Days' },
    { id: 'last_90_days', label: 'Last 90 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' }
  ];

  const colorSchemes = [
    { id: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { id: 'green', label: 'Green', color: 'bg-green-500' },
    { id: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { id: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { id: 'red', label: 'Red', color: 'bg-red-500' }
  ];

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!config.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!config.type) {
      newErrors.type = 'Widget type is required';
    }

    if (!config.dataSource) {
      newErrors.dataSource = 'Data source is required';
    }

    if (config.type === 'chart' && !config.chartType) {
      newErrors.chartType = 'Chart type is required for chart widgets';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateConfig()) return;

    const finalConfig: WidgetConfig = {
      id: initialConfig?.id || `widget_${Date.now()}`,
      title: config.title!,
      type: config.type!,
      size: config.size!,
      dataSource: config.dataSource!,
      chartType: config.chartType,
      refreshInterval: config.refreshInterval,
      position: config.position!,
      settings: config.settings!
    };

    onSave(finalConfig);
    onClose();
  };

  const updateConfig = (field: string, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateSettings = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      settings: { ...prev.settings, [field]: value }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {initialConfig ? 'Edit Widget' : 'Create Widget'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Settings</h3>
            
            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Widget Title
              </label>
              <input
                type="text"
                value={config.title || ''}
                onChange={(e) => updateConfig('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.title ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter widget title"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Widget Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Widget Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {widgetTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => updateConfig('type', type.id)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        config.type === type.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium text-sm">{type.label}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{type.description}</p>
                    </button>
                  );
                })}
              </div>
              {errors.type && (
                <p className="text-red-500 text-sm mt-1">{errors.type}</p>
              )}
            </div>

            {/* Size */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Widget Size
              </label>
              <div className="grid grid-cols-3 gap-3">
                {sizes.map(size => (
                  <button
                    key={size.id}
                    onClick={() => updateConfig('size', size.id)}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      config.size === size.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm">{size.label}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{size.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Data Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Data Settings</h3>
            
            {/* Data Source */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Source
              </label>
              <div className="grid grid-cols-1 gap-2">
                {dataSources.map(source => {
                  const Icon = source.icon;
                  return (
                    <button
                      key={source.id}
                      onClick={() => updateConfig('dataSource', source.id)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        config.dataSource === source.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5" />
                        <div>
                          <div className="font-medium text-sm">{source.label}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{source.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.dataSource && (
                <p className="text-red-500 text-sm mt-1">{errors.dataSource}</p>
              )}
            </div>

            {/* Chart Type (only for chart widgets) */}
            {config.type === 'chart' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chart Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {chartTypes.map(chart => {
                    const Icon = chart.icon;
                    return (
                      <button
                        key={chart.id}
                        onClick={() => updateConfig('chartType', chart.id)}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          config.chartType === chart.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="h-6 w-6 mx-auto mb-1" />
                        <div className="text-sm font-medium">{chart.label}</div>
                      </button>
                    );
                  })}
                </div>
                {errors.chartType && (
                  <p className="text-red-500 text-sm mt-1">{errors.chartType}</p>
                )}
              </div>
            )}

            {/* Date Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <select
                value={config.settings?.dateRange || 'last_30_days'}
                onChange={(e) => updateSettings('dateRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {dateRanges.map(range => (
                  <option key={range.id} value={range.id}>{range.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Display Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Display Settings</h3>
            
            {/* Color Scheme */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color Scheme
              </label>
              <div className="flex space-x-2">
                {colorSchemes.map(scheme => (
                  <button
                    key={scheme.id}
                    onClick={() => updateSettings('colorScheme', scheme.id)}
                    className={`w-8 h-8 rounded-full ${scheme.color} border-2 ${
                      config.settings?.colorScheme === scheme.id
                        ? 'border-gray-900 dark:border-white'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    title={scheme.label}
                  />
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.settings?.showTrend || false}
                  onChange={(e) => updateSettings('showTrend', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show trend indicators</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.settings?.showPercentage || false}
                  onChange={(e) => updateSettings('showPercentage', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show percentage change</span>
              </label>
            </div>

            {/* Refresh Interval */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Refresh Interval (minutes)
              </label>
              <select
                value={config.refreshInterval || 5}
                onChange={(e) => updateConfig('refreshInterval', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value={1}>1 minute</option>
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {initialConfig ? 'Update Widget' : 'Create Widget'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetConfigModal;