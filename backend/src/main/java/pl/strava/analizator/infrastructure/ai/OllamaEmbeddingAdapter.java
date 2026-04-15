package pl.strava.analizator.infrastructure.ai;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

import pl.strava.analizator.domain.ai.EmbeddingPort;

/**
 * RAG embedding adapter using Ollama's /api/embeddings endpoint and pgvector for storage/search.
 * Uses 384-dimensional embeddings (all-minilm model).
 */
@Component
@ConditionalOnProperty(name = "ai.ollama.enabled", havingValue = "true", matchIfMissing = false)
public class OllamaEmbeddingAdapter implements EmbeddingPort {

    private static final Logger log = LoggerFactory.getLogger(OllamaEmbeddingAdapter.class);
    private static final int EMBEDDING_DIM = 384;

    private final String ollamaBaseUrl;
    private final String embeddingModel;
    private final RestTemplate restTemplate;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public OllamaEmbeddingAdapter(
            @Value("${ai.ollama.base-url:http://localhost:11434}") String ollamaBaseUrl,
            @Value("${ai.embedding.model:all-minilm}") String embeddingModel,
            RestTemplate restTemplate,
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper) {
        this.ollamaBaseUrl = ollamaBaseUrl;
        this.embeddingModel = embeddingModel;
        this.restTemplate = restTemplate;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public float[] embed(String text) {
        try {
            String url = ollamaBaseUrl + "/api/embeddings";
            Map<String, Object> body = Map.of(
                    "model", embeddingModel,
                    "prompt", text
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Map.class);

            if (response.getBody() != null && response.getBody().containsKey("embedding")) {
                @SuppressWarnings("unchecked")
                List<Number> embeddingList = (List<Number>) response.getBody().get("embedding");
                float[] result = new float[embeddingList.size()];
                for (int i = 0; i < embeddingList.size(); i++) {
                    result[i] = embeddingList.get(i).floatValue();
                }
                return result;
            }
            throw new RuntimeException("No embedding in Ollama response");
        } catch (Exception e) {
            log.error("Failed to generate embedding: {}", e.getMessage());
            throw new RuntimeException("Embedding generation failed", e);
        }
    }

    @Override
    public void store(String sourceType, String sourceId, String content, float[] embedding, Map<String, Object> metadata) {
        String vectorStr = arrayToVectorString(embedding);
        String metadataJson;
        try {
            metadataJson = metadata != null ? objectMapper.writeValueAsString(metadata) : null;
        } catch (Exception e) {
            metadataJson = null;
        }

        jdbcTemplate.update(
                "INSERT INTO ai_embeddings (id, source_type, source_id, content, embedding, metadata, created_at) " +
                "VALUES (?, ?, ?, ?, ?::vector, ?::jsonb, ?)",
                UUID.randomUUID(), sourceType, sourceId, content, vectorStr, metadataJson, Instant.now()
        );
    }

    @Override
    public List<SimilarDocument> findSimilar(float[] queryEmbedding, int topK) {
        String vectorStr = arrayToVectorString(queryEmbedding);

        return jdbcTemplate.query(
                "SELECT source_type, source_id, content, 1 - (embedding <=> ?::vector) AS similarity " +
                "FROM ai_embeddings ORDER BY embedding <=> ?::vector LIMIT ?",
                (rs, rowNum) -> new SimilarDocument(
                        rs.getString("source_type"),
                        rs.getString("source_id"),
                        rs.getString("content"),
                        rs.getDouble("similarity")
                ),
                vectorStr, vectorStr, topK
        );
    }

    private String arrayToVectorString(float[] arr) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < arr.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(arr[i]);
        }
        sb.append("]");
        return sb.toString();
    }
}
