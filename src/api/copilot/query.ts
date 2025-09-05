import { supabase } from '../../lib/supabase';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: Request) {
  try {
    const { query, userId } = await request.json();

    if (!query || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing query or userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch current store data for context
    const storeData = await fetchStoreContext(userId);

    // Generate AI response
    const aiResponse = await generateAIResponse(query, storeData);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Copilot query error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process query' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function fetchStoreContext(userId: string) {
  try {
    // Calculate date ranges
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // Fetch recent orders
    const { data: recentOrders } = await supabase
      .from('shopify_orders')
      .select('*')
      .eq('user_id', userId)
      .gte('date_created', last7Days.toISOString());

    // Fetch all orders for trend analysis
    const { data: allOrders } = await supabase
      .from('shopify_orders')
      .select('revenue, date_created')
      .eq('user_id', userId)
      .gte('date_created', last30Days.toISOString());

    // Fetch products with stock levels
    const { data: products } = await supabase
      .from('shopify_products')
      .select('*')
      .eq('user_id', userId);

    // Calculate metrics
    const totalRevenue = recentOrders?.reduce((sum, order) => sum + (order.revenue || 0), 0) || 0;
    const totalOrders = recentOrders?.length || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Find low stock items
    const lowStockItems = products?.filter(p => p.stock_quantity < 10 && p.stock_quantity > 0) || [];
    const outOfStockItems = products?.filter(p => p.stock_quantity === 0) || [];

    // Calculate top SKUs
    const skuMap = new Map();
    recentOrders?.forEach(order => {
      if (order.sku) {
        if (!skuMap.has(order.sku)) {
          const product = products?.find(p => p.sku === order.sku);
          skuMap.set(order.sku, {
            sku: order.sku,
            name: product?.name || 'Unknown Product',
            revenue: 0,
            quantity: 0,
            stockLevel: product?.stock_quantity || 0,
          });
        }
        const skuData = skuMap.get(order.sku);
        skuData.revenue += order.revenue || 0;
        skuData.quantity += order.quantity || 0;
      }
    });

    const topSkus = Array.from(skuMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      ordersLast7Days: totalOrders,
      topSkus,
      lowStockItems: lowStockItems.slice(0, 5),
      outOfStockItems: outOfStockItems.slice(0, 5),
      totalProducts: products?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching store context:', error);
    return {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      ordersLast7Days: 0,
      topSkus: [],
      lowStockItems: [],
      outOfStockItems: [],
      totalProducts: 0,
    };
  }
}

async function generateAIResponse(query: string, storeData: any): Promise<string> {
  // If OpenAI API key is not available, use rule-based responses
  if (!OPENAI_API_KEY) {
    return generateRuleBasedResponse(query, storeData);
  }

  try {
    const systemPrompt = `You are an expert E-commerce Analytics AI assistant. You analyze store performance data and provide actionable insights to business owners.

Current Store Data:
- Total Revenue (Last 7 days): $${storeData.totalRevenue.toFixed(2)}
- Total Orders: ${storeData.totalOrders}
- Average Order Value: $${storeData.avgOrderValue.toFixed(2)}
- Total Products: ${storeData.totalProducts}

Top Performing SKUs:
${storeData.topSkus.map(sku => `- ${sku.name} (${sku.sku}): $${sku.revenue.toFixed(2)} revenue, ${sku.quantity} units sold, ${sku.stockLevel} in stock`).join('\n')}

Low Stock Items:
${storeData.lowStockItems.map(item => `- ${item.name} (${item.sku}): ${item.stock_quantity} units left`).join('\n')}

Out of Stock Items:
${storeData.outOfStockItems.map(item => `- ${item.name} (${item.sku}): 0 units`).join('\n')}

Guidelines:
- Explain insights in simple, business-friendly language
- Provide specific, actionable recommendations
- Include relevant numbers and percentages in your responses
- Suggest concrete actions (restock items, adjust pricing, focus marketing)
- Never execute actions - only recommend them
- Ask clarifying questions when needed`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response at this time.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateRuleBasedResponse(query, storeData);
  }
}

function generateRuleBasedResponse(query: string, storeData: any): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('profit') || lowerQuery.includes('revenue')) {
    return `Based on your store data, you've generated $${storeData.totalRevenue.toFixed(2)} in revenue over the last 7 days from ${storeData.totalOrders} orders. Your average order value is $${storeData.avgOrderValue.toFixed(2)}. ${storeData.topSkus.length > 0 ? `Your top performing product is ${storeData.topSkus[0].name} with $${storeData.topSkus[0].revenue.toFixed(2)} in revenue.` : ''}`;
  }

  if (lowerQuery.includes('stock') || lowerQuery.includes('inventory')) {
    if (storeData.outOfStockItems.length > 0) {
      return `⚠️ You have ${storeData.outOfStockItems.length} products completely out of stock: ${storeData.outOfStockItems.map(item => item.name).join(', ')}. ${storeData.lowStockItems.length > 0 ? `Additionally, ${storeData.lowStockItems.length} products are running low: ${storeData.lowStockItems.map(item => `${item.name} (${item.stock_quantity} left)`).join(', ')}.` : ''} I recommend restocking these items immediately to avoid lost sales.`;
    } else if (storeData.lowStockItems.length > 0) {
      return `You have ${storeData.lowStockItems.length} products running low on stock: ${storeData.lowStockItems.map(item => `${item.name} (${item.stock_quantity} units left)`).join(', ')}. Consider restocking these items soon to maintain sales momentum.`;
    } else {
      return `Your inventory levels look healthy! All products appear to be well-stocked. Keep monitoring your top sellers to ensure you don't run out of popular items.`;
    }
  }

  if (lowerQuery.includes('best') || lowerQuery.includes('top') || lowerQuery.includes('performing')) {
    if (storeData.topSkus.length > 0) {
      return `Your best performing products in the last 7 days are:\n\n${storeData.topSkus.map((sku, index) => `${index + 1}. **${sku.name}** - $${sku.revenue.toFixed(2)} revenue (${sku.quantity} units sold, ${sku.stockLevel} in stock)`).join('\n')}\n\nThese products are driving your sales. Consider increasing marketing spend on these winners and ensuring adequate inventory levels.`;
    } else {
      return `I don't have enough recent sales data to identify your top performing products. Make sure your Shopify integration is working and you have recent orders to analyze.`;
    }
  }

  if (lowerQuery.includes('orders') || lowerQuery.includes('sales')) {
    return `You've processed ${storeData.totalOrders} orders in the last 7 days, generating $${storeData.totalRevenue.toFixed(2)} in total revenue. Your average order value is $${storeData.avgOrderValue.toFixed(2)}. ${storeData.totalOrders > 0 ? 'Your store is actively generating sales!' : 'Consider reviewing your marketing strategy to drive more orders.'}`;
  }

  // Default response
  return `I'm here to help you analyze your store performance! I can provide insights on your revenue, top products, inventory levels, and sales trends. Based on your current data, you have ${storeData.totalProducts} products and have generated $${storeData.totalRevenue.toFixed(2)} in revenue over the last 7 days. What specific aspect of your business would you like me to analyze?`;
}