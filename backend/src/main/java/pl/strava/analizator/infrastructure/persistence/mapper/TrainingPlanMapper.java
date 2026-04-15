package pl.strava.analizator.infrastructure.persistence.mapper;

import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.model.TrainingPlan;
import pl.strava.analizator.domain.model.TrainingPlanStatus;
import pl.strava.analizator.infrastructure.persistence.entity.TrainingPlanEntity;

@Component
public class TrainingPlanMapper {

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
                .targetPowerLowW(domain.getTargetPowerLowW())
                .targetPowerHighW(domain.getTargetPowerHighW())
                .status(domain.getStatus().name())
                .notes(domain.getNotes())
                .createdAt(domain.getCreatedAt())
                .build();
    }
}
