CREATE TABLE ai_settings (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    language VARCHAR(8) NOT NULL CHECK (language IN ('pl', 'en')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
