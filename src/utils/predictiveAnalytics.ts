/**
 * Predictive Analytics Utilities
 * Provides machine learning capabilities for business forecasting
 */

import { format, addDays, parseISO } from 'date-fns';

export interface PredictionResult {
  value: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality?: 'high' | 'medium' | 'low';
}

export interface ForecastData {
  date: string;
  predicted: number;
  confidence: number;
  actual?: number;
}

export interface InventoryForecast {
  sku: string;
  productName: string;
  currentStock: number;
  predictedDemand: ForecastData[];
  recommendedRestock: {
    quantity: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    estimatedStockoutDate?: string;
  };
}

export interface SalesTrendAnalysis {
  period: string;
  revenue: ForecastData[];
  orders: ForecastData[];
  seasonalFactors: {
    month: number;
    factor: number;
  }[];
  trendAnalysis: {
    direction: 'up' | 'down' | 'stable';
    strength: number;
    confidence: number;
  };
}

/**
 * Simple Moving Average for trend analysis
 */
export function calculateMovingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(data[i]);
    } else {
      const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
  }
  
  return result;
}

/**
 * Exponential Smoothing for forecasting
 */
export function exponentialSmoothing(data: number[], alpha: number = 0.3): number[] {
  const result: number[] = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    const smoothed = alpha * data[i] + (1 - alpha) * result[i - 1];
    result.push(smoothed);
  }
  
  return result;
}

/**
 * Linear regression for trend analysis
 */
export function linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  // const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared
  const yMean = sumY / n;
  const ssRes = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const r2 = 1 - (ssRes / ssTot);
  
  return { slope, intercept, r2 };
}

/**
 * Seasonal decomposition
 */
export function detectSeasonality(data: number[], period: number = 12): number[] {
  const seasonalFactors: number[] = new Array(period).fill(0);
  const counts: number[] = new Array(period).fill(0);
  
  // Calculate average for each seasonal period
  data.forEach((value, index) => {
    const seasonIndex = index % period;
    seasonalFactors[seasonIndex] += value;
    counts[seasonIndex]++;
  });
  
  // Normalize seasonal factors
  const overallMean = data.reduce((a, b) => a + b, 0) / data.length;
  return seasonalFactors.map((sum, i) => {
    const seasonMean = counts[i] > 0 ? sum / counts[i] : overallMean;
    return seasonMean / overallMean;
  });
}

/**
 * Forecast inventory demand
 */
export function forecastInventoryDemand(
  historicalData: { date: string; quantity: number }[],
  daysToForecast: number = 30
): ForecastData[] {
  if (historicalData.length < 7) {
    // Not enough data for reliable forecasting
    return [];
  }
  
  const quantities = historicalData.map(d => d.quantity);
  const smoothed = exponentialSmoothing(quantities, 0.3);
  
  // Calculate trend
  const x = quantities.map((_, i) => i);
  const { slope, intercept, r2 } = linearRegression(x, smoothed);
  
  // Generate forecasts
  const forecasts: ForecastData[] = [];
  const lastDate = parseISO(historicalData[historicalData.length - 1].date);
  
  for (let i = 1; i <= daysToForecast; i++) {
    const futureIndex = historicalData.length + i - 1;
    const predicted = Math.max(0, slope * futureIndex + intercept);
    const confidence = Math.min(0.95, Math.max(0.1, r2 * 0.9)); // Confidence based on R²
    
    forecasts.push({
      date: format(addDays(lastDate, i), 'yyyy-MM-dd'),
      predicted: Math.round(predicted * 100) / 100,
      confidence: Math.round(confidence * 100) / 100
    });
  }
  
  return forecasts;
}

/**
 * Forecast sales trends
 */
