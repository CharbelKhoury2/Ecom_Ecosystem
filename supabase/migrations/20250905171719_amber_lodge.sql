/*
  # Shopify Integration Database Schema

  1. New Tables
    - `shopify_credentials`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `store_url` (text)
      - `encrypted_access_token` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `shopify_orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `order_id` (text, unique)
      - `sku` (text)
      - `product_id` (text)
      - `quantity` (integer)
      - `revenue` (decimal)
      - `total_price` (decimal)
      - `shipping_cost` (decimal)
      - `refunds` (decimal, default 0)
      - `currency` (text)
      - `date_created` (timestamp)
      - `synced_at` (timestamp)
    
    - `shopify_products`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `product_id` (text)
      - `sku` (text)
      - `name` (text)
      - `cost_per_item` (decimal, default 0)
      - `stock_quantity` (integer, default 0)
      - `price` (decimal)
      - `last_updated` (timestamp)
      - `synced_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Create indexes for performance optimization
*/

-- Shopify Credentials Table
CREATE TABLE IF NOT EXISTS shopify_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  store_url text NOT NULL,
  encrypted_access_token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE shopify_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own Shopify credentials"
  ON shopify_credentials
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Shopify Orders Table
CREATE TABLE IF NOT EXISTS shopify_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id text NOT NULL,
  sku text,
  product_id text,
  quantity integer DEFAULT 1,
  revenue decimal(10,2) DEFAULT 0,
  total_price decimal(10,2) DEFAULT 0,
  shipping_cost decimal(10,2) DEFAULT 0,
  refunds decimal(10,2) DEFAULT 0,
  currency text DEFAULT 'USD',
  date_created timestamptz DEFAULT now(),
  synced_at timestamptz DEFAULT now(),
  UNIQUE(user_id, order_id, sku)
);

ALTER TABLE shopify_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own Shopify orders"
  ON shopify_orders
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Shopify Products Table
CREATE TABLE IF NOT EXISTS shopify_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  sku text,
  name text NOT NULL,
  cost_per_item decimal(10,2) DEFAULT 0,
  stock_quantity integer DEFAULT 0,
  price decimal(10,2) DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  synced_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id, sku)
);

ALTER TABLE shopify_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own Shopify products"
  ON shopify_products
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shopify_orders_user_date ON shopify_orders(user_id, date_created DESC);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_sku ON shopify_orders(user_id, sku);
CREATE INDEX IF NOT EXISTS idx_shopify_products_user_sku ON shopify_products(user_id, sku);
CREATE INDEX IF NOT EXISTS idx_shopify_products_stock ON shopify_products(user_id, stock_quantity);