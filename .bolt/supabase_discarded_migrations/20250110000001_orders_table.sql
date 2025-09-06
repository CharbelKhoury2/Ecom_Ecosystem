-- Create orders table for production metrics
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  customer_email TEXT NOT NULL,
  total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_date ON orders(order_date);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own orders" ON orders FOR ALL USING (user_id = auth.uid());
GRANT ALL PRIVILEGES ON orders TO authenticated;
GRANT SELECT ON orders TO anon;