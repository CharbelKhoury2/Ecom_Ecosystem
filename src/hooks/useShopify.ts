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
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock connection for demo purposes
      setConnection({
        connected: true,
        storeUrl: 'demo-store.myshopify.com',
        connectedAt: new Date().toISOString(),
        loading: false,
      });
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

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate mock data for demo purposes
      const mockData = {
        kpis: {
          revenue: {
            value: 125000 + Math.floor(Math.random() * 25000),
            previousValue: 110000,
            change: 13.6,
            changeType: 'increase' as const,
            format: 'currency' as const
          },
          adSpend: {
            value: 25000 + Math.floor(Math.random() * 5000),
            previousValue: 28000,
            change: -10.7,
            changeType: 'decrease' as const,
            format: 'currency' as const
          },
          cogs: {
            value: 45000 + Math.floor(Math.random() * 10000),
            previousValue: 42000,
            change: 7.1,
            changeType: 'increase' as const,
            format: 'currency' as const
          },
          grossProfit: {
            value: 55000 + Math.floor(Math.random() * 15000),
            previousValue: 40000,
            change: 37.5,
            changeType: 'increase' as const,
            format: 'currency' as const
          },
          blendedRoas: {
            value: 4.2 + Math.random() * 1.8,
            previousValue: 3.8,
            change: 10.5,
            changeType: 'increase' as const,
            format: 'number' as const
          },
          contributionMargin: {
            value: 32.5 + Math.random() * 7.5,
            previousValue: 28.2,
            change: 15.2,
            changeType: 'increase' as const,
            format: 'percentage' as const
          }
        },
        topSkus: [
          {
            sku: 'SKU-001',
            productName: 'Premium Widget Pro',
            revenue: 15000,
            profit: 8500,
            stockLevel: 245,
            status: 'In Stock'
          },
          {
            sku: 'SKU-002',
            productName: 'Essential Kit Bundle',
            revenue: 12500,
            profit: 6200,
            stockLevel: 89,
            status: 'Low Stock'
          },
          {
            sku: 'SKU-003',
            productName: 'Deluxe Starter Pack',
            revenue: 9800,
            profit: 4900,
            stockLevel: 156,
            status: 'In Stock'
          }
        ],
        campaigns: [
          {
            name: 'Holiday Sale Campaign',
            spend: 5200,
            roas: 4.8,
            profit: 18960,
            status: 'Active'
          },
          {
            name: 'Brand Awareness Push',
            spend: 3800,
            roas: 3.2,
            profit: 8360,
            status: 'Active'
          },
          {
            name: 'Retargeting Campaign',
            spend: 2100,
            roas: 6.1,
            profit: 10710,
            status: 'Active'
          }
        ]
      };

      setData(mockData);
    } catch (error) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refresh: fetchData };
}