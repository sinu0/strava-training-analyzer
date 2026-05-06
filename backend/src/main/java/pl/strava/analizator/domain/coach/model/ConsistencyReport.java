package pl.strava.analizator.domain.coach.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ConsistencyReport {
    private final double completionRatio;
    private final int completedSessions;
    private final int expectedSessions;
    private final double gainMultiplier;
    private final String status;
    private final String recommendation;
}
