ALTER TABLE twitch_accounts ADD COLUMN IF NOT EXISTS connection_status VARCHAR(50) DEFAULT 'offline';
ALTER TABLE twitch_accounts ADD COLUMN IF NOT EXISTS last_connection_time TIMESTAMP;
ALTER TABLE twitch_accounts ADD COLUMN IF NOT EXISTS connection_error TEXT;

CREATE TABLE IF NOT EXISTS bot_sessions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL,
  channel_id INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'starting',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  messages_sent INTEGER DEFAULT 0,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_bot_sessions_status ON bot_sessions(status);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_account ON bot_sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_channel ON bot_sessions(channel_id);