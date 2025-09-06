import { supabase } from './supabase';
import { decrypt } from './encryption';

export interface MetaCampaign {
  campaign_id: string;
  campaign_name: string;
  spend: string;
  impressions: string;
  clicks: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
  date_start: string;
  date_stop: string;
}

export interface MetaCampaignInsight {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roas: number;
  date: string;
}

export class MetaAdsAPI {
  private accessToken: string;
  private adAccountId: string;

  constructor(accessToken: string, adAccountId: string) {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}) {
    const url = new URL(`https://graph.facebook.com/v18.0/${endpoint}`);
    
    // Add access token and other parameters
    url.searchParams.append('access_token', this.accessToken);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined) {
        url.searchParams.append(key, params[key].toString());
      }
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Meta API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('me', { fields: 'id,name' });
      return true;
    } catch (error) {
      console.error('Meta connection test failed:', error);
      return false;
    }
  }

  async fetchCampaigns(datePreset: string = 'last_7d'): Promise<MetaCampaign[]> {
    try {
      const response = await this.makeRequest(`${this.adAccountId}/insights`, {
        fields: 'campaign_id,campaign_name,spend,impressions,clicks,actions',
        date_preset: datePreset,
        level: 'campaign',
        limit: 100,
      });

      return response.data || [];
    } catch (error) {
      console.error('Error fetching Meta campaigns:', error);
      throw error;
    }
  }

  async fetchCampaignInsights(days: number = 7): Promise<MetaCampaignInsight[]> {
    const campaigns = await this.fetchCampaigns(`last_${days}d`);
    
    return campaigns.map(campaign => {
      // Extract purchase conversions and revenue from actions
      let conversions = 0;
      let revenue = 0;

      if (campaign.actions) {
        const purchaseAction = campaign.actions.find(action => 
          action.action_type === 'purchase' || action.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
        if (purchaseAction) {
          conversions = parseInt(purchaseAction.value) || 0;
        }

        const revenueAction = campaign.actions.find(action => 
          action.action_type === 'purchase_roas' || action.action_type === 'offsite_conversion.fb_pixel_purchase_roas'
        );
        if (revenueAction) {
          revenue = parseFloat(revenueAction.value) || 0;
        }
      }

      const spend = parseFloat(campaign.spend) || 0;
      const roas = spend > 0 ? revenue / spend : 0;

      return {
        campaign_id: campaign.campaign_id,
        campaign_name: campaign.campaign_name,
        spend,
        impressions: parseInt(campaign.impressions) || 0,
        clicks: parseInt(campaign.clicks) || 0,
        conversions,
        revenue,
        roas,
        date: campaign.date_start,
      };
    });
  }

  async pauseCampaign(campaignId: string): Promise<boolean> {
    try {
      await this.makeRequest(campaignId, {
        status: 'PAUSED',
      });
      return true;
    } catch (error) {
      console.error('Error pausing campaign:', error);
      return false;
    }
  }
}

export async function getMetaAdsAPI(userId: string): Promise<MetaAdsAPI | null> {
  try {
    const { data: credentials, error } = await supabase
      .from('meta_credentials')
      .select('ad_account_id, encrypted_access_token')
      .eq('user_id', userId)
      .single();

    if (error || !credentials) {
      return null;
    }

    const accessToken = decrypt(credentials.encrypted_access_token);
    return new MetaAdsAPI(accessToken, credentials.ad_account_id);
  } catch (error) {
    console.error('Failed to get Meta Ads API instance:', error);
    return null;
  }
}