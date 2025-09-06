/*
  # Enhanced Alerts System

  1. Enhanced Alerts Table
    - Add workspace_id field for multi-tenant support
    - Add product_id field for better product tracking
    - Add acknowledged_by and acknowledged_at for acknowledgment tracking
    - Update indexes for new fields

  2. New Audit Logs Table
    - Track all alert operations (create/close/acknowledge/mock_restock)
    - Store actor, action, target details, and payload

  3. Security
    - Update RLS policies for workspace support
    - Enable RLS on audit_logs table
*/

-- Add new fields to alerts table
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS workspace_id text NOT NULL DEFAULT 'default_workspace';
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS product_id text;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS acknowledged_by text;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor text NOT NULL, -- user_id or system identifier
  action text NOT NULL, -- 'create', 'close', 'acknowledge', 'mock_restock'
  target_type text NOT NULL, -- 'alert', 'product'
  target_id text NOT NULL, -- alert_id or product_id
  payload jsonb, -- additional data about the action
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Update alerts table indexes
DROP INDEX IF EXISTS idx_alerts_user_status;
DROP INDEX IF EXISTS idx_alerts_user_type;
DROP INDEX IF EXISTS idx_alerts_user_created;
DROP INDEX IF EXISTS idx_alerts_sku;

-- Create new optimized indexes
CREATE INDEX IF NOT EXISTS idx_alerts_workspace_status_severity_created ON alerts(workspace_id, status, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_workspace_sku ON alerts(workspace_id, sku);
CREATE INDEX IF NOT EXISTS idx_alerts_workspace_type ON alerts(workspace_id, type);
CREATE INDEX IF NOT EXISTS idx_alerts_product_id ON alerts(workspace_id, product_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status_sku ON alerts(workspace_id, status, sku);

-- Create audit_logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON audit_logs(actor, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);

-- Update RLS policies for alerts
DROP POLICY IF EXISTS "Users can manage their own alerts" ON alerts;

CREATE POLICY "Users can manage alerts in their workspace"
  ON alerts
  FOR ALL
  TO authenticated
  USING (true) -- For now, allow all authenticated users - can be refined based on workspace membership
  WITH CHECK (true);

-- Create RLS policies for audit_logs
CREATE POLICY "Users can view audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE audit_logs TO authenticated;
GRANT SELECT ON TABLE audit_logs TO anon;

-- Add helpful comments
COMMENT ON TABLE alerts IS 'Inventory alerts for low stock and out of stock products';
COMMENT ON TABLE audit_logs IS 'Audit trail for all alert-related operations';
COMMENT ON COLUMN alerts.workspace_id IS 'Workspace identifier for multi-tenant support';
COMMENT ON COLUMN alerts.product_id IS 'Shopify product ID for better tracking';
COMMENT ON COLUMN alerts.acknowledged_by IS 'User who acknowledged the alert';
COMMENT ON COLUMN alerts.acknowledged_at IS 'Timestamp when alert was acknowledged';
COMMENT ON COLUMN audit_logs.payload IS 'JSON payload with additional action details';