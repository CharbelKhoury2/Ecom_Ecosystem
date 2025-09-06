import { supabase } from '../../lib/supabase';
import { subDays, format } from 'date-fns';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const days = parseInt(url.searchParams.get('days') || '30');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Fetch daily revenue from Shopify orders
    const { data: orders, error: ordersError } = await supabase
      .from('shopify_orders')
      .select('revenue, date_created, sku, quantity')
      .eq('user_id', userId)
      .gte('date_created', startDate.toISOString())
      .lte('date_created', endDate.toISOString())
      .order('date_created', { ascending: true });

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    // Fetch daily ad spend from Meta campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('meta_campaigns')
      .select('spend, date')
      .eq('user_id', userId)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
      .order('date', { ascending: true });

    if (campaignsError) {
      throw new Error(`Failed to fetch campaigns: ${campaignsError.message}`);
    }

    // Fetch product COGS data
    const { data: products, error: productsError } = await supabase
      .from('shopify_products')
      .select('sku, cogs')
      .eq('user_id', userId);

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    // Create COGS lookup map
    const cogsMap = new Map<string, number>();
    products?.forEach(product => {
      if (product.sku && product.cogs) {
        cogsMap.set(product.sku, product.cogs);
      }
    });

    // Initialize daily data maps
    const dailyRevenue = new Map<string, number>();
    const dailyAdSpend = new Map<string, number>();
    const dailyCogs = new Map<string, number>();

    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const date = format(subDays(endDate, days - 1 - i), 'yyyy-MM-dd');
      dailyRevenue.set(date, 0);
      dailyAdSpend.set(date, 0);
      dailyCogs.set(date, 0);
    }

    // Process orders for daily revenue and COGS
    orders?.forEach(order => {
      const orderDate = format(new Date(order.date_created), 'yyyy-MM-dd');
      
      // Add revenue
      const currentRevenue = dailyRevenue.get(orderDate) || 0;
      dailyRevenue.set(orderDate, currentRevenue + (order.revenue || 0));
      
      // Add COGS
      if (order.sku && cogsMap.has(order.sku)) {
        const unitCogs = cogsMap.get(order.sku) || 0;
        const totalCogs = unitCogs * (order.quantity || 1);
        const currentCogs = dailyCogs.get(orderDate) || 0;
        dailyCogs.set(orderDate, currentCogs + totalCogs);
      }
    });

    // Process campaigns for daily ad spend
    campaigns?.forEach(campaign => {
      const campaignDate = campaign.date;
      const currentSpend = dailyAdSpend.get(campaignDate) || 0;
      dailyAdSpend.set(campaignDate, currentSpend + (campaign.spend || 0));
    });

    // Generate chart data
    const chartData = Array.from(dailyRevenue.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, revenue]) => {
        const adSpend = dailyAdSpend.get(date) || 0;
        const cogs = dailyCogs.get(date) || 0;
        const grossProfit = revenue - adSpend - cogs;
        const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
        
        return {
          date,
          revenue,
          adSpend,
          cogs,
          grossProfit,
          margin
        };
      });

    // Calculate summary metrics
    const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
    const totalAdSpend = chartData.reduce((sum, item) => sum + item.adSpend, 0);
    const totalCogs = chartData.reduce((sum, item) => sum + item.cogs, 0);
    const totalGrossProfit = chartData.reduce((sum, item) => sum + item.grossProfit, 0);
    const avgMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

    return new Response(
      JSON.stringify({ 
        data: chartData,
        summary: {
          totalRevenue,
          totalAdSpend,
          totalCogs,
          totalGrossProfit,
          avgMargin
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Gross profit API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch gross profit data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: Request) {
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { 'Content-Type': 'application/json' } }
  );
}