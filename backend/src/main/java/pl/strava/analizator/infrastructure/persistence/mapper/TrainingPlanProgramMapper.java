package pl.strava.analizator.infrastructure.persistence.mapper;

import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.model.GoalPriority;
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
                .goalPriority(entity.getGoalPriority() != null ? GoalPriority.valueOf(entity.getGoalPriority()) : null)
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .eventDate(entity.getEventDate())
                .taperStartDate(entity.getTaperStartDate())
                .targetWeeklyTss(entity.getTargetWeeklyTss())
                .targetWeeklyHours(entity.getTargetWeeklyHours())
                .weekdayAvailabilityMinutes(entity.getWeekdayAvailabilityMinutes())
                .weekendAvailabilityMinutes(entity.getWeekendAvailabilityMinutes())
                .preferredLongRideDay(entity.getPreferredLongRideDay())
                .environmentPreference(entity.getEnvironmentPreference())
                .generatedBy(entity.getGeneratedBy())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public TrainingPlanProgramEntity toEntity(TrainingPlanProgram domain) {
        return TrainingPlanProgramEntity.builder()
                .id(domain.getId())
                .name(domain.getName())
                .goal(domain.getGoal().name())
                .goalPriority(domain.getGoalPriority() != null ? domain.getGoalPriority().name() : null)
                .startDate(domain.getStartDate())
                .endDate(domain.getEndDate())
                .eventDate(domain.getEventDate())
                .taperStartDate(domain.getTaperStartDate())
                .targetWeeklyTss(domain.getTargetWeeklyTss())
                .targetWeeklyHours(domain.getTargetWeeklyHours())
                .weekdayAvailabilityMinutes(domain.getWeekdayAvailabilityMinutes())
                .weekendAvailabilityMinutes(domain.getWeekendAvailabilityMinutes())
                .preferredLongRideDay(domain.getPreferredLongRideDay())
                .environmentPreference(domain.getEnvironmentPreference())
                .generatedBy(domain.getGeneratedBy())
                .createdAt(domain.getCreatedAt())
                .build();
    }
}
