package pl.strava.analizator.domain.coach.model;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class Goal {
    private final GoalType goalType;
    private final String targetMetric;
    private final double targetValue;
    private final String context;
    private final LocalDate deadline;
    private final double currentValue;
    private final Double progressPerWeek;
    private final boolean isPrimary;
}
