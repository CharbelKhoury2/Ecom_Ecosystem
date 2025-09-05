import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Target, TrendingUp, Percent, PieChart, RefreshCw, AlertCircle } from 'lucide-react';
import KPICard from '../components/KPICard';
import DataTable from '../components/DataTable';
import { useShopifyConnection, useShopifyData } from '../hooks/useShopify';
import { supabase } from '../lib/supabase';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [dateRange, setDateRange] = useState('7d');
  const [syncing, setSyncing] = useState(false);
  
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

  const handleSyncData = async () => {
    if (!user?.id) return;
    
    setSyncing(true);
    try {
      const result = await syncData(30);
      if (result.success) {
        // Refresh dashboard data after sync
        refresh();
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">True P&L Overview</h1>
            <p className="text-gray-600 mt-1">Real-time profitability analysis across all channels</p>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="h-4 bg-gray-300 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-300 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show connection prompt if not connected to Shopify
  if (!connection.connected) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">True P&L Overview</h1>
            <p className="text-gray-600 mt-1">Real-time profitability analysis across all channels</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Shopify Store</h2>
          <p className="text-gray-600 mb-6">
            To view your True P&L dashboard with real data, please connect your Shopify store in the Settings page.
          </p>
          <a
            href="/settings"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Settings
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">True P&L Overview</h1>
            <p className="text-gray-600 mt-1">Real-time profitability analysis across all channels</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={refresh}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">True P&L Overview</h1>
            <p className="text-gray-600 mt-1">Real-time profitability analysis across all channels</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600 mb-6">
            Sync your Shopify data to see your True P&L metrics and insights.
          </p>
          <button
            onClick={handleSyncData}
            disabled={syncing}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">True P&L Overview</h1>
          <p className="text-gray-600 mt-1">Real-time profitability analysis across all channels</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <button
            onClick={handleSyncData}
            disabled={syncing}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard title="Revenue" metric={dashboardData.kpis.revenue} icon={DollarSign} />
        <KPICard title="Ad Spend" metric={dashboardData.kpis.adSpend} icon={Target} />
        <KPICard title="COGS" metric={dashboardData.kpis.cogs} icon={PieChart} />
        <KPICard title="Gross Profit" metric={dashboardData.kpis.grossProfit} icon={TrendingUp} />
        <KPICard title="Blended ROAS" metric={dashboardData.kpis.blendedRoas} icon={TrendingUp} />
        <KPICard title="Contribution Margin" metric={dashboardData.kpis.contributionMargin} icon={Percent} />
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DataTable
          title="Top 10 SKUs"
          columns={skuColumns}
          data={dashboardData.topSkus}
        />
        <DataTable
          title="Top 10 Campaigns"
          columns={campaignColumns}
          data={dashboardData.topCampaigns}
        />
      </div>
    </div>
  );
};

export default Dashboard;