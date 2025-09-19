/**
 * Enhanced AI Service with Machine Learning Integration
 * Provides advanced predictive analytics and business intelligence
 */

import {
  forecastSalesTrends,
  forecastInventoryDemand,
  predictCustomerLifetimeValue,
  detectAnomalies,
  ForecastData
} from '../utils/predictiveAnalytics';
import {
  generateRestockRecommendations,
  generatePricingRecommendations,
  generateMarketingRecommendations,
  generateCrossSellRecommendations,
  generateBusinessInsights,
  RestockRecommendation,
  PricingRecommendation,
  MarketingRecommendation,
  CrossSellRecommendation,
  BusinessInsight
} from '../utils/recommendationEngine';
import { format, subDays, addDays } from 'date-fns';

export interface AIInsight {
  id: string;
  type: 'predictive' | 'recommendation' | 'alert' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  data?: any;
  timestamp: string;
}

export interface ProactiveAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  category: 'inventory' | 'sales' | 'marketing' | 'customer' | 'financial';
  actionRequired: boolean;
  suggestedActions?: string[];
  timestamp: string;
}

export interface AutomatedReport {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  sections: {
    title: string;
    content: string;
    charts?: any[];
    insights?: AIInsight[];
  }[];
  generatedAt: string;
  keyFindings: string[];
  recommendations: string[];
}

export interface CohortAnalysis {
  cohortMonth: string;
  customersAcquired: number;
  retentionRates: { month: number; rate: number; customers: number }[];
  lifetimeValue: number;
  averageOrderValue: number;
}

export interface RFMAnalysis {
  customerId: string;
  recency: number; // Days since last purchase
  frequency: number; // Number of purchases
  monetary: number; // Total spent
  rfmScore: string; // e.g., "555" for best customers
  segment: 'Champions' | 'Loyal Customers' | 'Potential Loyalists' | 'New Customers' | 'Promising' | 'Need Attention' | 'About to Sleep' | 'At Risk' | 'Cannot Lose Them' | 'Hibernating' | 'Lost';
  recommendations: string[];
}

export interface MarketBasketAnalysis {
  itemA: string;
  itemB: string;
  support: number; // Frequency of itemset
  confidence: number; // Likelihood of B given A
  lift: number; // Strength of association
  conviction: number; // Dependency measure
}

class EnhancedAIService {
  private insights: AIInsight[] = [];
  private alerts: ProactiveAlert[] = [];
  private reports: AutomatedReport[] = [];

