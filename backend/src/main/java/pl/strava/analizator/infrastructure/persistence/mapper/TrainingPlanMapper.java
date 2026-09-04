package pl.strava.analizator.infrastructure.persistence.mapper;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

import pl.strava.analizator.domain.model.TrainingPlan;
import pl.strava.analizator.domain.model.TrainingPlanStatus;
import pl.strava.analizator.infrastructure.persistence.entity.TrainingPlanEntity;

@Component
@RequiredArgsConstructor
public class TrainingPlanMapper {

    private final WorkoutStepJsonCodec workoutStepJsonCodec;

    public TrainingPlan toDomain(TrainingPlanEntity entity) {
        return TrainingPlan.builder()
                .id(entity.getId())
                .date(entity.getDate())
                .plannedType(entity.getPlannedType())
                .plannedTss(entity.getPlannedTss())
                .plannedDurationMin(entity.getPlannedDurationMin())
                .plannedDescription(entity.getPlannedDescription())
                .actualActivityId(entity.getActualActivityId())
                .compliancePct(entity.getCompliancePct())
                .programId(entity.getProgramId())
                .workoutTemplateId(entity.getWorkoutTemplateId())
                .workoutTemplateRevisionId(entity.getWorkoutTemplateRevisionId())
                .workoutTemplateRevision(entity.getWorkoutTemplateRevision())
                .workoutNameSnapshot(entity.getWorkoutNameSnapshot())
                .workoutStepsSnapshot(workoutStepJsonCodec.deserialize(entity.getWorkoutStepsSnapshot()))
                .ftpWatts(entity.getFtpWatts())
                .lthrBpm(entity.getLthrBpm())
                .maxHrBpm(entity.getMaxHrBpm())
                .restingHrBpm(entity.getRestingHrBpm())
                .deliveryMethod(entity.getDeliveryMethod())
                .deliveryStatus(entity.getDeliveryStatus())
                .activityMatchStatus(entity.getActivityMatchStatus())
                .targetPowerLowW(entity.getTargetPowerLowW())
                .targetPowerHighW(entity.getTargetPowerHighW())
                .status(TrainingPlanStatus.valueOf(entity.getStatus()))
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public TrainingPlanEntity toEntity(TrainingPlan domain) {
        return TrainingPlanEntity.builder()
                .id(domain.getId())
                .date(domain.getDate())
                .plannedType(domain.getPlannedType())
                .plannedTss(domain.getPlannedTss())
                .plannedDurationMin(domain.getPlannedDurationMin())
                .plannedDescription(domain.getPlannedDescription())
                .actualActivityId(domain.getActualActivityId())
                .compliancePct(domain.getCompliancePct())
                .programId(domain.getProgramId())
                .workoutTemplateId(domain.getWorkoutTemplateId())
                .workoutTemplateRevisionId(domain.getWorkoutTemplateRevisionId())
                .workoutTemplateRevision(domain.getWorkoutTemplateRevision())
                .workoutNameSnapshot(domain.getWorkoutNameSnapshot())
                .workoutStepsSnapshot(workoutStepJsonCodec.serialize(domain.getWorkoutStepsSnapshot()))
                .ftpWatts(domain.getFtpWatts())
                .lthrBpm(domain.getLthrBpm())
                .maxHrBpm(domain.getMaxHrBpm())
                .restingHrBpm(domain.getRestingHrBpm())
                .deliveryMethod(domain.getDeliveryMethod() != null ? domain.getDeliveryMethod() : "ON_DEVICE")
                .deliveryStatus(domain.getDeliveryStatus() != null ? domain.getDeliveryStatus() : "READY")
                .activityMatchStatus(domain.getActivityMatchStatus() != null ? domain.getActivityMatchStatus() : "UNMATCHED")
                .targetPowerLowW(domain.getTargetPowerLowW())
                .targetPowerHighW(domain.getTargetPowerHighW())
                .status(domain.getStatus().name())
                .notes(domain.getNotes())
                .createdAt(domain.getCreatedAt())
                .build();
    }
}
