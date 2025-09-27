import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Target, TrendingUp, Percent, PieChart, RefreshCw, AlertCircle, Download, Filter } from 'lucide-react';
import KPICard from '../components/KPICard';
import DataTable from '../components/DataTable';
import InventoryVelocityChart from '../components/InventoryVelocityChart';
import GrossProfitChart from '../components/GrossProfitChart';
import LoadingSpinner, { SkeletonLoader } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorBoundary';
import { useNotificationHelpers } from '../components/NotificationSystem';
import { useShopifyConnection, useShopifyData } from '../hooks/useShopify';
import { useErrorHandler, NetworkError, DataError } from '../utils/errorHandling';
import { apiClient } from '../utils/apiClient';
import { supabase } from '../lib/supabase';
import { 
  AnimatedCard, 
  AnimatedButton, 
  StaggeredList, 
  StaggeredItem, 
  FadeIn, 
  SlideIn,
  AnimatedCounter,
  AnimatedIcon
} from '../components/AnimatedComponents';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [dateRange, setDateRange] = useState('7d');
  const [syncing, setSyncing] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const { showSuccess, showError, showInfo } = useNotificationHelpers();
  const { handleError, clearRetryAttempts } = useErrorHandler();
  const { connection, syncData } = useShopifyConnection(user?.id);
  const { data: dashboardData, loading, error, refresh } = useShopifyData(
    user?.id, 
    dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
  );

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Fetch analytics data
  useEffect(() => {
    if (user?.id && connection.connected) {
      fetchAnalyticsData();
    }
  }, [user?.id, connection.connected, dateRange]);

  const fetchAnalyticsData = async () => {
    if (!user?.id) return;
    
    setChartsLoading(true);
    try {
      // Generate mock data for demo purposes
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      
      // Mock inventory velocity data
      const mockInventoryData = Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (13 - i));
        return {
          date: date.toISOString().split('T')[0],
          inventory: Math.floor(Math.random() * 1000) + 500,
          sales: Math.floor(Math.random() * 100) + 20,
          velocity: Math.floor(Math.random() * 30) + 5
        };
      });
      
      // Mock gross profit data
      const mockProfitData = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        return {
          date: date.toISOString().split('T')[0],
          revenue: Math.floor(Math.random() * 10000) + 5000,
          adSpend: Math.floor(Math.random() * 2000) + 500,
          cogs: Math.floor(Math.random() * 3000) + 1000,
          grossProfit: Math.floor(Math.random() * 5000) + 2000
        };
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setInventoryData(mockInventoryData);
      setProfitData(mockProfitData);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setInventoryData([]);
      setProfitData([]);
    } finally {
      setChartsLoading(false);
    }
  };

  const handleSyncData = async () => {
    if (!user?.id) return;
    
    setSyncing(true);
    showInfo('Syncing data', 'This may take a few moments...');
    
    try {
      const result = await syncData(30);
      if (result.success) {
        showSuccess('Data synced successfully', 'Your dashboard has been updated with the latest data.');
        refresh();
        await fetchAnalyticsData();
        setRetryCount(0);
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      showError('Sync failed', 'Please try again later.');
      setRetryCount(prev => prev + 1);
    } finally {
      setSyncing(false);
    }
  };

  const handleExportData = () => {
    showInfo('Export started', 'Your data export will be ready shortly.');
  };

  const skuColumns = [
    { key: 'sku', label: 'SKU' },
    { key: 'productName', label: 'Product Name' },
    { key: 'revenue', label: 'Revenue', format: 'currency' as const },
    { key: 'profit', label: 'Profit', format: 'currency' as const },
    { key: 'stockLevel', label: 'Stock Level', format: 'number' as const },
    { key: 'status', label: 'Status' },
  ];

  const campaignColumns = [
    { key: 'name', label: 'Campaign Name' },
    { key: 'spend', label: 'Spend', format: 'currency' as const },
    { key: 'roas', label: 'ROAS', format: 'number' as const },
    { key: 'profit', label: 'Profit', format: 'currency' as const },
    { key: 'status', label: 'Status' },
  ];

  // Enhanced loading state with skeleton
  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
        
        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <SkeletonLoader lines={3} />
            </div>
          ))}
        </div>
        
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <SkeletonLoader lines={1} />
              </div>
              <div className="p-6">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Enhanced connection prompt
  if (!connection.connected) {
    return (
      <div className="p-4 lg:p-6 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">True P&L Overview</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time profitability analysis across all channels</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Connect Your Shopify Store</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            To view your True P&L dashboard with real data, please connect your Shopify store in the Settings page.
          </p>
          <a
            href="/settings"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Settings
          </a>
        </div>
      </div>
    );
  }

  // Enhanced error state
  if (error) {
    return (
      <div className="p-4 lg:p-6 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">True P&L Overview</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time profitability analysis across all channels</p>
          </div>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <ErrorMessage 
            error={error} 
            onRetry={refresh}
            className="mb-4"
          />
          
          {retryCount > 2 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Having trouble? Try syncing your data or contact support if the issue persists.
              </p>
              <button
                onClick={handleSyncData}
                disabled={syncing}
                className="mt-3 inline-flex items-center px-3 py-2 border border-blue-300 dark:border-blue-600 text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Data'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Enhanced no data state
  if (!dashboardData) {
    return (
      <div className="p-4 lg:p-6 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">True P&L Overview</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time profitability analysis across all channels</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Data Available</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Sync your Shopify data to see your True P&L metrics and insights.
          </p>
          <button
            onClick={handleSyncData}
            disabled={syncing}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 xl:p-8 space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
      {/* Modern Enhanced Header */}
      <FadeIn>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-card border border-gray-200/50 dark:border-gray-700/50 mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white font-display">
                    True P&L Overview
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 font-medium">
                    Real-time profitability analysis across all channels
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl sm:rounded-2xl p-2 sm:p-3">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="bg-transparent border-none text-sm sm:text-base text-gray-900 dark:text-white font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={handleExportData}
                  className="btn-secondary flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-3"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                
                <button
                  onClick={handleSyncData}
                  disabled={syncing}
                  className="btn-primary flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-3 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Syncing...' : 'Sync'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Enhanced KPI Cards with Staggered Animation */}
      <StaggeredList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6" staggerDelay={0.1}>
        <StaggeredItem>
          <AnimatedCard className="h-full">
            <KPICard title="Revenue" metric={dashboardData.kpis.revenue} icon={DollarSign} />
          </AnimatedCard>
        </StaggeredItem>
        <StaggeredItem>
          <AnimatedCard className="h-full">
            <KPICard title="Ad Spend" metric={dashboardData.kpis.adSpend} icon={Target} />
          </AnimatedCard>
        </StaggeredItem>
        <StaggeredItem>
          <AnimatedCard className="h-full">
            <KPICard title="COGS" metric={dashboardData.kpis.cogs} icon={PieChart} />
          </AnimatedCard>
        </StaggeredItem>
        <StaggeredItem>
          <AnimatedCard className="h-full">
            <KPICard title="Gross Profit" metric={dashboardData.kpis.grossProfit} icon={TrendingUp} />
          </AnimatedCard>
        </StaggeredItem>
        <StaggeredItem>
          <AnimatedCard className="h-full">
            <KPICard title="Blended ROAS" metric={dashboardData.kpis.blendedRoas} icon={TrendingUp} />
          </AnimatedCard>
        </StaggeredItem>
        <StaggeredItem>
          <AnimatedCard className="h-full">
            <KPICard title="Contribution Margin" metric={dashboardData.kpis.contributionMargin} icon={Percent} />
          </AnimatedCard>
        </StaggeredItem>
      </StaggeredList>

      {/* Modern Enhanced Analytics Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        <SlideIn direction="left" delay={0.2}>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-card border border-gray-200/50 dark:border-gray-700/50 overflow-hidden h-full">
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                    <PieChart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display">Inventory vs Sales Velocity</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Last 14 days performance</p>
                  </div>
                </div>
                <button className="p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300">
                  <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {chartsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <LoadingSpinner size="lg" message="Loading chart data..." />
                </div>
              ) : (
                <InventoryVelocityChart data={inventoryData} loading={chartsLoading} />
              )}
            </div>
          </div>
        </SlideIn>
        
        <SlideIn direction="right" delay={0.3}>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-card border border-gray-200/50 dark:border-gray-700/50 overflow-hidden h-full">
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-900/10 dark:to-blue-900/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 shadow-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display">Daily Gross Profit Trend</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Revenue, spend & COGS analysis</p>
                  </div>
                </div>
                <button className="p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300">
                  <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {chartsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <LoadingSpinner size="lg" message="Loading chart data..." />
                </div>
              ) : (
                <GrossProfitChart data={profitData} loading={chartsLoading} />
              )}
            </div>
          </div>
        </SlideIn>
      </div>

      {/* Modern Enhanced Data Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        <FadeIn delay={0.4}>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-card border border-gray-200/50 dark:border-gray-700/50 overflow-hidden h-full">
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display">Top SKUs by Profit</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Most profitable products this period</p>
                </div>
              </div>
            </div>
            <div className="p-0">
              <DataTable
                data={dashboardData?.topSkus || []}
                columns={skuColumns}
                loading={loading}
                emptyMessage="No SKU data available"
              />
            </div>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.5}>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-card border border-gray-200/50 dark:border-gray-700/50 overflow-hidden h-full">
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-orange-50/50 to-red-50/50 dark:from-orange-900/10 dark:to-red-900/10">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display">Campaign Performance</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Ad campaigns ranked by profitability</p>
                </div>
              </div>
            </div>
            <div className="p-0">
              <DataTable
                data={dashboardData?.campaigns || []}
                columns={campaignColumns}
                loading={loading}
                emptyMessage="No campaign data available"
              />
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
};

export default Dashboard;