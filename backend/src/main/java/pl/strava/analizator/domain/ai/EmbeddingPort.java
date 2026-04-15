package pl.strava.analizator.domain.ai;

import java.util.List;

/**
 * Port for vector embedding operations (RAG).
 * Infrastructure layer implements with pgvector + embedding model.
 */
public interface EmbeddingPort {

    /**
     * Generate an embedding vector for the given text.
     */
    float[] embed(String text);

    /**
     * Store an embedding for a piece of content.
     */
    void store(String sourceType, String sourceId, String content, float[] embedding, java.util.Map<String, Object> metadata);

    /**
     * Find the most similar content to a query embedding.
     */
    List<SimilarDocument> findSimilar(float[] queryEmbedding, int topK);

    /**
     * Record representing a similar document found via vector search.
     */
    record SimilarDocument(String sourceType, String sourceId, String content, double similarity) {}
}
