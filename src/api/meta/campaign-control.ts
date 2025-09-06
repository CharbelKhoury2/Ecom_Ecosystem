import { supabase } from '../../lib/supabase';

// Mock Meta Ads API responses
const MOCK_CAMPAIGN_STATUSES = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  DELETED: 'DELETED',
  ARCHIVED: 'ARCHIVED'
};

interface CampaignControlRequest {
  campaignId: string;
  action: 'pause' | 'resume';
  userId: string;
  reason?: string;
}

interface CampaignControlResponse {
  success: boolean;
  campaignId: string;
  previousStatus: string;
  newStatus: string;
  message: string;
}

// Mock function to simulate Meta API call
async function mockMetaApiCall(campaignId: string, action: 'pause' | 'resume'): Promise<CampaignControlResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate random success/failure (90% success rate)
  const success = Math.random() > 0.1;
  
  if (!success) {
    throw new Error('Meta API temporarily unavailable. Please try again later.');
  }
  
  const previousStatus = action === 'pause' ? MOCK_CAMPAIGN_STATUSES.ACTIVE : MOCK_CAMPAIGN_STATUSES.PAUSED;
  const newStatus = action === 'pause' ? MOCK_CAMPAIGN_STATUSES.PAUSED : MOCK_CAMPAIGN_STATUSES.ACTIVE;
  
  return {
    success: true,
    campaignId,
    previousStatus,
    newStatus,
    message: `Campaign ${action === 'pause' ? 'paused' : 'resumed'} successfully`
  };
}

export async function POST(request: Request) {
  try {
    const { campaignId, action, userId, reason }: CampaignControlRequest = await request.json();

    if (!campaignId || !action || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: campaignId, action, userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!['pause', 'resume'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be "pause" or "resume"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if campaign exists and belongs to user
    const { data: campaign, error: campaignError } = await supabase
      .from('meta_campaigns')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('user_id', userId)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call mock Meta API
    const result = await mockMetaApiCall(campaignId, action);

    // Update campaign status in database
    const { error: updateError } = await supabase
      .from('meta_campaigns')
      .update({ 
        status: result.newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('campaign_id', campaignId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to update campaign status:', updateError);
      // Continue anyway since Meta API call succeeded
    }

    // Log the action in audit logs
    await supabase
      .from('audit_logs')
      .insert({
        actor: userId,
        action: `campaign_${action}`,
        target_type: 'campaign',
        target_id: campaignId,
        payload: {
          campaignId,
          action,
          previousStatus: result.previousStatus,
          newStatus: result.newStatus,
          reason: reason || `Campaign ${action}d via dashboard`,
          campaignName: campaign.campaign_name
        }
      });

    // Create alert for significant campaign changes
    if (action === 'pause') {
      await supabase
        .from('alerts')
        .insert({
          user_id: userId,
          type: 'Campaign Paused',
          sku: campaignId,
          message: `Campaign "${campaign.campaign_name}" has been paused`,
          severity: 'warning',
          status: 'open'
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          campaignId,
          campaignName: campaign.campaign_name,
          action,
          previousStatus: result.previousStatus,
          newStatus: result.newStatus,
          message: result.message
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Campaign control API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to control campaign';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Please check your Meta Ads integration and try again'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const campaignId = url.searchParams.get('campaignId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let query = supabase
      .from('meta_campaigns')
      .select('campaign_id, campaign_name, status, spend, revenue, conversions, date')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data: campaigns, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch campaigns: ${error.message}`);
    }

    // Group campaigns by ID and get latest status
    const campaignMap = new Map();
    campaigns?.forEach(campaign => {
      if (!campaignMap.has(campaign.campaign_id) || 
          new Date(campaign.date) > new Date(campaignMap.get(campaign.campaign_id).date)) {
        campaignMap.set(campaign.campaign_id, campaign);
      }
    });

    const latestCampaigns = Array.from(campaignMap.values())
      .map(campaign => ({
        ...campaign,
        roas: campaign.spend > 0 ? (campaign.revenue / campaign.spend) : 0,
        canPause: campaign.status === 'ACTIVE',
        canResume: campaign.status === 'PAUSED'
      }));

    return new Response(
      JSON.stringify({ 
        success: true,
        data: latestCampaigns
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Campaign fetch API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch campaigns' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}