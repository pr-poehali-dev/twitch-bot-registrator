CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL,
  channel_id INTEGER NOT NULL,
  session_id INTEGER,
  message_text TEXT NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'sent'
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_account ON chat_messages(account_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);