package pl.strava.analizator.infrastructure.persistence.ai;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ai_embeddings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiEmbeddingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "source_type", nullable = false, length = 50)
    private String sourceType;

    @Column(name = "source_id", nullable = false, length = 100)
    private String sourceId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * Stored as pgvector 'vector(384)'. Hibernate does not have native pgvector support,
     * so we store/retrieve using native queries.
     */
    @Column(name = "embedding", columnDefinition = "vector(384)", insertable = false, updatable = false)
    private String embeddingRaw;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Object metadata;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
