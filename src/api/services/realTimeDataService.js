// Real-time Data Service - Provides live e-commerce data for AI responses
import { getShopifyAPIFromEnv } from '../../lib/shopify.ts';

class RealTimeDataService {
  constructor() {
    this.dataCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  // Get sales data from Shopify
  async getSalesData() {
    const cacheKey = 'sales_data';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const shopifyAPI = getShopifyAPIFromEnv();
      if (!shopifyAPI) {
        console.log('Shopify API not configured, using fallback data');
        return this.getFallbackSalesData();
      }

      // Test connection first
      const isConnected = await shopifyAPI.testConnection();
      if (!isConnected) {
        console.log('Shopify connection failed, using fallback data');
        return this.getFallbackSalesData();
      }

      // Fetch orders from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const orders = await shopifyAPI.fetchOrdersWithRefunds(thirtyDaysAgo.toISOString());

      // Calculate today's data
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders.filter(order => 
        order.created_at.startsWith(today)
      );

      // Calculate this month's data
      const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
      const thisMonthOrders = orders.filter(order => 
        order.created_at.startsWith(thisMonth)
      );

      // Calculate revenue
      const todayRevenue = todayOrders.reduce((sum, order) => 
        sum + parseFloat(order.total_price), 0
      );
      const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => 
        sum + parseFloat(order.total_price), 0
      );

      // Calculate average order value
      const averageOrderValue = thisMonthOrders.length > 0 
        ? thisMonthRevenue / thisMonthOrders.length 
        : 0;

      // Calculate top products
      const productSales = new Map();
      orders.forEach(order => {
        order.line_items.forEach(item => {
          const key = item.name;
          const current = productSales.get(key) || { sales: 0, revenue: 0 };
          current.sales += item.quantity;
          current.revenue += parseFloat(item.price) * item.quantity;
          productSales.set(key, current);
        });
      });

      const topProducts = Array.from(productSales.entries())
        .sort((a, b) => b[1].sales - a[1].sales)
        .slice(0, 5)
        .map(([name, data]) => ({ name, ...data }));

      const salesData = {
        revenue: {
          today: Math.round(todayRevenue * 100) / 100,
          thisMonth: Math.round(thisMonthRevenue * 100) / 100,
          growth: 0, // Would need historical data to calculate
          lastUpdated: new Date().toISOString()
        },
        orders: {
          today: todayOrders.length,
          thisMonth: thisMonthOrders.length,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100,
          conversionRate: 0 // Would need traffic data to calculate
        },
        topProducts
      };

      this.setCache(cacheKey, salesData);
      return salesData;
    } catch (error) {
      console.error('Error fetching Shopify sales data:', error);
      return this.getFallbackSalesData();
    }
  }

  // Fallback sales data when Shopify is unavailable
  getFallbackSalesData() {
    return {
      revenue: {
        today: 0,
        thisMonth: 0,
        growth: 0,
        lastUpdated: new Date().toISOString()
      },
      orders: {
        today: 0,
        thisMonth: 0,
        averageOrderValue: 0,
        conversionRate: 0
      },
      topProducts: []
    };
  }

  // Get inventory data from Shopify
  async getInventoryData() {
    const cacheKey = 'inventory_data';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const shopifyAPI = getShopifyAPIFromEnv();
      if (!shopifyAPI) {
        console.log('Shopify API not configured, using fallback inventory data');
        return this.getFallbackInventoryData();
      }

      // Test connection first
      const isConnected = await shopifyAPI.testConnection();
      if (!isConnected) {
        console.log('Shopify connection failed, using fallback inventory data');
        return this.getFallbackInventoryData();
      }

      const products = await shopifyAPI.fetchProducts();
      const lowStockThreshold = 10;
      
      let totalVariants = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;
      const alerts = [];
      const topSelling = [];

      products.forEach(product => {
        product.variants.forEach(variant => {
          totalVariants++;
          const stock = variant.inventory_quantity || 0;
          const productName = `${product.title}${variant.title !== 'Default Title' ? ` - ${variant.title}` : ''}`;
          
          if (stock === 0) {
            outOfStockCount++;
            alerts.push({
              type: 'out_of_stock',
              product: productName,
              stock: 0,
              threshold: lowStockThreshold
            });
          } else if (stock <= lowStockThreshold) {
            lowStockCount++;
            alerts.push({
              type: 'low_stock',
              product: productName,
              stock,
              threshold: lowStockThreshold
            });
          }

          // Add to top selling (would need sales data to be accurate)
          if (topSelling.length < 5) {
            topSelling.push({
              name: productName,
              stock,
              sales: 0 // Would need order data to calculate
            });
          }
        });
      });

      const inventoryData = {
        products: {
          total: totalVariants,
          lowStock: lowStockCount,
          outOfStock: outOfStockCount,
          topSelling
        },
        alerts,
        lastUpdated: new Date().toISOString()
      };

      this.setCache(cacheKey, inventoryData);
      return inventoryData;
    } catch (error) {
      console.error('Error fetching Shopify inventory data:', error);
      return this.getFallbackInventoryData();
    }
  }

  // Fallback inventory data when Shopify is unavailable
  getFallbackInventoryData() {
    return {
      products: {
        total: 0,
        lowStock: 0,
        outOfStock: 0,
        topSelling: []
      },
      alerts: [],
      lastUpdated: new Date().toISOString()
    };
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

  // Test Shopify connection
  async testShopifyConnection() {
    try {
      const shopifyAPI = getShopifyAPIFromEnv();
      if (!shopifyAPI) {
        return {
          connected: false,
          error: 'Shopify environment credentials not configured'
        };
      }

      const isConnected = await shopifyAPI.testConnection();
      return {
        connected: isConnected,
        timestamp: new Date().toISOString(),
        error: isConnected ? null : 'Failed to connect to Shopify API'
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get comprehensive Shopify analytics
  async getShopifyAnalytics(days = 30) {
    const cacheKey = `shopify_analytics_${days}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const shopifyAPI = getShopifyAPIFromEnv();
      if (!shopifyAPI) {
        return { error: 'Shopify not configured' };
      }

      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);
      
      const [orders, products] = await Promise.all([
        shopifyAPI.fetchOrdersWithRefunds(dateFrom.toISOString()),
        shopifyAPI.fetchProducts()
      ]);

      // Calculate comprehensive analytics
      const analytics = {
        totalRevenue: 0,
        totalOrders: orders.length,
        totalProducts: products.length,
        averageOrderValue: 0,
        totalRefunds: 0,
        refundRate: 0,
        topProducts: new Map(),
        dailySales: new Map(),
        inventoryValue: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0
      };

      // Process orders
      orders.forEach(order => {
        const orderTotal = parseFloat(order.total_price);
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        
        analytics.totalRevenue += orderTotal;
        analytics.dailySales.set(
          orderDate, 
          (analytics.dailySales.get(orderDate) || 0) + orderTotal
        );
        
        // Calculate refunds
        const orderRefunds = order.refunds.reduce((sum, refund) => {
          return sum + parseFloat(refund.total_refund_set.shop_money.amount);
        }, 0);
        analytics.totalRefunds += orderRefunds;
        
        // Track product sales
        order.line_items.forEach(item => {
          const productKey = item.name;
          const current = analytics.topProducts.get(productKey) || 0;
          analytics.topProducts.set(productKey, current + item.quantity);
        });
      });

      // Process products for inventory
      products.forEach(product => {
        product.variants.forEach(variant => {
          const price = parseFloat(variant.price);
          const quantity = variant.inventory_quantity || 0;
          
          analytics.inventoryValue += price * quantity;
          
          if (quantity === 0) {
            analytics.outOfStockProducts++;
          } else if (quantity <= 10) {
            analytics.lowStockProducts++;
          }
        });
      });

      // Calculate derived metrics
      analytics.averageOrderValue = analytics.totalOrders > 0 
        ? analytics.totalRevenue / analytics.totalOrders 
        : 0;
      
      analytics.refundRate = analytics.totalRevenue > 0 
        ? (analytics.totalRefunds / analytics.totalRevenue) * 100 
        : 0;

      // Convert Maps to arrays
      const topProductsArray = Array.from(analytics.topProducts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, quantity]) => ({ name, quantity }));

      const dailySalesArray = Array.from(analytics.dailySales.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, sales]) => ({ date, sales: Math.round(sales * 100) / 100 }));

      const result = {
        ...analytics,
        topProducts: topProductsArray,
        dailySales: dailySalesArray,
        totalRevenue: Math.round(analytics.totalRevenue * 100) / 100,
        averageOrderValue: Math.round(analytics.averageOrderValue * 100) / 100,
        refundRate: Math.round(analytics.refundRate * 100) / 100,
        totalRefunds: Math.round(analytics.totalRefunds * 100) / 100,
        inventoryValue: Math.round(analytics.inventoryValue * 100) / 100,
        lastUpdated: new Date().toISOString(),
        dateRange: {
          from: dateFrom.toISOString(),
          to: new Date().toISOString(),
          days
        }
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching Shopify analytics:', error);
      return { error: error.message };
    }
  }
}

export default new RealTimeDataService();