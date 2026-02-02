CREATE TABLE IF NOT EXISTS bot_configs (
    id SERIAL PRIMARY KEY,
    channel_id UUID NOT NULL UNIQUE,
    config_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bot_configs_channel_id ON bot_configs(channel_id);
CREATE INDEX IF NOT EXISTS idx_bot_configs_updated_at ON bot_configs(updated_at);