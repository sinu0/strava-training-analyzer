package pl.strava.analizator.infrastructure.persistence.mapper;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.WorkoutCategory;
import pl.strava.analizator.domain.model.WorkoutTemplate;
import pl.strava.analizator.infrastructure.persistence.entity.WorkoutTemplateEntity;

@Component
@RequiredArgsConstructor
public class WorkoutTemplateMapper {

    private final WorkoutStepJsonCodec workoutStepJsonCodec;

    public WorkoutTemplate toDomain(WorkoutTemplateEntity entity) {
        return WorkoutTemplate.builder()
                .id(entity.getId())
                .revisionId(entity.getCurrentRevisionId())
                .revision(entity.getCurrentRevision())
                .name(entity.getName())
                .category(WorkoutCategory.valueOf(entity.getCategory()))
                .description(entity.getDescription())
                .targetTss(entity.getTargetTss())
                .targetDurationMin(entity.getTargetDurationMin())
                .relativeEffort(entity.getRelativeEffort() != null ? entity.getRelativeEffort() : 0)
                .intensityFactor(entity.getIntensityFactor())
                .steps(workoutStepJsonCodec.deserialize(entity.getSteps()))
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public WorkoutTemplateEntity toEntity(WorkoutTemplate domain) {
        return WorkoutTemplateEntity.builder()
                .id(domain.getId())
                .currentRevisionId(domain.getRevisionId())
                .currentRevision(domain.getRevision() > 0 ? domain.getRevision() : 1)
                .name(domain.getName())
                .category(domain.getCategory().name())
                .description(domain.getDescription())
                .targetTss(domain.getTargetTss())
                .targetDurationMin(domain.getTargetDurationMin())
                .relativeEffort(domain.getRelativeEffort())
                .intensityFactor(domain.getIntensityFactor())
                .steps(workoutStepJsonCodec.serialize(domain.getSteps()))
                .createdBy(domain.getCreatedBy())
                .createdAt(domain.getCreatedAt())
                .build();
    }

}
