package pl.strava.analizator.domain.coach.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class GapAnalysis {
    private final double gap;
    private final double gapPercent;
    private final double weeksToTarget;
    private final boolean realistic;
    private final String summary;
}
