CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    mood VARCHAR(20) NOT NULL DEFAULT 'OK',
    note TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_journal_activity UNIQUE (activity_id)
);
CREATE INDEX idx_journal_activity ON journal_entries(activity_id);
CREATE INDEX idx_journal_mood ON journal_entries(mood);
