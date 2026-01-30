CREATE TABLE IF NOT EXISTS twitch_accounts (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  oauth_token TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used TIMESTAMP,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS registration_logs (
  id SERIAL PRIMARY KEY,
  account_id INTEGER,
  log_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_status ON twitch_accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON twitch_accounts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON registration_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_type ON registration_logs(log_type);