/*
  # Meta Ads Integration Schema

  1. New Tables
    - `meta_credentials`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `ad_account_id` (text)
      - `encrypted_access_token` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `meta_campaigns`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `campaign_id` (text)
      - `campaign_name` (text)
      - `spend` (numeric)
      - `impressions` (integer)
      - `clicks` (integer)
      - `conversions` (integer)
      - `revenue` (numeric)
      - `date` (date)
      - `synced_at` (timestamp)
    
    - `campaign_alerts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `campaign_id` (text)
      - `alert_type` (text)
      - `message` (text)
      - `severity` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `resolved_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Meta Ads Credentials Table
CREATE TABLE IF NOT EXISTS meta_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ad_account_id text NOT NULL,
  encrypted_access_token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE meta_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own Meta credentials"
  ON meta_credentials
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Meta Campaigns Table
CREATE TABLE IF NOT EXISTS meta_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  campaign_id text NOT NULL,
  campaign_name text NOT NULL,
  spend numeric(10,2) DEFAULT 0,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  revenue numeric(10,2) DEFAULT 0,
  date date NOT NULL,
  synced_at timestamptz DEFAULT now(),
  UNIQUE(user_id, campaign_id, date)
);

ALTER TABLE meta_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own Meta campaigns"
  ON meta_campaigns
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Campaign Alerts Table
CREATE TABLE IF NOT EXISTS campaign_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  campaign_id text NOT NULL,
  alert_type text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  CHECK (severity IN ('high', 'medium', 'low')),
  CHECK (status IN ('active', 'dismissed', 'resolved'))
);

ALTER TABLE campaign_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own campaign alerts"
  ON campaign_alerts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_user_date ON meta_campaigns(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_user_campaign ON meta_campaigns(user_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_alerts_user_status ON campaign_alerts(user_id, status);