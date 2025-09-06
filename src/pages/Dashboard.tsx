import { useState, useEffect } from 'react';
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
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      
      // Fetch inventory velocity data with enhanced error handling
      try {
        const inventoryResponse = await apiClient.get(
          `/src/api/analytics/inventory-velocity?userId=${user.id}&days=14`,
          {
            cache: true,
            cacheTTL: 2 * 60 * 1000, // 2 minutes cache
            validateResponse: (data: any) => Array.isArray(data?.data)
          }
        );
        setInventoryData(inventoryResponse.data.data || []);
      } catch (error) {
        await handleError(error as Error, {
          component: 'Dashboard',
          action: 'fetchInventoryData',
          userId: user.id
        }, {
          showNotification: false // We'll handle this manually
        });
        setInventoryData([]);
      }
      
      // Fetch gross profit data with enhanced error handling
      try {
        const profitResponse = await apiClient.get(
          `/src/api/analytics/gross-profit?userId=${user.id}&days=${days}`,
          {
            cache: true,
            cacheTTL: 2 * 60 * 1000, // 2 minutes cache
            validateResponse: (data: any) => Array.isArray(data?.data)
          }
        );
        setProfitData(profitResponse.data.data || []);
      } catch (error) {
        await handleError(error as Error, {
          component: 'Dashboard',
          action: 'fetchProfitData',
          userId: user.id
        }, {
          showNotification: false // We'll handle this manually
        });
        setProfitData([]);
      }
      
    } catch (error) {
      await handleError(error as Error, {
        component: 'Dashboard',
        action: 'fetchAnalyticsData',
        userId: user.id
      }, {
        retry: fetchAnalyticsData,
        fallback: () => {
          setInventoryData([]);
          setProfitData([]);
        }
      });
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
        await fetchAnalyticsData(); // Refresh analytics data too
        setRetryCount(0);
        clearRetryAttempts('Dashboard'); // Clear any retry attempts
      } else {
        throw new DataError(result.error || 'Sync failed', {
          component: 'Dashboard',
          action: 'syncData',
          userId: user.id
        });
      }
    } catch (error) {
      await handleError(error as Error, {
        component: 'Dashboard',
        action: 'syncData',
        userId: user.id
      }, {
        retry: handleSyncData,
        fallback: () => {
          setRetryCount(prev => prev + 1);
        }
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleExportData = () => {
    showInfo('Export started', 'Your data export will be ready shortly.');
    // TODO: Implement export functionality
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
            <div key={i} className="card card-body">
              <SkeletonLoader lines={3} />
            </div>
          ))}
        </div>
        
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="card">
              <div className="card-header">
                <SkeletonLoader lines={1} />
              </div>
              <div className="card-body">
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
        
        <div className="card p-8 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Connect Your Shopify Store</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            To view your True P&L dashboard with real data, please connect your Shopify store in the Settings page.
          </p>
          <a
            href="/settings"
            className="btn-primary"
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
            <div className="alert-info">
              <p className="text-sm">
                Having trouble? Try syncing your data or contact support if the issue persists.
              </p>
              <button
                onClick={handleSyncData}
                disabled={syncing}
                className="btn-outline mt-3"
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
        
        <div className="card p-8 text-center max-w-2xl mx-auto">
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
            className="btn-primary"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">True P&L Overview</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time profitability analysis across all channels</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input text-sm min-w-0"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportData}
              className="btn-outline text-sm"
              title="Export data"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            
            <button
              onClick={handleSyncData}
              disabled={syncing}
              className="btn-primary text-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync'}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <KPICard title="Revenue" metric={dashboardData.kpis.revenue} icon={DollarSign} />
        <KPICard title="Ad Spend" metric={dashboardData.kpis.adSpend} icon={Target} />
        <KPICard title="COGS" metric={dashboardData.kpis.cogs} icon={PieChart} />
        <KPICard title="Gross Profit" metric={dashboardData.kpis.grossProfit} icon={TrendingUp} />
        <KPICard title="Blended ROAS" metric={dashboardData.kpis.blendedRoas} icon={TrendingUp} />
        <KPICard title="Contribution Margin" metric={dashboardData.kpis.contributionMargin} icon={Percent} />
      </div>

      {/* Enhanced Analytics Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inventory vs Sales Velocity</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Last 14 days performance</p>
          </div>
          <div className="card-body">
            {chartsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <LoadingSpinner size="lg" message="Loading chart data..." />
              </div>
            ) : (
              <InventoryVelocityChart data={inventoryData} loading={chartsLoading} />
            )}
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Gross Profit Trend</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Revenue, spend & COGS analysis</p>
          </div>
          <div className="card-body">
            {chartsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <LoadingSpinner size="lg" message="Loading chart data..." />
              </div>
            ) : (
              <GrossProfitChart data={profitData} loading={chartsLoading} />
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Data Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top 10 SKUs</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Best performing products</p>
          </div>
          <div className="card-body p-0">
            <DataTable
              title=""
              columns={skuColumns}
              data={dashboardData.topSkus}
            />
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top 10 Campaigns</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Best performing ad campaigns</p>
          </div>
          <div className="card-body p-0">
            <DataTable
              title=""
              columns={campaignColumns}
              data={dashboardData.topCampaigns}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;