  /**
   * Generate comprehensive AI insights for the dashboard
   */
  async generateAIInsights(data: {
    salesData: { date: string; revenue: number; orders: number }[];
    productData: { sku: string; name: string; revenue: number; margin: number; sales: number; cost: number; currentStock: number; historicalSales: { date: string; quantity: number; price?: number }[] }[];
    customerData: { customerId: string; totalSpent: number; orderCount: number; lastOrder: string }[];
    marketingData: { id: string; name: string; spend: number; revenue: number; clicks: number; impressions: number; conversions: number; isActive: boolean }[];
    orderData: { orderId: string; customerId: string; items: { sku: string; name: string; quantity: number }[] }[];
  }): Promise<{
    insights: AIInsight[];
    alerts: ProactiveAlert[];
    recommendations: {
      restock: RestockRecommendation[];
      pricing: PricingRecommendation[];
      marketing: MarketingRecommendation[];
      crossSell: CrossSellRecommendation[];
    };
  }> {
    const insights: AIInsight[] = [];
    const alerts: ProactiveAlert[] = [];

    // Generate sales forecasts
    const salesForecast = forecastSalesTrends(
      data.salesData.map(d => ({ date: d.date, quantity: d.revenue / 100 })),
      14
    );

    if (salesForecast.length > 0) {
      const avgConfidence = salesForecast.reduce((sum, f) => sum + f.confidence, 0) / salesForecast.length;
      const totalPredicted = salesForecast.reduce((sum, f) => sum + f.predicted, 0);
      const currentTotal = data.salesData.slice(-14).reduce((sum, d) => sum + d.revenue / 100, 0);
      const growthPrediction = ((totalPredicted - currentTotal) / currentTotal) * 100;

      insights.push({
        id: 'sales-forecast',
        type: 'predictive',
        title: 'Sales Forecast Analysis',
        description: `AI predicts ${growthPrediction > 0 ? 'growth' : 'decline'} of ${Math.abs(growthPrediction).toFixed(1)}% over next 14 days`,
        confidence: avgConfidence,
        impact: Math.abs(growthPrediction) > 15 ? 'high' : Math.abs(growthPrediction) > 5 ? 'medium' : 'low',
        actionable: true,
        data: salesForecast,
        timestamp: new Date().toISOString()
      });

      if (growthPrediction < -10) {
        alerts.push({
          id: 'sales-decline-alert',
          severity: 'warning',
          title: 'Predicted Sales Decline',
          message: `AI models predict a ${Math.abs(growthPrediction).toFixed(1)}% decline in sales over the next 2 weeks`,
          category: 'sales',
          actionRequired: true,
          suggestedActions: [
            'Review marketing campaigns',
            'Check inventory levels',
            'Analyze competitor activity',
            'Consider promotional strategies'
          ],
          timestamp: new Date().toISOString()
        });
      }
    }

    // Anomaly detection
    const revenues = data.salesData.map(d => d.revenue);
    const anomalies = detectAnomalies(revenues, 2);
    const recentAnomalies = anomalies.filter(a => a.index >= revenues.length - 7);

    if (recentAnomalies.length > 0) {
      insights.push({
        id: 'anomaly-detection',
        type: 'alert',
        title: 'Sales Anomalies Detected',
        description: `${recentAnomalies.length} unusual sales pattern(s) detected in the past week`,
        confidence: 0.85,
        impact: 'medium',
        actionable: true,
        data: recentAnomalies,
        timestamp: new Date().toISOString()
      });

      if (recentAnomalies.some(a => a.severity > 2.5)) {
        alerts.push({
          id: 'high-anomaly-alert',
          severity: 'critical',
          title: 'Significant Sales Anomaly',
          message: 'Detected unusual sales patterns that require immediate attention',
          category: 'sales',
          actionRequired: true,
          suggestedActions: [
            'Investigate data quality issues',
            'Check for external factors',
            'Review recent changes to website or pricing',
            'Analyze customer feedback'
          ],
          timestamp: new Date().toISOString()
        });
      }
    }

    // Customer lifetime value predictions
    const clvPredictions = data.customerData.map(customer => {
      const prediction = predictCustomerLifetimeValue({
        totalSpent: customer.totalSpent,
        orderCount: customer.orderCount,
        daysSinceLastOrder: Math.floor((new Date().getTime() - new Date(customer.lastOrder).getTime()) / (1000 * 60 * 60 * 24))
      });
      return { ...customer, predictedCLV: prediction };
    });

    const highValueCustomers = clvPredictions.filter(c => c.predictedCLV > 5000).length;
    const atRiskCustomers = clvPredictions.filter(c => {
      const daysSinceLastOrder = Math.floor((new Date().getTime() - new Date(c.lastOrder).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceLastOrder > 90 && c.predictedCLV > 1000;
    }).length;

    insights.push({
      id: 'clv-analysis',
      type: 'predictive',
      title: 'Customer Value Analysis',
      description: `${highValueCustomers} high-value customers identified, ${atRiskCustomers} at-risk customers need attention`,
      confidence: 0.78,
      impact: 'high',
      actionable: true,
      data: clvPredictions,
      timestamp: new Date().toISOString()
    });

    if (atRiskCustomers > 0) {
      alerts.push({
        id: 'customer-churn-risk',
        severity: 'warning',
        title: 'Customer Churn Risk',
        message: `${atRiskCustomers} high-value customers haven't purchased in 90+ days`,
        category: 'customer',
        actionRequired: true,
        suggestedActions: [
          'Launch win-back email campaign',
          'Offer personalized discounts',
          'Conduct customer satisfaction survey',
          'Provide exclusive early access to new products'
        ],
        timestamp: new Date().toISOString()
      });
    }

    // Generate recommendations
    const restockRecommendations = generateRestockRecommendations(
      data.productData.map(p => ({
        sku: p.sku,
        name: p.name,
        currentStock: p.currentStock,
        price: p.revenue / p.sales,
        historicalSales: p.historicalSales
      }))
    );

    const pricingRecommendations = generatePricingRecommendations(
      data.productData.map(p => ({
        sku: p.sku,
        name: p.name,
        currentPrice: p.revenue / p.sales,
        cost: p.cost,
        historicalSales: p.historicalSales.map(h => ({
          date: h.date,
          quantity: h.quantity,
          price: h.price || p.revenue / p.sales
        }))
      }))
    );

    const marketingRecommendations = generateMarketingRecommendations(data.marketingData);
    const crossSellRecommendations = generateCrossSellRecommendations(data.orderData);

    // Critical inventory alerts
    const criticalStock = restockRecommendations.filter(r => r.urgency === 'critical');
    if (criticalStock.length > 0) {
      alerts.push({
        id: 'critical-inventory',
        severity: 'critical',
        title: 'Critical Inventory Levels',
        message: `${criticalStock.length} product(s) will stock out within 7 days`,
        category: 'inventory',
        actionRequired: true,
        suggestedActions: [
          'Place emergency orders immediately',
          'Contact suppliers for expedited delivery',
          'Consider temporary product substitutions',
          'Update website with stock availability'
        ],
        timestamp: new Date().toISOString()
      });
    }

    this.insights = insights;
    this.alerts = alerts;

    return {
      insights,
      alerts,
      recommendations: {
        restock: restockRecommendations,
        pricing: pricingRecommendations,
        marketing: marketingRecommendations,
        crossSell: crossSellRecommendations
      }
    };
  }

  /**
   * Generate automated business reports
   */
  async generateAutomatedReport(
    type: 'daily' | 'weekly' | 'monthly',
    data: any
  ): Promise<AutomatedReport> {
    const reportId = `${type}-report-${Date.now()}`;
    const now = new Date();
    
    const report: AutomatedReport = {
      id: reportId,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Business Report`,
      type,
      sections: [],
      generatedAt: now.toISOString(),
      keyFindings: [],
      recommendations: []
    };

    // Executive Summary
    const insights = await this.generateAIInsights(data);
    const totalRevenue = data.salesData.reduce((sum: number, d: any) => sum + d.revenue, 0);
    const totalOrders = data.salesData.reduce((sum: number, d: any) => sum + d.orders, 0);
    const avgOrderValue = totalRevenue / totalOrders;

    report.sections.push({
      title: 'Executive Summary',
      content: `This ${type} report covers performance metrics and AI-driven insights. Total revenue: $${totalRevenue.toLocaleString()}, Orders: ${totalOrders.toLocaleString()}, AOV: $${avgOrderValue.toFixed(2)}.`,
      insights: insights.insights.slice(0, 3)
    });

    // Sales Performance
    const salesGrowth = this.calculateGrowthRate(data.salesData, 'revenue');
    report.sections.push({
      title: 'Sales Performance',
      content: `Sales ${salesGrowth > 0 ? 'increased' : 'decreased'} by ${Math.abs(salesGrowth).toFixed(1)}% compared to the previous period. ${insights.insights.find(i => i.type === 'predictive')?.description || ''}`
    });

    // Key Findings
    report.keyFindings = [
      `Revenue trend: ${salesGrowth > 0 ? 'Positive' : 'Negative'} ${Math.abs(salesGrowth).toFixed(1)}%`,
      `AI detected ${insights.insights.length} actionable insights`,
      `${insights.alerts.length} alerts require attention`,
      `${insights.recommendations.restock.length} products need restocking`
    ];

    // Recommendations
    report.recommendations = [
      ...insights.recommendations.marketing.slice(0, 2).map(r => r.title),
      ...insights.recommendations.restock.slice(0, 2).map(r => `Restock ${r.productName}`),
      ...insights.alerts.slice(0, 2).map(a => a.title)
    ];

    this.reports.push(report);
    return report;
  }

  /**
   * Perform cohort analysis
   */
  performCohortAnalysis(
    customerData: { customerId: string; firstOrderDate: string; orders: { date: string; amount: number }[] }[]
  ): CohortAnalysis[] {
    const cohorts: Map<string, CohortAnalysis> = new Map();

    customerData.forEach(customer => {
      const cohortMonth = format(new Date(customer.firstOrderDate), 'yyyy-MM');
      
      if (!cohorts.has(cohortMonth)) {
        cohorts.set(cohortMonth, {
          cohortMonth,
          customersAcquired: 0,
          retentionRates: [],
          lifetimeValue: 0,
          averageOrderValue: 0
        });
      }

      const cohort = cohorts.get(cohortMonth)!;
      cohort.customersAcquired++;
      
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.amount, 0);
      cohort.lifetimeValue += totalSpent;
      cohort.averageOrderValue += totalSpent / customer.orders.length;
    });

    // Calculate retention rates for each cohort
    cohorts.forEach((cohort, cohortMonth) => {
      const cohortCustomers = customerData.filter(c => 
        format(new Date(c.firstOrderDate), 'yyyy-MM') === cohortMonth
      );

      for (let month = 0; month < 12; month++) {
        const targetMonth = addDays(new Date(cohortMonth + '-01'), month * 30);
        const activeCustomers = cohortCustomers.filter(customer => 
          customer.orders.some(order => 
            new Date(order.date) >= targetMonth && 
            new Date(order.date) < addDays(targetMonth, 30)
          )
        ).length;

        cohort.retentionRates.push({
          month,
          rate: (activeCustomers / cohort.customersAcquired) * 100,
          customers: activeCustomers
        });
      }

      cohort.lifetimeValue /= cohort.customersAcquired;
      cohort.averageOrderValue /= cohort.customersAcquired;
    });

    return Array.from(cohorts.values());
  }

  /**
   * Perform RFM analysis
   */
  performRFMAnalysis(
    customerData: { customerId: string; orders: { date: string; amount: number }[] }[]
  ): RFMAnalysis[] {
    const now = new Date();
    const rfmData: RFMAnalysis[] = [];

    customerData.forEach(customer => {
      if (customer.orders.length === 0) return;

      // Calculate Recency (days since last order)
      const lastOrderDate = new Date(Math.max(...customer.orders.map(o => new Date(o.date).getTime())));
      const recency = Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate Frequency (number of orders)
      const frequency = customer.orders.length;

      // Calculate Monetary (total spent)
      const monetary = customer.orders.reduce((sum, order) => sum + order.amount, 0);

      // Score each dimension (1-5 scale)
      const recencyScore = recency <= 30 ? 5 : recency <= 90 ? 4 : recency <= 180 ? 3 : recency <= 365 ? 2 : 1;
      const frequencyScore = frequency >= 10 ? 5 : frequency >= 5 ? 4 : frequency >= 3 ? 3 : frequency >= 2 ? 2 : 1;
      const monetaryScore = monetary >= 5000 ? 5 : monetary >= 2000 ? 4 : monetary >= 1000 ? 3 : monetary >= 500 ? 2 : 1;

      const rfmScore = `${recencyScore}${frequencyScore}${monetaryScore}`;

      // Determine segment
      let segment: RFMAnalysis['segment'];
      const totalScore = recencyScore + frequencyScore + monetaryScore;

      if (totalScore >= 13) segment = 'Champions';
      else if (totalScore >= 11) segment = 'Loyal Customers';
      else if (recencyScore >= 4 && frequencyScore <= 2) segment = 'New Customers';
      else if (recencyScore >= 3 && frequencyScore >= 3) segment = 'Potential Loyalists';
      else if (recencyScore >= 3 && frequencyScore <= 2) segment = 'Promising';
      else if (recencyScore <= 2 && frequencyScore >= 3) segment = 'Need Attention';
      else if (recencyScore <= 2 && frequencyScore === 2) segment = 'About to Sleep';
      else if (recencyScore <= 2 && monetaryScore >= 4) segment = 'Cannot Lose Them';
      else if (recencyScore === 1 && frequencyScore >= 2) segment = 'At Risk';
      else if (recencyScore === 1 && frequencyScore === 1 && monetaryScore >= 3) segment = 'Hibernating';
      else segment = 'Lost';

      // Generate recommendations based on segment
      const recommendations = this.getRFMRecommendations(segment);

      rfmData.push({
        customerId: customer.customerId,
        recency,
        frequency,
        monetary,
        rfmScore,
        segment,
        recommendations
      });
    });

    return rfmData;
  }

  /**
   * Perform market basket analysis
   */
  performMarketBasketAnalysis(
    orderData: { orderId: string; items: { sku: string; name: string }[] }[]
  ): MarketBasketAnalysis[] {
    const itemCounts: Map<string, number> = new Map();
    const pairCounts: Map<string, number> = new Map();
    const totalTransactions = orderData.length;

    // Count individual items and pairs
    orderData.forEach(order => {
      const items = order.items.map(item => item.sku);
      
      // Count individual items
      items.forEach(item => {
        itemCounts.set(item, (itemCounts.get(item) || 0) + 1);
      });

      // Count pairs
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const pair = [items[i], items[j]].sort().join('|');
          pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
        }
      }
    });

    const analysis: MarketBasketAnalysis[] = [];

    pairCounts.forEach((pairCount, pairKey) => {
      const [itemA, itemB] = pairKey.split('|');
      const itemACount = itemCounts.get(itemA) || 0;
      const itemBCount = itemCounts.get(itemB) || 0;

      const support = pairCount / totalTransactions;
      const confidence = pairCount / itemACount;
      const lift = (pairCount * totalTransactions) / (itemACount * itemBCount);
      const conviction = (1 - (itemBCount / totalTransactions)) / (1 - confidence);

      if (support >= 0.01 && confidence >= 0.1 && lift > 1) { // Minimum thresholds
        analysis.push({
          itemA,
          itemB,
          support,
          confidence,
          lift,
          conviction
        });
      }
    });

    return analysis.sort((a, b) => b.lift - a.lift);
  }

  private calculateGrowthRate(data: any[], metric: string): number {
    if (data.length < 2) return 0;
    
    const midPoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midPoint).reduce((sum, d) => sum + d[metric], 0);
    const secondHalf = data.slice(midPoint).reduce((sum, d) => sum + d[metric], 0);
    
    return ((secondHalf - firstHalf) / firstHalf) * 100;
  }

  private getRFMRecommendations(segment: RFMAnalysis['segment']): string[] {
    const recommendations: Record<RFMAnalysis['segment'], string[]> = {
      'Champions': ['Reward them', 'Ask for reviews', 'Upsell premium products'],
      'Loyal Customers': ['Upsell higher value products', 'Ask for reviews', 'Engage them'],
      'Potential Loyalists': ['Offer membership/loyalty program', 'Recommend other products'],
      'New Customers': ['Provide onboarding support', 'Start building relationship'],
      'Promising': ['Offer free shipping', 'Provide social proof'],
      'Need Attention': ['Make limited time offers', 'Recommend based on past purchases'],
      'About to Sleep': ['Share valuable resources', 'Recommend popular products'],
      'At Risk': ['Send personalized emails', 'Offer discounts', 'Provide helpful resources'],
      'Cannot Lose Them': ['Win them back via renewals', 'Provide helpful resources'],
      'Hibernating': ['Offer other product categories', 'Use different channels'],
      'Lost': ['Revive interest with reach out campaign', 'Ignore otherwise']
    };

    return recommendations[segment] || [];
  }

  // Getters for accessing stored data
  getInsights(): AIInsight[] {
    return this.insights;
  }

  getAlerts(): ProactiveAlert[] {
    return this.alerts;
  }

  getReports(): AutomatedReport[] {
    return this.reports;
  }
}

export const enhancedAIService = new EnhancedAIService();
export default enhancedAIService;