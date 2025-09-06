import { supabase } from '../lib/supabase';

export interface CopilotContext {
  workspace_id: string;
  timestamp: string;
  shopify: {
    revenue_last_7_days: number;
    revenue_yesterday: number;
    orders_last_7_days: number;
    top_skus: Array<{
      sku: string;
      revenue: number;
      qty: number;
      inventory_qty: number;
      cogs: number;
    }>;
    products_count: number;
  };
  meta_ads: {
    ad_spend_last_7_days: number;
    spend_yesterday: number;
    top_campaigns: Array<{
      id: string;
      name: string;
      spend: number;
      revenue: number;
      roas: number;
    }>;
  };
  alerts: Array<{
    id: string;
    type: string;
    sku: string;
    message: string;
    severity: string;
    status: string;
  }>;
  derived: {
    gross_profit_yesterday: number;
    blended_roas: number;
  };
}

/**
 * Builds comprehensive context data for the Copilot using optimized SQL aggregations
 * @param workspace_id - The workspace identifier
 * @returns Promise<CopilotContext> - Structured JSON context for Copilot
 */
export async function buildCopilotContext(workspace_id: string): Promise<CopilotContext> {
  try {
    // Calculate date ranges
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);
    
    const last7Days = new Date(now);
    last7Days.setDate(last7Days.getDate() - 7);
    last7Days.setHours(0, 0, 0, 0);

    // Parallel data fetching for performance
    const [
      shopifyData,
      metaAdsData,
      alertsData,
      productsCount
    ] = await Promise.all([
      fetchShopifyMetrics(workspace_id, yesterday, yesterdayEnd, last7Days),
      fetchMetaAdsMetrics(workspace_id, yesterday, yesterdayEnd, last7Days),
      fetchActiveAlerts(workspace_id),
      getProductsCount(workspace_id)
    ]);

    // Calculate derived metrics
    const gross_profit_yesterday = shopifyData.revenue_yesterday - metaAdsData.spend_yesterday;
    const blended_roas = metaAdsData.ad_spend_last_7_days > 0 
      ? shopifyData.revenue_last_7_days / metaAdsData.ad_spend_last_7_days 
      : 0;

    return {
      workspace_id,
      timestamp: now.toISOString(),
      shopify: {
        ...shopifyData,
        products_count: productsCount
      },
      meta_ads: metaAdsData,
      alerts: alertsData,
      derived: {
        gross_profit_yesterday,
        blended_roas
      }
    };
  } catch (error) {
    console.error('Error building copilot context:', error);
    // Return empty context structure on error
    return {
      workspace_id,
      timestamp: new Date().toISOString(),
      shopify: {
        revenue_last_7_days: 0,
        revenue_yesterday: 0,
        orders_last_7_days: 0,
        top_skus: [],
        products_count: 0
      },
      meta_ads: {
        ad_spend_last_7_days: 0,
        spend_yesterday: 0,
        top_campaigns: []
      },
      alerts: [],
      derived: {
        gross_profit_yesterday: 0,
        blended_roas: 0
      }
    };
  }
}

/**
 * Fetch Shopify metrics using optimized SQL aggregations
 */
async function fetchShopifyMetrics(
  workspace_id: string, 
  yesterday: Date, 
  yesterdayEnd: Date, 
  last7Days: Date
) {
  // Get revenue metrics with aggregation
  const { data: revenueData } = await supabase
    .from('shopify_orders')
    .select('revenue, date_created, sku, quantity')
    .eq('workspace_id', workspace_id)
    .gte('date_created', last7Days.toISOString());

  const revenue_last_7_days = revenueData?.reduce((sum, order) => sum + (order.revenue || 0), 0) || 0;
  const orders_last_7_days = revenueData?.length || 0;
  
  const revenue_yesterday = revenueData
    ?.filter(order => {
      const orderDate = new Date(order.date_created);
      return orderDate >= yesterday && orderDate <= yesterdayEnd;
    })
    .reduce((sum, order) => sum + (order.revenue || 0), 0) || 0;

  // Get top SKUs with product details
  const { data: products } = await supabase
    .from('shopify_products')
    .select('sku, inventory_quantity, cogs, price')
    .eq('workspace_id', workspace_id);

  // Calculate top SKUs from orders
  const skuMap = new Map();
  revenueData?.forEach(order => {
    if (order.sku) {
      if (!skuMap.has(order.sku)) {
        const product = products?.find(p => p.sku === order.sku);
        skuMap.set(order.sku, {
          sku: order.sku,
          revenue: 0,
          qty: 0,
          inventory_qty: product?.inventory_quantity || 0,
          cogs: product?.cogs || 0
        });
      }
      const skuData = skuMap.get(order.sku);
      skuData.revenue += order.revenue || 0;
      skuData.qty += order.quantity || 1;
    }
  });

  const top_skus = Array.from(skuMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    revenue_last_7_days,
    revenue_yesterday,
    orders_last_7_days,
    top_skus
  };
}

/**
 * Fetch Meta Ads metrics using optimized SQL aggregations
 */
async function fetchMetaAdsMetrics(
  workspace_id: string,
  yesterday: Date,
  yesterdayEnd: Date,
  last7Days: Date
) {
  // Get campaign data
  const { data: campaignData } = await supabase
    .from('meta_campaigns')
    .select('campaign_id, campaign_name, spend, revenue, date')
    .eq('workspace_id', workspace_id)
    .gte('date', last7Days.toISOString().split('T')[0]);

  const ad_spend_last_7_days = campaignData?.reduce((sum, campaign) => sum + (campaign.spend || 0), 0) || 0;
  
  const spend_yesterday = campaignData
    ?.filter(campaign => campaign.date === yesterday.toISOString().split('T')[0])
    .reduce((sum, campaign) => sum + (campaign.spend || 0), 0) || 0;

  // Calculate top campaigns
  const campaignMap = new Map();
  campaignData?.forEach(campaign => {
    if (!campaignMap.has(campaign.campaign_id)) {
      campaignMap.set(campaign.campaign_id, {
        id: campaign.campaign_id,
        name: campaign.campaign_name,
        spend: 0,
        revenue: 0
      });
    }
    const camp = campaignMap.get(campaign.campaign_id);
    camp.spend += campaign.spend || 0;
    camp.revenue += campaign.revenue || 0;
  });

  const top_campaigns = Array.from(campaignMap.values())
    .map(campaign => ({
      ...campaign,
      roas: campaign.spend > 0 ? campaign.revenue / campaign.spend : 0
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  return {
    ad_spend_last_7_days,
    spend_yesterday,
    top_campaigns
  };
}

/**
 * Fetch active alerts
 */
async function fetchActiveAlerts(workspace_id: string) {
  const { data: alerts } = await supabase
    .from('alerts')
    .select('id, type, sku, message, severity, status')
    .eq('workspace_id', workspace_id)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(10);

  return alerts || [];
}

/**
 * Get total products count
 */
async function getProductsCount(workspace_id: string): Promise<number> {
  const { count } = await supabase
    .from('shopify_products')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspace_id);

  return count || 0;
}