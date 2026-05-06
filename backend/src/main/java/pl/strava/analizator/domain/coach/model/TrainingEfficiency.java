package pl.strava.analizator.domain.coach.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class TrainingEfficiency {
    private final double efficiency;
    private final double performanceGain;
    private final double totalFatigueCost;
    private final String rating;
    private final String suggestion;
}
