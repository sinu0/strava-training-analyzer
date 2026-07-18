CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(30) NOT NULL,
    mode VARCHAR(30) NOT NULL,
    stage VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL,
    attempt INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_processing_jobs_status_created
    ON processing_jobs(status, created_at DESC);

CREATE UNIQUE INDEX uq_processing_jobs_active_type
    ON processing_jobs(job_type)
    WHERE status IN ('QUEUED', 'RUNNING');
