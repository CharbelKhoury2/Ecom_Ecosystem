-- Create recommendations table for AI-generated business insights
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('inventory_reorder', 'price_optimization', 'campaign_adjustment', 'product_promotion')),
  category TEXT NOT NULL CHECK (category IN ('inventory', 'pricing', 'marketing', 'operations')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reasoning TEXT,
  estimated_impact_revenue DECIMAL(12,2),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'implemented', 'dismissed', 'expired')),
  action_data JSONB DEFAULT '{}',
  ai_model TEXT DEFAULT 'gemini-pro',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_status ON recommendations(status);
CREATE INDEX idx_recommendations_type ON recommendations(type);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own recommendations" ON recommendations FOR ALL USING (user_id = auth.uid());

GRANT ALL PRIVILEGES ON recommendations TO authenticated;
GRANT SELECT ON recommendations TO anon;

CREATE TRIGGER update_recommendations_updated_at 
  BEFORE UPDATE ON recommendations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();