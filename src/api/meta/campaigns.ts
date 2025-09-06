import { supabase } from '../../lib/supabase';
import { getMetaAdsAPI } from '../../lib/meta';

export async function POST(request: Request) {
  try {
    const { userId, syncDays = 7 } = await request.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const metaAPI = await getMetaAdsAPI(userId);
    if (!metaAPI) {
      return new Response(
        JSON.stringify({ error: 'Meta Ads not connected' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch campaign insights from Meta
    const campaigns = await metaAPI.fetchCampaignInsights(syncDays);

    // Process and store campaigns
    const campaignRecords = campaigns.map(campaign => ({
      user_id: userId,
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name,
      spend: campaign.spend,
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      conversions: campaign.conversions,
      revenue: campaign.revenue,
      date: campaign.date,
      synced_at: new Date().toISOString(),
    }));

    // Batch insert campaigns
    if (campaignRecords.length > 0) {
      const { error } = await supabase
        .from('meta_campaigns')
        .upsert(campaignRecords, {
          onConflict: 'user_id,campaign_id,date',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error('Database error inserting campaigns:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to store campaigns' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check for alerts
    await checkCampaignAlerts(userId, campaigns);

    return new Response(
      JSON.stringify({
        success: true,
        campaignsProcessed: campaignRecords.length,
        uniqueCampaigns: [...new Set(campaigns.map(c => c.campaign_id))].length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Meta campaigns sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to sync campaigns' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const days = parseInt(url.searchParams.get('days') || '7');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate date range
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const { data: campaigns, error } = await supabase
      .from('meta_campaigns')
      .select('*')
      .eq('user_id', userId)
      .gte('date', dateFrom.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) {
      console.error('Database error fetching campaigns:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch campaigns' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ campaigns: campaigns || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get campaigns error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function checkCampaignAlerts(userId: string, campaigns: any[]) {
  const alerts = [];

  for (const campaign of campaigns) {
    // ROAS Drop Alert
    if (campaign.roas < 2.0 && campaign.spend > 50) {
      alerts.push({
        user_id: userId,
        campaign_id: campaign.campaign_id,
        alert_type: 'roas_drop',
        message: `${campaign.campaign_name} has ROAS of ${campaign.roas.toFixed(2)}x (below 2.0x threshold). Spent $${campaign.spend.toFixed(2)} with low returns.`,
        severity: campaign.roas < 1.5 ? 'high' : 'medium',
        status: 'active',
      });
    }

    // Zero Conversions Alert
    if (campaign.conversions === 0 && campaign.spend > 100) {
      alerts.push({
        user_id: userId,
        campaign_id: campaign.campaign_id,
        alert_type: 'zero_conversions',
        message: `${campaign.campaign_name} spent $${campaign.spend.toFixed(2)} with 0 conversions in the last 48 hours. Consider pausing or optimizing.`,
        severity: 'high',
        status: 'active',
      });
    }

    // High Spend Alert (simplified - would need historical data for proper implementation)
    if (campaign.spend > 500) {
      alerts.push({
        user_id: userId,
        campaign_id: campaign.campaign_id,
        alert_type: 'high_spend',
        message: `${campaign.campaign_name} has high daily spend of $${campaign.spend.toFixed(2)}. Monitor performance closely.`,
        severity: 'medium',
        status: 'active',
      });
    }
  }

  // Insert alerts if any
  if (alerts.length > 0) {
    await supabase.from('campaign_alerts').upsert(alerts, {
      onConflict: 'user_id,campaign_id,alert_type',
      ignoreDuplicates: true,
    });
  }
}