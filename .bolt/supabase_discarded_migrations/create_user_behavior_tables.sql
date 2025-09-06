-- User Behavior Tracking Tables
-- This migration creates tables for comprehensive user behavior analytics

-- User profiles table for storing user preferences and metadata
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{}',
  segments TEXT[] DEFAULT '{}',
  total_queries INTEGER DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  engagement_score DECIMAL(5,2) DEFAULT 0.0,
  satisfaction_score DECIMAL(5,2) DEFAULT 0.0
);

-- User queries table for tracking all user interactions
CREATE TABLE IF NOT EXISTS user_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  query_text TEXT NOT NULL,
  intent TEXT,
  category TEXT,
  sentiment TEXT,
  sentiment_score DECIMAL(5,2),
  response_text TEXT,
  response_type TEXT,
  processing_time INTEGER, -- in milliseconds
  success BOOLEAN DEFAULT true,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  session_id TEXT,
  context JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table for tracking user sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in seconds
  query_count INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  actions_taken JSONB DEFAULT '[]',
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT
);

-- User recommendations table for storing personalized recommendations
CREATE TABLE IF NOT EXISTS user_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  recommendation_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  action_url TEXT,
  priority INTEGER DEFAULT 1,
  confidence_score DECIMAL(5,2),
  is_viewed BOOLEAN DEFAULT false,
  is_clicked BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE
);

-- User behavior patterns table for ML insights
CREATE TABLE IF NOT EXISTS user_behavior_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  confidence_score DECIMAL(5,2),
  frequency INTEGER DEFAULT 1,
  last_occurrence TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User feedback table for collecting user satisfaction data
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  query_id UUID REFERENCES user_queries(id),
  feedback_type TEXT NOT NULL, -- 'rating', 'comment', 'suggestion'
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  category TEXT,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_queries_user_id ON user_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_queries_created_at ON user_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_user_queries_category ON user_queries(category);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_type ON user_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_user_behavior_patterns_user_id ON user_behavior_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can view their own profiles" ON user_profiles
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own profiles" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own profiles" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own queries" ON user_queries
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own queries" ON user_queries
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own recommendations" ON user_recommendations
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own recommendations" ON user_recommendations
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own behavior patterns" ON user_behavior_patterns
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own feedback" ON user_feedback
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own feedback" ON user_feedback
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE ON user_profiles TO anon, authenticated;
GRANT SELECT, INSERT ON user_queries TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON user_sessions TO anon, authenticated;
GRANT SELECT, UPDATE ON user_recommendations TO anon, authenticated;
GRANT SELECT ON user_behavior_patterns TO anon, authenticated;
GRANT SELECT, INSERT ON user_feedback TO anon, authenticated;

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_behavior_patterns_updated_at
  BEFORE UPDATE ON user_behavior_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update user profile stats
CREATE OR REPLACE FUNCTION update_user_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total queries count and last active time
  UPDATE user_profiles 
  SET 
    total_queries = total_queries + 1,
    last_active = NOW()
  WHERE user_id = NEW.user_id;
  
  -- Create user profile if it doesn't exist
  INSERT INTO user_profiles (user_id, total_queries, last_active)
  VALUES (NEW.user_id, 1, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update user stats
CREATE TRIGGER update_user_stats_on_query
  AFTER INSERT ON user_queries
  FOR EACH ROW EXECUTE FUNCTION update_user_profile_stats();