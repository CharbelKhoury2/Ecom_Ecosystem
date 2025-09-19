import { createClient } from '@supabase/supabase-js';

interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  returnOnAdSpend: number;
  grossMargin: number;
  netProfit: number;
  refundRate: number;
  period: string;
  previousPeriod?: SalesMetrics;
  growth?: {
    revenue: number;
    orders: number;
    aov: number;
    conversionRate: number;
  };
}

interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  churnRate: number;
  averageSessionDuration: number;
  pageViewsPerSession: number;
  bounceRate: number;
  topCustomerSegments: CustomerSegment[];
  customerSatisfactionScore: number;
}

interface CustomerSegment {
  id: string;
  name: string;
  criteria: Record<string, any>;
  customerCount: number;
  averageOrderValue: number;
  totalRevenue: number;
  conversionRate: number;
  retentionRate: number;
}

interface ProductMetrics {
  topSellingProducts: ProductPerformance[];
  categoryPerformance: CategoryPerformance[];
  inventoryTurnover: number;
  stockoutRate: number;
  averageInventoryValue: number;
  slowMovingProducts: ProductPerformance[];
  profitMarginByProduct: ProductProfitability[];
}

interface ProductPerformance {
  productId: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  profit: number;
  margin: number;
  conversionRate: number;
  viewsToSales: number;
  averageRating: number;
  reviewCount: number;
  returnRate: number;
}

interface CategoryPerformance {
  categoryId: string;
  name: string;
  revenue: number;
  units: number;
  profit: number;
  margin: number;
  growth: number;
  marketShare: number;
}

interface ProductProfitability {
  productId: string;
  name: string;
  costOfGoods: number;
  sellingPrice: number;
  grossMargin: number;
  netMargin: number;
  unitsSold: number;
  totalProfit: number;
}

interface MarketingMetrics {
  trafficSources: TrafficSource[];
  campaignPerformance: CampaignPerformance[];
  customerAcquisitionByChannel: ChannelAcquisition[];
  emailMarketingMetrics: EmailMetrics;
  socialMediaMetrics: SocialMetrics;
  seoMetrics: SEOMetrics;
  paidAdvertisingMetrics: PaidAdMetrics;
}

interface TrafficSource {
  source: string;
  visitors: number;
  sessions: number;
  pageViews: number;
  bounceRate: number;
  averageSessionDuration: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
}

interface CampaignPerformance {
  campaignId: string;
  name: string;
  type: 'email' | 'social' | 'ppc' | 'display' | 'affiliate';
  impressions: number;
  clicks: number;
  clickThroughRate: number;
  conversions: number;
  conversionRate: number;
  cost: number;
  revenue: number;
  returnOnAdSpend: number;
  customerAcquisitionCost: number;
}

interface ChannelAcquisition {
  channel: string;
  newCustomers: number;
  cost: number;
  costPerAcquisition: number;
  lifetimeValue: number;
  returnOnInvestment: number;
}

interface EmailMetrics {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  conversionRate: number;
  revenue: number;
  listGrowthRate: number;
}

interface SocialMetrics {
  followers: number;
  engagement: number;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  socialRevenue: number;
}

interface SEOMetrics {
  organicTraffic: number;
  keywordRankings: KeywordRanking[];
  backlinks: number;
  domainAuthority: number;
  organicConversions: number;
  organicRevenue: number;
}

interface KeywordRanking {
  keyword: string;
  position: number;
  searchVolume: number;
  difficulty: number;
  traffic: number;
}

interface PaidAdMetrics {
  totalSpend: number;
  impressions: number;
  clicks: number;
  clickThroughRate: number;
  costPerClick: number;
  conversions: number;
  costPerConversion: number;
  returnOnAdSpend: number;
}

interface RealTimeData {
  activeUsers: number;
  currentSessions: number;
  liveOrders: Order[];
  recentTransactions: Transaction[];
  topPages: PageView[];
  alertsAndNotifications: Alert[];
  systemHealth: SystemHealth;
}

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  total: number;
  status: string;
  timestamp: string;
  items: OrderItem[];
}

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Transaction {
  id: string;
  type: 'sale' | 'refund' | 'chargeback';
  amount: number;
  customerId: string;
  timestamp: string;
  status: string;
}

interface PageView {
  page: string;
  views: number;
  uniqueViews: number;
  averageTimeOnPage: number;
  bounceRate: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
}

