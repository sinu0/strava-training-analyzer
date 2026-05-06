package pl.strava.analizator.domain.coach.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class FatigueDebt {
    private final double actualFatigue;
    private final double baselineFatigue;
    private final double debt;
    private final int recoveryDaysNeeded;
    private final String severity;
    private final boolean requiresRecovery;
}