export function forecastSalesTrends(
  historicalSales: { date: string; revenue: number; orders: number }[],
  daysToForecast: number = 30
): SalesTrendAnalysis {
  const revenues = historicalSales.map(d => d.revenue);
  // const orders = historicalSales.map(d => d.orders);
  
  // Detect seasonality (monthly)
  const seasonalFactors = detectSeasonality(revenues, 30).map((factor, index) => ({
    month: index + 1,
    factor: Math.round(factor * 100) / 100
  }));
  
  // Forecast revenue
  const revenueForecasts = forecastInventoryDemand(
    historicalSales.map(d => ({ date: d.date, quantity: d.revenue })),
    daysToForecast
  ).map(f => ({ ...f, predicted: f.predicted, confidence: f.confidence }));
  
  // Forecast orders
  const orderForecasts = forecastInventoryDemand(
    historicalSales.map(d => ({ date: d.date, quantity: d.orders })),
    daysToForecast
  ).map(f => ({ ...f, predicted: Math.round(f.predicted), confidence: f.confidence }));
  
  // Trend analysis
  const x = revenues.map((_, i) => i);
  const { slope, r2 } = linearRegression(x, revenues);
  
  const trendDirection = slope > 0.01 ? 'up' : slope < -0.01 ? 'down' : 'stable';
  const trendStrength = Math.abs(slope) / (revenues.reduce((a, b) => a + b, 0) / revenues.length);
  
  return {
    period: `${format(parseISO(historicalSales[0].date), 'MMM dd')} - ${format(parseISO(historicalSales[historicalSales.length - 1].date), 'MMM dd')}`,
    revenue: revenueForecasts,
    orders: orderForecasts,
    seasonalFactors,
    trendAnalysis: {
      direction: trendDirection,
      strength: Math.round(trendStrength * 1000) / 1000,
      confidence: Math.round(r2 * 100) / 100
    }
  };
}

/**
 * Calculate customer lifetime value prediction
 */
export function predictCustomerLifetimeValue(
  customerData: {
    customerId: string;
    orders: { date: string; value: number }[];
    firstOrderDate: string;
  }[]
): { customerId: string; predictedCLV: number; confidence: number; segment: string }[] {
  return customerData.map(customer => {
    const { orders, firstOrderDate } = customer;
    
    if (orders.length === 0) {
      return {
        customerId: customer.customerId,
        predictedCLV: 0,
        confidence: 0,
        segment: 'inactive'
      };
    }
    
    // Calculate metrics
    const totalValue = orders.reduce((sum, order) => sum + order.value, 0);
    const avgOrderValue = totalValue / orders.length;
    const daysSinceFirst = Math.max(1, (Date.now() - parseISO(firstOrderDate).getTime()) / (1000 * 60 * 60 * 24));
    const orderFrequency = orders.length / (daysSinceFirst / 365); // orders per year
    
    // Simple CLV prediction (can be enhanced with more sophisticated models)
    const predictedLifespan = Math.min(5, Math.max(1, orderFrequency * 2)); // years
    const predictedCLV = avgOrderValue * orderFrequency * predictedLifespan;
    
    // Confidence based on data quality
    const confidence = Math.min(0.9, Math.max(0.1, orders.length / 10));
    
    // Customer segmentation
    let segment = 'low-value';
    if (predictedCLV > 1000) segment = 'high-value';
    else if (predictedCLV > 500) segment = 'medium-value';
    
    return {
      customerId: customer.customerId,
      predictedCLV: Math.round(predictedCLV * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      segment
    };
  });
}

/**
 * Anomaly detection using statistical methods
 */
export function detectAnomalies(
  data: number[],
  threshold: number = 2.5
): { index: number; value: number; severity: 'low' | 'medium' | 'high' }[] {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  const anomalies: { index: number; value: number; severity: 'low' | 'medium' | 'high' }[] = [];
  
  data.forEach((value, index) => {
    const zScore = Math.abs((value - mean) / stdDev);
    
    if (zScore > threshold) {
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (zScore > threshold * 1.5) severity = 'medium';
      if (zScore > threshold * 2) severity = 'high';
      
      anomalies.push({ index, value, severity });
    }
  });
  
  return anomalies;
}