interface SystemHealth {
  apiResponseTime: number;
  databaseResponseTime: number;
  errorRate: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface PredictiveAnalytics {
  salesForecast: SalesForecast[];
  customerChurnPrediction: ChurnPrediction[];
  inventoryDemandForecast: InventoryForecast[];
  seasonalTrends: SeasonalTrend[];
  marketTrends: MarketTrend[];
  recommendedActions: RecommendedAction[];
}

interface SalesForecast {
  period: string;
  predictedRevenue: number;
  predictedOrders: number;
  confidence: number;
  factors: string[];
}

interface ChurnPrediction {
  customerId: string;
  churnProbability: number;
  riskFactors: string[];
  recommendedActions: string[];
  estimatedLostRevenue: number;
}

interface InventoryForecast {
  productId: string;
  name: string;
  currentStock: number;
  predictedDemand: number;
  recommendedReorderPoint: number;
  recommendedOrderQuantity: number;
  stockoutRisk: number;
}

interface SeasonalTrend {
  period: string;
  category: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  magnitude: number;
  confidence: number;
}

interface MarketTrend {
  trend: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  timeframe: string;
  description: string;
}

interface RecommendedAction {
  id: string;
  type: 'marketing' | 'inventory' | 'pricing' | 'customer_service';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  expectedImpact: string;
  estimatedROI: number;
  timeToImplement: string;
}

class RealTimeAnalyticsService {
  private supabase;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private realTimeChannel: any;

  constructor() {
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    this.initializeRealTimeSubscriptions();
  }

  // Initialize real-time subscriptions
  private initializeRealTimeSubscriptions() {
    this.realTimeChannel = this.supabase
      .channel('analytics')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => this.handleOrderUpdate(payload)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => this.handleTransactionUpdate(payload)
      )
      .subscribe();
  }

  // Cache management
  private setCache(key: string, data: any, ttl: number = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // Event handlers
  private handleOrderUpdate(payload: any) {
    this.invalidateCache(['sales-metrics', 'real-time-data']);
    this.notifySubscribers('orders', payload);
  }

  private handleTransactionUpdate(payload: any) {
    this.invalidateCache(['sales-metrics', 'real-time-data']);
    this.notifySubscribers('transactions', payload);
  }

  private invalidateCache(keys: string[]) {
    keys.forEach(key => this.cache.delete(key));
  }

  private notifySubscribers(event: string, data: any) {
    const subscribers = this.subscribers.get(event);
    if (subscribers) {
      subscribers.forEach(callback => callback(data));
    }
  }

  // Subscription management
  subscribe(event: string, callback: (data: any) => void) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);
    
