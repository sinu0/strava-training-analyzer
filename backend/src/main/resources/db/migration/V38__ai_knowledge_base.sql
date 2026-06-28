-- V38: AI Knowledge Base — sports science documents with vector embeddings

CREATE TABLE IF NOT EXISTS ai_knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL,
    url TEXT,
    title VARCHAR(500),
    doc_type VARCHAR(50) NOT NULL,
    topics TEXT[],
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL DEFAULT 0,
    embedding vector(384),
    embedded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    refreshed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_doc_type ON ai_knowledge_documents(doc_type);
CREATE INDEX idx_knowledge_topics ON ai_knowledge_documents USING GIN(topics);
CREATE INDEX idx_knowledge_source ON ai_knowledge_documents(source);
CREATE INDEX idx_ai_knowledge_embedding ON ai_knowledge_documents
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
