package pl.strava.analizator.domain.coach.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class GoalProgressSummary {
    private final double currentValue;
    private final double targetValue;
    private final double gap;
    private final double gapPercent;
    private final double projectedDaysToTarget;
    private final TrajectoryPhase phase;
    private final double weeklyProgressRate;
    private final String status;
}
