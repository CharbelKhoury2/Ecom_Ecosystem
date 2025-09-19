/**
 * Advanced Analytics Dashboard with ML Insights
 * Displays predictive analytics, anomaly detection, and performance benchmarking
 */

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Brain,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Eye,
  Calendar,
  Filter
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import {
  forecastSalesTrends,
  forecastInventoryDemand,
  detectAnomalies,
  predictCustomerLifetimeValue,
  ForecastData
} from '../utils/predictiveAnalytics';
import {
  generateBusinessInsights,
  BusinessInsight
} from '../utils/recommendationEngine';

interface AnalyticsData {
  salesData: { date: string; revenue: number; orders: number; visitors: number }[];
  productData: { sku: string; name: string; revenue: number; margin: number; sales: number }[];
  customerData: { customerId: string; totalSpent: number; orderCount: number; lastOrder: string }[];
  marketingData: { channel: string; spend: number; revenue: number; roas: number }[];
}

interface MetricCard {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [salesForecast, setSalesForecast] = useState<ForecastData[]>([]);
  const [anomalies, setAnomalies] = useState<{ index: number; value: number; severity: number }[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'orders' | 'visitors'>('revenue');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual data fetching
      const mockData = generateMockAnalyticsData();
      setAnalyticsData(mockData);
      
      // Generate insights
      const businessInsights = generateBusinessInsights(
        mockData.salesData,
        mockData.productData,
        mockData.customerData
      );
      setInsights(businessInsights);
      
      // Generate sales forecast
      const historicalSales = mockData.salesData.map(d => ({
        date: d.date,
        quantity: d.revenue / 100 // Simplified conversion
      }));
      const forecast = forecastSalesTrends(historicalSales, 14);
      setSalesForecast(forecast);
      
      // Detect anomalies
      const revenues = mockData.salesData.map(d => d.revenue);
      const detectedAnomalies = detectAnomalies(revenues, 2);
      setAnomalies(detectedAnomalies);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockAnalyticsData = (): AnalyticsData => {
    const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
    const salesData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const baseRevenue = 5000 + Math.random() * 3000;
      const seasonality = 1 + 0.3 * Math.sin((i / 7) * Math.PI); // Weekly seasonality
      const trend = 1 + (days - i) * 0.01; // Slight upward trend
      
      salesData.push({
        date,
        revenue: Math.round(baseRevenue * seasonality * trend),
        orders: Math.round((baseRevenue * seasonality * trend) / 120), // Avg order value ~$120
        visitors: Math.round((baseRevenue * seasonality * trend) / 12) // 10% conversion rate
      });
    }
    
    const productData = [
      { sku: 'PROD001', name: 'Premium Widget', revenue: 25000, margin: 0.45, sales: 150 },
      { sku: 'PROD002', name: 'Standard Widget', revenue: 18000, margin: 0.35, sales: 200 },
      { sku: 'PROD003', name: 'Basic Widget', revenue: 12000, margin: 0.25, sales: 300 },
      { sku: 'PROD004', name: 'Deluxe Kit', revenue: 30000, margin: 0.55, sales: 100 },
      { sku: 'PROD005', name: 'Starter Pack', revenue: 8000, margin: 0.30, sales: 250 }
    ];
    
    const customerData = [
      { customerId: 'CUST001', totalSpent: 5000, orderCount: 12, lastOrder: '2024-01-15' },
      { customerId: 'CUST002', totalSpent: 3200, orderCount: 8, lastOrder: '2024-01-14' },
      { customerId: 'CUST003', totalSpent: 2800, orderCount: 6, lastOrder: '2024-01-13' },
      { customerId: 'CUST004', totalSpent: 4500, orderCount: 10, lastOrder: '2024-01-12' },
      { customerId: 'CUST005', totalSpent: 1800, orderCount: 4, lastOrder: '2024-01-11' }
    ];
    
    const marketingData = [
      { channel: 'Google Ads', spend: 5000, revenue: 15000, roas: 3.0 },
      { channel: 'Facebook Ads', spend: 3000, revenue: 7500, roas: 2.5 },
      { channel: 'Email Marketing', spend: 500, revenue: 2000, roas: 4.0 },
      { channel: 'SEO', spend: 1000, revenue: 3000, roas: 3.0 },
      { channel: 'Influencer', spend: 2000, revenue: 4000, roas: 2.0 }
    ];
    
    return { salesData, productData, customerData, marketingData };
  };

