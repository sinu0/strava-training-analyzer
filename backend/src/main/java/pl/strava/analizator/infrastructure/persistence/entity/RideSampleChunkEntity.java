package pl.strava.analizator.infrastructure.persistence.entity;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "workout_execution_sample_chunks")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideSampleChunkEntity {
    @EmbeddedId
    private Key id;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "samples", nullable = false, columnDefinition = "jsonb")
    private String samples;

    @Column(name = "sample_count", nullable = false)
    private int sampleCount;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class Key implements Serializable {
        @Column(name = "execution_id", nullable = false)
        private UUID executionId;
        @Column(name = "chunk_index", nullable = false)
        private int chunkIndex;
    }
}
