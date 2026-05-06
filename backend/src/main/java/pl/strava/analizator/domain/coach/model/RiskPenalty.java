package pl.strava.analizator.domain.coach.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class RiskPenalty {
    private final double penaltyScore;
    private final String riskLevel;
    private final double overtrainingProbability;
    private final double failureProbability;
    private final String primaryRisk;
}
