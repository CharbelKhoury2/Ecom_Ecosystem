import { supabase } from '../../lib/supabase-server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const days = parseInt(url.searchParams.get('days') || '7');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate date range
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    // Fetch aggregated campaign data
    const { data: campaignData, error } = await supabase
      .from('meta_campaigns')
      .select('campaign_id, campaign_name, spend, revenue, conversions, clicks, impressions')
      .eq('user_id', userId)
      .gte('date', dateFrom.toISOString().split('T')[0]);

    if (error) {
      console.error('Database error fetching campaign data:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch campaign data' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate data by campaign
    const campaignMap = new Map();
    
    for (const item of campaignData || []) {
      const campaignId = item.campaign_id;
      if (!campaignMap.has(campaignId)) {
        campaignMap.set(campaignId, {
          id: campaignId,
          name: item.campaign_name,
          spend: 0,
          revenue: 0,
          conversions: 0,
          clicks: 0,
          impressions: 0,
        });
      }
      
      const campaign = campaignMap.get(campaignId);
      campaign.spend += item.spend || 0;
      campaign.revenue += item.revenue || 0;
      campaign.conversions += item.conversions || 0;
      campaign.clicks += item.clicks || 0;
      campaign.impressions += item.impressions || 0;
    }

    // Convert to array and calculate metrics
    const topCampaigns = Array.from(campaignMap.values())
      .map(campaign => ({
        ...campaign,
        roas: campaign.spend > 0 ? campaign.revenue / campaign.spend : 0,
        profit: campaign.revenue - campaign.spend,
        ctr: campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0,
        status: campaign.spend > 0 && campaign.revenue / campaign.spend < 2.0 ? 'warning' : 'active',
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, limit);

    return new Response(
      JSON.stringify({ topCampaigns }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analytics campaigns error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch campaign analytics' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}