-- Track exact source content and active corpus snapshot for idempotent, auditable RAG refreshes.

ALTER TABLE ai_knowledge_documents
    ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS corpus_version VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_corpus_version
    ON ai_knowledge_documents(corpus_version);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_knowledge_corpus_chunk
    ON ai_knowledge_documents(corpus_version, source, url, chunk_index)
    WHERE corpus_version IS NOT NULL;
