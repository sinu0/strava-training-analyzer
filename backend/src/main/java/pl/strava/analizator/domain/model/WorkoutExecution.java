package pl.strava.analizator.domain.model;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
public class WorkoutExecution {
    private final UUID id;
    private final UUID scheduledWorkoutId;
    private final Integer workoutTemplateRevision;
    private final String workoutNameSnapshot;
    private final List<WorkoutStep> stepsSnapshot;
    private final Integer ftpWatts;
    private final Integer lthrBpm;
    private final Integer maxHrBpm;
    private final Integer restingHrBpm;
    private final Instant startedAt;
    private final Instant finishedAt;
    private final WorkoutExecutionStatus status;
    private final int currentStepIndex;
    private final long workoutElapsedMs;
    private final long stepElapsedMs;
    private final Instant runningSince;
    private final int intensityAdjustmentPct;
    private final List<Integer> skippedStepIndexes;
    private final List<Integer> repeatedStepIndexes;
    private final Integer rpe;
    private final String feeling;
    private final String notes;
    private final UUID activityId;
    private final String activityMatchStatus;
    private final String complianceStatus;
    private final Integer complianceScore;
    private final String complianceAlgorithmVersion;
    private final String startIdempotencyKey;
    private final String finishIdempotencyKey;
    private final String deliveryMethod;
    private final long stateVersion;
    private final Instant createdAt;
    private final Instant updatedAt;
}
