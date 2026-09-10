package pl.strava.analizator.domain.ai;

import java.util.Objects;

/**
 * A knowledge document together with the vector prepared for the same corpus snapshot.
 */
public record KnowledgeIndexEntry(KnowledgeDocument document, float[] embedding) {

    public KnowledgeIndexEntry {
        Objects.requireNonNull(document, "document");
        Objects.requireNonNull(embedding, "embedding");
        embedding = embedding.clone();
    }

    @Override
    public float[] embedding() {
        return embedding.clone();
    }
}
