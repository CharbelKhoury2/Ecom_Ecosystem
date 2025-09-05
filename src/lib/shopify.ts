import { supabase } from './supabase';
import { decrypt } from './encryption';

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
    const url = new URL(`https://${this.storeUrl}/admin/api/2024-04/${endpoint}`);
    
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