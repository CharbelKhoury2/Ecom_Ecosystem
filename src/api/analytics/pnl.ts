import { supabase } from '../../lib/supabase';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const days = parseInt(url.searchParams.get('days') || '7');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate date ranges
    const currentPeriodStart = new Date();
    currentPeriodStart.setDate(currentPeriodStart.getDate() - days);
    
    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (days * 2));
    
    const previousPeriodEnd = new Date();
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - days);

    // Fetch current period Shopify data
    const { data: currentOrders, error: currentError } = await supabase
      .from('shopify_orders')
      .select('revenue, shipping_cost, refunds')
      .eq('user_id', userId)
      .gte('date_created', currentPeriodStart.toISOString());

    if (currentError) {
      throw currentError;
    }

    // Fetch previous period Shopify data
    const { data: previousOrders, error: previousError } = await supabase
      .from('shopify_orders')
      .select('revenue, shipping_cost, refunds')
      .eq('user_id', userId)
      .gte('date_created', previousPeriodStart.toISOString())
      .lt('date_created', previousPeriodEnd.toISOString());

    if (previousError) {
      throw previousError;
    }

    // Fetch current period Meta Ads data
    const { data: currentCampaigns, error: currentCampaignsError } = await supabase
      .from('meta_campaigns')
      .select('spend, revenue')
      .eq('user_id', userId)
      .gte('date', currentPeriodStart.toISOString().split('T')[0]);

    if (currentCampaignsError) {
      console.warn('Meta campaigns data not available:', currentCampaignsError);
    }

    // Fetch previous period Meta Ads data
    const { data: previousCampaigns, error: previousCampaignsError } = await supabase
      .from('meta_campaigns')
      .select('spend, revenue')
      .eq('user_id', userId)
      .gte('date', previousPeriodStart.toISOString().split('T')[0])
      .lt('date', previousPeriodEnd.toISOString().split('T')[0]);

    if (previousCampaignsError) {
      console.warn('Previous Meta campaigns data not available:', previousCampaignsError);
    }

    // Fetch product costs for COGS calculation
    const { data: products, error: productsError } = await supabase
      .from('shopify_products')
      .select('sku, cost_per_item')
      .eq('user_id', userId);

    if (productsError) {
      console.warn('Products data not available:', productsError);
    }

    // Calculate current metrics
    const currentRevenue = currentOrders.reduce((sum, order) => sum + (order.revenue || 0), 0);
    const currentShipping = currentOrders.reduce((sum, order) => sum + (order.shipping_cost || 0), 0);
    const currentRefunds = currentOrders.reduce((sum, order) => sum + (order.refunds || 0), 0);
    const currentAdSpend = (currentCampaigns || []).reduce((sum, campaign) => sum + (campaign.spend || 0), 0);

    // Calculate previous metrics
    const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.revenue || 0), 0);
    const previousShipping = previousOrders.reduce((sum, order) => sum + (order.shipping_cost || 0), 0);
    const previousRefunds = previousOrders.reduce((sum, order) => sum + (order.refunds || 0), 0);
    const previousAdSpend = (previousCampaigns || []).reduce((sum, campaign) => sum + (campaign.spend || 0), 0);

    // Calculate COGS from actual product costs
    const currentOrdersWithSku = await supabase
      .from('shopify_orders')
      .select('sku, quantity')
      .eq('user_id', userId)
      .gte('date_created', currentPeriodStart.toISOString())
      .not('sku', 'is', null);

    const previousOrdersWithSku = await supabase
      .from('shopify_orders')
      .select('sku, quantity')
      .eq('user_id', userId)
      .gte('date_created', previousPeriodStart.toISOString())
      .lt('date_created', previousPeriodEnd.toISOString())
      .not('sku', 'is', null);

    const calculateCogs = (orders: any[], products: any[]) => {
      return orders.reduce((sum, order) => {
        const product = products?.find(p => p.sku === order.sku);
        if (product && product.cost_per_item) {
          return sum + (order.quantity * product.cost_per_item);
        }
        return sum;
      }, 0);
    };

    const currentCogs = calculateCogs(currentOrdersWithSku.data || [], products || []);
    const previousCogs = calculateCogs(previousOrdersWithSku.data || [], products || []);

    // Calculate True P&L metrics
    const currentGrossProfit = currentRevenue - currentAdSpend - currentCogs - currentShipping;
    const previousGrossProfit = previousRevenue - previousAdSpend - previousCogs - previousShipping;

    const currentBlendedRoas = currentAdSpend > 0 ? currentRevenue / currentAdSpend : 0;
    const previousBlendedRoas = previousAdSpend > 0 ? previousRevenue / previousAdSpend : 0;

    const currentContributionMargin = currentRevenue > 0 ? (currentGrossProfit / currentRevenue) * 100 : 0;
    const previousContributionMargin = previousRevenue > 0 ? (previousGrossProfit / previousRevenue) * 100 : 0;

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const kpis = {
      revenue: {
        value: currentRevenue,
        previousValue: previousRevenue,
        change: calculateChange(currentRevenue, previousRevenue),
        changeType: currentRevenue >= previousRevenue ? 'increase' : 'decrease',
        format: 'currency',
      },
      adSpend: {
        value: currentAdSpend,
        previousValue: previousAdSpend,
        change: calculateChange(currentAdSpend, previousAdSpend),
        changeType: currentAdSpend >= previousAdSpend ? 'increase' : 'decrease',
        format: 'currency',
      },
      cogs: {
        value: currentCogs + currentShipping,
        previousValue: previousCogs + previousShipping,
        change: calculateChange(currentCogs + currentShipping, previousCogs + previousShipping),
        changeType: (currentCogs + currentShipping) >= (previousCogs + previousShipping) ? 'increase' : 'decrease',
        format: 'currency',
      },
      grossProfit: {
        value: currentGrossProfit,
        previousValue: previousGrossProfit,
        change: calculateChange(currentGrossProfit, previousGrossProfit),
        changeType: currentGrossProfit >= previousGrossProfit ? 'increase' : 'decrease',
        format: 'currency',
      },
      blendedRoas: {
        value: currentBlendedRoas,
        previousValue: previousBlendedRoas,
        change: calculateChange(currentBlendedRoas, previousBlendedRoas),
        changeType: currentBlendedRoas >= previousBlendedRoas ? 'increase' : 'decrease',
        format: 'number',
      },
      contributionMargin: {
        value: currentContributionMargin,
        previousValue: previousContributionMargin,
        change: calculateChange(currentContributionMargin, previousContributionMargin),
        changeType: currentContributionMargin >= previousContributionMargin ? 'increase' : 'decrease',
        format: 'percentage',
      },
    };

    return new Response(
      JSON.stringify({ kpis }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analytics P&L error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to calculate P&L metrics' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}