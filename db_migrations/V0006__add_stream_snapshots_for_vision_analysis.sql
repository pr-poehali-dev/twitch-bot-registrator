-- Добавляем таблицу для хранения скриншотов стрима и их анализа
CREATE TABLE IF NOT EXISTS stream_snapshots (
    id SERIAL PRIMARY KEY,
    channel_id TEXT NOT NULL,
    screenshot_url TEXT NOT NULL,
    analysis_text TEXT,
    detected_game TEXT,
    detected_activity TEXT,
    viewer_reactions JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    analyzed_at TIMESTAMP
);

-- Индекс для быстрого поиска последних скриншотов канала
CREATE INDEX idx_stream_snapshots_channel_created ON stream_snapshots(channel_id, created_at DESC);

-- Добавляем поля в chat_messages для связи с визуальным контекстом
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS snapshot_id INTEGER,
ADD COLUMN IF NOT EXISTS visual_context_used TEXT;

COMMENT ON TABLE stream_snapshots IS 'Скриншоты стримов и их AI-анализ для контекстных реакций ботов';
COMMENT ON COLUMN stream_snapshots.analysis_text IS 'Общий анализ происходящего на стриме от GPT-4o Vision';
COMMENT ON COLUMN stream_snapshots.viewer_reactions IS 'Массив сгенерированных реакций зрителей на происходящее';
COMMENT ON COLUMN chat_messages.snapshot_id IS 'ID скриншота стрима на момент отправки сообщения';
COMMENT ON COLUMN chat_messages.visual_context_used IS 'Визуальный контекст из анализа скриншота';