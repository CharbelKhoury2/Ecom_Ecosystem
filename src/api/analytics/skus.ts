import { supabase } from '../../lib/supabase-server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const days = parseInt(url.searchParams.get('days') || '7');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate date range
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    // Fetch aggregated SKU data with product information
    const { data: skuData, error } = await supabase
      .from('shopify_orders')
      .select(`
        sku,
        revenue,
        quantity,
        shopify_products!inner(name, stock_quantity, cost_per_item)
      `)
      .eq('user_id', userId)
      .gte('date_created', dateFrom.toISOString())
      .not('sku', 'is', null);

    if (error) {
      console.error('Database error fetching SKU data:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch SKU data' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate data by SKU
    const skuMap = new Map();
    
    for (const item of skuData || []) {
      const sku = item.sku;
      if (!skuMap.has(sku)) {
        skuMap.set(sku, {
          sku,
          productName: item.shopify_products.name,
          revenue: 0,
          quantity: 0,
          stockLevel: item.shopify_products.stock_quantity,
          costPerItem: item.shopify_products.cost_per_item,
        });
      }
      
      const skuRecord = skuMap.get(sku);
      skuRecord.revenue += item.revenue || 0;
      skuRecord.quantity += item.quantity || 0;
    }

    // Convert to array and calculate profit
    const topSkus = Array.from(skuMap.values())
      .map(sku => ({
        ...sku,
        profit: sku.revenue - (sku.quantity * sku.costPerItem),
        status: sku.stockLevel === 0 ? 'out-of-stock' : 
                sku.stockLevel < 10 ? 'low-stock' : 'active',
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    return new Response(
      JSON.stringify({ topSkus }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analytics SKUs error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch SKU analytics' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}