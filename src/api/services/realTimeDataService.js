// Real-time Data Service - Provides live e-commerce data for AI responses

class RealTimeDataService {
  constructor() {
    this.dataCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  // Get sales data
  async getSalesData() {
    const cacheKey = 'sales_data';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const salesData = {
      revenue: {
        today: 2847.50,
        thisMonth: 45230.75,
        growth: 12.3,
        lastUpdated: new Date().toISOString()
      },
      orders: {
        today: 23,
        thisMonth: 342,
        averageOrderValue: 67.50,
        conversionRate: 3.2
      },
      topProducts: [
        { name: 'Wireless Headphones', sales: 45, revenue: 2250 },
        { name: 'Smart Watch', sales: 32, revenue: 1920 },
        { name: 'Bluetooth Speaker', sales: 28, revenue: 1400 }
      ]
    };

    this.setCache(cacheKey, salesData);
    return salesData;
  }

  // Get inventory data
  async getInventoryData() {
    const cacheKey = 'inventory_data';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const inventoryData = {
      products: {
        total: 1247,
        lowStock: 15,
        outOfStock: 3,
        topSelling: [
          { name: 'Wireless Headphones', stock: 8, sales: 45 },
          { name: 'Smart Watch', stock: 12, sales: 32 },
          { name: 'Bluetooth Speaker', stock: 25, sales: 28 }
        ]
      },
      alerts: [
        { type: 'low_stock', product: 'Wireless Headphones', stock: 8, threshold: 10 },
        { type: 'low_stock', product: 'Smart Watch', stock: 12, threshold: 15 },
        { type: 'out_of_stock', product: 'Gaming Mouse', stock: 0, threshold: 5 }
      ],
      lastUpdated: new Date().toISOString()
    };

    this.setCache(cacheKey, inventoryData);
    return inventoryData;
  }

  // Get marketing data
  async getMarketingData() {
    const cacheKey = 'marketing_data';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const marketingData = {
      marketing: {
        totalSpend: 1250.00,
        totalImpressions: 45000,
        totalClicks: 1440,
        averageROAS: 3.6,
        activeCampaigns: 4
      },
      campaigns: [
        { name: 'Holiday Sale', spend: 450, impressions: 18000, clicks: 576, roas: 4.2 },
        { name: 'New Product Launch', spend: 350, impressions: 12000, clicks: 384, roas: 3.8 },
        { name: 'Retargeting', spend: 250, impressions: 8000, clicks: 256, roas: 2.9 }
      ],
      lastUpdated: new Date().toISOString()
    };

    this.setCache(cacheKey, marketingData);
    return marketingData;
  }

  // Get comprehensive dashboard data
  async getDashboardData() {
    const cacheKey = 'dashboard_data';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const [salesData, inventoryData, marketingData] = await Promise.all([
      this.getSalesData(),
      this.getInventoryData(),
      this.getMarketingData()
    ]);

    const dashboardData = {
      ...salesData,
      ...inventoryData,
      ...marketingData,
      orders: {
        total: 342,
        processing: 12,
        shipped: 298,
        delivered: 315,
        returned: 8,
        lastUpdated: new Date().toISOString()
      },
      customers: {
        total: 1247,
        new: 23,
        returning: 89,
        retentionRate: 78.5
      },
      alerts: [
        ...inventoryData.alerts,
        { type: 'high_traffic', message: 'Unusual traffic spike detected', timestamp: new Date().toISOString() },
        { type: 'conversion_drop', message: 'Conversion rate below average', timestamp: new Date().toISOString() }
      ],
      lastUpdated: new Date().toISOString()
    };

    this.setCache(cacheKey, dashboardData);
    return dashboardData;
  }

  // Get specific metric data
  async getMetricData(metricType) {
    switch (metricType) {
      case 'revenue':
        return (await this.getSalesData()).revenue;
      case 'orders':
        return (await this.getDashboardData()).orders;
      case 'inventory':
        return (await this.getInventoryData()).products;
      case 'marketing':
        return (await this.getMarketingData()).marketing;
      default:
        return await this.getDashboardData();
    }
  }

  // Get real-time alerts
  async getRealTimeAlerts() {
    const dashboardData = await this.getDashboardData();
    return dashboardData.alerts || [];
  }

  // Cache management
  getFromCache(key) {
    const cached = this.dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.dataCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Clear cache
  clearCache(key = null) {
    if (key) {
      this.dataCache.delete(key);
    } else {
      this.dataCache.clear();
    }
  }

  // Simulate real-time data updates
  simulateRealTimeUpdate() {
    // This would typically connect to real APIs or webhooks
    // For now, just clear cache to force fresh data
    this.clearCache();
  }

  // Get data freshness info
  getDataFreshness() {
    const freshness = {};
    for (const [key, cached] of this.dataCache.entries()) {
      freshness[key] = {
        lastUpdated: new Date(cached.timestamp).toISOString(),
        ageMinutes: Math.floor((Date.now() - cached.timestamp) / (1000 * 60)),
        isStale: Date.now() - cached.timestamp > this.cacheExpiry
      };
    }
    return freshness;
  }
}

export default new RealTimeDataService();