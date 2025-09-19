/**
 * Automated Business Recommendations Engine
 * Generates actionable insights for business optimization
 */

import { 
  forecastInventoryDemand, 
  detectAnomalies
} from './predictiveAnalytics';
import { format, parseISO } from 'date-fns';

export interface RestockRecommendation {
  id: string;
  sku: string;
  productName: string;
  currentStock: number;
  recommendedQuantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
  estimatedStockoutDate?: string;
  confidence: number;
  potentialLostRevenue?: number;
}

export interface PricingRecommendation {
  id: string;
  sku: string;
  productName: string;
  currentPrice: number;
  recommendedPrice: number;
  priceChange: number;
  priceChangePercent: number;
  reasoning: string;
  expectedImpact: {
    revenueChange: number;
    demandChange: number;
  };
  confidence: number;
}

export interface MarketingRecommendation {
  id: string;
  type: 'campaign_optimization' | 'audience_targeting' | 'budget_allocation' | 'creative_refresh';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  expectedROI: number;
  estimatedCost?: number;
  timeframe: string;
  actionItems: string[];
}

export interface CrossSellRecommendation {
  id: string;
  primaryProduct: string;
  recommendedProducts: {
    sku: string;
    name: string;
    confidence: number;
    reason: string;
  }[];
  expectedUplift: number;
  customerSegment: string;
}

export interface BusinessInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'optimization' | 'trend';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendations?: string[];
  metrics?: {
    current: number;
    potential: number;
    unit: string;
  };
}

/**
 * Generate inventory restocking recommendations
 */
export function generateRestockRecommendations(
  products: {
    sku: string;
    name: string;
    currentStock: number;
    price: number;
    historicalSales: { date: string; quantity: number }[];
  }[]
): RestockRecommendation[] {
  const recommendations: RestockRecommendation[] = [];
  
  products.forEach(product => {
    if (product.historicalSales.length < 7) return; // Need at least a week of data
    
    const forecast = forecastInventoryDemand(product.historicalSales, 30);
    if (forecast.length === 0) return;
    
    // Calculate expected demand over next 30 days
    const totalExpectedDemand = forecast.reduce((sum, f) => sum + f.predicted, 0);
    const avgConfidence = forecast.reduce((sum, f) => sum + f.confidence, 0) / forecast.length;
    
    // Determine urgency based on stock levels and demand
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let estimatedStockoutDate: string | undefined;
    
    let cumulativeDemand = 0;
    let stockoutDay = -1;
    
    for (let i = 0; i < forecast.length; i++) {
      cumulativeDemand += forecast[i].predicted;
      if (cumulativeDemand > product.currentStock && stockoutDay === -1) {
        stockoutDay = i + 1;
        estimatedStockoutDate = forecast[i].date;
        break;
      }
    }
    
    if (stockoutDay !== -1) {
      if (stockoutDay <= 7) urgency = 'critical';
      else if (stockoutDay <= 14) urgency = 'high';
      else if (stockoutDay <= 21) urgency = 'medium';
    }
    
    // Calculate recommended quantity (safety stock + expected demand)
    const safetyStockDays = 14; // 2 weeks safety stock
    const avgDailyDemand = totalExpectedDemand / 30;
    const safetyStock = avgDailyDemand * safetyStockDays;
    const recommendedQuantity = Math.ceil(totalExpectedDemand + safetyStock - product.currentStock);
    
    if (recommendedQuantity > 0) {
      const potentialLostRevenue = stockoutDay !== -1 ? 
        (totalExpectedDemand - product.currentStock) * product.price : undefined;
      
      let reasoning = `Based on ${product.historicalSales.length} days of sales data, `;
      reasoning += `expected demand is ${Math.round(totalExpectedDemand)} units over next 30 days. `;
      if (estimatedStockoutDate) {
        reasoning += `Current stock will run out around ${format(parseISO(estimatedStockoutDate), 'MMM dd')}.`;
      }
      
      recommendations.push({
        id: `restock-${product.sku}`,
        sku: product.sku,
        productName: product.name,
        currentStock: product.currentStock,
        recommendedQuantity,
        urgency,
        reasoning,
        estimatedStockoutDate,
        confidence: avgConfidence,
        potentialLostRevenue
      });
    }
  });
  
  return recommendations.sort((a, b) => {
    const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
  });
}

