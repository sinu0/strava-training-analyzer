-- Recover legacy retries and prevent queued/running work from coexisting with a scheduled retry.

UPDATE processing_jobs retryable
SET status = 'FAILED',
    error_message = COALESCE(error_message, 'Superseded by a newer processing job'),
    retry_at = NULL,
    completed_at = COALESCE(completed_at, now()),
    updated_at = now()
WHERE retryable.status = 'RETRYABLE'
  AND retryable.retry_at IS NULL
  AND EXISTS (
      SELECT 1
      FROM processing_jobs newer
      WHERE newer.job_type = retryable.job_type
        AND newer.created_at > retryable.created_at
  );

UPDATE processing_jobs retryable
SET status = 'FAILED',
    error_message = COALESCE(error_message, 'Superseded by an active processing job'),
    retry_at = NULL,
    completed_at = COALESCE(completed_at, now()),
    updated_at = now()
WHERE retryable.status = 'RETRYABLE'
  AND EXISTS (
      SELECT 1
      FROM processing_jobs active
      WHERE active.job_type = retryable.job_type
        AND active.status IN ('QUEUED', 'RUNNING')
  );

UPDATE processing_jobs
SET retry_at = now(),
    updated_at = now()
WHERE status = 'RETRYABLE'
  AND retry_at IS NULL;

WITH ranked_retries AS (
    SELECT id,
           row_number() OVER (PARTITION BY job_type ORDER BY created_at DESC, id DESC) AS position
    FROM processing_jobs
    WHERE status = 'RETRYABLE'
)
UPDATE processing_jobs job
SET status = 'FAILED',
    error_message = COALESCE(error_message, 'Superseded by a newer scheduled retry'),
    retry_at = NULL,
    completed_at = COALESCE(completed_at, now()),
    updated_at = now()
FROM ranked_retries ranked
WHERE job.id = ranked.id
  AND ranked.position > 1;

DROP INDEX IF EXISTS uq_processing_jobs_active_type;

CREATE UNIQUE INDEX uq_processing_jobs_unfinished_type
    ON processing_jobs(job_type)
    WHERE status IN ('QUEUED', 'RUNNING', 'RETRYABLE');
