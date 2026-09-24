-- Transient source failures (lost network, Strava 5xx) are retried with backoff
-- instead of leaving a historical backfill permanently FAILED.
ALTER TABLE analysis_backfill_state
    ADD COLUMN retry_at TIMESTAMPTZ,
    ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;

-- Recover a backfill that already stopped on a network error so it resumes without a click.
UPDATE analysis_backfill_state
SET status = 'RETRYING', retry_at = NOW(), attempt_count = 1, updated_at = NOW()
WHERE status = 'FAILED'
  AND (error_message ILIKE '%unreachable%'
       OR error_message ILIKE '%timed out%'
       OR error_message ILIKE '%connection refused%'
       OR error_message ILIKE '%I/O error%');
