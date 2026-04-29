package pl.strava.analizator.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class TrainingPlanProgram {
    private final UUID id;
    private final String name;
    private final ProgramGoal goal;
    private final GoalPriority goalPriority;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final LocalDate eventDate;
    private final LocalDate taperStartDate;
    private final BigDecimal targetWeeklyTss;
    private final BigDecimal targetWeeklyHours;
    private final Integer weekdayAvailabilityMinutes;
    private final Integer weekendAvailabilityMinutes;
    private final String preferredLongRideDay;
    private final String environmentPreference;
    private final String generatedBy;
    private final OffsetDateTime createdAt;
}
