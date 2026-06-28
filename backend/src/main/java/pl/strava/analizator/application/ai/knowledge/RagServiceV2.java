package pl.strava.analizator.application.ai.knowledge;

import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.ai.EmbeddingPort;
import pl.strava.analizator.domain.ai.KnowledgeDocument;
import pl.strava.analizator.domain.ai.KnowledgeIndexPort;
import pl.strava.analizator.domain.ai.KnowledgeType;
import pl.strava.analizator.domain.ai.PredictionType;

@Component
@ConditionalOnBean({EmbeddingPort.class, KnowledgeIndexPort.class})
public class RagServiceV2 {

    private static final Logger log = LoggerFactory.getLogger(RagServiceV2.class);

    private final EmbeddingPort embeddingPort;
    private final KnowledgeIndexPort knowledgeIndexPort;

    public RagServiceV2(EmbeddingPort embeddingPort, KnowledgeIndexPort knowledgeIndexPort) {
        this.embeddingPort = embeddingPort;
        this.knowledgeIndexPort = knowledgeIndexPort;
    }

    public String retrieveAndFormat(PredictionType type, String query, int topK) {
        if (!knowledgeIndexPort.isAvailable()) {
            log.debug("Knowledge index not available, skipping RAG");
            return "";
        }

        long count = knowledgeIndexPort.count();
        if (count == 0) {
            log.debug("Knowledge index empty, skipping RAG");
            return "";
        }

        try {
            float[] queryEmbedding = embeddingPort.embed(query);
            List<KnowledgeDocument> results = knowledgeIndexPort.findSimilar(queryEmbedding, topK, null);

            if (results.isEmpty()) return "";

            return formatResults(results);
        } catch (Exception e) {
            log.warn("RAG retrieval failed: {}", e.getMessage());
            return "";
        }
    }

    private String formatResults(List<KnowledgeDocument> docs) {
        StringBuilder sb = new StringBuilder();
        sb.append("RELEVANT TRAINING KNOWLEDGE (from indexed sports science sources):\n\n");

        for (KnowledgeDocument doc : docs) {
            String typeLabel = "[" + doc.getType() + "]";
            sb.append(typeLabel).append(" ");
            if (doc.getTitle() != null && !doc.getTitle().isBlank()) {
                sb.append("Source: ").append(doc.getTitle()).append("\n");
            }
            String content = doc.getContent();
            sb.append(content.substring(0, Math.min(content.length(), 500)));
            sb.append("\n\n---\n\n");
        }

        return sb.toString();
    }

    public boolean isAvailable() {
        return knowledgeIndexPort.isAvailable() && knowledgeIndexPort.count() > 0;
    }
}
