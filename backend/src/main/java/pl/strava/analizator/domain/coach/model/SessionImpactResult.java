package pl.strava.analizator.domain.coach.model;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class SessionImpactResult {
    private final String sessionType;
    private final double goalProgressGain;
    private final double fatigueCost;
    private final double riskPenalty;
    private final double netScore;
    private final Map<String, Double> componentContributions;
}
