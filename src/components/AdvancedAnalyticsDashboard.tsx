/**
 * Advanced Analytics Dashboard with enhanced data visualization and insights
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  AreaChart,
  BarChart,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  Line,
  Bar,
  Cell,
  Pie
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { useErrorHandler } from '../utils/errorHandling';
import { apiClient } from '../utils/apiClient';
import { useEnhancedNotificationHelpers } from './EnhancedNotificationSystem';

interface MetricCard {
  id: string;
  title: string;
  value: number;
  previousValue?: number;
  format: 'currency' | 'number' | 'percentage';
  icon: React.ComponentType<any>;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
  visible: boolean;
}

interface ChartConfig {
  id: string;
  title: string;
  type: 'line' | 'area' | 'bar' | 'pie';
  dataKey: string;
  color: string;
  visible: boolean;
  yAxisId?: string;
}

interface AnalyticsData {
  timeSeriesData: any[];
  metrics: Record<string, number>;
  comparisons: Record<string, { current: number; previous: number }>;
  segments: any[];
  insights: string[];
}

interface AdvancedAnalyticsDashboardProps {
  userId?: string;
  dateRange?: { start: Date; end: Date };
  onExport?: (data: any) => void;
}

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  userId,
  dateRange: propDateRange,
  onExport
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>([]);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'comparison'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  
  const { handleError } = useErrorHandler();
  const { showSuccess, showError, showInfo } = useEnhancedNotificationHelpers();

  // Default metric cards configuration
  const defaultMetricCards: MetricCard[] = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: 0,
      format: 'currency',
      icon: DollarSign,
      color: 'bg-green-500',
      visible: true
    },
    {
      id: 'orders',
      title: 'Total Orders',
      value: 0,
      format: 'number',
      icon: ShoppingCart,
      color: 'bg-blue-500',
      visible: true
    },
    {
      id: 'customers',
      title: 'Unique Customers',
      value: 0,
      format: 'number',
      icon: Users,
      color: 'bg-purple-500',
      visible: true
    },
    {
      id: 'aov',
      title: 'Average Order Value',
      value: 0,
      format: 'currency',
      icon: Target,
      color: 'bg-orange-500',
      visible: true
    },
    {
      id: 'conversion_rate',
      title: 'Conversion Rate',
      value: 0,
      format: 'percentage',
      icon: TrendingUp,
      color: 'bg-indigo-500',
      visible: true
    },
    {
      id: 'inventory_turnover',
      title: 'Inventory Turnover',
      value: 0,
      format: 'number',
      icon: Package,
      color: 'bg-teal-500',
      visible: true
    }
  ];

  const [metricCards, setMetricCards] = useState<MetricCard[]>(defaultMetricCards);

  // Initialize chart configurations
  useEffect(() => {
    const defaultCharts: ChartConfig[] = [
      {
        id: 'revenue_trend',
        title: 'Revenue Trend',
        type: 'area',
        dataKey: 'revenue',
        color: '#10B981',
        visible: true
      },
      {
        id: 'orders_trend',
        title: 'Orders Trend',
        type: 'line',
        dataKey: 'orders',
        color: '#3B82F6',
        visible: true,
        yAxisId: 'right'
      },
      {
        id: 'customer_acquisition',
        title: 'Customer Acquisition',
        type: 'bar',
        dataKey: 'new_customers',
        color: '#8B5CF6',
        visible: true
      },
      {
        id: 'product_performance',
        title: 'Product Performance',
        type: 'pie',
        dataKey: 'product_revenue',
        color: '#F59E0B',
        visible: true
      }
    ];
    setChartConfigs(defaultCharts);
  }, []);

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await apiClient.get('/api/analytics/advanced', {
        cache: true,
        cacheTTL: 5 * 60 * 1000, // 5 minutes
        validateResponse: (data: any) => data && typeof data === 'object'
      });
      
      const analyticsData: AnalyticsData = response.data;
      setData(analyticsData);
      
      // Update metric cards with real data
      setMetricCards(prev => prev.map(card => {
        const value = analyticsData.metrics[card.id] || 0;
        const previousValue = analyticsData.comparisons[card.id]?.previous;
        const currentValue = analyticsData.comparisons[card.id]?.current || value;
        
        let trend: 'up' | 'down' | 'neutral' = 'neutral';
        if (previousValue !== undefined) {
          if (currentValue > previousValue) trend = 'up';
          else if (currentValue < previousValue) trend = 'down';
        }
        
        return {
          ...card,
          value: currentValue,
          previousValue,
          trend
        };
      }));
      
    } catch (error) {
      await handleError(error as Error, {
        component: 'AdvancedAnalyticsDashboard',
        action: 'fetchAnalyticsData',
        userId
      }, {
        retry: fetchAnalyticsData,
        showNotification: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    showInfo('Refreshing Analytics', 'Updating your dashboard with the latest data...');
    
    try {
      await fetchAnalyticsData();
      showSuccess('Analytics Updated', 'Your dashboard has been refreshed with the latest data.');
    } catch (error) {
      showError('Refresh Failed', 'Unable to update analytics data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Export data
  const handleExport = () => {
    if (!data) return;
    
    const exportData = {
      metrics: metricCards.reduce((acc, card) => {
        acc[card.id] = {
          title: card.title,
          value: card.value,
          previousValue: card.previousValue,
          trend: card.trend
        };
        return acc;
      }, {} as any),
      timeSeriesData: data.timeSeriesData,
      dateRange,
      exportedAt: new Date().toISOString()
    };
    
    if (onExport) {
      onExport(exportData);
    } else {
      // Default export as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    showSuccess('Export Complete', 'Analytics data has been exported successfully.');
  };

  // Toggle metric visibility
  const toggleMetricVisibility = (metricId: string) => {
    setMetricCards(prev => prev.map(card => 
      card.id === metricId ? { ...card, visible: !card.visible } : card
    ));
  };

  // Toggle chart visibility
  const toggleChartVisibility = (chartId: string) => {
    setChartConfigs(prev => prev.map(chart => 
      chart.id === chartId ? { ...chart, visible: !chart.visible } : chart
    ));
  };

  // Format value based on type
  const formatValue = (value: number, format: 'currency' | 'number' | 'percentage') => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(value);
      default:
        return value.toString();
    }
  };

  // Calculate percentage change
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {format(new Date(label), 'MMM d, yyyy')}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatValue(entry.value, 'number')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    if (userId) {
      fetchAnalyticsData();
    }
  }, [userId, dateRange]);

  // Update date range from props
  useEffect(() => {
    if (propDateRange) {
      setDateRange(propDateRange);
    }
  }, [propDateRange]);

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Advanced Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive insights and performance metrics
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['overview', 'detailed', 'comparison'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="btn-outline text-sm"
              title="Export data"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-primary text-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricCards.filter(card => card.visible).map((card) => {
          const Icon = card.icon;
          const percentageChange = card.previousValue 
            ? calculatePercentageChange(card.value, card.previousValue)
            : 0;
          
          return (
            <div key={card.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${card.color} bg-opacity-10`}>
                    <Icon className={`h-6 w-6 ${card.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatValue(card.value, card.format)}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => toggleMetricVisibility(card.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
              
              {card.previousValue !== undefined && (
                <div className="mt-4 flex items-center space-x-2">
                  {card.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : card.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : null}
                  <span className={`text-sm font-medium ${
                    card.trend === 'up' ? 'text-green-600' :
                    card.trend === 'down' ? 'text-red-600' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    vs previous period
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {chartConfigs.filter(chart => chart.visible).map((chart) => (
          <div key={chart.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {chart.title}
                </h3>
                <button
                  onClick={() => toggleChartVisibility(chart.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <EyeOff className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                {chart.type === 'line' && (
                  <RechartsLineChart data={data?.timeSeriesData || []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'MMM d')}
                      className="text-xs"
                    />
                    <YAxis yAxisId={chart.yAxisId || 'left'} className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      yAxisId={chart.yAxisId || 'left'}
                      type="monotone" 
                      dataKey={chart.dataKey} 
                      stroke={chart.color} 
                      strokeWidth={2}
                      dot={{ fill: chart.color, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: chart.color, strokeWidth: 2 }}
                    />
                  </RechartsLineChart>
                )}
                
                {chart.type === 'area' && (
                  <AreaChart data={data?.timeSeriesData || []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'MMM d')}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey={chart.dataKey} 
                      stroke={chart.color} 
                      fill={chart.color}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                )}
                
                {chart.type === 'bar' && (
                  <BarChart data={data?.timeSeriesData || []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'MMM d')}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey={chart.dataKey} fill={chart.color} radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
                
                {chart.type === 'pie' && (
                  <RechartsPieChart>
                    <Pie
                      data={data?.segments || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill={chart.color}
                      dataKey={chart.dataKey}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(data?.segments || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Insights Section */}
      {data?.insights && data.insights.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            Key Insights
          </h3>
          <ul className="space-y-2">
            {data.insights.map((insight, index) => (
              <li key={index} className="text-blue-800 dark:text-blue-200 text-sm">
                • {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalyticsDashboard;