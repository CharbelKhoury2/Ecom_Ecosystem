-- Create conversation history and context persistence tables

-- Conversations table to store conversation metadata
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  context JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table to store individual messages in conversations
CREATE TABLE conversation_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('user_query', 'ai_response')),
  content TEXT NOT NULL,
  query_classification JSONB,
  sentiment_analysis JSONB,
  response_metadata JSONB DEFAULT '{}',
  processing_time INTEGER,
  model_used TEXT,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User context table to store persistent user preferences and settings
CREATE TABLE user_contexts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  preferences JSONB DEFAULT '{}',
  business_context JSONB DEFAULT '{}',
  frequently_asked JSONB DEFAULT '{}',
  customizations JSONB DEFAULT '{}',
  interaction_patterns JSONB DEFAULT '{}',
  last_topics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation analytics table for insights and metrics
CREATE TABLE conversation_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  session_duration INTEGER,
  message_count INTEGER DEFAULT 0,
  topics_discussed JSONB DEFAULT '[]',
  sentiment_trend JSONB DEFAULT '{}',
  satisfaction_score DECIMAL(3,2),
  resolution_status TEXT CHECK (resolution_status IN ('resolved', 'pending', 'escalated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_activity ON conversations(last_activity_at DESC);

CREATE INDEX idx_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX idx_messages_user_id ON conversation_messages(user_id);
CREATE INDEX idx_messages_created_at ON conversation_messages(created_at DESC);
CREATE INDEX idx_messages_type ON conversation_messages(message_type);

CREATE INDEX idx_user_contexts_user_id ON user_contexts(user_id);
CREATE INDEX idx_analytics_conversation_id ON conversation_analytics(conversation_id);
CREATE INDEX idx_analytics_user_id ON conversation_analytics(user_id);

-- Create function to update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW(), last_activity_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update conversation timestamp when messages are added
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Create function to update user context timestamp
CREATE OR REPLACE FUNCTION update_user_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user context updates
CREATE TRIGGER trigger_update_user_context_timestamp
  BEFORE UPDATE ON user_contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_context_timestamp();

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own conversations" ON conversations
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create RLS policies for messages
CREATE POLICY "Users can view their own messages" ON conversation_messages
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own messages" ON conversation_messages
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create RLS policies for user contexts
CREATE POLICY "Users can view their own context" ON user_contexts
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own context" ON user_contexts
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own context" ON user_contexts
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create RLS policies for analytics
CREATE POLICY "Users can view their own analytics" ON conversation_analytics
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own analytics" ON conversation_analytics
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Grant permissions to authenticated users
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_messages TO authenticated;
GRANT ALL ON user_contexts TO authenticated;
GRANT ALL ON conversation_analytics TO authenticated;

-- Grant permissions to anon users for demo purposes
GRANT SELECT, INSERT, UPDATE ON conversations TO anon;
GRANT SELECT, INSERT, UPDATE ON conversation_messages TO anon;
GRANT SELECT, INSERT, UPDATE ON user_contexts TO anon;
GRANT SELECT, INSERT, UPDATE ON conversation_analytics TO anon;

-- Create view for conversation summaries
CREATE VIEW conversation_summaries AS
SELECT 
  c.id,
  c.user_id,
  c.title,
  c.summary,
  c.status,
  c.created_at,
  c.updated_at,
  c.last_activity_at,
  COUNT(cm.id) as message_count,
  MAX(cm.created_at) as last_message_at
FROM conversations c
LEFT JOIN conversation_messages cm ON c.id = cm.conversation_id
GROUP BY c.id, c.user_id, c.title, c.summary, c.status, c.created_at, c.updated_at, c.last_activity_at;

-- Grant access to the view
GRANT SELECT ON conversation_summaries TO authenticated;
GRANT SELECT ON conversation_summaries TO anon;