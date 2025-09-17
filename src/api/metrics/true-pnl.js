import express from 'express';
import { supabase } from '../../lib/supabase-server.ts';

const router = express.Router();

/**
 * GET /api/metrics/true_pnl
 * 
 * Returns True P&L metrics from the dbt mtr_true_pnl model
 * 
 * Query Parameters:
 * - workspace_id: Filter by workspace (required)
 * - date_from: Start date (YYYY-MM-DD format, optional)
 * - date_to: End date (YYYY-MM-DD format, optional)
 * - granularity: daily|weekly|monthly (default: daily)
 * - metrics: Comma-separated list of specific metrics to return (optional)
 * 
 * Example: /api/metrics/true_pnl?workspace_id=default_workspace&date_from=2024-01-01&date_to=2024-01-31&granularity=daily
 */
router.get('/true_pnl', async (req, res) => {
  try {
    const {
      workspace_id,
      date_from,
      date_to,
      granularity = 'daily',
      metrics
    } = req.query;

    // Validate required parameters
    if (!workspace_id) {
      return res.status(400).json({
        error: 'workspace_id is required',
        message: 'Please provide a workspace_id parameter'
      });
    }

    // Build the base query
    let query = supabase
      .from('mtr_true_pnl')
      .select('*')
      .eq('workspace_id', workspace_id);

    // Add date filters if provided
    if (date_from) {
      query = query.gte('date', date_from);
    }
    if (date_to) {
      query = query.lte('date', date_to);
    }

    // Order by date descending
    query = query.order('date', { ascending: false });

    // Execute the query
    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({
        error: 'Database query failed',
        message: error.message
      });
    }

    // Process data based on granularity
    let processedData = data;
    
    if (granularity === 'weekly') {
      processedData = aggregateByWeek(data);
    } else if (granularity === 'monthly') {
      processedData = aggregateByMonth(data);
    }

    // Filter specific metrics if requested
    if (metrics) {
      const requestedMetrics = metrics.split(',').map(m => m.trim());
      processedData = processedData.map(row => {
        const filteredRow = {
          workspace_id: row.workspace_id,
          date: row.date,
          date_key: row.date_key
        };
        
        requestedMetrics.forEach(metric => {
          if (row.hasOwnProperty(metric)) {
            filteredRow[metric] = row[metric];
          }
        });
        
        return filteredRow;
      });
    }

    // Calculate summary statistics
    const summary = calculateSummaryStats(data);

    // Return the response
    res.json({
      success: true,
      data: processedData,
      summary,
      metadata: {
        workspace_id,
        date_from: date_from || 'all',
        date_to: date_to || 'all',
        granularity,
        total_records: processedData.length,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('True P&L API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/metrics/true_pnl/summary
 * 
 * Returns aggregated summary metrics for a workspace
 */
router.get('/true_pnl/summary', async (req, res) => {
  try {
    const { workspace_id, date_from, date_to } = req.query;

    if (!workspace_id) {
      return res.status(400).json({
        error: 'workspace_id is required'
      });
    }

    // Build query for summary data
    let query = supabase
      .from('mtr_true_pnl')
      .select(`
        revenue,
        ad_spend,
        cogs,
        gross_profit,
        true_roas,
        gross_profit_margin_percent,
        total_orders,
        unique_customers,
        customer_acquisition_cost
      `)
      .eq('workspace_id', workspace_id);

    if (date_from) query = query.gte('date', date_from);
    if (date_to) query = query.lte('date', date_to);

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Calculate aggregated metrics
    const summary = {
      total_revenue: data.reduce((sum, row) => sum + (row.revenue || 0), 0),
      total_ad_spend: data.reduce((sum, row) => sum + (row.ad_spend || 0), 0),
      total_cogs: data.reduce((sum, row) => sum + (row.cogs || 0), 0),
      total_gross_profit: data.reduce((sum, row) => sum + (row.gross_profit || 0), 0),
      total_orders: data.reduce((sum, row) => sum + (row.total_orders || 0), 0),
      total_customers: data.reduce((sum, row) => sum + (row.unique_customers || 0), 0),
      avg_roas: data.length > 0 ? data.reduce((sum, row) => sum + (row.true_roas || 0), 0) / data.length : 0,
      avg_margin: data.length > 0 ? data.reduce((sum, row) => sum + (row.gross_profit_margin_percent || 0), 0) / data.length : 0,
      avg_cac: data.length > 0 ? data.reduce((sum, row) => sum + (row.customer_acquisition_cost || 0), 0) / data.length : 0,
      days_analyzed: data.length
    };

    // Calculate derived metrics
    summary.overall_roas = summary.total_ad_spend > 0 ? summary.total_revenue / summary.total_ad_spend : 0;
    summary.overall_margin = summary.total_revenue > 0 ? (summary.total_gross_profit / summary.total_revenue) * 100 : 0;
    summary.avg_order_value = summary.total_orders > 0 ? summary.total_revenue / summary.total_orders : 0;
    summary.revenue_per_customer = summary.total_customers > 0 ? summary.total_revenue / summary.total_customers : 0;

    res.json({
      success: true,
      summary,
      metadata: {
        workspace_id,
        date_from: date_from || 'all',
        date_to: date_to || 'all',
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Summary API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Helper function to aggregate data by week
function aggregateByWeek(data) {
  const weeklyData = {};
  
  data.forEach(row => {
    const date = new Date(row.date);
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        workspace_id: row.workspace_id,
        date: weekKey,
        date_key: weekKey,
        revenue: 0,
        ad_spend: 0,
        cogs: 0,
        gross_profit: 0,
        total_orders: 0,
        unique_customers: 0,
        days_in_period: 0
      };
    }
    
    weeklyData[weekKey].revenue += row.revenue || 0;
    weeklyData[weekKey].ad_spend += row.ad_spend || 0;
    weeklyData[weekKey].cogs += row.cogs || 0;
    weeklyData[weekKey].gross_profit += row.gross_profit || 0;
    weeklyData[weekKey].total_orders += row.total_orders || 0;
    weeklyData[weekKey].unique_customers += row.unique_customers || 0;
    weeklyData[weekKey].days_in_period += 1;
  });
  
  // Calculate derived metrics for each week
  Object.values(weeklyData).forEach(week => {
    week.true_roas = week.ad_spend > 0 ? week.revenue / week.ad_spend : 0;
    week.gross_profit_margin_percent = week.revenue > 0 ? (week.gross_profit / week.revenue) * 100 : 0;
    week.avg_order_value = week.total_orders > 0 ? week.revenue / week.total_orders : 0;
  });
  
  return Object.values(weeklyData).sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Helper function to aggregate data by month
function aggregateByMonth(data) {
  const monthlyData = {};
  
  data.forEach(row => {
    const date = new Date(row.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        workspace_id: row.workspace_id,
        date: monthKey,
        date_key: monthKey,
        revenue: 0,
        ad_spend: 0,
        cogs: 0,
        gross_profit: 0,
        total_orders: 0,
        unique_customers: 0,
        days_in_period: 0
      };
    }
    
    monthlyData[monthKey].revenue += row.revenue || 0;
    monthlyData[monthKey].ad_spend += row.ad_spend || 0;
    monthlyData[monthKey].cogs += row.cogs || 0;
    monthlyData[monthKey].gross_profit += row.gross_profit || 0;
    monthlyData[monthKey].total_orders += row.total_orders || 0;
    monthlyData[monthKey].unique_customers += row.unique_customers || 0;
    monthlyData[monthKey].days_in_period += 1;
  });
  
  // Calculate derived metrics for each month
  Object.values(monthlyData).forEach(month => {
    month.true_roas = month.ad_spend > 0 ? month.revenue / month.ad_spend : 0;
    month.gross_profit_margin_percent = month.revenue > 0 ? (month.gross_profit / month.revenue) * 100 : 0;
    month.avg_order_value = month.total_orders > 0 ? month.revenue / month.total_orders : 0;
  });
  
  return Object.values(monthlyData).sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Helper function to calculate summary statistics
function calculateSummaryStats(data) {
  if (!data || data.length === 0) {
    return {
      total_revenue: 0,
      total_ad_spend: 0,
      total_gross_profit: 0,
      avg_roas: 0,
      avg_margin: 0,
      best_day: null,
      worst_day: null
    };
  }

  const totalRevenue = data.reduce((sum, row) => sum + (row.revenue || 0), 0);
  const totalAdSpend = data.reduce((sum, row) => sum + (row.ad_spend || 0), 0);
  const totalGrossProfit = data.reduce((sum, row) => sum + (row.gross_profit || 0), 0);
  
  const avgRoas = data.length > 0 ? data.reduce((sum, row) => sum + (row.true_roas || 0), 0) / data.length : 0;
  const avgMargin = data.length > 0 ? data.reduce((sum, row) => sum + (row.gross_profit_margin_percent || 0), 0) / data.length : 0;
  
  // Find best and worst performing days
  const sortedByProfit = [...data].sort((a, b) => (b.gross_profit || 0) - (a.gross_profit || 0));
  const bestDay = sortedByProfit[0];
  const worstDay = sortedByProfit[sortedByProfit.length - 1];

  return {
    total_revenue: Math.round(totalRevenue * 100) / 100,
    total_ad_spend: Math.round(totalAdSpend * 100) / 100,
    total_gross_profit: Math.round(totalGrossProfit * 100) / 100,
    avg_roas: Math.round(avgRoas * 100) / 100,
    avg_margin: Math.round(avgMargin * 100) / 100,
    best_day: bestDay ? {
      date: bestDay.date,
      gross_profit: bestDay.gross_profit,
      revenue: bestDay.revenue
    } : null,
    worst_day: worstDay ? {
      date: worstDay.date,
      gross_profit: worstDay.gross_profit,
      revenue: worstDay.revenue
    } : null
  };
}

export default router;