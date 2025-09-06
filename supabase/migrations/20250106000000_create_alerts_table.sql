/*
  # Alerts Table Schema

  1. New Table
    - `alerts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text) - "Low Stock" | "Out of Stock"
      - `sku` (text)
      - `message` (text)
      - `severity` (text) - "warning" | "critical"
      - `status` (text) - "open" | "closed"
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on alerts table
    - Add policies for authenticated users to access their own alerts
    - Create indexes for performance optimization
*/

-- Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('Low Stock', 'Out of Stock')),
  sku text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('warning', 'critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own alerts"
  ON alerts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alerts_user_status ON alerts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_user_type ON alerts(user_id, type);
CREATE INDEX IF NOT EXISTS idx_alerts_user_created ON alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_sku ON alerts(user_id, sku);

-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON TABLE alerts TO authenticated;
GRANT SELECT ON TABLE alerts TO anon;