  const calculateMetrics = (): MetricCard[] => {
    if (!analyticsData) return [];
    
    const currentPeriod = analyticsData.salesData.slice(-7);
    const previousPeriod = analyticsData.salesData.slice(-14, -7);
    
    const currentRevenue = currentPeriod.reduce((sum, d) => sum + d.revenue, 0);
    const previousRevenue = previousPeriod.reduce((sum, d) => sum + d.revenue, 0);
    const revenueChange = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    
    const currentOrders = currentPeriod.reduce((sum, d) => sum + d.orders, 0);
    const previousOrders = previousPeriod.reduce((sum, d) => sum + d.orders, 0);
    const ordersChange = ((currentOrders - previousOrders) / previousOrders) * 100;
    
    const currentVisitors = currentPeriod.reduce((sum, d) => sum + d.visitors, 0);
    const previousVisitors = previousPeriod.reduce((sum, d) => sum + d.visitors, 0);
    const visitorsChange = ((currentVisitors - previousVisitors) / previousVisitors) * 100;
    
    const conversionRate = (currentOrders / currentVisitors) * 100;
    const previousConversionRate = (previousOrders / previousVisitors) * 100;
    const conversionChange = conversionRate - previousConversionRate;
    
    return [
      {
        title: 'Revenue (7d)',
        value: `$${currentRevenue.toLocaleString()}`,
        change: revenueChange,
        trend: revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'neutral',
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'text-green-600'
      },
      {
        title: 'Orders (7d)',
        value: currentOrders.toLocaleString(),
        change: ordersChange,
        trend: ordersChange > 0 ? 'up' : ordersChange < 0 ? 'down' : 'neutral',
        icon: <BarChart3 className="w-5 h-5" />,
        color: 'text-blue-600'
      },
      {
        title: 'Visitors (7d)',
        value: currentVisitors.toLocaleString(),
        change: visitorsChange,
        trend: visitorsChange > 0 ? 'up' : visitorsChange < 0 ? 'down' : 'neutral',
        icon: <Eye className="w-5 h-5" />,
        color: 'text-purple-600'
      },
      {
        title: 'Conversion Rate',
        value: `${conversionRate.toFixed(1)}%`,
        change: conversionChange,
        trend: conversionChange > 0 ? 'up' : conversionChange < 0 ? 'down' : 'neutral',
        icon: <Target className="w-5 h-5" />,
        color: 'text-orange-600'
      }
    ];
  };

  const prepareChartData = () => {
    if (!analyticsData) return [];
    
    return analyticsData.salesData.map((data, index) => {
      const forecastPoint = salesForecast.find(f => f.date === data.date);
      const isAnomaly = anomalies.some(a => a.index === index);
      
      return {
        ...data,
        forecast: forecastPoint?.predicted || null,
        confidence: forecastPoint?.confidence || null,
        isAnomaly,
        displayDate: format(parseISO(data.date), 'MMM dd')
      };
    });
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'risk': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'optimization': return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'trend': return <Activity className="w-5 h-5 text-blue-500" />;
      default: return <Brain className="w-5 h-5 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const metrics = calculateMetrics();
  const chartData = prepareChartData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">AI-powered insights and predictive analytics</p>
        </div>
        
        <div className="flex space-x-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as 'revenue' | 'orders' | 'visitors')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="revenue">Revenue</option>
            <option value="orders">Orders</option>
            <option value="visitors">Visitors</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className={metric.color}>
                {metric.icon}
              </div>
              <div className={`flex items-center text-sm ${
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {metric.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> :
                 metric.trend === 'down' ? <TrendingDown className="w-4 h-4 mr-1" /> : null}
                {Math.abs(metric.change).toFixed(1)}%
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend with Forecast */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sales Trend &amp; Forecast</h3>
            <Brain className="w-5 h-5 text-blue-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  typeof value === 'number' ? `$${value.toLocaleString()}` : value,
                  name === 'revenue' ? 'Actual Revenue' : 
                  name === 'forecast' ? 'Predicted Revenue' : name
                ]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Actual"
              />
              {salesForecast.length > 0 && (
                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Forecast"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Anomaly Detection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Anomaly Detection</h3>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Scatter 
                dataKey={selectedMetric} 
                fill={(entry: any) => entry.isAnomaly ? '#EF4444' : '#3B82F6'}
              />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                Normal
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                Anomaly
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Performance & Marketing ROI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products by Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData?.productData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Marketing ROI */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Marketing Channel ROI</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData?.marketingData || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ channel, roas }) => `${channel}: ${roas.toFixed(1)}x`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="revenue"
              >
                {(analyticsData?.marketingData || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered Business Insights</h3>
          <Brain className="w-5 h-5 text-blue-500" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => (
            <div 
              key={insight.id} 
              className={`border-l-4 p-4 rounded-r-lg ${getImpactColor(insight.impact)}`}
            >
              <div className="flex items-start space-x-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                  
                  {insight.metrics && (
                    <div className="text-xs text-gray-600 mb-2">
                      Current: {insight.metrics.current.toLocaleString()} {insight.metrics.unit} → 
                      Potential: {insight.metrics.potential.toLocaleString()} {insight.metrics.unit}
                    </div>
                  )}
                  
                  {insight.recommendations && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">Recommendations:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {insight.recommendations.slice(0, 2).map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;