-- Create sentiment analytics tables for AI Copilot

-- Table for storing user sentiment history
CREATE TABLE IF NOT EXISTS user_sentiment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  query_text TEXT NOT NULL,
  overall_sentiment VARCHAR(20) NOT NULL CHECK (overall_sentiment IN ('positive', 'negative', 'neutral')),
  sentiment_confidence DECIMAL(3,2) NOT NULL CHECK (sentiment_confidence >= 0 AND sentiment_confidence <= 1),
  sentiment_intensity VARCHAR(20) NOT NULL CHECK (sentiment_intensity IN ('mild', 'moderate', 'strong')),
  emotional_tones JSONB DEFAULT '[]'::jsonb,
  business_context JSONB DEFAULT '[]'::jsonb,
  urgency_level VARCHAR(20) NOT NULL DEFAULT 'low' CHECK (urgency_level IN ('low', 'medium', 'high')),
  escalation_risk JSONB DEFAULT '{"level": "low", "triggers": [], "score": 0}'::jsonb,
  satisfaction_level JSONB DEFAULT '{"level": "medium", "score": 0.5}'::jsonb,
  gemini_insights JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing sentiment alerts
CREATE TABLE IF NOT EXISTS sentiment_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255),
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('escalation_risk', 'low_satisfaction', 'urgent_query', 'negative_trend')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  alert_data JSONB DEFAULT '{}'::jsonb,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for user behavior tracking
CREATE TABLE IF NOT EXISTS user_behavior_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255),
  query_text TEXT NOT NULL,
  intent_category VARCHAR(100),
  intent_confidence DECIMAL(3,2),
  response_satisfaction DECIMAL(3,2),
  interaction_duration INTEGER, -- in seconds
  user_segments JSONB DEFAULT '[]'::jsonb,
  business_context JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for conversation history with sentiment context
CREATE TABLE IF NOT EXISTS conversation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255),
  query_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  sentiment_data JSONB DEFAULT '{}'::jsonb,
  ml_insights JSONB DEFAULT '{}'::jsonb,
  response_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for sentiment analytics aggregations