/**
 * Generate pricing optimization recommendations
 */
export function generatePricingRecommendations(
  products: {
    sku: string;
    name: string;
    currentPrice: number;
    cost: number;
    historicalSales: { date: string; quantity: number; price: number }[];
    competitorPrices?: number[];
  }[]
): PricingRecommendation[] {
  const recommendations: PricingRecommendation[] = [];
  
  products.forEach(product => {
    if (product.historicalSales.length < 14) return; // Need at least 2 weeks of data
    
    // Analyze price elasticity
    const pricePoints = [...new Set(product.historicalSales.map(s => s.price))];
    if (pricePoints.length < 2) return; // Need price variation to analyze elasticity
    
    // Calculate average demand at different price points
    const priceElasticity: { price: number; avgDemand: number }[] = [];
    
    pricePoints.forEach(price => {
      const salesAtPrice = product.historicalSales.filter(s => s.price === price);
      const avgDemand = salesAtPrice.reduce((sum, s) => sum + s.quantity, 0) / salesAtPrice.length;
      priceElasticity.push({ price, avgDemand });
    });
    
    // Sort by price to analyze elasticity
    priceElasticity.sort((a, b) => a.price - b.price);
    
    // Simple elasticity calculation
    if (priceElasticity.length >= 2) {
      const minPrice = priceElasticity[0];
      const maxPrice = priceElasticity[priceElasticity.length - 1];
      
      const priceChangePercent = (maxPrice.price - minPrice.price) / minPrice.price;
      const demandChangePercent = (minPrice.avgDemand - maxPrice.avgDemand) / maxPrice.avgDemand;
      
      const elasticity = demandChangePercent / priceChangePercent;
      
      // Determine optimal price based on elasticity and margin
      const currentMargin = (product.currentPrice - product.cost) / product.currentPrice;
      const targetMargin = 0.4; // 40% target margin
      
      let recommendedPrice = product.currentPrice;
      let reasoning = '';
      
      // If margin is too low and demand is not very elastic
      if (currentMargin < targetMargin && Math.abs(elasticity) < 1.5) {
        const priceIncrease = (product.cost / (1 - targetMargin)) - product.currentPrice;
        recommendedPrice = product.currentPrice + Math.min(priceIncrease, product.currentPrice * 0.15); // Max 15% increase
        reasoning = `Low margin (${Math.round(currentMargin * 100)}%) and low price elasticity suggest room for price increase.`;
      }
      // If demand is very elastic and we're above competitor average
      else if (Math.abs(elasticity) > 2 && product.competitorPrices) {
        const avgCompetitorPrice = product.competitorPrices.reduce((a, b) => a + b, 0) / product.competitorPrices.length;
        if (product.currentPrice > avgCompetitorPrice * 1.1) {
          recommendedPrice = avgCompetitorPrice * 1.05; // 5% above competitor average
          reasoning = `High price elasticity and above-market pricing suggest price reduction to increase volume.`;
        }
      }
      
      if (Math.abs(recommendedPrice - product.currentPrice) > 0.01) {
        const priceChange = recommendedPrice - product.currentPrice;
        const priceChangePercent = (priceChange / product.currentPrice) * 100;
        
        // Estimate impact
        const estimatedDemandChange = -elasticity * priceChangePercent;
        const currentAvgDemand = product.historicalSales.reduce((sum, s) => sum + s.quantity, 0) / product.historicalSales.length;
        const newDemand = currentAvgDemand * (1 + estimatedDemandChange / 100);
        const revenueChange = (recommendedPrice * newDemand) - (product.currentPrice * currentAvgDemand);
        
        recommendations.push({
          id: `pricing-${product.sku}`,
          sku: product.sku,
          productName: product.name,
          currentPrice: product.currentPrice,
          recommendedPrice: Math.round(recommendedPrice * 100) / 100,
          priceChange: Math.round(priceChange * 100) / 100,
          priceChangePercent: Math.round(priceChangePercent * 100) / 100,
          reasoning,
          expectedImpact: {
            revenueChange: Math.round(revenueChange * 100) / 100,
            demandChange: Math.round(estimatedDemandChange * 100) / 100
          },
          confidence: Math.min(0.8, priceElasticity.length / 5) // Confidence based on data points
        });
      }
    }
  });
  
  return recommendations;
}

