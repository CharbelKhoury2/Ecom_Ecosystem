import { supabase } from '../../lib/supabase-server';
import { buildCopilotContext, CopilotContext } from '../../utils/copilotContext';
import { 
  checkRateLimit, 
  getCachedContext, 
  setCachedContext, 
  getRateLimitHeaders,
  RateLimitError 
} from '../../utils/cacheAndRateLimit';
import {
  trackAPIUsage,
  checkUsageLimits,
  getUsageHeaders,
  UsageLimitError
} from '../../utils/apiUsageTracking';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDH3IfcmNb2htWqJ2g0bAV7VeC1oKaHfhI';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export async function POST(request: Request) {
  try {
    const { 
      workspace_id, 
      user_query, 
      conversation_context, 
      enhanced_features 
    } = await request.json();

    if (!workspace_id || !user_query) {
      return new Response(
        JSON.stringify({ error: 'Missing workspace_id or user_query' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limiting
    try {
      checkRateLimit(workspace_id);
    } catch (error) {
      if (error instanceof RateLimitError) {
        const headers = {
          'Content-Type': 'application/json',
          ...getRateLimitHeaders(workspace_id)
        };
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please try again later.',
            resetTime: error.resetTime
          }),
          { status: 429, headers }
        );
      }
      throw error;
    }

    // Check usage limits
    try {
      await checkUsageLimits(workspace_id);
    } catch (error) {
      if (error instanceof UsageLimitError) {
        const headers = {
          'Content-Type': 'application/json',
          'X-Usage-Limit-Current': error.current_usage.toString(),
          'X-Usage-Limit-Max': error.limit.toString(),
          'X-Usage-Limit-Reset': Math.ceil(error.reset_time / 1000).toString()
        };
        return new Response(
          JSON.stringify({ 
            error: 'Daily usage limit exceeded. Please try again tomorrow.',
            current_usage: error.current_usage,
            limit: error.limit,
            reset_time: error.reset_time
          }),
          { status: 429, headers }
        );
      }
      throw error;
    }

    // Try to get cached context first
    let context = getCachedContext(workspace_id);
    
    if (!context) {
      // Build fresh context and cache it
      context = await buildCopilotContext(workspace_id);
      setCachedContext(workspace_id, context);
    }

    // Enhance context with conversation history and user preferences
    const enhancedContext = {
      ...context,
      conversation_history: conversation_context?.previous_messages || [],
      user_preferences: conversation_context?.user_preferences || {},
      current_context: conversation_context?.current_context || {},
      query_intent: analyzeQueryIntent(user_query),
      enhanced_features: enhanced_features || {}
    };

    // Generate AI response using enhanced Gemini integration
    const { llm_response, recommendations, tokens_used, insights } = await generateEnhancedGeminiResponse(
      user_query, 
      enhancedContext,
      enhanced_features
    );

    // Track API usage
    try {
      await trackAPIUsage(workspace_id, tokens_used, 'gemini');
    } catch (error) {
      console.error('Failed to track API usage:', error);
      // Continue execution even if tracking fails
    }

    // Add rate limit and usage headers to response
    const headers = {
      'Content-Type': 'application/json',
      ...getRateLimitHeaders(workspace_id),
      ...getUsageHeaders(workspace_id, tokens_used)
    };

    return new Response(
      JSON.stringify({ 
        context: {
          workspace_id: enhancedContext.workspace_id,
          timestamp: enhancedContext.timestamp,
          query_type: enhancedContext.query_intent?.type,
          // Trim context for response size
          shopify: {
            revenue_yesterday: enhancedContext.shopify.revenue_yesterday,
            revenue_last_7_days: enhancedContext.shopify.revenue_last_7_days,
            products_count: enhancedContext.shopify.products_count
          },
          meta_ads: {
            spend_yesterday: enhancedContext.meta_ads.spend_yesterday,
            ad_spend_last_7_days: enhancedContext.meta_ads.ad_spend_last_7_days
          },
          alerts_count: enhancedContext.alerts.length,
          derived: enhancedContext.derived
        },
        llm_response,
        recommendations,
        insights,
        tokens_used,
        query_intent: enhancedContext.query_intent
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Copilot query error:', error);
    
    const headers = {
      'Content-Type': 'application/json'
    };

    return new Response(
      JSON.stringify({ error: 'Failed to process query' }),
      { status: 500, headers }
    );
  }
}

// Enhanced query intent analysis
function analyzeQueryIntent(query: string) {
  const lowerQuery = query.toLowerCase();
  
  // Define intent patterns
  const intents = {
    revenue_analysis: [
      'revenue', 'sales', 'income', 'earnings', 'profit', 'money made',
      'how much', 'total sales', 'revenue trend'
    ],
    inventory_check: [
      'stock', 'inventory', 'out of stock', 'low stock', 'running out',
      'available', 'quantity', 'restock'
    ],
    performance_analysis: [
      'performance', 'best', 'worst', 'top', 'bottom', 'performing',
      'successful', 'underperforming', 'comparison'
    ],
    alerts_review: [
      'alert', 'warning', 'issue', 'problem', 'notification',
      'urgent', 'critical', 'attention'
    ],
    trend_analysis: [
      'trend', 'pattern', 'growth', 'decline', 'increase', 'decrease',
      'over time', 'historical', 'forecast'
    ],
    actionable_insights: [
      'recommend', 'suggest', 'advice', 'should', 'optimize',
      'improve', 'action', 'next steps'
    ]
  };
  
  // Calculate intent scores
  const scores = Object.entries(intents).map(([intent, keywords]) => {
    const score = keywords.reduce((acc, keyword) => {
      return acc + (lowerQuery.includes(keyword) ? 1 : 0);
    }, 0);
    return { intent, score, confidence: score / keywords.length };
  });
  
  // Find the highest scoring intent
  const topIntent = scores.reduce((max, current) => 
    current.score > max.score ? current : max
  );
  
  return {
    type: topIntent.intent,
    confidence: topIntent.confidence,
    keywords_matched: intents[topIntent.intent as keyof typeof intents].filter(keyword => 
      lowerQuery.includes(keyword)
    ),
    complexity: query.length > 100 ? 'high' : query.length > 50 ? 'medium' : 'low'
  };
}

// Enhanced Gemini response generation with better context awareness
async function generateEnhancedGeminiResponse(
  user_query: string, 
  context: any,
  enhanced_features: any = {}
) {
  try {
    // Build enhanced prompt with conversation context
    const systemPrompt = buildEnhancedSystemPrompt(context, enhanced_features);
    const contextualPrompt = buildContextualPrompt(user_query, context);
    
    const requestBody = {
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\n${contextualPrompt}\n\nUser Query: ${user_query}`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: enhanced_features.context_aware ? 2048 : 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const llm_response = data.candidates[0].content.parts[0].text;
    const tokens_used = data.usageMetadata?.totalTokenCount || 0;
    
    // Generate contextual recommendations
    const recommendations = generateContextualRecommendations(context, user_query);
    
    // Generate insights based on query intent
    const insights = generateInsights(context, user_query);

    return {
      llm_response,
      recommendations,
      insights,
      tokens_used
    };
    
  } catch (error) {
    console.error('Enhanced Gemini API error:', error);
    throw error;
  }
}

// Build enhanced system prompt with conversation context
function buildEnhancedSystemPrompt(context: any, enhanced_features: any) {
  let prompt = `You are an advanced AI business analyst for an e-commerce platform. You have access to comprehensive business data and conversation history.`;
  
  if (enhanced_features.context_aware) {
    prompt += ` You maintain context across conversations and provide personalized insights based on user preferences and previous interactions.`;
  }
  
  if (enhanced_features.include_actions) {
    prompt += ` You can suggest specific actionable steps and business optimizations.`;
  }
  
  if (enhanced_features.include_suggestions) {
    prompt += ` You provide proactive suggestions and identify opportunities for improvement.`;
  }
  
  prompt += `\n\nYour responses should be:
- Data-driven and specific
- Actionable with clear next steps
- Contextually relevant to the user's business
- Professional yet conversational
- Include relevant metrics and comparisons when available`;
  
  return prompt;
}

// Build contextual prompt based on query intent and conversation history
function buildContextualPrompt(user_query: string, context: any) {
  let prompt = `Current Business Context:\n`;
  
  // Add conversation history context
  if (context.conversation_history && context.conversation_history.length > 0) {
    prompt += `\nRecent Conversation Context:\n`;
    context.conversation_history.slice(-3).forEach((msg: any, index: number) => {
      prompt += `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content.substring(0, 200)}...\n`;
    });
  }
  
  // Add query intent context
  if (context.query_intent) {
    prompt += `\nQuery Intent: ${context.query_intent.type} (confidence: ${(context.query_intent.confidence * 100).toFixed(0)}%)\n`;
    if (context.query_intent.keywords_matched.length > 0) {
      prompt += `Key topics: ${context.query_intent.keywords_matched.join(', ')}\n`;
    }
  }
  
  // Add current business metrics
  prompt += `\nCurrent Business Metrics:\n`;
  if (context.shopify) {
    prompt += `- Revenue (yesterday): $${context.shopify.revenue_yesterday || 0}\n`;
    prompt += `- Revenue (7 days): $${context.shopify.revenue_last_7_days || 0}\n`;
    prompt += `- Products: ${context.shopify.products_count || 0}\n`;
  }
  
  if (context.meta_ads) {
    prompt += `- Ad spend (yesterday): $${context.meta_ads.spend_yesterday || 0}\n`;
    prompt += `- Ad spend (7 days): $${context.meta_ads.ad_spend_last_7_days || 0}\n`;
  }
  
  if (context.alerts && context.alerts.length > 0) {
    prompt += `- Active alerts: ${context.alerts.length}\n`;
    const criticalAlerts = context.alerts.filter((alert: any) => alert.severity === 'critical');
    if (criticalAlerts.length > 0) {
      prompt += `- Critical alerts: ${criticalAlerts.length}\n`;
    }
  }
  
  return prompt;
}

// Generate contextual recommendations based on business data
function generateContextualRecommendations(context: any, query: string) {
  const recommendations = [];
  
  // Revenue-based recommendations
  if (context.shopify?.revenue_yesterday && context.shopify?.revenue_last_7_days) {
    const dailyAverage = context.shopify.revenue_last_7_days / 7;
    if (context.shopify.revenue_yesterday < dailyAverage * 0.8) {
      recommendations.push({
        type: 'revenue_optimization',
        priority: 'high',
        title: 'Revenue Below Average',
        description: 'Yesterday\'s revenue was significantly below the 7-day average. Consider reviewing marketing campaigns or product promotions.'
      });
    }
  }
  
  // Alert-based recommendations
  if (context.alerts && context.alerts.length > 0) {
    const criticalAlerts = context.alerts.filter((alert: any) => alert.severity === 'critical');
    if (criticalAlerts.length > 0) {
      recommendations.push({
        type: 'urgent_action',
        priority: 'critical',
        title: 'Critical Alerts Require Attention',
        description: `You have ${criticalAlerts.length} critical alerts that need immediate attention.`
      });
    }
  }
  
  // Ad spend efficiency recommendations
  if (context.meta_ads?.spend_yesterday && context.shopify?.revenue_yesterday) {
    const roas = context.shopify.revenue_yesterday / context.meta_ads.spend_yesterday;
    if (roas < 2.0) {
      recommendations.push({
        type: 'ad_optimization',
        priority: 'medium',
        title: 'Low ROAS Detected',
        description: `Current ROAS is ${roas.toFixed(2)}. Consider optimizing ad campaigns or adjusting targeting.`
      });
    }
  }
  
  return recommendations;
}

// Generate insights based on query intent and business data
function generateInsights(context: any, query: string) {
  const insights = [];
  
  // Performance insights
  if (context.shopify?.revenue_last_7_days && context.meta_ads?.ad_spend_last_7_days) {
    const weeklyROAS = context.shopify.revenue_last_7_days / context.meta_ads.ad_spend_last_7_days;
    insights.push(`Your 7-day ROAS is ${weeklyROAS.toFixed(2)}x, ${weeklyROAS > 3 ? 'which is excellent' : weeklyROAS > 2 ? 'which is good' : 'which needs improvement'}.`);
  }
  
  // Growth insights
  if (context.derived?.growth_rate) {
    insights.push(`Your business is ${context.derived.growth_rate > 0 ? 'growing' : 'declining'} at ${Math.abs(context.derived.growth_rate * 100).toFixed(1)}% compared to the previous period.`);
  }
  
  // Inventory insights
  if (context.alerts) {
    const inventoryAlerts = context.alerts.filter((alert: any) => alert.type?.includes('stock'));
    if (inventoryAlerts.length > 0) {
      insights.push(`You have ${inventoryAlerts.length} inventory-related alerts that may impact sales if not addressed.`);
    }
  }
  
  return insights;
}

// Legacy function for backward compatibility
async function generateGeminiResponse(
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

    // Calculate yesterday's metrics
    const yesterdayRevenue = yesterdayOrders?.reduce((sum, order) => sum + (order.revenue || 0), 0) || 0;
    const yesterdayAdSpend = yesterdayCampaigns?.reduce((sum, campaign) => sum + (campaign.spend || 0), 0) || 0;

    // Format structured JSON context
    const structuredContext = {
      shopify: {
        revenue_yesterday: yesterdayRevenue,
        orders: yesterdayOrders?.map(order => ({
          id: order.order_id || order.id,
          sku: order.sku,
          quantity: order.quantity || 1,
          total: order.revenue || 0
        })) || [],
        products: products?.map(product => ({
          sku: product.sku,
          title: product.name || product.title,
          inventory_quantity: product.stock_quantity || 0,
          cogs: product.cogs || 0,
          price: product.price || 0
        })) || []
      },
      meta_ads: {
        spend_yesterday: yesterdayAdSpend,
        campaigns: topCampaigns.map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          spend: campaign.spend,
          roas: campaign.roas
        }))
      },
      alerts: alerts?.map(alert => ({
        type: alert.type,
        sku: alert.sku,
        message: alert.message,
        severity: alert.severity
      })) || []
    };

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
      structuredContext
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
      structuredContext: {
        shopify: {
          revenue_yesterday: 0,
          orders: [],
          products: []
        },
        meta_ads: {
          spend_yesterday: 0,
          campaigns: []
        },
        alerts: []
      }
    };
  }
}

async function generateGeminiResponse(
  user_query: string, 
  context: CopilotContext
): Promise<{
  llm_response: string;
  recommendations: any[];
  tokens_used: number;
}> {
  // If Gemini API key is not available, use rule-based responses
  if (!GEMINI_API_KEY) {
    return {
      llm_response: generateRuleBasedResponse(user_query, context),
      recommendations: [],
      tokens_used: 0
    };
  }

  try {
    const systemPrompt = `You are **E-commerce Copilot OS**, an AI assistant built for ecommerce founders.
You always use the structured data provided in the JSON context below to give factual, helpful answers.

---

## Rules
1. Always rely on the JSON context for numbers, products, campaigns, and alerts.
2. Never invent data. If information is missing, say:
   > "I don't have that data yet. Please connect the integration."
3. Keep answers clear and actionable. Use tables or bullet points if needed.
4. Prioritize insights that help the founder **increase profit, prevent stockouts, or optimize ads**.
5. Be concise, avoid jargon, and give next steps if possible.

---

## JSON Context
${JSON.stringify(context, null, 2)}

---

Guidelines:
- Calculate profit as: Revenue - (Ad Spend + COGS)
- Identify underperforming campaigns with ROAS < 1.0
- Highlight inventory risks from alerts
- Provide actionable business insights
- Stay strictly within the JSON data
- Be a profit-first advisor, not just a chatbot

User Query: ${user_query}`;

    const requestBody = {
      contents: [{
        parts: [{
          text: systemPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 0.8,
        topK: 10
      }
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    const candidate = data.candidates[0];
    let llm_response = '';
    let recommendations: any[] = [];
    let tokens_used = 0;

    // Extract text response
    if (candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        if (part.text) {
          llm_response += part.text;
        }
      }
    }

    // Estimate tokens used (rough approximation)
    tokens_used = Math.ceil((systemPrompt.length + llm_response.length) / 4);

    return {
      llm_response: llm_response || 'I apologize, but I couldn\'t generate a response at this time.',
      recommendations,
      tokens_used
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      llm_response: generateRuleBasedResponse(user_query, context),
      recommendations: [],
      tokens_used: 0
    };
  }
}

function generateRuleBasedResponse(query: string, context: CopilotContext): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('campaign') || lowerQuery.includes('ads') || lowerQuery.includes('roas')) {
    const underperformingCampaigns = context.meta_ads.top_campaigns.filter(c => c.roas < 1.0);
    if (underperformingCampaigns.length > 0) {
      const worst = underperformingCampaigns[0];
      const profit = worst.revenue - worst.spend;
      return `⚠️ Your "${worst.name}" campaign is underperforming with ${worst.roas.toFixed(2)}x ROAS (spent $${worst.spend.toFixed(2)}, made $${worst.revenue.toFixed(2)}). This is losing you $${Math.abs(profit).toFixed(2)}. I recommend pausing this campaign or reducing budget by 50% and testing new creatives. Your blended ROAS is ${context.derived.blended_roas.toFixed(2)}x across all campaigns.`;
    } else if (context.meta_ads.top_campaigns.length > 0) {
      const best = context.meta_ads.top_campaigns[0];
      const profit = best.revenue - best.spend;
      return `🎯 Your best campaign "${best.name}" has ${best.roas.toFixed(2)}x ROAS with $${profit.toFixed(2)} profit. Overall blended ROAS is ${context.derived.blended_roas.toFixed(2)}x. ${context.derived.blended_roas > 3 ? 'Excellent performance! Consider scaling winning campaigns.' : context.derived.blended_roas > 2 ? 'Good performance, room for optimization.' : 'Below target - review underperforming campaigns.'}`;
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
    const grossProfit = context.shopify.revenue_last_7_days - context.meta_ads.ad_spend_last_7_days;
    const margin = context.shopify.revenue_last_7_days > 0 ? (grossProfit / context.shopify.revenue_last_7_days) * 100 : 0;
    return `📊 Last 7 days: $${context.shopify.revenue_last_7_days.toFixed(2)} revenue, $${context.meta_ads.ad_spend_last_7_days.toFixed(2)} ad spend, $${grossProfit.toFixed(2)} gross profit (${margin.toFixed(1)}% margin). Blended ROAS: ${context.derived.blended_roas.toFixed(2)}x. Yesterday's profit: $${context.derived.gross_profit_yesterday.toFixed(2)}. ${context.shopify.top_skus.length > 0 ? `Top product: ${context.shopify.top_skus[0].sku} ($${context.shopify.top_skus[0].revenue.toFixed(2)} revenue).` : ''}`;
  }

  if (lowerQuery.includes('stock') || lowerQuery.includes('inventory')) {
    const outOfStockAlerts = context.alerts.filter(alert => alert.type === 'Out of Stock');
    const lowStockAlerts = context.alerts.filter(alert => alert.type === 'Low Stock');
    
    if (outOfStockAlerts.length > 0) {
      return `⚠️ You have ${outOfStockAlerts.length} products completely out of stock: ${outOfStockAlerts.map(alert => alert.sku).join(', ')}. ${lowStockAlerts.length > 0 ? `Additionally, ${lowStockAlerts.length} products are running low: ${lowStockAlerts.map(alert => alert.sku).join(', ')}.` : ''} I recommend restocking these items immediately to avoid lost sales.`;
    } else if (lowStockAlerts.length > 0) {
      return `You have ${lowStockAlerts.length} products running low on stock: ${lowStockAlerts.map(alert => `${alert.sku} (${alert.message})`).join(', ')}. Consider restocking these items soon to maintain sales momentum.`;
    } else {
      return `Your inventory levels look healthy! All products appear to be well-stocked. Keep monitoring your top sellers to ensure you don't run out of popular items.`;
    }
  }

  if (lowerQuery.includes('best') || lowerQuery.includes('top') || lowerQuery.includes('performing')) {
    if (context.shopify.top_skus.length > 0) {
      return `Your best performing products in the last 7 days are:\n\n${context.shopify.top_skus.map((sku, index) => `${index + 1}. **${sku.sku}** - $${sku.revenue.toFixed(2)} revenue (${sku.qty} units sold, ${sku.inventory_qty} in stock)`).join('\n')}\n\nThese products are driving your sales. Consider increasing marketing spend on these winners and ensuring adequate inventory levels.`;
    } else {
      return `I don't have enough recent sales data to identify your top performing products. Make sure your Shopify integration is working and you have recent orders to analyze.`;
    }
  }

  if (lowerQuery.includes('orders') || lowerQuery.includes('sales')) {
    const avgOrderValue = context.shopify.orders_last_7_days > 0 ? context.shopify.revenue_last_7_days / context.shopify.orders_last_7_days : 0;
    return `You've processed ${context.shopify.orders_last_7_days} orders in the last 7 days, generating $${context.shopify.revenue_last_7_days.toFixed(2)} in total revenue. Your average order value is $${avgOrderValue.toFixed(2)}. ${context.shopify.orders_last_7_days > 0 ? 'Your store is actively generating sales!' : 'Consider reviewing your marketing strategy to drive more orders.'}`;
  }

  // Default response
  return `I'm here to help you analyze your store performance! I can provide insights on your revenue, campaigns, ROAS, top products, inventory levels, and sales trends. Based on your current data: $${context.shopify.revenue_last_7_days.toFixed(2)} revenue, $${context.meta_ads.ad_spend_last_7_days.toFixed(2)} ad spend, ${context.derived.blended_roas.toFixed(2)}x ROAS over the last 7 days. What specific aspect would you like me to analyze?`;
}