    return () => {
      this.subscribers.get(event)?.delete(callback);
    };
  }

  // Sales Analytics
  async getSalesMetrics(timeRange: string = '30d', compareWithPrevious: boolean = true): Promise<SalesMetrics> {
    const cacheKey = `sales-metrics-${timeRange}-${compareWithPrevious}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { startDate, endDate } = this.getDateRange(timeRange);
      
      // Get current period data
      const { data: orders } = await this.supabase
        .from('orders')
        .select(`
          id,
          total,
          status,
          created_at,
          customer_id,
          order_items (
            quantity,
            price,
            product_id
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed');

      const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get website analytics data (mock for now)
      const totalSessions = 10000; // This would come from analytics service
      const conversionRate = totalOrders > 0 ? (totalOrders / totalSessions) * 100 : 0;

      // Calculate other metrics
      const customerAcquisitionCost = 50; // Mock value
      const customerLifetimeValue = 300; // Mock value
      const returnOnAdSpend = 4.5; // Mock value
      const grossMargin = totalRevenue * 0.4; // 40% margin
      const netProfit = grossMargin - (totalOrders * 10); // Mock operating costs
      const refundRate = 2.5; // Mock value

      let previousPeriod: SalesMetrics | undefined;
      let growth: SalesMetrics['growth'] | undefined;

      if (compareWithPrevious) {
        const { startDate: prevStart, endDate: prevEnd } = this.getPreviousDateRange(timeRange);
        previousPeriod = await this.getSalesMetrics(
          `${prevStart.toISOString()}_${prevEnd.toISOString()}`,
          false
        );
        
        if (previousPeriod) {
          growth = {
            revenue: this.calculateGrowthRate(totalRevenue, previousPeriod.totalRevenue),
            orders: this.calculateGrowthRate(totalOrders, previousPeriod.totalOrders),
            aov: this.calculateGrowthRate(averageOrderValue, previousPeriod.averageOrderValue),
            conversionRate: this.calculateGrowthRate(conversionRate, previousPeriod.conversionRate)
          };
        }
      }

      const metrics: SalesMetrics = {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        conversionRate,
        customerAcquisitionCost,
        customerLifetimeValue,
        returnOnAdSpend,
        grossMargin,
        netProfit,
        refundRate,
        period: timeRange,
        previousPeriod,
        growth
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Failed to get sales metrics:', error);
      throw error;
    }
  }

  // Customer Analytics
  async getCustomerMetrics(timeRange: string = '30d'): Promise<CustomerMetrics> {
    const cacheKey = `customer-metrics-${timeRange}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { startDate, endDate } = this.getDateRange(timeRange);
      
      // Get customer data
      const { data: customers } = await this.supabase
        .from('users')
        .select('id, created_at, last_login_at');

      const totalCustomers = customers?.length || 0;
      const newCustomers = customers?.filter(c => 
        new Date(c.created_at) >= startDate && new Date(c.created_at) <= endDate
      ).length || 0;
      const returningCustomers = totalCustomers - newCustomers;

      // Mock additional metrics
      const customerRetentionRate = 75;
      const churnRate = 25;
      const averageSessionDuration = 180; // seconds
      const pageViewsPerSession = 5.2;
      const bounceRate = 35;
      const customerSatisfactionScore = 4.2;

      // Mock customer segments
      const topCustomerSegments: CustomerSegment[] = [
        {
          id: '1',
          name: 'High Value Customers',
          criteria: { totalSpent: { $gte: 1000 } },
          customerCount: 150,
          averageOrderValue: 250,
          totalRevenue: 37500,
          conversionRate: 8.5,
          retentionRate: 90
        },
        {
          id: '2',
          name: 'Frequent Buyers',
          criteria: { orderCount: { $gte: 5 } },
          customerCount: 300,
          averageOrderValue: 120,
          totalRevenue: 36000,
          conversionRate: 6.2,
          retentionRate: 85
        }
      ];

      const metrics: CustomerMetrics = {
        totalCustomers,
        newCustomers,
        returningCustomers,
        customerRetentionRate,
        churnRate,
        averageSessionDuration,
        pageViewsPerSession,
        bounceRate,
        topCustomerSegments,
        customerSatisfactionScore
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Failed to get customer metrics:', error);
      throw error;
    }
  }

  // Product Analytics
  async getProductMetrics(timeRange: string = '30d'): Promise<ProductMetrics> {
    const cacheKey = `product-metrics-${timeRange}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      // Mock product performance data
      const topSellingProducts: ProductPerformance[] = [
        {
          productId: '1',
          name: 'Premium Wireless Headphones',
          category: 'Electronics',
          unitsSold: 150,
          revenue: 44997,
          profit: 13499,
          margin: 30,
          conversionRate: 5.2,
          viewsToSales: 0.052,
          averageRating: 4.8,
          reviewCount: 124,
          returnRate: 2.1
        },
        {
          productId: '2',
          name: 'Smart Fitness Watch',
          category: 'Electronics',
          unitsSold: 200,
          revenue: 39998,
          profit: 11999,
          margin: 30,
          conversionRate: 4.8,
          viewsToSales: 0.048,
          averageRating: 4.6,
          reviewCount: 89,
          returnRate: 1.8
        }
      ];

      const categoryPerformance: CategoryPerformance[] = [
        {
          categoryId: '1',
          name: 'Electronics',
          revenue: 84995,
          units: 350,
          profit: 25498,
          margin: 30,
          growth: 15.2,
          marketShare: 45
        },
        {
          categoryId: '2',
          name: 'Clothing',
          revenue: 25000,
          units: 500,
          profit: 7500,
          margin: 30,
          growth: 8.7,
          marketShare: 25
        }
      ];

      const profitMarginByProduct: ProductProfitability[] = topSellingProducts.map(p => ({
        productId: p.productId,
        name: p.name,
        costOfGoods: p.revenue * 0.7,
        sellingPrice: p.revenue / p.unitsSold,
        grossMargin: p.margin,
        netMargin: p.margin - 5, // Account for overhead
        unitsSold: p.unitsSold,
        totalProfit: p.profit
      }));

      const metrics: ProductMetrics = {
        topSellingProducts,
        categoryPerformance,
        inventoryTurnover: 6.5,
        stockoutRate: 3.2,
        averageInventoryValue: 150000,
        slowMovingProducts: [],
        profitMarginByProduct
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Failed to get product metrics:', error);
      throw error;
    }
  }

  // Marketing Analytics
  async getMarketingMetrics(timeRange: string = '30d'): Promise<MarketingMetrics> {
    const cacheKey = `marketing-metrics-${timeRange}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      // Mock marketing data
      const trafficSources: TrafficSource[] = [
        {
          source: 'Organic Search',
          visitors: 5000,
          sessions: 6000,
          pageViews: 18000,
          bounceRate: 35,
          averageSessionDuration: 180,
          conversions: 300,
          conversionRate: 5,
          revenue: 45000
        },
        {
          source: 'Paid Search',
          visitors: 2000,
          sessions: 2500,
          pageViews: 7500,
          bounceRate: 45,
          averageSessionDuration: 150,
          conversions: 200,
          conversionRate: 8,
          revenue: 35000
        }
      ];

      const campaignPerformance: CampaignPerformance[] = [
        {
          campaignId: '1',
          name: 'Summer Sale 2024',
          type: 'email',
          impressions: 50000,
          clicks: 2500,
          clickThroughRate: 5,
          conversions: 125,
          conversionRate: 5,
          cost: 1000,
          revenue: 18750,
          returnOnAdSpend: 18.75,
          customerAcquisitionCost: 8
        }
      ];

      const customerAcquisitionByChannel: ChannelAcquisition[] = [
        {
          channel: 'Organic Search',
          newCustomers: 150,
          cost: 0,
          costPerAcquisition: 0,
          lifetimeValue: 300,
          returnOnInvestment: Infinity
        },
        {
          channel: 'Paid Search',
          newCustomers: 100,
          cost: 5000,
          costPerAcquisition: 50,
          lifetimeValue: 300,
          returnOnInvestment: 6
        }
      ];

      const emailMarketingMetrics: EmailMetrics = {
        totalSent: 10000,
        deliveryRate: 98.5,
        openRate: 25.2,
        clickRate: 3.8,
        unsubscribeRate: 0.5,
        conversionRate: 2.1,
        revenue: 15000,
        listGrowthRate: 5.2
      };

      const socialMediaMetrics: SocialMetrics = {
        followers: 25000,
        engagement: 4.2,
        reach: 100000,
        impressions: 250000,
        clicks: 5000,
        conversions: 150,
        socialRevenue: 12000
      };

      const seoMetrics: SEOMetrics = {
        organicTraffic: 5000,
        keywordRankings: [
          {
            keyword: 'wireless headphones',
            position: 3,
            searchVolume: 10000,
            difficulty: 65,
            traffic: 800
          }
        ],
        backlinks: 150,
        domainAuthority: 45,
        organicConversions: 300,
        organicRevenue: 45000
      };

      const paidAdvertisingMetrics: PaidAdMetrics = {
        totalSpend: 8000,
        impressions: 500000,
        clicks: 10000,
        clickThroughRate: 2,
        costPerClick: 0.8,
        conversions: 400,
        costPerConversion: 20,
        returnOnAdSpend: 4.5
      };

      const metrics: MarketingMetrics = {
        trafficSources,
        campaignPerformance,
        customerAcquisitionByChannel,
        emailMarketingMetrics,
        socialMediaMetrics,
        seoMetrics,
        paidAdvertisingMetrics
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Failed to get marketing metrics:', error);
      throw error;
    }
  }

  // Real-time Data
  async getRealTimeData(): Promise<RealTimeData> {
    const cacheKey = 'real-time-data';
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      // Get recent orders
      const { data: recentOrders } = await this.supabase
        .from('orders')
        .select(`
          id,
          customer_id,
          total,
          status,
          created_at,
          users!customer_id(name),
          order_items(
            product_id,
            quantity,
            price,
            products(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      const liveOrders: Order[] = recentOrders?.map(order => ({
        id: order.id,
        customerId: order.customer_id,
        customerName: order.users?.name || 'Unknown',
        total: order.total,
        status: order.status,
        timestamp: order.created_at,
        items: order.order_items?.map((item: any) => ({
          productId: item.product_id,
          name: item.products?.name || 'Unknown Product',
          quantity: item.quantity,
          price: item.price
        })) || []
      })) || [];

      // Mock real-time data
      const data: RealTimeData = {
        activeUsers: 245,
        currentSessions: 189,
        liveOrders,
        recentTransactions: [
          {
            id: '1',
            type: 'sale',
            amount: 299.99,
            customerId: 'cust-1',
            timestamp: new Date().toISOString(),
            status: 'completed'
          }
        ],
        topPages: [
          {
            page: '/products',
            views: 1250,
            uniqueViews: 980,
            averageTimeOnPage: 120,
            bounceRate: 25
          },
          {
            page: '/checkout',
            views: 450,
            uniqueViews: 420,
            averageTimeOnPage: 300,
            bounceRate: 15
          }
        ],
        alertsAndNotifications: [
          {
            id: '1',
            type: 'warning',
            title: 'Low Stock Alert',
            message: 'Product "Wireless Headphones" is running low on stock',
            timestamp: new Date().toISOString(),
            severity: 'medium',
            acknowledged: false
          }
        ],
        systemHealth: {
          apiResponseTime: 120,
          databaseResponseTime: 45,
          errorRate: 0.1,
          uptime: 99.9,
          memoryUsage: 65,
          cpuUsage: 35
        }
      };

      this.setCache(cacheKey, data, 30000); // 30 seconds cache
      return data;
    } catch (error) {
      console.error('Failed to get real-time data:', error);
      throw error;
    }
  }

  // Predictive Analytics
  async getPredictiveAnalytics(): Promise<PredictiveAnalytics> {
    const cacheKey = 'predictive-analytics';
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      // Mock predictive analytics data
      const analytics: PredictiveAnalytics = {
        salesForecast: [
          {
            period: 'Next 7 days',
            predictedRevenue: 85000,
            predictedOrders: 340,
            confidence: 85,
            factors: ['Historical trends', 'Seasonal patterns', 'Marketing campaigns']
          },
          {
            period: 'Next 30 days',
            predictedRevenue: 320000,
            predictedOrders: 1280,
            confidence: 78,
            factors: ['Historical trends', 'Market conditions', 'Inventory levels']
          }
        ],
        customerChurnPrediction: [
          {
            customerId: 'cust-123',
            churnProbability: 75,
            riskFactors: ['Decreased engagement', 'No recent purchases', 'Support tickets'],
            recommendedActions: ['Send personalized offer', 'Reach out via email', 'Provide customer support'],
            estimatedLostRevenue: 500
          }
        ],
        inventoryDemandForecast: [
          {
            productId: 'prod-1',
            name: 'Wireless Headphones',
            currentStock: 50,
            predictedDemand: 80,
            recommendedReorderPoint: 30,
            recommendedOrderQuantity: 100,
            stockoutRisk: 25
          }
        ],
        seasonalTrends: [
          {
            period: 'Q4 2024',
            category: 'Electronics',
            trend: 'increasing',
            magnitude: 35,
            confidence: 90
          }
        ],
        marketTrends: [
          {
            trend: 'Sustainable products gaining popularity',
            impact: 'positive',
            confidence: 80,
            timeframe: '6-12 months',
            description: 'Consumers increasingly prefer eco-friendly products'
          }
        ],
        recommendedActions: [
          {
            id: '1',
            type: 'inventory',
            priority: 'high',
            title: 'Restock Popular Items',
            description: 'Several best-selling products are running low on inventory',
            expectedImpact: 'Prevent stockouts and maintain sales momentum',
            estimatedROI: 250,
            timeToImplement: '1-2 days'
          },
          {
            id: '2',
            type: 'marketing',
            priority: 'medium',
            title: 'Launch Retargeting Campaign',
            description: 'Target customers who abandoned their carts in the last 7 days',
            expectedImpact: 'Recover 15-20% of abandoned cart revenue',
            estimatedROI: 400,
            timeToImplement: '1 day'
          }
        ]
      };

      this.setCache(cacheKey, analytics, 3600000); // 1 hour cache
      return analytics;
    } catch (error) {
      console.error('Failed to get predictive analytics:', error);
      throw error;
    }
  }

  // Helper methods
  private getDateRange(timeRange: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        // Custom date range
        if (timeRange.includes('_')) {
          const [start, end] = timeRange.split('_');
          return {
            startDate: new Date(start),
            endDate: new Date(end)
          };
        }
        startDate.setDate(endDate.getDate() - 30);
    }

    return { startDate, endDate };
  }

  private getPreviousDateRange(timeRange: string): { startDate: Date; endDate: Date } {
    const { startDate, endDate } = this.getDateRange(timeRange);
    const duration = endDate.getTime() - startDate.getTime();
    
    return {
      startDate: new Date(startDate.getTime() - duration),
      endDate: new Date(startDate.getTime())
    };
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  // Cleanup
  destroy() {
    if (this.realTimeChannel) {
      this.supabase.removeChannel(this.realTimeChannel);
    }
    this.cache.clear();
    this.subscribers.clear();
  }
}

export default RealTimeAnalyticsService;
export type {
  SalesMetrics,
  CustomerMetrics,
  ProductMetrics,
  MarketingMetrics,
  RealTimeData,
  PredictiveAnalytics,
  ProductPerformance,
  CategoryPerformance,
  CustomerSegment,
  TrafficSource,
  CampaignPerformance
};