/**
 * Generate marketing optimization recommendations
 */
export function generateMarketingRecommendations(
  campaignData: {
    id: string;
    name: string;
    spend: number;
    revenue: number;
    clicks: number;
    impressions: number;
    conversions: number;
    isActive: boolean;
  }[]
): MarketingRecommendation[] {
  const recommendations: MarketingRecommendation[] = [];
  
  campaignData.forEach(campaign => {
    const roas = campaign.revenue / campaign.spend;
    const ctr = campaign.clicks / campaign.impressions;
    // const conversionRate = campaign.conversions / campaign.clicks;
    // const cpc = campaign.spend / campaign.clicks;
    
    // Low ROAS campaigns
    if (roas < 2 && campaign.isActive) {
      recommendations.push({
        id: `optimize-${campaign.id}`,
        type: 'campaign_optimization',
        title: `Optimize Low-Performing Campaign: ${campaign.name}`,
        description: `Campaign has ROAS of ${roas.toFixed(2)}, below the 2.0 target. Consider adjusting targeting, creative, or pausing.`,
        priority: roas < 1 ? 'high' : 'medium',
        expectedROI: 1.5,
        timeframe: '1-2 weeks',
        actionItems: [
          'Review and refine audience targeting',
          'Test new ad creative variations',
          'Adjust bidding strategy',
          'Consider pausing if ROAS remains below 1.0'
        ]
      });
    }
    
    // Low CTR campaigns
    if (ctr < 0.01 && campaign.isActive) {
      recommendations.push({
        id: `creative-${campaign.id}`,
        type: 'creative_refresh',
        title: `Refresh Creative for ${campaign.name}`,
        description: `Low CTR of ${(ctr * 100).toFixed(2)}% suggests creative fatigue. New creative could improve performance.`,
        priority: 'medium',
        expectedROI: 1.3,
        timeframe: '1 week',
        actionItems: [
          'Create new ad creative variations',
          'Test different value propositions',
          'Update product imagery',
          'A/B test headlines and descriptions'
        ]
      });
    }
    
    // High-performing campaigns for scaling
    if (roas > 3 && campaign.isActive) {
      recommendations.push({
        id: `scale-${campaign.id}`,
        type: 'budget_allocation',
        title: `Scale High-Performing Campaign: ${campaign.name}`,
        description: `Excellent ROAS of ${roas.toFixed(2)} suggests opportunity to increase budget and scale.`,
        priority: 'high',
        expectedROI: 2.5,
        estimatedCost: campaign.spend * 0.5,
        timeframe: 'Immediate',
        actionItems: [
          'Increase daily budget by 25-50%',
          'Expand to similar audiences',
          'Test lookalike audiences',
          'Monitor performance closely during scaling'
        ]
      });
    }
  });
  
  // Budget reallocation recommendation
  const totalSpend = campaignData.reduce((sum, c) => sum + c.spend, 0);
  const avgRoas = campaignData.reduce((sum, c) => sum + c.revenue, 0) / totalSpend;
  
  if (avgRoas < 2.5) {
    recommendations.push({
      id: 'budget-reallocation',
      type: 'budget_allocation',
      title: 'Reallocate Budget to High-Performing Campaigns',
      description: `Overall ROAS of ${avgRoas.toFixed(2)} can be improved by shifting budget from low to high performers.`,
      priority: 'high',
      expectedROI: 1.8,
      timeframe: '1 week',
      actionItems: [
        'Pause campaigns with ROAS < 1.5',
        'Increase budget for campaigns with ROAS > 3.0',
        'Test new campaign concepts',
        'Implement automated bidding strategies'
      ]
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Generate cross-selling recommendations using market basket analysis
 */
export function generateCrossSellRecommendations(
  orderData: {
    orderId: string;
    customerId: string;
    items: { sku: string; name: string; quantity: number }[];
  }[]
): CrossSellRecommendation[] {
  // Build item co-occurrence matrix
  const coOccurrence: Map<string, Map<string, number>> = new Map();
  const itemCounts: Map<string, number> = new Map();
  
  orderData.forEach(order => {
    const items = order.items.map(item => item.sku);
    
    // Count individual items
    items.forEach(item => {
      itemCounts.set(item, (itemCounts.get(item) || 0) + 1);
    });
    
    // Count co-occurrences
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const item1 = items[i];
        const item2 = items[j];
        
        if (!coOccurrence.has(item1)) {
          coOccurrence.set(item1, new Map());
        }
        if (!coOccurrence.has(item2)) {
          coOccurrence.set(item2, new Map());
        }
        
        const item1Map = coOccurrence.get(item1)!;
        const item2Map = coOccurrence.get(item2)!;
        
        item1Map.set(item2, (item1Map.get(item2) || 0) + 1);
        item2Map.set(item1, (item2Map.get(item1) || 0) + 1);
      }
    }
  });
  
  const recommendations: CrossSellRecommendation[] = [];
  
  // Generate recommendations for each item
  coOccurrence.forEach((relatedItems, primaryItem) => {
    const primaryCount = itemCounts.get(primaryItem) || 0;
    if (primaryCount < 5) return; // Need minimum occurrences
    
    const recommendedProducts: {
      sku: string;
      name: string;
      confidence: number;
      reason: string;
    }[] = [];
    
    relatedItems.forEach((coCount, relatedItem) => {
      const relatedCount = itemCounts.get(relatedItem) || 0;
      
      // Calculate confidence (support)
      const confidence = coCount / primaryCount;
      
      // Calculate lift
      const expectedCoOccurrence = (primaryCount * relatedCount) / orderData.length;
      const lift = coCount / expectedCoOccurrence;
      
      if (confidence > 0.1 && lift > 1.2) { // Minimum thresholds
        const itemName = orderData
          .flatMap(o => o.items)
          .find(item => item.sku === relatedItem)?.name || relatedItem;
        
        recommendedProducts.push({
          sku: relatedItem,
          name: itemName,
          confidence: Math.round(confidence * 100) / 100,
          reason: `${Math.round(confidence * 100)}% of customers who buy this also buy ${itemName}`
        });
      }
    });
    
    if (recommendedProducts.length > 0) {
      // Sort by confidence and take top 3
      recommendedProducts.sort((a, b) => b.confidence - a.confidence);
      
      const primaryName = orderData
        .flatMap(o => o.items)
        .find(item => item.sku === primaryItem)?.name || primaryItem;
      
      const avgConfidence = recommendedProducts.reduce((sum, p) => sum + p.confidence, 0) / recommendedProducts.length;
      
      recommendations.push({
        id: `cross-sell-${primaryItem}`,
        primaryProduct: primaryName,
        recommendedProducts: recommendedProducts.slice(0, 3),
        expectedUplift: Math.round(avgConfidence * 25), // Estimated % increase in order value
        customerSegment: 'all'
      });
    }
  });
  
  return recommendations.sort((a, b) => b.expectedUplift - a.expectedUplift);
}

/**
 * Generate comprehensive business insights
 */
export function generateBusinessInsights(
  salesData: { date: string; revenue: number; orders: number }[],
  productData: { sku: string; name: string; revenue: number; margin: number }[],
  customerData: { customerId: string; totalSpent: number; orderCount: number }[]
): BusinessInsight[] {
  const insights: BusinessInsight[] = [];
  
  // Revenue trend analysis
  if (salesData.length >= 14) {
    const recentRevenue = salesData.slice(-7).reduce((sum, d) => sum + d.revenue, 0);
    const previousRevenue = salesData.slice(-14, -7).reduce((sum, d) => sum + d.revenue, 0);
    const revenueChange = ((recentRevenue - previousRevenue) / previousRevenue) * 100;
    
    if (Math.abs(revenueChange) > 10) {
      insights.push({
        id: 'revenue-trend',
        type: revenueChange > 0 ? 'opportunity' : 'risk',
        title: `Revenue ${revenueChange > 0 ? 'Growth' : 'Decline'} Detected`,
        description: `Revenue has ${revenueChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(revenueChange).toFixed(1)}% compared to the previous week.`,
        impact: Math.abs(revenueChange) > 25 ? 'high' : 'medium',
        actionable: true,
        recommendations: revenueChange > 0 ? [
          'Analyze what drove the growth and replicate',
          'Consider scaling successful campaigns',
          'Ensure inventory can meet increased demand'
        ] : [
          'Investigate causes of revenue decline',
          'Review marketing campaign performance',
          'Check for inventory or pricing issues'
        ],
        metrics: {
          current: recentRevenue,
          potential: revenueChange > 0 ? recentRevenue * 1.1 : previousRevenue,
          unit: 'USD'
        }
      });
    }
  }
  
  // High-margin product opportunities
  const highMarginProducts = productData.filter(p => p.margin > 0.5).sort((a, b) => b.revenue - a.revenue);
  if (highMarginProducts.length > 0) {
    const topProduct = highMarginProducts[0];
    insights.push({
      id: 'high-margin-opportunity',
      type: 'opportunity',
      title: 'High-Margin Product Opportunity',
      description: `${topProduct.name} has a ${(topProduct.margin * 100).toFixed(1)}% margin. Focus marketing efforts on this product.`,
      impact: 'medium',
      actionable: true,
      recommendations: [
        'Increase marketing budget for high-margin products',
        'Create targeted campaigns for profitable items',
        'Consider bundling with complementary products'
      ]
    });
  }
  
  // Customer concentration risk
  const totalCustomerSpend = customerData.reduce((sum, c) => sum + c.totalSpent, 0);
  const topCustomers = customerData.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  const top5Concentration = topCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomerSpend;
  
  if (top5Concentration > 0.3) {
    insights.push({
      id: 'customer-concentration',
      type: 'risk',
      title: 'High Customer Concentration Risk',
      description: `Top 5 customers represent ${(top5Concentration * 100).toFixed(1)}% of revenue. Diversify customer base to reduce risk.`,
      impact: 'high',
      actionable: true,
      recommendations: [
        'Develop customer acquisition campaigns',
        'Create loyalty programs for smaller customers',
        'Expand into new market segments'
      ]
    });
  }
  
  // Anomaly detection in daily sales
  const dailyRevenues = salesData.map(d => d.revenue);
  const anomalies = detectAnomalies(dailyRevenues, 2);
  
  if (anomalies.length > 0) {
    const recentAnomalies = anomalies.filter(a => a.index >= dailyRevenues.length - 7);
    if (recentAnomalies.length > 0) {
      insights.push({
        id: 'sales-anomaly',
        type: 'trend',
        title: 'Unusual Sales Pattern Detected',
        description: `Detected ${recentAnomalies.length} unusual sales day(s) in the past week. Review for potential issues or opportunities.`,
        impact: 'medium',
        actionable: true,
        recommendations: [
          'Investigate causes of unusual sales patterns',
          'Check for external factors (holidays, events)',
          'Review marketing campaign timing'
        ]
      });
    }
  }
  
  return insights.sort((a, b) => {
    const impactOrder = { high: 3, medium: 2, low: 1 };
    return impactOrder[b.impact] - impactOrder[a.impact];
  });
}