import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using process.env for Node.js environment
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

// Enhanced Supabase client with better error handling and timeouts
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
    },
  },
});

// Connection test function
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('alerts')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
}

// Retry wrapper for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
}

// Mock data for fallback when database is unavailable
export const mockAlerts = [
  {
    id: 'mock-1',
    workspace_id: 'mock-workspace',
    product_id: 'mock-product-1',
    type: 'Low Stock',
    sku: 'MOCK-SKU-001',
    message: 'Mock product is running low on stock',
    severity: 'warning',
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-2',
    workspace_id: 'mock-workspace',
    product_id: 'mock-product-2',
    type: 'Out of Stock',
    sku: 'MOCK-SKU-002',
    message: 'Mock product is out of stock',
    severity: 'critical',
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Types for our database tables
export interface ShopifyCredentials {
  id: string;
  user_id: string;
  store_url: string;
  encrypted_access_token: string;
  created_at: string;
  updated_at: string;
}

export interface ShopifyOrder {
  id: string;
  user_id: string;
  order_id: string;
  sku: string | null;
  product_id: string | null;
  quantity: number;
  revenue: number;
  total_price: number;
  shipping_cost: number;
  refunds: number;
  currency: string;
  date_created: string;
  synced_at: string;
}

export interface ShopifyProduct {
  id: string;
  user_id: string;
  product_id: string;
  sku: string | null;
  name: string;
  cost_per_item: number;
  stock_quantity: number;
  price: number;
  last_updated: string;
  synced_at: string;
}