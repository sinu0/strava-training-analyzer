-- In-app ride recording (trainer mode): 1 Hz samples uploaded in idempotent chunks.
CREATE TABLE workout_execution_sample_chunks (
    execution_id UUID NOT NULL REFERENCES workout_executions(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
    samples JSONB NOT NULL,
    sample_count INTEGER NOT NULL CHECK (sample_count BETWEEN 1 AND 600),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (execution_id, chunk_index)
);
