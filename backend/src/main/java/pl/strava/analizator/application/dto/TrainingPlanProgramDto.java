package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import pl.strava.analizator.domain.model.GoalPriority;
import pl.strava.analizator.domain.model.TrainingPlanProgram;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TrainingPlanProgramDto {
    private UUID id;
    private String name;
    private String goal;
    private String goalPriority;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate eventDate;
    private LocalDate taperStartDate;
    private List<TrainingWeekObjectiveDto> weeklyObjectives;
    private List<TrainingGoalScorecardDto> goalScorecards;
    private BigDecimal targetWeeklyTss;
    private BigDecimal targetWeeklyHours;
    private Integer weekdayAvailabilityMinutes;
    private Integer weekendAvailabilityMinutes;
    private String preferredLongRideDay;
    private String environmentPreference;
    private String generatedBy;
    private OffsetDateTime createdAt;

    public static TrainingPlanProgramDto fromDomain(TrainingPlanProgram p) {
        return new TrainingPlanProgramDto(
                p.getId(),
                p.getName(),
                p.getGoal().name(),
                p.getGoalPriority() != null ? p.getGoalPriority().name() : GoalPriority.B.name(),
                p.getStartDate(),
                p.getEndDate(),
                p.getEventDate(),
                p.getTaperStartDate(),
                List.of(),
                List.of(),
                p.getTargetWeeklyTss(),
                p.getTargetWeeklyHours(),
                p.getWeekdayAvailabilityMinutes(),
                p.getWeekendAvailabilityMinutes(),
                p.getPreferredLongRideDay(),
                p.getEnvironmentPreference(),
                p.getGeneratedBy(),
                p.getCreatedAt()
        );
    }
}
