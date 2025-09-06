import express from 'express';
import realTimeDataService from '../services/realTimeDataService.js';

const router = express.Router();

// Get comprehensive dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const dashboardData = await realTimeDataService.getDashboardData();
    
    res.json({
      data: dashboardData,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message,
      timestamp: new Date().toISOString(),
      success: false
    });
  }
});

// Get real-time sales data
router.get('/sales', async (req, res) => {
  try {
    const salesData = await realTimeDataService.getSalesData();
    
    res.json({
      data: salesData,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({
      error: 'Failed to fetch sales data',
      message: error.message,
      timestamp: new Date().toISOString(),
      success: false
    });
  }
});

// Get real-time inventory data
router.get('/inventory', async (req, res) => {
  try {
    const inventoryData = await realTimeDataService.getInventoryData();
    
    res.json({
      data: inventoryData,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching inventory data:', error);
    res.status(500).json({
      error: 'Failed to fetch inventory data',
      message: error.message,
      timestamp: new Date().toISOString(),
      success: false
    });
  }
});

// Get real-time marketing data
router.get('/marketing', async (req, res) => {
  try {
    const marketingData = await realTimeDataService.getMarketingData();
    
    res.json({
      data: marketingData,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching marketing data:', error);
    res.status(500).json({
      error: 'Failed to fetch marketing data',
      message: error.message,
      timestamp: new Date().toISOString(),
      success: false
    });
  }
});

// Get Shopify data
router.get('/shopify', async (req, res) => {
  try {
    const shopifyData = await realTimeDataService.getShopifyData();
    
    res.json({
      data: shopifyData,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching Shopify data:', error);
    res.status(500).json({
      error: 'Failed to fetch Shopify data',
      message: error.message,
      timestamp: new Date().toISOString(),
      success: false
    });
  }
});

// Get Meta Ads data
router.get('/meta-ads', async (req, res) => {
  try {
    const metaAdsData = await realTimeDataService.getMetaAdsData();
    
    res.json({
      data: metaAdsData,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching Meta Ads data:', error);
    res.status(500).json({
      error: 'Failed to fetch Meta Ads data',
      message: error.message,
      timestamp: new Date().toISOString(),
      success: false
    });
  }
});

// Get Supabase analytics
router.get('/analytics', async (req, res) => {
  try {
    const analyticsData = await realTimeDataService.getSupabaseAnalytics();
    
    res.json({
      data: analyticsData,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics data',
      message: error.message,
      timestamp: new Date().toISOString(),
      success: false
    });
  }
});

// Health check for all services
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await realTimeDataService.healthCheck();
    
    res.json({
      health: healthStatus,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error checking service health:', error);
    res.status(500).json({
      error: 'Failed to check service health',
      message: error.message,
      timestamp: new Date().toISOString(),
      success: false
    });
  }
});

// Clear cache endpoint
router.post('/cache/clear', (req, res) => {
  try {
    realTimeDataService.clearCache();
    
    res.json({
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message,
      timestamp: new Date().toISOString(),
      success: false
    });
  }
});

// Webhook endpoint for real-time updates (placeholder)
router.post('/webhook/:service', (req, res) => {
  try {
    const { service } = req.params;
    const payload = req.body;
    
    console.log(`Received webhook from ${service}:`, payload);
    
    // Clear relevant cache when data updates
    realTimeDataService.clearCache();
    
    res.json({
      message: `Webhook received from ${service}`,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      error: 'Failed to process webhook',
      message: error.message,
      timestamp: new Date().toISOString(),
      success: false
    });
  }
});

// Test endpoint for AI Copilot with real-time data
router.post('/test/ai-query', async (req, res) => {
  try {
    const { query, userId = 'test_user' } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Query is required',
        timestamp: new Date().toISOString(),
        success: false
      });
    }
    
    // Import AI service dynamically to avoid circular dependencies
    const { default: aiService } = await import('../services/aiService.js');
    
    // Generate AI response with real-time data
    const response = await aiService.generateEnhancedResponse(query, userId, {
      testMode: true,
      realTimeDataEnabled: true
    });
    
    res.json({
      query,
      response,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error testing AI query:', error);
    res.status(500).json({
      error: 'Failed to process AI query',
      message: error.message,
      timestamp: new Date().toISOString(),
      success: false
    });
  }
});

export default router;