CREATE TABLE IF NOT EXISTS sentiment_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date_period DATE NOT NULL,
  timeframe VARCHAR(10) NOT NULL CHECK (timeframe IN ('1h', '24h', '7d', '30d')),
  total_queries INTEGER DEFAULT 0,
  positive_sentiment_count INTEGER DEFAULT 0,
  negative_sentiment_count INTEGER DEFAULT 0,
  neutral_sentiment_count INTEGER DEFAULT 0,
  average_satisfaction DECIMAL(3,2) DEFAULT 0.5,
  urgent_queries_count INTEGER DEFAULT 0,
  escalation_risks_count INTEGER DEFAULT 0,
  top_emotions JSONB DEFAULT '[]'::jsonb,
  business_contexts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date_period, timeframe)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sentiment_history_user_id ON user_sentiment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sentiment_history_created_at ON user_sentiment_history(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sentiment_history_sentiment ON user_sentiment_history(overall_sentiment);
CREATE INDEX IF NOT EXISTS idx_user_sentiment_history_urgency ON user_sentiment_history(urgency_level);

CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_user_id ON sentiment_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_type ON sentiment_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_severity ON sentiment_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_resolved ON sentiment_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_created_at ON sentiment_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_user_behavior_tracking_user_id ON user_behavior_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_tracking_session ON user_behavior_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_tracking_created_at ON user_behavior_tracking(created_at);

CREATE INDEX IF NOT EXISTS idx_conversation_history_user_id ON conversation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_history_session ON conversation_history(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_history_created_at ON conversation_history(created_at);

CREATE INDEX IF NOT EXISTS idx_sentiment_analytics_date_timeframe ON sentiment_analytics(date_period, timeframe);
CREATE INDEX IF NOT EXISTS idx_sentiment_analytics_created_at ON sentiment_analytics(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_sentiment_history_updated_at 
    BEFORE UPDATE ON user_sentiment_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sentiment_analytics_updated_at 
    BEFORE UPDATE ON sentiment_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_sentiment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can view their own sentiment history" ON user_sentiment_history
    FOR SELECT USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own sentiment history" ON user_sentiment_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Service role can manage sentiment alerts" ON sentiment_alerts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own behavior tracking" ON user_behavior_tracking
    FOR SELECT USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own behavior tracking" ON user_behavior_tracking
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can view their own conversation history" ON conversation_history
    FOR SELECT USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own conversation history" ON conversation_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Service role can manage sentiment analytics" ON sentiment_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions to authenticated and anon roles
GRANT SELECT, INSERT ON user_sentiment_history TO authenticated;
GRANT SELECT, INSERT ON user_behavior_tracking TO authenticated;
GRANT SELECT, INSERT ON conversation_history TO authenticated;
GRANT SELECT ON sentiment_analytics TO authenticated;
GRANT SELECT ON sentiment_alerts TO authenticated;

GRANT SELECT ON user_sentiment_history TO anon;
GRANT SELECT ON sentiment_analytics TO anon;

-- Grant full access to service role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- Create view for sentiment dashboard
CREATE OR REPLACE VIEW sentiment_dashboard AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_queries,
    COUNT(*) FILTER (WHERE overall_sentiment = 'positive') as positive_count,
    COUNT(*) FILTER (WHERE overall_sentiment = 'negative') as negative_count,
    COUNT(*) FILTER (WHERE overall_sentiment = 'neutral') as neutral_count,
    AVG((satisfaction_level->>'score')::decimal) as avg_satisfaction,
    COUNT(*) FILTER (WHERE urgency_level = 'high') as urgent_queries,
    COUNT(*) FILTER (WHERE (escalation_risk->>'level')::text = 'high') as escalation_risks
FROM user_sentiment_history
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Grant access to the view
GRANT SELECT ON sentiment_dashboard TO authenticated, anon, service_role;

-- Create function to get user sentiment summary
CREATE OR REPLACE FUNCTION get_user_sentiment_summary(p_user_id TEXT, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
    total_interactions INTEGER,
    avg_satisfaction DECIMAL,
    sentiment_distribution JSONB,
    trend_direction TEXT,
    last_interaction TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    WITH user_data AS (
        SELECT 
            overall_sentiment,
            (satisfaction_level->>'score')::decimal as satisfaction_score,
            created_at,
            ROW_NUMBER() OVER (ORDER BY created_at) as rn,
            COUNT(*) OVER () as total_count
        FROM user_sentiment_history 
        WHERE user_id = p_user_id 
        AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    ),
    sentiment_counts AS (
        SELECT 
            COUNT(*) FILTER (WHERE overall_sentiment = 'positive') as positive,
            COUNT(*) FILTER (WHERE overall_sentiment = 'negative') as negative,
            COUNT(*) FILTER (WHERE overall_sentiment = 'neutral') as neutral,
            AVG(satisfaction_score) as avg_sat,
            COUNT(*)::INTEGER as total,
            MAX(created_at) as last_interaction
        FROM user_data
    ),
    trend_calc AS (
        SELECT 
            CASE 
                WHEN COUNT(*) >= 4 THEN
                    CASE 
                        WHEN AVG(CASE WHEN rn > total_count/2 THEN satisfaction_score END) > 
                             AVG(CASE WHEN rn <= total_count/2 THEN satisfaction_score END) + 0.1 
                        THEN 'improving'
                        WHEN AVG(CASE WHEN rn > total_count/2 THEN satisfaction_score END) < 
                             AVG(CASE WHEN rn <= total_count/2 THEN satisfaction_score END) - 0.1 
                        THEN 'declining'
                        ELSE 'stable'
                    END
                ELSE 'insufficient_data'
            END as trend
        FROM user_data
    )
    SELECT 
        sc.total,
        sc.avg_sat,
        jsonb_build_object(
            'positive', sc.positive,
            'negative', sc.negative,
            'neutral', sc.neutral
        ),
        tc.trend,
        sc.last_interaction
    FROM sentiment_counts sc, trend_calc tc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_sentiment_summary TO authenticated, service_role;

COMMIT;