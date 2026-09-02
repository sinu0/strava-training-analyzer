ALTER TABLE ai_note_queue
    ADD COLUMN next_attempt_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;

UPDATE ai_note_queue
SET next_attempt_at = CASE WHEN status = 'pending' THEN created_at ELSE NULL END,
    updated_at = COALESCE(completed_at, started_at, created_at);

ALTER TABLE ai_note_queue
    ALTER COLUMN updated_at SET NOT NULL;

CREATE INDEX idx_ai_note_queue_due
    ON ai_note_queue(status, next_attempt_at, created_at);
