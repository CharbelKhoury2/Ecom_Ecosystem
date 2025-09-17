// Real-time Data API Endpoint
import realTimeDataService from '../services/realTimeDataService.js';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const dataType = url.searchParams.get('type') || 'dashboard';
    const days = parseInt(url.searchParams.get('days') || '30');
    const metricType = url.searchParams.get('metric');

    let data;

    switch (dataType) {
      case 'sales':
        data = await realTimeDataService.getSalesData();
        break;
      case 'inventory':
        data = await realTimeDataService.getInventoryData();
        break;
      case 'marketing':
        data = await realTimeDataService.getMarketingData();
        break;
      case 'analytics':
        data = await realTimeDataService.getShopifyAnalytics(days);
        break;
      case 'alerts':
        data = await realTimeDataService.getRealTimeAlerts();
        break;
      case 'freshness':
        data = realTimeDataService.getDataFreshness();
        break;
      case 'connection':
        data = await realTimeDataService.testShopifyConnection();
        break;
      case 'metric':
        if (metricType) {
          data = await realTimeDataService.getMetricData(metricType);
        } else {
          data = { error: 'Metric type required when using metric data type' };
        }
        break;
      case 'dashboard':
      default:
        data = await realTimeDataService.getDashboardData();
        break;
    }

    return new Response(
      JSON.stringify({
        success: true,
        dataType,
        data,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        } 
      }
    );
  } catch (error) {
    console.error('Real-time data API error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to fetch real-time data',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

export async function POST(request) {
  try {
    const { action, key } = await request.json();

    let result;

    switch (action) {
      case 'clearCache':
        realTimeDataService.clearCache(key);
        result = { message: key ? `Cache cleared for ${key}` : 'All cache cleared' };
        break;
      case 'refreshData':
        realTimeDataService.simulateRealTimeUpdate();
        result = { message: 'Data refresh triggered' };
        break;
      case 'testConnection':
        result = await realTimeDataService.testShopifyConnection();
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        result,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Real-time data action error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to execute action',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}