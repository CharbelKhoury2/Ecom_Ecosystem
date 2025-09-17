import { supabase } from '../../lib/supabase-server';
import { getShopifyAPIFromEnv, getShopifyAPI } from '../../lib/shopify';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const days = parseInt(url.searchParams.get('days') || '30');
    const useEnvCredentials = url.searchParams.get('useEnv') === 'true';

    let shopifyAPI;
    
    if (useEnvCredentials) {
      // Use environment variables (admin API)
      shopifyAPI = getShopifyAPIFromEnv();
      if (!shopifyAPI) {
        return new Response(
          JSON.stringify({ error: 'Shopify environment credentials not configured' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Use user-specific credentials
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Missing userId parameter' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      shopifyAPI = await getShopifyAPI(userId);
      if (!shopifyAPI) {
        return new Response(
          JSON.stringify({ error: 'Shopify not connected for user' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Calculate date range
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    const createdAtMin = dateFrom.toISOString();

    // Fetch recent orders for analytics
    const orders = await shopifyAPI.fetchOrdersWithRefunds(createdAtMin);
    const products = await shopifyAPI.fetchProducts();

    // Calculate analytics
    const analytics = {
      totalRevenue: 0,
      totalOrders: orders.length,
      totalProducts: products.length,
      averageOrderValue: 0,
      topProducts: new Map(),
      dailySales: new Map(),
      refundRate: 0,
      totalRefunds: 0,
      inventoryValue: 0,
      lowStockProducts: 0
    };

    // Process orders for analytics
    orders.forEach(order => {
      const orderTotal = parseFloat(order.total_price);
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      
      analytics.totalRevenue += orderTotal;
      
      // Daily sales tracking
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
        const productKey = `${item.name} (${item.sku || 'N/A'})`;
        const currentCount = analytics.topProducts.get(productKey) || 0;
        analytics.topProducts.set(productKey, currentCount + item.quantity);
      });
    });

    // Process products for inventory analytics
    products.forEach(product => {
      product.variants.forEach(variant => {
        const price = parseFloat(variant.price);
        const quantity = variant.inventory_quantity || 0;
        
        analytics.inventoryValue += price * quantity;
        
        // Count low stock products (less than 10 items)
        if (quantity < 10) {
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

    // Convert Maps to arrays for JSON response
    const topProductsArray = Array.from(analytics.topProducts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, quantity]) => ({ name, quantity }));

    const dailySalesArray = Array.from(analytics.dailySales.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, sales]) => ({ date, sales }));

    return new Response(
      JSON.stringify({
        success: true,
        analytics: {
          ...analytics,
          topProducts: topProductsArray,
          dailySales: dailySalesArray,
          totalRevenue: Math.round(analytics.totalRevenue * 100) / 100,
          averageOrderValue: Math.round(analytics.averageOrderValue * 100) / 100,
          refundRate: Math.round(analytics.refundRate * 100) / 100,
          totalRefunds: Math.round(analytics.totalRefunds * 100) / 100,
          inventoryValue: Math.round(analytics.inventoryValue * 100) / 100
        },
        dateRange: {
          from: createdAtMin,
          to: new Date().toISOString(),
          days
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Shopify analytics error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch analytics data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}