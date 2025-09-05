import { supabase } from '../../lib/supabase';
import { getShopifyAPI } from '../../lib/shopify';

export async function POST(request: Request) {
  try {
    const { userId, syncDays = 30 } = await request.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const shopifyAPI = await getShopifyAPI(userId);
    if (!shopifyAPI) {
      return new Response(
        JSON.stringify({ error: 'Shopify not connected' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate date range
    const createdAtMin = new Date();
    createdAtMin.setDate(createdAtMin.getDate() - syncDays);
    const createdAtMinISO = createdAtMin.toISOString();

    // Fetch orders from Shopify
    const orders = await shopifyAPI.fetchOrdersWithRefunds(createdAtMinISO);

    // Process and store orders
    const orderRecords = [];
    for (const order of orders) {
      for (const lineItem of order.line_items) {
        // Calculate refund amount for this line item
        const totalRefunds = order.refunds.reduce((sum, refund) => {
          return sum + parseFloat(refund.total_refund_set.shop_money.amount);
        }, 0);

        // Calculate shipping cost (proportional to line item value)
        const shippingCost = order.shipping_lines.reduce((sum, shipping) => {
          return sum + parseFloat(shipping.price);
        }, 0);

        const lineItemTotal = parseFloat(lineItem.price) * lineItem.quantity;
        const proportionalShipping = order.line_items.length > 0 
          ? (lineItemTotal / parseFloat(order.total_price)) * shippingCost 
          : 0;

        const proportionalRefund = order.line_items.length > 0
          ? (lineItemTotal / parseFloat(order.total_price)) * totalRefunds
          : 0;

        orderRecords.push({
          user_id: userId,
          order_id: order.id.toString(),
          sku: lineItem.sku || null,
          product_id: lineItem.product_id.toString(),
          quantity: lineItem.quantity,
          revenue: lineItemTotal - proportionalRefund,
          total_price: lineItemTotal,
          shipping_cost: proportionalShipping,
          refunds: proportionalRefund,
          currency: order.currency,
          date_created: order.created_at,
          synced_at: new Date().toISOString(),
        });
      }
    }

    // Batch insert orders
    if (orderRecords.length > 0) {
      const { error } = await supabase
        .from('shopify_orders')
        .upsert(orderRecords, {
          onConflict: 'user_id,order_id,sku',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error('Database error inserting orders:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to store orders' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ordersProcessed: orderRecords.length,
        uniqueOrders: orders.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Shopify orders sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to sync orders' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

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

    // Calculate date range
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const { data: orders, error } = await supabase
      .from('shopify_orders')
      .select('*')
      .eq('user_id', userId)
      .gte('date_created', dateFrom.toISOString())
      .order('date_created', { ascending: false });

    if (error) {
      console.error('Database error fetching orders:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch orders' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ orders: orders || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get orders error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}