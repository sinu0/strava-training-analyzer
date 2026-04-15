package pl.strava.analizator.application.ai;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;

import pl.strava.analizator.domain.ai.EmbeddingPort;

/**
 * RAG (Retrieval-Augmented Generation) service.
 * Uses vector embeddings to find relevant historical context for AI predictions.
 */
@Service
@ConditionalOnBean(EmbeddingPort.class)
public class RagService {

    private static final Logger log = LoggerFactory.getLogger(RagService.class);
    private static final int DEFAULT_TOP_K = 5;

    private final EmbeddingPort embeddingPort;

    public RagService(EmbeddingPort embeddingPort) {
        this.embeddingPort = embeddingPort;
    }

    /**
     * Index a piece of training data for later RAG retrieval.
     */
    public void indexContent(String sourceType, String sourceId, String content, Map<String, Object> metadata) {
        try {
            float[] embedding = embeddingPort.embed(content);
            embeddingPort.store(sourceType, sourceId, content, embedding, metadata);
            log.debug("Indexed content: type={}, id={}", sourceType, sourceId);
        } catch (Exception e) {
            log.warn("Failed to index content: {}", e.getMessage());
        }
    }

    /**
     * Retrieve relevant context for a query using vector similarity search.
     * Returns formatted context string to be injected into the LLM prompt.
     */
    public String retrieveContext(String query, int topK) {
        try {
            float[] queryEmbedding = embeddingPort.embed(query);
            List<EmbeddingPort.SimilarDocument> similar = embeddingPort.findSimilar(queryEmbedding, topK);

            if (similar.isEmpty()) {
                return "";
            }

            return similar.stream()
                    .map(doc -> String.format("[%s/%s (similarity: %.2f)] %s",
                            doc.sourceType(), doc.sourceId(), doc.similarity(), doc.content()))
                    .collect(Collectors.joining("\n\n"));
        } catch (Exception e) {
            log.warn("RAG retrieval failed: {}", e.getMessage());
            return "";
        }
    }

    /**
     * Retrieve relevant context with default topK.
     */
    public String retrieveContext(String query) {
        return retrieveContext(query, DEFAULT_TOP_K);
    }
}
