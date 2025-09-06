import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ShopifyConnection {
  connected: boolean;
  storeUrl?: string;
  connectedAt?: string;
  loading: boolean;
  error?: string;
}

export interface MetaConnection {
  connected: boolean;
  adAccountId?: string;
  connectedAt?: string;
  loading: boolean;
  error?: string;
}
export function useShopifyConnection(userId?: string) {
  const [connection, setConnection] = useState<ShopifyConnection>({
    connected: false,
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setConnection({ connected: false, loading: false });
      return;
    }

    checkConnection();
  }, [userId]);

  const checkConnection = async () => {
    try {
      setConnection(prev => ({ ...prev, loading: true, error: undefined }));
      
      const response = await fetch(`/api/shopify/auth?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setConnection({
          connected: data.connected,
          storeUrl: data.storeUrl,
          connectedAt: data.connectedAt,
          loading: false,
        });
      } else {
        setConnection({
          connected: false,
          loading: false,
          error: data.error || 'Failed to check connection',
        });
      }
    } catch (error) {
      setConnection({
        connected: false,
        loading: false,
        error: 'Network error',
      });
    }
  };

  const connect = async (storeUrl: string, accessToken: string) => {
    try {
      setConnection(prev => ({ ...prev, loading: true, error: undefined }));

      const response = await fetch('/api/shopify/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeUrl, accessToken, userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setConnection({
          connected: true,
          storeUrl,
          connectedAt: new Date().toISOString(),
          loading: false,
        });
        return { success: true };
      } else {
        setConnection(prev => ({
          ...prev,
          loading: false,
          error: data.error || 'Failed to connect',
        }));
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = 'Network error';
      setConnection(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const syncData = async (syncDays = 30) => {
    if (!userId) return { success: false, error: 'No user ID' };

    try {
      // Sync orders
      const ordersResponse = await fetch('/api/shopify/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, syncDays }),
      });

      // Sync products
      const productsResponse = await fetch('/api/shopify/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const ordersData = await ordersResponse.json();
      const productsData = await productsResponse.json();

      if (ordersResponse.ok && productsResponse.ok) {
        return {
          success: true,
          ordersProcessed: ordersData.ordersProcessed,
          productsProcessed: productsData.productsProcessed,
        };
      } else {
        return {
          success: false,
          error: ordersData.error || productsData.error || 'Sync failed',
        };
      }
    } catch (error) {
      return { success: false, error: 'Network error during sync' };
    }
  };

  return {
    connection,
    connect,
    syncData,
    refresh: checkConnection,
  };
}

export function useMetaConnection(userId?: string) {
  const [connection, setConnection] = useState<MetaConnection>({
    connected: false,
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setConnection({ connected: false, loading: false });
      return;
    }

    checkConnection();
  }, [userId]);

  const checkConnection = async () => {
    try {
      setConnection(prev => ({ ...prev, loading: true, error: undefined }));
      
      const response = await fetch(`/api/meta/auth?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setConnection({
          connected: data.connected,
          adAccountId: data.adAccountId,
          connectedAt: data.connectedAt,
          loading: false,
        });
      } else {
        setConnection({
          connected: false,
          loading: false,
          error: data.error || 'Failed to check connection',
        });
      }
    } catch (error) {
      setConnection({
        connected: false,
        loading: false,
        error: 'Network error',
      });
    }
  };

  const connect = async (adAccountId: string, accessToken: string) => {
    try {
      setConnection(prev => ({ ...prev, loading: true, error: undefined }));

      const response = await fetch('/api/meta/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adAccountId, accessToken, userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setConnection({
          connected: true,
          adAccountId,
          connectedAt: new Date().toISOString(),
          loading: false,
        });
        return { success: true };
      } else {
        setConnection(prev => ({
          ...prev,
          loading: false,
          error: data.error || 'Failed to connect',
        }));
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = 'Network error';
      setConnection(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const syncCampaigns = async (syncDays = 7) => {
    if (!userId) return { success: false, error: 'No user ID' };

    try {
      const response = await fetch('/api/meta/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, syncDays }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          campaignsProcessed: data.campaignsProcessed,
          uniqueCampaigns: data.uniqueCampaigns,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Sync failed',
        };
      }
    } catch (error) {
      return { success: false, error: 'Network error during sync' };
    }
  };

  return {
    connection,
    connect,
    syncCampaigns,
    refresh: checkConnection,
  };
}
export function useShopifyData(userId?: string, days = 7) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!userId) {
      setData(null);
      setLoading(false);
      return;
    }

    fetchData();
  }, [userId, days]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(undefined);

      // Fetch P&L data
      const pnlResponse = await fetch(`/api/analytics/pnl?userId=${userId}&days=${days}`);
      const pnlData = await pnlResponse.json();

      // Fetch SKU data
      const skuResponse = await fetch(`/api/analytics/skus?userId=${userId}&days=${days}&limit=10`);
      const skuData = await skuResponse.json();

      // Fetch campaign data
      const campaignResponse = await fetch(`/api/analytics/campaigns?userId=${userId}&days=${days}&limit=10`);
      const campaignData = await campaignResponse.json();
      if (pnlResponse.ok && skuResponse.ok && campaignResponse.ok) {
        setData({
          kpis: pnlData.kpis,
          topSkus: skuData.topSkus,
          topCampaigns: campaignData.topCampaigns,
        });
      } else {
        setError(pnlData.error || skuData.error || campaignData.error || 'Failed to fetch data');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refresh: fetchData };
}