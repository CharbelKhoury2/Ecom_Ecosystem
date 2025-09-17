import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
}

// Enhanced Supabase client with timeout
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
    },
  },
});

// Connection test function
async function testConnection() {
  try {
    const { error } = await supabase
      .from('alerts')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

// Retry wrapper
async function withRetry(operation, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
}

// Test endpoint to verify database connection
router.get('/database-test', async (req, res) => {
  try {
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      return res.json({
        success: false,
        message: 'Database connection failed',
        warning: 'Database is not accessible',
        data: {
          products: 0,
          orders: 0,
          campaigns: 0,
          alerts: 0,
          shipments: 0
        },
        mock_data: {
          products: [{ id: 'mock-1', name: 'Mock Product' }],
          orders: [{ id: 'mock-1', total: 100 }],
          campaigns: [{ id: 'mock-1', name: 'Mock Campaign' }],
          alerts: [{ id: 'mock-1', type: 'Mock Alert' }],
          shipments: [{ id: 'mock-1', status: 'Mock Shipment' }]
        }
      });
    }

    // Test database tables with retry logic
    const results = await withRetry(async () => {
      const [products, orders, campaigns, alerts, shipments] = await Promise.allSettled([
        supabase.from('products').select('*').limit(5),
        supabase.from('shopify_orders').select('*').limit(5),
        supabase.from('meta_campaigns').select('*').limit(5),
        supabase.from('alerts').select('*').limit(5),
        supabase.from('shipments').select('*').limit(5)
      ]);

      return {
        products: products.status === 'fulfilled' ? products.value.data : [],
        orders: orders.status === 'fulfilled' ? orders.value.data : [],
        campaigns: campaigns.status === 'fulfilled' ? campaigns.value.data : [],
        alerts: alerts.status === 'fulfilled' ? alerts.value.data : [],
        shipments: shipments.status === 'fulfilled' ? shipments.value.data : []
      };
    });
    
    res.json({
      success: true,
      message: 'Database connection successful',
      data: {
        products: results.products?.length || 0,
        orders: results.orders?.length || 0,
        campaigns: results.campaigns?.length || 0,
        alerts: results.alerts?.length || 0,
        shipments: results.shipments?.length || 0
      },
      sample_data: {
        products: results.products?.slice(0, 2),
        orders: results.orders?.slice(0, 2),
        campaigns: results.campaigns?.slice(0, 2),
        alerts: results.alerts?.slice(0, 2),
        shipments: results.shipments?.slice(0, 2)
      }
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    res.json({
      success: false,
      message: 'Database test completed with errors',
      error: error.message,
      warning: 'Some database operations failed, but system is partially functional',
      data: {
        products: 0,
        orders: 0,
        campaigns: 0,
        alerts: 0,
        shipments: 0
      }
    });
  }
});

// Analytics endpoint for dashboard
router.get('/analytics', async (req, res) => {
  try {
    // Get sales data for last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const { data: salesData, error: salesError } = await supabase
      .from('shopify_orders')
      .select('*')
      .gte('date_created', fourteenDaysAgo.toISOString());
    
    if (salesError) throw salesError;
    
    // Get campaign performance
    const { data: campaignData, error: campaignError } = await supabase
      .from('meta_campaigns')
      .select('*');
    
    if (campaignError) throw campaignError;
    
    // Calculate metrics
    const totalRevenue = salesData?.reduce((sum, order) => sum + parseFloat(order.revenue || 0), 0) || 0;
    const totalSpend = campaignData?.reduce((sum, campaign) => sum + parseFloat(campaign.total_spend || 0), 0) || 0;
    const totalOrders = salesData?.length || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    res.json({
      success: true,
      analytics: {
        totalRevenue: totalRevenue.toFixed(2),
        totalSpend: totalSpend.toFixed(2),
        totalOrders,
        avgOrderValue: avgOrderValue.toFixed(2),
        grossProfit: (totalRevenue - totalSpend).toFixed(2),
        roas: totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : '0.00'
      },
      period: 'Last 14 days'
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;