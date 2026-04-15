package pl.strava.analizator.infrastructure.persistence.mapper;

import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.model.ProgramGoal;
import pl.strava.analizator.domain.model.TrainingPlanProgram;
import pl.strava.analizator.infrastructure.persistence.entity.TrainingPlanProgramEntity;

@Component
public class TrainingPlanProgramMapper {

    public TrainingPlanProgram toDomain(TrainingPlanProgramEntity entity) {
        return TrainingPlanProgram.builder()
                .id(entity.getId())
                .name(entity.getName())
                .goal(ProgramGoal.valueOf(entity.getGoal()))
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .targetWeeklyTss(entity.getTargetWeeklyTss())
                .targetWeeklyHours(entity.getTargetWeeklyHours())
                .generatedBy(entity.getGeneratedBy())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public TrainingPlanProgramEntity toEntity(TrainingPlanProgram domain) {
        return TrainingPlanProgramEntity.builder()
                .id(domain.getId())
                .name(domain.getName())
                .goal(domain.getGoal().name())
                .startDate(domain.getStartDate())
                .endDate(domain.getEndDate())
                .targetWeeklyTss(domain.getTargetWeeklyTss())
                .targetWeeklyHours(domain.getTargetWeeklyHours())
                .generatedBy(domain.getGeneratedBy())
                .createdAt(domain.getCreatedAt())
                .build();
    }
}
