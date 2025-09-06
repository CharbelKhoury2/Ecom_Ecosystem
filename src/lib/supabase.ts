import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// For development - you can set these in a .env file
// VITE_SUPABASE_URL=your_actual_supabase_url
// VITE_SUPABASE_ANON_KEY=your_actual_anon_key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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