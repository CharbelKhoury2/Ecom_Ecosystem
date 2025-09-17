import { supabase } from '../../lib/supabase-server';
import { subDays, format } from 'date-fns';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const days = parseInt(url.searchParams.get('days') || '14');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Fetch products with current inventory
    const { data: products, error: productsError } = await supabase
      .from('shopify_products')
      .select('sku, name, stock_quantity')
      .eq('user_id', userId)
      .gt('stock_quantity', 0);

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ data: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch daily sales data for the period
    const { data: orders, error: ordersError } = await supabase
      .from('shopify_orders')
      .select('sku, quantity, date_created')
      .eq('user_id', userId)
      .gte('date_created', startDate.toISOString())
      .lte('date_created', endDate.toISOString())
      .order('date_created', { ascending: true });

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    // Group sales by date and calculate daily totals
    const dailySales = new Map<string, number>();
    const dailyInventory = new Map<string, number>();

    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const date = format(subDays(endDate, days - 1 - i), 'yyyy-MM-dd');
      dailySales.set(date, 0);
      dailyInventory.set(date, 0);
    }

    // Calculate total current inventory
    const totalCurrentInventory = products.reduce((sum, product) => sum + (product.stock_quantity || 0), 0);

    // Process orders to get daily sales
    orders?.forEach(order => {
      const orderDate = format(new Date(order.date_created), 'yyyy-MM-dd');
      const currentSales = dailySales.get(orderDate) || 0;
      dailySales.set(orderDate, currentSales + (order.quantity || 0));
    });

    // Calculate inventory levels (assuming current inventory and working backwards)
    const salesArray = Array.from(dailySales.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    let runningInventory = totalCurrentInventory;
    
    // Work backwards from current date to calculate historical inventory
    for (let i = salesArray.length - 1; i >= 0; i--) {
      const [date, sales] = salesArray[i];
      dailyInventory.set(date, runningInventory);
      runningInventory += sales; // Add back sales to get previous day's inventory
    }

    // Generate chart data
    const chartData = salesArray.map(([date, sales]) => {
      const inventory = dailyInventory.get(date) || 0;
      const velocity = sales > 0 ? inventory / sales : inventory > 0 ? 999 : 0; // Days to sell out
      
      return {
        date,
        inventory,
        sales,
        velocity: Math.min(velocity, 999) // Cap at 999 days
      };
    });

    return new Response(
      JSON.stringify({ data: chartData }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Inventory velocity API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch inventory velocity data' }),
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