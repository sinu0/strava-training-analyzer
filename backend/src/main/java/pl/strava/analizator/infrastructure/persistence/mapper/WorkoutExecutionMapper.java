package pl.strava.analizator.infrastructure.persistence.mapper;

import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.WorkoutExecution;
import pl.strava.analizator.domain.model.WorkoutExecutionStatus;
import pl.strava.analizator.infrastructure.persistence.entity.WorkoutExecutionEntity;

@Component
@RequiredArgsConstructor
public class WorkoutExecutionMapper {
    private final WorkoutStepJsonCodec stepCodec;

    public WorkoutExecution toDomain(WorkoutExecutionEntity entity) {
        return WorkoutExecution.builder()
                .id(entity.getId()).scheduledWorkoutId(entity.getTrainingPlanId())
                .workoutTemplateRevision(entity.getWorkoutTemplateRevision())
                .workoutNameSnapshot(entity.getWorkoutNameSnapshot())
                .stepsSnapshot(stepCodec.deserialize(entity.getWorkoutStepsSnapshot()))
                .ftpWatts(entity.getFtpWatts()).lthrBpm(entity.getLthrBpm())
                .maxHrBpm(entity.getMaxHrBpm()).restingHrBpm(entity.getRestingHrBpm())
                .startedAt(entity.getStartedAt()).finishedAt(entity.getFinishedAt())
                .status(WorkoutExecutionStatus.valueOf(entity.getStatus()))
                .currentStepIndex(entity.getCurrentStepIndex())
                .workoutElapsedMs(entity.getWorkoutElapsedMs()).stepElapsedMs(entity.getStepElapsedMs())
                .runningSince(entity.getRunningSince())
                .intensityAdjustmentPct(entity.getIntensityAdjustmentPct())
                .skippedStepIndexes(asList(entity.getSkippedStepIndexes()))
                .repeatedStepIndexes(asList(entity.getRepeatedStepIndexes()))
                .rpe(entity.getRpe()).feeling(entity.getFeeling()).notes(entity.getNotes())
                .activityId(entity.getActivityId()).activityMatchStatus(entity.getActivityMatchStatus())
                .complianceStatus(entity.getComplianceStatus()).complianceScore(entity.getComplianceScore())
                .complianceAlgorithmVersion(entity.getComplianceAlgorithmVersion())
                .startIdempotencyKey(entity.getStartIdempotencyKey())
                .finishIdempotencyKey(entity.getFinishIdempotencyKey())
                .deliveryMethod(entity.getDeliveryMethod()).stateVersion(entity.getStateVersion())
                .createdAt(entity.getCreatedAt()).updatedAt(entity.getUpdatedAt()).build();
    }

    public WorkoutExecutionEntity toEntity(WorkoutExecution execution) {
        return WorkoutExecutionEntity.builder()
                .id(execution.getId()).trainingPlanId(execution.getScheduledWorkoutId())
                .workoutTemplateRevision(execution.getWorkoutTemplateRevision())
                .workoutNameSnapshot(execution.getWorkoutNameSnapshot())
                .workoutStepsSnapshot(stepCodec.serialize(execution.getStepsSnapshot()))
                .ftpWatts(execution.getFtpWatts()).lthrBpm(execution.getLthrBpm())
                .maxHrBpm(execution.getMaxHrBpm()).restingHrBpm(execution.getRestingHrBpm())
                .startedAt(execution.getStartedAt()).finishedAt(execution.getFinishedAt())
                .status(execution.getStatus().name()).currentStepIndex(execution.getCurrentStepIndex())
                .workoutElapsedMs(execution.getWorkoutElapsedMs()).stepElapsedMs(execution.getStepElapsedMs())
                .runningSince(execution.getRunningSince()).intensityAdjustmentPct(execution.getIntensityAdjustmentPct())
                .skippedStepIndexes(asArray(execution.getSkippedStepIndexes()))
                .repeatedStepIndexes(asArray(execution.getRepeatedStepIndexes()))
                .rpe(execution.getRpe()).feeling(execution.getFeeling()).notes(execution.getNotes())
                .activityId(execution.getActivityId()).activityMatchStatus(execution.getActivityMatchStatus())
                .complianceStatus(execution.getComplianceStatus()).complianceScore(execution.getComplianceScore())
                .complianceAlgorithmVersion(execution.getComplianceAlgorithmVersion())
                .startIdempotencyKey(execution.getStartIdempotencyKey())
                .finishIdempotencyKey(execution.getFinishIdempotencyKey())
                .deliveryMethod(execution.getDeliveryMethod()).stateVersion(execution.getStateVersion())
                .createdAt(execution.getCreatedAt()).updatedAt(execution.getUpdatedAt()).build();
    }

    private List<Integer> asList(Integer[] values) {
        return values == null ? List.of() : List.copyOf(Arrays.asList(values));
    }

    private Integer[] asArray(List<Integer> values) {
        return values == null ? new Integer[0] : values.toArray(Integer[]::new);
    }
}
