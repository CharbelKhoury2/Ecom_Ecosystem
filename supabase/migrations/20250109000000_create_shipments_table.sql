-- Create shipments table for tracking shipping information
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id TEXT NOT NULL,
  tracking_number TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL, -- DHL, FEDEX, UPS
  provider_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Label Created',
  cost DECIMAL(10,2),
  estimated_delivery DATE,
  actual_delivery DATE,
  current_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at);

-- Enable RLS
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own shipments" ON shipments
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own shipments" ON shipments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own shipments" ON shipments
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own shipments" ON shipments
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON shipments TO authenticated;
GRANT SELECT ON shipments TO anon;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shipments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_shipments_updated_at_trigger
  BEFORE UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_shipments_updated_at();

-- Insert some sample shipment data for testing
INSERT INTO shipments (user_id, order_id, tracking_number, provider, provider_name, status, cost, estimated_delivery, current_location)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'ORD-001', 'DHL1234567890', 'DHL', 'DHL Express', 'In Transit', 25.99, CURRENT_DATE + INTERVAL '2 days', 'New York, NY'),
  ('00000000-0000-0000-0000-000000000000', 'ORD-002', 'FEDEX9876543210', 'FEDEX', 'FedEx Express', 'Out for Delivery', 29.99, CURRENT_DATE + INTERVAL '1 day', 'Los Angeles, CA'),
  ('00000000-0000-0000-0000-000000000000', 'ORD-003', 'UPS5555666677', 'UPS', 'UPS Express', 'Delivered', 27.99, CURRENT_DATE - INTERVAL '1 day', 'Chicago, IL');