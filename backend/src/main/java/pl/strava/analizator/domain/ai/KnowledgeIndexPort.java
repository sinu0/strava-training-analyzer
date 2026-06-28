package pl.strava.analizator.domain.ai;

import java.util.List;

public interface KnowledgeIndexPort {

    void store(KnowledgeDocument doc, float[] embedding);

    List<KnowledgeDocument> findSimilar(float[] queryEmbedding, int topK, KnowledgeType typeFilter);

    long count();

    void clear();

    boolean isAvailable();
}
