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

    // Fetch campaign data
    const { data: campaigns } = await supabase
      .from('meta_campaigns')
      .select('*')
      .eq('user_id', userId)
      .gte('date', last7Days.toISOString().split('T')[0]);

    // Calculate metrics
    const totalRevenue = recentOrders?.reduce((sum, order) => sum + (order.revenue || 0), 0) || 0;
    const totalOrders = recentOrders?.length || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalAdSpend = campaigns?.reduce((sum, campaign) => sum + (campaign.spend || 0), 0) || 0;
    const blendedRoas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;

    // Find low stock items
    const lowStockItems = products?.filter(p => p.stock_quantity < 10 && p.stock_quantity > 0) || [];
    const outOfStockItems = products?.filter(p => p.stock_quantity === 0) || [];

    // Calculate campaign performance
    const campaignMap = new Map();
    campaigns?.forEach(campaign => {
      if (!campaignMap.has(campaign.campaign_id)) {
        campaignMap.set(campaign.campaign_id, {
          id: campaign.campaign_id,
          name: campaign.campaign_name,
          spend: 0,
          revenue: 0,
          conversions: 0,
        });
      }
      const camp = campaignMap.get(campaign.campaign_id);
      camp.spend += campaign.spend || 0;
      camp.revenue += campaign.revenue || 0;
      camp.conversions += campaign.conversions || 0;
    });

    const topCampaigns = Array.from(campaignMap.values())
      .map(campaign => ({
        ...campaign,
        roas: campaign.spend > 0 ? campaign.revenue / campaign.spend : 0,
        profit: campaign.revenue - campaign.spend,
        status: campaign.spend > 0 && campaign.revenue / campaign.spend < 2.0 ? 'underperforming' : 'performing',
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);

    const underperformingCampaigns = topCampaigns.filter(c => c.status === 'underperforming');
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
      totalAdSpend,
      blendedRoas,
      totalOrders,
      avgOrderValue,
      ordersLast7Days: totalOrders,
      topSkus,
      topCampaigns,
      underperformingCampaigns,
      lowStockItems: lowStockItems.slice(0, 5),
      outOfStockItems: outOfStockItems.slice(0, 5),
      totalProducts: products?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching store context:', error);
    return {
      totalRevenue: 0,
      totalAdSpend: 0,
      blendedRoas: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      ordersLast7Days: 0,
      topSkus: [],
      topCampaigns: [],
      underperformingCampaigns: [],
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
- Total Ad Spend (Last 7 days): $${storeData.totalAdSpend.toFixed(2)}
- Blended ROAS: ${storeData.blendedRoas.toFixed(2)}x
- Total Orders: ${storeData.totalOrders}
- Average Order Value: $${storeData.avgOrderValue.toFixed(2)}
- Total Products: ${storeData.totalProducts}

Top Performing SKUs:
${storeData.topSkus.map(sku => `- ${sku.name} (${sku.sku}): $${sku.revenue.toFixed(2)} revenue, ${sku.quantity} units sold, ${sku.stockLevel} in stock`).join('\n')}

Top Campaigns:
${storeData.topCampaigns.map(campaign => `- ${campaign.name}: $${campaign.spend.toFixed(2)} spend, $${campaign.revenue.toFixed(2)} revenue, ${campaign.roas.toFixed(2)}x ROAS, $${campaign.profit.toFixed(2)} profit`).join('\n')}

${storeData.underperformingCampaigns.length > 0 ? `Underperforming Campaigns:
${storeData.underperformingCampaigns.map(campaign => `- ${campaign.name}: ${campaign.roas.toFixed(2)}x ROAS (below 2.0x), losing $${Math.abs(campaign.profit).toFixed(2)}`).join('\n')}` : ''}

Low Stock Items:
${storeData.lowStockItems.map(item => `- ${item.name} (${item.sku}): ${item.stock_quantity} units left`).join('\n')}

Out of Stock Items:
${storeData.outOfStockItems.map(item => `- ${item.name} (${item.sku}): 0 units`).join('\n')}

Guidelines:
- Explain insights in simple, business-friendly language
- Provide specific, actionable recommendations
- Include relevant numbers and percentages in your responses
- Suggest concrete actions (restock items, adjust pricing, focus marketing)
- For campaign questions, analyze ROAS, profit, and suggest optimizations
- Recommend pausing campaigns with ROAS < 1.5x
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

  if (lowerQuery.includes('campaign') || lowerQuery.includes('ads') || lowerQuery.includes('roas')) {
    if (storeData.underperformingCampaigns.length > 0) {
      const worst = storeData.underperformingCampaigns[0];
      return `⚠️ Your "${worst.name}" campaign is underperforming with ${worst.roas.toFixed(2)}x ROAS (spent $${worst.spend.toFixed(2)}, made $${worst.revenue.toFixed(2)}). This is losing you $${Math.abs(worst.profit).toFixed(2)}. I recommend pausing this campaign or reducing budget by 50% and testing new creatives. Your blended ROAS is ${storeData.blendedRoas.toFixed(2)}x across all campaigns.`;
    } else if (storeData.topCampaigns.length > 0) {
      const best = storeData.topCampaigns[0];
      return `🎯 Your best campaign "${best.name}" has ${best.roas.toFixed(2)}x ROAS with $${best.profit.toFixed(2)} profit. Overall blended ROAS is ${storeData.blendedRoas.toFixed(2)}x. ${storeData.blendedRoas > 3 ? 'Excellent performance! Consider scaling winning campaigns.' : storeData.blendedRoas > 2 ? 'Good performance, room for optimization.' : 'Below target - review underperforming campaigns.'}`;
    } else {
      return `I don't see any campaign data yet. Make sure your Meta Ads integration is connected in Settings to analyze campaign performance and ROAS.`;
    }
  }

  if (lowerQuery.includes('losing money') || lowerQuery.includes('unprofitable')) {
    if (storeData.underperformingCampaigns.length > 0) {
      return `💸 You have ${storeData.underperformingCampaigns.length} underperforming campaigns:\n\n${storeData.underperformingCampaigns.map(c => `• ${c.name}: ${c.roas.toFixed(2)}x ROAS, losing $${Math.abs(c.profit).toFixed(2)}`).join('\n')}\n\nRecommend pausing campaigns with ROAS below 1.5x and reallocating budget to profitable ones.`;
    } else {
      return `✅ Good news! All your campaigns appear to be profitable with ROAS above 2.0x. Your blended ROAS is ${storeData.blendedRoas.toFixed(2)}x.`;
    }
  }
  if (lowerQuery.includes('profit') || lowerQuery.includes('revenue')) {
    const grossProfit = storeData.totalRevenue - storeData.totalAdSpend;
    const margin = storeData.totalRevenue > 0 ? (grossProfit / storeData.totalRevenue) * 100 : 0;
    return `📊 Last 7 days: $${storeData.totalRevenue.toFixed(2)} revenue, $${storeData.totalAdSpend.toFixed(2)} ad spend, $${grossProfit.toFixed(2)} gross profit (${margin.toFixed(1)}% margin). Blended ROAS: ${storeData.blendedRoas.toFixed(2)}x. ${storeData.topSkus.length > 0 ? `Top product: ${storeData.topSkus[0].name} ($${storeData.topSkus[0].revenue.toFixed(2)} revenue).` : ''}`;
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
  return `I'm here to help you analyze your store performance! I can provide insights on your revenue, campaigns, ROAS, top products, inventory levels, and sales trends. Based on your current data: $${storeData.totalRevenue.toFixed(2)} revenue, $${storeData.totalAdSpend.toFixed(2)} ad spend, ${storeData.blendedRoas.toFixed(2)}x ROAS over the last 7 days. What specific aspect would you like me to analyze?`;
}