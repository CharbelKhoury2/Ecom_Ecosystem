import { getMetaAdsAPI } from '../../lib/meta';
import { supabase } from '../../lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { userId, campaignId, action } = await request.json();

    if (!userId || !campaignId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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

    let success = false;
    let message = '';

    switch (action) {
      case 'pause':
        success = await metaAPI.pauseCampaign(campaignId);
        message = success ? 'Campaign paused successfully' : 'Failed to pause campaign';
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    if (success) {
      // Log the action
      await supabase.from('campaign_alerts').insert({
        user_id: userId,
        campaign_id: campaignId,
        alert_type: 'action_taken',
        message: `Campaign action: ${action}`,
        severity: 'low',
        status: 'resolved',
      });
    }

    return new Response(
      JSON.stringify({ success, message }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Campaign action error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to execute campaign action' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}