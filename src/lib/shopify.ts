import { supabase } from './supabase-server';
import { decrypt } from './encryption';

// Environment variables for Shopify configuration
const SHOPIFY_CONFIG = {
  shopDomain: process.env.SHOPIFY_SHOP_DOMAIN || '',
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
  clientId: process.env.SHOPIFY_CLIENT_ID || '',
  clientSecret: process.env.SHOPIFY_CLIENT_SECRET || '',
  apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01'
};

export interface ShopifyOrder {
  id: number;
  order_number: string;
  created_at: string;
  total_price: string;
  currency: string;
  line_items: Array<{
    id: number;
    product_id: number;
    variant_id: number;
    sku: string;
    name: string;
    quantity: number;
    price: string;
  }>;
  shipping_lines: Array<{
    price: string;
  }>;
  refunds: Array<{
    id: number;
    created_at: string;
    total_refund_set: {
      shop_money: {
        amount: string;
      };
    };
  }>;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  variants: Array<{
    id: number;
    product_id: number;
    sku: string;
    price: string;
    inventory_quantity: number;
    cost?: string;
  }>;
}

export class ShopifyAPI {
  private storeUrl: string;
  private accessToken: string;

  constructor(storeUrl: string, accessToken: string) {
    this.storeUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.accessToken = accessToken;
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}) {
    const url = new URL(`https://${this.storeUrl}/admin/api/${SHOPIFY_CONFIG.apiVersion}/${endpoint}`);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined) {
        url.searchParams.append(key, params[key].toString());
      }
    });

    const response = await fetch(url.toString(), {
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('shop.json');
      return true;
    } catch (error) {
      console.error('Shopify connection test failed:', error);
      return false;
    }
  }

  async fetchOrders(createdAtMin?: string): Promise<ShopifyOrder[]> {
    const params: Record<string, any> = {
      status: 'any',
      limit: 250,
    };

    if (createdAtMin) {
      params.created_at_min = createdAtMin;
    }

    const response = await this.makeRequest('orders.json', params);
    return response.orders || [];
  }

  async fetchProducts(): Promise<ShopifyProduct[]> {
    const response = await this.makeRequest('products.json', { limit: 250 });
    return response.products || [];
  }

  async fetchOrdersWithRefunds(createdAtMin?: string): Promise<ShopifyOrder[]> {
    const orders = await this.fetchOrders(createdAtMin);
    
    // Fetch refunds for each order
    for (const order of orders) {
      try {
        const refundsResponse = await this.makeRequest(`orders/${order.id}/refunds.json`);
        order.refunds = refundsResponse.refunds || [];
      } catch (error) {
        console.warn(`Failed to fetch refunds for order ${order.id}:`, error);
        order.refunds = [];
      }
    }

    return orders;
  }
}

// Create Shopify API instance using environment variables (Admin API)
export function getShopifyAPIFromEnv(): ShopifyAPI | null {
  try {
    if (!SHOPIFY_CONFIG.shopDomain || !SHOPIFY_CONFIG.accessToken) {
      console.warn('Shopify environment variables not configured');
      return null;
    }

    return new ShopifyAPI(SHOPIFY_CONFIG.shopDomain, SHOPIFY_CONFIG.accessToken);
  } catch (error) {
    console.error('Failed to create Shopify API instance from environment:', error);
    return null;
  }
}

// Get Shopify API instance from user credentials (existing functionality)
export async function getShopifyAPI(userId: string): Promise<ShopifyAPI | null> {
  try {
    const { data: credentials, error } = await supabase
      .from('shopify_credentials')
      .select('store_url, encrypted_access_token')
      .eq('user_id', userId)
      .single();

    if (error || !credentials) {
      return null;
    }

    const accessToken = decrypt(credentials.encrypted_access_token);
    return new ShopifyAPI(credentials.store_url, accessToken);
  } catch (error) {
    console.error('Failed to get Shopify API instance:', error);
    return null;
  }
}

// Test Shopify connection using environment variables
export async function testShopifyConnection(): Promise<boolean> {
  const api = getShopifyAPIFromEnv();
  if (!api) {
    return false;
  }
  return await api.testConnection();
}