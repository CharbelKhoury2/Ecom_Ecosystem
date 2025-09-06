-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create meta_campaigns table
CREATE TABLE IF NOT EXISTS meta_campaigns (
  id TEXT PRIMARY KEY,
  campaign_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  daily_budget NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_spend NUMERIC(10,2) NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
  roas NUMERIC(5,2) NOT NULL DEFAULT 0,
  ctr NUMERIC(5,2) NOT NULL DEFAULT 0,
  cpc NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update alerts table to match seed script structure
ALTER TABLE alerts 
DROP CONSTRAINT IF EXISTS alerts_type_check,
DROP CONSTRAINT IF EXISTS alerts_severity_check;

ALTER TABLE alerts 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Update alerts table constraints
ALTER TABLE alerts 
ADD CONSTRAINT alerts_type_check CHECK (type IN ('low_stock', 'out_of_stock', 'campaign_performance')),
ADD CONSTRAINT alerts_severity_check CHECK (severity IN ('low', 'medium', 'high', 'warning', 'critical'));

-- Update alerts table status constraint
ALTER TABLE alerts 
DROP CONSTRAINT IF EXISTS alerts_status_check;

ALTER TABLE alerts 
ADD CONSTRAINT alerts_status_check CHECK (status IN ('active', 'acknowledged', 'resolved', 'open', 'closed'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_status ON meta_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_roas ON meta_campaigns(roas);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);

-- Enable RLS on new tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products table
CREATE POLICY "Allow all operations on products" ON products
  FOR ALL USING (true);

-- Create RLS policies for meta_campaigns table
CREATE POLICY "Allow all operations on meta_campaigns" ON meta_campaigns
  FOR ALL USING (true);

-- Grant permissions to anon and authenticated roles
GRANT ALL PRIVILEGES ON products TO anon;
GRANT ALL PRIVILEGES ON products TO authenticated;
GRANT ALL PRIVILEGES ON meta_campaigns TO anon;
GRANT ALL PRIVILEGES ON meta_campaigns TO authenticated;

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meta_campaigns_updated_at BEFORE UPDATE ON meta_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();