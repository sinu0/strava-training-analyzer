package pl.strava.analizator.domain.coach.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class FatigueCost {
    private final double totalCost;
    private final double recentLoadWeight;
    private final double decayFactor;
    private final double projectedAtl;
    private final double projectedTsb;
}
