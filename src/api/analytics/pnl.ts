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

    // Fetch current period data
    const { data: currentOrders, error: currentError } = await supabase
      .from('shopify_orders')
      .select('revenue, shipping_cost, refunds')
      .eq('user_id', userId)
      .gte('date_created', currentPeriodStart.toISOString());

    if (currentError) {
      throw currentError;
    }

    // Fetch previous period data
    const { data: previousOrders, error: previousError } = await supabase
      .from('shopify_orders')
      .select('revenue, shipping_cost, refunds')
      .eq('user_id', userId)
      .gte('date_created', previousPeriodStart.toISOString())
      .lt('date_created', previousPeriodEnd.toISOString());

    if (previousError) {
      throw previousError;
    }

    // Calculate current metrics
    const currentRevenue = currentOrders.reduce((sum, order) => sum + (order.revenue || 0), 0);
    const currentShipping = currentOrders.reduce((sum, order) => sum + (order.shipping_cost || 0), 0);
    const currentRefunds = currentOrders.reduce((sum, order) => sum + (order.refunds || 0), 0);

    // Calculate previous metrics
    const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.revenue || 0), 0);
    const previousShipping = previousOrders.reduce((sum, order) => sum + (order.shipping_cost || 0), 0);
    const previousRefunds = previousOrders.reduce((sum, order) => sum + (order.refunds || 0), 0);

    // For now, we'll use estimated values for ad spend and COGS
    // These would come from Meta Ads integration and product cost data
    const estimatedAdSpend = currentRevenue * 0.25; // 25% of revenue as ad spend estimate
    const estimatedCogs = currentRevenue * 0.35; // 35% of revenue as COGS estimate
    const estimatedPreviousAdSpend = previousRevenue * 0.25;
    const estimatedPreviousCogs = previousRevenue * 0.35;

    // Calculate True P&L metrics
    const currentGrossProfit = currentRevenue - estimatedAdSpend - estimatedCogs - currentShipping;
    const previousGrossProfit = previousRevenue - estimatedPreviousAdSpend - estimatedPreviousCogs - previousShipping;

    const currentBlendedRoas = estimatedAdSpend > 0 ? currentRevenue / estimatedAdSpend : 0;
    const previousBlendedRoas = estimatedPreviousAdSpend > 0 ? previousRevenue / estimatedPreviousAdSpend : 0;

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
        value: estimatedAdSpend,
        previousValue: estimatedPreviousAdSpend,
        change: calculateChange(estimatedAdSpend, estimatedPreviousAdSpend),
        changeType: estimatedAdSpend >= estimatedPreviousAdSpend ? 'increase' : 'decrease',
        format: 'currency',
      },
      cogs: {
        value: estimatedCogs + currentShipping,
        previousValue: estimatedPreviousCogs + previousShipping,
        change: calculateChange(estimatedCogs + currentShipping, estimatedPreviousCogs + previousShipping),
        changeType: (estimatedCogs + currentShipping) >= (estimatedPreviousCogs + previousShipping) ? 'increase' : 'decrease',
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