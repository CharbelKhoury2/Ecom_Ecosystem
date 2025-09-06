-- Create API usage logs table for tracking LLM API usage per workspace
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'gemini', -- 'gemini', 'openai', etc.
  tokens_used INTEGER NOT NULL DEFAULT 0,
  request_type TEXT DEFAULT 'copilot_query', -- 'copilot_query', 'recommendation', etc.
  endpoint TEXT, -- API endpoint called
  user_query TEXT, -- Redacted user query for debugging
  response_status TEXT DEFAULT 'success', -- 'success', 'error', 'rate_limited'
  error_message TEXT, -- Error details if any
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_workspace_id ON api_usage_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_workspace_date ON api_usage_logs(workspace_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_provider ON api_usage_logs(provider);

-- Enable Row Level Security
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for authenticated users to read their own workspace usage
CREATE POLICY "Users can view their workspace API usage" ON api_usage_logs
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id', true));

-- Policy for service role to insert usage logs
CREATE POLICY "Service role can insert API usage logs" ON api_usage_logs
  FOR INSERT
  WITH CHECK (true);

-- Policy for service role to read all usage logs (for admin purposes)
CREATE POLICY "Service role can read all API usage logs" ON api_usage_logs
  FOR SELECT
  USING (current_user = 'service_role');

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON api_usage_logs TO authenticated;
GRANT INSERT ON api_usage_logs TO authenticated;
GRANT ALL PRIVILEGES ON api_usage_logs TO service_role;

-- Create a function to get daily usage summary
CREATE OR REPLACE FUNCTION get_daily_usage_summary(
  p_workspace_id TEXT,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  date DATE,
  total_tokens INTEGER,
  total_requests INTEGER,
  providers JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) as date,
    SUM(tokens_used)::INTEGER as total_tokens,
    COUNT(*)::INTEGER as total_requests,
    jsonb_object_agg(provider, provider_stats) as providers
  FROM (
    SELECT 
      created_at,
      tokens_used,
      provider,
      jsonb_build_object(
        'tokens', SUM(tokens_used),
        'requests', COUNT(*)
      ) as provider_stats
    FROM api_usage_logs
    WHERE workspace_id = p_workspace_id
      AND created_at >= CURRENT_DATE - INTERVAL '%s days' % p_days
    GROUP BY DATE(created_at), provider, created_at, tokens_used
  ) grouped
  GROUP BY DATE(created_at)
  ORDER BY DATE(created_at) DESC;
END;
$$;

-- Create a function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limits(
  p_workspace_id TEXT,
  p_daily_limit INTEGER DEFAULT 100000
)
RETURNS TABLE (
  within_limits BOOLEAN,
  current_usage INTEGER,
  limit_value INTEGER,
  reset_time TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_usage INTEGER;
  tomorrow TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate tomorrow at midnight for reset time
  tomorrow := DATE_TRUNC('day', NOW() + INTERVAL '1 day');
  
  -- Get today's usage
  SELECT COALESCE(SUM(tokens_used), 0)
  INTO today_usage
  FROM api_usage_logs
  WHERE workspace_id = p_workspace_id
    AND DATE(created_at) = CURRENT_DATE;
  
  RETURN QUERY
  SELECT 
    today_usage < p_daily_limit as within_limits,
    today_usage as current_usage,
    p_daily_limit as limit_value,
    tomorrow as reset_time;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_daily_usage_summary(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_limits(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_usage_summary(TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION check_usage_limits(TEXT, INTEGER) TO service_role;

-- Create a view for easy usage analytics
CREATE OR REPLACE VIEW usage_analytics AS
SELECT 
  workspace_id,
  provider,
  DATE(created_at) as usage_date,
  COUNT(*) as total_requests,
  SUM(tokens_used) as total_tokens,
  AVG(tokens_used) as avg_tokens_per_request,
  COUNT(CASE WHEN response_status = 'error' THEN 1 END) as error_count,
  COUNT(CASE WHEN response_status = 'rate_limited' THEN 1 END) as rate_limited_count
FROM api_usage_logs
GROUP BY workspace_id, provider, DATE(created_at)
ORDER BY usage_date DESC;

-- Grant permissions on the view
GRANT SELECT ON usage_analytics TO authenticated;
GRANT SELECT ON usage_analytics TO service_role;

-- Add comment for documentation
COMMENT ON TABLE api_usage_logs IS 'Tracks API usage for LLM providers per workspace for billing and rate limiting';
COMMENT ON FUNCTION get_daily_usage_summary(TEXT, INTEGER) IS 'Returns daily usage summary for a workspace over specified days';
COMMENT ON FUNCTION check_usage_limits(TEXT, INTEGER) IS 'Checks if workspace is within daily usage limits';
COMMENT ON VIEW usage_analytics IS 'Aggregated view of API usage analytics by workspace and provider';