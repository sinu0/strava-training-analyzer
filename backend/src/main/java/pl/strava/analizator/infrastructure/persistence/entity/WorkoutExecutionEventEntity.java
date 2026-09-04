package pl.strava.analizator.infrastructure.persistence.entity;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "workout_execution_events")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutExecutionEventEntity {
    @Id
    private UUID id;
    @Column(name = "execution_id", nullable = false)
    private UUID executionId;
    @Column(name = "sequence_no", nullable = false)
    private int sequenceNo;
    @Column(name = "event_type", nullable = false)
    private String eventType;
    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;
    @Column(name = "workout_elapsed_ms", nullable = false)
    private long workoutElapsedMs;
    @Column(name = "step_index")
    private Integer stepIndex;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", nullable = false, columnDefinition = "jsonb")
    private String payload;
    @Column(name = "idempotency_key", nullable = false)
    private String idempotencyKey;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
