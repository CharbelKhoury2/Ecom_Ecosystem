import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const router = express.Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test endpoint to verify database connection
router.get('/database-test', async (req, res) => {
  try {
    // Test products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    if (productsError) {
      throw productsError;
    }
    
    // Test orders
    const { data: orders, error: ordersError } = await supabase
      .from('shopify_orders')
      .select('*')
      .limit(5);
    
    if (ordersError) {
      throw ordersError;
    }
    
    // Test campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('meta_campaigns')
      .select('*')
      .limit(5);
    
    if (campaignsError) {
      throw campaignsError;
    }
    
    // Test alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .limit(5);
    
    if (alertsError) {
      throw alertsError;
    }
    
    // Test shipments
    const { data: shipments, error: shipmentsError } = await supabase
      .from('shipments')
      .select('*')
      .limit(5);
    
    if (shipmentsError) {
      throw shipmentsError;
    }
    
    res.json({
      success: true,
      message: 'Database connection successful',
      data: {
        products: products?.length || 0,
        orders: orders?.length || 0,
        campaigns: campaigns?.length || 0,
        alerts: alerts?.length || 0,
        shipments: shipments?.length || 0
      },
      sample_data: {
        products: products?.slice(0, 2),
        orders: orders?.slice(0, 2),
        campaigns: campaigns?.slice(0, 2),
        alerts: alerts?.slice(0, 2),
        shipments: shipments?.slice(0, 2)
      }
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error
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