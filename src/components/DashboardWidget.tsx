/**
 * Dashboard Widget Component - Customizable widget for dashboard
 */

import React, { useState } from 'react';
import {
  MoreVertical,
  Edit,
  Trash2,
  Move,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  PieChart,
  LineChart,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import DataVisualization from './DataVisualization';

export interface WidgetConfig {
  id: string;
  title: string;
  type: 'kpi' | 'chart' | 'table' | 'metric';
  size: 'small' | 'medium' | 'large';
  dataSource: string;
  chartType?: 'bar' | 'line' | 'pie' | 'area';
  refreshInterval?: number; // in minutes
  position: { x: number; y: number };
  settings: {
    showTrend?: boolean;
    showPercentage?: boolean;
    colorScheme?: string;
    dateRange?: string;
    filters?: any[];
  };
}

export interface WidgetData {
  value?: number | string;
  previousValue?: number;
  trend?: 'up' | 'down' | 'neutral';
  percentage?: number;
  data?: any[];
  lastUpdated?: string;
}

interface DashboardWidgetProps {
  config: WidgetConfig;
  data: WidgetData;
  isEditing?: boolean;
  onEdit?: (config: WidgetConfig) => void;
  onDelete?: (id: string) => void;
  onRefresh?: (id: string) => void;
  onMove?: (id: string, position: { x: number; y: number }) => void;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  config,
  data,
  isEditing = false,
  onEdit,
  onDelete,
  onRefresh,
  onMove
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getSizeClasses = () => {
    switch (config.size) {
      case 'small':
        return 'col-span-1 row-span-1';
      case 'medium':
        return 'col-span-2 row-span-1';
      case 'large':
        return 'col-span-2 row-span-2';
      default:
        return 'col-span-1 row-span-1';
    }
  };

  const getIcon = () => {
    switch (config.dataSource) {
      case 'revenue':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'orders':
        return <ShoppingCart className="h-5 w-5 text-blue-600" />;
      case 'products':
        return <Package className="h-5 w-5 text-purple-600" />;
      case 'customers':
        return <Users className="h-5 w-5 text-orange-600" />;
      case 'alerts':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <BarChart3 className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTrendIcon = () => {
    if (!data.trend) return null;
    
    switch (data.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (data.trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatValue = (value: number | string | undefined) => {
    if (typeof value === 'number') {
      if (config.dataSource === 'revenue' || config.title.toLowerCase().includes('revenue') || config.title.toLowerCase().includes('sales')) {
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      }
      return value.toLocaleString();
    }
    return value || '0';
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsLoading(true);
    try {
      await onRefresh(config.id);
    } finally {
      setIsLoading(false);
    }
  };

  const renderKPIWidget = () => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {config.title}
          </h3>
        </div>
        {config.settings.showTrend && getTrendIcon()}
      </div>
      
      <div className="space-y-1">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatValue(data.value)}
        </div>
        
        {config.settings.showPercentage && data.percentage !== undefined && (
          <div className={`flex items-center text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="ml-1">
              {data.percentage > 0 ? '+' : ''}{data.percentage.toFixed(1)}%
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">
              vs last period
            </span>
          </div>
        )}
        
        {data.lastUpdated && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Updated {format(new Date(data.lastUpdated), 'MMM d, HH:mm')}
          </div>
        )}
      </div>
    </div>
  );

  const renderChartWidget = () => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {config.title}
        </h3>
        {config.chartType && (
          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {config.chartType} Chart
          </div>
        )}
      </div>
      
      {data.data && data.data.length > 0 ? (
        <DataVisualization
          data={data.data}
          type={config.chartType || 'bar'}
          xKey="name"
          yKey="value"
          height={config.size === 'large' ? 300 : 200}
        />
      ) : (
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      )}
      
      {data.lastUpdated && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Updated {format(new Date(data.lastUpdated), 'MMM d, HH:mm')}
        </div>
      )}
    </div>
  );

  const renderTableWidget = () => (
    <div className="p-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
        {config.title}
      </h3>
      
      {data.data && data.data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                {Object.keys(data.data[0]).slice(0, 3).map(key => (
                  <th key={key} className="text-left py-2 text-gray-600 dark:text-gray-400 capitalize">
                    {key.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.slice(0, 5).map((row, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                  {Object.values(row).slice(0, 3).map((value, i) => (
                    <td key={i} className="py-2 text-gray-900 dark:text-gray-300">
                      {typeof value === 'number' ? value.toLocaleString() : String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.data.length > 5 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Showing 5 of {data.data.length} items
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      )}
    </div>
  );

  const renderWidget = () => {
    switch (config.type) {
      case 'kpi':
      case 'metric':
        return renderKPIWidget();
      case 'chart':
        return renderChartWidget();
      case 'table':
        return renderTableWidget();
      default:
        return renderKPIWidget();
    }
  };

  return (
    <div className={`${getSizeClasses()} relative`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full">
        {/* Widget Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {isEditing && (
              <div className="cursor-move text-gray-400 hover:text-gray-600">
                <Move className="h-4 w-4" />
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            {(onEdit || onDelete) && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10 min-w-[120px]">
                    {onEdit && (
                      <button
                        onClick={() => {
                          onEdit(config);
                          setShowMenu(false);
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          onDelete(config.id);
                          setShowMenu(false);
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Widget Content */}
        <div className="flex-1">
          {renderWidget()}
        </div>
      </div>
      
      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default DashboardWidget;