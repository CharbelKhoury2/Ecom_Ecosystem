-- Enhance existing tables with workspace_id and production indexes

-- Add workspace_id to existing tables for multi-tenant support
ALTER TABLE products ADD COLUMN IF NOT EXISTS workspace_id TEXT DEFAULT 'default_workspace';
ALTER TABLE meta_campaigns ADD COLUMN IF NOT EXISTS workspace_id TEXT DEFAULT 'default_workspace';
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS workspace_id TEXT DEFAULT 'default_workspace';
ALTER TABLE shopify_orders ADD COLUMN IF NOT EXISTS workspace_id TEXT DEFAULT 'default_workspace';
ALTER TABLE shopify_products ADD COLUMN IF NOT EXISTS workspace_id TEXT DEFAULT 'default_workspace';
ALTER TABLE shopify_credentials ADD COLUMN IF NOT EXISTS workspace_id TEXT DEFAULT 'default_workspace';

-- Add date column to meta_campaigns for daily aggregations
ALTER TABLE meta_campaigns ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

-- Add workspace_id to orders and order_items
ALTER TABLE orders ADD COLUMN IF NOT EXISTS workspace_id TEXT DEFAULT 'default_workspace';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS workspace_id TEXT DEFAULT 'default_workspace';
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS workspace_id TEXT DEFAULT 'default_workspace';

-- Create production-ready indexes
CREATE INDEX IF NOT EXISTS idx_products_workspace_id ON products(workspace_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_workspace_id ON meta_campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_date ON meta_campaigns(date);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_workspace_date ON meta_campaigns(workspace_id, date);
CREATE INDEX IF NOT EXISTS idx_shipments_workspace_id ON shipments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_workspace_id ON shopify_orders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_date_created ON shopify_orders(date_created);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_workspace_date ON shopify_orders(workspace_id, date_created);
CREATE INDEX IF NOT EXISTS idx_shopify_products_workspace_id ON shopify_products(workspace_id);
CREATE INDEX IF NOT EXISTS idx_orders_workspace_id ON orders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_orders_workspace_date ON orders(workspace_id, order_date);
CREATE INDEX IF NOT EXISTS idx_order_items_workspace_id ON order_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_workspace_id ON recommendations(workspace_id);

-- Add check constraints for data quality (skip foreign keys for now)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_total_price_positive') THEN
    ALTER TABLE orders ADD CONSTRAINT chk_orders_total_price_positive CHECK (total_price >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_order_items_quantity_positive') THEN
    ALTER TABLE order_items ADD CONSTRAINT chk_order_items_quantity_positive CHECK (quantity > 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_order_items_unit_price_positive') THEN
    ALTER TABLE order_items ADD CONSTRAINT chk_order_items_unit_price_positive CHECK (unit_price >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_price_positive') THEN
    ALTER TABLE products ADD CONSTRAINT chk_products_price_positive CHECK (price >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_cost_positive') THEN
    ALTER TABLE products ADD CONSTRAINT chk_products_cost_positive CHECK (cost >= 0);
  END IF;
END $$;

-- Update RLS policies for workspace isolation
DROP POLICY IF EXISTS "Users access own orders" ON orders;
CREATE POLICY "Users access orders in workspace" ON orders 
  FOR ALL USING (user_id = auth.uid() OR workspace_id = 'default_workspace');

DROP POLICY IF EXISTS "Users access own order_items" ON order_items;
CREATE POLICY "Users access order_items in workspace" ON order_items 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.id = order_items.order_id 
      AND (o.user_id = auth.uid() OR o.workspace_id = 'default_workspace')
    )
  );

DROP POLICY IF EXISTS "Users access own recommendations" ON recommendations;
CREATE POLICY "Users access recommendations in workspace" ON recommendations 
  FOR ALL USING (user_id = auth.uid() OR workspace_id = 'default_workspace');