CREATE TABLE IF NOT EXISTS twitch_channels (
  id SERIAL PRIMARY KEY,
  channel_name VARCHAR(255) NOT NULL,
  channel_url TEXT NOT NULL,
  target_viewers INTEGER DEFAULT 0,
  active_bots INTEGER DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE twitch_accounts ADD COLUMN IF NOT EXISTS assigned_channel_id INTEGER;
ALTER TABLE twitch_accounts ADD COLUMN IF NOT EXISTS is_active_on_channel BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_channels_status ON twitch_channels(status);
CREATE INDEX IF NOT EXISTS idx_accounts_channel ON twitch_accounts(assigned_channel_id);