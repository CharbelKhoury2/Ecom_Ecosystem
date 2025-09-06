import React, { useState, useEffect } from 'react';
import { Target, TrendingDown, Pause, Play, RefreshCw, AlertTriangle } from 'lucide-react';

interface Campaign {
  campaign_id: string;
  campaign_name: string;
  status: string;
  spend: number;
  revenue: number;
  roas: number;
  canPause: boolean;
  canResume: boolean;
}

interface CampaignControlProps {
  userId: string;
}

const CampaignControl: React.FC<CampaignControlProps> = ({ userId }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [controlLoading, setControlLoading] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/src/api/meta/campaign-control?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        // Filter for underperforming campaigns (ROAS < 2.0)
        const underperforming = data.data?.filter((campaign: Campaign) => 
          campaign.roas < 2.0 && campaign.status === 'ACTIVE'
        ) || [];
        setCampaigns(underperforming);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchCampaigns();
    }
  }, [userId]);

  const handleCampaignControl = async (campaignId: string, action: 'pause' | 'resume', campaignName: string) => {
    const confirmed = confirm(
      `Are you sure you want to ${action} the campaign "${campaignName}"?`
    );
    
    if (!confirmed) return;
    
    setControlLoading(campaignId);
    try {
      const response = await fetch('/src/api/meta/campaign-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId,
          action,
          userId,
          reason: `${action === 'pause' ? 'Paused' : 'Resumed'} due to performance from alerts dashboard`
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Campaign "${campaignName}" ${action}d successfully!`);
        // Refresh campaigns
        await fetchCampaigns();
      } else {
        const errorData = await response.json();
        alert(errorData.error || `Failed to ${action} campaign.`);
      }
    } catch (error) {
      console.error(`Error ${action}ing campaign:`, error);
      alert(`Failed to ${action} campaign. Please try again.`);
    } finally {
      setControlLoading(null);
    }
  };

  if (campaigns.length === 0 && !loading) {
    return null; // Don't show the component if no underperforming campaigns
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Target className="h-6 w-6 text-red-600 dark:text-red-400 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Underperforming Campaigns</h2>
          {campaigns.length > 0 && (
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-full">
              {campaigns.length} campaigns with ROAS &lt; 2.0
            </span>
          )}
        </div>
        <button
          onClick={fetchCampaigns}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div key={campaign.campaign_id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-5 w-5 text-red-500 dark:text-red-400" />
                    <h3 className="font-medium text-gray-900 dark:text-white">{campaign.campaign_name}</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded">
                      ROAS: {campaign.roas.toFixed(2)}x
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Spend: ${campaign.spend?.toFixed(2)} • Revenue: ${campaign.revenue?.toFixed(2)} • 
                    Loss: ${Math.max(0, campaign.spend - campaign.revenue).toFixed(2)}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {campaign.canPause && (
                    <button
                      onClick={() => handleCampaignControl(campaign.campaign_id, 'pause', campaign.campaign_name)}
                      disabled={controlLoading === campaign.campaign_id}
                      className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
                    >
                      <Pause className="h-4 w-4" />
                      <span>{controlLoading === campaign.campaign_id ? 'Pausing...' : 'Pause'}</span>
                    </button>
                  )}
                  {campaign.canResume && (
                    <button
                      onClick={() => handleCampaignControl(campaign.campaign_id, 'resume', campaign.campaign_name)}
                      disabled={controlLoading === campaign.campaign_id}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
                    >
                      <Play className="h-4 w-4" />
                      <span>{controlLoading === campaign.campaign_id ? 'Resuming...' : 'Resume'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Recommendation:</strong> Consider pausing campaigns with ROAS below 1.5x to prevent further losses. 
                Review ad creatives, targeting, and landing pages for underperforming campaigns.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CampaignControl;