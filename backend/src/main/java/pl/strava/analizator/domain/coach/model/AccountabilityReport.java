package pl.strava.analizator.domain.coach.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AccountabilityReport {
    private final AccountabilityStatus status;
    private final double actualLoad;
    private final double expectedLoad;
    private final double gap;
    private final String message;
    private final String recommendedAction;
    private final double timelineAdjustmentDays;
}
