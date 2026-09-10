package pl.strava.analizator.domain.ai;

import java.util.List;
import java.util.Optional;

public interface KnowledgeIndexPort {

    /**
     * Atomically replaces the active corpus. An implementation must leave the previous
     * corpus intact when any write fails.
     */
    void replaceAll(List<KnowledgeIndexEntry> entries);

    List<KnowledgeDocument> findSimilar(float[] queryEmbedding, int topK, KnowledgeType typeFilter);

    long count();

    Optional<String> currentCorpusVersion();

    boolean isAvailable();
}
