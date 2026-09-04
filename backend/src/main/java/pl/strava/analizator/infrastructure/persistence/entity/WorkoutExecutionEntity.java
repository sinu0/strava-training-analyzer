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
@Table(name = "workout_executions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutExecutionEntity {
    @Id
    private UUID id;
    @Column(name = "training_plan_id", nullable = false)
    private UUID trainingPlanId;
    @Column(name = "workout_template_revision")
    private Integer workoutTemplateRevision;
    @Column(name = "workout_name_snapshot", nullable = false)
    private String workoutNameSnapshot;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "workout_steps_snapshot", nullable = false, columnDefinition = "jsonb")
    private String workoutStepsSnapshot;
    @Column(name = "ftp_watts")
    private Integer ftpWatts;
    @Column(name = "lthr_bpm")
    private Integer lthrBpm;
    @Column(name = "max_hr_bpm")
    private Integer maxHrBpm;
    @Column(name = "resting_hr_bpm")
    private Integer restingHrBpm;
    @Column(name = "started_at", nullable = false)
    private Instant startedAt;
    @Column(name = "finished_at")
    private Instant finishedAt;
    @Column(name = "status", nullable = false)
    private String status;
    @Column(name = "current_step_index", nullable = false)
    private int currentStepIndex;
    @Column(name = "workout_elapsed_ms", nullable = false)
    private long workoutElapsedMs;
    @Column(name = "step_elapsed_ms", nullable = false)
    private long stepElapsedMs;
    @Column(name = "running_since")
    private Instant runningSince;
    @Column(name = "intensity_adjustment_pct", nullable = false)
    private int intensityAdjustmentPct;
    @Column(name = "skipped_step_indexes", nullable = false, columnDefinition = "integer[]")
    private Integer[] skippedStepIndexes;
    @Column(name = "repeated_step_indexes", nullable = false, columnDefinition = "integer[]")
    private Integer[] repeatedStepIndexes;
    private Integer rpe;
    private String feeling;
    private String notes;
    @Column(name = "activity_id")
    private UUID activityId;
    @Column(name = "activity_match_status", nullable = false)
    private String activityMatchStatus;
    @Column(name = "compliance_status", nullable = false)
    private String complianceStatus;
    @Column(name = "compliance_score")
    private Integer complianceScore;
    @Column(name = "compliance_algorithm_version", nullable = false)
    private String complianceAlgorithmVersion;
    @Column(name = "start_idempotency_key", nullable = false)
    private String startIdempotencyKey;
    @Column(name = "finish_idempotency_key")
    private String finishIdempotencyKey;
    @Column(name = "delivery_method", nullable = false)
    private String deliveryMethod;
    @Column(name = "state_version", nullable = false)
    private long stateVersion;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
