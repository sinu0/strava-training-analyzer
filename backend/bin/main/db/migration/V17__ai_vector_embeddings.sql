-- V17: RAG - Vector embeddings for activity data
-- Requires pgvector extension (install via: apt-get install postgresql-16-pgvector in DB container)

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE ai_embeddings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type     VARCHAR(50)  NOT NULL, -- 'activity', 'metric', 'summary'
    source_id       VARCHAR(100) NOT NULL,
    content         TEXT         NOT NULL,
    embedding       vector(384)  NOT NULL, -- all-MiniLM-L6-v2 produces 384-dim
    metadata        JSONB,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_embeddings_source ON ai_embeddings (source_type, source_id);
CREATE INDEX idx_ai_embeddings_vector ON ai_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
