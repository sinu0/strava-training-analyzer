-- Persist provider reset time so rate-limited imports can resume after restarts.

ALTER TABLE processing_jobs
    ADD COLUMN IF NOT EXISTS retry_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_processing_jobs_retry_due
    ON processing_jobs(job_type, retry_at)
    WHERE status = 'RETRYABLE' AND retry_at IS NOT NULL;
